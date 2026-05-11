import { Outlet } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, seedDefaultData } from '@/lib/db';
import { useEffect } from 'react';
import BottomNav from './BottomNav';
import { useThemeColor } from '@/hooks/use-theme-color';
import Onboarding from '@/components/Onboarding';
import { Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { syncToCloud } from '@/lib/sync';

export default function AppLayout() {
  useThemeColor(); // Apply saved theme color on mount

  useEffect(() => {
    seedDefaultData();
  }, []);

  const storeSettings = useLiveQuery(() => db.storeSettings.toCollection().first());
  
  // Hitung data yang belum sinkron
  const unsyncedCount = useLiveQuery(async () => {
    const c = await db.categories.where('isSynced').equals(0).count();
    const p = await db.products.where('isSynced').equals(0).count();
    const t = await db.transactions.where('isSynced').equals(0).count();
    return c + p + t;
  }, []);

  // Loading state
  if (storeSettings === undefined) return null;

  // Show onboarding if not done yet
  if (!storeSettings || !storeSettings.onboardingDone) {
    return <Onboarding onComplete={() => { /* Dexie live query will auto-refresh */ }} />;
  }

  return (
    <div className="min-h-screen bg-background max-w-lg md:max-w-6xl mx-auto relative">
      {/* Header Statis */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
            B
          </div>
          <span className="font-bold text-sm truncate max-w-[150px]">{storeSettings.storeName}</span>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => syncToCloud()}
            className="flex items-center gap-1.5 px-2 py-1 rounded-full transition-colors hover:bg-muted"
            title={unsyncedCount === 0 ? "Data sinkron" : `${unsyncedCount} data menunggu sinkronisasi`}
          >
            {unsyncedCount === 0 ? (
              <>
                <Cloud className="w-4 h-4 text-success" />
                <span className="text-[10px] font-medium text-success hidden sm:inline">Tercadangkan</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 text-warning animate-spin-slow" />
                <span className="text-[10px] font-medium text-warning hidden sm:inline">{unsyncedCount} Pending</span>
              </>
            )}
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
