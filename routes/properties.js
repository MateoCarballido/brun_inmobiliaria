const express = require('express');
const propertyController = require('../controllers/propertyController');
const { requireAdmin } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/', propertyController.renderProperties);
router.get('/add', requireAdmin, propertyController.renderCreateProperty);
router.post('/add', requireAdmin, propertyController.createProperty);
router.get('/:id/edit', requireAdmin, propertyController.renderEditProperty);
router.post('/:id/edit', requireAdmin, propertyController.updateProperty);
router.post('/:id/delete', requireAdmin, propertyController.deleteProperty);
router.get('/:id', propertyController.renderPropertyDetail);
router.post('/:id/contacto', propertyController.handleInterestEmail);

module.exports = router;
