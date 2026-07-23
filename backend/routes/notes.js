const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Note = require('../models/Note');

// GET all notes for user (GET /api/notes)
// SEARCH notes by keyword (GET /api/notes/search?q=keyword)
router.get('/search', auth, async (req, res) => {
    try {
      const query = req.query.q;
      if (!query) {
        return res.status(400).json({ msg: 'Search query is required' });
      }
  
      const notes = await Note.find({
        userId: req.user.id,
        $or: [
          { title: { $regex: query, $options: 'i' } },      // 'i' means case-insensitive
          { content: { $regex: query, $options: 'i' } },
          { tags: { $regex: query, $options: 'i' } }        // Search in tags as well
        ]
      }).sort({ createdAt: -1 });
  
      res.json(notes);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  });

// CREATE a new note (POST /api/notes)
router.post('/', auth, async (req, res) => {
  try {
    const { title, content, tags, isFavorite } = req.body;
    const newNote = new Note({
      title, content, tags, isFavorite, userId: req.user.id
    });
    const note = await newNote.save();
    res.json(note);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// UPDATE a note (PUT /api/notes/:id)
router.put('/:id', auth, async (req, res) => {
  try {
    let note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ msg: 'Note not found' });
    
    // Ensure user owns the note
    if (note.userId.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    note = await Note.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
    res.json(note);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// DELETE a note (DELETE /api/notes/:id)
router.delete('/:id', auth, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ msg: 'Note not found' });
    
    if (note.userId.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    await Note.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Note removed' });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

module.exports = router;