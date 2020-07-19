const express = require('express');
const router = express.Router();
const mainController = require('../controllers/main.controller')

router.get('', mainController.showMainPage);

module.exports = router;