import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiCall } from '../utils/api';
import { calculateGrade } from './Academics';
import { calculateRecoveryClasses } from './Attendance';
import { 
  GraduationCap, 
  CalendarCheck, 
  FolderGit, 
  Trophy, 
  AlertTriangle, 
  Clock, 
  ArrowUpRight, 
  Award,
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function Dashboard() {
  const { user } = useAuth();
  const [academics, setAcademics] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [projectsCount, setProjectsCount] = useState(0);
  const [achievementsCount, setAchievementsCount] = useState(0);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [ac, att, proj, ach, recent] = await Promise.all([
          apiCall('/academics'),
          apiCall('/attendance'),
          apiCall('/projects'),
          apiCall('/achievements'),
          apiCall('/recent-activity')
        ]);
        setAcademics(ac);
        setAttendance(att);
        setProjectsCount(proj.length);
        setAchievementsCount(ach.length);
        setRecentActivities(recent);
      } catch (error) {
        console.error('Error fetching dashboard details:', error);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  // Compute CGPA & GPA progress
  const semestersGroup = {};
  academics.forEach(rec => {
    if (!semestersGroup[rec.semester]) semestersGroup[rec.semester] = [];
    semestersGroup[rec.semester].push(rec);
  });

  const semesterGPAs = [];
  let totalWeightedGP = 0;
  let totalCredits = 0;

  Object.keys(semestersGroup).forEach(sem => {
    const semRecords = semestersGroup[sem];
    let semWeightedGP = 0;
    let semCredits = 0;

    semRecords.forEach(rec => {
      const { gp } = calculateGrade(rec.marks_obtained, rec.max_marks);
      semWeightedGP += (gp * rec.credits);
      semCredits += rec.credits;
    });

    const semGPA = semCredits > 0 ? (semWeightedGP / semCredits) : 0;
    semesterGPAs.push({
      semester: `Sem ${sem}`,
      semNumber: parseInt(sem),
      GPA: parseFloat(semGPA.toFixed(2))
    });

    totalWeightedGP += semWeightedGP;
    totalCredits += semCredits;
  });

  semesterGPAs.sort((a, b) => a.semNumber - b.semNumber);
  const cgpa = totalCredits > 0 ? (totalWeightedGP / totalCredits).toFixed(2) : '0.00';

  // Compute Attendance %
  let totalClasses = 0;
  let attendedClasses = 0;
  const attendanceChartData = [];

  attendance.forEach(att => {
    totalClasses += att.total_classes;
    attendedClasses += att.attended_classes;
    const pct = att.total_classes > 0 ? (att.attended_classes / att.total_classes) * 100 : 0;
    attendanceChartData.push({
      subject: att.subject_name.substring(0, 10) + (att.subject_name.length > 10 ? '..' : ''),
      percentage: Math.round(pct)
    });
  });

  const attendancePct = totalClasses > 0 ? (attendedClasses / totalClasses) * 100 : 0;
  const recoveryClasses = calculateRecoveryClasses(totalClasses, attendedClasses);
  const isAttendanceLow = totalClasses > 0 && attendancePct < 75;

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <div className="w-12 h-12 border-4 border-neonBlue border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Welcome Heading */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Welcome, {user?.name || user?.username}!</h1>
          <p className="text-slate-400 mt-1">Here is a quick look at your academic and extra-curricular progress dashboard</p>
        </div>
        <div className="text-xs text-slate-400 bg-slate-900/40 border border-slate-800 px-3.5 py-1.5 rounded-lg font-mono">
          Roll: {user?.roll_number || 'N/A'} | Sem: {user?.current_semester || 1}
        </div>
      </div>

      {/* Attendance Alert Banner */}
      {isAttendanceLow && (
        <div className="glass-panel border-rose-500/30 bg-rose-500/5 rounded-2xl p-5 flex items-center gap-4 animate-pulse">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400 flex-shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-rose-400">Attendance Deficit Alert!</h4>
            <p className="text-xs text-slate-300 mt-0.5">
              Overall attendance is at <span className="font-extrabold text-white">{attendancePct.toFixed(1)}%</span>. 
              You need to attend <span className="font-extrabold text-white">{recoveryClasses}</span> consecutive future classes to raise it to 75%.
            </p>
          </div>
        </div>
      )}

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* CGPA */}
        <div className="glass-panel rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-neonBlue/10 rounded-full filter blur-2xl"></div>
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Current CGPA</h3>
            <div className="p-2 bg-sky-500/10 rounded-lg text-neonBlue">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-white">{cgpa} <span className="text-xs text-slate-500 font-normal">/ 10.0</span></p>
          <div className="flex items-center gap-1 text-[11px] text-emerald-400 mt-3 font-semibold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Active target: 10.0</span>
          </div>
        </div>

        {/* Attendance */}
        <div className="glass-panel rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-neonPurple/10 rounded-full filter blur-2xl"></div>
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Attendance %</h3>
            <div className={`p-2 rounded-lg ${isAttendanceLow ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
              <CalendarCheck className="w-5 h-5" />
            </div>
          </div>
          <p className={`text-3xl font-extrabold ${isAttendanceLow ? 'text-rose-400' : 'text-emerald-400'}`}>
            {totalClasses > 0 ? `${attendancePct.toFixed(1)}%` : '0.0%'}
          </p>
          <span className="inline-block mt-3 text-[11px] text-slate-400 font-medium">
            {isAttendanceLow ? 'Below 75% Limit' : 'Safe status'}
          </span>
        </div>

        {/* Projects */}
        <div className="glass-panel rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-neonPink/10 rounded-full filter blur-2xl"></div>
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Total Projects</h3>
            <div className="p-2 bg-pink-500/10 rounded-lg text-neonPink">
              <FolderGit className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-white">{projectsCount}</p>
          <span className="inline-block mt-3 text-[11px] text-slate-400 font-medium">Recorded in portfolio</span>
        </div>

        {/* Achievements */}
        <div className="glass-panel rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full filter blur-2xl"></div>
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Achievements</h3>
            <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400">
              <Trophy className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-white">{achievementsCount}</p>
          <span className="inline-block mt-3 text-[11px] text-slate-400 font-medium">Archived timeline awards</span>
        </div>
      </div>

      {/* Split Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* GPA Trend Line Chart */}
        <div className="glass-panel rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center justify-between">
            <span>GPA Trend Progress</span>
            <span className="text-xs font-normal text-slate-400">Across semesters completed</span>
          </h3>
          <div className="h-64 w-full">
            {semesterGPAs.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={semesterGPAs}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="semester" stroke="#94a3b8" fontSize={11} />
                  <YAxis domain={[0, 10]} stroke="#94a3b8" fontSize={11} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    labelStyle={{ color: '#f1f5f9' }}
                  />
                  <Line type="monotone" dataKey="GPA" stroke="#38bdf8" strokeWidth={3} dot={{ fill: '#38bdf8' }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-slate-500">
                No GPA data. Add grades under Academics.
              </div>
            )}
          </div>
        </div>

        {/* Subject Attendance Bar Chart */}
        <div className="glass-panel rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center justify-between">
            <span>Attendance Per Subject</span>
            <span className="text-xs font-normal text-slate-400">Minimum threshold: 75%</span>
          </h3>
          <div className="h-64 w-full">
            {attendanceChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={attendanceChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="subject" stroke="#94a3b8" fontSize={10} />
                  <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={11} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    labelStyle={{ color: '#f1f5f9' }}
                  />
                  <Bar dataKey="percentage" fill="#a855f7" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-slate-500">
                No attendance logs. Log classes under Attendance.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activities Section */}
      <div className="glass-panel rounded-2xl p-6">
        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <Clock className="w-5 h-5 text-neonBlue animate-pulse" />
          <span>Recent Student Activities</span>
        </h3>
        
        {recentActivities.length === 0 ? (
          <p className="text-sm text-slate-500 py-4 text-center">No recent records. Add projects, events, or achievements to see log updates.</p>
        ) : (
          <div className="space-y-4">
            {recentActivities.map((act, index) => {
              const keyId = act.id + '-' + index;
              return (
                <div key={keyId} className="flex items-center justify-between p-3.5 bg-slate-900/40 hover:bg-slate-800/20 border border-slate-850 hover:border-slate-800 rounded-xl transition-all duration-200">
                  <div className="flex items-center gap-3.5">
                    <div className={`p-2 rounded-lg ${
                      act.type === 'project' ? 'bg-sky-500/10 text-sky-400' :
                      act.type === 'achievement' ? 'bg-amber-500/10 text-amber-400' :
                      'bg-purple-500/10 text-purple-400'
                    }`}>
                      {act.type === 'project' ? <FolderGit className="w-4 h-4" /> :
                       act.type === 'achievement' ? <Trophy className="w-4 h-4" /> :
                       <Award className="w-4 h-4" />}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">{act.title}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">{act.action}</p>
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    {act.date || 'Active'}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
