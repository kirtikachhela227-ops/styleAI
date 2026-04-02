import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Moon, Sun, User, Trash2, Share2, Download, Check, AlertCircle, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { db, doc, updateDoc, collection, getDocs, query, where, handleFirestoreError, OperationType } from '../firebase';

export default function Settings() {
  const { user, userProfile, logout, isDemo, updateUserProfile } = useAuth();
  const [darkMode, setDarkMode] = useState(false);
  const [displayName, setDisplayName] = useState(userProfile?.displayName || '');
  const [saved, setSaved] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.displayName || '');
      setDarkMode(!!userProfile.darkMode);
      
      // Apply theme to document
      if (userProfile.darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [userProfile]);

  const toggleDarkMode = async () => {
    if (!user) return;
    const newMode = !darkMode;
    setDarkMode(newMode);
    
    try {
      await updateUserProfile({ darkMode: newMode });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      await updateUserProfile({ displayName });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (!user) return;
    try {
      let outfits = [];
      if (isDemo) {
        outfits = JSON.parse(localStorage.getItem('styleai_demo_outfits') || '[]');
      } else {
        const q = query(collection(db, 'outfits'), where('uid', '==', user.uid));
        const snapshot = await getDocs(q);
        outfits = snapshot.docs.map(doc => doc.data());
      }
      
      const blob = new Blob([JSON.stringify(outfits, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `styleai_wardrobe_${userProfile?.displayName?.toLowerCase() || 'user'}.json`;
      a.click();
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'outfits');
    }
  };

  const handleDeleteAccount = () => {
    setShowDeleteModal(true);
  };

  const confirmDeleteAccount = () => {
    logout();
    setShowDeleteModal(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-serif font-bold mb-2">Settings</h1>
        <p className="text-gray-500">Manage your profile and preferences</p>
      </header>

      <div className="space-y-6">
        {/* Profile Section */}
        <section className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-serif font-bold mb-6 flex items-center">
            <User className="w-5 h-5 mr-2 text-gold" /> Profile Settings
          </h2>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-charcoal ml-1">Display Name</label>
              <input
                type="text"
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold transition-all"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-charcoal ml-1">Email Address</label>
              <input
                type="email"
                disabled
                className="w-full p-4 bg-gray-100 border border-gray-200 rounded-2xl text-gray-500 cursor-not-allowed"
                value={user?.email || ''}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-charcoal text-white rounded-2xl font-bold flex items-center hover:bg-opacity-90 transition-all disabled:opacity-50"
            >
              {saved ? <><Check className="mr-2 w-5 h-5" /> Saved</> : loading ? 'Saving...' : 'Update Profile'}
            </button>
          </form>
        </section>

        {/* Preferences Section */}
        <section className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-serif font-bold mb-6 flex items-center">
            <Moon className="w-5 h-5 mr-2 text-gold" /> Preferences
          </h2>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
            <div className="flex items-center">
              {darkMode ? <Moon className="w-5 h-5 mr-3 text-gold" /> : <Sun className="w-5 h-5 mr-3 text-gold" />}
              <div>
                <p className="font-bold text-charcoal">Dark Mode</p>
                <p className="text-xs text-gray-500">Adjust the app's appearance</p>
              </div>
            </div>
            <button
              onClick={toggleDarkMode}
              className={`w-14 h-8 rounded-full p-1 transition-colors ${darkMode ? 'bg-gold' : 'bg-gray-300'}`}
            >
              <div className={`w-6 h-6 bg-white rounded-full transition-transform ${darkMode ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>
        </section>

        {/* Data Section */}
        <section className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-serif font-bold mb-6 flex items-center">
            <Share2 className="w-5 h-5 mr-2 text-gold" /> Data & Export
          </h2>
          <div className="space-y-4">
            <button
              onClick={handleExport}
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl flex items-center justify-between hover:bg-gray-100 transition-all group"
            >
              <div className="flex items-center">
                <Download className="w-5 h-5 mr-3 text-gray-400 group-hover:text-gold transition-colors" />
                <div className="text-left">
                  <p className="font-bold text-charcoal">Export Wardrobe</p>
                  <p className="text-xs text-gray-500">Download your saved outfits as JSON</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300" />
            </button>
          </div>
        </section>

        {/* Danger Zone */}
        <section className="bg-red-50 p-8 rounded-3xl border border-red-100">
          <h2 className="text-xl font-serif font-bold mb-6 text-red-800 flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" /> Danger Zone
          </h2>
          <button
            onClick={handleDeleteAccount}
            className="w-full p-4 bg-white border border-red-200 text-red-600 rounded-2xl font-bold flex items-center justify-center hover:bg-red-50 transition-all shadow-sm"
          >
            <Trash2 className="mr-2 w-5 h-5" /> Delete Account
          </button>
        </section>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-[2rem] max-w-sm w-full shadow-2xl">
            <h3 className="text-2xl font-serif font-bold mb-4">Delete Account?</h3>
            <p className="text-gray-500 mb-8">Are you sure you want to delete your account? This action is permanent and all your data will be lost.</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDeleteAccount}
                className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
