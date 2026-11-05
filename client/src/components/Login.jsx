import React, { useState } from 'react';
import axios from 'axios';

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Send email and password to match backend controller
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/auth/login`, {
        email,
        password
      });

      if (response.data.success) {
        localStorage.setItem('hardware_user', JSON.stringify(response.data.user));
        onLoginSuccess(response.data.user);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
      <form onSubmit={handleLogin} className="bg-slate-900 p-8 rounded-xl shadow-xl w-96 border border-slate-800">
        <h2 className="text-2xl font-bold mb-6 text-center text-amber-500">Hardware Shop Login</h2>
        
        {error && <div className="mb-4 p-3 bg-red-500/20 border border-red-500 text-red-300 rounded text-sm">{error}</div>}

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2 text-slate-300">Email Address</label>
          <input
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@hardware.com"
            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-white focus:outline-none focus:border-amber-500"
            required
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-2 text-slate-300">Password / PIN</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••"
            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-white focus:outline-none focus:border-amber-500"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded transition duration-200 disabled:opacity-50 shadow-lg shadow-amber-600/20"
        >
          {loading ? 'Authenticating...' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}