import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const Login = ({ setAuth }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isLogin) {
        // Login API Call
        const res = await api.post('/auth/login', { email: formData.email, password: formData.password });
        localStorage.setItem('token', res.data.token);
        setAuth(true);
        navigate('/');
      } else {
        // Register API Call
        await api.post('/auth/register', formData);
        alert('Registration successful! Please login.');
        setIsLogin(true);
      }
    } catch (err) {
      alert(err.response?.data?.msg || 'Something went wrong');
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', textAlign: 'center' }}>
      <h2>{isLogin ? 'Login to NoteNest' : 'Create an Account'}</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {!isLogin && (
          <input type="text" placeholder="Name" required 
            onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
        )}
        <input type="email" placeholder="Email" required 
          onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
        <input type="password" placeholder="Password" required 
          onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
        <button type="submit">{isLogin ? 'Login' : 'Register'}</button>
      </form>
      <p style={{ cursor: 'pointer', color: 'blue', marginTop: '10px' }} onClick={() => setIsLogin(!isLogin)}>
        {isLogin ? 'New here? Register instead' : 'Already have an account? Login'}
      </p>
    </div>
  );
};

export default Login;