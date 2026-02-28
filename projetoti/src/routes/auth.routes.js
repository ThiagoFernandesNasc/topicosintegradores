const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const dbSpec = require('./dbSpec');
const { autenticar } = require('../middlewares/auth.middleware');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'segredo_super_secreto';
let securityTablesReady = false;

async function ensureSecurityTables() {
  if (securityTablesReady) return;
  await dbSpec.query(
    `CREATE TABLE IF NOT EXISTS usuario_seguranca (
      usuario_id INT PRIMARY KEY,
      two_factor_enabled TINYINT(1) NOT NULL DEFAULT 0,
      atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (usuario_id) REFERENCES usuario(id)
    )`
  );
  await dbSpec.query(
    `CREATE TABLE IF NOT EXISTS sessao_usuario (
      id INT AUTO_INCREMENT PRIMARY KEY,
      usuario_id INT NOT NULL,
      jti VARCHAR(80) NOT NULL,
      user_agent VARCHAR(255) NULL,
      ip VARCHAR(80) NULL,
      ativa TINYINT(1) NOT NULL DEFAULT 1,
      criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
      revogada_em DATETIME NULL,
      FOREIGN KEY (usuario_id) REFERENCES usuario(id)
    )`
  );
  await dbSpec.query(
    `CREATE TABLE IF NOT EXISTS solicitacao_lgpd (
      id INT AUTO_INCREMENT PRIMARY KEY,
      usuario_id INT NOT NULL,
      tipo VARCHAR(60) NOT NULL,
      status VARCHAR(30) NOT NULL DEFAULT 'ABERTA',
      detalhes TEXT NULL,
      criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (usuario_id) REFERENCES usuario(id)
    )`
  );
  securityTablesReady = true;
}

