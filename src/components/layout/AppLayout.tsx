import { Outlet, Navigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, seedDefaultData } from '@/lib/db';
import { useEffect, useState } from 'react';
import BottomNav from './BottomNav';
import { useThemeColor } from '@/hooks/use-theme-color';
import Onboarding from '@/components/Onboarding';
import { Cloud, RefreshCw, LogOut } from 'lucide-react';
import { syncToCloud } from '@/lib/sync';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export default function AppLayout() {
  const { isAdmin, profile } = useAuth();
  useThemeColor();

  useEffect(() => {
    seedDefaultData();
  }, []);

  const storeSettings = useLiveQuery(() => db.storeSettings.toCollection().first());
  
  const unsyncedCount = useLiveQuery(async () => {
    try {
      const counts = await Promise.all([
        db.categories.where('isSynced').equals(0).count(),
        db.products.where('isSynced').equals(0).count(),
        db.transactions.where('isSynced').equals(0).count(),
        db.suppliers.where('isSynced').equals(0).count(),
        db.stockIns.where('isSynced').equals(0).count(),
        db.stockOuts.where('isSynced').equals(0).count(),
        db.hppHistory.where('isSynced').equals(0).count(),
      ]);
      return counts.reduce((a, b) => a + b, 0);
    } catch {
      return 0;
    }
  }, []);

  const { session } = useAuth();
  const [isInitialSync, setIsInitialSync] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncToCloud();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (session) {
      syncToCloud().finally(() => {
        // Beri waktu lebih lama (3 detik) agar data dari Cloud sempat masuk ke Lokal
        setTimeout(() => setIsInitialSync(false), 3000);
      });
    } else {
      setIsInitialSync(false);
    }
  }, [session]);

  if (storeSettings === undefined || isInitialSync) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center space-y-6">
        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
          <RefreshCw className="w-8 h-8 text-primary animate-spin" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold">Menyiapkan Data Cafe...</h2>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">Sedang sinkronisasi data dari pusat.</p>
        </div>
      </div>
    );
  }

  if (!storeSettings?.onboardingDone && isAdmin) {
    return <Onboarding onComplete={() => {}} />;
  }
  
  if (!storeSettings?.onboardingDone && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <div>
          <RefreshCw className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
          <h2 className="font-bold text-lg">Menunggu Owner...</h2>
          <p className="text-sm text-muted-foreground mt-2">Data toko belum diatur oleh Owner.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background max-w-lg md:max-w-6xl mx-auto relative">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/logo-bara.png" alt="Logo" className="w-8 h-8 rounded-lg object-contain bg-white p-0.5" />
          <span className="font-bold text-sm truncate max-w-[150px]">{storeSettings.storeName}</span>
        </div>

        <div className="flex items-center gap-1.5">
          {!isOnline ? (
            <div 
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-semibold select-none border border-red-500/20 animate-pulse"
              title="Koneksi terputus. Data disimpan lokal."
            >
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              Offline
            </div>
          ) : unsyncedCount > 0 ? (
            <button 
              onClick={() => syncToCloud()}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 text-xs font-semibold transition-colors hover:bg-yellow-500/20 border border-yellow-500/20"
              title={`${unsyncedCount} data belum disinkronkan. Klik untuk paksa sinkronisasi.`}
            >
              <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1" />
              {unsyncedCount} pending
            </button>
          ) : (
            <button 
              onClick={() => syncToCloud()}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold transition-colors hover:bg-emerald-500/20 border border-emerald-500/20"
              title="Semua data sinkron dengan cloud"
            >
              <Cloud className="w-3.5 h-3.5 mr-1" />
              Aktif
            </button>
          )}
          
          <button 
            onClick={async () => {
              const { error } = await supabase.auth.signOut();
              if (error) toast.error('Gagal keluar');
              else toast.success('Berhasil keluar');
            }}
            className="p-2 text-muted-foreground hover:text-destructive transition-colors ml-1"
            title="Keluar"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="pb-20">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
