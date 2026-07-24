const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Note = require('../models/Note');
const Activity = require('../models/Activity');

// Helper function to format date as YYYY-MM-DD (IST timezone based on current location)
const getTodayDateString = () => {
  const today = new Date();
  // Adjusting for IST (UTC+5:30) for accurate logging
  today.setHours(today.getHours() + 5);
  today.setMinutes(today.getMinutes() + 30);
  return today.toISOString().split('T')[0];
};

// Helper function to log activity
const logActivity = async (userId) => {
  const dateString = getTodayDateString();
  try {
    await Activity.findOneAndUpdate(
      { userId, date: dateString },
      { $inc: { noteCount: 1 } },
      { new: true, upsert: true }
    );
  } catch (err) {
    console.error('Error logging activity:', err);
  }
};

// GET all notes for user
router.get('/', auth, async (req, res) => {
  try {
    const notes = await Note.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(notes);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// SEARCH notes by keyword
router.get('/search', auth, async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) return res.status(400).json({ msg: 'Search query is required' });

    const notes = await Note.find({
      userId: req.user.id,
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { content: { $regex: query, $options: 'i' } },
        { "tags.name": { $regex: query, $options: 'i' } }
      ]
    }).sort({ createdAt: -1 });
    res.json(notes);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// CREATE a note & log activity
router.post('/', auth, async (req, res) => {
  try {
    const { title, content, tags, isFavorite } = req.body;
    const newNote = new Note({ title, content, tags, isFavorite, userId: req.user.id });
    const note = await newNote.save();
    
    await logActivity(req.user.id); // Track activity for streak
    
    res.json(note);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// UPDATE a note & log activity
router.put('/:id', auth, async (req, res) => {
  try {
    let note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ msg: 'Note not found' });
    if (note.userId.toString() !== req.user.id) return res.status(401).json({ msg: 'Not authorized' });

    note = await Note.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
    
    await logActivity(req.user.id); // Track activity for streak
    
    res.json(note);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// DELETE a note
router.delete('/:id', auth, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ msg: 'Note not found' });
    if (note.userId.toString() !== req.user.id) return res.status(401).json({ msg: 'Not authorized' });

    await Note.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Note removed' });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

module.exports = router;