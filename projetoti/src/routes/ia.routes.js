const express = require('express');
const router = express.Router();
const db = require('../db');
const dbSpec = require('./dbSpec');
const { autenticar } = require('../middlewares/auth.middleware');
const { calcularRiscoAtraso, gerarRespostaAssistente } = require('../services/ia.service');
const { gerarRespostaLLM } = require('../services/llm.service');

router.use(autenticar);

// GET /ia/risco-atraso/:numero_voo?modelo=tradicional|generativa
router.get('/risco-atraso/:numero_voo', async (req, res) => {
  const { numero_voo } = req.params;
  const modelo = req.query.modelo === 'generativa' ? 'generativa' : 'tradicional';

  try {
    const [rows] = await db.query(
      'SELECT numero_voo, companhia, horario_previsto, status, preco_medio FROM voo WHERE numero_voo = ?',
      [numero_voo]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Voo não encontrado' });
    }

    const voo = rows[0];
    const risco = calcularRiscoAtraso(voo, modelo);

    try {
      await dbSpec.query(
        `INSERT INTO log_acesso_dado
          (usuario_id, acao, entidade, detalhes)
         VALUES (?, ?, ?, ?)`,
        [
          req.usuario.id,
          'CONSULTAR_RISCO',
          'VOO',
          JSON.stringify({
            numero_voo: voo.numero_voo,
            modelo: modelo,
            percent: risco.percent,
            label: risco.label,
          })
        ]
      );
    } catch (err) {
      console.error('Falha ao registrar log no SPEC:', err);
    }

    return res.json({ numero_voo: voo.numero_voo, risco });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao calcular risco' });
  }
});

// POST /ia/chat
// body: { pergunta: string, historico?: Array<{ role: 'user'|'assistant', content: string }> }
router.post('/chat', async (req, res) => {
  const pergunta = String(req.body?.pergunta || '').trim();
  const historico = Array.isArray(req.body?.historico) ? req.body.historico : [];
  const voosContexto = Array.isArray(req.body?.voosContexto) ? req.body.voosContexto : [];
  const modo = req.body?.modo === 'tecnico' ? 'tecnico' : 'executivo';
  const page = Number(req.body?.page || 1);
  const limit = Number(req.body?.limit || 10);
  const usarLLM = req.body?.usarLLM !== false;
  if (!pergunta) return res.status(400).json({ error: 'Pergunta obrigatoria' });

  try {
    const [voos] = await db.query(
      `SELECT
        v.numero_voo,
        v.companhia,
        v.horario_previsto,
        v.status,
        v.preco_medio,
        ao.cidade AS origem_cidade,
        ao.estado AS origem_estado,
        ad.cidade AS destino_cidade,
        ad.estado AS destino_estado
      FROM voo v
      JOIN aeroporto ao ON ao.id = v.origem_id
      JOIN aeroporto ad ON ad.id = v.destino_id
      ORDER BY v.horario_previsto DESC
      LIMIT 250`
    );

    const normalizadosContexto = voosContexto
      .map((v) => ({
        numero_voo: String(v?.numero_voo || '').trim(),
        companhia: String(v?.companhia || '').trim(),
        horario_previsto: v?.horario_previsto || null,
        status: String(v?.status || '').trim(),
        preco_medio: Number(v?.preco_medio || 0),
        origem_cidade: String(v?.origem_cidade || '').trim(),
        origem_estado: String(v?.origem_estado || '').trim(),
        destino_cidade: String(v?.destino_cidade || '').trim(),
        destino_estado: String(v?.destino_estado || '').trim(),
      }))
      .filter((v) => v.numero_voo);

    const mergedMap = new Map();
    [...(voos || []), ...normalizadosContexto].forEach((v) => {
      const key = String(v.numero_voo || '').toUpperCase();
      if (!key) return;
      if (!mergedMap.has(key)) mergedMap.set(key, v);
    });
    const voosUnificados = [...mergedMap.values()];

    let resposta;
    let source = 'rules';
    let provider = null;
    let model = null;

    if (usarLLM) {
      try {
        const llm = await gerarRespostaLLM({
          pergunta,
          historico,
          voos: voosUnificados,
          modo,
          usuario: req.usuario || null,
        });
        resposta = {
          resposta: llm.resposta,
          topico: 'llm',
          confianca: 'alta',
          sugestoes: [],
          paginacao: null,
        };
        source = 'llm';
        provider = llm.provider;
        model = llm.model;
      } catch (llmErr) {
        console.error('LLM indisponivel, usando fallback:', llmErr.message);
      }
    }

    if (!resposta) {
      resposta = gerarRespostaAssistente({
        pergunta,
        voos: voosUnificados,
        historico,
        usuario: req.usuario || null,
        modo,
        page,
        limit,
      });
      source = 'rules';
    }

    try {
      await dbSpec.query(
        `INSERT INTO log_acesso_dado
          (usuario_id, acao, entidade, detalhes)
         VALUES (?, ?, ?, ?)`,
        [
          req.usuario.id,
          'CHAT_IA',
          'ASSISTENTE',
          JSON.stringify({
            pergunta,
            topico: resposta.topico,
            confianca: resposta.confianca,
            source,
            provider,
            model,
            totalVoosAvaliados: voosUnificados.length,
            page,
            limit,
          }),
        ]
      );
    } catch (err) {
      console.error('Falha ao registrar log de chat no SPEC:', err);
    }

    return res.json({
      pergunta,
      resposta: resposta.resposta,
      topico: resposta.topico,
      confianca: resposta.confianca,
      sugestoes: resposta.sugestoes || [],
      paginacao: resposta.paginacao || null,
      source,
      provider,
      model,
      totalVoosAvaliados: voosUnificados.length,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao responder chat IA' });
  }
});

module.exports = router;
