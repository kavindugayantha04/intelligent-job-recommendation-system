const FAQ = require('../models/FAQ');
const ErrorTrigger = require('../models/ErrorTrigger');

// ─── FAQ CRUD ────────────────────────────────────────────────────────────────

exports.getAllFAQs = async (req, res) => {
  try {
    const { category, search } = req.query;
    let query = {};
    if (category) query.category = category;
    if (search) query.$or = [
      { question: { $regex: search, $options: 'i' } },
      { keywords: { $in: [search.toLowerCase()] } }
    ];
    const faqs = await FAQ.find(query).sort({ createdAt: -1 });
    res.json({ success: true, data: faqs, count: faqs.length });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getFAQById = async (req, res) => {
  try {
    const faq = await FAQ.findById(req.params.id);
    if (!faq) return res.status(404).json({ success: false, error: 'FAQ not found' });
    res.json({ success: true, data: faq });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.createFAQ = async (req, res) => {
  try {
    const { question, answer, keywords, category } = req.body;
    if (!question || !answer) return res.status(400).json({ success: false, error: 'Question and answer are required' });
    const faq = new FAQ({ question, answer, keywords: keywords || [], category: category || 'general' });
    await faq.save();
    res.status(201).json({ success: true, data: faq, message: 'FAQ created successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.updateFAQ = async (req, res) => {
  try {
    const faq = await FAQ.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!faq) return res.status(404).json({ success: false, error: 'FAQ not found' });
    res.json({ success: true, data: faq, message: 'FAQ updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.deleteFAQ = async (req, res) => {
  try {
    const faq = await FAQ.findByIdAndDelete(req.params.id);
    if (!faq) return res.status(404).json({ success: false, error: 'FAQ not found' });
    res.json({ success: true, message: 'FAQ deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─── ERROR TRIGGERS CRUD ─────────────────────────────────────────────────────

exports.getAllErrorTriggers = async (req, res) => {
  try {
    const triggers = await ErrorTrigger.find().sort({ createdAt: -1 });
    res.json({ success: true, data: triggers });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.createErrorTrigger = async (req, res) => {
  try {
    const trigger = new ErrorTrigger(req.body);
    await trigger.save();
    res.status(201).json({ success: true, data: trigger, message: 'Error trigger created' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.updateErrorTrigger = async (req, res) => {
  try {
    const trigger = await ErrorTrigger.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!trigger) return res.status(404).json({ success: false, error: 'Trigger not found' });
    res.json({ success: true, data: trigger, message: 'Trigger updated' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.deleteErrorTrigger = async (req, res) => {
  try {
    const trigger = await ErrorTrigger.findByIdAndDelete(req.params.id);
    if (!trigger) return res.status(404).json({ success: false, error: 'Trigger not found' });
    res.json({ success: true, message: 'Trigger deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
