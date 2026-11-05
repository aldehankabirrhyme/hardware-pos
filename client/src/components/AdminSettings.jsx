import React, { useState, useEffect } from 'react';
import { Settings, ShieldCheck, MessageSquare, CreditCard, Store, Save, CheckCircle2, Users, UserPlus, Trash2, Edit, Sun, Moon } from 'lucide-react';
import axios from 'axios';

export default function AdminSettings({ isDarkMode, setIsDarkMode }) {
  const [activeTab, setActiveTab] = useState('settings'); // 'settings' | 'users'

  // Settings State
  const [settings, setSettings] = useState({
    shopName: '',
    requireDueOtpVerify: true,
    smsGatewayApiKey: '',
    smsSenderId: '',
    bkashMerchantId: '',
    bkashAppKey: '',
  });

  // User Management State
  const [users, setUsers] = useState([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    role: 'SALESMAN',
    permissions: { canViewProfit: false, canEditStock: false },
    isActive: true
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch Settings & Users on Mount
  const fetchData = async () => {
    try {
      const [setRes, userRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/settings`),
        axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/settings/users`)
      ]);

      if (setRes.data.success && setRes.data.settings) {
        setSettings(setRes.data.settings);
      }
      if (userRes.data.success) {
        setUsers(userRes.data.users);
      }
    } catch (err) {
      console.error('Failed to load control panel data:', err);
      setErrorMessage('Could not load control panel data from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle Setting Input Changes
  const handleSettingChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Save System Settings
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const response = await axios.put(`${import.meta.env.VITE_API_BASE_URL}/api/settings`, settings);
      if (response.data.success) {
        setSuccessMessage('Settings updated successfully in database!');
      }
    } catch (err) {
      console.error('Save error:', err);
      setErrorMessage('Failed to save settings to server.');
    } finally {
      setSaving(false);
    }
  };

  // Handle User Form Submit (Create or Update)
  const handleUserSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        const res = await axios.put(`${import.meta.env.VITE_API_BASE_URL}/api/settings/users/${editingUser.id}`, userForm);
        if (res.data.success) {
          setSuccessMessage('User updated successfully!');
        }
      } else {
        const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/settings/users`, userForm);
        if (res.data.success) {
          setSuccessMessage('New user created successfully!');
        }
      }
      setShowUserModal(false);
      setEditingUser(null);
      setUserForm({ name: '', phone: '', email: '', password: '', role: 'SALESMAN', permissions: { canViewProfit: false, canEditStock: false }, isActive: true });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save user');
    }
  };

  // Delete User
  const handleDeleteUser = async (id) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      const res = await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/api/settings/users/${id}`);
      if (res.data.success) {
        setSuccessMessage('User deleted successfully.');
        fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete user');
    }
  };

  const openEditUserModal = (u) => {
    setEditingUser(u);
    setUserForm({
      name: u.name,
      phone: u.phone,
      email: u.email || '',
      password: '',
      role: u.role,
      permissions: u.permissions || { canViewProfit: false, canEditStock: false },
      isActive: u.isActive
    });
    setShowUserModal(true);
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center font-sans ${isDarkMode ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-900'}`}>
        Loading Admin Control Panel...
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-6 font-sans transition-colors duration-200 ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'}`}>
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header & Mode Sync */}
        <div className={`flex flex-col md:flex-row items-start md:items-center justify-between p-6 rounded-2xl shadow-lg border gap-4 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl">
              <Settings className="w-8 h-8" />
            </div>
            <div>
              <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Admin Control Panel</h1>
              <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Manage system configurations, security toggles, and user staff access.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Theme Toggle Button Synced with App.jsx */}
            {setIsDarkMode && (
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition shadow-sm ${isDarkMode ? 'bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700' : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'}`}
                title="Toggle Light/Dark Theme"
              >
                {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
              </button>
            )}

            {/* Nav Tabs */}
            <div className={`flex p-1 rounded-xl border ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
              <button
                onClick={() => setActiveTab('settings')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${activeTab === 'settings' ? 'bg-indigo-600 text-white' : isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
              >
                System Settings
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${activeTab === 'users' ? 'bg-indigo-600 text-white' : isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Staff & Access ({users.length})
              </button>
            </div>

            {activeTab === 'settings' && (
              <button
                onClick={handleSaveSettings}
                disabled={saving}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl font-semibold shadow-md transition disabled:opacity-50 text-xs"
              >
                <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
              </button>
            )}
          </div>
        </div>

        {successMessage && (
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-xl text-sm font-medium">
            <CheckCircle2 className="w-5 h-5" /> {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm font-medium">
            {errorMessage}
          </div>
        )}

        {/* TAB 1: SYSTEM SETTINGS */}
        {activeTab === 'settings' && (
          <form onSubmit={handleSaveSettings} className="space-y-6">
            
            {/* Shop Profile */}
            <div className={`p-6 rounded-2xl shadow-lg border space-y-4 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <h2 className={`text-lg font-bold flex items-center gap-2 border-b pb-3 ${isDarkMode ? 'text-white border-slate-800' : 'text-slate-900 border-slate-200'}`}>
                <Store className="w-5 h-5 text-indigo-400" /> Shop Profile
              </h2>
              <div>
                <label className={`block text-xs font-semibold mb-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Shop Name</label>
                <input 
                  type="text" 
                  name="shopName"
                  value={settings.shopName || ''}
                  onChange={handleSettingChange}
                  className={`w-full px-3 py-2 border rounded-lg text-sm ${isDarkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
                />
              </div>
            </div>

            {/* Security & OTP */}
            <div className={`p-6 rounded-2xl shadow-lg border space-y-4 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <h2 className={`text-lg font-bold flex items-center gap-2 border-b pb-3 ${isDarkMode ? 'text-white border-slate-800' : 'text-slate-900 border-slate-200'}`}>
                <ShieldCheck className="w-5 h-5 text-indigo-400" /> Credit (Baki) & Due Security
              </h2>
              <div className={`flex items-center justify-between p-4 rounded-xl border ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <div className="space-y-0.5">
                  <span className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Require OTP Verification for Due/Credit Sales</span>
                  <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    When enabled, any sale resulting in a customer credit balance triggers an SMS OTP verification popup.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    name="requireDueOtpVerify"
                    checked={settings.requireDueOtpVerify ?? true}
                    onChange={handleSettingChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
            </div>

            {/* SMS Gateway */}
            <div className={`p-6 rounded-2xl shadow-lg border space-y-4 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <h2 className={`text-lg font-bold flex items-center gap-2 border-b pb-3 ${isDarkMode ? 'text-white border-slate-800' : 'text-slate-900 border-slate-200'}`}>
                <MessageSquare className="w-5 h-5 text-indigo-400" /> SMS Gateway Configuration (Bangladesh)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>SMS API Key / Token</label>
                  <input 
                    type="password" 
                    name="smsGatewayApiKey"
                    value={settings.smsGatewayApiKey || ''}
                    onChange={handleSettingChange}
                    className={`w-full px-3 py-2 border rounded-lg text-sm font-mono ${isDarkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Sender ID / Masking Name</label>
                  <input 
                    type="text" 
                    name="smsSenderId"
                    value={settings.smsSenderId || ''}
                    onChange={handleSettingChange}
                    className={`w-full px-3 py-2 border rounded-lg text-sm ${isDarkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
                  />
                </div>
              </div>
            </div>

            {/* Payment Gateways */}
            <div className={`p-6 rounded-2xl shadow-lg border space-y-4 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <h2 className={`text-lg font-bold flex items-center gap-2 border-b pb-3 ${isDarkMode ? 'text-white border-slate-800' : 'text-slate-900 border-slate-200'}`}>
                <CreditCard className="w-5 h-5 text-indigo-400" /> Mobile Payment Gateways (bKash)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>bKash Merchant Number</label>
                  <input 
                    type="text" 
                    name="bkashMerchantId"
                    value={settings.bkashMerchantId || ''}
                    onChange={handleSettingChange}
                    className={`w-full px-3 py-2 border rounded-lg text-sm ${isDarkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>bKash App Key / Secret</label>
                  <input 
                    type="password" 
                    name="bkashAppKey"
                    value={settings.bkashAppKey || ''}
                    onChange={handleSettingChange}
                    className={`w-full px-3 py-2 border rounded-lg text-sm font-mono ${isDarkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
                  />
                </div>
              </div>
            </div>

          </form>
        )}

        {/* TAB 2: STAFF MANAGEMENT */}
        {activeTab === 'users' && (
          <div className={`p-6 rounded-2xl shadow-lg border space-y-6 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className={`flex justify-between items-center border-b pb-4 ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
              <div>
                <h2 className={`text-lg font-bold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  <Users className="w-5 h-5 text-indigo-400" /> System Users & Permissions
                </h2>
                <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Create cashiers, managers, and assign strict role-based access.</p>
              </div>
              <button
                onClick={() => {
                  setEditingUser(null);
                  setUserForm({ name: '', phone: '', email: '', password: '', role: 'SALESMAN', permissions: { canViewProfit: false, canEditStock: false }, isActive: true });
                  setShowUserModal(true);
                }}
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded-xl text-xs font-semibold shadow transition"
              >
                <UserPlus className="w-4 h-4" /> Add New User
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className={`text-xs uppercase border-b ${isDarkMode ? 'bg-slate-950 text-slate-400 border-slate-800' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                  <tr>
                    <th className="px-4 py-3">Name & Phone</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Permissions</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800 text-slate-300' : 'divide-slate-100 text-slate-700'}`}>
                  {users.map(u => (
                    <tr key={u.id} className={`transition ${isDarkMode ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'}`}>
                      <td className="px-4 py-3.5">
                        <p className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{u.name}</p>
                        <p className="text-xs text-slate-400 font-mono">{u.phone}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold ${u.role === 'ADMIN' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'bg-slate-800 text-slate-300'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-xs space-y-1">
                        <p>Profit View: <span className={u.permissions?.canViewProfit ? 'text-emerald-500 font-bold' : 'text-slate-400'}>{u.permissions?.canViewProfit ? 'YES' : 'NO'}</span></p>
                        <p>Stock Edit: <span className={u.permissions?.canEditStock ? 'text-emerald-500 font-bold' : 'text-slate-400'}>{u.permissions?.canEditStock ? 'YES' : 'NO'}</span></p>
                      </td>
                      <td className="px-4 py-3.5 text-xs">
                        <span className={`px-2 py-0.5 rounded font-bold ${u.isActive ? 'text-emerald-500 bg-emerald-500/10' : 'text-rose-500 bg-rose-500/10'}`}>
                          {u.isActive ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right space-x-2">
                        <button onClick={() => openEditUserModal(u)} className={`p-1.5 rounded-lg transition ${isDarkMode ? 'bg-slate-800 hover:bg-slate-700 text-indigo-400' : 'bg-slate-100 hover:bg-slate-200 text-indigo-600'}`} title="Edit User">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteUser(u.id)} className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-lg transition" title="Delete User">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* User Modal */}
        {showUserModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className={`p-6 rounded-2xl w-full max-w-md shadow-2xl border space-y-4 ${isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
              <div className="flex justify-between items-center border-b pb-3 border-slate-700/30">
                <h3 className="font-bold text-lg">{editingUser ? 'Edit System User' : 'Create New User'}</h3>
                <button onClick={() => setShowUserModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
              </div>

              <form onSubmit={handleUserSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Full Name</label>
                  <input 
                    type="text" 
                    value={userForm.name}
                    onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg text-xs border ${isDarkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'}`}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1">Phone (Login)</label>
                    <input 
                      type="text" 
                      value={userForm.phone}
                      onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                      className={`w-full px-3 py-2 rounded-lg text-xs border ${isDarkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'}`}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Email (Login)</label>
                    <input 
                      type="text" 
                      value={userForm.email}
                      onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                      className={`w-full px-3 py-2 rounded-lg text-xs border ${isDarkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'}`}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Password</label>
                    <input 
                      type="password" 
                      placeholder={editingUser ? 'Leave blank to keep' : 'Password'}
                      value={userForm.password}
                      onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                      className={`w-full px-3 py-2 rounded-lg text-xs border ${isDarkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'}`}
                      {...(!editingUser ? { required: true } : {})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1">Role</label>
                    <select 
                      value={userForm.role}
                      onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                      className={`w-full px-3 py-2 rounded-lg text-xs border ${isDarkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'}`}
                    >
                      <option value="ADMIN">ADMIN</option>
                      <option value="MANAGER">MANAGER</option>
                      <option value="SALESMAN">SALESMAN</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Account Status</label>
                    <select 
                      value={userForm.isActive ? 'true' : 'false'}
                      onChange={(e) => setUserForm({ ...userForm, isActive: e.target.value === 'true' })}
                      className={`w-full px-3 py-2 rounded-lg text-xs border ${isDarkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'}`}
                    >
                      <option value="true">Active</option>
                      <option value="false">Disabled</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-700/30">
                  <span className="text-xs font-semibold">Granular Permissions</span>
                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={userForm.permissions?.canViewProfit ?? false}
                      onChange={(e) => setUserForm({ ...userForm, permissions: { ...userForm.permissions, canViewProfit: e.target.checked } })}
                    />
                    Can View Profit & Financial Reports
                  </label>
                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={userForm.permissions?.canEditStock ?? false}
                      onChange={(e) => setUserForm({ ...userForm, permissions: { ...userForm.permissions, canEditStock: e.target.checked } })}
                    />
                    Can Add / Edit Inventory Stock
                  </label>
                </div>

                <div className="flex gap-2 pt-3">
                  <button 
                    type="button" 
                    onClick={() => setShowUserModal(false)}
                    className={`w-1/2 py-2 text-xs font-semibold rounded-xl border ${isDarkMode ? 'border-slate-700 bg-slate-800 text-slate-300' : 'border-slate-300 bg-slate-100 text-slate-700'}`}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="w-1/2 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow"
                  >
                    Save User
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}