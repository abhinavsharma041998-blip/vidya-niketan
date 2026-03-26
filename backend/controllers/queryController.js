const Query = require('../models/Query');

const getQueries = async (req, res) => {
  try {
    const { status } = req.query;
    let filter = {};
    if (status) filter.status = status;
    const queries = await Query.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, count: queries.length, data: queries });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createQuery = async (req, res) => {
  try {
    const query = await Query.create(req.body);
    res.status(201).json({ success: true, data: query, message: 'Query submitted successfully! We will contact you soon.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateQuery = async (req, res) => {
  try {
    const query = await Query.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!query) return res.status(404).json({ success: false, message: 'Query not found' });
    res.json({ success: true, data: query });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteQuery = async (req, res) => {
  try {
    await Query.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Query deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getQueries, createQuery, updateQuery, deleteQuery };
