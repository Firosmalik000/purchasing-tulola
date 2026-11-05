# Purchasing Checkpoint

## Ownership

PR toko, persetujuan/penolakan pusat, bank permintaan, draft dan penempatan order
internal, alokasi item lintas PR, penerimaan toko, dan notifikasi proses.
Source: `app/Actions/Requests/`, `app/Actions/Orders/`, `app/Actions/Receipts/`,
policy PR/order/receipt, controller pusat/toko, dan `PurchasingNotificationService`.
Tabel: purchase_requests, purchase_request_items, purchase_request_status_histories,
purchase_orders, purchase_order_items, purchase_order_request_items, receipts,
receipt_items, activity_logs. UI: requests, bank-requests, orders dan incoming.

## Implemented current-source capability

### Current working-tree reconciliation — 2026-11-06

Pengguna meminta commit dan push seluruh perubahan working tree, termasuk
perubahan lokal yang sebelumnya dipertahankan. Persiapan hanya merapikan whitespace
pada CSS welcome dan halaman inventory; tidak mengubah aturan bisnis, schema,
dependensi atau data aplikasi. Kemampuan aktual modul mengikuti rekonsiliasi
2026-11-05 di bawah. Hasil preflight akhir dicatat pada panduan pengembangan.


### Current working-tree reconciliation — 2026-11-05

Filter PR pusat/toko, order pusat, bank permintaan toko dan daftar penerimaan toko
kini menggunakan input DD/MM/YYYY yang konsisten, bukan locale native browser.
Form tanggal kebutuhan PR reguler/khusus dan edit target penerimaan order juga
memakai `DateInput`; callback dan payload tetap ISO. Tanggal penerimaan dipisah
menjadi tanggal DD/MM/YYYY dan jam, tetapi data `received_at` tetap datetime lokal.
Default filter bulan kalender tidak berubah. QA browser membuktikan pilihan
27/11/2026 terkirim sebagai 2026-11-27 dan Reset kembali 01/11–30/11/2026.
Pengujian render frontend lulus 15 test / 45 assertions; tidak menyimpan data
transaksi nyata untuk QA ini. Perubahan awal transform Form GET yang menghasilkan
tanggal kosong ditemukan saat QA dan diganti hidden input ISO pada komponen.

Baseline dilanjutkan dengan perbaikan otorisasi Bank Permintaan: pembuatan order
kini memakai `PurchaseOrderPolicy::create`, sehingga Management tetap dapat
membaca tetapi tidak membuat order. Prop `canCreateOrder` membatasi kontrol React.
Regresi HTTP membuktikan kegagalan sebelum perbaikan (302 alih-alih 403), lalu
memverifikasi Management ditolak dan Purchasing tetap diizinkan. Kontrak integer,
inferensi Eloquent, dan agregasi kuantitas pada cetak order juga diperbaiki.
Detail hasil verifikasi terbaru ada pada baseline bersama.

Instruksi lanjutan pengguna mengaktifkan reservasi sejak pengajuan.
`CentralStockAvailability` menghitung stok bebas dari saldo fisik dikurangi PR
`SUBMITTED` dan outstanding alokasi order `DRAFT`/`ORDERED`/`PARTIALLY_RECEIVED`.
Submit langsung, submit draft, update-submit dan prop `central_stock` formulir
memakai hitungan yang sama. Submit/approval memeriksa ulang dalam transaksi dengan
row lock dan locking read untuk menghindari snapshot reservasi lama di MySQL.
Tidak ada schema/dependensi baru atau mutasi database aplikasi pada tugas ini.

Pengujian lanjutan atas permintaan pengguna memperluas `StockReservationTest`
dari 5 menjadi 13 skenario. Tambahan meliputi dua PIC berbeda, permintaan banyak
item, alokasi barang yang sama pada order gabungan, perlindungan cadangan toko
lain, pengecualian SPECIAL, saldo pusat hilang, baris draft lama duplikat, serta
pemeriksaan ulang action setelah stok formulir berubah. Pengujian terarah lulus
13/13 dengan 159 assertions; tidak ditemukan kegagalan produk pada skenario baru.
CI lanjutan lulus: 193 test / 1697 assertions, 0 gagal/skip, TypeScript/Pint lulus,
PHPStan 0 error; build frontend lulus. Database uji tetap SQLite in-memory.

