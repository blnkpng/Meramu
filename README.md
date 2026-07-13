# MERAMU Frontend V1

Frontend awal MERAMU Kombucha dengan desain iOS-inspired, mobile-first, responsif, dan siap dijadikan PWA.

## Login preview

- Username: `admin`
- Password: `123456`

Login ini hanya mode demo agar tampilan bisa diuji sebelum tersambung ke Google Apps Script.

## Struktur

```text
index.html
manifest.json
service-worker.js
assets/
  css/master.css
  js/config.js
  js/api.js
  js/app.js
  images/logo-meramu.png
  icons/
```

## Menjalankan lokal

PWA dan service worker memerlukan HTTP/HTTPS, bukan dibuka langsung dengan `file://`.

Contoh dengan Python:

```bash
python -m http.server 8080
```

Lalu buka `http://localhost:8080`.

## Menghubungkan backend

Buka `assets/js/config.js`:

```js
API_URL: 'URL_DEPLOYMENT_GOOGLE_APPS_SCRIPT',
DEMO_MODE: false
```

Endpoint backend diharapkan menerima POST berbentuk:

```json
{
  "action": "login",
  "payload": {}
}
```

## Pemasangan di HP

Frontend sebaiknya di-host pada HTTPS, misalnya Netlify. Setelah terbuka di browser:

- Android/Chrome: pilih **Install app** atau **Tambahkan ke layar utama**.
- iPhone/Safari: tekan **Share** lalu **Add to Home Screen**.

## Catatan

- Semua gaya utama berada di `assets/css/master.css`.
- Input memakai ukuran font 16px agar iPhone tidak auto-zoom.
- Safe area iPhone sudah memakai `env(safe-area-inset-*)`.
- Navigasi bawah untuk HP dan sidebar untuk desktop.


## Pembaruan V1.1
- Branding sidebar putih dan subtitle menjadi Meramu Center.
- Kartu perhatian dashboard dirapikan.
- Menu Produksi, Transaksi, Stok, dan Lainnya menjadi dua kolom pada layar kecil.
- Halaman login mobile dibuat lebih berwarna dan tetap profesional.


## Pembaruan V1.2

- Menghapus garis dekoratif hijau–amber di bagian atas kartu login mobile.
- Merapikan jarak atas form setelah dekorasi dihapus.
- Memperbarui versi aplikasi dan cache PWA menjadi 1.28.2.


## V1.4 — Motion System
- Animasi perpindahan halaman dan stagger card.
- Feedback tekan pada tombol/card.
- Animasi menu bottom navigation dan sidebar aktif.
- Login masuk bertahap serta shake saat validasi gagal.
- Spinner tombol saat proses login.
- Count-up KPI dashboard dan progress fermentasi.
- Toast sukses, info, peringatan, dan error.
- Komponen reusable skeleton loading dan bottom sheet.
- Tetap menghormati pengaturan reduced motion perangkat.


## Pembaruan V1.5
- Bottom navigation menjadi floating dock dengan margin, radius, blur, dan shadow.
- Menu tetap menempel pada viewport saat halaman digulir panjang.
- Menghapus fill-mode transform pada animasi app shell yang dapat mengubah perilaku `position: fixed`.
- Menambah ruang bawah konten agar baris terakhir tidak tertutup navigasi.


## Pembaruan V1.6 — API & Batch F1
- Frontend terhubung ke Web App Apps Script: `https://script.google.com/macros/s/AKfycbwKIp3HXTTZy8RoUdbfM7CIWiwb69qfSILP-osd6I-w4rYuURTzCZn5ZHpBcTsr6DnV6g/exec`.
- Mode demo dinonaktifkan.
- Login memakai user pada sheet MASTER.
- Dashboard mengambil omzet, laba, stok, dan status batch asli.
- Form Buat Batch F1 aktif sebagai bottom sheet responsif.
- Kebutuhan teh, air, gula, dan starter dihitung otomatis dari MASTER_RESEP.
- Kecukupan stok dan estimasi HPP ditampilkan sebelum simpan.
- Penyimpanan batch memanggil `createBatch()` dan otomatis membuat pengingat Calendar hari ke-5, 8, 10, 12, dan 14.


