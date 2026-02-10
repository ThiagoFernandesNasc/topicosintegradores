const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const dbSpec = require('./dbSpec'); // banco sistema_voos_spec
const { autenticar } = require('../middlewares/auth.middleware');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'segredo_super_secreto';

// POST /auth/register
router.post('/register', async (req, res) => {
  const { nome, email, senha, perfil } = req.body;

  if (!nome || !email || !senha) {
    return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
  }

  try {
    const [existe] = await dbSpec.query(
      'SELECT id FROM usuario WHERE email = ?',
      [email]
    );
    if (existe.length > 0) {
      return res.status(409).json({ error: 'Email já cadastrado' });
    }

    const hash = await bcrypt.hash(senha, 10);

    await dbSpec.query(
      `INSERT INTO usuario (nome, email, senha_hash, perfil)
       VALUES (?, ?, ?, ?)`,
      [nome, email, hash, perfil || 'OPERADOR']
    );

    return res.status(201).json({ message: 'Usuário cadastrado com sucesso' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao registrar usuário' });
  }
});

// POST /auth/login
router.post('/login', async (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios' });
  }

  try {
    const [rows] = await dbSpec.query(
      'SELECT id, nome, email, senha_hash, perfil FROM usuario WHERE email = ?',
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const usuario = rows[0];
    const senhaCorreta = await bcrypt.compare(senha, usuario.senha_hash);

    if (!senhaCorreta) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const token = jwt.sign(
      { id: usuario.id, perfil: usuario.perfil },
      JWT_SECRET,
      { expiresIn: '2h' }
    );

    return res.json({
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        perfil: usuario.perfil
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao fazer login' });
  }
});

// GET /auth/me
router.get('/me', autenticar, async (req, res) => {
  try {
    const [rows] = await dbSpec.query(
      'SELECT id, nome, email, perfil, criado_em FROM usuario WHERE id = ?',
      [req.usuario.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    const usuario = rows[0];
    return res.json({
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      perfil: usuario.perfil,
      criado_em: usuario.criado_em
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao buscar dados do usuário' });
  }
});

module.exports = router;
