const axios = require('axios');

const getUF = async (req, res) => {
  try {
    // API pública: https://mindicador.cl/api/uf
    const response = await axios.get('https://mindicador.cl/api/uf');

    const data = response.data;
    const ufHoy = data.serie[0].valor; // valor actual de la UF
    const fecha = data.serie[0].fecha;

    res.json({
      fecha,
      uf: ufHoy
    });
  } catch (error) {
    console.error('Error al obtener UF:', error);
    res.status(500).json({ message: 'No se pudo obtener la UF del día' });
  }
};

module.exports = { getUF };
