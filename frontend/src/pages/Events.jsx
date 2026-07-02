import React, { useState, useEffect } from 'react';
import { apiCall } from '../utils/api';
import { Plus, Edit2, Trash2, X, Award, CheckCircle, Calendar, ShieldAlert } from 'lucide-react';

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    event_name: '',
    type: 'Technical',
    date: '',
    level: 'College',
    result_status: 'Participated'
  });

  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const fetchEvents = async () => {
    try {
      const data = await apiCall('/events');
      setEvents(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({ event_name: '', type: 'Technical', date: '', level: 'College', result_status: 'Participated' });
    setError('');
    setModalOpen(true);
  };

  const handleOpenEdit = (evt) => {
    setEditingId(evt.id);
    setFormData({
      event_name: evt.event_name,
      type: evt.type,
      date: evt.date,
      level: evt.level,
      result_status: evt.result_status
    });
    setError('');
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this event record?')) return;
    try {
      await apiCall(`/events/${id}`, { method: 'DELETE' });
      setEvents(prev => prev.filter(e => e.id !== id));
      setMsg('Event deleted successfully');
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const { event_name, date } = formData;
    if (!event_name.trim() || !date) {
      setError('Event Name and Date are required.');
      return;
    }

    try {
      if (editingId) {
        const res = await apiCall(`/events/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        });
        setEvents(prev => prev.map(e => e.id === editingId ? res : e));
        setMsg('Event updated successfully');
      } else {
        const res = await apiCall('/events', {
          method: 'POST',
          body: JSON.stringify(formData)
        });
        setEvents(prev => [...prev, res]);
        setMsg('Event added successfully');
      }
      setModalOpen(false);
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      setError(err.message || 'Saving event failed');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">College Events & Competitions</h1>
          <p className="text-slate-400">Track extracurricular, cultural, athletic, and technical participation</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="bg-gradient-to-r from-sky-500 to-purple-600 hover:from-sky-400 hover:to-purple-500 text-white px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 shadow-lg shadow-sky-500/10 hover:shadow-sky-500/20 transition-all duration-300 self-start"
        >
          <Plus className="w-5 h-5" />
          <span>Add Event</span>
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
      ) : events.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center flex flex-col items-center">
          <Award className="w-16 h-16 text-slate-600 mb-4" />
          <h3 className="text-lg font-semibold text-slate-300">No Events Logged</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md">Keep a record of the competitions and hackathons you participate in.</p>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/40 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-700/20">
                <tr>
                  <th className="px-6 py-4">Event Name</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Level</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Result Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/30">
                {events.map((evt) => (
                  <tr key={evt.id} className="hover:bg-slate-800/10 transition-colors">
                    <td className="px-6 py-4 font-bold text-white">{evt.event_name}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-2.5 py-0.5 rounded text-xs font-semibold ${
                        evt.type === 'Technical' ? 'bg-indigo-500/10 text-indigo-400' :
                        evt.type === 'Cultural' ? 'bg-pink-500/10 text-pink-400' :
                        evt.type === 'Sports' ? 'bg-amber-500/10 text-amber-400' :
                        'bg-slate-800 text-slate-400'
                      }`}>
                        {evt.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-300">{evt.level}</td>
                    <td className="px-6 py-4 text-slate-400 font-mono text-xs">{evt.date}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                        evt.result_status === 'Won' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' :
                        evt.result_status === 'Runner-up' ? 'bg-sky-500/15 text-sky-400 border border-sky-500/20' :
                        evt.result_status === 'Participated' ? 'bg-slate-800 text-slate-300 border border-slate-700/30' :
                        'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                      }`}>
                        {evt.result_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(evt)}
                          className="p-1.5 hover:bg-slate-700/50 rounded-lg text-slate-400 hover:text-white transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(evt.id)}
                          className="p-1.5 hover:bg-rose-500/10 rounded-lg text-slate-400 hover:text-rose-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
              {editingId ? 'Edit Event Record' : 'Add Event Record'}
            </h3>

            {error && (
              <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-lg text-sm mb-4">
                <ShieldAlert className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Event Name</label>
                <input
                  type="text"
                  name="event_name"
                  value={formData.event_name}
                  onChange={handleChange}
                  placeholder="e.g. Inter-College Hackathon 2026"
                  className="w-full px-3 py-2.5 glass-input text-sm text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Event Type</label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 glass-input text-sm text-white"
                  >
                    {['Technical', 'Cultural', 'Sports', 'Other'].map(t => (
                      <option key={t} value={t} className="bg-slate-900">{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Event Date</label>
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Competition Level</label>
                  <select
                    name="level"
                    value={formData.level}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 glass-input text-sm text-white"
                  >
                    {['College', 'District', 'State', 'National', 'International'].map(l => (
                      <option key={l} value={l} className="bg-slate-900">{l}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Result Status</label>
                  <select
                    name="result_status"
                    value={formData.result_status}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 glass-input text-sm text-white"
                  >
                    {['Participated', 'Won', 'Runner-up', 'Lost'].map(r => (
                      <option key={r} value={r} className="bg-slate-900">{r}</option>
                    ))}
                  </select>
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
                  {editingId ? 'Save Changes' : 'Add Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
