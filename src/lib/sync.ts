import { db } from './db';
import { supabase } from './supabase';
import { toast } from 'sonner';

/**
 * Mesin Sinkronisasi Bara Kasir
 * Tugas: Mengirim data lokal yang belum ter-sync ke Supabase
 */

export async function syncToCloud() {
  const isOnline = navigator.onLine;
  if (!isOnline) return;

  try {
    // 1. Sync Categories
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
      if (!error) await db.categories.update(cat.id!, { isSynced: 1 });
    }

    // 2. Sync Products
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
      if (!error) await db.products.update(prod.id!, { isSynced: 1 });
    }

    // 3. Sync Transactions
    const unsyncedTransactions = await db.transactions.where('isSynced').equals(0).toArray();
    for (const tx of unsyncedTransactions) {
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
        // Sync Items for this transaction
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
        await db.transactions.update(tx.id!, { isSynced: 1 });
      }
    }

    console.log('Sync to cloud completed successfully');
  } catch (err) {
    console.error('Sync failed:', err);
  }
}

// Jalankan sync setiap 30 detik jika online
if (typeof window !== 'undefined') {
  setInterval(syncToCloud, 30000);
  
  // Juga jalankan saat kembali online
  window.addEventListener('online', syncToCloud);
}
