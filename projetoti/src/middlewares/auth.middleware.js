const jwt = require('jsonwebtoken');
const dbSpec = require('../routes/dbSpec'); // pool do sistema_voos_spec

const JWT_SECRET = process.env.JWT_SECRET || 'segredo_super_secreto';

async function autenticar(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({ error: 'Token não enviado' });
  }

  const [tipo, token] = authHeader.split(' ');

  if (tipo !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Formato de token inválido' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.usuario = { id: payload.id, perfil: payload.perfil };

    // registra log de acesso LGPD
    await dbSpec.query(
      `INSERT INTO log_acesso_dado (usuario_id, acao, entidade, detalhes)
       VALUES (?, ?, ?, ?)`,
      [payload.id, 'LISTAR_VOOS', 'VOO', JSON.stringify({ path: req.path })]
    );

    return next();
  } catch (err) {
    console.error(err);
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
}

module.exports = { autenticar };