const express = require('express');
const propertyController = require('../controllers/propertyController');
const { requireAdmin, requireAuthForConsultation } = require('../middlewares/authMiddleware');
const { uploadPropertyImages } = require('../middlewares/propertyUploadMiddleware');

const router = express.Router();

router.get('/', propertyController.renderProperties);
router.get('/add', requireAdmin, propertyController.renderCreateProperty);
router.post('/add', requireAdmin, uploadPropertyImages, propertyController.createProperty);
router.get('/:id/edit', requireAdmin, propertyController.renderEditProperty);
router.post('/:id/edit', requireAdmin, uploadPropertyImages, propertyController.updateProperty);
router.post('/:id/delete', requireAdmin, propertyController.deleteProperty);
router.get('/:id', propertyController.renderPropertyDetail);
router.post('/:id/contacto', requireAuthForConsultation, propertyController.handleInterestEmail);
router.use(propertyController.handlePropertyFormError);

module.exports = router;
