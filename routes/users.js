const express = require('express');
const userController = require('../controllers/userController');

const router = express.Router();

router.get('/login', userController.renderLogin);
router.post('/login', userController.login);
router.get('/register', userController.renderRegister);
router.post('/register', userController.register);
router.post('/logout', userController.logout);

module.exports = router;
