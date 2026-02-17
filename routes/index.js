const express = require('express');
const homeController = require('../controllers/homeController');

const router = express.Router();

router.get('/', homeController.renderHome);
router.get('/nosotros', homeController.renderAbout);
router.get('/contacto', homeController.renderContact);
router.get('/terminos-y-condiciones', homeController.renderTerms);
router.get('/politica-de-privacidad', homeController.renderPrivacy);
router.get('/politica-de-cookies', homeController.renderCookies);
router.post('/contacto', homeController.submitContact);

module.exports = router;
