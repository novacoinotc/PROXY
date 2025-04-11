const express = require('express');
const cors = require('cors');
const axios = require('axios');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const API_KEY = process.env.BINANCE_API_KEY;
const API_SECRET = process.env.BINANCE_API_SECRET;

// 🟡 Endpoint general de proxy (opcional)
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
    console.error('Error en proxy:', error.message);
    res.status(error.response?.status || 500).json({
      error: 'Error al conectar con el destino',
      details: error.response?.data || error.message
    });
  }
});

// ✅ Endpoint específico para actualizar precio en Binance
app.post('/update-price', async (req, res) => {
  const { adId, price } = req.body;

  if (!API_KEY || !API_SECRET) {
    return res.status(500).json({ error: 'Faltan claves API' });
  }

  if (!adId || !price) {
    return res.status(400).json({ error: 'Faltan parámetros: adId o price' });
  }

  const timestamp = Date.now();
  const recvWindow = 5000;

  const body = {
    advNo: adId,
    price: price.toString()
  };

  const queryString = `timestamp=${timestamp}&recvWindow=${recvWindow}`;
  const signature = crypto
    .createHmac('sha256', API_SECRET)
    .update(queryString)
    .digest('hex');

  const url = `https://p2p.binance.com/sapi/v1/c2c/ads/updatePrice?${queryString}&signature=${signature}`;

  try {
    const response = await axios.post(url, body, {
      headers: {
        'X-MBX-APIKEY': API_KEY,
        'Content-Type': 'application/json'
      }
    });

    res.status(200).json({ success: true, result: response.data });
  } catch (error) {
    console.error('❌ Error al actualizar precio en Binance:', error.message);
    res.status(error.response?.status || 500).json({
      error: 'Error desde Binance',
      details: error.response?.data || error.message
    });
  }
});

// 🔁 Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor proxy escuchando en puerto ${PORT}`));
