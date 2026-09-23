const Gallery = require('../models/Gallery');
const { uploadBufferToCloudinary, cloudinary } = require('../config/cloudinary');

// @desc  Get all gallery photos (Public) — supports ?category= and ?featured=true filters
// @route GET /api/gallery
const getGalleryPhotos = async (req, res) => {
  try {
    const { category, featured, limit } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (featured !== undefined) filter.featured = featured === 'true';

    let query = Gallery.find(filter).sort({ order: 1, createdAt: -1 });
    if (limit) query = query.limit(Number(limit));

    const photos = await query;
    res.json({ success: true, count: photos.length, data: photos });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Upload a new gallery photo (Admin)
// @route POST /api/gallery
const uploadGalleryPhoto = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No image uploaded' });
    const { title, description, category, featured, order } = req.body;
    if (!title) return res.status(400).json({ success: false, message: 'Title is required' });

    const result = await uploadBufferToCloudinary(req.file.buffer, {
      folder: 'vidya-niketan/gallery',
      filename: req.file.originalname,
    });

    const photo = await Gallery.create({
      title,
      description,
      category: category || 'Other',
      imageUrl: result.secure_url,
      imagePublicId: result.public_id,
      featured: featured === 'true' || featured === true,
      order: order ? Number(order) : 0,
      uploadedByName: req.admin?.name || 'Admin',
    });

    res.status(201).json({ success: true, data: photo, message: 'Photo uploaded' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Update a gallery photo's details (Admin) — title/description/category/featured/order.
//        A new image file is optional; if provided, the old one is replaced on Cloudinary.
// @route PUT /api/gallery/:id
const updateGalleryPhoto = async (req, res) => {
  try {
    const photo = await Gallery.findById(req.params.id);
    if (!photo) return res.status(404).json({ success: false, message: 'Photo not found' });

    const { title, description, category, featured, order } = req.body;
    if (title !== undefined) photo.title = title;
    if (description !== undefined) photo.description = description;
    if (category !== undefined) photo.category = category;
    if (featured !== undefined) photo.featured = featured === 'true' || featured === true;
    if (order !== undefined) photo.order = Number(order);

    if (req.file) {
      const result = await uploadBufferToCloudinary(req.file.buffer, {
        folder: 'vidya-niketan/gallery',
        filename: req.file.originalname,
      });
      try { await cloudinary.uploader.destroy(photo.imagePublicId, { resource_type: 'image' }); } catch { }
      photo.imageUrl = result.secure_url;
      photo.imagePublicId = result.public_id;
    }

    await photo.save();
    res.json({ success: true, data: photo, message: 'Photo updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Delete a gallery photo (Admin)
// @route DELETE /api/gallery/:id
const deleteGalleryPhoto = async (req, res) => {
  try {
    const photo = await Gallery.findById(req.params.id);
    if (!photo) return res.status(404).json({ success: false, message: 'Photo not found' });

    try {
      await cloudinary.uploader.destroy(photo.imagePublicId, { resource_type: 'image' });
    } catch {
      // If it's already gone from Cloudinary for some reason, don't block deleting our DB record
    }
    await photo.deleteOne();
    res.json({ success: true, message: 'Photo deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getGalleryPhotos, uploadGalleryPhoto, updateGalleryPhoto, deleteGalleryPhoto };
