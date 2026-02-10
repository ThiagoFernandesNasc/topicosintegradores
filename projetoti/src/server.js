const express = require('express');
const cors = require('cors');
require('dotenv').config();

const voosRoutes = require('./routes/voos.routes');
const authRoutes = require('./routes/auth.routes'); // <-- novo

const app = express();
app.use(cors());
app.use(express.json());

app.use('/voos', voosRoutes);
app.use('/auth', authRoutes); // <-- novo

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`API rodando na porta ${port}`);
});
const iaRoutes = require('./routes/ia.routes');

app.use('/ia', iaRoutes);