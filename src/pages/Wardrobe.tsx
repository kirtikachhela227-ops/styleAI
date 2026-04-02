import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Outfit } from '../types';
import { db, collection, query, where, deleteDoc, doc, onSnapshot, handleFirestoreError, OperationType } from '../firebase';
import { Shirt, Trash2, Calendar, ShoppingBag, Star, Filter, Search, X, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Wardrobe() {
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOutfit, setSelectedOutfit] = useState<Outfit | null>(null);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { user, isDemo } = useAuth();

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    if (isDemo) {
      const saved = JSON.parse(localStorage.getItem('styleai_demo_outfits') || '[]');
      setOutfits(saved);
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'outfits'), where('uid', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const outfitsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Outfit[];
      setOutfits(outfitsData);
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'outfits');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    setDeletingId(id);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    try {
      if (isDemo) {
        const saved = JSON.parse(localStorage.getItem('styleai_demo_outfits') || '[]');
        const updated = saved.filter((o: any) => o.id !== deletingId);
        localStorage.setItem('styleai_demo_outfits', JSON.stringify(updated));
        setOutfits(updated);
      } else {
        await deleteDoc(doc(db, 'outfits', deletingId));
      }
      if (selectedOutfit?.id === deletingId) setSelectedOutfit(null);
      setDeletingId(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `outfits/${deletingId}`);
      setDeletingId(null);
    }
  };

  const filteredOutfits = outfits.filter(o => {
    const matchesFilter = filter === 'All' || o.occasion === filter || o.season === filter;
    const matchesSearch = o.outfitName.toLowerCase().includes(search.toLowerCase()) || 
                         o.occasion.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const occasions = ['All', 'Casual', 'Work', 'Wedding Guest', 'Date Night', 'Job Interview', 'Beach', 'Gym', 'Party', 'Travel', 'Formal Gala'];

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-serif font-bold mb-2">My Wardrobe</h1>
          <p className="text-gray-500">Your curated collection of AI-generated styles</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {occasions.slice(0, 5).map(o => (
            <button
              key={o}
              onClick={() => setFilter(o)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${filter === o ? 'bg-[#C9A84C] text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
            >
              {o}
            </button>
          ))}
        </div>
      </header>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search your wardrobe..."
          className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#C9A84C] shadow-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="bg-white p-4 rounded-3xl border border-gray-100 h-64 shimmer" />
          ))}
        </div>
      ) : filteredOutfits.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredOutfits.map((outfit, i) => (
            <motion.div
              key={outfit.id}
              layoutId={outfit.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setSelectedOutfit(outfit)}
              className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer group relative"
            >
              <div className="aspect-[3/4] bg-gray-50 rounded-2xl mb-4 flex items-center justify-center text-gray-300 relative overflow-hidden">
                <Shirt className="w-12 h-12" />
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => handleDelete(outfit.id!, e)}
                    className="p-2 bg-white/90 text-red-500 rounded-xl hover:bg-red-50 shadow-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/50 to-transparent flex gap-1">
                  {outfit.colorPalette.map((color, idx) => (
                    <div key={idx} className="w-4 h-4 rounded-full border border-white/50" style={{ backgroundColor: color }} />
                  ))}
                </div>
              </div>
              <h3 className="font-bold text-lg mb-1 truncate">{outfit.outfitName}</h3>
              <div className="flex justify-between items-center">
                <p className="text-xs text-gray-500 uppercase tracking-wider">{outfit.occasion}</p>
                <div className="flex items-center text-yellow-500">
                  <Star className="w-3 h-3 fill-current" />
                  <span className="text-xs ml-1 font-bold">{outfit.rating || 5}.0</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="bg-white p-20 rounded-3xl border-2 border-dashed border-gray-200 text-center">
          <Shirt className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-400">No outfits found</h3>
          <p className="text-gray-400">Try adjusting your filters or generate a new look!</p>
        </div>
      )}

      <AnimatePresence>
        {deletingId && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[70] p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white p-8 rounded-[2rem] max-w-sm w-full shadow-2xl"
            >
              <h3 className="text-2xl font-serif font-bold mb-4">Delete Outfit?</h3>
              <p className="text-gray-500 mb-8">Are you sure you want to delete this outfit from your wardrobe? This action cannot be undone.</p>
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
            </motion.div>
          </motion.div>
        )}

        {selectedOutfit && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedOutfit(null)}
          >
            <motion.div
              layoutId={selectedOutfit.id}
              className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-8 bg-[#1C1C1E] text-white flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-serif font-bold text-[#C9A84C]">{selectedOutfit.outfitName}</h2>
                  <p className="text-gray-400 text-sm uppercase tracking-widest">{selectedOutfit.occasion} • {selectedOutfit.season}</p>
                </div>
                <button onClick={() => setSelectedOutfit(null)} className="p-2 hover:bg-white/10 rounded-full">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">The Look</h4>
                  <ul className="space-y-3">
                    {Object.entries(selectedOutfit.pieces).map(([key, val]) => val && (
                      <li key={key} className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-[#C9A84C] mt-2" />
                        <div>
                          <p className="text-xs font-bold text-gray-400 capitalize">{key}</p>
                          <p className="text-sm font-medium text-gray-800">{val}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-6">
                  <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100">
                    <p className="text-xs font-bold text-orange-800 uppercase mb-1">Styling Tip</p>
                    <p className="text-sm text-orange-900 italic">"{selectedOutfit.stylingTip}"</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase mb-2">Shop At</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedOutfit.shopAt.map(shop => (
                        <span key={shop} className="px-3 py-1 bg-gray-100 rounded-lg text-xs font-bold text-gray-600">
                          {shop}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="pt-4 flex items-center justify-between border-t border-gray-100">
                    <p className="text-lg font-bold text-[#1C1C1E]">{selectedOutfit.budgetRange}</p>
                    <div className="flex items-center text-yellow-500">
                      {[1, 2, 3, 4, 5].map(i => (
                        <Star key={i} className={`w-4 h-4 ${i <= (selectedOutfit.rating || 5) ? 'fill-current' : 'text-gray-200'}`} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