## Pembaruan V1.7 — Full Card Click
- Seluruh area card modul dapat diklik: ikon, judul, deskripsi, ruang kosong, dan panah.
- Semua card memakai satu pola event yang sama.
- Elemen di dalam card tidak lagi mengambil target klik sendiri.
- Feedback tekan berlaku pada seluruh permukaan card.


## Pembaruan V1.8 — Full Card Click Final
- Klik card ditangani dengan event delegation pada capture phase.
- Ikon, judul, deskripsi, panah, serta seluruh ruang kosong menghasilkan aksi yang sama.
- Ditambahkan lapisan hit transparan pada seluruh permukaan card.
- CSS dan JavaScript memakai cache-busting `?v=1.28.1`.
- Service worker tidak lagi mempertahankan file JS/CSS versi lama.


## Pembaruan V1.9 — Card Click Final
- Setiap card memiliki elemen hitbox nyata yang menutup 100% permukaannya.
- Klik ikon, teks tengah, deskripsi, ruang kosong, dan panah menjalankan aksi yang sama.
- Lapisan pseudo-element versi lama dinonaktifkan agar tidak bertabrakan.
- Cache CSS dan JavaScript dinaikkan ke versi 1.28.1.


## Pembaruan V1.10 — Modal Overlay Fix
- Menemukan penyebab sebenarnya: bottom sheet tertutup masih transparan di tengah layar desktop dan menyerap klik.
- Backdrop dan bottom sheet sekarang memakai `pointer-events: none` serta `visibility: hidden` saat tertutup.
- Modal diberi atribut `inert` ketika tidak aktif.
- Seluruh card kolom kiri, tengah, dan kanan sekarang menerima klik pada seluruh permukaannya.


## Pembaruan V1.11 — Internal Modal Scroll
- Card modal tetap diam dan tidak lagi ikut bergulir.
- Header dan tombol tutup menetap di atas.
- Isi form bergulir di area internal card.
- Tombol simpan menetap di bagian bawah modal.
- Scrollbar dibuat tipis, hijau, dan menyatu dengan radius card.
- Aman untuk layar HP, tablet, dan desktop.


## Pembaruan V1.12 — Mobile Two Columns
- Tanggal produksi dan Volume F1 tetap sejajar dua kolom di layar kecil.
- pH awal dan Brix awal tetap sejajar dua kolom.
- Ukuran label, jarak, padding, dan suffix liter dipadatkan agar tidak meluber.
- Tetap memakai font input 16px agar iPhone tidak auto-zoom.


## Pembaruan V1.13 — Fermentasi F1
- Card Pantau Fermentasi aktif.
- Form pengecekan pH, Brix, aroma, rasa, SCOBY, kondisi cairan, dan catatan.
- Timeline histori pengecekan per batch.
- Card Selesaikan F1 aktif.
- Hitung otomatis volume bersih setelah susut.
- Setelah selesai, status menjadi Siap Bottling dan pengingat Calendar mendatang dibatalkan.
- Card batch terbaru dapat ditekan untuk langsung membuka pemantauan.


## Pembaruan V1.14 — Bottling & Starter
- Card Bottling Original, Telang, Rosella, dan Simpan Starter aktif.
- Satu form universal mengikuti varian yang dipilih.
- Menampilkan batch siap bottling dan sisa volume aktual.
- Menghitung hasil botol/starter, EXP, HPP total, dan HPP per hasil.
- Mengecek stok gula, ekstrak, botol, stiker, dan bahan varian.
- Menolak proses bila stok atau sisa batch tidak cukup.
- Menampilkan riwayat bottling terbaru di halaman Produksi.


