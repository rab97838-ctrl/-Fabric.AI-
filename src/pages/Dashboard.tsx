import React, { useEffect, useState } from "react";
import { collection, onSnapshot, query, where, orderBy, addDoc, serverTimestamp, deleteDoc, doc } from "firebase/firestore";
import { Plus, Image as ImageIcon, Layout, Box, Clock, Trash2, Download, ExternalLink, X } from "lucide-react";
import { Link } from "react-router-dom";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { User, Mockup, Logo, ProductBase } from "../types";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";

interface DashboardProps {
  user: User;
}

export function Dashboard({ user }: DashboardProps) {
  const [mockups, setMockups] = useState<Mockup[]>([]);
  const [logos, setLogos] = useState<Logo[]>([]);
  const [activeTab, setActiveTab] = useState<'mockups' | 'assets'>('mockups');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const mockupsPath = `users/${user.uid}/mockups`;
    const mockupsQuery = query(
      collection(db, mockupsPath),
      where("ownerId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubMockups = onSnapshot(mockupsQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Mockup));
      setMockups(data);
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, mockupsPath);
    });

    const logosPath = `users/${user.uid}/logos`;
    const logosQuery = query(
      collection(db, logosPath),
      where("ownerId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubLogos = onSnapshot(logosQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Logo));
      setLogos(data);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, logosPath);
    });

    return () => {
      unsubMockups();
      unsubLogos();
    };
  }, [user.uid]);

  return (
    <div className="container mx-auto px-10 py-16 max-w-7xl">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16 border-b border-zinc-800 pb-12">
        <div className="flex flex-col gap-4">
          <div className="px-3 py-1 border border-accent/30 w-max text-[10px] uppercase tracking-[0.3em] text-accent font-mono">
            Auth: {user.displayName || user.email}
          </div>
          <h1 className="text-6xl font-display font-black text-white tracking-tighter uppercase leading-none">
            GALLERY<span className="text-stroke text-transparent ml-4">01</span>
          </h1>
          <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest">Repository of generated physical assets</p>
        </div>
        
        <Link 
          to="/create"
          className="flex items-center justify-center gap-3 bg-accent text-black px-8 py-4 font-black uppercase tracking-tighter text-lg hover:bg-white transition-all active:scale-95 shadow-xl shadow-accent/10"
        >
          <Plus className="w-6 h-6" />
          New Generation
        </Link>
      </header>

      {/* Tabs */}
      <div className="flex gap-8 mb-12 border-b border-zinc-800">
        <button 
          onClick={() => setActiveTab('mockups')}
          className={cn(
            "pb-6 text-xs font-black uppercase tracking-[0.2em] transition-all border-b-2 relative",
            activeTab === 'mockups' ? "border-accent text-white" : "border-transparent text-zinc-500 hover:text-zinc-300"
          )}
        >
          Mockups
          <span className="ml-3 text-[10px] font-mono opacity-50">[{mockups.length}]</span>
        </button>
        <button 
          onClick={() => setActiveTab('assets')}
          className={cn(
            "pb-6 text-xs font-black uppercase tracking-[0.2em] transition-all border-b-2 relative",
            activeTab === 'assets' ? "border-accent text-white" : "border-transparent text-zinc-500 hover:text-zinc-300"
          )}
        >
          Logos
          <span className="ml-3 text-[10px] font-mono opacity-50">[{logos.length}]</span>
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => (
            <div key={i} className="aspect-square rounded-3xl bg-neutral-900 animate-pulse border border-neutral-800" />
          ))}
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {activeTab === 'mockups' ? (
            <motion.div 
              key="mockups"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
            >
              {mockups.length === 0 ? (
                <EmptyState 
                  icon={<ImageIcon className="w-8 h-8" />}
                  title="No mockups yet"
                  description="Start a new project to see your creations here."
                  action={<Link to="/create" className="text-orange-500 font-bold hover:underline">Get started &rarr;</Link>}
                />
              ) : (
                mockups.map(mockup => (
                  <MockupCard key={mockup.id} mockup={mockup} />
                ))
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="assets"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-12"
            >
              <div>
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-orange-500" />
                  Your Logos
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                  {logos.map(logo => (
                    <div key={logo.id} className="group relative aspect-square rounded-2xl overflow-hidden bg-neutral-900 border border-neutral-800 hover:border-accent/50 transition-all">
                      <img 
                        src={logo.imageUrl} 
                        alt={logo.name} 
                        className="w-full h-full object-contain p-4 grayscale hover:grayscale-0 transition-all"
                        referrerPolicy="no-referrer"
                      />
                      <button 
                        onClick={async (e) => {
                          e.preventDefault();
                          const path = `users/${user.uid}/logos/${logo.id}`;
                          try {
                            await deleteDoc(doc(db, path));
                          } catch (err) {
                            handleFirestoreError(err, OperationType.DELETE, path);
                          }
                        }}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white/50 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                      <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-[10px] font-bold text-white truncate px-1">{logo.name}</p>
                      </div>
                    </div>
                  ))}
                  <label className="aspect-square rounded-2xl border-2 border-dashed border-zinc-800 hover:border-accent/50 flex flex-col items-center justify-center gap-2 text-zinc-600 hover:text-accent transition-all active:scale-95 group cursor-pointer relative overflow-hidden">
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*" 
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        
                        // Show some feedback (optional: could add a local loading state)
                        const reader = new FileReader();
                        reader.onload = async (event) => {
                          const base64 = event.target?.result as string;
                          const logosPath = `users/${user.uid}/logos`;
                          try {
                            await addDoc(collection(db, logosPath), {
                              id: crypto.randomUUID(),
                              name: file.name,
                              imageUrl: base64,
                              ownerId: user.uid,
                              createdAt: serverTimestamp(),
                            });
                          } catch (err) {
                            handleFirestoreError(err, OperationType.WRITE, logosPath);
                          }
                        };
                        reader.readAsDataURL(file);
                      }}
                    />
                    <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Upload Logo</span>
                  </label>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}

const MockupCard: React.FC<{ mockup: Mockup }> = ({ mockup }) => {
  return (
    <motion.div 
      layout
      className="group relative flex flex-col bg-zinc-900 border border-zinc-800 hover:border-accent transition-all animate-in fade-in slide-in-from-bottom-4"
    >
      <div className="aspect-[4/5] overflow-hidden bg-zinc-950 relative border-b border-zinc-800">
        {mockup.status === 'processing' ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-accent">Processing</span>
          </div>
        ) : (
          <>
            <img 
              src={mockup.resultUrl} 
              alt="Result" 
              className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-accent/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
              <button className="w-12 h-12 bg-white text-black flex items-center justify-center hover:scale-110 active:scale-90 transition-transform">
                <Download className="w-5 h-5" />
              </button>
            </div>
          </>
        )}
      </div>
      <div className="p-4 flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">{mockup.id.slice(0,8)}</span>
          <p className="text-[10px] font-black text-white uppercase tracking-tighter">Rendered Output</p>
        </div>
        <div className="w-2 h-2 rounded-full bg-accent shadow-[0_0_10px_rgba(217,253,82,0.5)]" />
      </div>
    </motion.div>
  );
}

const EmptyState: React.FC<{ icon: React.ReactNode, title: string, description: string, action?: React.ReactNode }> = ({ icon, title, description, action }) => {
  return (
    <div className="col-span-full py-32 flex flex-col items-center text-center border-2 border-dashed border-zinc-800 bg-zinc-900/10">
      <div className="w-20 h-20 bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-700 mb-8 transform rotate-3">
        {icon}
      </div>
      <h3 className="text-2xl font-display font-black text-white mb-4 uppercase tracking-tighter">{title}</h3>
      <p className="text-zinc-500 mb-10 max-w-xs font-mono text-xs uppercase tracking-widest leading-relaxed">{description}</p>
      {action}
    </div>
  );
}
