const Material = require('../models/Material');
const { uploadBufferToCloudinary, cloudinary } = require('../config/cloudinary');
const crypto = require('crypto');

const getExt = (filename = '') => (filename.split('.').pop() || '').toLowerCase();

// @desc  Upload a material to one or more courses at once (Admin or Teacher — see protectStaff).
//        The file is uploaded to Cloudinary only ONCE and reused across every selected course,
//        so uploading the same syllabus to 20 courses doesn't cost 20x the storage or time.
// @route POST /api/materials
const uploadMaterial = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const { title, description, category } = req.body;

    // courses arrives as a JSON-stringified array from the frontend (multipart/form-data
    // can't carry real arrays), but also accept a single plain course id for old clients.
    let courseIds = [];
    try {
      const parsed = JSON.parse(req.body.courses || '[]');
      if (Array.isArray(parsed)) courseIds = parsed;
    } catch {
      // not JSON — fall through
    }
    if (courseIds.length === 0 && req.body.course) courseIds = [req.body.course];

    if (!title || !category || courseIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Title, category, and at least one course are required' });
    }

    // A course-restricted teacher can only upload to their own course
    if (req.staff.role === 'Teacher' && req.staff.teacherDoc.course) {
      const own = String(req.staff.teacherDoc.course._id);
      const outsideOwn = courseIds.some(c => String(c) !== own);
      if (outsideOwn) return res.status(403).json({ success: false, message: 'You can only upload materials for your assigned course' });
    }

    const result = await uploadBufferToCloudinary(req.file.buffer, {
      folder: 'vidya-niketan/materials',
      filename: req.file.originalname,
    });

    const batchId = crypto.randomUUID();
    const baseDoc = {
      title, description, category,
      fileUrl: result.secure_url,
      filePublicId: result.public_id,
      fileName: req.file.originalname,
      fileType: getExt(req.file.originalname),
      fileSizeKB: Math.round(req.file.size / 1024),
      uploadedByRole: req.staff.role,
      uploadedByName: req.staff.name,
      uploadedByTeacher: req.staff.role === 'Teacher' ? req.staff.id : undefined,
      batchId,
    };

    const created = await Material.insertMany(courseIds.map(course => ({ ...baseDoc, course })));
    const populated = await Material.find({ batchId }).populate('course', 'name');

    res.status(201).json({
      success: true,
      data: populated,
      message: courseIds.length > 1 ? `Uploaded to ${courseIds.length} courses` : 'Material uploaded',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Get all materials (Admin)
// @route GET /api/materials/admin
const getAllMaterials = async (req, res) => {
  try {
    const materials = await Material.find().populate('course', 'name').sort({ createdAt: -1 });
    res.json({ success: true, count: materials.length, data: materials });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Get materials uploaded by the logged-in teacher
// @route GET /api/materials/mine
const getMyMaterials = async (req, res) => {
  try {
    const materials = await Material.find({ uploadedByTeacher: req.teacher._id }).populate('course', 'name').sort({ createdAt: -1 });
    res.json({ success: true, count: materials.length, data: materials });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Get materials visible to the logged-in student (their course only)
// @route GET /api/materials/student
const getStudentMaterials = async (req, res) => {
  try {
    const materials = await Material.find({ course: req.student.course?._id || req.student.course })
      .populate('course', 'name').sort({ category: 1, createdAt: -1 });
    res.json({ success: true, count: materials.length, data: materials });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Delete a material (Admin can delete any; Teacher only their own)
// @route DELETE /api/materials/:id
const deleteMaterial = async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);
    if (!material) return res.status(404).json({ success: false, message: 'Material not found' });

    if (req.staff.role === 'Teacher' && String(material.uploadedByTeacher) !== String(req.staff.id)) {
      return res.status(403).json({ success: false, message: 'You can only delete materials you uploaded' });
    }

    try {
      await cloudinary.uploader.destroy(material.filePublicId, { resource_type: 'auto' });
    } catch {
      // If it's already gone from Cloudinary for some reason, don't block deleting our DB record
    }
    await material.deleteOne();
    res.json({ success: true, message: 'Material deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { uploadMaterial, getAllMaterials, getMyMaterials, getStudentMaterials, deleteMaterial };