## Pembaruan V1.15 — Riwayat Produksi
- Card Riwayat Produksi sudah aktif.
- Halaman riwayat menggabungkan Batch F1, pengecekan fermentasi, bottling, dan starter.
- Tab Semua, Batch F1, Pengecekan, Bottling, dan Starter.
- Filter pencarian, tanggal, status batch, dan varian.
- Ringkasan total batch, batch aktif, siap bottling, produk, dan starter.
- Detail lengkap batch: volume, susut, pH, Brix, HPP, timeline, dan hasil bottling.
- Detail bottling: hasil, EXP, biaya, bahan, kemasan, dan batch sumber.
- Batch terbaru dan Bottling terbaru sejajar dua kolom di desktop.
- Tampilan otomatis menjadi satu kolom pada layar kecil.


## Pembaruan V1.16 — Dashboard Rapi
- Lebar konten desktop diperbesar agar ruang layar tidak terbuang.
- Hero omzet dan panel prioritas dibuat sejajar serta seimbang.
- Laba, pengeluaran, dan HPP ditampilkan dalam ringkasan yang jelas.
- Empat KPI memiliki ukuran dan jarak yang konsisten.
- Aksi cepat dibuat dua kolom dengan bentuk card horizontal.
- Stok produk mengambil data asli PR001–PR004, bukan angka contoh.
- Batch aktif memakai lebar penuh saat belum ada data.
- Panel aksi cepat dan stok produk dibuat sejajar di desktop.
- Bottling pada Aksi Cepat sekarang aktif.


## Pembaruan V1.17 — Hero Dashboard Proporsional
- Judul Penjualan bulan berjalan diperbesar.
- Nominal omzet dibuat dominan dan sesuai ukuran card.
- Badge Bulan ini diperbesar.
- Ringkasan laba, pengeluaran, dan HPP dibuat lebih tinggi dan mudah dibaca.
- Isi card didistribusikan vertikal agar tidak berkumpul di sudut bawah.
- Ukuran tetap responsif di desktop, tablet, dan HP.


## Pembaruan V1.18 — Stok Awal & Pembelian
- Card Stok Awal aktif dengan beberapa item dalam satu transaksi.
- Card Pembelian Bahan aktif dengan beberapa item dalam satu nota.
- Harga satuan, nilai per item, subtotal, diskon, ongkir, dan total dihitung otomatis.
- Pilihan item menampilkan stok serta HPP saat ini.
- Item ganda dalam satu formulir ditolak.
- Aktivitas terbaru membaca transaksi asli dari database.
- Daftar stok perlu perhatian membaca stok asli, bukan data contoh.
- Tampilan dua kolom tetap dipertahankan pada layar kecil.


## Pembaruan V1.19 — Layout Form & Nota Otomatis
- Modal Stok Awal dan Pembelian diperlebar serta dirapikan di desktop.
- Metadata pembelian disusun empat kolom pada layar besar dan dua kolom pada layar kecil.
- Setiap item memiliki header dan nomor urut yang jelas.
- Tombol hapus dipindahkan ke bagian atas card item.
- Pilihan item, jumlah, harga, dan nilai item memiliki pembagian ruang yang lebih seimbang.
- Ringkasan pembelian dibuat empat kolom di desktop dan dua kolom di HP.
- Nomor nota tidak lagi dapat diisi manual.
- Backend membuat nomor nota otomatis dengan format `NOTA-YYYYMMDD-HHMMSS-XXX`.


## Pembaruan V1.20 — Format Rupiah & Alignment
- Kolom Harga satuan, Diskon, dan Ongkir otomatis berformat Rupiah.
- Mengetik `50000` langsung tampil sebagai `Rp50.000`.
- Nilai numerik asli tetap dikirim ke backend tanpa simbol atau titik.
- Tinggi input Item, Jumlah, Harga satuan, dan Nilai item diseragamkan.
- Satuan berada tepat di tengah input jumlah.
- Label dan input tidak lagi naik-turun pada desktop maupun HP.


## Pembaruan V1.21 — Penjualan Produk
- Card Penjualan di Dashboard dan menu Transaksi sudah aktif.
- Mendukung beberapa produk dalam satu invoice.
- Nomor invoice dibuat otomatis oleh backend.
- Harga jual otomatis dari Master Item dan dapat disesuaikan.
- Validasi stok dilakukan sebelum transaksi disimpan.
- Diskon dan biaya kirim dihitung otomatis.
- Menampilkan subtotal, total, HPP, dan estimasi laba kotor.
- Format Rupiah aktif saat mengetik harga, diskon, dan biaya kirim.
- Setelah disimpan, stok produk dan dashboard langsung diperbarui.


