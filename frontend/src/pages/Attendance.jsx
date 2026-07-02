import React, { useState, useEffect } from 'react';
import { apiCall } from '../utils/api';
import { Plus, Edit2, Trash2, X, AlertTriangle, CheckCircle, CalendarCheck, HelpCircle } from 'lucide-react';

export function calculateRecoveryClasses(total, attended) {
  if (total === 0) return 0;
  const currentPct = (attended / total) * 100;
  if (currentPct >= 75) return 0;
  // Formula: (attended + x) / (total + x) >= 0.75
  // attended + x >= 0.75 * total + 0.75 * x
  // 0.25 * x >= 0.75 * total - attended
  // x >= 3 * total - 4 * attended
  const needed = 3 * total - 4 * attended;
  return needed > 0 ? needed : 0;
}

export default function Attendance() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    semester: 1,
    subject_name: '',
    total_classes: '',
    attended_classes: ''
  });

  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const fetchRecords = async () => {
    try {
      const data = await apiCall('/attendance');
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
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      semester: 1,
      subject_name: '',
      total_classes: '',
      attended_classes: ''
    });
    setError('');
    setModalOpen(true);
  };

  const handleOpenEdit = (rec) => {
    setEditingId(rec.id);
    setFormData({
      semester: rec.semester,
      subject_name: rec.subject_name,
      total_classes: rec.total_classes,
      attended_classes: rec.attended_classes
    });
    setError('');
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    try {
      await apiCall(`/attendance/${id}`, { method: 'DELETE' });
      setRecords(prev => prev.filter(r => r.id !== id));
      setMsg('Attendance record deleted successfully');
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const sem = parseInt(formData.semester);
    const total = parseInt(formData.total_classes);
    const attended = parseInt(formData.attended_classes);

    if (!formData.subject_name.trim()) {
      setError('Subject Name is required.');
      return;
    }

    if (isNaN(total) || isNaN(attended)) {
      setError('Please enter valid numerical values.');
      return;
    }

    if (attended > total) {
      setError('Attended classes cannot exceed total classes held.');
      return;
    }

    const payload = {
      semester: sem,
      subject_name: formData.subject_name.trim(),
      total_classes: total,
      attended_classes: attended
    };

    try {
      if (editingId) {
        const res = await apiCall(`/attendance/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        setRecords(prev => prev.map(r => r.id === editingId ? res : r));
        setMsg('Attendance record updated successfully');
      } else {
        const res = await apiCall('/attendance', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        setRecords(prev => [...prev, res]);
        setMsg('Attendance record added successfully');
      }
      setModalOpen(false);
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      setError(err.message || 'Saving attendance failed');
    }
  };

  // Calculations for overall summary
  let totalAllClasses = 0;
  let totalAllAttended = 0;

  records.forEach(r => {
    totalAllClasses += r.total_classes;
    totalAllAttended += r.attended_classes;
  });

  const overallPercentage = totalAllClasses > 0 ? (totalAllAttended / totalAllClasses) * 100 : 0;
  const overallRecovery = calculateRecoveryClasses(totalAllClasses, totalAllAttended);
  const isOverallLow = totalAllClasses > 0 && overallPercentage < 75;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Attendance Tracker</h1>
          <p className="text-slate-400">Track subject attendance, percentage thresholds, and target class recoveries</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="bg-gradient-to-r from-sky-500 to-purple-600 hover:from-sky-400 hover:to-purple-500 text-white px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 shadow-lg shadow-sky-500/10 hover:shadow-sky-500/20 transition-all duration-300 self-start"
        >
          <Plus className="w-5 h-5" />
          <span>Add Subject Attendance</span>
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
      ) : (
        <>
          {/* Quick Warning Alert Banner */}
          {isOverallLow && (
            <div className="glass-panel border-rose-500/30 bg-rose-500/5 rounded-2xl p-6 mb-8 flex flex-col md:flex-row items-start md:items-center gap-4 animate-pulse">
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400 flex-shrink-0">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-rose-400">Attendance Warning!</h3>
                <p className="text-sm text-slate-300 mt-0.5">
                  Your overall attendance ({overallPercentage.toFixed(1)}%) is below the minimum required 75%. 
                  You must attend the next <span className="font-extrabold text-white text-base">{overallRecovery}</span> consecutive classes to recover your status.
                </p>
              </div>
            </div>
          )}

          {/* Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="glass-panel rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-neonBlue/10 rounded-full filter blur-2xl"></div>
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Overall Attendance</h3>
              <p className={`text-4xl font-extrabold ${totalAllClasses > 0 && overallPercentage >= 75 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {totalAllClasses > 0 ? `${overallPercentage.toFixed(1)}%` : '0.0%'}
              </p>
              <div className="w-full bg-slate-800/80 h-1.5 rounded-full mt-4 overflow-hidden">
                <div 
                  className={`h-full rounded-full ${overallPercentage >= 75 ? 'bg-emerald-400' : 'bg-rose-400'}`}
                  style={{ width: `${overallPercentage}%` }}
                ></div>
              </div>
            </div>

            <div className="glass-panel rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-neonPurple/10 rounded-full filter blur-2xl"></div>
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Total Classes Logged</h3>
              <p className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-neonPurple to-purple-400">
                {totalAllAttended} <span className="text-sm text-slate-500 font-normal">/ {totalAllClasses}</span>
              </p>
              <p className="text-xs text-slate-500 mt-4">Total classes attended out of total held</p>
            </div>

            <div className="glass-panel rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-neonPink/10 rounded-full filter blur-2xl"></div>
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Status Verdict</h3>
              <div className="mt-2">
                {totalAllClasses === 0 ? (
                  <span className="text-lg font-bold text-slate-500">No logs</span>
                ) : overallPercentage >= 75 ? (
                  <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-sm font-bold border border-emerald-500/20">
                    <CheckCircle className="w-4 h-4" /> Eligible
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 bg-rose-500/10 text-rose-400 px-3 py-1 rounded-full text-sm font-bold border border-rose-500/20">
                    <AlertTriangle className="w-4 h-4" /> Attendance Shortage
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-4">Minimum requirement is 75% per course/overall</p>
            </div>
          </div>

          {/* Cards Grid List */}
          {records.length === 0 ? (
            <div className="glass-panel rounded-2xl p-12 text-center flex flex-col items-center">
              <CalendarCheck className="w-16 h-16 text-slate-600 mb-4" />
              <h3 className="text-lg font-semibold text-slate-300">No Attendance Logged</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-md">Begin tracking your classes by clicking the button above.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {records.map((rec) => {
                const pct = rec.total_classes > 0 ? (rec.attended_classes / rec.total_classes) * 100 : 0;
                const recovery = calculateRecoveryClasses(rec.total_classes, rec.attended_classes);
                const isLow = pct < 75;

                return (
                  <div key={rec.id} className="glass-card rounded-2xl p-6 flex flex-col justify-between">
                    <div>
                      {/* Course Headers */}
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div>
                          <span className="text-xs font-bold text-neonBlue bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/10">
                            Sem {rec.semester}
                          </span>
                          <h4 className="text-lg font-bold text-white mt-1.5 line-clamp-1">{rec.subject_name}</h4>
                        </div>
                        {/* Circular Progress Gauge */}
                        <div className="relative w-16 h-16 flex items-center justify-center flex-shrink-0">
                          <svg className="w-full h-full transform -rotate-90">
                            <circle 
                              cx="32" 
                              cy="32" 
                              r="26" 
                              stroke="rgba(255,255,255,0.05)" 
                              strokeWidth="5" 
                              fill="transparent" 
                            />
                            <circle 
                              cx="32" 
                              cy="32" 
                              r="26" 
                              stroke={isLow ? '#f43f5e' : '#10b981'} 
                              strokeWidth="5" 
                              fill="transparent" 
                              strokeDasharray={2 * Math.PI * 26}
                              strokeDashoffset={2 * Math.PI * 26 * (1 - pct / 100)}
                              strokeLinecap="round"
                            />
                          </svg>
                          <span className="absolute text-xs font-extrabold text-white">
                            {pct.toFixed(0)}%
                          </span>
                        </div>
                      </div>

                      {/* Log details */}
                      <div className="space-y-1.5 text-sm text-slate-300 bg-slate-900/30 p-3 rounded-lg border border-slate-800/40 mb-4">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Classes Attended:</span>
                          <span className="font-semibold text-white">{rec.attended_classes}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Total Held:</span>
                          <span className="font-semibold text-white">{rec.total_classes}</span>
                        </div>
                      </div>

                      {/* Recovery Text */}
                      <div className="text-xs mb-6">
                        {isLow ? (
                          <div className="flex items-center gap-1 bg-rose-500/10 text-rose-400 p-2 rounded border border-rose-500/10">
                            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>Attend next <strong className="text-white">{recovery}</strong> classes consecutively</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 bg-emerald-500/10 text-emerald-400 p-2 rounded border border-emerald-500/10">
                            <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>Attendance is safe ({pct.toFixed(1)}%)</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800/40">
                      <button
                        onClick={() => handleOpenEdit(rec)}
                        className="px-3 py-1.5 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDelete(rec.id)}
                        className="px-3 py-1.5 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Add/Edit Modal */}
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
              {editingId ? 'Edit Subject Attendance' : 'Add Subject Attendance'}
            </h3>

            {error && (
              <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-lg text-sm mb-4">
                <Plus className="w-4 h-4 transform rotate-45" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Semester</label>
                <select
                  name="semester"
                  value={formData.semester}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 glass-input text-sm text-white"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                    <option key={s} value={s} className="bg-slate-900">Semester {s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Subject Name</label>
                <input
                  type="text"
                  name="subject_name"
                  value={formData.subject_name}
                  onChange={handleChange}
                  placeholder="e.g. Microprocessors"
                  className="w-full px-3 py-2.5 glass-input text-sm text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Classes Attended</label>
                  <input
                    type="number"
                    name="attended_classes"
                    value={formData.attended_classes}
                    onChange={handleChange}
                    placeholder="e.g. 15"
                    className="w-full px-3 py-2.5 glass-input text-sm text-white"
                    required
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Total Classes Held</label>
                  <input
                    type="number"
                    name="total_classes"
                    value={formData.total_classes}
                    onChange={handleChange}
                    placeholder="e.g. 20"
                    className="w-full px-3 py-2.5 glass-input text-sm text-white"
                    required
                    min="1"
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
                  {editingId ? 'Save Changes' : 'Add Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
