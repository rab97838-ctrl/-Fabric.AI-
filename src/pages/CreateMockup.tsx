import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { 
  ChevronRight, 
  ChevronLeft, 
  Box, 
  Image as ImageIcon, 
  Sparkles, 
  Upload, 
  CheckCircle2, 
  X,
  RefreshCw
} from "lucide-react";
import { GoogleGenAI } from "@google/genai";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { User, ProductBase, Logo } from "../types";
import { cn } from "../lib/utils";

// Default Products for the demo
const DEFAULT_PRODUCTS: ProductBase[] = [
  { 
    id: 'p1', 
    name: 'White T-Shirt', 
    category: 'Apparel', 
    imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=1000',
    createdAt: new Date().toISOString()
  },
  { 
    id: 'p2', 
    name: 'Black Hoodie', 
    category: 'Apparel', 
    imageUrl: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=1000',
    createdAt: new Date().toISOString()
  },
  { 
    id: 'p3', 
    name: 'Ceramic Mug', 
    category: 'Home', 
    imageUrl: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&q=80&w=1000',
    createdAt: new Date().toISOString()
  },
  { 
    id: 'p4', 
    name: 'Tote Bag', 
    category: 'Accessories', 
    imageUrl: 'https://images.unsplash.com/photo-1544816153-16ad4614ff28?auto=format&fit=crop&q=80&w=1000',
    createdAt: new Date().toISOString()
  },
  { 
    id: 'p5', 
    name: 'Minimalist Cap', 
    category: 'Accessories', 
    imageUrl: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&q=80&w=1000',
    createdAt: new Date().toISOString()
  }
];

interface CreateMockupProps {
  user: User;
}