Perbaikan UX berdasarkan dua screenshot pengguna: toast lokal duplikat pada form
dan submit halaman detail dihapus. Notifikasi global hanya menampilkan satu pesan
utama; ringkasan stok yang sudah memiliki error per kolom tidak diulang. Input
jumlah reguler dibatasi integer 1..stok tersedia (termasuk paste dan ganti barang),
kosong/hanya-baca saat stok 0 atau belum memilih barang, serta menampilkan error
jumlah pada kolom terkait. Tampilan nilai juga dihitung ulang dari stok prop terbaru
agar state formulir yang dipertahankan tidak menampilkan jumlah di atas batas.
Form mencegah penyimpanan/pengajuan baris stok kosong; pilih barang lain atau hapus
baris tersebut. Kontrak server untuk draft dan reservasi tidak diubah.
Tujuh test Bun frontend lulus (15 assertions); CI backend tetap 193 test / 1697
assertions lulus, TypeScript/Pint/PHPStan lulus. Uji browser dicoba tetapi alat
Computer Use berhenti karena tidak dapat memastikan URL Chrome di Windows;
hasil klik/visual sesudah perbaikan belum terverifikasi.

Review sebelum push menemukan `onSubmit` kustom ditimpa oleh implementasi
`Form` Inertia yang terpasang. Guard stok kosong dipindahkan ke `onBefore`
agar `false` benar-benar membatalkan visit. Dua regresi render komponen ditambahkan
di `tests/Frontend/request-form.test.tsx`: input stok 0 kosong/hanya-baca dan guard
membatalkan, sedangkan draft dengan jumlah 99/stok 2 menampilkan batas 2 dan lolos
guard. Ini pengujian render/kontrak props dengan mock Inertia, bukan QA browser.
Suite frontend kini 9 test / 26 assertions dan masuk gate `composer ci:check`.

Review lanjutan mereproduksi race edit draft terlambat: action penyimpanan dapat
mengganti item/jumlah pada PR yang sudah `SUBMITTED` setelah policy awal membaca
`DRAFT`. `SavePurchaseRequestDraft` kini mengambil ulang PR dengan row lock dan
menolak status selain `DRAFT` di dalam transaksi sebelum menulis atau menghapus
item. Regresi awal gagal 1/1, lalu seluruh 14 skenario reservasi lulus dengan
164 assertions. Regresi mensimulasikan model draft kedaluwarsa sesudah submit;
ini belum merupakan pengujian dua proses MySQL berjalan serentak.

Verifikasi final review: `composer ci:check` lulus dengan 194 feature test /
1702 assertions serta 9 frontend test / 26 assertions, tanpa gagal/skip.
TypeScript/Pint lulus, PHPStan 0 error dan build lulus (2358 modul, 4.57 detik).
Preflight pengecualian bootstrap lulus; tidak melakukan commit atau push.

### Operational capabilities

- Draft PR dapat disimpan/diajukan. `ProcessPurchaseRequest` meninjau item, mencatat kuantitas disetujui/bank, menyelesaikan PR ke `PROCESSED` dan membuat draft order untuk item disetujui.
- Draft belum mencadangkan stok. Submit item `STOCK` langsung mencadangkan jumlah diminta: stok 2 yang diminta 2 oleh toko A menyisakan 0 untuk pengajuan berikutnya, termasuk sebelum approval. Item `SPECIAL` tidak mencadangkan stok.
- Approval mengecualikan cadangan PR sendiri lalu memindahkannya ke alokasi order secara atomik. Jumlah tidak disetujui, penolakan PR dan pembatalan draft order membebaskan cadangan terkait.
- Item `SPECIAL` dapat masuk Bank Permintaan. `CreateOrderFromBankRequests` mengelompokkan pilihan per toko dan menghasilkan draft order dengan alokasi ke item PR.
- `PlacePurchaseOrder` mengubah draft menjadi `ORDERED`; `CancelPurchaseOrder` hanya membatalkan draft.
- `ConfirmReceipt` menerima sebagian/lengkap berdasarkan outstanding tiap alokasi, memvalidasi toko penerima, dan menyinkronkan status order.
- Notifikasi undangan/pengajuan/order/penerimaan memakai mail service. Error SMTP dicatat dalam log dan bukan jaminan delivery.

