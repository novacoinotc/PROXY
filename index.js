const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.post('/proxy', async (req, res) => {
  try {
    const { url, method = 'GET', headers = {}, data = {} } = req.body;

    const response = await axios({
      url,
      method,
      headers,
      data
    });

    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: 'Error al conectar con el destino',
      details: error.response?.data || error.message
    });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Servidor proxy escuchando en el puerto ${PORT}`);
});
