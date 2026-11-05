# Purchasing Tulola

Proyek Laravel dan React ini menggunakan **Bun 1.4.4** untuk dependensi frontend.

## Dokumentasi dan checkpoint

Mulai dari [indeks dokumentasi](docs/context/README.md) untuk kondisi proyek,
checkpoint per modul, dan hasil verifikasi terakhir. Baca
[arsitektur](docs/architecture.md) untuk peta kode dan
[panduan pengembangan](docs/development.md) untuk alur kerja serta perintah pemeriksaan.
Agent yang bekerja pada repositori ini mengikuti [AGENTS.md](AGENTS.md).

## Setup

Dengan PHP, Composer, dan Bun tersedia, jalankan:

```sh
composer setup
```

Perintah tersebut menyiapkan aplikasi, menjalankan migrasi, menginstal dependensi
dari `bun.lock`, dan membangun aset frontend.

## Frontend

```sh
bun install --frozen-lockfile
bun run dev
bun run check
bun run build
```

Gunakan `bun add <paket>` atau `bun add -d <paket>` untuk menambah dependensi.
Commit perubahan `package.json` beserta `bun.lock`.

Jalankan `composer dev` untuk pengembangan aplikasi dan `composer ci:check`
untuk pemeriksaan lengkap frontend dan backend.

## Stok untuk pengujian manual

Pada database `local`/`testing` yang sudah memiliki master item, toko pusat dan
admin aktif, jalankan:

```sh
php artisan db:seed --class=LocalStockSeeder --no-interaction
```

Seeder mengisi pasangan item/toko aktif yang belum memiliki saldo, melalui action
stok agar valuasi dan audit mutasi tercatat. Item dan toko berawalan `DEMO-`
dikecualikan agar skenario dashboard tetap terpisah. Saldo dan standar yang sudah
ada tidak diubah; menjalankannya kembali tidak mengisi ulang stok yang terpakai.
Master harga/minimum/target item dan akun pengguna tidak diubah.

| Lokasi | Saldo baru per item | Minimum / standar baru |
| --- | --- | --- |
| Pusat | 200 | 20 / 100 |
| Cabang | Bergiliran 0, 3, 10, 25 berdasarkan urutan SKU | 5 / 20 |

Biaya saldo memakai harga master, atau **1000 untuk simulasi** bila harga belum
diisi. Ini data uji, bukan penetapan harga operasional. Seeder tidak otomatis
dijalankan melalui `DatabaseSeeder` dan menolak lingkungan selain local/testing.

Untuk menguji: periksa Inventory pusat, login sebagai PIC cabang yang sesuai,
buat PR item stok, proses di pusat, tempatkan order, lalu konfirmasi penerimaan.
Gunakan filter stok cabang untuk mencoba kondisi habis/kritis/menipis/aman.

Pada 2026-11-05 seeder dijalankan pada MySQL lokal: 32 item HO-JKT (6400 unit)
dan 32 item PP (304 unit), dengan 64 mutasi saldo awal baru.

## Simulasi dashboard lokal

```sh
php artisan db:seed --class=LocalDashboardDemoSeeder
php scripts/check-local-dashboard.php
php artisan test
```

Seeder ini hanya dapat digunakan di lingkungan `local` atau `testing` dan tidak
menghapus data. Menjalankannya kembali tidak menggandakan data DEMO. Simulasi
membuat 13 PR, 6 order, 4 penerimaan, dan 12 mutasi stok melalui action aplikasi.
Skenario mencakup dua cabang, antrean bulan lalu, order gabungan, penerimaan
parsial/lengkap, penolakan, pembatalan, dan batas minimum stok.

| Akun lokal | Email | Password |
| --- | --- | --- |
| Admin pusat | demo.admin@tulola.test | password |
| PIC cabang A | demo.a@tulola.test | password |
| PIC cabang B | demo.b@tulola.test | password |

Pemeriksaan membandingkan angka dashboard dengan nilai simulasi yang ditentukan
sebelumnya, termasuk login HTTP ke aplikasi lokal dan pembatasan akses per peran.
Hasilnya disimpan pada `storage/app/local-dashboard-report.json`. Angka acuan
berlaku untuk database hasil fresh seed dengan data DEMO, pada bulan data dibuat;
transaksi tambahan dapat mengubah hasil pemeriksaan.
