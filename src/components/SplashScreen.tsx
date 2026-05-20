import { useEffect, useState } from 'react';
import { db } from '@/lib/db';
import { Coffee, Flame, Sparkles } from 'lucide-react';

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [storeName, setStoreName] = useState('Bara Kasir');
  const [logo, setLogo] = useState<string | null>(null);
  const [fadeOut, setFadeOut] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Fetch store name and logo from IndexedDB
    const loadStoreSettings = async () => {
      try {
        const settings = await db.storeSettings.toCollection().first();
        if (settings) {
          if (settings.storeName) setStoreName(settings.storeName);
          if (settings.logo) setLogo(settings.logo);
        }
      } catch (err) {
        console.error('Failed to load store settings for splash screen:', err);
      }
    };
    loadStoreSettings();

    // Progress bar animation
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 4;
      });
    }, 50);

    // Fade out after 1.8 seconds (giving progress bar time to complete)
    const fadeTimeout = setTimeout(() => {
      setFadeOut(true);
    }, 1800);

    // Unmount and notify completion after fade-out transition
    const completeTimeout = setTimeout(() => {
      onComplete();
    }, 2300);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(fadeTimeout);
      clearTimeout(completeTimeout);
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 transition-all duration-500 ease-out-in-out ${
        fadeOut ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Decorative Blur Orbs */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-accent/5 rounded-full blur-3xl animate-pulse" />

      {/* Main Branding Container */}
      <div className="relative flex flex-col items-center space-y-6 max-w-sm px-6 text-center select-none">
        
        {/* Logo container with pulse & rise animations */}
        <div className="relative flex items-center justify-center w-24 h-24 rounded-3xl bg-card border border-border shadow-2xl p-4 animate-bounce">
          {logo ? (
            <img
              src={logo}
              alt="Logo"
              className="w-full h-full object-contain rounded-2xl"
            />
          ) : (
            <div className="relative">
              <Flame className="w-12 h-12 text-primary animate-pulse" />
              <Coffee className="w-6 h-6 text-accent absolute -bottom-1 -right-1" />
            </div>
          )}
          
          {/* Subtle floating sparkle */}
          <Sparkles className="w-5 h-5 text-yellow-400 absolute -top-2 -right-2 animate-pulse" />
        </div>

        {/* Store/App Typography */}
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text text-transparent">
            {storeName}
          </h1>
        </div>

        {/* Loading Progress Indicator */}
        <div className="w-48 h-1 bg-muted rounded-full overflow-hidden mt-2">
          <div
            className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-100 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
