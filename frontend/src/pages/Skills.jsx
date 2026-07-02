import React, { useState, useEffect } from 'react';
import { apiCall } from '../utils/api';
import { Plus, Edit2, Trash2, X, Cpu, Star, CheckCircle } from 'lucide-react';

export function getProficiencyLabel(rating) {
  if (rating <= 2) return 'Beginner';
  if (rating <= 4) return 'Intermediate';
  return 'Advanced';
}

export default function Skills() {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    skill_name: '',
    category: 'Technical',
    rating: 3
  });

  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const fetchSkills = async () => {
    try {
      const data = await apiCall('/skills');
      setSkills(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSkills();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({ skill_name: '', category: 'Technical', rating: 3 });
    setError('');
    setModalOpen(true);
  };

  const handleOpenEdit = (sk) => {
    setEditingId(sk.id);
    setFormData({
      skill_name: sk.skill_name,
      category: sk.category,
      rating: sk.rating
    });
    setError('');
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this skill?')) return;
    try {
      await apiCall(`/skills/${id}`, { method: 'DELETE' });
      setSkills(prev => prev.filter(s => s.id !== id));
      setMsg('Skill deleted successfully');
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const { skill_name, rating } = formData;
    if (!skill_name.trim() || rating === undefined) {
      setError('Skill Name and Proficiency Rating are required.');
      return;
    }

    try {
      if (editingId) {
        const res = await apiCall(`/skills/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify({ ...formData, rating: parseInt(rating) })
        });
        setSkills(prev => prev.map(s => s.id === editingId ? res : s));
        setMsg('Skill updated successfully');
      } else {
        const res = await apiCall('/skills', {
          method: 'POST',
          body: JSON.stringify({ ...formData, rating: parseInt(rating) })
        });
        setSkills(prev => [...prev, res]);
        setMsg('Skill added successfully');
      }
      setModalOpen(false);
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      setError(err.message || 'Saving skill failed');
    }
  };

  // Group skills by category
  const categoriesGroup = {};
  skills.forEach(s => {
    if (!categoriesGroup[s.category]) {
      categoriesGroup[s.category] = [];
    }
    categoriesGroup[s.category].push(s);
  });

  const availableCategories = ['Technical', 'Soft Skills', 'Tools & Frameworks', 'Others'];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Skills & Endorsements</h1>
          <p className="text-slate-400">Manage your technical competencies, frameworks, and interpersonal soft skills</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="bg-gradient-to-r from-sky-500 to-purple-600 hover:from-sky-400 hover:to-purple-500 text-white px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 shadow-lg shadow-sky-500/10 hover:shadow-sky-500/20 transition-all duration-300 self-start"
        >
          <Plus className="w-5 h-5" />
          <span>Add Skill</span>
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
      ) : skills.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center flex flex-col items-center">
          <Cpu className="w-16 h-16 text-slate-600 mb-4" />
          <h3 className="text-lg font-semibold text-slate-300">No Skills Cataloged</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md">Highlight your skillset by choosing categories and levels.</p>
        </div>
      ) : (
        /* Grouped Category view */
        <div className="space-y-8">
          {Object.keys(categoriesGroup).map(catName => (
            <div key={catName} className="glass-panel rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-4 border-b border-slate-800/80 pb-2 flex items-center gap-2">
                <Cpu className="text-neonBlue w-5 h-5" />
                <span>{catName}</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoriesGroup[catName].map(sk => {
                  const prof = getProficiencyLabel(sk.rating);
                  return (
                    <div key={sk.id} className="glass-card rounded-xl p-4 flex items-center justify-between group">
                      <div>
                        <h4 className="font-bold text-white">{sk.skill_name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            prof === 'Beginner' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/15' :
                            prof === 'Intermediate' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/15' :
                            'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15'
                          }`}>
                            {prof}
                          </span>
                          <div className="flex items-center text-amber-400">
                            {[1, 2, 3, 4, 5].map(star => (
                              <Star 
                                key={star} 
                                className={`w-3 h-3 ${star <= sk.rating ? 'fill-current' : 'text-slate-600'}`} 
                              />
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Actions (visible on group hover or mobile) */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(sk)}
                          className="p-1 hover:bg-slate-700/50 rounded-lg text-slate-400 hover:text-white transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(sk.id)}
                          className="p-1 hover:bg-rose-500/10 rounded-lg text-slate-400 hover:text-rose-400 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-panel-heavy rounded-2xl p-6 relative">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold text-white mb-6">
              {editingId ? 'Edit Skill Details' : 'Add Skill'}
            </h3>

            {error && (
              <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-lg text-sm mb-4">
                <X className="w-4 h-4 transform rotate-45" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Skill Name</label>
                <input
                  type="text"
                  name="skill_name"
                  value={formData.skill_name}
                  onChange={handleChange}
                  placeholder="e.g. JavaScript, Public Speaking"
                  className="w-full px-3 py-2.5 glass-input text-sm text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Category</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 glass-input text-sm text-white"
                >
                  {availableCategories.map(cat => (
                    <option key={cat} value={cat} className="bg-slate-900">{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Proficiency Level (1 to 5 Rating)</label>
                <div className="flex items-center justify-between p-3 bg-slate-900/40 rounded-lg border border-slate-800/40">
                  <span className="text-xs font-bold text-neonBlue">
                    {getProficiencyLabel(formData.rating)} ({formData.rating}/5)
                  </span>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setFormData({ ...formData, rating: val })}
                        className="p-1 text-slate-400 hover:text-amber-400 hover:scale-110 transition-all"
                      >
                        <Star className={`w-6 h-6 ${val <= formData.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}`} />
                      </button>
                    ))}
                  </div>
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
                  {editingId ? 'Save Changes' : 'Add Skill'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