// POST /auth/register
router.post('/register', async (req, res) => {
  const { nome, email, senha, perfil, companhia } = req.body;

  if (!nome || !email || !senha) {
    return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
  }
  if (perfil === 'CIA' && !companhia) {
    return res.status(400).json({ error: 'Companhia é obrigatória para perfil CIA' });
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

    try {
      await dbSpec.query(
        `INSERT INTO usuario (nome, email, senha_hash, perfil, companhia)
         VALUES (?, ?, ?, ?, ?)`,
        [nome, email, hash, perfil || 'OPERADOR', companhia || null]
      );
    } catch (insertErr) {
      if (insertErr.code === 'ER_BAD_FIELD_ERROR') {
        await dbSpec.query(
          `INSERT INTO usuario (nome, email, senha_hash, perfil)
           VALUES (?, ?, ?, ?)`,
          [nome, email, hash, perfil || 'OPERADOR']
        );
      } else {
        throw insertErr;
      }
    }

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
    await ensureSecurityTables();
    let rows;
    try {
      const [result] = await dbSpec.query(
        'SELECT id, nome, email, senha_hash, perfil, companhia FROM usuario WHERE email = ?',
        [email]
      );
      rows = result;
    } catch (selectErr) {
      if (selectErr.code === 'ER_BAD_FIELD_ERROR') {
        const [result] = await dbSpec.query(
          'SELECT id, nome, email, senha_hash, perfil FROM usuario WHERE email = ?',
          [email]
        );
        rows = result.map((u) => ({ ...u, companhia: null }));
      } else {
        throw selectErr;
      }
    }

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const usuario = rows[0];
    const senhaCorreta = await bcrypt.compare(senha, usuario.senha_hash);

    if (!senhaCorreta) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const jti = crypto.randomUUID();
    const token = jwt.sign(
      { id: usuario.id, perfil: usuario.perfil, jti },
      JWT_SECRET,
      { expiresIn: '2h' }
    );

    await dbSpec.query(
      `INSERT INTO sessao_usuario (usuario_id, jti, user_agent, ip, ativa)
       VALUES (?, ?, ?, ?, 1)`,
      [usuario.id, jti, String(req.headers['user-agent'] || '').slice(0, 255), req.ip || null]
    );

    return res.json({
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        perfil: usuario.perfil,
        companhia: usuario.companhia
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
    let rows;
    try {
      const [result] = await dbSpec.query(
        'SELECT id, nome, email, perfil, companhia, criado_em FROM usuario WHERE id = ?',
        [req.usuario.id]
      );
      rows = result;
    } catch (selectErr) {
      if (selectErr.code === 'ER_BAD_FIELD_ERROR') {
        const [result] = await dbSpec.query(
          'SELECT id, nome, email, perfil, criado_em FROM usuario WHERE id = ?',
          [req.usuario.id]
        );
        rows = result.map((u) => ({ ...u, companhia: null }));
      } else {
        throw selectErr;
      }
    }
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    const usuario = rows[0];
    return res.json({
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      perfil: usuario.perfil,
      companhia: usuario.companhia,
      criado_em: usuario.criado_em
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao buscar dados do usuário' });
  }
});

// POST /auth/change-password
router.post('/change-password', autenticar, async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Senha atual e nova senha são obrigatórias' });
  }
  if (String(newPassword).length < 6) {
    return res.status(400).json({ error: 'A nova senha deve ter ao menos 6 caracteres' });
  }
  try {
    const [rows] = await dbSpec.query(
      'SELECT id, senha_hash FROM usuario WHERE id = ?',
      [req.usuario.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Usuário não encontrado' });
    const ok = await bcrypt.compare(currentPassword, rows[0].senha_hash);
    if (!ok) return res.status(401).json({ error: 'Senha atual inválida' });
    const hash = await bcrypt.hash(newPassword, 10);
    await dbSpec.query('UPDATE usuario SET senha_hash = ? WHERE id = ?', [hash, req.usuario.id]);
    return res.json({ message: 'Senha alterada com sucesso' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao alterar senha' });
  }
});

// GET /auth/2fa
router.get('/2fa', autenticar, async (req, res) => {
  try {
    await ensureSecurityTables();
    await dbSpec.query(
      `INSERT INTO usuario_seguranca (usuario_id, two_factor_enabled)
       VALUES (?, 0)
       ON DUPLICATE KEY UPDATE usuario_id = usuario_id`,
      [req.usuario.id]
    );
    const [rows] = await dbSpec.query(
      'SELECT two_factor_enabled FROM usuario_seguranca WHERE usuario_id = ?',
      [req.usuario.id]
    );
    return res.json({ enabled: !!rows?.[0]?.two_factor_enabled });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao consultar 2FA' });
  }
});

// POST /auth/2fa
router.post('/2fa', autenticar, async (req, res) => {
  const enabled = !!req.body?.enabled;
  try {
    await ensureSecurityTables();
    await dbSpec.query(
      `INSERT INTO usuario_seguranca (usuario_id, two_factor_enabled)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE two_factor_enabled = VALUES(two_factor_enabled)`,
      [req.usuario.id, enabled ? 1 : 0]
    );
    return res.json({ message: enabled ? '2FA ativado' : '2FA desativado', enabled });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao atualizar 2FA' });
  }
});

// GET /auth/sessions
router.get('/sessions', autenticar, async (req, res) => {
  try {
    await ensureSecurityTables();
    const [rows] = await dbSpec.query(
      `SELECT id, jti, user_agent, ip, ativa, criado_em, revogada_em
       FROM sessao_usuario
       WHERE usuario_id = ?
       ORDER BY criado_em DESC
       LIMIT 30`,
      [req.usuario.id]
    );
    return res.json({ items: rows || [] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao listar sessões' });
  }
});

// POST /auth/sessions/:id/revoke
router.post('/sessions/:id/revoke', autenticar, async (req, res) => {
  try {
    await ensureSecurityTables();
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'ID de sessão inválido' });
    const [result] = await dbSpec.query(
      `UPDATE sessao_usuario
       SET ativa = 0, revogada_em = NOW()
       WHERE id = ? AND usuario_id = ?`,
      [id, req.usuario.id]
    );
    if (!result?.affectedRows) return res.status(404).json({ error: 'Sessão não encontrada' });
    return res.json({ message: 'Sessão encerrada' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao encerrar sessão' });
  }
});

// POST /auth/lgpd/request
router.post('/lgpd/request', autenticar, async (req, res) => {
  const tipo = String(req.body?.tipo || '').trim().toUpperCase();
  const detalhes = String(req.body?.detalhes || '').trim();
  if (!['EXPORTACAO', 'EXCLUSAO'].includes(tipo)) {
    return res.status(400).json({ error: 'Tipo inválido. Use EXPORTACAO ou EXCLUSAO' });
  }
  try {
    await ensureSecurityTables();
    const [result] = await dbSpec.query(
      `INSERT INTO solicitacao_lgpd (usuario_id, tipo, status, detalhes)
       VALUES (?, ?, 'ABERTA', ?)`,
      [req.usuario.id, tipo, detalhes || null]
    );
    return res.status(201).json({ message: 'Solicitação LGPD registrada', id: result.insertId });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao registrar solicitação LGPD' });
  }
});

module.exports = router;
