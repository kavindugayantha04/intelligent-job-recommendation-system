const express = require('express');
const router = express.Router();
const {
  getAllFAQs,
  createFAQ,
  updateFAQ,
  deleteFAQ,
  getFAQById,
  getAllErrorTriggers,
  createErrorTrigger,
  updateErrorTrigger,
  deleteErrorTrigger
} = require('../controllers/faqController');

// FAQ CRUD
router.get('/', getAllFAQs);
router.post('/', createFAQ);
router.put('/:id', updateFAQ);
router.delete('/:id', deleteFAQ);

// Error Triggers CRUD
router.get('/errors/triggers', getAllErrorTriggers);
router.post('/errors/triggers', createErrorTrigger);
router.put('/errors/triggers/:id', updateErrorTrigger);
router.delete('/errors/triggers/:id', deleteErrorTrigger);

router.get('/:id', getFAQById);

module.exports = router;