## Pembaruan V1.22 — Pengeluaran Operasional
- Card Pengeluaran pada menu Transaksi sudah aktif.
- Nomor transaksi dibuat otomatis oleh backend.
- Kategori biaya operasional tersedia dalam dropdown.
- Nominal memakai format Rupiah otomatis.
- Tersedia penerima, metode pembayaran, catatan, dan petugas.
- Preview transaksi diperbarui saat form diisi.
- Pengeluaran tidak mengubah stok.
- Dashboard pengeluaran dan laba operasional langsung diperbarui.
- Aktivitas terbaru menampilkan nama dan kategori pengeluaran.


## Pembaruan V1.23 — Pemakaian Bahan
- Card Pemakaian Bahan pada menu Transaksi sudah aktif.
- Mendukung beberapa item dalam satu transaksi.
- Nomor transaksi dibuat otomatis oleh backend.
- Tujuan pemakaian dapat dipilih: rusak, tester, sampel, uji coba, kebersihan, konsumsi internal, kedaluwarsa, operasional, atau lainnya.
- Stok dan HPP rata-rata setiap item ditampilkan otomatis.
- Nilai persediaan keluar dihitung berdasarkan HPP.
- Pemakaian ditolak bila stok tidak cukup atau item ganda.
- Transaksi tidak mencatat kas masuk maupun kas keluar.
- Aktivitas terbaru menampilkan tujuan dan item yang digunakan.


## Pembaruan V1.24 — Stok Opname
- Card Stok Opname pada menu Stok sudah aktif.
- Daftar item dapat difilter berdasarkan kategori dan pencarian.
- Stok fisik dapat dibiarkan kosong untuk item yang belum dihitung.
- Tombol Isi sesuai sistem mempercepat pengisian.
- Selisih jumlah dan nilai HPP dihitung langsung.
- Tersedia filter Hanya yang selisih.
- Ringkasan menampilkan item dihitung, koreksi, stok lebih, stok kurang, dan nilai bersih.
- Sistem meminta konfirmasi untuk selisih besar.
- Nomor opname dibuat otomatis oleh backend.
- Setelah disimpan, stok langsung disesuaikan dengan stok fisik.


## Pembaruan V1.25 — Riwayat Transaksi Lengkap
- Card Riwayat Transaksi pada menu Transaksi sudah aktif.
- Setiap nomor referensi ditampilkan sebagai satu transaksi, bukan terpisah per item.
- Filter tanggal awal, tanggal akhir, jenis transaksi, dan metode pembayaran tersedia.
- Pencarian mencakup nomor referensi, item, kode, supplier, pelanggan, petugas, dan catatan.
- Ringkasan mengikuti filter aktif: total transaksi, pemasukan, pengeluaran, stok masuk, dan stok keluar.
- Detail transaksi menampilkan identitas, pihak terkait, petugas, catatan, mutasi item, HPP, harga, nilai stok, dan arus kas.
- Aktivitas terbaru sekarang dapat diklik untuk membuka detail transaksi.
- Halaman responsif untuk desktop, tablet, dan HP.
- Backend tetap Code.gs V2.11.


## Pembaruan V1.26 — Laporan Usaha
- Tombol Laporan pada header Dashboard dan menu Lainnya sudah aktif.
- Satu halaman memuat Ringkasan, Penjualan, Persediaan, dan Produksi.
- Periode cepat: hari ini, 7 hari, bulan ini, bulan lalu, tahun ini, dan semua data.
- Filter kategori item, varian produk, dan metode pembayaran.
- KPI berubah otomatis sesuai jenis laporan dan filter.
- Grafik tren menggunakan SVG tanpa library eksternal.
- Peringkat produk, metode pembayaran, kategori stok, dan varian produksi.
- Tabel laporan dapat dicetak dan diekspor ke CSV.
- Perbandingan dengan periode sebelumnya tampil pada KPI utama.
- Backend V2.12 menyediakan hingga 10.000 baris jurnal untuk laporan.


