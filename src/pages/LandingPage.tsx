import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowRight, Sparkles, Layers, ShieldCheck, Download } from "lucide-react";
import { User } from "../types";
import { signIn } from "../lib/firebase";

interface LandingPageProps {
  user: User | null;
}

export function LandingPage({ user }: LandingPageProps) {
  const navigate = useNavigate();

  const handleStart = async () => {
    if (user) {
      navigate("/dashboard");
    } else {
      try {
        await signIn();
        navigate("/dashboard");
      } catch (error) {
        console.error(error);
      }
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-80px)] border-[16px] border-[#121212]">
      <main className="flex-grow flex flex-col md:flex-row">
        {/* Left Section: Hero Content */}
        <section className="w-full md:w-3/5 p-12 lg:p-20 flex flex-col justify-center bg-surface">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 px-3 py-1 border border-zinc-700 w-max text-[10px] uppercase tracking-[0.3em] text-accent font-mono"
          >
            v3.2 Engine Active
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-6xl md:text-8xl font-display font-black leading-[0.9] tracking-tighter mb-8 text-white"
          >
            CREATE <br/>
            <span className="text-stroke text-transparent">REALISTIC</span> <br/>
            MOCKUPS
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-zinc-400 text-lg md:text-xl leading-relaxed mb-12 max-w-md font-sans"
          >
            Upload your logos and products, and let our AI composite them perfectly with realistic lighting, shadows, and warping.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col sm:flex-row items-center gap-8"
          >
            <button 
              onClick={handleStart}
              className="bg-accent text-black px-12 py-5 font-black uppercase tracking-tighter text-xl hover:bg-white transition-colors active:scale-95 flex items-center gap-4"
            >
              Start Creating
              <ArrowRight className="w-6 h-6" />
            </button>
            <div className="flex -space-x-3 items-center">
              {[1,2,3].map(i => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-surface bg-zinc-800" />
              ))}
              <div className="flex items-center justify-center ml-4 text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
                +2k Designers
              </div>
            </div>
          </motion.div>
        </section>

        {/* Right Section: Visual Visualizer */}
        <section className="w-full md:w-2/5 relative border-t md:border-t-0 md:border-l border-zinc-800 bg-[#0A0A0A] overflow-hidden min-h-[400px]">
          <div className="absolute inset-0 flex items-center justify-center">
            {/* Artistic Card Stack */}
            <div className="relative w-64 h-80 bg-zinc-900 border border-zinc-700 transform rotate-3 flex flex-col items-center justify-center p-4 shadow-2xl">
              <div className="w-full h-full bg-zinc-800 flex items-center justify-center overflow-hidden">
                <div className="w-32 h-32 border-2 border-accent border-dashed rounded-full flex items-center justify-center opacity-40 animate-pulse">
                  <div className="text-[10px] font-mono uppercase text-accent">Logo Target</div>
                </div>
              </div>
              <div className="mt-4 w-full h-2 bg-zinc-800 rounded"></div>
              <div className="mt-2 w-1/2 h-2 bg-zinc-800 rounded self-start"></div>
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-accent rounded-full mix-blend-difference blur-xl opacity-20"></div>
            </div>
            
            <div className="absolute top-24 left-10 w-48 h-64 bg-zinc-800/50 border border-zinc-700 transform -rotate-6 backdrop-blur-sm p-4 hidden lg:block">
              <div className="w-full h-full bg-zinc-700/50 flex items-center justify-center italic text-zinc-500 font-display text-sm">
                Base Texture
              </div>
            </div>
          </div>

          {/* Vertical Labels */}
          <div className="absolute bottom-8 right-8 writing-vertical text-[10px] uppercase tracking-widest text-zinc-600 font-mono flex items-center gap-6">
            <span className="rotate-180">01 / Surface Mapping</span>
            <div className="h-12 w-px bg-zinc-800"></div>
            <span className="rotate-180">02 / Diffuse Light</span>
          </div>
        </section>
      </main>

      {/* Footer / Features Section */}
      <footer className="bg-zinc-900/50 border-t border-zinc-800 p-10 lg:px-20">
        <div className="flex flex-col lg:flex-row justify-between gap-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 flex-grow">
            <FooterItem 
              title="Asset Management"
              description="Organize logos and product bases with tagging."
            />
            <FooterItem 
              title="AI Compositing"
              description="Smart blending and advanced surface mapping."
            />
            <FooterItem 
              title="High-Res Export"
              description="Production-ready 8K visuals for print and web."
            />
          </div>
          <div className="lg:w-72 border-t lg:border-t-0 lg:border-l border-zinc-800 pt-8 lg:pt-0 lg:pl-10">
            <p className="text-[10px] text-zinc-600 leading-tight uppercase font-bold tracking-tight">
              By using this app, you confirm rights to uploaded content. Use is subject to our terms. Uploads may be used to improve services.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FooterItem({ title, description }: { title: string, description: string }) {
  return (
    <div>
      <h4 className="text-[10px] font-black uppercase tracking-[0.3em] mb-4 text-accent">{title}</h4>
      <p className="text-xs text-zinc-500 font-mono leading-relaxed">{description}</p>
    </div>
  );
}

const FeatureCard: React.FC<{ icon: React.ReactNode, title: string, description: string }> = ({ icon, title, description }) => {
  return (
    <div className="p-8 border border-zinc-800 bg-surface hover:border-accent transition-colors group">
      <div className="w-12 h-12 bg-zinc-900 flex items-center justify-center text-accent mb-6 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-black text-white mb-3 uppercase tracking-tighter">{title}</h3>
      <p className="text-zinc-500 font-mono text-xs leading-relaxed italic">{description}</p>
    </div>
  );
}

function Package(props: any) {
  return (
    <svg 
      {...props}
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    >
      <path d="m7.5 4.27 9 5.15" />
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </svg>
  );
}