## Intentionally unimplemented or unapproved behavior

- Baseline ini tidak memperkenalkan pembatalan order setelah ditempatkan, reopening PR, atau perubahan kuantitas pecahan.
- `PurchaseRequestStatus::CANCELLED` ada pada enum; itu tidak membuktikan adanya endpoint pembatalan PR untuk pengguna pada route saat ini.
- Perubahan integrasi supplier/pembayaran atau alur penerimaan baru memerlukan tugas dan keputusan tersendiri.

## Approved invariants and boundaries

Kontrak source/test yang dipertahankan:

- PR `DRAFT` dapat diajukan, `SUBMITTED` dapat disetujui/ditolak; `PROCESSED` adalah persetujuan akhir PR, terpisah dari selesainya order.
- Jumlah disetujui dan bank tidak boleh negatif; totalnya tidak melebihi jumlah diminta dalam `ProcessPurchaseRequest`. Semua item harus ditinjau.
- Otorisasi mutasi order membatasi update/place/cancel ke `DRAFT`, walaupun enum transisi umum mencantumkan state lain. Jangan memakai enum untuk melewati policy/action.
- Membuat order dari Bank Permintaan mengikuti policy pembuatan order: super admin, admin pusat dan purchasing. Akses baca portal pusat saja tidak cukup.
- Alokasi menentukan toko dan batas penerimaan. Kuantitas penerimaan positif dan tidak melebihi outstanding yang belum diterima.
- Mutasi kritis berada dalam transaksi dengan locking. Persetujuan/penempatan order tidak mengurangi stok; dampak stok ada saat konfirmasi penerimaan.
- Saldo fisik terpisah dari stok tersedia untuk permintaan. Cadangan tetap terhitung sepanjang pengajuan sampai outstanding order diterima; penerimaan mengurangi saldo fisik dan outstanding tanpa menghitung cadangan dua kali. Approval tidak boleh memakai cadangan PR/order lain; penerimaan ditolak jika stok fisik pusat kurang.
- Jangan menganggap satu PR hanya punya satu order atau semua order hanya milik satu PR. Pertahankan relasi alokasi.

## Evidence level and environment

Source diperiksa pada baseline 2026-11-05; hasil perintah terpusat pada
[baseline verifikasi](../../development.md#baseline-verifikasi-2026-11-05).
Test utama: `InternalPurchasingWorkflowTest.php`,
`Central/PurchaseRequestProcessingTest.php`, `Central/BankRequestTest.php`,
`Central/WorkflowStateAuthorizationTest.php`, `Store/IncomingOrderReceivingTest.php`,
`Store/PurchaseRequestManagementTest.php`, dan `PurchasingNotificationServiceTest.php`
di bawah `tests/Feature/`. Test otomatis bukan bukti email terkirim nyata.

`StockReservationTest.php` awal: 5 regresi HTTP mencakup dua toko berebut stok, tiga
jalur submit, stok formulir, penolakan/restock, approval parsial, pembatalan order,
approval super admin saat stok kurang, penerimaan parsial dan rollback. Regresi
awal: 3 gagal/2 lulus sebelum perbaikan. CI implementasi awal: 185 passed, 0 skipped/failed,
1594 assertions; PHPStan 0 error, Pint/TypeScript/build lulus. Uji concurrency
MySQL dan QA browser belum dilakukan.

## Deployment and manual-QA status

Deploy, database deployment, SMTP nyata dan penerimaan operator belum diverifikasi.
Tugas dokumentasi ini tidak menjalankan transaksi pada database aplikasi.

## Unresolved owner decisions

Reservasi sejak pengajuan sudah diminta pengguna dan diimplementasikan; tidak ada
keputusan reservasi yang masih ditunggu. Kesiapan operasional tetap memerlukan QA.

## Immediate next action

Uji manual dua toko meminta item stok yang sama, termasuk penolakan, approval
parsial dan penerimaan, serta verifikasi concurrency pada MySQL deployment.
