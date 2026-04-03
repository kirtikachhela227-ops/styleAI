import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import OutfitGenerator from './pages/OutfitGenerator';
import WeeklyPlanner from './pages/WeeklyPlanner';
import Filters from './pages/Filters';
import Settings from './pages/Settings';
import { RefreshCw } from 'lucide-react';

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF5EF]">
        <RefreshCw className="w-10 h-10 text-[#C9A84C] animate-spin" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/login" />} />
      <Route path="/generator" element={user ? <OutfitGenerator /> : <Navigate to="/login" />} />
      <Route path="/planner" element={user ? <WeeklyPlanner /> : <Navigate to="/login" />} />
      <Route path="/filters" element={user ? <Filters /> : <Navigate to="/login" />} />
      <Route path="/settings" element={user ? <Settings /> : <Navigate to="/login" />} />
      <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Layout>
          <AppRoutes />
        </Layout>
      </AuthProvider>
    </Router>
  );
}
