import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Academics from './pages/Academics';
import Attendance from './pages/Attendance';
import Projects from './pages/Projects';
import Events from './pages/Events';
import Achievements from './pages/Achievements';
import Skills from './pages/Skills';
import Sports from './pages/Sports';
import Profile from './pages/Profile';

function LayoutShell({ children }) {
  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-y-auto min-h-screen">
        {children}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Portal Routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <LayoutShell>
                <Dashboard />
              </LayoutShell>
            </ProtectedRoute>
          } />
          <Route path="/academics" element={
            <ProtectedRoute>
              <LayoutShell>
                <Academics />
              </LayoutShell>
            </ProtectedRoute>
          } />
          <Route path="/attendance" element={
            <ProtectedRoute>
              <LayoutShell>
                <Attendance />
              </LayoutShell>
            </ProtectedRoute>
          } />
          <Route path="/projects" element={
            <ProtectedRoute>
              <LayoutShell>
                <Projects />
              </LayoutShell>
            </ProtectedRoute>
          } />
          <Route path="/events" element={
            <ProtectedRoute>
              <LayoutShell>
                <Events />
              </LayoutShell>
            </ProtectedRoute>
          } />
          <Route path="/achievements" element={
            <ProtectedRoute>
              <LayoutShell>
                <Achievements />
              </LayoutShell>
            </ProtectedRoute>
          } />
          <Route path="/skills" element={
            <ProtectedRoute>
              <LayoutShell>
                <Skills />
              </LayoutShell>
            </ProtectedRoute>
          } />
          <Route path="/sports" element={
            <ProtectedRoute>
              <LayoutShell>
                <Sports />
              </LayoutShell>
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <LayoutShell>
                <Profile />
              </LayoutShell>
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