## Pembaruan V1.27 — Rincian Stok & Master Item
- Card Stok Bahan, Stok Kemasan, dan Stok Produk sudah aktif.
- Setiap kelompok stok memiliki KPI, pencarian, filter status, filter kategori, dan detail mutasi.
- Detail item menampilkan stok, minimum, HPP, nilai stok, harga jual, identitas, dan jurnal terbaru.
- Master Item & Harga pada menu Lainnya sudah aktif.
- Administrator dapat menambah dan mengedit item tanpa mengubah stok atau HPP secara manual.
- Kode item otomatis disarankan berdasarkan jenis.
- Harga jual memakai format Rupiah.
- Item dapat dinonaktifkan hanya saat stok 0 dan tidak dipakai resep aktif.
- Item sistem LN001 tetap dilindungi.
- Backend V2.13 menambahkan createMasterItem, updateMasterItem, dan setMasterItemActive.


## Perbaikan V1.28.1 — Informasi Harga Master Item
- Bahan dan Kemasan menampilkan Harga Beli Terakhir, bukan Harga Jual.
- Produk Jual tetap menampilkan HPP Rata-rata dan Harga Jual.
- Starter/Internal menampilkan HPP Rata-rata dan Nilai Stok.
- Form Harga Jual hanya muncul untuk jenis Produk Jual.
- Harga beli terakhir tetap berasal otomatis dari transaksi Pembelian.
- HPP rata-rata tetap dihitung sistem dan tidak dapat diedit manual.
- Card Master Item dibuat lebih ringkas dan rapi.
- Detail stok menggunakan label harga sesuai jenis item.
- Backend V2.13.1 memaksa harga jual Rp0 untuk item nonproduk.


## Pembaruan V1.28 — Pengaturan Aplikasi
- Card Pengaturan pada menu Lainnya sudah aktif.
- Profil usaha dapat diubah dari aplikasi dan langsung memperbarui identitas sidebar.
- Standar produksi: ukuran botol, hari F1, masa simpan, starter, dan target susut.
- Metode pembayaran, pihak umum, dan awalan nomor transaksi dapat diatur.
- Google Calendar dapat diaktifkan, disinkronkan, dan diuji dari aplikasi.
- Administrator dapat membuat, mengedit, mengaktifkan, dan menonaktifkan pengguna.
- Role tersedia: Administrator, Produksi, dan Kasir.
- Hak akses dasar diterapkan pada frontend dan backend.
- Password akun dapat diubah melalui halaman Sistem & Keamanan.
- Informasi versi, database, item, produksi, dan jurnal tersedia.
- Backend V2.14 menggunakan sheet MASTER yang sama tanpa reset database.


## Perbaikan V1.28.1 — Master Resep & Pintasan Pengguna
- Card Master Resep pada menu Lainnya sudah aktif.
- Card Pengguna langsung membuka tab Pengguna pada halaman Pengaturan.
- Master Resep dikelompokkan berdasarkan Batch F1 dan varian Bottling.
- Administrator dapat menambah, mengedit, mengaktifkan, dan menonaktifkan baris resep.
- Jumlah resep mendukung basis per liter F1 atau per botol.
- Satuan otomatis mengikuti Master Item.
- Resep F1 dikunci pada varian SEMUA, arah KELUAR, dan basis PER_LITER.
- Satu varian Bottling hanya boleh memiliki satu hasil MASUK aktif.
- Produksi berikutnya langsung menggunakan resep aktif terbaru.
- Backend V2.15 menambahkan pengelolaan Master Resep yang aman.


## Perbaikan V1.28.2 — Rapikan Judul Halaman
- Menghilangkan judul dan subjudul ganda pada halaman sekunder.
- Header utama di bagian atas sekarang menjadi satu-satunya judul halaman.
- Halaman yang dirapikan: Laporan, Stok Detail, Master Item, Master Resep, dan Pengaturan Aplikasi.
- Toolbar aksi tetap dipertahankan dan dirapikan agar lebih bersih.
- Tidak ada perubahan struktur data atau backend.


