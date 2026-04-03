import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { generateWeeklyPlan } from '../services/gemini';
import { Outfit, WeeklyPlan } from '../types';
import { db, collection, addDoc, query, where, onSnapshot, deleteDoc, doc, handleFirestoreError, OperationType } from '../firebase';
import { Calendar, Sparkles, Save, RefreshCw, ChevronRight, X, Shirt, Plus, Download, AlertCircle, Check } from 'lucide-react';
import { motion } from 'motion/react';

export default function WeeklyPlanner() {
  const [loading, setLoading] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<{ [day: string]: Outfit } | null>(null);
  const [savedPlans, setSavedPlans] = useState<WeeklyPlan[]>([]);
  const [success, setSuccess] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [tripType, setTripType] = useState('Work Week');
  const [context, setContext] = useState('Work week in Mumbai, humid weather, formal meetings');
  const [error, setError] = useState('');
  const { user, isDemo } = useAuth();

  useEffect(() => {
    if (!user) return;
    
    if (isDemo) {
      const saved = JSON.parse(localStorage.getItem('styleai_demo_plans') || '[]');
      setSavedPlans(saved);
      return;
    }

    const q = query(collection(db, 'weeklyPlans'), where('uid', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const plans = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as WeeklyPlan[];
      setSavedPlans(plans);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'weeklyPlans');
    });

    return () => unsubscribe();
  }, [user]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const plan = await generateWeeklyPlan({ tripType, context });
      setCurrentPlan(plan);
    } catch (err: any) {
      setError('Failed to generate plan. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePlan = async () => {
    if (!currentPlan || !user) return;
    try {
      const newPlan = {
        title: tripType,
        context: context,
        outfits: currentPlan,
        uid: user.uid,
        createdAt: new Date().toISOString()
      };
      
      if (isDemo) {
        const saved = JSON.parse(localStorage.getItem('styleai_demo_plans') || '[]');
        const updated = [...saved, { ...newPlan, id: Date.now().toString() }];
        localStorage.setItem('styleai_demo_plans', JSON.stringify(updated));
        setSavedPlans(updated as WeeklyPlan[]);
      } else {
        await addDoc(collection(db, 'weeklyPlans'), newPlan);
      }
      setCurrentPlan(null);
      setSuccess('Weekly plan saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'weeklyPlans');
    }
  };

  const handleDeletePlan = async (id: string) => {
    if (!user) return;
    setDeletingId(id);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    try {
      if (isDemo) {
        const saved = JSON.parse(localStorage.getItem('styleai_demo_plans') || '[]');
        const updated = saved.filter((p: any) => p.id !== deletingId);
        localStorage.setItem('styleai_demo_plans', JSON.stringify(updated));
        setSavedPlans(updated);
      } else {
        await deleteDoc(doc(db, 'weeklyPlans', deletingId));
      }
      setDeletingId(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `weeklyPlans/${deletingId}`);
      setDeletingId(null);
    }
  };

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <div className="space-y-12">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
        <div>
          <h1 className="text-4xl font-serif font-bold mb-3">Weekly Planner</h1>
          <p className="text-gray-500 text-lg">Plan your looks for the entire week with AI</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setCurrentPlan(null)}
            className="px-8 py-4 bg-white border border-gray-200 rounded-2xl font-bold text-charcoal hover:bg-gray-50 transition-all shadow-sm"
          >
            New Plan
          </button>
        </div>
      </header>

      {!currentPlan ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-1">
            <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-100 sticky top-28">
              <h2 className="text-2xl font-serif font-bold mb-8 flex items-center">
                <Plus className="w-6 h-6 mr-3 text-gold" /> Create New Plan
              </h2>
              <form onSubmit={handleGenerate} className="space-y-8">
                <div className="space-y-3">
                  <label className="text-sm font-bold text-charcoal ml-1">Trip / Week Type</label>
                  <input
                    type="text"
                    placeholder="e.g. Work Week in Delhi"
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold transition-all"
                    value={tripType}
                    onChange={(e) => setTripType(e.target.value)}
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-bold text-charcoal ml-1">Context & Details</label>
                  <textarea
                    rows={5}
                    placeholder="e.g. 5 days of office, 2 days of sightseeing, winter weather..."
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold transition-all resize-none"
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-5 bg-charcoal text-white rounded-2xl font-bold flex items-center justify-center hover:bg-opacity-90 transition-all shadow-xl disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="mr-3 w-6 h-6 animate-spin" />
                      Planning your week...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-3 w-6 h-6" />
                      Generate 7-Day Plan
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-8">
            <h2 className="text-2xl font-serif font-bold flex items-center">
              <Calendar className="w-6 h-6 mr-3 text-gold" /> Saved Plans
            </h2>
            {savedPlans.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {savedPlans.map((plan, i) => (
                  <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 hover:shadow-md transition-all group"
                  >
                    <div className="flex justify-between items-start mb-6">
                      <div className="w-12 h-12 bg-gold/10 rounded-2xl flex items-center justify-center text-gold">
                        <Calendar className="w-6 h-6" />
                      </div>
                      <button 
                        onClick={() => handleDeletePlan(plan.id!)}
                        className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <h3 className="text-xl font-bold mb-2">{plan.title}</h3>
                    <p className="text-sm text-gray-500 mb-6 line-clamp-2 leading-relaxed">{plan.context}</p>
                    <button 
                      onClick={() => setCurrentPlan(plan.outfits)}
                      className="w-full py-3 bg-gray-50 text-charcoal rounded-xl text-sm font-bold flex items-center justify-center hover:bg-gray-100 transition-all"
                    >
                      View Plan <ChevronRight className="ml-1 w-4 h-4" />
                    </button>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="bg-white p-20 rounded-[2.5rem] border-2 border-dashed border-gray-200 text-center">
                <Calendar className="w-16 h-16 text-gray-200 mx-auto mb-6" />
                <p className="text-gray-400 text-lg">No saved plans yet. Create your first one!</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-10"
        >
          <div className="bg-charcoal p-10 rounded-[2.5rem] text-white flex flex-col md:flex-row justify-between items-center gap-8 shadow-2xl">
            <div>
              <h2 className="text-4xl font-serif font-bold text-gold mb-3">{tripType}</h2>
              <p className="text-gray-400 text-lg max-w-xl leading-relaxed">{context}</p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={handleSavePlan}
                className="px-8 py-4 bg-gold text-white rounded-2xl font-bold flex items-center hover:bg-opacity-90 transition-all shadow-lg"
              >
                <Save className="mr-2 w-6 h-6" /> Save Plan
              </button>
              <button className="px-8 py-4 bg-white/10 text-white rounded-2xl font-bold flex items-center hover:bg-white/20 transition-all">
                <Download className="mr-2 w-6 h-6" /> Export PDF
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-6">
            {days.map((day, i) => {
              const outfit = currentPlan[day];
              return (
                <motion.div
                  key={day}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col h-full hover:shadow-md transition-all"
                >
                  <div className="text-xs font-bold text-gold uppercase tracking-[0.2em] mb-4 border-b border-gray-50 pb-3">
                    {day}
                  </div>
                  {outfit ? (
                    <div className="flex-1 flex flex-col">
                      <div className="aspect-[3/4] bg-gray-50 rounded-2xl mb-4 overflow-hidden relative group">
                        {outfit.imageUrl ? (
                          <img 
                            src={outfit.imageUrl} 
                            alt={outfit.outfitName}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <img 
                            src={`https://picsum.photos/seed/${encodeURIComponent(outfit.outfitName)}/800/1200`}
                            alt={outfit.outfitName}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-60"
                            referrerPolicy="no-referrer"
                          />
                        )}
                        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/50 to-transparent flex gap-1">
                          {outfit.colorPalette?.slice(0, 3).map((color, idx) => (
                            <div key={idx} className="w-3 h-3 rounded-full border border-white/50" style={{ backgroundColor: color }} />
                          ))}
                        </div>
                      </div>
                      <h4 className="font-bold text-charcoal text-lg mb-3 line-clamp-2">{outfit.outfitName}</h4>
                      <div className="flex-1 space-y-4 mb-6">
                        <div>
                          <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">Top</div>
                          <p className="text-sm text-gray-600 line-clamp-2 font-medium">{outfit.pieces.top}</p>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">Bottom</div>
                          <p className="text-sm text-gray-600 line-clamp-2 font-medium">{outfit.pieces.bottom}</p>
                        </div>
                      </div>
                      <div className="mt-auto pt-4 border-t border-gray-50">
                        <p className="text-xs italic text-gray-400 line-clamp-3 leading-relaxed">"{outfit.stylingTip}"</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-300">
                      <Shirt className="w-10 h-10 opacity-10" />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" /> {error}
        </div>
      )}

      {success && (
        <div className="fixed bottom-8 right-8 p-4 bg-green-500 text-white rounded-2xl shadow-2xl flex items-center z-50 animate-bounce">
          <Check className="w-5 h-5 mr-2" /> {success}
        </div>
      )}

      {deletingId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-[2rem] max-w-sm w-full shadow-2xl">
            <h3 className="text-2xl font-serif font-bold mb-4">Delete Plan?</h3>
            <p className="text-gray-500 mb-8">Are you sure you want to delete this weekly plan? This action cannot be undone.</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setDeletingId(null)}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
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
