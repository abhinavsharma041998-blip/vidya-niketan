const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Upload a file buffer (from multer's memory storage) straight to Cloudinary —
// resource_type 'auto' lets it correctly store PDFs/docs as well as images.
const uploadBufferToCloudinary = (buffer, { folder, filename }) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'auto', use_filename: true, filename_override: filename, unique_filename: true },
      (error, result) => (error ? reject(error) : resolve(result))
    );
    stream.end(buffer);
  });
};

module.exports = { cloudinary, uploadBufferToCloudinary };
