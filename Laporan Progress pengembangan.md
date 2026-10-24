# LAPORAN PROGRESS PENGEMBANGAN APLIKASI MOBILE SEBLAK PRASMANAN

## Tema dan Hasil Wawancara

### 1. Pendahuluan

Pengembangan aplikasi mobile Seblak Prasmanan POS & Order System merupakan proyek yang bertujuan untuk mempermudah operasional kasir, pengelolaan variasi topping, perhitungan harga pesanan secara otomatis, pencatatan transaksi, serta penyusunan laporan penjualan harian. Aplikasi ini dirancang untuk mempermudah operasional dua role utama:

Kasir: Melayani transaksi di kasir (Point of Sale), memilih topping/level pedas, mencetak struk, dan mengelola antrean pesanan aktif.

Owner: Memantau ringkasan omzet, analisis laporan penjualan harian/bulanan, serta mengelola data master produk/topping dan akun pengguna.

Sebagai langkah awal, tim telah melakukan wawancara dengan pemilik Kedai Seblak Prasmanan untuk memahami alur bisnis yang berjalan, kendala penimbangan/perhitungan topping, serta kebutuhan fitur aplikasi.

### 2. Tujuan Wawancara

Wawancara dilakukan dengan tujuan:

1. Mengetahui alur pemesanan dan transaksi di kasir (Point of Sale) yang sedang berjalan.
2. Mengidentifikasi variasi produk (kerupuk, makaroni, sosis, bakso, ceker, telur, sayur, tahu), pilihan kuah, dan level kepedasan (level 0–5).
3. Memahami mekanisme pembayaran di meja kasir (Tunai, QRIS, E-Wallet) serta pencatatan kembalian.
4. Mengetahui kendala perhitungan manual dan manajemen status pesanan aktif.
5. Mengidentifikasi kebutuhan spesifik untuk Role Kasir (efisiensi POS) dan Role Owner (manajemen & laporan).
6. Menentukan prioritas fitur dalam pembagian tugas kelompok.

### 3. Pelaksanaan Wawancara

Wawancara dilakukan secara langsung bersama Pemilik Kedai Seblak Prasmanan. Pertanyaan yang diajukan mencakup alur pemilihan topping prasmanan, kendala antrean, skema pembayaran, pembagian hak akses antara Kasir dan Owner, serta kebutuhan format laporan penjualan.

### 4. Hasil Wawancara

Berdasarkan hasil wawancara, diperoleh beberapa informasi mengenai kondisi operasional Kedai Seblak Prasmanan saat ini:

1. **Proses Penjualan:**
* Penjualan dilakukan secara *offline* di mana pelanggan memilih langsung varian topping, tingkat kepedasan, dan pilihan kuah di etalase prasmanan.
* Kasir menginput daftar item yang dipilih pelanggan, memilih nomor meja, lalu menghitung total harga akhir.


2. **Pengelolaan Produk dan Topping:**
* Produk dibagi berdasarkan kategori topping (Kerupuk Rp 1.000, Makaroni Rp 1.000, Sosis Rp 2.000, Bakso Rp 2.000, Ceker Rp 2.000, Telur Rp 1.500, Sayur Rp 1.000, Tahu Rp 1.000), pilihan kuah, serta level pedas (0–5).
* Kendala yang dihadapi adalah sering terjadi antrean panjang di meja kasir karena hitungan manual item prasmanan yang cukup banyak per porsi.


3. **Pemesanan dan Pembayaran:**
* Pelanggan melakukan pemesanan langsung di kasir atau melalui meja pemesanan.
* Metode pembayaran yang disediakan meliputi:
* **Tunai (Cash)** dengan fitur perhitungan kembalian/numpad.
* **QRIS** (pembayaran digital via scan QR).
* **E-Wallet**.


* Setelah pembayaran selesai, sistem menghasilkan **Struk Transaksi** untuk diberikan kepada pelanggan atau sebagai acuan dapur.


4. **Pengguna Sistem:**
* **Owner:** Mengelola laporan penjualan harian/bulanan, melihat grafik riwayat transaksi, serta memantau ringkasan omzet tunai dan non-tunai.
* **Kasir:** Melayani pesanan *Point of Sale*, menginput topping, menghitung total, mengelola status pesanan aktif (Diproses, Siap Bayar, Selesai), dan mencetak struk.

### 5. Kebutuhan Aplikasi

1. Antarmuka Kasir (POS): Input visual topping, kuah, level cabai, dan kalkulator numpad otomatis.
2. Manajemen Pesanan Aktif: Pemantauan status pesanan berdasarkan nomor meja (Diproses, Siap Bayar, Selesai).
3. Modul Pembayaran & Struk: Opsi Tunai/QRIS/E-Wallet serta modal cetak/preview struk.
4. Dashboard & Laporan Owner: Ringkasan performa penjualan harian, grafik tren transaksi, serta pemisahan omzet Tunai dan Non-Tunai.

### 6. Progress Pengembangan Saat Ini

Pada tahap ini, pengembangan aplikasi telah memasuki tahap perancangan antarmuka (UI/UX) dan pembagian komponen *frontend/mobile*:

1. Menyusun alur sistem kasir (*Point of Sale*) Seblak Prasmanan.
2. Mengidentifikasi seluruh item menu, topping, dan level pedas.
3. Merancang modul antarmuka utama:
* Screen Login Kasir dan Owner 
* Dashboard POS Kasir (Pilih Topping, Level Pedas, Ringkasan Pesanan)
* Screen Pesanan Aktif (Filter Status & No. Meja)
* Screen & Modal Pembayaran (Support Tunai, QRIS, E-Wallet + Keypad Numpad)
* Modal Struk Transaksi (*ReceiptModal*)
* Screen Riwayat Transaksi & Laporan Penjualan
4. Membagi modul pengerjaan komponen kepada setiap anggota tim.


### 7. Kesimpulan

Berdasarkan hasil analisis dan rancangan kebutuhan, sistem **Seblak Prasmanan POS** dirancang untuk memangkas waktu transaksi di kasir serta mengotomatisasi perhitungan harga dari kombinasi topping, dan level pedas. Tampilan antarmuka telah disesuaikan agar intuitif digunakan oleh kasir maupun pemilik toko, lengkap dengan laporan transaksi harian terintegrasi.


## Role yang Ada pada Sistem

1. **Owner**
2. **Kasir**

## Pembagian Tugas
1. Shinta PM : Screen Login Kasir, Dashboard POS Kasir (Pilih Topping, Level Pedas, Ringkasan Pesanan), Screen & Modal Pembayaran (Support Tunai, QRIS, E-Wallet + Keypad Numpad), Modal Struk Transaksi (*ReceiptModal*)


2. Maya : Screen Pesanan Aktif (Filter Status & No. Meja),Screen Riwayat Transaksi & Laporan Penjualan

3. Faija : Sreen Laporan 

4. Dewi : Dashboard Owner

## Bukti Membangun Layer 
Bukti Wawancara:
https://drive.google.com/drive/folders/1QJAz01e1GnNtQZyxFPKLIcbxwteOWv7K
