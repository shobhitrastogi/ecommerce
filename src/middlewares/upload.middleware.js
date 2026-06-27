// src/middlewares/upload.middleware.js  (updated)
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

class UploadMiddleware {
  constructor() {
    this.storage = new CloudinaryStorage({
      cloudinary,
      params: async (req, file) => ({
        folder: 'ecommerce',         // folder name in Cloudinary
        format: 'webp',              // auto-convert to WebP
        transformation: [{ width: 800, crop: 'limit' }], // auto-resize
        public_id: `${Date.now()}-${Math.random()}`,
      }),
    });
  }

  single(fieldName) {
    return multer({ storage: this.storage }).single(fieldName);
  }

  array(fieldName, maxCount = 5) {
    return multer({ storage: this.storage }).array(fieldName, maxCount);
  }
}

module.exports = new UploadMiddleware();