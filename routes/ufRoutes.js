const express = require('express');
const router = express.Router();
const { getUF } = require('../controllers/ufController');

router.get('/uf', getUF);

module.exports = router;
