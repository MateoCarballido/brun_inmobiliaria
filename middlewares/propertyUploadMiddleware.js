const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinaryLib = require('cloudinary').v2;
const MAX_EXTRA_IMAGES = 10;
const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
const ALLOWED_IMAGE_LABEL = 'JPG, PNG, WEBP o AVIF';

const hasCloudinaryConfig = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (hasCloudinaryConfig) {
  cloudinaryLib.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

const storage = hasCloudinaryConfig
  ? new CloudinaryStorage({
      cloudinary: cloudinaryLib,
      params: async function () {
        return {
          folder: 'brun/propiedades',
          resource_type: 'image',
          allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'avif']
        };
      }
    })
  : multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: function (_req, file, cb) {
    if (ALLOWED_IMAGE_MIME_TYPES.includes(file.mimetype)) {
      return cb(null, true);
    }
    const invalidTypeError = new Error(`Solo se permiten imagenes ${ALLOWED_IMAGE_LABEL}.`);
    invalidTypeError.status = 400;
    invalidTypeError.userMessage = `Solo se permiten imagenes ${ALLOWED_IMAGE_LABEL}.`;
    return cb(invalidTypeError);
  }
});

const uploadPropertyImagesBase = upload.fields([
  { name: 'imagen_principal_file', maxCount: 1 },
  { name: 'imagenes_extra_files', maxCount: MAX_EXTRA_IMAGES }
]);

function uploadPropertyImages(req, res, next) {
  uploadPropertyImagesBase(req, res, function(err) {
    if (!err) {
      return next();
    }

    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_UNEXPECTED_FILE' && err.field === 'imagenes_extra_files') {
        err.status = 400;
        err.userMessage = `Podes subir hasta ${MAX_EXTRA_IMAGES} imagenes extra.`;
      } else if (err.code === 'LIMIT_FILE_SIZE') {
        err.status = 400;
        err.userMessage = 'Cada imagen puede pesar hasta 5MB.';
      }
    }

    return next(err);
  });
}

module.exports = {
  uploadPropertyImages,
  MAX_EXTRA_IMAGES,
  ALLOWED_IMAGE_MIME_TYPES,
  ALLOWED_IMAGE_LABEL,
  hasCloudinaryConfig
};
