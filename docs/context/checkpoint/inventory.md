# Inventory Checkpoint

## Ownership

Stok per toko, nilai persediaan, standar/minimum, penambahan batch, dan ledger mutasi.
Source: `app/Actions/Inventory/`, `app/Services/CriticalStockService.php`,
model Item/StoreStock/StoreStockStandard/StockBatch/StockMovement,
controller inventory pusat/toko, dan `ConfirmReceipt` sebagai pemicu penerimaan.
Tabel: items, store_stocks, store_stock_standards, stock_batches, stock_movements.
UI: `resources/js/pages/central/inventory/` dan `resources/js/pages/store/inventory/`.

## Implemented current-source capability

### Current working-tree reconciliation — 2026-11-06

Pengguna meminta commit dan push seluruh perubahan working tree, termasuk
perubahan lokal yang sebelumnya dipertahankan. Persiapan hanya merapikan whitespace
pada CSS welcome dan halaman inventory; tidak mengubah aturan bisnis, schema,
dependensi atau data aplikasi. Kemampuan aktual modul mengikuti rekonsiliasi
2026-11-05 di bawah. Hasil preflight akhir dicatat pada panduan pengembangan.


### Current working-tree reconciliation — 2026-11-05

Input tanggal riwayat stok pusat kini memakai komponen bersama `DateInput`:
tampilan DD/MM/YYYY dan nilai form YYYY-MM-DD. Query rentang, perhitungan stok,
valuasi dan ledger tidak diubah. Tidak ada schema/dependensi atau mutasi database
aplikasi. Bukti pengujian komponen/payload tercatat pada checkpoint platform.

Baseline pertama dilanjutkan dengan perbaikan teknis: metadata kuantitas PR,
order, alokasi dan receipt diselaraskan dengan cast integer aktual. Query filter
stok menggunakan parameter binding dan satu nilai status yang sudah dinormalisasi.
Perhitungan saldo/valuasi tidak berubah. Hasil pemeriksaan terbaru tercatat pada
baseline bersama.

`LocalStockSeeder` ditambahkan dan dijalankan atas permintaan pengguna pada MySQL
lokal 2026-11-05: 64 saldo dan 64 mutasi baru; HO-JKT 32 item / 6400 unit,
Pacific Place 32 item / 304 unit. Saldo cabang terbagi rata ke 0, 3, 10 dan 25.
Seeder membuat saldo/standar yang belum ada, mempertahankan master item serta
saldo lama, dan mengecualikan kode DEMO. Tidak ada migrasi atau penghapusan data.

Instruksi pengguna berikutnya mengganti batas stok kurang: permintaan kini
mencadangkan stok sejak `SUBMITTED` melalui `CentralStockAvailability`, dan
`ConfirmReceipt` menolak penerimaan ketika stok fisik pusat tidak cukup. Pemeriksaan
jumlah per item dan row lock dilakukan sebelum membuat receipt atau mutasi, dalam
transaksi yang sama. Tidak ada mutasi database aplikasi pada tugas reservasi.

Pengujian lanjutan memperluas regresi reservasi menjadi 13 skenario / 159 assertions
yang lulus. Rollback diverifikasi untuk approval/penerimaan banyak item, agregasi
beberapa alokasi barang yang sama, serta saldo pusat yang hilang. Pengujian
memastikan tidak ada receipt, saldo cabang, mutasi atau audit sukses yang tertulis
ketika transaksi ditolak. Kode produksi tidak diubah pada perluasan pengujian ini.
CI terbaru lulus dengan 193 test / 1697 assertions, 0 gagal/skip, TypeScript/Pint
lulus, PHPStan 0 error dan build frontend berhasil. Uji tetap SQLite in-memory;
pengajuan serentak di MySQL serta browser belum diverifikasi.

Review sebelum push menutup jalur perubahan cadangan melalui edit draft terlambat:
action draft mengambil row lock dan memeriksa status terbaru sebelum mengganti
item PR. Regresi membuktikan jumlah 2 yang sudah diajukan tidak bisa ditimpa 99
lewat model draft kedaluwarsa. Suite reservasi menjadi 14 test / 164 assertions
yang lulus; saldo/ledger aplikasi tidak dimutasi pada tugas review ini.

Verifikasi final review: 194 feature test / 1702 assertions dan 9 frontend test /
26 assertions lulus, tanpa gagal/skip. TypeScript/Pint/PHPStan dan build lulus;
tidak ada commit/push atau perubahan database aplikasi.

### Operational capabilities

