import { Link, useNavigate } from "react-router-dom";
import { LogIn, LogOut, Package, PlusSquare } from "lucide-react";
import { auth, signIn } from "../lib/firebase";
import { User } from "../types";
import { cn } from "../lib/utils";

interface NavbarProps {
  user: User | null;
}

export function Navbar({ user }: NavbarProps) {
  const navigate = useNavigate();

  const handleSignIn = async () => {
    try {
      await signIn();
      navigate("/dashboard");
    } catch (error) {
      console.error(error);
    }
  };

  const handleSignOut = async () => {
    await auth.signOut();
    navigate("/");
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-surface/80 backdrop-blur-xl">
      <div className="container mx-auto px-10 h-20 flex items-center justify-between">
        <Link 
          to="/" 
          className="flex items-center gap-2 group"
        >
          <div className="w-6 h-6 bg-accent rounded-full group-hover:scale-110 transition-transform"></div>
          <span className="font-display font-black text-xl tracking-tighter uppercase transition-colors hover:text-accent">
            Fabric.AI
          </span>
        </Link>

        <div className="flex items-center gap-10">
          <div className="hidden md:flex gap-8 text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-500">
            <Link to="/dashboard" className="hover:text-accent transition-colors">Gallery</Link>
            <span className="cursor-not-allowed opacity-50">Pricing</span>
            <span className="cursor-not-allowed opacity-50">Docs</span>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link 
                  to="/create"
                  className="bg-accent text-black px-6 py-2.5 font-bold uppercase tracking-tighter text-sm hover:bg-white transition-all active:scale-95"
                >
                  Create
                </Link>
                <div className="h-6 w-px bg-zinc-800" />
                <button 
                  onClick={handleSignOut}
                  className="p-2 text-zinc-500 hover:text-white transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
                {user.photoURL && (
                  <img 
                    src={user.photoURL} 
                    alt={user.displayName || "User"} 
                    className="w-8 h-8 rounded-full border border-zinc-700 grayscale hover:grayscale-0 transition-all"
                    referrerPolicy="no-referrer"
                  />
                )}
              </>
            ) : (
              <button 
                onClick={handleSignIn}
                className="bg-white text-black px-6 py-2.5 font-bold uppercase tracking-tighter text-sm hover:bg-accent transition-all active:scale-95"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
