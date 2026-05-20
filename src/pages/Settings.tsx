import { useState, useRef, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Store,
  CreditCard,
  Plus,
  Trash2,
  ChevronRight,
  Camera,
  X,
  Tags,
  Palette,
  LayoutGrid,
  FileText,
  LogOut,
  RefreshCw,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { compressImage } from '@/lib/image-utils';

const emojiOptions = ['🍽️', '🍔', '🍕', '☕', '🍰', '🍺', '🥤', '🍦', '🍜', '🍱', '🍖', '🍎', '🥕', '📦', '🎁', '🏷️'];

export default function Settings() {
  const storeSettings = useLiveQuery(() => db.storeSettings.toCollection().first());
  const paymentMethods = useLiveQuery(() => db.paymentMethods.toArray());
  const categories = useLiveQuery(() => db.categories.where('isDeleted').equals(0).toArray());

  const [storeDialog, setStoreDialog] = useState(false);
  const [storeName, setStoreName] = useState('');
  const [storeAddr, setStoreAddr] = useState('');
  const [storePhone, setStorePhone] = useState('');
  const [storeLogo, setStoreLogo] = useState<string | undefined>();
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [pmDialog, setPmDialog] = useState(false);
  const [pmEditId, setPmEditId] = useState<number | null>(null);
  const [pmName, setPmName] = useState('');
  const [pmCategory, setPmCategory] = useState('tunai');

  const [catDialog, setCatDialog] = useState(false);
  const [catEditId, setCatEditId] = useState<number | null>(null);
  const [catName, setCatName] = useState('');
  const [catIcon, setCatIcon] = useState('🍽️');
  const [catColor, setCatColor] = useState('#10b981');

  useEffect(() => {
    if (storeSettings) {
      setStoreName(storeSettings.storeName);
      setStoreAddr(storeSettings.address || '');
      setStorePhone(storeSettings.phone || '');
      setStoreLogo(storeSettings.logo);
    }
  }, [storeSettings]);

  const saveStore = async () => {
    if (!storeName.trim()) return;
    const settings = await db.storeSettings.toCollection().first();
    if (settings) {
      await db.storeSettings.update(settings.id!, {
        storeName,
        address: storeAddr,
        phone: storePhone,
        logo: storeLogo,
      });
    } else {
      await db.storeSettings.add({
        storeName,
        address: storeAddr,
        phone: storePhone,
        logo: storeLogo,
        onboardingDone: true,
        receiptFooter: 'Terima kasih atas kunjungan Anda!',
        lastBackupAt: null,
        deviceId: crypto.randomUUID()
      });
    }
    setStoreDialog(false);
    toast.success('Pengaturan toko disimpan');
  };

  const handleLogoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file, 400, 0.8);
        setStoreLogo(compressed);
      } catch (err) {
        toast.error('Gagal memproses gambar logo');
      }
    }
  };

  const openPmEdit = (pm?: any) => {
    if (pm) {
      setPmEditId(pm.id);
      setPmName(pm.name);
      setPmCategory(pm.category);
    } else {
      setPmEditId(null);
      setPmName('');
      setPmCategory('tunai');
    }
    setPmDialog(true);
  };

  const savePm = async () => {
    if (pmEditId) {
      await db.paymentMethods.update(pmEditId, { name: pmName, category: pmCategory as any });
    } else {
      await db.paymentMethods.add({ 
        name: pmName, 
        category: pmCategory as any,
        isDefault: false,
        createdAt: new Date()
      });
    }
    setPmDialog(false);
    toast.success('Metode pembayaran disimpan');
  };

  const deletePm = async (id: number) => {
    await db.paymentMethods.delete(id);
    toast.success('Metode pembayaran dihapus');
  };

  const openCatEdit = (cat?: any) => {
    if (cat) {
      setCatEditId(cat.id);
      setCatName(cat.name);
      setCatIcon(cat.icon);
      setCatColor(cat.color);
    } else {
      setCatEditId(null);
      setCatName('');
      setCatIcon('🍽️');
      setCatColor('#10b981');
    }
    setCatDialog(true);
  };

  const saveCat = async () => {
    if (catEditId) {
      await db.categories.update(catEditId, { name: catName, icon: catIcon, color: catColor, isSynced: 0 });
    } else {
      await db.categories.add({ 
        name: catName, 
        icon: catIcon, 
        color: catColor, 
        isDeleted: 0, 
        deletedAt: null,
        createdAt: new Date(), 
        isSynced: 0 
      });
    }
    setCatDialog(false);
    toast.success('Kategori disimpan');
  };

  const deleteCat = async (id: number) => {
    await db.categories.update(id, { isDeleted: 1, isSynced: 0 });
    toast.success('Kategori dihapus');
  };

  return (
    <div className="px-4 py-6 space-y-6 pb-24">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pengaturan</h1>
        <p className="text-sm text-muted-foreground">Kelola toko dan sistem Anda</p>
      </div>

      {/* Store Info */}
      <Card className="border-0 shadow-sm overflow-hidden" onClick={() => setStoreDialog(true)}>
        <CardContent className="p-0">
          <div className="p-4 flex items-center gap-4 active:bg-muted transition-colors cursor-pointer">
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              {storeLogo ? (
                <img src={storeLogo} alt="Logo" className="w-full h-full object-cover rounded-xl" />
              ) : (
                <Store className="w-6 h-6" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold truncate">{storeSettings?.storeName || 'Bara Kasir'}</h3>
              <p className="text-xs text-muted-foreground truncate">{storeSettings?.address || 'Alamat belum diatur'}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>

      {/* App Appearance */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground px-1 flex items-center gap-2">
          <Palette className="w-4 h-4" /> Tampilan Aplikasi
        </h2>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">Warna Tema</p>
                <p className="text-xs text-muted-foreground">Pilih warna utama aplikasi</p>
              </div>
              <div className="flex gap-2">
                {['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'].map(color => (
                  <button
                    key={color}
                    onClick={async () => {
                      const settings = await db.storeSettings.toCollection().first();
                      if (settings) await db.storeSettings.update(settings.id!, { themeColor: color });
                      toast.success('Warna tema diperbarui');
                    }}
                    className={`w-6 h-6 rounded-full border-2 ${storeSettings?.themeColor === color ? 'border-foreground' : 'border-transparent'}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Categories Management */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
            <Tags className="w-4 h-4" /> Kategori Produk
          </h2>
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-primary" onClick={() => openCatEdit()}>
            <Plus className="w-3 h-3" /> Tambah
          </Button>
        </div>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-0 divide-y">
            {categories?.map(cat => (
              <div key={cat.id} className="p-3 flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-lg shadow-sm"
                    style={{ backgroundColor: `${cat.color}15`, color: cat.color }}
                  >
                    {cat.icon}
                  </div>
                  <span className="text-sm font-medium">{cat.name}</span>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => openCatEdit(cat)}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="w-8 h-8 text-destructive" onClick={() => deleteCat(cat.id!)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
            {categories?.length === 0 && (
              <div className="p-8 text-center text-muted-foreground italic text-sm">Belum ada kategori</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payment Methods */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
            <CreditCard className="w-4 h-4" /> Metode Pembayaran
          </h2>
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-primary" onClick={() => openPmEdit()}>
            <Plus className="w-3 h-3" /> Tambah
          </Button>
        </div>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-0 divide-y">
            {paymentMethods?.map(pm => (
              <div key={pm.id} className="p-3 flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                    <CreditCard className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{pm.name}</p>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">{pm.category}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => openPmEdit(pm)}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="w-8 h-8 text-destructive" onClick={() => deletePm(pm.id!)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Logout Action */}
      <div className="pt-4">
        <Button 
          variant="destructive" 
          className="w-full h-11 gap-2 shadow-sm"
          onClick={async () => {
            const { error } = await supabase.auth.signOut();
            if (error) toast.error('Gagal keluar');
            else toast.success('Berhasil keluar');
          }}
        >
          <LogOut className="w-4 h-4" />
          Keluar dari Akun
        </Button>
      </div>

      {/* Store Dialog */}
      <Dialog open={storeDialog} onOpenChange={setStoreDialog}>
        <DialogContent className="max-w-[95vw] rounded-xl">
          <DialogHeader><DialogTitle>Info Toko</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Logo Toko</Label>
              <div className="flex items-center gap-3">
                <div
                  className="w-20 h-20 rounded-xl bg-muted border-2 border-dashed border-border flex items-center justify-center overflow-hidden cursor-pointer"
                  onClick={() => logoInputRef.current?.click()}
                >
                  {storeLogo ? <img src={storeLogo} alt="Logo" className="w-full h-full object-cover" /> : <Camera className="w-6 h-6 text-muted-foreground/50" />}
                </div>
                <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoSelect} />
              </div>
            </div>
            <div className="space-y-1.5"><Label>Nama Toko</Label><Input value={storeName} onChange={e => setStoreName(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Alamat</Label><Input value={storeAddr} onChange={e => setStoreAddr(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Telepon</Label><Input value={storePhone} onChange={e => setStorePhone(e.target.value)} type="tel" /></div>
            <Button className="w-full" onClick={saveStore}>Simpan</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* PM Dialog */}
      <Dialog open={pmDialog} onOpenChange={setPmDialog}>
        <DialogContent className="max-w-[95vw] rounded-xl">
          <DialogHeader><DialogTitle>{pmEditId ? 'Edit' : 'Tambah'} Pembayaran</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5"><Label>Nama</Label><Input value={pmName} onChange={e => setPmName(e.target.value)} placeholder="Contoh: Tunai" /></div>
            <div className="space-y-1.5">
              <Label>Kategori</Label>
              <div className="grid grid-cols-2 gap-2">
                {['tunai', 'transfer', 'e-wallet', 'qris'].map(c => (
                  <button key={c} onClick={() => setPmCategory(c)} className={`p-2 rounded-lg text-xs font-semibold border-2 capitalize ${pmCategory === c ? 'border-primary bg-primary/5 text-primary' : 'border-muted'}`}>{c}</button>
                ))}
              </div>
            </div>
            <Button className="w-full" onClick={savePm} disabled={!pmName.trim()}>Simpan</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Category Dialog */}
      <Dialog open={catDialog} onOpenChange={setCatDialog}>
        <DialogContent className="max-w-[95vw] rounded-xl">
          <DialogHeader><DialogTitle>{catEditId ? 'Edit' : 'Tambah'} Kategori</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5"><Label>Nama Kategori</Label><Input value={catName} onChange={e => setCatName(e.target.value)} /></div>
            <div className="space-y-1.5">
              <Label>Ikon</Label>
              <div className="flex flex-wrap gap-2">
                {emojiOptions.map(e => (
                  <button key={e} onClick={() => setCatIcon(e)} className={`w-10 h-10 rounded-lg text-lg flex items-center justify-center border-2 ${catIcon === e ? 'border-primary bg-primary/5' : 'border-muted'}`}>{e}</button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Warna</Label>
              <Input type="color" value={catColor} onChange={e => setCatColor(e.target.value)} className="w-20" />
            </div>
            <Button className="w-full" onClick={saveCat} disabled={!catName.trim()}>Simpan</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
