import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Outfit } from '../types';
import { Link } from 'react-router-dom';
import { Plus, History, Calendar, Shirt, ArrowRight, Star } from 'lucide-react';
import { motion } from 'motion/react';
import { db, collection, query, where, onSnapshot, handleFirestoreError, OperationType } from '../firebase';

export default function Dashboard() {
  const [recentOutfits, setRecentOutfits] = useState<Outfit[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, userProfile, isDemo } = useAuth();

  useEffect(() => {
    if (!user) return;

    if (isDemo) {
      const saved = JSON.parse(localStorage.getItem('styleai_demo_outfits') || '[]');
      const sorted = saved.sort((a: any, b: any) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ).slice(0, 3);
      setRecentOutfits(sorted);
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'outfits'), where('uid', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const outfits = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Outfit[];
      
      // Sort by createdAt descending and take top 3
      const sorted = outfits.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ).slice(0, 3);
      
      setRecentOutfits(sorted);
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'outfits');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const quickActions = [
    { title: 'Generate Outfit', desc: 'AI-curated looks for any event', icon: Shirt, link: '/generator', color: 'bg-gold/10 text-gold' },
    { title: 'Filters & Search', desc: 'Find styles in your collection', icon: History, link: '/filters', color: 'bg-gold/10 text-gold' },
    { title: 'Settings', desc: 'Manage profile & preferences', icon: Calendar, link: '/settings', color: 'bg-charcoal/5 text-charcoal' },
  ];

  return (
    <div className="space-y-12">
      <header className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="text-center md:text-left">
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-3">
            Welcome back, <span className="text-gold">{user?.displayName || 'Stylist'}</span>
          </h1>
          <p className="text-gray-500 text-lg">Ready to discover your next perfect look today?</p>
        </div>
        <Link
          to="/generator"
          className="bg-charcoal text-white px-10 py-5 rounded-2xl font-bold flex items-center hover:bg-opacity-90 transition-all shadow-xl"
        >
          <Plus className="mr-2 w-6 h-6" /> Generate New Outfit
        </Link>
      </header>

      <section>
        <h2 className="text-3xl font-serif font-bold mb-8 flex items-center">
          Quick Actions <ArrowRight className="ml-3 w-6 h-6 text-gray-300" />
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {quickActions.map((action, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -8 }}
              className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 hover:shadow-md transition-all group"
            >
              <Link to={action.link} className="block">
                <div className={`w-14 h-14 rounded-2xl ${action.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <action.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold mb-2">{action.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{action.desc}</p>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      <section>
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-serif font-bold flex items-center">
            Recent Outfits <History className="ml-3 w-6 h-6 text-gray-300" />
          </h2>
          <Link to="/wardrobe" className="text-gold font-bold hover:underline text-lg">View All</Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white p-6 rounded-[2rem] border border-gray-100 h-80 shimmer" />
            ))}
          </div>
        ) : recentOutfits.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {recentOutfits.slice(0, 3).map((outfit, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 hover:shadow-md transition-all relative overflow-hidden group"
              >
                <div className="aspect-[4/5] bg-gray-50 rounded-2xl mb-6 flex items-center justify-center text-gray-200 relative overflow-hidden">
                  <Shirt className="w-16 h-16 opacity-20" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent flex gap-2">
                    {outfit.colorPalette.map((color, idx) => (
                      <div key={idx} className="w-6 h-6 rounded-full border-2 border-white/80 shadow-sm" style={{ backgroundColor: color }} />
                    ))}
                  </div>
                </div>
                <h3 className="font-bold text-2xl mb-2 truncate">{outfit.outfitName}</h3>
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-400 uppercase font-bold tracking-widest">{outfit.occasion}</p>
                  <div className="flex items-center text-gold">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="text-sm ml-1 font-bold">{outfit.rating || 5}.0</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-white p-20 rounded-[2.5rem] border-2 border-dashed border-gray-200 text-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Shirt className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-2xl font-bold mb-3 text-gray-400">No outfits generated yet</h3>
            <p className="text-gray-400 mb-8 text-lg">Start your style journey by generating your first outfit!</p>
            <Link
              to="/generator"
              className="inline-flex items-center bg-gold text-white px-8 py-4 rounded-2xl font-bold hover:bg-opacity-90 transition-all shadow-lg"
            >
              Get Started <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