- `UpdateStoreStock` mendukung set, increment, decrement dengan transaksi dan row lock; setiap perubahan mencatat kuantitas/nilai sebelum-sesudah pada `StockMovement`.
- Valuasi memakai biaya input, rata-rata sebelumnya, atau harga master sesuai implementasi; rata-rata hasil pembagian dibulatkan menjadi integer.
- `BulkAddStoreStock` dan `StockBatch` mencatat batch penambahan; `UpdateStoreStockStandard` mengelola standar toko.
- `ConfirmReceipt` menambah stok item `STOCK` ke toko penerima dan, bila relevan, mengurangi stok pusat sebagai `DISTRIBUTION_OUT`.
- Pengajuan memakai stok bebas sesudah dikurangi PR diajukan dan outstanding order aktif. Saldo fisik tetap sampai penerimaan. Penolakan, approval parsial dan pembatalan draft order membebaskan cadangan terkait.
- Critical-stock service dan laporan inventory memakai standar/minimum untuk indikator stok.
- Seeder stok manual hanya untuk local/testing; idempotensi, audit/valuasi, perlindungan master, pengecualian DEMO/inactive, dan penolakan production diuji pada `LocalStockSeederTest`.

## Intentionally unimplemented or unapproved behavior

- Kuantitas/nilai uang dan metode valuasi tetap integer; perubahan reservasi tidak mengubah schema atau dependensi.
- Item `SPECIAL` tidak otomatis diperlakukan sebagai stok oleh `ConfirmReceipt`.
- Rekonstruksi stok historis dan koreksi otomatis data lama yang sudah kelebihan alokasi belum diimplementasikan. Permintaan/order lama langsung ikut dihitung sebagai cadangan dan stok tersedia dibatasi minimum nol.

## Approved invariants and boundaries

Kontrak aktual: kuantitas dan nilai uang menggunakan integer (lihat cast model
serta migrasi `2026_10_09_010000_convert_quantities_and_money_to_integers.php`).
Jangan menerapkan contoh decimal dari skill generik ke proyek ini.

`UpdateStoreStock` memperbarui saldo dan ledger dalam transaksi yang sama.
Decrement generik tetap menggunakan `max(0, previous - qty)`. Pilihan awal pengguna
untuk mempertahankan penerimaan cabang penuh ketika stok pusat kurang telah
digantikan instruksi baru pada 2026-11-05: cadangkan stok sejak pengajuan dan cegah
kelebihan distribusi. `ConfirmReceipt` kini memeriksa stok fisik pusat dengan lock
dan menolak seluruh transaksi bila kurang; tidak ada stok toko atau ledger parsial.
Reservasi tidak mencatat perpindahan fisik; ledger baru berubah saat penerimaan.
Penerimaan `SPECIAL` tidak memutasi ledger stok seperti `STOCK`.
Mutasi stok memerlukan policy/gate server; akses baca tidak memberikan hak edit.

## Evidence level and environment

Hasil pemeriksaan bersama ada pada [baseline verifikasi](../../development.md#baseline-verifikasi-2026-11-05).
Test relevan: `Central/InventoryManagementTest.php`,
`Central/InventoryStockReportTest.php`, `Store/IncomingOrderReceivingTest.php`,
`InternalPurchasingWorkflowTest.php`, dan `LocalDashboardSimulationTest.php`
di bawah `tests/Feature/`. Perilaku concurrency di database deployment belum diuji.

`StockReservationTest.php` memverifikasi penerimaan parsial, pengurangan saldo
pusat yang tepat, pembatasan pengajuan atas sisa cadangan, rollback saat stok
kurang, dan stok bebas setelah restock/penerimaan lengkap. CI implementasi awal: 185 test lulus,
1594 assertions, tanpa skip/gagal; Pint, PHPStan, TypeScript dan build lulus.

## Deployment and manual-QA status

Seeder stok manual telah dijalankan dan ringkasan saldo lokal diverifikasi.
Tidak ada migrasi, deployment atau perubahan database produksi. Pengguna akan
melakukan QA manual; penerimaan operator belum dicatat.

## Unresolved owner decisions

Tidak ada keputusan reservasi yang masih ditunggu: pengguna meminta pemblokiran
sejak pengajuan meskipun belum disetujui. Saldo operasional lama, kemungkinan
kelebihan alokasi historis, dan QA deployment tetap belum diverifikasi.

## Immediate next action

Lakukan QA dua toko pada stok yang sama dari submit sampai penerimaan dan periksa
kelebihan alokasi lama tanpa melakukan reset atau koreksi data otomatis.
