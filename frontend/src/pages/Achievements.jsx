import React, { useState, useEffect } from 'react';
import { apiCall } from '../utils/api';
import { Plus, Edit2, Trash2, X, Trophy, CheckCircle, Calendar, ShieldCheck } from 'lucide-react';

export default function Achievements() {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    issuing_authority: ''
  });

  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const fetchAchievements = async () => {
    try {
      const data = await apiCall('/achievements');
      setAchievements(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAchievements();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({ title: '', description: '', date: '', issuing_authority: '' });
    setError('');
    setModalOpen(true);
  };

  const handleOpenEdit = (ach) => {
    setEditingId(ach.id);
    setFormData({
      title: ach.title,
      description: ach.description,
      date: ach.date,
      issuing_authority: ach.issuing_authority
    });
    setError('');
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this achievement?')) return;
    try {
      await apiCall(`/achievements/${id}`, { method: 'DELETE' });
      setAchievements(prev => prev.filter(a => a.id !== id));
      setMsg('Achievement deleted successfully');
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const { title, description, date, issuing_authority } = formData;
    if (!title.trim() || !description.trim() || !date || !issuing_authority.trim()) {
      setError('All fields are required.');
      return;
    }

    try {
      if (editingId) {
        const res = await apiCall(`/achievements/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        });
        setAchievements(prev => prev.map(a => a.id === editingId ? res : a));
        setMsg('Achievement updated successfully');
      } else {
        const res = await apiCall('/achievements', {
          method: 'POST',
          body: JSON.stringify(formData)
        });
        setAchievements(prev => [...prev, res]);
        setMsg('Achievement added successfully');
      }
      setModalOpen(false);
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      setError(err.message || 'Saving achievement failed');
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Achievements & Honors</h1>
          <p className="text-slate-400">Chronological history of awards, certifications, and academic success</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="bg-gradient-to-r from-sky-500 to-purple-600 hover:from-sky-400 hover:to-purple-500 text-white px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 shadow-lg shadow-sky-500/10 hover:shadow-sky-500/20 transition-all duration-300 self-start"
        >
          <Plus className="w-5 h-5" />
          <span>Add Achievement</span>
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
      ) : achievements.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center flex flex-col items-center">
          <Trophy className="w-16 h-16 text-slate-600 mb-4" />
          <h3 className="text-lg font-semibold text-slate-300">No Achievements Recorded</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md">Log your scholarships, dean's lists, or external award victories.</p>
        </div>
      ) : (
        /* Timeline View */
        <div className="relative pl-6 md:pl-32 border-l border-slate-800 space-y-8">
          {achievements.map((ach) => (
            <div key={ach.id} className="relative group">
              {/* Timeline Indicator Dot */}
              <div className="absolute -left-[31px] md:-left-[163px] top-1.5 flex items-center justify-center">
                <div className="hidden md:block w-24 text-right text-xs font-semibold text-slate-400 font-mono pr-4 group-hover:text-neonBlue transition-colors">
                  {ach.date}
                </div>
                <div className="w-4 h-4 rounded-full bg-slate-900 border-2 border-neonPurple group-hover:border-neonBlue group-hover:scale-125 transition-all duration-300 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-neonPurple group-hover:bg-neonBlue"></div>
                </div>
              </div>

              {/* Card Container */}
              <div className="glass-card rounded-2xl p-6 relative">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 md:hidden mb-2">
                      <Calendar className="w-3.5 h-3.5" />
                      <span className="font-mono">{ach.date}</span>
                    </div>

                    <h3 className="text-lg font-bold text-white group-hover:text-neonPurple transition-colors">
                      {ach.title}
                    </h3>
                    <p className="text-xs font-bold text-neonBlue mt-1 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Issued by: {ach.issuing_authority}</span>
                    </p>
                    <p className="text-sm text-slate-300 mt-3 leading-relaxed">
                      {ach.description}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-start">
                    <button
                      onClick={() => handleOpenEdit(ach)}
                      className="p-1.5 hover:bg-slate-700/50 rounded-lg text-slate-400 hover:text-white transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(ach.id)}
                      className="p-1.5 hover:bg-rose-500/10 rounded-lg text-slate-400 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
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
              {editingId ? 'Edit Achievement Details' : 'Add Achievement'}
            </h3>

            {error && (
              <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-lg text-sm mb-4">
                <Trophy className="w-4 h-4 transform rotate-45" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Achievement Title</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g. Dean's List Award"
                  className="w-full px-3 py-2.5 glass-input text-sm text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Issuing Authority</label>
                  <input
                    type="text"
                    name="issuing_authority"
                    value={formData.issuing_authority}
                    onChange={handleChange}
                    placeholder="e.g. Stanford University"
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

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe your achievement, requirements, select status, etc..."
                  rows="4"
                  className="w-full px-3 py-2.5 glass-input text-sm text-white resize-none"
                  required
                />
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
                  {editingId ? 'Save Changes' : 'Add Achievement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