## Perbaikan V1.28.3 — Judul Stok Dinamis
- Judul header halaman stok tidak lagi memakai tulisan umum Rincian Stok.
- Stok Bahan menampilkan judul Stok Bahan.
- Stok Kemasan menampilkan judul Stok Kemasan.
- Stok Produk menampilkan judul Stok Produk.
- Pilihan kelompok stok disimpan sehingga tetap sesuai setelah halaman dimuat ulang.
- Judul tab browser juga mengikuti halaman stok yang sedang dibuka.
- Backend tetap V2.15 dan tidak perlu diperbarui.


## Pembaruan V1.29 — Dashboard Operasional
- Dashboard menjadi pusat kontrol berbasis role Administrator, Produksi, dan Kasir.
- Ringkasan utama menggunakan data hari ini dan bulan berjalan.
- KPI dinamis menyesuaikan tugas akun.
- Prioritas operasional menampilkan stok habis, stok menipis, batch perlu cek, siap bottling, dan lewat hari ideal.
- Grafik tujuh hari menyesuaikan role.
- Aktivitas terbaru diambil dari jurnal transaksi.
- Produk terlaris dan hasil produksi per varian tampil pada Dashboard.
- Tombol Buat Aktivitas membuka launcher berisi aktivitas yang diizinkan.
- Aksi cepat pada Dashboard menyesuaikan hak akses.
- Backend V2.16 menyediakan dataset Dashboard terpusat dan menyembunyikan informasi sensitif dari role yang tidak berhak.


## Rilis V1.30 — Siap Produksi
- Request POST memiliki requestId dan perlindungan idempotensi backend.
- Retry otomatis hanya dilakukan untuk timeout, koneksi, dan error sementara.
- Form tetap terbuka ketika penyimpanan gagal.
- Initial load memakai satu bundle API pada backend V2.17.
- Sesi berakhir otomatis mengarahkan pengguna ke halaman login.
- Pembatasan percobaan login dan penguncian sementara tersedia.
- Pengaturan backup harian/mingguan dan retensi file tersedia.
- Tombol Buat Backup Sekarang dan Perbarui Jadwal tersedia.
- Kesehatan sistem menampilkan sheet, trigger, log, backup, PWA, dan error terakhir.
- Aktivitas penting dicatat pada MASTER bagian LOG AKTIVITAS SISTEM.
- Banner offline dan pembaruan aplikasi ditambahkan.
- Service Worker membersihkan cache lama dan menyediakan fallback offline.


## Perbaikan V1.30.1 — Header Lebih Bersih
- Tombol Laporan pada kanan atas dihapus dari header global.
- Tombol Buat Aktivitas pada kanan atas dihapus dari header global.
- Perubahan berlaku pada seluruh menu karena header digunakan bersama.
- Menu Laporan pada halaman Lainnya tetap tersedia.
- Aksi cepat pada Dashboard dan menu masing-masing tetap tersedia.
- Backend tetap V2.17 dan tidak perlu diperbarui.


## Perbaikan V1.30.2 — Label Produksi Thermal 58 mm
- Card Label Print ditambahkan di menu Lainnya, tepat setelah Pengaturan.
- Card tersedia untuk Administrator dan Produksi.
- Batch terbaru dipilih otomatis.
- Pengguna dapat memilih ulang batch produksi lama.
- Label mengambil Tanggal F1, Batch ID, Volume F1, pH Awal, Brix Awal, Starter, dan Estimasi F2.
- Pratinjau mengikuti ukuran thermal 58 mm.
- Tombol Cetak Label 58 mm membuka dialog print browser.
- Backend tetap V2.17 dan tidak perlu diperbarui.


## Perbaikan V1.30.3 — Editor Label Thermal 58 mm
- Card Edit Hasil Print ditambahkan pada halaman Label Print.
- Struktur informasi label tetap paten.
- Font, ukuran huruf, ukuran logo, jarak baris, lebar isi, ketebalan nilai, posisi logo, posisi nilai, garis pemisah, dan kapitalisasi dapat diubah.
- Pratinjau berubah langsung.
- Pengaturan aktif ikut dipakai pada hasil cetak.
- Pengaturan disimpan pada browser perangkat.
- Tombol Reset mengembalikan desain standar MERAMU.
- Backend tetap V2.17.


