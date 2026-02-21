function calcularRiscoPercent(voo, modelo = 'tradicional') {
  const status = String(voo.status || '').toLowerCase();
  let percent = 20;

  if (status.includes('cancel')) percent = 95;
  else if (status.includes('atras') || status.includes('delay')) percent = 78;
  else if (status.includes('embarque') || status.includes('boarding')) percent = 35;
  else if (status.includes('final') || status.includes('cheg')) percent = 10;
  else if (status.includes('previsto') || status.includes('scheduled')) percent = 40;

  const preco = Number(voo.preco_medio || 0);
  if (preco >= 700) percent += 8;
  else if (preco >= 500) percent += 4;

  const horario = new Date(voo.horario_previsto).getTime();
  if (!Number.isNaN(horario)) {
    const diffMin = (horario - Date.now()) / 60000;
    if (diffMin < -30) percent += 12;
    else if (diffMin < 60) percent += 6;
  }

  if (modelo === 'generativa') percent += 3;

  return Math.min(98, Math.max(5, Math.round(percent)));
}

function rotuloRisco(percent) {
  if (percent >= 85) return 'CRITICO';
  if (percent >= 70) return 'ALTO';
  if (percent >= 45) return 'MEDIO';
  return 'BAIXO';
}

function explicarRisco(voo, percent, modelo) {
  const status = String(voo.status || 'previsto');
  const horario = new Date(voo.horario_previsto).toLocaleString('pt-BR');
  if (modelo === 'generativa') {
    return `Modelo generativo sintetizou sinais do status "${status}", janela ${horario} e padrao tarifario para chegar em ${percent}%.`;
  }
  return `Modelo tradicional cruzou status "${status}", horario previsto ${horario} e preco medio para chegar em ${percent}%.`;
}

function calcularRiscoAtraso(voo, modelo = 'tradicional') {
  const percent = calcularRiscoPercent(voo, modelo);
  return {
    percent,
    label: rotuloRisco(percent),
    modelo,
    explicacao: explicarRisco(voo, percent, modelo),
  };
}

