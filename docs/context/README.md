# Indeks dokumentasi Purchasing Tulola

Rekonsiliasi terakhir: 2026-11-06 (Asia/Jakarta).

Checkpoint menyimpan kemampuan source saat ini, batas aturan bisnis, bukti verifikasi,
dan langkah berikutnya. Source dan test menjadi bukti implementasi; catatan ini bukan
persetujuan produk baru. Dokumen bertanggal pada masa mendatang boleh menjadi riwayat,
tetapi status aktif tetap diperbarui pada checkpoint pemilik modul.

## Current working-tree reconciliation — 2026-11-06

- Pengguna meminta push seluruh perubahan pada branch `main` ke `origin`, termasuk
  `.env.example` dan `vite.config.ts` yang sebelumnya dipertahankan sebagai perubahan lokal.
- Remote diverifikasi dan fetch selesai; HEAD dan origin/main sama sebelum commit.
- Dua whitespace dirapikan tanpa mengubah perilaku. Preflight menjalankan CI lengkap
  dan build; bootstrap composer setup dilewati agar key/database aplikasi tetap.
- Tidak menjalankan migrasi, seeding, koreksi data operasional atau email nyata.
  Hasil final preflight dicatat pada panduan pengembangan; status push dibuktikan
  dari Git saat serah terima.

## Current working-tree reconciliation — 2026-11-05

- Audit tanggal lintas modul mengganti 17 native date input dan satu datetime-local
  dengan tampilan DD/MM/YYYY yang konsisten; payload/callback tetap ISO. PR, order,
  penerimaan, bank permintaan toko, inventaris dan filter laporan tercakup.
  QA browser PR/order serta 15 test frontend / 45 assertions lulus. Tidak ada
  dependensi, schema atau mutasi transaksi operasional pada audit ini.

- Baseline pertama dibuat dari branch `main`, HEAD `0cb4408`, beserta working tree saat diperiksa.
- Perubahan lokal `.env.example` dan `vite.config.ts` sudah ada sebelum tugas dokumentasi ini dan dipertahankan.
- Tugas ini menambahkan panduan agent, peta arsitektur, panduan pengembangan, serta empat checkpoint. `AGENTS.md` dikeluarkan dari `.gitignore` agar panduan ikut dibagikan melalui Git.
- Perbaikan lanjutan menutup celah otorisasi pembuatan order Bank Permintaan untuk Management, menyelaraskan kontrak tipe dan query, serta mempertahankan aturan stok kurang sesuai pilihan pengguna. Schema dan dependensi tidak berubah.
- Hasil pemeriksaan baseline dicatat pada [panduan pengembangan](../development.md#baseline-verifikasi-2026-11-05).
- Seeder stok manual ditambahkan dan dijalankan pada MySQL lokal: 64 saldo baru untuk 32 item master di HO-JKT dan PP, disertai 64 mutasi. Saldo/standar lama, master item dan data DEMO dipertahankan. Lihat [cara menggunakan seeder](../../README.md#stok-untuk-pengujian-manual).
- Verifikasi setelah perbaikan: `composer ci:check` lulus; PHPStan 0 error, 180/180 feature test lulus dengan 1538 assertions, TypeScript/Pint lulus. Build dan validasi 4 checkpoint lulus. Sebelas pengecualian baseline usang dihapus tanpa menambah pengecualian baru. Belum ada unit suite terpisah, pengukuran coverage, atau test browser otomatis.

## Checkpoint Registry

Instruksi lanjutan pengguna mengubah aturan stok: reservasi dimulai saat pengajuan
PR, sehingga toko lain hanya dapat meminta stok yang belum dicadangkan. Approval
memeriksa ulang stok bebas dan penerimaan ditolak bila stok fisik pusat kurang.
Aturan lama penerimaan penuh saat stok kurang sudah digantikan. Tidak ada schema/
dependensi baru atau mutasi database aplikasi pada tugas reservasi. Verifikasi
terbaru setelah perluasan regresi reservasi menjadi 13 skenario:
`composer ci:check` dan `bun run build` lulus; 193/193 feature test,
1697 assertions, PHPStan 0 error, Pint/TypeScript lulus. Detail pada checkpoint
purchasing/inventory dan panduan pengembangan.

Perbaikan UX validasi PR menghapus toast ganda dan membatasi input jumlah sesuai
stok tersedia; stok 0 membuat kolom hanya-baca. Test frontend Bun baru: 7 lulus /
15 assertions, tanpa dependensi tambahan. CI backend tetap 193/193 test lulus.
Uji browser dicoba tetapi dihentikan alat karena URL Chrome tidak dapat dipastikan.

Review sebelum push memperbaiki guard form PR dari `onSubmit` ke `onBefore`
sesuai implementasi Inertia, menambahkan dua test render komponen, serta memasukkan
9 test frontend / 26 assertions ke `composer ci:check`. Preflight CI/test/build
lulus dengan bootstrap `composer setup` sengaja dilewati agar tidak mengganti key
atau memigrasi database aplikasi. Commit/push belum dijalankan.

Hasil final review: race edit draft terlambat juga ditutup dengan row lock dan
pemeriksaan status dalam action. Preflight akhir lulus: 194/194 feature test,
1702 assertions; 9/9 frontend test, 26 assertions; TypeScript/Pint/PHPStan/build
lulus, empat checkpoint valid dan 19 tautan dokumentasi lokal valid. Bootstrap
tetap dilewati, tanpa commit/push atau mutasi database aplikasi.

Landing internal kini disederhanakan menjadi satu layar modern. Browser in-app
memverifikasi tanpa scroll pada desktop 1280x720, ponsel 390x844 dan landscape
844x390, serta CTA tamu ke login. Ini verifikasi halaman welcome saja, bukan QA
formulir purchasing atau concurrency MySQL. Detail pada checkpoint platform.

| Modul | Checkpoint | Kepemilikan | Status |
| --- | --- | --- | --- |
| Platform | [platform.md](checkpoint/platform.md) | Autentikasi, role, master data, pengguna/toko, tooling dan CI | Baseline source tercatat |
| Purchasing | [purchasing.md](checkpoint/purchasing.md) | PR, bank permintaan, order internal, alokasi dan penerimaan | Baseline source tercatat |
| Inventory | [inventory.md](checkpoint/inventory.md) | Stok, valuasi, standar, batch dan ledger mutasi | Baseline source tercatat |
| Reporting | [reporting.md](checkpoint/reporting.md) | Dashboard, laporan manajemen dan ekspor | Baseline source tercatat |

## Panduan pendukung

- [Arsitektur dan aliran data](../architecture.md)
- [Pengembangan, verifikasi dan pemeliharaan checkpoint](../development.md)
- [Setup dan simulasi lokal](../../README.md)
- [Aturan agent repositori](../../AGENTS.md)

## Handoff & Branch Context

Baseline ini bukan audit keamanan menyeluruh atau pernyataan siap produksi.
Status deployment, migrasi database aplikasi, dan persetujuan QA manual belum diverifikasi.
Tidak ada fitur lanjutan yang otomatis disetujui melalui dokumentasi ini.
Pada tugas berikutnya, baca checkpoint terkait, cocokkan dengan diff terbaru, lalu
perbarui catatan berdasarkan perubahan yang benar-benar dilakukan.