## V1.31 — Pembatalan dan Koreksi Transaksi
- Administrator dapat membatalkan transaksi dari halaman Riwayat Transaksi.
- Transaksi asli tidak dihapus dan diberi status DIBATALKAN.
- Sistem membuat jurnal PEMBATALAN sebagai pembalik stok dan kas.
- Alasan pembatalan wajib minimal 10 karakter.
- Pembatalan kedua pada transaksi yang sama ditolak.
- Transaksi stok masuk yang sudah dipakai atau dijual setelahnya tidak dapat dibatalkan.
- Setelah pembatalan, form transaksi yang sama dapat dibuka untuk pencatatan ulang.
- Riwayat menampilkan status Aktif, Dibatalkan, dan Jurnal Pembatalan.
- Laporan dan Dashboard memperhitungkan jurnal pembatalan.
- Produksi F1 dan Bottling tetap dikoreksi melalui alur Produksi.


## V1.32 — Tutup Kas Harian
- Card Tutup Kas Harian tersedia pada menu Transaksi untuk Administrator dan Kasir.
- Rekap penjualan tunai, QRIS, transfer, debit/non-tunai, serta pengeluaran tunai dihitung otomatis.
- Kas seharusnya dihitung dari saldo awal + penjualan tunai - pengeluaran tunai.
- Kasir hanya menutup kas miliknya sendiri.
- Administrator dapat memilih pengguna, menyetujui, dan membuka kembali Tutup Kas dengan alasan.
- Penjualan baru dan pembatalan transaksi dikunci setelah kas aktif ditutup.
- Riwayat penutupan dan audit persetujuan tetap tersimpan.
- Tersedia cetak Tutup Kas thermal 58 mm.


## V1.33 — Label Bottling + Kedaluwarsa + QR Batch
- Card Label Bottling tersedia di menu Lainnya.
- Pilih Bottling ID dan jumlah label.
- Label thermal 58 mm memuat logo, varian, volume, Batch ID, Bottling ID, tanggal bottling, EXP, pH/Brix, dan QR.
- QR menyimpan informasi traceability batch dan dapat dipindai secara offline.
- Editor memiliki tata letak Standar, Ringkas, dan QR di atas.
- Riwayat cetak tersimpan pada Log Aktivitas backend dan mendukung cetak ulang.
- Starter tidak menggunakan label produk.
- Memerlukan backend V2.20.


## V1.34 — Backup & Pemulihan Data
- Card Backup & Pemulihan tersedia pada menu Lainnya untuk Administrator.
- Daftar backup Google Drive tampil langsung di web.
- File dapat diperiksa, dibuka di Drive, dan diunduh sebagai XLSX.
- Pemeriksaan memvalidasi lima sheet inti, header, schema, dan Administrator aktif.
- Pembersihan mengikuti jumlah retensi pada Pengaturan.
- Restore memerlukan password Administrator, teks PULIHKAN MERAMU, checkbox, dan konfirmasi terakhir.
- Sistem selalu membuat backup pengaman sebelum restore.
- Lima sheet inti dipulihkan, lalu rumus, validasi, format kondisi, dan proteksi dinormalkan.
- Pengguna wajib login kembali setelah restore.
- Backend V2.21 diperlukan.


## V1.35 — Pusat Notifikasi Operasional
- Pusat Notifikasi tersedia di menu Lainnya untuk Administrator, Produksi, dan Kasir.
- Dashboard menggunakan peringatan operasional terbaru sebagai daftar prioritas.
- Sumber notifikasi: Batch, stok, EXP Bottling, backup, Tutup Kas, dan error sistem.
- Role Produksi melihat Batch, bahan, kemasan, serta EXP.
- Role Kasir melihat stok produk dan EXP.
- Administrator melihat seluruh notifikasi.
- Tindakan: Sudah Dibaca, Tunda, dan Selesaikan.
- Status disimpan per pengguna pada Log Aktivitas.
- Notifikasi yang diselesaikan muncul kembali bila fingerprint kondisinya berubah.
- Google Calendar menerima stok habis, EXP H-7/H-3/H0, produk kedaluwarsa, dan backup kritis.
- Pengingat Batch H+5, 8, 10, 12, dan 14 tetap aktif.
- Backend V2.22 diperlukan.


