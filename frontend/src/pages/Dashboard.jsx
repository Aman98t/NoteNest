import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const Dashboard = ({ setAuth }) => {
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState({ title: '', content: '' });
  const [editNoteId, setEditNoteId] = useState(null); // Track which note is being edited
  const navigate = useNavigate();

  const fetchNotes = async () => {
    try {
      const res = await api.get('/notes');
      setNotes(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editNoteId) {
        // Update API Call
        const res = await api.put(`/notes/${editNoteId}`, newNote);
        setNotes(notes.map(note => note._id === editNoteId ? res.data : note));
        setEditNoteId(null); // Reset edit mode
      } else {
        // Create API Call
        const res = await api.post('/notes', newNote);
        setNotes([res.data, ...notes]);
      }
      setNewNote({ title: '', content: '' }); // Clear input fields
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditClick = (note) => {
    setNewNote({ title: note.title, content: note.content });
    setEditNoteId(note._id);
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll top to form
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/notes/${id}`);
      setNotes(notes.filter(note => note._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setAuth(false);
    navigate('/login');
  };

  return (
    <div style={{ maxWidth: '600px', margin: '20px auto', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>My NoteNest</h2>
        <button onClick={handleLogout} style={{ background: '#f44336', color: 'white', padding: '8px 15px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Logout</button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '30px', padding: '15px', background: '#f9f9f9', borderRadius: '5px' }}>
        <h3>{editNoteId ? 'Edit Note' : 'Create a New Note'}</h3>
        <input type="text" placeholder="Note Title" value={newNote.title} required
          onChange={(e) => setNewNote({ ...newNote, title: e.target.value })} 
          style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} />
        
        <textarea placeholder="Note Content" value={newNote.content} required rows="4"
          onChange={(e) => setNewNote({ ...newNote, content: e.target.value })} 
          style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} />
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="submit" style={{ padding: '10px 15px', background: editNoteId ? '#ff9800' : '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', flex: 1 }}>
            {editNoteId ? 'Update Note' : 'Add Note'}
          </button>
          
          {editNoteId && (
            <button type="button" onClick={() => { setEditNoteId(null); setNewNote({ title: '', content: '' }); }} style={{ padding: '10px 15px', background: '#9e9e9e', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <div>
        {notes.length === 0 ? <p style={{ textAlign: 'center', color: '#777' }}>No notes yet. Create one!</p> : null}
        
        {notes.map(note => (
          <div key={note._id} style={{ border: '1px solid #ddd', padding: '15px', marginBottom: '15px', borderRadius: '5px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <h3 style={{ marginTop: 0 }}>{note.title}</h3>
            <p style={{ whiteSpace: 'pre-wrap', color: '#333' }}>{note.content}</p>
            
            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
              <button onClick={() => handleEditClick(note)} style={{ background: '#2196F3', color: 'white', padding: '5px 10px', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>Edit</button>
              <button onClick={() => handleDelete(note._id)} style={{ background: 'transparent', color: '#f44336', padding: '5px 10px', border: '1px solid #f44336', borderRadius: '3px', cursor: 'pointer' }}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;