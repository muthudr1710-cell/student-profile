import React, { useState, useEffect } from 'react';
import { apiCall } from '../utils/api';
import { Plus, Edit2, Trash2, X, FolderGit, ExternalLink, Calendar, User, Code, CheckCircle } from 'lucide-react';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    tech_used: '',
    duration: '',
    link: '',
    role: ''
  });

  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const fetchProjects = async () => {
    try {
      const data = await apiCall('/projects');
      setProjects(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({ title: '', description: '', tech_used: '', duration: '', link: '', role: '' });
    setError('');
    setModalOpen(true);
  };

  const handleOpenEdit = (proj) => {
    setEditingId(proj.id);
    setFormData({
      title: proj.title,
      description: proj.description,
      tech_used: proj.tech_used,
      duration: proj.duration,
      link: proj.link || '',
      role: proj.role
    });
    setError('');
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;
    try {
      await apiCall(`/projects/${id}`, { method: 'DELETE' });
      setProjects(prev => prev.filter(p => p.id !== id));
      setMsg('Project deleted successfully');
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const { title, description, tech_used, duration, role } = formData;
    if (!title.trim() || !description.trim() || !tech_used.trim() || !duration.trim() || !role.trim()) {
      setError('All fields except Link are required.');
      return;
    }

    try {
      if (editingId) {
        const res = await apiCall(`/projects/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        });
        setProjects(prev => prev.map(p => p.id === editingId ? res : p));
        setMsg('Project updated successfully');
      } else {
        const res = await apiCall('/projects', {
          method: 'POST',
          body: JSON.stringify(formData)
        });
        setProjects(prev => [...prev, res]);
        setMsg('Project added successfully');
      }
      setModalOpen(false);
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      setError(err.message || 'Saving project failed');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Projects</h1>
          <p className="text-slate-400">Showcase your technical and engineering portfolio</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="bg-gradient-to-r from-sky-500 to-purple-600 hover:from-sky-400 hover:to-purple-500 text-white px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 shadow-lg shadow-sky-500/10 hover:shadow-sky-500/20 transition-all duration-300 self-start"
        >
          <Plus className="w-5 h-5" />
          <span>Add Project</span>
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
      ) : projects.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center flex flex-col items-center">
          <FolderGit className="w-16 h-16 text-slate-600 mb-4" />
          <h3 className="text-lg font-semibold text-slate-300">No Projects Found</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md">Add your software or engineering projects to build your portfolio profile.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((proj) => (
            <div key={proj.id} className="glass-card rounded-2xl p-6 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-sky-500/10 rounded-lg text-neonBlue">
                    <FolderGit className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-white line-clamp-1">{proj.title}</h3>
                </div>

                <p className="text-sm text-slate-300 mb-4 line-clamp-3 leading-relaxed">{proj.description}</p>

                <div className="space-y-2 mb-6">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Code className="w-4 h-4 text-slate-500" />
                    <span className="font-mono text-neonBlue line-clamp-1">{proj.tech_used}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Calendar className="w-4 h-4 text-slate-500" />
                    <span>Duration: {proj.duration}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <User className="w-4 h-4 text-slate-500" />
                    <span>Role: {proj.role}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-800/40">
                <div>
                  {proj.link && (
                    <a
                      href={proj.link.startsWith('http') ? proj.link : `https://${proj.link}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-neonBlue hover:text-sky-300 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Live Link</span>
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEdit(proj)}
                    className="p-1.5 hover:bg-slate-700/50 rounded-lg text-slate-400 hover:text-white transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(proj.id)}
                    className="p-1.5 hover:bg-rose-500/10 rounded-lg text-slate-400 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
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
              {editingId ? 'Edit Project Details' : 'Add Project'}
            </h3>

            {error && (
              <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-lg text-sm mb-4">
                <Plus className="w-4 h-4 transform rotate-45" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Project Title</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g. Smart Attendance System"
                  className="w-full px-3 py-2.5 glass-input text-sm text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Summarize features, context, goals..."
                  rows="3"
                  className="w-full px-3 py-2.5 glass-input text-sm text-white resize-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Tech/Tools Used</label>
                  <input
                    type="text"
                    name="tech_used"
                    value={formData.tech_used}
                    onChange={handleChange}
                    placeholder="e.g. React, Node, OpenCV"
                    className="w-full px-3 py-2.5 glass-input text-sm text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Duration</label>
                  <input
                    type="text"
                    name="duration"
                    value={formData.duration}
                    onChange={handleChange}
                    placeholder="e.g. 3 Months (Fall 2024)"
                    className="w-full px-3 py-2.5 glass-input text-sm text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">My Role</label>
                  <input
                    type="text"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    placeholder="e.g. Lead Full-Stack Developer"
                    className="w-full px-3 py-2.5 glass-input text-sm text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Link (GitHub / Demo)</label>
                  <input
                    type="text"
                    name="link"
                    value={formData.link}
                    onChange={handleChange}
                    placeholder="e.g. github.com/user/repo"
                    className="w-full px-3 py-2.5 glass-input text-sm text-white"
                  />
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
                  {editingId ? 'Save Changes' : 'Add Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
