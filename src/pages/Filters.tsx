import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Outfit } from '../types';
import { Search, Filter, Shirt, Star, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, collection, query, where, onSnapshot, handleFirestoreError, OperationType } from '../firebase';

export default function Filters() {
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [filteredOutfits, setFilteredOutfits] = useState<Outfit[]>([]);
  const [search, setSearch] = useState('');
  const [selectedOutfit, setSelectedOutfit] = useState<Outfit | null>(null);
  const { user, isDemo } = useAuth();

  const [filters, setFilters] = useState({
    occasion: 'All',
    season: 'All',
    budget: 'All',
    persona: 'All'
  });

  const occasions = ['All', 'Casual', 'Work', 'Wedding Guest', 'Date Night', 'Job Interview', 'Beach', 'Gym', 'Party', 'Travel', 'Formal Gala'];
  const seasons = ['All', 'Summer', 'Monsoon', 'Winter', 'Spring'];
  const budgets = ['All', 'Budget (under ₹2000)', 'Mid-range (₹2000–₹8000)', 'Luxury (₹8000+)'];
  const personas = ['All', 'Minimalist', 'Streetwear', 'Boho', 'Classic', 'Y2K', 'Cottagecore', 'Luxe', 'Sporty'];

  useEffect(() => {
    if (!user) return;

    if (isDemo) {
      const saved = JSON.parse(localStorage.getItem('styleai_demo_outfits') || '[]');
      setOutfits(saved);
      return;
    }

    const q = query(collection(db, 'outfits'), where('uid', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const outfitsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Outfit[];
      setOutfits(outfitsData);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'outfits');
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    let result = outfits;

    if (search) {
      result = result.filter(o => 
        o.outfitName.toLowerCase().includes(search.toLowerCase()) ||
        o.occasion.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (filters.occasion !== 'All') {
      result = result.filter(o => o.occasion === filters.occasion);
    }

    if (filters.season !== 'All') {
      result = result.filter(o => o.season === filters.season);
    }

    if (filters.budget !== 'All') {
      result = result.filter(o => o.budgetRange.includes(filters.budget.split(' ')[0]));
    }

    setFilteredOutfits(result);
  }, [search, filters, outfits]);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-serif font-bold mb-2">Filters & Search</h1>
        <p className="text-gray-500">Find the perfect look from your collection</p>
      </header>

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or occasion..."
            className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Occasion</label>
            <select
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-gold/20"
              value={filters.occasion}
              onChange={(e) => setFilters({ ...filters, occasion: e.target.value })}
            >
              {occasions.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Season</label>
            <select
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-gold/20"
              value={filters.season}
              onChange={(e) => setFilters({ ...filters, season: e.target.value })}
            >
              {seasons.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Budget</label>
            <select
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-gold/20"
              value={filters.budget}
              onChange={(e) => setFilters({ ...filters, budget: e.target.value })}
            >
              {budgets.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Persona</label>
            <select
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-gold/20"
              value={filters.persona}
              onChange={(e) => setFilters({ ...filters, persona: e.target.value })}
            >
              {personas.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>
      </div>

      {filteredOutfits.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredOutfits.map((outfit, i) => (
            <motion.div
              key={outfit.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setSelectedOutfit(outfit)}
              className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="aspect-[3/4] bg-gray-50 rounded-2xl mb-4 flex items-center justify-center text-gray-300 relative overflow-hidden">
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
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/50 to-transparent flex gap-1">
                  {outfit.colorPalette.map((color, idx) => (
                    <div key={idx} className="w-4 h-4 rounded-full border border-white/50" style={{ backgroundColor: color }} />
                  ))}
                </div>
              </div>
              <h3 className="font-bold text-lg mb-1 truncate">{outfit.outfitName}</h3>
              <div className="flex justify-between items-center">
                <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">{outfit.occasion}</p>
                <div className="flex items-center text-yellow-500 bg-yellow-50 px-2 py-1 rounded-lg">
                  <Star className="w-3 h-3 fill-current" />
                  <span className="text-xs ml-1 font-bold">{outfit.rating || 5}.0</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="bg-white p-20 rounded-3xl border-2 border-dashed border-gray-200 text-center">
          <Filter className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-400">No matching outfits</h3>
          <p className="text-gray-400">Try adjusting your filters or search terms.</p>
        </div>
      )}

      <AnimatePresence>
        {selectedOutfit && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedOutfit(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="md:w-1/2 aspect-[3/4] bg-gray-100 relative">
                {selectedOutfit.imageUrl ? (
                  <img 
                    src={selectedOutfit.imageUrl} 
                    alt={selectedOutfit.outfitName}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <img 
                    src={`https://picsum.photos/seed/${encodeURIComponent(selectedOutfit.outfitName)}/800/1200`}
                    alt={selectedOutfit.outfitName}
                    className="w-full h-full object-cover opacity-60"
                    referrerPolicy="no-referrer"
                  />
                )}
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/60 to-transparent">
                  <h2 className="text-3xl font-serif font-bold text-white mb-1">{selectedOutfit.outfitName}</h2>
                  <p className="text-gold uppercase tracking-widest text-xs font-bold">{selectedOutfit.occasion} • {selectedOutfit.season}</p>
                </div>
              </div>

              <div className="md:w-1/2 p-8 overflow-y-auto max-h-[80vh] custom-scrollbar">
                <div className="flex justify-between items-start mb-6">
                  <h3 className="text-xl font-serif font-bold border-b border-gray-100 pb-2 flex-1">The Look</h3>
                  <button onClick={() => setSelectedOutfit(null)} className="p-2 hover:bg-gray-100 rounded-full ml-4">
                    <X className="w-6 h-6 text-gray-400" />
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-8">
                  <div className="space-y-4">
                    <ul className="space-y-3">
                      {Object.entries(selectedOutfit.pieces).map(([key, val]) => val && (
                        <li key={key} className="flex items-start gap-3">
                          <div className="w-2 h-2 rounded-full bg-gold mt-2" />
                          <div>
                            <p className="text-xs font-bold text-gray-400 capitalize">{key}</p>
                            <p className="text-sm font-medium text-charcoal">{val}</p>
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
