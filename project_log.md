# 📜 Bara Kasir - Project Journey Log

Log ini mencatat setiap langkah besar dalam pembangunan aplikasi Bara Kasir.

---

## 📅 12 Mei 2026 (Kickoff & Rebranding)
- **Analisis Awal:** Membedah aplikasi KasirGratisan sebagai fondasi.
- **Rebranding Total:** 
    - Nama aplikasi diubah menjadi **Bara Kasir**.
    - Database lokal diubah dari `kasirgratisan-db` menjadi `bara-kasir-db`.
    - Membersihkan identitas pengembang lama di metadata (package.json, index.html, Settings).
- **Inisialisasi Repository:** Menghubungkan kode ke GitHub baru: `https://github.com/Erliandikasyahputraa/bara-kasir`.
- **Desain Logo:** Membuat konsep logo minimalis "Bara" (Api Oranye).

## 📅 12 Mei 2026 (Cloud Integration - Part 1)
- **Edukasi Cloud:** Menjelaskan konsep Hybrid (Local-First + Cloud Sync) kepada User.
- **Setup Supabase:** 
    - Pembuatan project Supabase oleh User.
    - Konfigurasi kunci API (Anon Key) di `src/lib/supabase.ts`.
    - Perancangan struktur Tabel SQL (Categories, Products, Transactions, dll) untuk database Cloud.
- **Keamanan:** Penjelasan mengenai RLS (Row Level Security) dan Service Role Key.

---

## 📅 12 Mei 2026 (Sync Engine & Database V5)
- **Database Upgrade:** Menaikkan versi database lokal (Dexie) ke Versi 5.
- **Kolom Sinkronisasi:** Menambahkan kolom `isSynced` di tabel Categories, Products, Suppliers, dan Transactions.
- **Sync Engine:** 
    - Membuat `src/lib/sync.ts` sebagai pengelola pengiriman data otomatis.
    - Implementasi logika "Background Sync" setiap 30 detik.
    - Integrasi otomatis saat perangkat kembali Online.
- **Data Integrity:** Menyesuaikan field transaksi agar cocok dengan struktur tabel di Supabase.
- **Auto-Sensor:** Implementasi Dexie Hooks agar setiap perubahan data lokal otomatis memicu antrean sinkronisasi ke Cloud secara cerdas.

---
*Log akan terus diperbarui seiring berjalannya project...*
