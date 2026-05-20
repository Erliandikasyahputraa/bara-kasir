import { db } from './db';
import { supabase } from './supabase';
import { toast } from 'sonner';

let activeTableCache: Record<string, boolean> = {};

async function checkTableExists(tableName: string): Promise<boolean> {
  if (activeTableCache[tableName] !== undefined) {
    return activeTableCache[tableName];
  }
  try {
    const { error } = await supabase.from(tableName).select('*').limit(0);
    if (error && error.code === 'PGRST205') {
      activeTableCache[tableName] = false;
      return false;
    }
    activeTableCache[tableName] = true;
    return true;
  } catch {
    activeTableCache[tableName] = false;
    return false;
  }
}

export async function syncToCloud() {
  const isOnline = navigator.onLine;
  if (!isOnline) return;

  try {
    let syncedCount = 0;

    // 0. Sync Store Settings (Two-way based on updatedAt)
    if (await checkTableExists('store_settings')) {
      const settings = await db.storeSettings.toCollection().first();
      const { data: cloudSettings } = await supabase.from('store_settings').select('*').limit(1).maybeSingle();

      if (settings && cloudSettings) {
        const localTime = settings.updatedAt ? new Date(settings.updatedAt).getTime() : 0;
        const cloudTime = cloudSettings.updated_at ? new Date(cloudSettings.updated_at).getTime() : 0;

        if (localTime > cloudTime) {
          // Push local to cloud (local is newer)
          await supabase.from('store_settings').upsert({
            id: 1,
            store_name: settings.storeName,
            address: settings.address,
            phone: settings.phone,
            logo: settings.logo || null,
            onboarding_done: settings.onboardingDone,
            updated_at: settings.updatedAt || new Date()
          });
        } else if (cloudTime > localTime) {
          // Pull cloud to local (cloud is newer)
          await db.storeSettings.update(settings.id!, {
            storeName: cloudSettings.store_name,
            address: cloudSettings.address || '',
            phone: cloudSettings.phone || '',
            logo: cloudSettings.logo || null,
            onboardingDone: cloudSettings.onboarding_done,
            updatedAt: new Date(cloudSettings.updated_at)
          });
          // Update favicon instantly if logo changed
          import('./favicon').then(({ updateDynamicFavicon }) => updateDynamicFavicon());
        }
      } else if (settings && !cloudSettings) {
        // Push local to cloud (first time)
        await supabase.from('store_settings').upsert({
          id: 1,
          store_name: settings.storeName,
          address: settings.address,
          phone: settings.phone,
          logo: settings.logo || null,
          onboarding_done: settings.onboardingDone,
          updated_at: settings.updatedAt || new Date()
        });
      } else if (!settings && cloudSettings) {
        // Pull cloud to local (first time)
        await db.storeSettings.add({
          storeName: cloudSettings.store_name,
          address: cloudSettings.address || '',
          phone: cloudSettings.phone || '',
          logo: cloudSettings.logo || null,
          receiptFooter: 'Terima kasih atas kunjungan Anda!',
          onboardingDone: cloudSettings.onboarding_done,
          lastBackupAt: null,
          deviceId: crypto.randomUUID(),
          updatedAt: new Date(cloudSettings.updated_at || 0)
        });
        import('./favicon').then(({ updateDynamicFavicon }) => updateDynamicFavicon());
      }
    }

    // 1. Sync Categories (Two-way)
    if (await checkTableExists('categories')) {
      const { data: cloudCats } = await supabase.from('categories').select('*');
      if (cloudCats) {
        for (const cat of cloudCats) {
          const localCat = await db.categories.get(cat.id);
          if (!localCat) {
            await db.categories.add({
              id: cat.id,
              name: cat.name,
              color: cat.color,
              icon: cat.icon,
              isDeleted: cat.is_deleted,
              deletedAt: cat.is_deleted === 1 ? new Date() : null,
              createdAt: new Date(cat.created_at),
              isSynced: 1
            });
          } else if (localCat.isSynced === 1) {
            // Compare properties to update if cloud has changes
            if (localCat.name !== cat.name || localCat.color !== cat.color || localCat.icon !== cat.icon || localCat.isDeleted !== cat.is_deleted) {
              await db.categories.update(cat.id, {
                name: cat.name,
                color: cat.color,
                icon: cat.icon,
                isDeleted: cat.is_deleted,
                isSynced: 1
              });
            }
          }
        }
      }

      const unsyncedCategories = await db.categories.where('isSynced').equals(0).toArray();
      for (const cat of unsyncedCategories) {
        const { error } = await supabase.from('categories').upsert({
          id: cat.id,
          name: cat.name,
          color: cat.color,
          icon: cat.icon,
          is_deleted: cat.isDeleted,
          created_at: cat.createdAt
        });
        if (!error) {
          await db.categories.update(cat.id!, { isSynced: 1 });
          syncedCount++;
        }
      }
    }

    // 2. Sync Products (Two-way with timestamp check)
    if (await checkTableExists('products')) {
      const { data: cloudProds } = await supabase.from('products').select('*');
      if (cloudProds) {
        for (const p of cloudProds) {
          const localProd = await db.products.get(p.id);
          if (!localProd) {
            await db.products.add({
              id: p.id,
              name: p.name,
              sku: p.sku,
              categoryId: p.category_id,
              price: Number(p.price),
              hpp: Number(p.hpp),
              stock: p.stock,
              unit: p.unit,
              barcode: p.barcode,
              photo: p.photo,
              isDeleted: p.is_deleted,
              deletedAt: p.is_deleted === 1 ? new Date() : null,
              createdAt: new Date(p.created_at),
              updatedAt: new Date(p.updated_at),
              isSynced: 1
            });
          } else if (localProd.isSynced === 1) {
            // Compare timestamps
            const cloudUpdatedAt = new Date(p.updated_at).getTime();
            const localUpdatedAt = new Date(localProd.updatedAt).getTime();
            if (cloudUpdatedAt > localUpdatedAt) {
              await db.products.update(p.id, {
                name: p.name,
                sku: p.sku,
                categoryId: p.category_id,
                price: Number(p.price),
                hpp: Number(p.hpp),
                stock: p.stock,
                unit: p.unit,
                barcode: p.barcode,
                photo: p.photo,
                isDeleted: p.is_deleted,
                updatedAt: new Date(p.updated_at),
                isSynced: 1
              });
            }
          }
        }
      }

      const unsyncedProducts = await db.products.where('isSynced').equals(0).toArray();
      for (const prod of unsyncedProducts) {
        const { error } = await supabase.from('products').upsert({
          id: prod.id,
          name: prod.name,
          sku: prod.sku,
          category_id: prod.categoryId,
          price: prod.price,
          hpp: prod.hpp,
          stock: prod.stock,
          unit: prod.unit,
          barcode: prod.barcode,
          photo: prod.photo,
          is_deleted: prod.isDeleted,
          created_at: prod.createdAt,
          updated_at: prod.updatedAt
        });
        if (!error) {
          await db.products.update(prod.id!, { isSynced: 1 });
          syncedCount++;
        }
      }
    }

    // 3. Sync Transactions (with Soft Delete integration)
    if (await checkTableExists('transactions')) {
      const unsyncedTransactions = await db.transactions.where('isSynced').equals(0).toArray();
      for (const tx of unsyncedTransactions) {
        // Handle local soft delete propagation to cloud
        if (tx.isDeleted === 1) {
          if (await checkTableExists('transaction_items')) {
            await supabase.from('transaction_items').delete().eq('transaction_id', tx.id);
          }
          const { error } = await supabase.from('transactions').delete().eq('id', tx.id);
          if (!error) {
            // Hard delete locally to clean up IndexedDB
            await db.transactionItems.where('transactionId').equals(tx.id!).delete();
            await db.transactions.delete(tx.id!);
            syncedCount++;
          }
          continue;
        }

        const { error } = await supabase.from('transactions').upsert({
          id: tx.id,
          receipt_number: tx.receiptNumber,
          subtotal: tx.subtotal,
          discount_amount: tx.discountAmount,
          total: tx.total,
          payment_method_id: tx.paymentMethodId,
          payment_amount: tx.paymentAmount,
          change: tx.change,
          profit: tx.profit,
          status: tx.status,
          customer_name: tx.customerName,
          table_number: tx.tableNumber,
          remarks: tx.remarks,
          date: tx.date
        });
        
        if (!error) {
          if (await checkTableExists('transaction_items')) {
            const items = await db.transactionItems.where('transactionId').equals(tx.id!).toArray();
            for (const item of items) {
              await supabase.from('transaction_items').upsert({
                id: item.id,
                transaction_id: tx.id,
                product_id: item.productId,
                product_name: item.productName,
                quantity: item.quantity,
                price: item.price,
                hpp: item.hpp,
                subtotal: item.subtotal,
                notes: item.notes
              });
            }
          }
          await db.transactions.update(tx.id!, { isSynced: 1 });
          syncedCount++;
        }
      }
    }

    // 4. Sync Suppliers (Two-way if exists)
    if (await checkTableExists('suppliers')) {
      const { data: cloudSups } = await supabase.from('suppliers').select('*');
      if (cloudSups) {
        for (const s of cloudSups) {
          const localSup = await db.suppliers.get(s.id);
          if (!localSup) {
            await db.suppliers.add({
              id: s.id,
              name: s.name,
              phone: s.phone,
              address: s.address,
              notes: s.notes,
              isDeleted: s.is_deleted,
              deletedAt: s.is_deleted === 1 ? new Date() : null,
              createdAt: new Date(s.created_at),
              isSynced: 1
            });
          } else if (localSup.isSynced === 1) {
            if (localSup.name !== s.name || localSup.phone !== s.phone || localSup.address !== s.address || localSup.notes !== s.notes || localSup.isDeleted !== s.is_deleted) {
              await db.suppliers.update(s.id, {
                name: s.name,
                phone: s.phone,
                address: s.address,
                notes: s.notes,
                isDeleted: s.is_deleted,
                isSynced: 1
              });
            }
          }
        }
      }

      const unsyncedSuppliers = await db.suppliers.where('isSynced').equals(0).toArray();
      for (const sup of unsyncedSuppliers) {
        const { error } = await supabase.from('suppliers').upsert({
          id: sup.id,
          name: sup.name,
          phone: sup.phone,
          address: sup.address,
          notes: sup.notes,
          is_deleted: sup.isDeleted,
          created_at: sup.createdAt
        });
        if (!error) {
          await db.suppliers.update(sup.id!, { isSynced: 1 });
          syncedCount++;
        }
      }
    }

    // 5. Sync StockIns (Two-way if exists)
    if (await checkTableExists('stock_ins')) {
      const { data: cloudStockIns } = await supabase.from('stock_ins').select('*');
      if (cloudStockIns) {
        for (const si of cloudStockIns) {
          const localSi = await db.stockIns.get(si.id);
          if (!localSi) {
            await db.stockIns.add({
              id: si.id,
              productId: si.product_id,
              supplierId: si.supplier_id,
              quantity: si.quantity,
              buyPrice: si.buy_price,
              totalPrice: si.total_price,
              date: new Date(si.date),
              notes: si.notes,
              isSynced: 1
            });
          }
        }
      }

      const unsyncedStockIns = await db.stockIns.where('isSynced').equals(0).toArray();
      for (const si of unsyncedStockIns) {
        const { error } = await supabase.from('stock_ins').upsert({
          id: si.id,
          product_id: si.productId,
          supplier_id: si.supplierId || null,
          quantity: si.quantity,
          buy_price: si.buyPrice,
          total_price: si.totalPrice,
          date: si.date,
          notes: si.notes
        });
        if (!error) {
          await db.stockIns.update(si.id!, { isSynced: 1 });
          syncedCount++;
        }
      }
    }

    // 6. Sync StockOuts (Two-way if exists)
    if (await checkTableExists('stock_outs')) {
      const { data: cloudStockOuts } = await supabase.from('stock_outs').select('*');
      if (cloudStockOuts) {
        for (const so of cloudStockOuts) {
          const localSo = await db.stockOuts.get(so.id);
          if (!localSo) {
            await db.stockOuts.add({
              id: so.id,
              productId: so.product_id,
              quantity: so.quantity,
              reason: so.reason,
              date: new Date(so.date),
              notes: so.notes,
              isSynced: 1
            });
          }
        }
      }

      const unsyncedStockOuts = await db.stockOuts.where('isSynced').equals(0).toArray();
      for (const so of unsyncedStockOuts) {
        const { error } = await supabase.from('stock_outs').upsert({
          id: so.id,
          product_id: so.productId,
          quantity: so.quantity,
          reason: so.reason,
          date: so.date,
          notes: so.notes
        });
        if (!error) {
          await db.stockOuts.update(so.id!, { isSynced: 1 });
          syncedCount++;
        }
      }
    }

    // 7. Sync HppHistory (Two-way if exists)
    if (await checkTableExists('hpp_history')) {
      const { data: cloudHpp } = await supabase.from('hpp_history').select('*');
      if (cloudHpp) {
        for (const h of cloudHpp) {
          const localH = await db.hppHistory.get(h.id);
          if (!localH) {
            await db.hppHistory.add({
              id: h.id,
              productId: h.product_id,
              oldHpp: h.old_hpp,
              newHpp: h.new_hpp,
              source: h.source,
              date: new Date(h.date),
              isSynced: 1
            });
          }
        }
      }

      const unsyncedHpp = await db.hppHistory.where('isSynced').equals(0).toArray();
      for (const h of unsyncedHpp) {
        const { error } = await supabase.from('hpp_history').upsert({
          id: h.id,
          product_id: h.productId,
          old_hpp: h.oldHpp,
          new_hpp: h.newHpp,
          source: h.source,
          date: h.date
        });
        if (!error) {
          await db.hppHistory.update(h.id!, { isSynced: 1 });
          syncedCount++;
        }
      }
    }

    if (syncedCount > 0) {
      toast.success(`${syncedCount} data berhasil disinkronkan`);
    }
  } catch (err: any) {
    console.error('Sync failed:', err);
    if (err.message?.includes('JWT')) {
      toast.error('Sesi login berakhir atau Key Supabase salah. Silakan login ulang.');
    }
  }
}

if (typeof window !== 'undefined') {
  setInterval(syncToCloud, 30000);
  window.addEventListener('online', syncToCloud);
}

