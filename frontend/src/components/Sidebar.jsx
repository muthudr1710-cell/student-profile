import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  GraduationCap, 
  CalendarCheck, 
  FolderGit, 
  Award, 
  Trophy, 
  Cpu, 
  FileCheck, 
  User, 
  LogOut,
  Menu,
  X
} from 'lucide-react';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Academics', path: '/academics', icon: GraduationCap },
    { name: 'Attendance', path: '/attendance', icon: CalendarCheck },
    { name: 'Projects', path: '/projects', icon: FolderGit },
    { name: 'Events', path: '/events', icon: Award },
    { name: 'Achievements', path: '/achievements', icon: Trophy },
    { name: 'Skills', path: '/skills', icon: Cpu },
    { name: 'Sports Certificates', path: '/sports', icon: FileCheck },
    { name: 'Profile', path: '/profile', icon: User },
  ];

  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="lg:hidden flex items-center justify-between p-4 glass-panel sticky top-0 z-50 text-white">
        <div className="flex items-center gap-2">
          <GraduationCap className="text-neonBlue w-7 h-7" />
          <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-neonBlue to-neonPurple text-lg">
            EduTrack Portal
          </span>
        </div>
        <button onClick={toggleSidebar} className="p-2 hover:bg-slate-800 rounded-lg">
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Backdrop for mobile */}
      {isOpen && (
        <div 
          onClick={toggleSidebar} 
          className="lg:hidden fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-40"
        />
      )}

      {/* Sidebar container */}
      <div className={`
        fixed lg:sticky top-0 left-0 h-screen w-72 glass-panel-heavy z-40 flex flex-col justify-between p-6 transition-transform duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div>
          {/* Logo */}
          <div className="hidden lg:flex items-center gap-3 mb-8">
            <GraduationCap className="text-neonBlue w-9 h-9" />
            <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-neonBlue to-neonPurple text-xl">
              EduTrack
            </span>
          </div>

          {/* User Mini Profile */}
          <div className="flex items-center gap-3 p-3 bg-slate-800/40 rounded-xl mb-6 border border-slate-700/30">
            <img 
              src={user?.photo_url ? `http://localhost:5000${user.photo_url}` : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop'} 
              alt="Profile" 
              className="w-11 h-11 rounded-full object-cover border-2 border-neonBlue"
            />
            <div className="overflow-hidden">
              <h4 className="text-sm font-semibold truncate text-white">{user?.name || user?.username}</h4>
              <p className="text-xs text-slate-400 truncate">{user?.department || 'No department'}</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200
                    ${isActive 
                      ? 'bg-gradient-to-r from-sky-500/25 to-purple-500/10 text-neonBlue border-l-4 border-neonBlue pl-3' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'}
                  `}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-neonBlue' : 'text-slate-400'}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer/Logout */}
        <div>
          <button
            onClick={() => {
              logout();
              setIsOpen(false);
            }}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </div>
    </>
  );
}
