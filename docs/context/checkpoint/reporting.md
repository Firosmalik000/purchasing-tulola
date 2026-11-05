# Reporting and Dashboard Checkpoint

## Ownership

Dashboard pusat/toko, indikator stok, laporan manajemen, keluaran cetak/PDF/Excel,
serta ekspor inventory dan bank permintaan. Entry point: dashboard controllers,
`ManagementReportController`, `InventoryStockReportService`, `BankRequestExportService`,
`BuildManagementReport`, `ExportManagementReportToExcel`, dan `ManagementReportType`.
UI: halaman dashboard, `central/reports`, komponen dashboard/reports; template
dokumen berada dalam `resources/views/`. Data dibaca dari tabel purchasing/inventory.

## Implemented current-source capability

### Current working-tree reconciliation — 2026-11-06

Pengguna meminta commit dan push seluruh perubahan working tree, termasuk
perubahan lokal yang sebelumnya dipertahankan. Persiapan hanya merapikan whitespace
pada CSS welcome dan halaman inventory; tidak mengubah aturan bisnis, schema,
dependensi atau data aplikasi. Kemampuan aktual modul mengikuti rekonsiliasi
2026-11-05 di bawah. Hasil preflight akhir dicatat pada panduan pengembangan.


### Current working-tree reconciliation — 2026-11-05

Panel filter laporan mengganti dua native date input dengan `DateInput` bersama.
Pengguna melihat DD/MM/YYYY; form tetap mengirim YYYY-MM-DD untuk query serta
validasi yang sudah ada. Definisi periode, metrik dan ekspor tidak berubah.
Tidak ada schema/dependensi baru; bukti regresi komponen tercatat pada platform.

Baseline dilanjutkan dengan penyelarasan tipe, penghapusan helper snapshot privat
yang tidak dipakai, keluaran opsi enum berbentuk list, query label toko ekspor
yang menghasilkan satu model, serta penyederhanaan akses data opsional dan
agregasi receipt untuk cetak order. Definisi metrik dashboard dan snapshot stok
tidak berubah. Hasil pemeriksaan terbaru terpusat pada baseline verifikasi.

### Operational capabilities

- Dashboard menerima filter bulan/tahun, tren enam bulan, distribusi status dan top requested items. Dashboard toko membatasi query ke keanggotaan toko.
- Antrean operasional (misalnya PR diajukan/order menunggu) tidak semuanya mengikuti periode analitik; controller menghitung beberapa kartu lintas periode.
- Sembilan tipe laporan: purchasing-request, request-by-store, order, outstanding-order, received-order, stock-by-store, stock-vs-standard, stock-update-history, special-request.
- Laporan stock-by-store dan stock-vs-standard adalah snapshot stok saat ini, bukan rekonstruksi historis periode pilihan.
- Laporan manajemen mendukung tampilan, cetak, PDF dan Excel; inventory pusat juga memiliki CSV. Ekspor Bank Permintaan memiliki Excel/CSV.
- `LocalDashboardDemoSeeder`, `scripts/check-local-dashboard.php` dan feature test menyediakan skenario demo; instruksi operasinya berada di README.

## Intentionally unimplemented or unapproved behavior

- Snapshot stok tidak boleh diklaim sebagai laporan saldo historis.
- Tidak ada pengiriman laporan terjadwal atau integrasi BI baru yang diaktifkan oleh tugas dokumentasi ini.
- Dokumen ini tidak mengesahkan angka database operasional atau layout dokumen melalui review manual.

## Approved invariants and boundaries

Kontrak source: akses laporan melalui `ManagementReportRequest` dan gate
`view-management-reports`. Filter serta sumber data laporan dibangun di server.
Jangan menyamakan seluruh kartu operasional dengan metrik bulanan; sumber tanggal
(`created_at`, `received_at`, `order_date`) berbeda sesuai query masing-masing.
Pertahankan cakupan toko/alokasi ketika memodifikasi dashboard dan ekspor.
Output layar dan unduhan harus mengikuti definisi filter laporan yang sama.

## Evidence level and environment

Hasil gate ada pada [baseline verifikasi](../../development.md#baseline-verifikasi-2026-11-05).
Test relevan di `tests/Feature/`: `DashboardTest.php`,
`LocalDashboardSimulationTest.php`, `Central/ManagementReportTest.php`,
`Central/InventoryStockReportTest.php`, `Central/PurchaseOrderPrintTest.php`,
dan `Central/BankRequestTest.php`. Test unduhan tidak menggantikan inspeksi visual.

## Deployment and manual-QA status

Browser, cetak/PDF/Excel secara visual, deployment dan checker HTTP lokal belum
diverifikasi pada tugas ini. Seeder demo tidak dijalankan pada database aplikasi.

## Unresolved owner decisions

Belum ada bukti operator menyetujui definisi metrik, layout cetak dan hasil laporan
untuk deployment. Angka demo hanya berlaku pada fixture/periode yang sesuai.

## Immediate next action

Saat ada tugas QA laporan, cocokkan metrik yang dipilih dengan query sumber dan
fixture, lalu rekam hasil inspeksi browser serta dokumen keluaran pada checkpoint ini.
