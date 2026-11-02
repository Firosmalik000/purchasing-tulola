# Purchasing Tulola

Proyek Laravel dan React ini menggunakan **Bun 1.4.4** untuk dependensi frontend.

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
