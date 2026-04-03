import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, Menu, X, Shirt, Calendar, LayoutDashboard, Search, Settings, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, userProfile, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Generate', path: '/generator', icon: Sparkles },
    { name: 'Filters', path: '/filters', icon: Search },
    { name: 'Planner', path: '/planner', icon: Calendar },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            <Link to="/dashboard" className="flex-shrink-0 flex items-center group">
              <div className="w-10 h-10 bg-charcoal rounded-xl flex items-center justify-center mr-3 group-hover:rotate-12 transition-transform">
                <Sparkles className="w-6 h-6 text-gold" />
              </div>
              <span className="text-2xl font-serif font-bold text-charcoal tracking-tight">StyleAI</span>
            </Link>
            <div className="hidden lg:ml-10 lg:flex lg:space-x-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                    isActive(link.path)
                      ? 'bg-gold/10 text-gold'
                      : 'text-gray-500 hover:text-charcoal hover:bg-gray-50'
                  }`}
                >
                  <link.icon className={`w-4 h-4 mr-2 ${isActive(link.path) ? 'text-gold' : 'text-gray-400'}`} />
                  {link.name}
                </Link>
              ))}
            </div>
          </div>
          <div className="hidden lg:flex lg:items-center space-x-6">
            <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="w-8 h-8 bg-gold rounded-full flex items-center justify-center text-white font-bold text-xs overflow-hidden">
                {userProfile?.photoURL ? (
                  <img src={userProfile.photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  userProfile?.displayName?.[0] || user?.email?.[0] || 'S'
                )}
              </div>
              <span className="text-sm font-bold text-charcoal">{userProfile?.displayName || user?.email?.split('@')[0] || 'Stylist'}</span>
            </div>
            <button
              onClick={handleLogout}
              className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
          <div className="-mr-2 flex items-center lg:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-3 rounded-2xl text-gray-400 hover:text-charcoal hover:bg-gray-50 focus:outline-none transition-all"
            >
              {isOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white border-b border-gray-100 overflow-hidden"
          >
            <div className="px-4 pt-2 pb-6 space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center px-4 py-3 rounded-2xl text-base font-bold transition-all ${
                    isActive(link.path)
                      ? 'bg-gold/10 text-gold'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  <link.icon className={`w-5 h-5 mr-3 ${isActive(link.path) ? 'text-gold' : 'text-gray-400'}`} />
                  {link.name}
                </Link>
              ))}
              <div className="pt-4 mt-4 border-t border-gray-100">
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full px-4 py-3 rounded-2xl text-base font-bold text-red-500 hover:bg-red-50 transition-all"
                >
                  <LogOut className="w-5 h-5 mr-3" /> Logout
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
