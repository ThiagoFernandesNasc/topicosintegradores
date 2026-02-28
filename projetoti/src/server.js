const express = require('express');
const cors = require('cors');
require('dotenv').config();

const voosRoutes = require('./routes/voos.routes');
const authRoutes = require('./routes/auth.routes'); // <-- novo
const iaRoutes = require('./routes/ia.routes');
const { openApiSpec } = require('./docs/openapi');

let swaggerUi = null;
try {
  swaggerUi = require('swagger-ui-express');
} catch (err) {
  swaggerUi = null;
}

const app = express();
app.use(cors());
app.use(express.json());

app.get('/docs.json', (_req, res) => {
  res.json(openApiSpec);
});

if (swaggerUi) {
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec, { explorer: true }));
} else {
  app.get('/docs', (_req, res) => {
    res
      .status(503)
      .json({ error: 'Swagger UI indisponivel. Instale a dependencia swagger-ui-express.' });
  });
}

app.use('/voos', voosRoutes);
app.use('/auth', authRoutes); // <-- novo
app.use('/ia', iaRoutes);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`API rodando na porta ${port}`);
});
