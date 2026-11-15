# Laporan Praktikum Pertemuan 9

# Media Penyimpanan: CRUD dengan Supabase (Database + Cloud Storage)

## Studi Kasus: Vapestore

# Hasil Uji Coba End-to-End (Produk)

## uji produk:
![alt text](hasil_tes_uji1/vid_produk.gif)

## Uji 1: Koneksi
![alt text](hasil_tes_uji1/uji_koneksi.png)

## Uji 2: Buka Manajemen Produk

![alt text](hasil_tes_uji1/dashboard_pelanggan_is_activeTrue.png)

![alt text](hasil_tes_uji1/after_edit.png)

## Uji 3: Tambah dengan foto

![alt text](hasil_tes_uji1/storage_bucket_produk.png)

![alt text](hasil_tes_uji1/Tambah_foto.jpeg)

![alt text](hasil_tes_uji1/url_foto.png)

## Uji 4: muncul di layar lain

![alt text](hasil_tes_uji1/4_detail.png)

## Uji 5: tambah tanpa foto

![alt text](hasil_tes_uji1/foto_null.jpeg)

![alt text](hasil_tes_uji1/url_foto_null.png)

Produk tersimpan tanpa foto. foto_url bernilai NULL dan tidak ada file baru di Storage. Aplikasi menampilkan gambar default sesuai kategori.

## Uji 6: ubah tanpa ganti foto

before edit:

![alt text](hasil_tes_uji1/before_edit.png)

after edit:

![alt text](hasil_tes_uji1/after_edit.png)

![alt text](hasil_tes_uji1/perubahan_edit.jpeg)


## Uji 6: Ubah dengan ganti foto

- foto baru tampil:

![alt text](hasil_tes_uji1/7_fto_ubah.jpeg)

- Storage sebelum 

![alt text](hasil_tes_uji1/storage_bucket_produk.png)

- Storage sesudah

![alt text](hasil_tes_uji1/7_storage_gnti_fto.png)

- foto_url lama:

![alt text](hasil_tes_uji1/7_url_ganti_fto_sblm.png)

- foto_url baru:

![alt text](hasil_tes_uji1/7_url_ganti_fto_ssdh.png)

## Uji 8: Nonaktifkan dan aktifkan

![alt text](hasil_tes_uji1/vid_8.gif)


## Uji 9: Validasi

![alt text](hasil_tes_uji1/9_stok0.gif)

![alt text](hasil_tes_uji1/9_stok0.png)

## Uji 10: Bukti Row Level Security (RLS)
Tujuan. Memastikan tabel products dilindungi RLS dan akses dari aplikasi diatur oleh policy.

![alt text](hasil_tes_uji1/10_1.png)

![alt text](hasil_tes_uji1/10_2.png)

![alt text](hasil_tes_uji1/10_3.png)

Karena RLS aktif, setiap operasi dari aplikasi (kunci publishable) hanya berhasil jika ada policy yang mengizinkannya. Keempat policy membuka operasi baca, tambah, ubah, dan hapus untuk peran public, sehingga fitur Kelola Produk dapat membaca, menambah, dan mengubah data. Fitur nonaktifkan produk memakai UPDATE (is_active). Policy DELETE tersedia tetapi tidak dipakai aplikasi karena penghapusan diganti dengan nonaktifkan.

## Uji 11: Persistensi

Tujuannya membuktikan data tersimpan di Supabase, bukan di memori aplikasi, jadi tetap ada setelah aplikasi ditutup dan dibuka lagi.

![alt text](hasil_tes_uji1/11.gif)

## Uji 12: Cek file yatim

Tujuannya memastikan setiap file di bucket produk dipakai oleh satu produk, dan setiap foto_url menunjuk file yang benar-benar ada. Kerjakan ini sebelum pembersihan produk TEST -. Kalau barisnya dihapus lebih dulu dari Table Editor, filenya jadi yatim karena Table Editor tidak ikut menghapus file di Storage.

- Query 1: file di bucket yang tidak dipakai produk mana pun

![alt text](hasil_tes_uji1/12_1.png)

- Query 2: produk yang menunjuk file yang tidak ada

![alt text](hasil_tes_uji1/12_2.png)

- Query 3: daftar lengkap untuk pembanding

![alt text](hasil_tes_uji1/12_3.png)

# Hasil Uji Coba End-to-End (Pesanan)

## Uji 1: Read
- Login sebagai pelanggan. Daftar dulu lewat halaman Register (akun hanya tersimpan di memori, jadi hilang saat aplikasi di-restart).
- Buka tab Pesanan.
- Lulus kalau halaman terbuka dengan tulisan “Belum ada pesanan” dan tidak ada error.
- bukti:

![alt text](hasil_tes_uji1/uji1_psnn.gif)

## Uji 2: Create
- Buka produk TEST - fto, lalu Tambah ke Keranjang, lalu Lihat Keranjang.
- Pilih metode pembayaran, lalu tekan Buat Pesanan.
- Lulus kalau:
    - Alert “Pesanan Dibuat” menampilkan nomor INV-1025.
    - Di tab Pesanan, pesanan itu muncul dengan status Menunggu Bayar.
    - Di Supabase Table Editor → orders (klik refresh) ada baris baru: id = INV-1025, customer = Saya, items, total (subtotal + 15.000 ongkir), method, dan status.
- bukti:

![alt text](hasil_tes_uji1/uji2_psnn.gif)

![alt text](hasil_tes_uji1/uji2_psnn_spbs.png)

## Uji 3: Update
- Tombol Proses dan Selesaikan hanya tampil untuk peran staf. Di aplikasi, akun pelanggan hanya melihat riwayat.
- Keluar dari akun pelanggan, lalu login sebagai karyawan (karyawan@vapestore.com / karyawan123) atau owner (admin@vapestore.com / admin123). Pilih peran yang sesuai di layar login kalau diminta.
- Buka Pesanan. INV-1025 harus tampil, karena sekarang pesanan dibaca dari Supabase, bukan dari memori akun.
- Tekan Proses, status jadi Diproses. Tekan Selesaikan, status jadi Selesai.
- Lulus kalau kolom status di Table Editor ikut berubah di tiap langkah (refresh dulu). 
- bukti:

![alt text](hasil_tes_uji1/uji3_psnn.gif)

## Uji 4: Persistensi
- Tutup Expo Go sepenuhnya, hentikan Expo dengan Ctrl+C, lalu jalankan npx expo start -c.
- Buka lagi aplikasinya dan login sebagai karyawan.
- Lulus kalau INV-1025 masih ada dengan status terakhir (Selesai).
- bukti:

![alt text](hasil_tes_uji1/uji4_psnn.gif)
