const express = require('express');
const { enviarMensajeContacto } = require('../controllers/contactoController');

const router = express.Router();

router.post('/contacto/enviar', enviarMensajeContacto);

module.exports = router;


