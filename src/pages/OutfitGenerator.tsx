import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { generateOutfit } from '../services/gemini';
import { Outfit } from '../types';
import { db, collection, addDoc, handleFirestoreError, OperationType } from '../firebase';
import { Sparkles, Save, RefreshCw, Share2, ArrowLeft, Check, AlertCircle, ShoppingBag, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function OutfitGenerator() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Outfit | null>(null);
  const [saved, setSaved] = useState(false);
  const [shared, setShared] = useState(false);
  const [error, setError] = useState('');
  const { user, isDemo } = useAuth();
  
  const [formData, setFormData] = useState({
    occasion: 'Casual',
    stylePersona: 'Minimalist',
    bodyType: '',
    budgetTier: 'Mid-range (₹2000–₹8000)',
    gender: 'Women',
    season: 'Summer',
    colorPreferences: ['Neutrals']
  });

  const occasions = ['Casual', 'Work', 'Wedding Guest', 'Date Night', 'Job Interview', 'Beach', 'Gym', 'Party', 'Travel', 'Formal Gala'];
  const personas = ['Minimalist', 'Streetwear', 'Boho', 'Classic', 'Y2K', 'Cottagecore', 'Luxe', 'Sporty'];
  const bodyTypes = ['Hourglass', 'Pear', 'Apple', 'Rectangle', 'Inverted Triangle'];
  const budgets = ['Budget (under ₹2000)', 'Mid-range (₹2000–₹8000)', 'Luxury (₹8000+)'];
  const colors = ['Neutrals', 'Bold', 'Pastels', 'Earth Tones', 'Monochrome'];

  const handleGenerate = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    setError('');
    setSaved(false);
    try {
      const outfit = await generateOutfit(formData);
      setResult(outfit);
    } catch (err: any) {
      setError('Failed to generate outfit. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!result || !user) return;
    try {
      const outfitData = {
        ...result,
        uid: user.uid,
        createdAt: new Date().toISOString(),
        rating: 5
      };
      
      if (isDemo) {
        const savedOutfits = JSON.parse(localStorage.getItem('styleai_demo_outfits') || '[]');
        localStorage.setItem('styleai_demo_outfits', JSON.stringify([...savedOutfits, { ...outfitData, id: Date.now().toString() }]));
      } else {
        await addDoc(collection(db, 'outfits'), outfitData);
      }
      setSaved(true);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'outfits');
    }
  };

  const handleShare = () => {
    if (!result) return;
    const text = `Check out this outfit StyleAI generated for me: ${result.outfitName} for ${result.occasion}!\n\nTop: ${result.pieces.top}\nBottom: ${result.pieces.bottom}\nShoes: ${result.pieces.shoes}\n\nStyling Tip: ${result.stylingTip}`;
    navigator.clipboard.writeText(text);
    setShared(true);
    setTimeout(() => setShared(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <AnimatePresence mode="wait">
        {!result ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100"
          >
            <div className="flex items-center mb-8">
              <Sparkles className="w-8 h-8 text-[#C9A84C] mr-3" />
              <h1 className="text-3xl font-serif font-bold">Outfit Generator</h1>
            </div>

            <form onSubmit={handleGenerate} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Occasion</label>
                <select
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#C9A84C]"
                  value={formData.occasion}
                  onChange={(e) => setFormData({ ...formData, occasion: e.target.value })}
                >
                  {occasions.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Style Persona</label>
                <select
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#C9A84C]"
                  value={formData.stylePersona}
                  onChange={(e) => setFormData({ ...formData, stylePersona: e.target.value })}
                >
                  {personas.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Body Type (Optional)</label>
                <select
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#C9A84C]"
                  value={formData.bodyType}
                  onChange={(e) => setFormData({ ...formData, bodyType: e.target.value })}
                >
                  <option value="">Select Body Type</option>
                  {bodyTypes.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Budget Tier</label>
                <select
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#C9A84C]"
                  value={formData.budgetTier}
                  onChange={(e) => setFormData({ ...formData, budgetTier: e.target.value })}
                >
                  {budgets.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Gender</label>
                <div className="flex gap-2">
                  {['Women', 'Men', 'Non-binary'].map(g => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setFormData({ ...formData, gender: g })}
                      className={`flex-1 py-2 rounded-xl border transition-all text-sm font-medium ${formData.gender === g ? 'bg-[#1C1C1E] text-white border-transparent' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Season</label>
                <select
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#C9A84C]"
                  value={formData.season}
                  onChange={(e) => setFormData({ ...formData, season: e.target.value })}
                >
                  {['Summer', 'Monsoon', 'Winter', 'Spring'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-bold text-gray-700">Color Preferences</label>
                <div className="flex flex-wrap gap-2">
                  {colors.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => {
                        const newColors = formData.colorPreferences.includes(c)
                          ? formData.colorPreferences.filter(item => item !== c)
                          : [...formData.colorPreferences, c];
                        setFormData({ ...formData, colorPreferences: newColors });
                      }}
                      className={`px-4 py-2 rounded-full border transition-all text-sm font-medium ${formData.colorPreferences.includes(c) ? 'bg-[#C9A84C] text-white border-transparent' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div className="md:col-span-2 pt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-[#1C1C1E] text-white rounded-2xl font-bold flex items-center justify-center hover:bg-opacity-90 transition-all shadow-lg disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="mr-2 w-5 h-5 animate-spin" />
                      Curating your perfect look...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 w-5 h-5" />
                      Generate Outfit
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        ) : (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            <button
              onClick={() => setResult(null)}
              className="flex items-center text-gray-500 hover:text-gray-900 font-medium"
            >
              <ArrowLeft className="mr-2 w-4 h-4" /> Back to form
            </button>

            <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
              <div className="p-8 bg-[#1C1C1E] text-white flex justify-between items-center">
                <div>
                  <h2 className="text-3xl font-serif font-bold text-[#C9A84C] mb-1">{result.outfitName}</h2>
                  <p className="text-gray-400 uppercase tracking-widest text-xs">{result.occasion} • {result.season}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleShare}
                    className={`p-3 rounded-2xl transition-all flex items-center ${shared ? 'bg-green-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
                    title="Share"
                  >
                    {shared ? <Check className="w-5 h-5" /> : <Share2 className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saved}
                    className={`p-3 rounded-2xl transition-all flex items-center ${saved ? 'bg-green-500 text-white' : 'bg-[#C9A84C] text-white hover:bg-opacity-90'}`}
                  >
                    {saved ? <Check className="w-5 h-5" /> : <Save className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <h3 className="text-xl font-serif font-bold border-b border-gray-100 pb-2">The Look</h3>
                  <div className="space-y-4">
                    {[
                      { label: 'Top', value: result.pieces.top },
                      { label: 'Bottom', value: result.pieces.bottom },
                      { label: 'Shoes', value: result.pieces.shoes },
                      { label: 'Bag', value: result.pieces.bag },
                      { label: 'Accessories', value: result.pieces.accessories },
                      { label: 'Outerwear', value: result.pieces.outerwear },
                    ].map((item, i) => item.value && (
                      <div key={i} className="flex gap-4 items-start">
                        <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center flex-shrink-0 text-xs font-bold text-gray-400">
                          {i + 1}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{item.label}</p>
                          <p className="text-gray-800 font-medium">{item.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Color Palette</p>
                    <div className="flex gap-2">
                      {result.colorPalette.map((color, i) => (
                        <div key={i} className="w-10 h-10 rounded-2xl shadow-inner border border-gray-100" style={{ backgroundColor: color }} title={color} />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="bg-orange-50 p-6 rounded-3xl border border-orange-100">
                    <h4 className="flex items-center text-orange-800 font-bold mb-2">
                      <Info className="w-4 h-4 mr-2" /> Styling Tip
                    </h4>
                    <p className="text-orange-900 italic leading-relaxed">"{result.stylingTip}"</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Estimated Budget</p>
                      <p className="text-2xl font-bold text-[#1C1C1E]">{result.budgetRange}</p>
                    </div>
                    
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Where to Shop</p>
                      <div className="flex flex-wrap gap-2">
                        {result.shopAt.map(shop => (
                          <span key={shop} className="px-4 py-2 bg-gray-100 rounded-xl text-sm font-bold text-gray-700 flex items-center">
                            <ShoppingBag className="w-3 h-3 mr-2" /> {shop}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleGenerate}
                    disabled={loading}
                    className="w-full py-4 bg-white border-2 border-[#1C1C1E] text-[#1C1C1E] rounded-2xl font-bold flex items-center justify-center hover:bg-gray-50 transition-all"
                  >
                    <RefreshCw className={`mr-2 w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    Regenerate Look
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <div className="mt-6 p-4 bg-red-50 text-red-600 rounded-2xl flex items-center border border-red-100">
          <AlertCircle className="w-5 h-5 mr-2" /> {error}
        </div>
      )}
    </div>
  );
}
