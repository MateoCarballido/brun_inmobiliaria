const express = require('express');
const homeController = require('../controllers/homeController');
const { requireAuthForConsultation } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/', homeController.renderHome);
router.get('/robots.txt', homeController.renderRobots);
router.get('/sitemap.xml', homeController.renderSitemap);
router.get('/nosotros', homeController.renderAbout);
router.get('/contacto', homeController.renderContact);
router.get('/terminos-y-condiciones', homeController.renderTerms);
router.get('/politica-de-privacidad', homeController.renderPrivacy);
router.get('/politica-de-cookies', homeController.renderCookies);
router.post('/contacto', requireAuthForConsultation, homeController.submitContact);

module.exports = router;
