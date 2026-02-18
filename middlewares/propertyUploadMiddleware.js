const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinaryLib = require('cloudinary').v2;

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
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
    if (allowedMimeTypes.includes(file.mimetype)) {
      return cb(null, true);
    }
    return cb(new Error('Solo se permiten imagenes JPG, PNG, WEBP o AVIF.'));
  }
});

const uploadPropertyImages = upload.fields([
  { name: 'imagen_principal_file', maxCount: 1 },
  { name: 'imagenes_extra_files', maxCount: 10 }
]);

module.exports = {
  uploadPropertyImages,
  hasCloudinaryConfig
};
