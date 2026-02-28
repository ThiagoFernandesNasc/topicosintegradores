require('dotenv').config();

function normalizar(texto) {
  return String(texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function resumoVoos(voos) {
  const total = voos.length;
  const porStatus = { atrasado: 0, emVoo: 0, previsto: 0, cancelado: 0, concluido: 0 };
  const porCompanhia = new Map();

  voos.forEach((v) => {
    const s = normalizar(v.status);
    if (s.includes('atras')) porStatus.atrasado += 1;
    else if (s.includes('em_voo') || s.includes('em voo')) porStatus.emVoo += 1;
    else if (s.includes('cancel')) porStatus.cancelado += 1;
    else if (s.includes('conclu')) porStatus.concluido += 1;
    else porStatus.previsto += 1;
    porCompanhia.set(v.companhia, (porCompanhia.get(v.companhia) || 0) + 1);
  });

  const topCompanhias = [...porCompanhia.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([nome, qtd]) => `${nome} (${qtd})`)
    .join(', ');

  const amostra = voos
    .slice(0, 20)
    .map((v) => `${v.numero_voo} | ${v.companhia} | ${v.origem_cidade}/${v.origem_estado} -> ${v.destino_cidade}/${v.destino_estado} | ${v.status}`)
    .join('\n');

  return {
    total,
    porStatus,
    topCompanhias: topCompanhias || 'sem dados',
    amostra,
  };
}

function buildSystemPrompt({ modo = 'executivo', usuarioNome = null }) {
  const estilo = modo === 'tecnico'
    ? 'respostas detalhadas, objetivas e com estrutura técnica'
    : 'respostas curtas, claras e executivas';

  return [
    'Você é o Assistente IA do sistema SkyTrak.',
    'Responda sempre em português do Brasil.',
    `Use ${estilo}.`,
    'Responda somente com base no contexto fornecido.',
    'Se faltar dado, diga explicitamente o que falta e sugira próximo passo.',
    'Não invente números, voos ou aeroportos.',
    'Quando houver listas longas, resuma e ofereça continuidade por paginação.',
    usuarioNome ? `Nome do usuário atual: ${usuarioNome}.` : '',
  ].filter(Boolean).join(' ');
}

function buildUserPrompt({ pergunta, historico = [], voos = [] }) {
  const resumo = resumoVoos(voos);
  const hist = historico
    .slice(-8)
    .map((m) => `${m.role === 'assistant' ? 'IA' : 'USUARIO'}: ${m.content}`)
    .join('\n');

  return [
    'Contexto operacional:',
    `- Total de voos: ${resumo.total}`,
    `- Status: atrasado=${resumo.porStatus.atrasado}, em_voo=${resumo.porStatus.emVoo}, previsto=${resumo.porStatus.previsto}, cancelado=${resumo.porStatus.cancelado}, concluido=${resumo.porStatus.concluido}`,
    `- Top companhias: ${resumo.topCompanhias}`,
    '- Amostra de voos:',
    resumo.amostra || '(sem voos na amostra)',
    '',
    'Histórico recente:',
    hist || '(sem histórico)',
    '',
    `Pergunta atual do usuário: ${pergunta}`,
    '',
    'Formato de resposta desejado:',
    'Resumo:',
    'Dados principais:',
    'Ação sugerida:',
    'Próxima pergunta útil:',
  ].join('\n');
}

async function callOpenAI({ model, apiKey, systemPrompt, userPrompt }) {
  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
  });

  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`OpenAI HTTP ${resp.status}: ${txt}`);
  }

  const data = await resp.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error('OpenAI sem conteúdo de resposta');
  return content;
}

async function callGemini({ model, apiKey, systemPrompt, userPrompt }) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: {
        role: 'system',
        parts: [{ text: systemPrompt }],
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: userPrompt }],
        },
      ],
      generationConfig: {
        temperature: 0.2,
      },
    }),
  });

  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`Gemini HTTP ${resp.status}: ${txt}`);
  }

  const data = await resp.json();
  const content = data?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('\n').trim();
  if (!content) throw new Error('Gemini sem conteúdo de resposta');
  return content;
}

async function gerarRespostaLLM({ pergunta, historico = [], voos = [], modo = 'executivo', usuario = null }) {
  const provider = normalizar(process.env.LLM_PROVIDER || '');
  const systemPrompt = buildSystemPrompt({ modo, usuarioNome: usuario?.nome || null });
  const userPrompt = buildUserPrompt({ pergunta, historico, voos });

  if (provider === 'openai') {
    const apiKey = process.env.OPENAI_API_KEY;
    const model = process.env.OPENAI_MODEL || 'gpt-4.1-mini';
    if (!apiKey) throw new Error('OPENAI_API_KEY ausente');
    const resposta = await callOpenAI({ model, apiKey, systemPrompt, userPrompt });
    return { resposta, provider: 'openai', model };
  }

  if (provider === 'gemini' || provider === 'google') {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    const model = process.env.GEMINI_MODEL || 'gemini-flash-latest';
    if (!apiKey) throw new Error('GEMINI_API_KEY/GOOGLE_API_KEY ausente');
    const resposta = await callGemini({ model, apiKey, systemPrompt, userPrompt });
    return { resposta, provider: 'gemini', model };
  }

  throw new Error('LLM_PROVIDER não configurado (use "openai" ou "gemini")');
}

module.exports = { gerarRespostaLLM };
