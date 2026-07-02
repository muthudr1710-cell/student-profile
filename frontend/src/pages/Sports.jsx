import React, { useState, useEffect } from 'react';
import { apiCall } from '../utils/api';
import { Plus, Edit2, Trash2, X, FileText, CheckCircle, Upload, Award, ExternalLink, Calendar } from 'lucide-react';

export default function Sports() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    sport_name: '',
    level: 'District',
    position_rank: '',
    date: '',
    certificate_path: ''
  });

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const fetchRecords = async () => {
    try {
      const data = await apiCall('/sports');
      setRecords(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCertificateUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setError('');

    const uploadData = new FormData();
    uploadData.append('certificate', file);

    try {
      const res = await apiCall('/sports/upload-certificate', {
        method: 'POST',
        body: uploadData
      });
      setFormData(prev => ({ ...prev, certificate_path: res.certUrl }));
      setMsg('Certificate uploaded. Submit the form to save changes.');
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      setError(err.message || 'Certificate upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({ sport_name: '', level: 'District', position_rank: '', date: '', certificate_path: '' });
    setError('');
    setModalOpen(true);
  };

  const handleOpenEdit = (rec) => {
    setEditingId(rec.id);
    setFormData({
      sport_name: rec.sport_name,
      level: rec.level,
      position_rank: rec.position_rank,
      date: rec.date,
      certificate_path: rec.certificate_path || ''
    });
    setError('');
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this sports record?')) return;
    try {
      await apiCall(`/sports/${id}`, { method: 'DELETE' });
      setRecords(prev => prev.filter(r => r.id !== id));
      setMsg('Sports record deleted successfully');
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const { sport_name, level, position_rank, date } = formData;
    if (!sport_name.trim() || !position_rank.trim() || !date) {
      setError('All fields except Certificate file are required.');
      return;
    }

    try {
      if (editingId) {
        const res = await apiCall(`/sports/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        });
        setRecords(prev => prev.map(r => r.id === editingId ? res : r));
        setMsg('Sports record updated successfully');
      } else {
        const res = await apiCall('/sports', {
          method: 'POST',
          body: JSON.stringify(formData)
        });
        setRecords(prev => [...prev, res]);
        setMsg('Sports record added successfully');
      }
      setModalOpen(false);
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      setError(err.message || 'Saving record failed');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Sports Certificates</h1>
          <p className="text-slate-400">Archive and display your athletic achievement and tournament credentials</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="bg-gradient-to-r from-sky-500 to-purple-600 hover:from-sky-400 hover:to-purple-500 text-white px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 shadow-lg shadow-sky-500/10 hover:shadow-sky-500/20 transition-all duration-300 self-start"
        >
          <Plus className="w-5 h-5" />
          <span>Add Certificate</span>
        </button>
      </div>

      {msg && (
        <div className="p-4 rounded-lg mb-6 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          <span>{msg}</span>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-12 h-12 border-4 border-neonBlue border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : records.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center flex flex-col items-center">
          <Award className="w-16 h-16 text-slate-600 mb-4" />
          <h3 className="text-lg font-semibold text-slate-300">No Sports Records Found</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md">Log athletic events and upload your certificates for district, state, or national wins.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {records.map((rec) => {
            const isPdf = rec.certificate_path && rec.certificate_path.toLowerCase().endsWith('.pdf');
            return (
              <div key={rec.id} className="glass-card rounded-2xl overflow-hidden flex flex-col justify-between">
                <div>
                  {/* Preview Area */}
                  <div className="h-44 w-full bg-slate-900 flex items-center justify-center border-b border-slate-800/40 relative">
                    {rec.certificate_path ? (
                      isPdf ? (
                        <div className="flex flex-col items-center text-rose-400 gap-2">
                          <FileText className="w-12 h-12" />
                          <span className="text-xs font-semibold text-slate-400">PDF Certificate</span>
                        </div>
                      ) : (
                        <img 
                          src={`http://localhost:5000${rec.certificate_path}`} 
                          alt="Certificate Preview"
                          className="w-full h-full object-cover"
                        />
                      )
                    ) : (
                      <div className="flex flex-col items-center text-slate-600 gap-2 p-6 text-center">
                        <Award className="w-12 h-12 text-slate-700" />
                        <span className="text-xs text-slate-500">No Certificate Uploaded</span>
                      </div>
                    )}
                    <span className={`absolute top-3 left-3 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      rec.level === 'National' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                      rec.level === 'State' ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' :
                      'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                    }`}>
                      {rec.level}
                    </span>
                  </div>

                  {/* Body details */}
                  <div className="p-5">
                    <h3 className="text-lg font-bold text-white leading-snug">{rec.sport_name}</h3>
                    <p className="text-sm font-semibold text-neonPurple mt-1 flex items-center gap-1">
                      <Award className="w-4 h-4" />
                      <span>{rec.position_rank}</span>
                    </p>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-4">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span className="font-mono">{rec.date}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="px-5 py-4 border-t border-slate-800/40 flex items-center justify-between bg-slate-900/10">
                  <div>
                    {rec.certificate_path && (
                      <a
                        href={`http://localhost:5000${rec.certificate_path}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-neonBlue hover:text-sky-300 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>View File</span>
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEdit(rec)}
                      className="p-1.5 hover:bg-slate-700/50 rounded-lg text-slate-400 hover:text-white transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(rec.id)}
                      className="p-1.5 hover:bg-rose-500/10 rounded-lg text-slate-400 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg glass-panel-heavy rounded-2xl p-6 relative">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold text-white mb-6">
              {editingId ? 'Edit Sports Record' : 'Add Sports Record'}
            </h3>

            {error && (
              <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-lg text-sm mb-4">
                <X className="w-4 h-4 transform rotate-45" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Sport Name</label>
                  <input
                    type="text"
                    name="sport_name"
                    value={formData.sport_name}
                    onChange={handleChange}
                    placeholder="e.g. Volleyball, Athletics"
                    className="w-full px-3 py-2.5 glass-input text-sm text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Level</label>
                  <select
                    name="level"
                    value={formData.level}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 glass-input text-sm text-white"
                  >
                    {['District', 'State', 'National', 'International'].map(l => (
                      <option key={l} value={l} className="bg-slate-900">{l}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Position / Rank achieved</label>
                  <input
                    type="text"
                    name="position_rank"
                    value={formData.position_rank}
                    onChange={handleChange}
                    placeholder="e.g. Winner, 1st Place"
                    className="w-full px-3 py-2.5 glass-input text-sm text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Date Awarded</label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 glass-input text-sm text-white font-mono"
                    required
                  />
                </div>
              </div>

              {/* Certificate upload */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Upload Certificate (Image / PDF)</label>
                <div className="flex items-center gap-4">
                  <label className="cursor-pointer px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-750 text-sm font-semibold rounded-lg transition-colors flex items-center gap-2">
                    <Upload className="w-4 h-4 text-neonBlue" />
                    <span>{uploading ? 'Uploading...' : 'Choose File'}</span>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleCertificateUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                  {formData.certificate_path && (
                    <span className="text-xs text-emerald-400 font-semibold truncate max-w-[200px]">
                      Certificate uploaded!
                    </span>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800/40">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-slate-700 text-slate-300 rounded-lg text-sm hover:bg-slate-800 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-sky-500 to-purple-600 hover:from-sky-400 hover:to-purple-500 text-white font-semibold rounded-lg shadow-md shadow-sky-500/10 text-sm"
                >
                  {editingId ? 'Save Changes' : 'Add Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
