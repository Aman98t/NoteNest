import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const Dashboard = ({ setAuth }) => {
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState({ title: '', content: '', tags: '', isFavorite: false });
  const [editNoteId, setEditNoteId] = useState(null);
  const [searchQuery, setSearchQuery] = useState(''); // Search state
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

  // SEARCH functionality
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      fetchNotes(); // Agar search khali hai toh saare notes fetch karlo
      return;
    }
    try {
      const res = await api.get(`/notes/search?q=${searchQuery}`);
      setNotes(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Tags ko comma (,) se alag karke array mein convert karna
    const tagsArray = newNote.tags 
      ? newNote.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== "") 
      : [];
      
    const noteData = { ...newNote, tags: tagsArray };

    try {
      if (editNoteId) {
        const res = await api.put(`/notes/${editNoteId}`, noteData);
        setNotes(notes.map(note => note._id === editNoteId ? res.data : note));
        setEditNoteId(null);
      } else {
        const res = await api.post('/notes', noteData);
        setNotes([res.data, ...notes]);
      }
      setNewNote({ title: '', content: '', tags: '', isFavorite: false });
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditClick = (note) => {
    setNewNote({ 
      title: note.title, 
      content: note.content, 
      tags: note.tags ? note.tags.join(', ') : '', // Array ko wapas string banaya UI ke liye
      isFavorite: note.isFavorite || false
    });
    setEditNoteId(note._id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/notes/${id}`);
      setNotes(notes.filter(note => note._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  // Quick Toggle for Favorite status on a Note
  const toggleFavorite = async (note) => {
    try {
      const res = await api.put(`/notes/${note._id}`, { ...note, isFavorite: !note.isFavorite });
      setNotes(notes.map(n => n._id === note._id ? res.data : n));
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
      
      {/* HEADER & LOGOUT */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h2>My NoteNest</h2>
        <button onClick={handleLogout} style={{ background: '#f44336', color: 'white', padding: '8px 15px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Logout</button>
      </div>

      {/* SEARCH BAR */}
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <input 
          type="text" 
          placeholder="Search notes or tags..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} 
        />
        <button type="submit" style={{ padding: '10px 15px', background: '#2196F3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Search</button>
        <button type="button" onClick={() => { setSearchQuery(''); fetchNotes(); }} style={{ padding: '10px 15px', background: '#e0e0e0', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Clear</button>
      </form>

      {/* NOTE FORM (CREATE/EDIT) */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '30px', padding: '15px', background: '#f9f9f9', borderRadius: '5px' }}>
        <h3>{editNoteId ? 'Edit Note' : 'Create a New Note'}</h3>
        
        <input type="text" placeholder="Note Title" value={newNote.title} required
          onChange={(e) => setNewNote({ ...newNote, title: e.target.value })} 
          style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} />
        
        <textarea placeholder="Note Content" value={newNote.content} required rows="4"
          onChange={(e) => setNewNote({ ...newNote, content: e.target.value })} 
          style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} />

        <input type="text" placeholder="Tags (comma separated, e.g., work, personal)" value={newNote.tags}
          onChange={(e) => setNewNote({ ...newNote, tags: e.target.value })} 
          style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} />

        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input type="checkbox" checked={newNote.isFavorite} 
            onChange={(e) => setNewNote({ ...newNote, isFavorite: e.target.checked })} />
          Mark as Favorite
        </label>
        
        <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
          <button type="submit" style={{ padding: '10px 15px', background: editNoteId ? '#ff9800' : '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', flex: 1 }}>
            {editNoteId ? 'Update Note' : 'Add Note'}
          </button>
          
          {editNoteId && (
            <button type="button" onClick={() => { setEditNoteId(null); setNewNote({ title: '', content: '', tags: '', isFavorite: false }); }} style={{ padding: '10px 15px', background: '#9e9e9e', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* NOTES LIST */}
      <div>
        {notes.length === 0 ? <p style={{ textAlign: 'center', color: '#777' }}>No notes found.</p> : null}
        
        {notes.map(note => (
          <div key={note._id} style={{ border: '1px solid #ddd', padding: '15px', marginBottom: '15px', borderRadius: '5px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', position: 'relative' }}>
            
            {/* Favorite Star Icon */}
            <span 
              onClick={() => toggleFavorite(note)}
              style={{ position: 'absolute', top: '15px', right: '15px', cursor: 'pointer', fontSize: '20px', color: note.isFavorite ? '#ffc107' : '#ccc' }}
              title={note.isFavorite ? "Unfavorite" : "Mark as Favorite"}
            >
              {note.isFavorite ? '★' : '☆'}
            </span>

            <h3 style={{ marginTop: 0, paddingRight: '25px' }}>{note.title}</h3>
            <p style={{ whiteSpace: 'pre-wrap', color: '#333' }}>{note.content}</p>
            
            {/* Tags Display */}
            {note.tags && note.tags.length > 0 && (
              <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginTop: '10px' }}>
                {note.tags.map((tag, index) => (
                  <span key={index} style={{ background: '#e0e0e0', padding: '3px 8px', borderRadius: '12px', fontSize: '12px' }}>
                    #{tag}
                  </span>
                ))}
              </div>
            )}
            
            {/* Action Buttons */}
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