## V1.36 — Manajemen Perangkat & Sesi Login
- Registry sesi persisten pada MASTER kolom AR:BI.
- Daftar sesi aktif, perangkat baru, dan login gagal.
- Batas perangkat: Administrator 3, Produksi 2, Kasir 1.
- Masa sesi 12 jam dan timeout tidak aktif 2 jam.
- Keluar paksa satu perangkat, semua sesi pengguna, atau semua perangkat lain.
- Token asli tidak disimpan ke Spreadsheet; hanya hash SHA-256.
- Login perangkat baru masuk Log Aktivitas dan Pusat Notifikasi Administrator.
- Ganti password atau nonaktifkan akun mengeluarkan sesi lama.
- Backend V2.23 diperlukan.


## V1.36.2 — QR Web Detail Batch pada Label Produksi
- Label Produksi thermal 58 mm sekarang memuat QR Detail Batch.
- QR membuka halaman web publik read-only dari Google Apps Script.
- Tautan dilindungi HMAC SHA-256 sehingga Batch ID saja tidak cukup untuk membuka data.
- Halaman web menampilkan Batch ID, status, hari fermentasi, tanggal produksi, volume, starter, estimasi F2, pH, dan Brix.
- Halaman selalu membaca data terbaru dari sheet BATCH; QR tidak perlu dicetak ulang saat status berubah.
- Data biaya, password, catatan internal, dan identitas operator tidak ditampilkan.
- Tombol Buka Detail Web tersedia pada halaman Label Print.
- Ukuran QR dapat diatur 16–28 mm dan tersimpan pada perangkat.
- Backend V2.24 diperlukan.


## V1.36.3 — Stok per Lot & FEFO
- Setiap Bottling ID menjadi lot stok produk.
- Ledger lot disimpan pada MASTER kolom BJ:BY tanpa sheet baru.
- Penjualan otomatis mengalokasikan lot dengan EXP terdekat menggunakan FEFO.
- Produk kedaluwarsa diblokir dari penjualan, tetapi tetap terlihat sebagai stok fisik.
- Form Penjualan menampilkan pratinjau Bottling ID dan EXP yang akan dipakai.
- HPP penjualan memakai HPP per lot, bukan hanya HPP rata-rata Master Item.
- Pembatalan Penjualan memulihkan stok ke lot asal.
- Pemakaian Produk dan koreksi Stok Opname ikut mengurangi lot dengan FEFO.
- Stok awal, pembelian produk, dan kelebihan opname masuk sebagai lot belum terlacak.
- Migrasi awal merekonsiliasi stok lama terhadap riwayat Bottling.
- Peringatan EXP sekarang memakai sisa nyata per Bottling ID.
- Halaman Stok Lot & FEFO tersedia untuk Administrator, Produksi, dan Kasir.
- Backend V2.25 diperlukan.


## V1.36.6 — QR Kulkas Dinamis
- Satu QR permanen per kulkas.
- Administrator membuat dan mengedit master kulkas.
- Administrator atau Kasir mengganti Bottling ID yang sedang dipajang.
- Produksi dapat melihat halaman customer dan mencetak QR.
- Halaman customer memperbarui isi setiap 60 detik.
- Customer melihat varian, Bottling ID, Batch F1, tanggal Bottling, EXP, dan status produk.
- Produk kedaluwarsa atau habis diberi peringatan.
- Pengaturan isi kulkas tidak memindahkan atau mengurangi stok.
- QR dapat dicetak sebagai kartu/stiker 10 × 15 cm.
- Master disimpan pada MASTER BZ:CG dan riwayat isi pada CH:CS.
- Tautan memakai HMAC SHA-256 dan tetap sama saat isi diganti.
- Backend V2.26 diperlukan.
