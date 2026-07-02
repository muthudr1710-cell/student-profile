import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiCall } from '../utils/api';
import { User, Mail, Hash, BookOpen, Layers, Phone, Upload, Save, CheckCircle } from 'lucide-react';

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    roll_number: user?.roll_number || '',
    department: user?.department || '',
    current_semester: user?.current_semester || 1,
    contact_info: user?.contact_info || '',
    photo_url: user?.photo_url || ''
  });
  
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setMsg({ text: '', type: '' });

    const uploadData = new FormData();
    uploadData.append('photo', file);

    try {
      const res = await apiCall('/profile/upload-photo', {
        method: 'POST',
        body: uploadData
      });
      setFormData(prev => ({ ...prev, photo_url: res.photoUrl }));
      setMsg({ text: 'Photo uploaded. Save profile to apply changes.', type: 'success' });
    } catch (err) {
      setMsg({ text: err.message || 'Photo upload failed', type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg({ text: '', type: '' });

    try {
      const updatedUser = await apiCall('/profile', {
        method: 'PUT',
        body: JSON.stringify({
          ...formData,
          current_semester: parseInt(formData.current_semester) || 1
        })
      });
      updateProfile(updatedUser);
      setMsg({ text: 'Profile updated successfully!', type: 'success' });
    } catch (err) {
      setMsg({ text: err.message || 'Failed to update profile', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Student Profile</h1>
        <p className="text-slate-400">View and update your academic identity card</p>
      </div>

      {msg.text && (
        <div className={`p-4 rounded-lg mb-6 border text-sm flex items-center gap-2 ${
          msg.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
            : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
        }`}>
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span>{msg.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Photo Upload Card */}
        <div className="glass-panel rounded-2xl p-6 flex flex-col items-center justify-center">
          <div className="relative w-40 h-40 mb-6 group">
            <img
              src={formData.photo_url ? `http://localhost:5000${formData.photo_url}` : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop'}
              alt="Profile Avatar"
              className="w-full h-full rounded-full object-cover border-4 border-slate-700 group-hover:border-neonBlue transition-all duration-300"
            />
            {uploading && (
              <div className="absolute inset-0 bg-slate-900/80 rounded-full flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-neonBlue border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>
          
          <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2">
            <Upload className="w-4 h-4 text-neonBlue" />
            <span>{uploading ? 'Uploading...' : 'Change Photo'}</span>
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
              disabled={uploading}
            />
          </label>
          <p className="text-xs text-slate-500 mt-2 text-center">Supports JPG, PNG under 5MB</p>
        </div>

        {/* Profile Form Card */}
        <div className="md:col-span-2 glass-panel rounded-2xl p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Full Name</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                    <User className="w-5 h-5" />
                  </span>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 glass-input text-sm text-white"
                    placeholder="Enter your full name"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Roll Number</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                    <Hash className="w-5 h-5" />
                  </span>
                  <input
                    type="text"
                    name="roll_number"
                    value={formData.roll_number}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 glass-input text-sm text-white"
                    placeholder="e.g. CS2301"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Department</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                    <BookOpen className="w-5 h-5" />
                  </span>
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 glass-input text-sm text-white"
                    placeholder="e.g. Computer Science"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Current Semester</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                    <Layers className="w-5 h-5" />
                  </span>
                  <select
                    name="current_semester"
                    value={formData.current_semester}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 glass-input text-sm text-white"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                      <option key={sem} value={sem} className="bg-slate-900 text-white">Semester {sem}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Contact Info (Email/Phone)</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                  <Phone className="w-5 h-5" />
                </span>
                <input
                  type="text"
                  name="contact_info"
                  value={formData.contact_info}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 glass-input text-sm text-white"
                  placeholder="e.g. email@college.edu or +123456789"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-gradient-to-r from-sky-500 to-purple-600 hover:from-sky-400 hover:to-purple-500 text-white font-semibold rounded-lg shadow-md shadow-sky-500/15 hover:shadow-sky-500/25 transition-all duration-300 flex items-center gap-2 text-sm disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save Profile'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
