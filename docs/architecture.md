# Arsitektur Purchasing Tulola

Baseline source: 2026-11-05. Versi di bawah mengikuti manifest proyek, bukan hasil
audit layanan yang sedang berjalan.

## Stack dan struktur

Laravel `^13.17` / PHP `^8.3`, Inertia Laravel dan React `^3.0`, React `^19.2`,
TypeScript, Vite `^8.0`, Tailwind CSS 4, dan Bun 1.4.4. Fortify menangani
autentikasi; Dompdf dan PhpSpreadsheet mendukung keluaran laporan.

| Lokasi | Tanggung jawab |
| --- | --- |
| `routes/web.php`, `routes/settings.php` | Endpoint web, nama route, dan kelompok middleware |
| `bootstrap/app.php`, `app/Http/Middleware/` | Middleware aktif/pusat/toko serta respons error |
| `app/Http/Requests/`, `app/Policies/` | Validasi input, otorisasi dan pembatasan status |
| `app/Http/Controllers/` | Respons Inertia/unduhan dan koordinasi action/service |
| `app/Actions/`, `app/Services/` | Proses bisnis, transaksi, stok, laporan dan notifikasi |
| `app/Models/`, `app/Enums/` | Eloquent, relasi, cast dan status domain |
| `database/migrations/`, `database/seeders/` | Evolusi schema dan data awal/demo |
| `resources/js/pages/`, `resources/js/components/` | Halaman React dan komponen lokal |
| `resources/views/` | Template server, termasuk dokumen cetak/email |
| `tests/Feature/` | Pengujian HTTP, otorisasi dan alur domain |

Route menerapkan middleware, Form Request/policy membatasi input dan akses,
controller memanggil action/service, lalu Eloquent melakukan persistence.
Sebagian query baca berada dalam controller; tidak ada kewajiban membangun layer
repository baru. Perhitungan dan keputusan bisnis tetap berada pada server.

## Alur purchasing dan stok

1. PIC toko menyimpan draft PR (`SavePurchaseRequestDraft`) dan mengajukannya (`SubmitPurchaseRequest`).
2. Admin memproses setiap item (`ProcessPurchaseRequest`): persetujuan langsung, bank permintaan untuk item khusus, atau penolakan. PR berakhir di `PROCESSED` ketika disetujui.
3. Item yang langsung disetujui membuat draft order melalui `CreateDraftOrderForRequest`. `CreateOrderFromBankRequests` memproses pilihan bank dan mengelompokkannya per toko.
4. Purchasing menyiapkan draft dan memanggil `PlacePurchaseOrder`. Status menjadi `ORDERED`; langkah ini tidak memutasi stok.
5. PIC mengonfirmasi penerimaan berdasarkan alokasi melalui `ConfirmReceipt`. Action memvalidasi outstanding dan toko, mencatat receipt, mengubah stok item `STOCK`, serta menyinkronkan status order.
6. Penerimaan item stok menambah stok toko penerima. Jika toko pusat tersedia dan berbeda dengan penerima, stok pusat berkurang melalui `UpdateStoreStock`. Item `SPECIAL` tidak masuk mutasi stok otomatis pada action ini.

`purchase_order_request_items` menghubungkan baris order dengan item PR; relasi
ini menjadi dasar batas penerimaan dan visibilitas toko. Jangan mengasumsikan
semua baris order hanya dapat ditelusuri melalui `purchase_order.purchase_request_id`.

`CentralStockAvailability` menghitung stok tersedia sebagai saldo fisik pusat
dikurangi jumlah item stok PR `SUBMITTED` dan outstanding alokasi order aktif.
Draft PR belum mencadangkan; submit mulai mencadangkan walaupun belum disetujui.
Approval memeriksa ulang stok bebas di luar cadangan PR sendiri lalu memindahkan
cadangan ke alokasi order dalam transaksi yang sama. Jumlah tidak disetujui,
penolakan PR, dan pembatalan draft order membebaskan cadangannya. Penerimaan
memeriksa stok fisik pusat sebelum mencatat receipt/mutasi dan menolak transaksi
jika stok kurang. Tidak ada tabel reservasi baru; sumbernya adalah status PR,
alokasi order aktif, dan receipt terkonfirmasi.

## Data dan otorisasi

- Master: `stores`, `users`, keanggotaan `store_user`, `items`, `item_categories`, `units`, `suppliers`.
- Purchasing: `purchase_requests`, `purchase_request_items`, `purchase_request_status_histories`, `purchase_orders`, `purchase_order_items`, `purchase_order_request_items`, `receipts`, `receipt_items`.
- Inventory/audit: `store_stocks`, `store_stock_standards`, `stock_batches`, `stock_movements`, `activity_logs`.
- `AppServiceProvider` mendaftarkan policy/gate. Role berada pada `UserRole`: `SUPER_ADMIN`, `CENTRAL_ADMIN`, `PURCHASING`, `MANAGEMENT`, `STORE_PIC`.
- Akses kelompok pusat tidak otomatis memberi hak mutasi semua modul. Policy/gate menjadi sumber otorisasi, dan super admin tetap tunduk pada pembatasan status PR/order.
- Operasi mutasi kritis memakai transaksi serta `lockForUpdate`. Test SQLite in-memory tidak membuktikan perilaku concurrency pada database deployment.

## Integrasi dan batas bukti

`PurchasingNotificationService` mengirim notifikasi undangan, pengajuan,
penempatan order, dan penerimaan; kegagalan pengiriman dicatat dalam log.
Keberhasilan proses bisnis tidak membuktikan email sampai ke inbox.
Output laporan menggunakan Dompdf/PhpSpreadsheet. Route TypeScript Wayfinder
dihasilkan otomatis dan diabaikan Git; build menjalankan generator terlebih dahulu.
Konfigurasi `.env` dan data operasional tidak disalin ke dokumentasi.

Untuk kemampuan, bukti pengujian, dan keputusan terbuka, gunakan
[checkpoint pemilik modul](context/README.md#checkpoint-registry).
