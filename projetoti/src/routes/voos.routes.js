const express = require('express');
const router = express.Router();
const db = require('../db');
const { autenticar } = require('../middlewares/auth.middleware');

// aplica autenticação em todas as rotas deste router
router.use(autenticar);

router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT numero_voo, companhia, horario_previsto, status, preco_medio
      FROM voo
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao listar voos' });
  }
});

module.exports = router;