export function CreateMockup({ user }: CreateMockupProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState<ProductBase | null>(null);
  const [selectedLogo, setSelectedLogo] = useState<string | null>(null); // base64
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedLogo(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const nextStep = () => setStep(s => Math.min(s + 1, 3));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const runAICompositing = async () => {
    if (!selectedProduct || !selectedLogo) return;
    
    setIsProcessing(true);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      // Convert product URL to base64 for Gemini via proxy to avoid CORS
      const productResponse = await fetch(`/api/proxy-image?url=${encodeURIComponent(selectedProduct.imageUrl)}`);
      
      if (!productResponse.ok) {
        throw new Error(`Failed to fetch product image via proxy: ${productResponse.statusText}`);
      }

      const productBlob = await productResponse.blob();
      const productBase64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(productBlob);
      });

      const logoParts = selectedLogo.split(',');
      const logoMime = logoParts[0].match(/:(.*?);/)?.[1] || 'image/png';
      const logoData = logoParts[1];

      const productParts = productBase64.split(',');
      const productMime = productParts[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
      const productData = productParts[1];

      console.log('Sending images to Gemini for professional compositing...');
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              inlineData: { data: productData, mimeType: productMime }
            },
            {
              inlineData: { data: logoData, mimeType: logoMime }
            },
            {
              text: `TASK: Professional Product Mockup Generation.
              INPUTS: 
              1. Base Product Image (Template)
              2. Branding Logo Asset
              
              INSTRUCTIONS:
              - Distort and wrap the Branding Logo to perfectly follow the 3D geometry and fabric/surface contours of the Base Product.
              - Match the lighting, grain, shadows, and highlights of the base image exactly.
              - The logo should appear as if it is high-quality screen-print or embroidery on the product.
              - Remove any solid background colors from the logo if it's meant to be transparent.
              - Scale the logo naturally for the product's proportions (e.g. standard chest print size for shirts).
              
              OUTPUT: Return ONLY the final composited image. No text.`
            }
          ]
        },
        config: {
          imageConfig: {
            aspectRatio: "1:1"
          }
        }
      });

      let finalImageUrl = null;
      let textResponse = "";

      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            finalImageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            break;
          } else if (part.text) {
            textResponse += part.text;
          }
        }
      }

      if (!finalImageUrl) {
        throw new Error(textResponse || "AI failed to generate an image part. The model might have refused due to safety or quality constraints.");
      }

      setResultImage(finalImageUrl);

      // Save to Firestore
      const mockupsPath = `users/${user.uid}/mockups`;
      await addDoc(collection(db, mockupsPath), {
        id: crypto.randomUUID(),
        ownerId: user.uid,
        productId: selectedProduct.id,
        resultUrl: finalImageUrl,
        status: 'completed',
        createdAt: serverTimestamp(),
      });

    } catch (err) {
      console.error('Compositing Error:', err);
      setError(err instanceof Error ? err.message : "Failed to composite image. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      {/* Progress Stepper */}
      <div className="flex items-center justify-center mb-24 gap-6">
        <StepIndicator active={step >= 1} current={step === 1} label="01 / Product" icon={<Box className="w-5 h-5" />} />
        <div className={cn("w-20 h-[1px] transition-colors", step > 1 ? "bg-accent" : "bg-zinc-800")} />
        <StepIndicator active={step >= 2} current={step === 2} label="02 / Asset" icon={<ImageIcon className="w-5 h-5" />} />
        <div className={cn("w-20 h-[1px] transition-colors", step > 2 ? "bg-accent" : "bg-zinc-800")} />
        <StepIndicator active={step >= 3} current={step === 3} label="03 / Render" icon={<Sparkles className="w-5 h-5" />} />
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div 
            key="step1"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="space-y-12"
          >
            <div className="text-center space-y-4">
              <h2 className="text-5xl font-display font-black text-white uppercase tracking-tighter italic">Select Base</h2>
              <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest">Pick a technical template for surface mapping</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
              {DEFAULT_PRODUCTS.map(product => (
                <button 
                  key={product.id}
                  onClick={() => { setSelectedProduct(product); nextStep(); }}
                  className={cn(
                    "group relative aspect-[4/5] bg-zinc-900 border transition-all overflow-hidden",
                    selectedProduct?.id === product.id ? "border-accent ring-8 ring-accent/10" : "border-zinc-800 hover:border-zinc-700"
                  )}
                >
                  <img 
                    src={product.imageUrl} 
                    alt={product.name} 
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700 opacity-60 group-hover:opacity-100"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black via-black/20 to-transparent">
                    <p className="text-[10px] font-black text-accent uppercase tracking-[0.3em] mb-1">{product.category}</p>
                    <p className="text-md font-black text-white uppercase tracking-tighter">{product.name}</p>
                  </div>
                  {selectedProduct?.id === product.id && (
                    <div className="absolute top-6 right-6 w-8 h-8 bg-accent text-black flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div 
            key="step2"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="space-y-12"
          >
            <div className="text-center space-y-4">
              <h2 className="text-5xl font-display font-black text-white uppercase tracking-tighter italic">Source Asset</h2>
              <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest">Attach a binary file for projection</p>
            </div>

            <div className="flex flex-col items-center gap-12">
              <label 
                className={cn(
                  "relative w-full max-w-md aspect-square bg-[#0A0A0A] border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all",
                  selectedLogo 
                    ? "border-accent/50" 
                    : "border-zinc-800 hover:border-accent/50"
                )}
              >
                <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                {selectedLogo ? (
                  <div className="relative w-full h-full p-12">
                    <img src={selectedLogo} alt="Uploaded Logo" className="w-full h-full object-contain grayscale hover:grayscale-0 transition-all" />
                    <button 
                      onClick={(e) => { e.preventDefault(); setSelectedLogo(null); }}
                      className="absolute top-4 right-4 p-3 bg-zinc-950 text-zinc-500 hover:text-white"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="w-16 h-16 text-zinc-800 mb-6" />
                    <span className="text-xl font-black text-white uppercase tracking-tighter mb-2">Upload Asset</span>
                    <span className="text-[10px] text-zinc-600 font-mono uppercase tracking-widest">Binary Source Projection</span>
                  </>
                )}
              </label>

              <div className="flex gap-6">
                <button 
                  onClick={prevStep}
                  className="px-10 py-4 bg-zinc-900 border border-zinc-800 text-white font-black uppercase tracking-tighter hover:bg-zinc-800 transition-all flex items-center gap-3"
                >
                  <ChevronLeft className="w-6 h-6" /> PREV
                </button>
                <button 
                  disabled={!selectedLogo}
                  onClick={nextStep}
                  className="px-16 py-4 bg-accent text-black font-black uppercase tracking-tighter hover:bg-white disabled:opacity-30 disabled:grayscale transition-all flex items-center gap-3"
                >
                  NEXT <ChevronRight className="w-6 h-6" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div 
            key="step3"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="space-y-16"
          >
            <div className="text-center space-y-4">
              <h2 className="text-5xl font-display font-black text-white uppercase tracking-tighter italic">AI Rendering</h2>
              <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest">Applying surface mapping and light diffusion</p>
            </div>

            <div className="flex flex-col md:flex-row gap-16 items-center md:items-start max-w-6xl mx-auto">
              {/* Preview Setup */}
              <div className="flex-1 space-y-8 w-full max-w-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div className="aspect-square bg-zinc-900 border border-zinc-800 overflow-hidden flex flex-col items-center justify-center grayscale opacity-50">
                    <img src={selectedProduct?.imageUrl} alt="Product" className="w-full h-full object-cover" />
                  </div>
                  <div className="aspect-square bg-zinc-900 border border-zinc-800 overflow-hidden flex flex-col items-center justify-center p-4">
                    <img src={selectedLogo!} alt="Logo" className="w-full h-full object-contain grayscale" />
                  </div>
                </div>

                <div className="p-8 bg-zinc-900 border border-zinc-800 space-y-6">
                  <h4 className="font-black text-[10px] uppercase tracking-[0.4em] text-accent">Process Matrix</h4>
                  <ul className="space-y-4">
                    <li className="flex items-center gap-3 text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                      <div className="w-1.5 h-1.5 bg-accent" />
                      Surface Mapping: 100%
                    </li>
                    <li className="flex items-center gap-3 text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                      <div className="w-1.5 h-1.5 bg-accent" />
                      Mesh Displacement: ACTIVE
                    </li>
                    <li className="flex items-center gap-3 text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                      <div className="w-1.5 h-1.5 bg-accent" />
                      Lighting Probe: ENABLED
                    </li>
                  </ul>
                </div>
              </div>

              {/* Result Area */}
              <div className="flex-[2] w-full flex flex-col items-center gap-12">
                <div className="relative w-full aspect-square md:aspect-[4/5] bg-zinc-900 border border-zinc-800 overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                  {isProcessing ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-surface/90 backdrop-blur-md z-10">
                      <div className="w-16 h-16 border-2 border-accent/20 border-t-accent rounded-full animate-spin" />
                      <div className="text-center">
                        <p className="text-xl font-black text-white uppercase tracking-tighter italic">RENDERING_PROCESS_ACTIVE</p>
                        <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mt-2">Fabric interaction processing...</p>
                      </div>
                    </div>
                  ) : resultImage ? (
                    <motion.img 
                      initial={{ opacity: 0, scale: 1.05 }}
                      animate={{ opacity: 1, scale: 1 }}
                      src={resultImage} 
                      alt="Composite Result" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-800 italic uppercase font-mono text-[10px] tracking-widest">
                      <Sparkles className="w-20 h-20 mb-8 opacity-5" />
                      Waiting for render command
                    </div>
                  )}

                  {error && (
                    <div className="absolute inset-0 bg-red-950/90 backdrop-blur-md flex flex-col items-center justify-center p-12 text-center z-20">
                      <X className="w-16 h-16 text-red-500 mb-6" />
                      <p className="text-white font-black uppercase tracking-tighter text-xl mb-6">{error}</p>
                      <button 
                        onClick={runAICompositing}
                        className="px-10 py-3 bg-white text-black font-black uppercase tracking-tighter"
                      >
                        RETRY
                      </button>
                    </div>
                  )}
                </div>

                <div className="w-full flex gap-6">
                  {!resultImage ? (
                    <>
                      <button 
                        onClick={prevStep}
                        className="flex-1 py-5 bg-zinc-900 border border-zinc-800 font-black uppercase tracking-tighter text-white hover:bg-zinc-800 transition-all"
                      >
                        BACK
                      </button>
                      <button 
                        onClick={runAICompositing}
                        disabled={isProcessing}
                        className="flex-[2] py-5 bg-accent text-black font-black uppercase tracking-tighter text-xl hover:bg-white disabled:opacity-30 transition-all shadow-2xl active:scale-95 flex items-center justify-center gap-4"
                      >
                        <Sparkles className="w-6 h-6" />
                        Execute Render
                      </button>
                    </>
                  ) : (
                    <div className="w-full grid grid-cols-2 gap-6">
                      <button 
                        onClick={() => { setStep(1); setResultImage(null); }}
                        className="py-5 bg-zinc-900 border border-zinc-800 text-white font-black uppercase tracking-tighter flex items-center justify-center gap-4 hover:bg-zinc-800"
                      >
                        <RefreshCw className="w-5 h-5" /> New Process
                      </button>
                      <button 
                        onClick={() => navigate('/dashboard')}
                        className="py-5 bg-accent text-black font-black uppercase tracking-tighter flex items-center justify-center gap-4 hover:bg-white"
                      >
                        Gallery <ChevronRight className="w-6 h-6" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const StepIndicator: React.FC<{ active: boolean, current: boolean, label: string, icon: React.ReactNode }> = ({ active, current, label, icon }) => {
  return (
    <div className={cn(
      "flex flex-col items-center gap-3 transition-all",
      active ? "text-accent" : "text-zinc-800"
    )}>
      <div className={cn(
        "w-12 h-12 flex items-center justify-center border-2 transition-all",
        current ? "bg-accent border-accent text-black scale-110 shadow-[0_0_20px_rgba(217,253,82,0.3)]" : 
        active ? "bg-accent/10 border-accent/30 text-accent" : "bg-transparent border-zinc-800 text-zinc-800"
      )}>
        {icon}
      </div>
      <span className={cn("text-[10px] font-mono uppercase tracking-[0.2em]", current ? "opacity-100 font-black" : "opacity-40")}>{label}</span>
    </div>
  );
}