function normalizar(texto) {
  return String(texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function formatarDataHora(dt) {
  try {
    return new Date(dt).toLocaleString('pt-BR');
  } catch (e) {
    return String(dt || '-');
  }
}

function extrairNumeroVoo(texto) {
  const match = String(texto || '').toUpperCase().match(/\b([A-Z]{2}\d{3,5})\b/);
  return match ? match[1] : null;
}

function resumoStatus(voos) {
  const resumo = { total: voos.length, atrasado: 0, emVoo: 0, previsto: 0, cancelado: 0, concluido: 0 };
  voos.forEach((v) => {
    const s = normalizar(v.status);
    if (s.includes('atras')) resumo.atrasado += 1;
    else if (s.includes('em_voo') || s.includes('em voo')) resumo.emVoo += 1;
    else if (s.includes('cancel')) resumo.cancelado += 1;
    else if (s.includes('conclu')) resumo.concluido += 1;
    else resumo.previsto += 1;
  });
  return resumo;
}

function resumoAeroportos(voos) {
  const contagem = new Map();
  voos.forEach((v) => {
    const origem = `${v.origem_cidade}/${v.origem_estado}`;
    const destino = `${v.destino_cidade}/${v.destino_estado}`;
    if (origem !== '/') contagem.set(origem, (contagem.get(origem) || 0) + 1);
    if (destino !== '/') contagem.set(destino, (contagem.get(destino) || 0) + 1);
  });
  return [...contagem.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
}

function topCompanhias(voos) {
  const c = new Map();
  voos.forEach((v) => c.set(v.companhia, (c.get(v.companhia) || 0) + 1));
  return [...c.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
}

function detectarCompanhia(pergunta, voos) {
  const q = normalizar(pergunta);
  const nomes = [...new Set(voos.map((v) => String(v.companhia || '').trim()).filter(Boolean))];
  return nomes.find((nome) => q.includes(normalizar(nome))) || null;
}

function paginar(items, page = 1, limit = 10) {
  const safeLimit = Math.min(50, Math.max(3, Number(limit) || 10));
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / safeLimit));
  const safePage = Math.min(totalPages, Math.max(1, Number(page) || 1));
  const start = (safePage - 1) * safeLimit;
  const end = start + safeLimit;
  return {
    items: items.slice(start, end),
    page: safePage,
    limit: safeLimit,
    total,
    totalPages,
    hasNext: safePage < totalPages,
  };
}

function nivelConfianca(score) {
  if (score >= 0.8) return 'alta';
  if (score >= 0.5) return 'media';
  return 'baixa';
}

function montarRespostaEstruturada({ modo, resumo, dados, acao, proxima, confianca, paginacao = null }) {
  const conf = confianca[0].toUpperCase() + confianca.slice(1);
  if (modo === 'tecnico') {
    const paginaTxt = paginacao
      ? `\nPagina: ${paginacao.page}/${paginacao.totalPages} (itens por pagina: ${paginacao.limit}, total: ${paginacao.total})`
      : '';
    return [
      `Resumo: ${resumo}`,
      `Dados principais: ${dados}`,
      `Acao sugerida: ${acao}`,
      `Proxima pergunta util: ${proxima}`,
      `Confianca: ${conf}${paginaTxt}`,
    ].join('\n\n');
  }

  const paginaExec = paginacao
    ? ` | Pagina ${paginacao.page}/${paginacao.totalPages}`
    : '';
  return `Resumo: ${resumo}\nDados: ${dados}\nAcao: ${acao}\nProxima: ${proxima}\nConfianca: ${conf}${paginaExec}`;
}

function classificarIntencao(q, voos) {
  if (!q) return { intent: 'ajuda', score: 0.4 };
  if (q.includes('o que voce') || q.includes('pode responder') || q.includes('ajuda')) return { intent: 'capacidade', score: 0.95 };
  if (q.includes('site') || q.includes('dashboard') || q.includes('mapa') || q.includes('login') || q.includes('privacidade') || q.includes('lgpd')) return { intent: 'site', score: 0.9 };
  if (extrairNumeroVoo(q)) return { intent: 'voo_numero', score: 0.97 };
  if (detectarCompanhia(q, voos)) return { intent: 'companhia', score: 0.86 };
  if (q.includes('restante') || q.includes('todos os voos') || q.includes('listar voos') || q.includes('quais voos') || q.includes('mostre os voos')) return { intent: 'lista_voos', score: 0.9 };
  if (q.includes('atras')) return { intent: 'atrasos', score: 0.93 };
  if (q.includes('cancel')) return { intent: 'cancelados', score: 0.92 };
  if (q.includes('proximo') || q.includes('decol') || q.includes('partida') || q.includes('hoje')) return { intent: 'proximos', score: 0.84 };
  if (q.includes('nacional') || q.includes('internacional')) return { intent: 'escopo', score: 0.86 };
  if (q.includes('aeroporto') || q.includes('origem') || q.includes('destino')) return { intent: 'aeroportos', score: 0.82 };
  if (q.includes('resumo') || q.includes('geral') || q.includes('status') || q.includes('total')) return { intent: 'resumo', score: 0.8 };
  return { intent: 'fallback', score: 0.45 };
}

function montarPerguntaComHistorico(pergunta, historico) {
  const q = normalizar(pergunta);
  if (q.length >= 10 || !Array.isArray(historico) || !historico.length) return q;
  const ultPergunta = [...historico].reverse().find((m) => m && m.role === 'user' && m.content)?.content;
  if (!ultPergunta) return q;
  return `${normalizar(ultPergunta)} ${q}`;
}

function montarContextoSite() {
  return {
    resumo: 'Voce pode acompanhar operacao e risco de voos em tempo real.',
    dados: 'Secoes: Dashboard, Voos, Aeronaves, Relatorios e Configuracoes. No mapa: filtros por status, nacional/internacional, busca e detalhes por voo.',
    acao: 'Abra o Dashboard e use os chips de filtro para recortar o cenario operacional.',
    proxima: 'Deseja que eu explique um fluxo rapido de uso em 3 passos?',
  };
}

function responderPorIntencao({ intent, q, voos, page, limit }) {
  const statusResumo = resumoStatus(voos);

  if (intent === 'capacidade') {
    return {
      body: {
        resumo: 'Eu consigo responder perguntas operacionais e de uso do sistema.',
        dados: 'Consultas: resumo geral, atrasos, cancelados, proximos voos, voo por numero, voos por companhia, aeroportos mais movimentados e filtros do mapa.',
        acao: 'Pergunte por exemplo: "quais voos estao atrasados?" ou "status do voo LA1234".',
        proxima: 'Quer um menu de perguntas prontas?',
      },
      score: 0.95,
      topico: 'capacidade',
    };
  }

  if (intent === 'site') {
    return {
      body: montarContextoSite(),
      score: 0.9,
      topico: 'site',
    };
  }

  if (intent === 'voo_numero') {
    const numero = extrairNumeroVoo(q);
    const voo = voos.find((v) => String(v.numero_voo || '').toUpperCase() === numero);
    if (!voo) {
      return {
        body: {
          resumo: `Nao encontrei o voo ${numero}.`,
          dados: `Total de voos disponiveis para consulta: ${voos.length}.`,
          acao: 'Confirme o numero do voo (ex.: LA1234) ou pergunte por companhia.',
          proxima: 'Quer que eu liste voos por companhia?',
        },
        score: 0.78,
        topico: 'voo_numero',
      };
    }
    const risco = calcularRiscoAtraso(voo, 'generativa');
    return {
      body: {
        resumo: `Voo ${voo.numero_voo} identificado com status ${voo.status}.`,
        dados: `${voo.companhia} | ${voo.origem_cidade}/${voo.origem_estado} -> ${voo.destino_cidade}/${voo.destino_estado} | Horario: ${formatarDataHora(voo.horario_previsto)} | Risco: ${risco.percent}% (${risco.label}).`,
        acao: 'Se estiver em atraso, priorize ajuste de gate e comunicacao com passageiros.',
        proxima: 'Quer comparar com outros voos da mesma companhia?',
      },
      score: 0.98,
      topico: 'voo_numero',
    };
  }

  if (intent === 'companhia') {
    const companhia = detectarCompanhia(q, voos);
    const lista = voos.filter((v) => normalizar(v.companhia) === normalizar(companhia));
    const p = paginar(lista, page, limit);
    return {
      body: {
        resumo: `Companhia ${companhia}: ${lista.length} voos no recorte atual.`,
        dados: p.items.map((v) => `${v.numero_voo} (${v.status}) ${v.origem_cidade}->${v.destino_cidade}`).join('; ') || 'Sem voos para a pagina solicitada.',
        acao: 'Use pagina seguinte para continuar a lista ou filtre por status no mapa.',
        proxima: 'Deseja apenas os voos atrasados dessa companhia?',
      },
      score: 0.88,
      topico: 'companhia',
      paginacao: p,
    };
  }

  if (intent === 'atrasos') {
    const lista = voos.filter((v) => normalizar(v.status).includes('atras'));
    const p = paginar(lista, page, limit);
    return {
      body: {
        resumo: `Foram encontrados ${lista.length} voos atrasados.`,
        dados: p.items.length ? p.items.map((v) => `${v.numero_voo} (${v.companhia}) ${v.origem_cidade}->${v.destino_cidade}`).join('; ') : 'Nenhum atraso nesta pagina.',
        acao: lista.length ? 'Priorize os voos com horario mais proximo e comunique equipes de solo.' : 'Monitoramento estavel no momento.',
        proxima: 'Quer a lista de cancelados ou os proximos voos?',
      },
      score: 0.94,
      topico: 'atrasos',
      paginacao: p,
    };
  }

  if (intent === 'cancelados') {
    const lista = voos.filter((v) => normalizar(v.status).includes('cancel'));
    const p = paginar(lista, page, limit);
    return {
      body: {
        resumo: `Foram encontrados ${lista.length} voos cancelados.`,
        dados: p.items.length ? p.items.map((v) => `${v.numero_voo} (${v.companhia}) ${v.origem_cidade}->${v.destino_cidade}`).join('; ') : 'Nenhum cancelamento nesta pagina.',
        acao: lista.length ? 'Acione remarcacao e comunicacao para minimizar impacto operacional.' : 'Nenhuma acao critica de cancelamento no recorte atual.',
        proxima: 'Deseja ver os voos atrasados para cruzar risco?',
      },
      score: 0.93,
      topico: 'cancelados',
      paginacao: p,
    };
  }

  if (intent === 'proximos') {
    const agora = Date.now();
    const futuros = voos
      .map((v) => ({ ...v, ts: new Date(v.horario_previsto).getTime() }))
      .filter((v) => Number.isFinite(v.ts) && v.ts >= agora)
      .sort((a, b) => a.ts - b.ts);
    const p = paginar(futuros, page, limit);
    return {
      body: {
        resumo: `Ha ${futuros.length} voos futuros no recorte atual.`,
        dados: p.items.length ? p.items.map((v) => `${v.numero_voo} ${v.origem_cidade}->${v.destino_cidade} (${formatarDataHora(v.horario_previsto)})`).join('; ') : 'Nenhum voo futuro nesta pagina.',
        acao: 'Use essa fila para priorizar alocacao de gate e equipe.',
        proxima: 'Quer que eu filtre apenas uma companhia?',
      },
      score: 0.86,
      topico: 'proximos',
      paginacao: p,
    };
  }

  if (intent === 'escopo') {
    const nacionais = voos.filter((v) => normalizar(v.origem_estado) && normalizar(v.destino_estado));
    const internacionais = Math.max(0, voos.length - nacionais.length);
    return {
      body: {
        resumo: `Distribuicao nacional/internacional calculada para ${voos.length} voos.`,
        dados: `Nacionais: ${nacionais.length} | Internacionais: ${internacionais}.`,
        acao: 'Use os chips Nacional/Internacional no mapa para focar a operacao.',
        proxima: 'Quer ver atrasos separados por esse recorte?',
      },
      score: 0.85,
      topico: 'escopo',
    };
  }

  if (intent === 'aeroportos') {
    const top = resumoAeroportos(voos);
    return {
      body: {
        resumo: 'Ranking de aeroportos por volume de origem/destino no recorte.',
        dados: top.length ? top.map(([a, n]) => `${a} (${n})`).join(', ') : 'Sem dados suficientes.',
        acao: 'Foque nos aeroportos lideres para planejar capacidade e contingencia.',
        proxima: 'Quer os voos de um aeroporto especifico?',
      },
      score: 0.83,
      topico: 'aeroportos',
    };
  }

  if (intent === 'lista_voos') {
    const ordenados = [...voos]
      .map((v) => ({ ...v, ts: new Date(v.horario_previsto).getTime() }))
      .sort((a, b) => (Number.isFinite(a.ts) ? a.ts : 0) - (Number.isFinite(b.ts) ? b.ts : 0));
    const p = paginar(ordenados, page, limit);
    return {
      body: {
        resumo: `Listagem de voos (${p.total} no total).`,
        dados: p.items.map((v) => `${v.numero_voo} (${v.companhia}) ${v.origem_cidade}->${v.destino_cidade} [${v.status}]`).join('; '),
        acao: p.hasNext ? 'Use a proxima pagina para continuar a listagem.' : 'Fim da listagem para o recorte atual.',
        proxima: 'Deseja que eu filtre por atrasados ou por companhia?',
      },
      score: 0.91,
      topico: 'lista_voos',
      paginacao: p,
    };
  }

  const tops = topCompanhias(voos);
  const topTxt = tops.length ? tops.map(([c, n]) => `${c} (${n})`).join(', ') : 'sem dados';
  return {
    body: {
      resumo: `Resumo operacional de ${statusResumo.total} voos.`,
      dados: `${statusResumo.emVoo} em voo, ${statusResumo.previsto} previstos, ${statusResumo.atrasado} atrasados, ${statusResumo.cancelado} cancelados, ${statusResumo.concluido} concluidos. Top companhias: ${topTxt}.`,
      acao: 'Se quiser, eu detalho por companhia, atraso, cancelamento ou aeroporto.',
      proxima: 'Deseja listar voos atrasados agora?',
    },
    score: 0.55,
    topico: intent === 'resumo' ? 'resumo' : 'fallback',
  };
}

function gerarRespostaAssistente({ pergunta, voos = [], historico = [], usuario = null, modo = 'executivo', page = 1, limit = 10 }) {
  if (!Array.isArray(voos) || voos.length === 0) {
    const body = {
      resumo: 'Sem voos disponiveis para analise no momento.',
      dados: 'Nao encontrei registros no banco/contexto atual.',
      acao: 'Verifique carga de dados de voos ou tente novamente em instantes.',
      proxima: 'Quer ajuda para navegar no site enquanto os dados carregam?',
    };
    return {
      resposta: montarRespostaEstruturada({ modo, ...body, confianca: 'baixa' }),
      topico: 'sem_dados',
      confianca: 'baixa',
      sugestoes: ['quais recursos do site existem?', 'como filtrar no mapa?'],
      paginacao: null,
    };
  }

  const q = montarPerguntaComHistorico(pergunta, historico);
  const { intent, score } = classificarIntencao(q, voos);
  const handled = responderPorIntencao({ intent, q, voos, page, limit });
  const confianca = nivelConfianca(handled.score ?? score);

  const saudacao = usuario?.nome && (intent === 'capacidade' || intent === 'site') ? `${usuario.nome}, ` : '';
  const resposta = montarRespostaEstruturada({
    modo: modo === 'tecnico' ? 'tecnico' : 'executivo',
    resumo: `${saudacao}${handled.body.resumo}`,
    dados: handled.body.dados,
    acao: handled.body.acao,
    proxima: handled.body.proxima,
    confianca,
    paginacao: handled.paginacao || null,
  });

  const sugestoesBase = {
    capacidade: ['resumo de voos', 'quais voos estao atrasados?', 'status do voo LA1234'],
    site: ['como filtrar nacionais?', 'onde vejo riscos?', 'como usar relatorios?'],
    lista_voos: ['proxima pagina', 'somente atrasados', 'filtrar por companhia'],
    atrasos: ['proxima pagina de atrasos', 'voos cancelados', 'atrasos por companhia'],
    cancelados: ['proxima pagina de cancelados', 'voos atrasados', 'resumo geral'],
    companhia: ['proxima pagina da companhia', 'somente atrasados da companhia', 'resumo geral'],
    fallback: ['resumo de voos', 'listar voos', 'aeroportos mais movimentados'],
  };

  return {
    resposta,
    topico: handled.topico,
    confianca,
    sugestoes: sugestoesBase[handled.topico] || sugestoesBase.fallback,
    paginacao: handled.paginacao || null,
  };
}

module.exports = { calcularRiscoAtraso, gerarRespostaAssistente };
