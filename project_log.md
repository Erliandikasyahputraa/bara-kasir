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
- **Bug Fix (Sync Loop):** Memperbaiki logika sensor agar tidak terjadi pengulangan sinkronisasi (infinite loop) saat sistem sedang memperbarui status data.

---

## 📅 12 Mei 2026 (UI & Visual Feedback)
- **Header Baru:** Menambahkan Header statis yang menampilkan Nama Toko.
- **Visual Sync Indicator:** Menambahkan ikon awan di pojok kanan atas untuk memberi tahu User status sinkronisasi (Pending vs Tercadangkan).
- **Notifikasi Cloud:** Integrasi Toast Notification untuk memberi tahu jumlah data yang berhasil diamankan ke awan.
---

## 📅 12 Mei 2026 (Security & Multi-User Roles)
- **Sistem Role:** Implementasi jabatan User (Owner vs Kasir).
- **Proteksi Menu:** Menyembunyikan menu Laporan dan Pengaturan jika user bukan Owner.
- **UI Cleanup:**
    - Menghapus pengingat Backup JSON (karena sudah ada Cloud Sync).
    - Menghapus footer teks di halaman Login untuk estetika premium.
- **Auth Context:** Membangun sistem pengenal user global menggunakan React Context.

*Log akan terus diperbarui seiring berjalannya project...*
