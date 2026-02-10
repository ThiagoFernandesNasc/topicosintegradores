const express = require('express');
const router = express.Router();
const db = require('../db');
const dbSpec = require('./dbSpec');
const { autenticar } = require('../middlewares/auth.middleware');
const { calcularRiscoAtraso } = require('../services/ia.service');

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

module.exports = router;
