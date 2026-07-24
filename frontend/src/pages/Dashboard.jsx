import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';
import ReactMarkdown from 'react-markdown';
import { formatDistanceToNow } from 'date-fns';

// Helper function to generate consistent colors for tags based on their name
const tagColors = ['#e57373', '#f06292', '#ba68c8', '#64b5f6', '#4db6ac', '#81c784', '#ffb74d'];
const getTagColor = (tagName) => {
  let hash = 0;
  for (let i = 0; i < tagName.length; i++) {
    hash = tagName.charCodeAt(i) + ((hash << 5) - hash);
  }
  return tagColors[Math.abs(hash) % tagColors.length];
};

const Dashboard = ({ setAuth, theme, toggleTheme }) => {
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState({ title: '', content: '', tags: '', isFavorite: false });
  const [editNoteId, setEditNoteId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // New State for Heatmap, Streaks & Delete Modal
  const [heatmapData, setHeatmapData] = useState([]);
  const [streaks, setStreaks] = useState({ currentStreak: 0, longestStreak: 0 });
  const [deleteModalId, setDeleteModalId] = useState(null); 
  
  const navigate = useNavigate();

  // Fetch Data (Notes + Stats)
  const fetchData = async () => {
    try {
      const [notesRes, heatmapRes, streakRes] = await Promise.all([
        api.get('/notes'),
        api.get('/stats/heatmap'),
        api.get('/stats/streak')
      ]);
      setNotes(notesRes.data);
      
      // Format heatmap data to match react-calendar-heatmap requirements
      const formattedHeatmap = heatmapRes.data.map(item => ({
        date: item.date,
        count: item.noteCount
      }));
      setHeatmapData(formattedHeatmap);
      setStreaks(streakRes.data);
    } catch (err) {
      toast.error('Failed to fetch data');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // SEARCH functionality
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return fetchData();
    try {
      const res = await api.get(`/notes/search?q=${searchQuery}`);
      setNotes(res.data);
      toast.success('Search completed');
    } catch (err) {
      toast.error('Search failed');
    }
  };

  // CREATE / UPDATE Form Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Process tags into array of objects with names and colors
    const tagsArray = newNote.tags 
      ? newNote.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== "").map(tag => ({
          name: tag,
          color: getTagColor(tag)
        }))
      : [];
      
    const noteData = { ...newNote, tags: tagsArray };

    try {
      if (editNoteId) {
        await api.put(`/notes/${editNoteId}`, noteData);
        toast.success('Note updated successfully!');
        setEditNoteId(null);
      } else {
        await api.post('/notes', noteData);
        toast.success('Note created successfully!');
      }
      setNewNote({ title: '', content: '', tags: '', isFavorite: false });
      fetchData(); // Refresh data to update heatmap and streaks
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to save note');
    }
  };

  const handleEditClick = (note) => {
    setNewNote({ 
      title: note.title, 
      content: note.content, 
      tags: note.tags ? note.tags.map(t => t.name).join(', ') : '', 
      isFavorite: note.isFavorite || false
    });
    setEditNoteId(note._id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Custom Delete Flow
  const executeDelete = async () => {
    if (!deleteModalId) return;
    try {
      await api.delete(`/notes/${deleteModalId}`);
      setNotes(notes.filter(note => note._id !== deleteModalId));
      toast.success('Note deleted!');
      setDeleteModalId(null); // close modal
      fetchData(); // refresh heatmap
    } catch (err) {
      toast.error('Failed to delete note');
    }
  };

  const toggleFavorite = async (note) => {
    try {
      const res = await api.put(`/notes/${note._id}`, { ...note, isFavorite: !note.isFavorite });
      setNotes(notes.map(n => n._id === note._id ? res.data : n));
      toast.success(note.isFavorite ? 'Removed from favorites' : 'Added to favorites');
    } catch (err) {
      toast.error('Failed to update favorite status');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setAuth(false);
    toast.success('Logged out securely');
    navigate('/login');
  };

  // Calculate dates for heatmap (last 365 days)
  const endDate = new Date();
  const startDate = new Date();
  startDate.setFullYear(startDate.getFullYear() - 1);

  return (
    <div style={{ maxWidth: '800px', margin: '20px auto', padding: '0 15px' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '10px', borderBottom: '1px solid var(--border-color)' }}>
        <h1 style={{ color: 'var(--accent-color)', margin: 0 }}>NoteNest</h1>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <button onClick={toggleTheme} style={{ background: 'transparent', border: '1px solid var(--border-color)', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer', color: 'var(--text-primary)' }}>
            {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
          </button>
          <button onClick={handleLogout} style={{ background: 'var(--danger-color)', color: 'white', padding: '8px 15px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Logout</button>
        </div>
      </div>

      {/* ACTIVITY HEATMAP SECTION */}
      <div style={{ background: 'var(--surface-color)', padding: '20px', borderRadius: '8px', marginBottom: '30px', border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', flexWrap: 'wrap' }}>
          <h3 style={{ margin: 0 }}>Journaling Activity</h3>
          <div style={{ display: 'flex', gap: '15px' }}>
            <span style={{ background: 'var(--accent-color)', color: 'white', padding: '4px 10px', borderRadius: '20px', fontSize: '14px' }}>🔥 Current Streak: {streaks.currentStreak}</span>
            <span style={{ background: '#4CAF50', color: 'white', padding: '4px 10px', borderRadius: '20px', fontSize: '14px' }}>🏆 Longest: {streaks.longestStreak}</span>
          </div>
        </div>
        <div style={{ overflowX: 'auto', paddingBottom: '10px' }}>
          <div style={{ minWidth: '600px' }}>
            <CalendarHeatmap
              startDate={startDate}
              endDate={endDate}
              values={heatmapData}
              classForValue={(value) => {
                if (!value || value.count === 0) return 'color-empty';
                return `color-scale-${Math.min(value.count, 4)}`;
              }}
              tooltipDataAttrs={(value) => {
                const tooltipText = value && value.count 
                  ? `${value.count} notes on ${value.date}` 
                  : 'No activity';
                return { 'data-tooltip-id': 'heatmap-tooltip', 'data-tooltip-content': tooltipText };
              }}
            />
            <Tooltip id="heatmap-tooltip" />
          </div>
        </div>
      </div>

      {/* SEARCH BAR */}
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <input 
          type="text" 
          placeholder="Search notes or tags..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ flex: 1, padding: '12px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-primary)' }} 
        />
        <button type="submit" style={{ padding: '10px 20px', background: 'var(--accent-color)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Search</button>
        <button type="button" onClick={() => { setSearchQuery(''); fetchData(); }} style={{ padding: '10px 20px', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '4px', cursor: 'pointer' }}>Clear</button>
      </form>

      {/* NOTE FORM */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '30px', padding: '20px', background: 'var(--surface-color)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
        <h3 style={{ margin: '0 0 10px 0' }}>{editNoteId ? 'Edit Note' : 'Write a New Entry'}</h3>
        
        <input type="text" placeholder="Title" value={newNote.title} required
          onChange={(e) => setNewNote({ ...newNote, title: e.target.value })} 
          style={{ padding: '12px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-primary)' }} />
        
        <textarea placeholder="Write in Markdown (e.g., **bold**, *italic*, # heading)..." value={newNote.content} required rows="5"
          onChange={(e) => setNewNote({ ...newNote, content: e.target.value })} 
          style={{ padding: '12px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-primary)', fontFamily: 'monospace' }} />

        <input type="text" placeholder="Tags (comma separated, e.g., work, personal)" value={newNote.tags}
          onChange={(e) => setNewNote({ ...newNote, tags: e.target.value })} 
          style={{ padding: '12px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-primary)' }} />

        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--text-primary)' }}>
          <input type="checkbox" checked={newNote.isFavorite} 
            onChange={(e) => setNewNote({ ...newNote, isFavorite: e.target.checked })} />
          Mark as Favorite / Pin
        </label>
        
        <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
          <button type="submit" style={{ padding: '12px 15px', background: editNoteId ? '#ff9800' : 'var(--accent-color)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', flex: 1, fontWeight: 'bold' }}>
            {editNoteId ? 'Update Entry' : 'Save Entry'}
          </button>
          
          {editNoteId && (
            <button type="button" onClick={() => { setEditNoteId(null); setNewNote({ title: '', content: '', tags: '', isFavorite: false }); }} style={{ padding: '12px 15px', background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '4px', cursor: 'pointer' }}>
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* NOTES LIST */}
      <div>
        {notes.length === 0 ? (
           <div style={{ textAlign: 'center', padding: '50px 0', color: 'var(--text-secondary)' }}>
             <h2>No notes yet!</h2>
             <p>Start your journaling streak by writing your first note above.</p>
           </div>
        ) : null}
        
        {notes.map(note => (
          <div key={note._id} style={{ background: 'var(--surface-color)', border: '1px solid var(--border-color)', padding: '20px', marginBottom: '20px', borderRadius: '8px' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <h2 style={{ margin: '0 0 15px 0', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                {note.title}
                <span onClick={() => toggleFavorite(note)} style={{ cursor: 'pointer', fontSize: '24px', color: note.isFavorite ? '#ffc107' : 'var(--text-secondary)' }} title={note.isFavorite ? "Unfavorite" : "Mark as Favorite"}>
                  {note.isFavorite ? '★' : '☆'}
                </span>
              </h2>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => handleEditClick(note)} style={{ background: 'transparent', color: 'var(--accent-color)', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Edit</button>
                <button onClick={() => setDeleteModalId(note._id)} style={{ background: 'transparent', color: 'var(--danger-color)', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Delete</button>
              </div>
            </div>

            {/* Markdown Content Renderer */}
            <div style={{ color: 'var(--text-primary)', lineHeight: '1.6', marginBottom: '20px' }}>
              <ReactMarkdown>{note.content}</ReactMarkdown>
            </div>
            
            {/* Footer: Tags & Time */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', paddingTop: '15px', borderTop: '1px dashed var(--border-color)' }}>
              
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {note.tags && note.tags.map((tag, index) => (
                  <span key={index} style={{ background: tag.color || '#e0e0e0', color: 'white', padding: '4px 10px', borderRadius: '15px', fontSize: '13px', fontWeight: 'bold', textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>
                    #{tag.name}
                  </span>
                ))}
              </div>
              
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}
              </span>
            </div>

          </div>
        ))}
      </div>

      {/* CUSTOM DELETE CONFIRMATION MODAL */}
      {deleteModalId && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg-color)', padding: '30px', borderRadius: '8px', maxWidth: '400px', width: '90%', textAlign: 'center', border: '1px solid var(--border-color)', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
            <h3 style={{ color: 'var(--text-primary)', marginTop: 0 }}>Delete Note?</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '25px' }}>This action cannot be undone. Are you sure you want to delete this note permanently?</p>
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
              <button onClick={() => setDeleteModalId(null)} style={{ padding: '10px 20px', background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={executeDelete} style={{ padding: '10px 20px', background: 'var(--danger-color)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;