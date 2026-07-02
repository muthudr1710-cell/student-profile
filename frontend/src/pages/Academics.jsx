import React, { useState, useEffect } from 'react';
import { apiCall } from '../utils/api';
import { Plus, Trash2, Edit2, X, FileText, CheckCircle, HelpCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';

export function calculateGrade(obtained, max) {
  const percentage = (obtained / max) * 100;
  if (percentage >= 90) return { letter: 'O', gp: 10.0 };
  if (percentage >= 80) return { letter: 'A+', gp: 9.0 };
  if (percentage >= 70) return { letter: 'A', gp: 8.0 };
  if (percentage >= 60) return { letter: 'B+', gp: 7.0 };
  if (percentage >= 50) return { letter: 'B', gp: 6.0 };
  if (percentage >= 45) return { letter: 'C', gp: 5.0 };
  if (percentage >= 40) return { letter: 'P', gp: 4.0 };
  return { letter: 'F', gp: 0.0 };
}

export default function Academics() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    semester: 1,
    subject_name: '',
    subject_code: '',
    max_marks: 100,
    marks_obtained: '',
    credits: 3
  });

  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const fetchRecords = async () => {
    try {
      const data = await apiCall('/academics');
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
      subject_code: '',
      max_marks: 100,
      marks_obtained: '',
      credits: 3
    });
    setError('');
    setModalOpen(true);
  };

  const handleOpenEdit = (rec) => {
    setEditingId(rec.id);
    setFormData({
      semester: rec.semester,
      subject_name: rec.subject_name,
      subject_code: rec.subject_code,
      max_marks: rec.max_marks,
      marks_obtained: rec.marks_obtained,
      credits: rec.credits
    });
    setError('');
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    try {
      await apiCall(`/academics/${id}`, { method: 'DELETE' });
      setRecords(prev => prev.filter(r => r.id !== id));
      setMsg('Record deleted successfully');
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const max = parseInt(formData.max_marks);
    const obt = parseInt(formData.marks_obtained);
    const cred = parseInt(formData.credits);
    const sem = parseInt(formData.semester);

    if (!formData.subject_name.trim() || !formData.subject_code.trim()) {
      setError('Subject Name and Code are required.');
      return;
    }

    if (isNaN(max) || isNaN(obt) || isNaN(cred)) {
      setError('Please enter valid numerical values.');
      return;
    }

    if (obt > max) {
      setError('Obtained marks cannot exceed maximum marks.');
      return;
    }

    const payload = {
      semester: sem,
      subject_name: formData.subject_name.trim(),
      subject_code: formData.subject_code.trim().toUpperCase(),
      max_marks: max,
      marks_obtained: obt,
      credits: cred
    };

    try {
      if (editingId) {
        const res = await apiCall(`/academics/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        setRecords(prev => prev.map(r => r.id === editingId ? res : r));
        setMsg('Record updated successfully');
      } else {
        const res = await apiCall('/academics', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        setRecords(prev => [...prev, res]);
        setMsg('Record added successfully');
      }
      setModalOpen(false);
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      setError(err.message || 'Saving record failed');
    }
  };

  // Group records by semester
  const semestersGroup = {};
  records.forEach(rec => {
    if (!semestersGroup[rec.semester]) {
      semestersGroup[rec.semester] = [];
    }
    semestersGroup[rec.semester].push(rec);
  });

  // Calculations for each semester & overall CGPA
  const semesterGPAs = [];
  let totalWeightedGP = 0;
  let totalAllCredits = 0;

  Object.keys(semestersGroup).forEach(sem => {
    const semRecords = semestersGroup[sem];
    let semTotalWeightedGP = 0;
    let semTotalCredits = 0;
    let semTotalObtained = 0;
    let semTotalMax = 0;

    semRecords.forEach(rec => {
      const { gp } = calculateGrade(rec.marks_obtained, rec.max_marks);
      semTotalWeightedGP += (gp * rec.credits);
      semTotalCredits += rec.credits;
      semTotalObtained += rec.marks_obtained;
      semTotalMax += rec.max_marks;
    });

    const semGPA = semTotalCredits > 0 ? (semTotalWeightedGP / semTotalCredits) : 0;
    const semAvg = semTotalMax > 0 ? (semTotalObtained / semTotalMax) * 100 : 0;

    semestersGroup[sem].gpa = semGPA.toFixed(2);
    semestersGroup[sem].average = semAvg.toFixed(1);
    semestersGroup[sem].totalCredits = semTotalCredits;

    semesterGPAs.push({
      semester: `Sem ${sem}`,
      semNumber: parseInt(sem),
      GPA: parseFloat(semGPA.toFixed(2))
    });

    totalWeightedGP += semTotalWeightedGP;
    totalAllCredits += semTotalCredits;
  });

  // Sort semester GPAs for trend line chart
  semesterGPAs.sort((a, b) => a.semNumber - b.semNumber);

  const overallCGPA = totalAllCredits > 0 ? (totalWeightedGP / totalAllCredits).toFixed(2) : '0.00';

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Academic Records</h1>
          <p className="text-slate-400">Track subject grades, semesters average, and overall CGPA trajectory</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="bg-gradient-to-r from-sky-500 to-purple-600 hover:from-sky-400 hover:to-purple-500 text-white px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 shadow-lg shadow-sky-500/10 hover:shadow-sky-500/20 transition-all duration-300 self-start"
        >
          <Plus className="w-5 h-5" />
          <span>Add Subject Mark</span>
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
          {/* Overview Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="glass-panel rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-neonBlue/10 rounded-full filter blur-2xl"></div>
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Overall CGPA</h3>
              <p className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-neonBlue to-sky-400">
                {overallCGPA} <span className="text-sm text-slate-500 font-normal">/ 10.0</span>
              </p>
              <div className="w-full bg-slate-800/80 h-1.5 rounded-full mt-4 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-neonBlue to-sky-400 h-full rounded-full" 
                  style={{ width: `${parseFloat(overallCGPA) * 10}%` }}
                ></div>
              </div>
            </div>

            <div className="glass-panel rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-neonPurple/10 rounded-full filter blur-2xl"></div>
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Semesters Completed</h3>
              <p className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-neonPurple to-purple-400">
                {Object.keys(semestersGroup).length}
              </p>
              <p className="text-xs text-slate-500 mt-4">Calculated based on semester cards added</p>
            </div>

            <div className="glass-panel rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-neonPink/10 rounded-full filter blur-2xl"></div>
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Total Credits Earned</h3>
              <p className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-neonPink to-pink-400">
                {totalAllCredits}
              </p>
              <p className="text-xs text-slate-500 mt-4">Total accumulative course weightage credits</p>
            </div>
          </div>

          {/* Trend Chart */}
          {semesterGPAs.length > 0 && (
            <div className="glass-panel rounded-2xl p-6 mb-8">
              <h3 className="text-lg font-bold text-white mb-6">GPA Progress Trend</h3>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={semesterGPAs} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="semester" stroke="#94a3b8" fontSize={12} />
                    <YAxis domain={[0, 10]} stroke="#94a3b8" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                      labelStyle={{ color: '#f1f5f9' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="GPA" 
                      stroke="#38bdf8" 
                      strokeWidth={3} 
                      activeDot={{ r: 8 }} 
                      dot={{ fill: '#38bdf8', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Semester-wise Tables */}
          {Object.keys(semestersGroup).length === 0 ? (
            <div className="glass-panel rounded-2xl p-12 text-center flex flex-col items-center">
              <FileText className="w-16 h-16 text-slate-600 mb-4" />
              <h3 className="text-lg font-semibold text-slate-300">No Academic Records Yet</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-md">Get started by entering grades for your subjects using the add button above.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.keys(semestersGroup)
                .sort((a, b) => parseInt(a) - parseInt(b))
                .map((sem) => {
                  const semRecs = semestersGroup[sem];
                  return (
                    <div key={sem} className="glass-panel rounded-2xl overflow-hidden">
                      {/* Semester Table Header */}
                      <div className="px-6 py-4 bg-slate-800/40 border-b border-slate-700/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                          <GraduationCap className="text-neonBlue w-5 h-5" />
                          <span>Semester {sem}</span>
                        </h3>
                        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
                          <span className="bg-sky-500/10 text-sky-400 px-2.5 py-1 rounded-full border border-sky-500/20">
                            GPA: {semRecs.gpa}
                          </span>
                          <span className="bg-purple-500/10 text-purple-400 px-2.5 py-1 rounded-full border border-purple-500/20">
                            Average: {semRecs.average}%
                          </span>
                          <span className="bg-pink-500/10 text-pink-400 px-2.5 py-1 rounded-full border border-pink-500/20">
                            Credits: {semRecs.totalCredits}
                          </span>
                        </div>
                      </div>

                      {/* Subject List Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-300">
                          <thead className="bg-slate-900/30 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-700/20">
                            <tr>
                              <th className="px-6 py-3">Code</th>
                              <th className="px-6 py-3">Subject</th>
                              <th className="px-6 py-3 text-center">Marks Obtained</th>
                              <th className="px-6 py-3 text-center">Max Marks</th>
                              <th className="px-6 py-3 text-center">Credits</th>
                              <th className="px-6 py-3 text-center">Grade Letter</th>
                              <th className="px-6 py-3 text-center">Grade Point</th>
                              <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/30">
                            {semRecs.map((rec) => {
                              const gradeInfo = calculateGrade(rec.marks_obtained, rec.max_marks);
                              return (
                                <tr key={rec.id} className="hover:bg-slate-800/10 transition-colors">
                                  <td className="px-6 py-4 font-mono text-neonBlue text-xs">{rec.subject_code}</td>
                                  <td className="px-6 py-4 font-medium text-white">{rec.subject_name}</td>
                                  <td className="px-6 py-4 text-center font-semibold text-slate-200">{rec.marks_obtained}</td>
                                  <td className="px-6 py-4 text-center text-slate-400">{rec.max_marks}</td>
                                  <td className="px-6 py-4 text-center text-slate-300 font-medium">{rec.credits}</td>
                                  <td className="px-6 py-4 text-center">
                                    <span className={`inline-block px-2.5 py-0.5 rounded text-xs font-bold ${
                                      gradeInfo.letter === 'O' ? 'bg-emerald-500/20 text-emerald-400' :
                                      gradeInfo.letter.startsWith('A') ? 'bg-sky-500/20 text-sky-400' :
                                      gradeInfo.letter.startsWith('B') ? 'bg-amber-500/20 text-amber-400' :
                                      gradeInfo.letter === 'F' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                                      'bg-slate-800 text-slate-400'
                                    }`}>
                                      {gradeInfo.letter}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 text-center text-slate-300 font-mono">{gradeInfo.gp.toFixed(1)}</td>
                                  <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      <button 
                                        onClick={() => handleOpenEdit(rec)}
                                        className="p-1.5 hover:bg-slate-700/50 rounded-lg text-slate-400 hover:text-white transition-colors"
                                      >
                                        <Edit2 className="w-4 h-4" />
                                      </button>
                                      <button 
                                        onClick={() => handleDelete(rec.id)}
                                        className="p-1.5 hover:bg-rose-500/10 rounded-lg text-slate-400 hover:text-rose-400 transition-colors"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
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
          <div className="w-full max-w-lg glass-panel-heavy rounded-2xl p-6 relative">
            <button 
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold text-white mb-6">
              {editingId ? 'Edit Subject Record' : 'Add Subject Record'}
            </h3>

            {error && (
              <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-lg text-sm mb-4">
                <Plus className="w-4 h-4 transform rotate-45" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Subject Code</label>
                  <input
                    type="text"
                    name="subject_code"
                    value={formData.subject_code}
                    onChange={handleChange}
                    placeholder="e.g. CS601"
                    className="w-full px-3 py-2.5 glass-input text-sm text-white font-mono uppercase"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Subject Name</label>
                <input
                  type="text"
                  name="subject_name"
                  value={formData.subject_name}
                  onChange={handleChange}
                  placeholder="e.g. Database Management Systems"
                  className="w-full px-3 py-2.5 glass-input text-sm text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Marks Obtained</label>
                  <input
                    type="number"
                    name="marks_obtained"
                    value={formData.marks_obtained}
                    onChange={handleChange}
                    placeholder="e.g. 85"
                    className="w-full px-3 py-2.5 glass-input text-sm text-white"
                    required
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Max Marks</label>
                  <input
                    type="number"
                    name="max_marks"
                    value={formData.max_marks}
                    onChange={handleChange}
                    placeholder="100"
                    className="w-full px-3 py-2.5 glass-input text-sm text-white"
                    required
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Credits</label>
                  <input
                    type="number"
                    name="credits"
                    value={formData.credits}
                    onChange={handleChange}
                    placeholder="3"
                    className="w-full px-3 py-2.5 glass-input text-sm text-white"
                    required
                    min="1"
                    max="10"
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
