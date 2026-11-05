# Platform Checkpoint

## Ownership

Autentikasi Fortify, undangan pengguna, role/policy, keanggotaan toko, master
item/kategori/unit/supplier, halaman bersama, konfigurasi dan gate CI.
Entry point: `routes/web.php`, `routes/settings.php`, `bootstrap/app.php`,
`app/Providers/AppServiceProvider.php`, `app/Providers/FortifyServiceProvider.php`,
controller `Auth`, `Settings`, serta controller master data pada `Central`.
Tabel utama: users, store_user, stores, items, item_categories, units, suppliers.

## Implemented current-source capability

### Current working-tree reconciliation — 2026-11-06

Pengguna meminta commit dan push seluruh perubahan working tree, termasuk
perubahan lokal yang sebelumnya dipertahankan. Persiapan hanya merapikan whitespace
pada CSS welcome dan halaman inventory; tidak mengubah aturan bisnis, schema,
dependensi atau data aplikasi. Kemampuan aktual modul mengikuti rekonsiliasi
2026-11-05 di bawah. Hasil preflight akhir dicatat pada panduan pengembangan.


### Current working-tree reconciliation — 2026-11-05

Audit format tanggal lintas aplikasi mengganti 17 input tanggal native dan satu
datetime-local dengan `DateInput`/`DateTimeInput`. Keduanya memakai kalender lokal
yang sudah ada: teks selalu DD/MM/YYYY, sedangkan hidden input dan callback
mengirim YYYY-MM-DD; datetime mempertahankan waktu lokal pada YYYY-MM-DDTHH:mm.
Mode DD/MM/YYYY lama `DatePicker` untuk Bank Permintaan pusat tetap dipertahankan.
Parser kalender hanya menerima format lengkap agar ketikan parsial `1` tidak
diubah otomatis menjadi Januari 2001. Tidak ada dependensi/schema baru.
Regresi render mencakup payload hidden ISO, tahun kabisat, nilai parsial, kosong,
disabled dan datetime lokal; total suite frontend 15 test / 45 assertions lulus.
Browser memverifikasi filter PR memilih 27/11/2026 dan query date_from=2026-11-27,
Reset kembali 01/11/2026–30/11/2026, serta format yang sama pada daftar order.
Tidak membuat PR/order/receipt atau mengubah data operasional pada QA browser.
CI akhir audit lulus: 194 feature test / 1702 assertions, 15 frontend test /
45 assertions, TypeScript/Pint lulus dan PHPStan 0 error. Build lulus (2360 modul,
7.06 detik); empat checkpoint strict dan diff pada scope tanggal lulus. Diff global
masih mencatat whitespace CSS di luar scope yang dipertahankan.

Baseline dokumentasi dilanjutkan dengan perbaikan teknis. Perubahan awal pengguna
di `.env.example` dan `vite.config.ts` dipertahankan. `composer types:check` kini
memakai batas memori PHPStan 512 MB. Sebelas pengecualian baseline yang tidak lagi
relevan dihapus; tidak ada pengecualian baru atau pelonggaran level analisis.
Pint memperbaiki format/import file yang disentuh dan dua file PR toko yang
menghalangi CI. Hasil terbaru terpusat pada baseline verifikasi.

Notifikasi validasi global kini membuang pesan identik serta ringkasan stok yang
sudah memiliki detail kolom. Toast menampilkan satu pesan utama dan jumlah isian
lain bila ada, menggunakan satu ID yang sama. Form/detail PR toko memakai hook
global tersebut tanpa toast lokal tambahan. Tujuh test Bun pada
`tests/Frontend/request-validation.test.ts` lulus (15 assertions), mencakup
normalisasi pesan dan batas jumlah stok. `composer ci:check` lulus dengan 193 test /
1697 assertions; TypeScript/Pint/PHPStan lulus. Uji browser belum selesai karena
Computer Use tidak dapat memverifikasi URL Chrome Windows. Tidak ada schema,
dependensi, atau perubahan database aplikasi.

Review sebelum push menambahkan script `bun run test:frontend` dan memasukkannya
ke `composer ci:check`, sehingga test frontend tidak lagi terlewat pada workflow
CI yang sudah ada. Suite frontend menjadi 9 test / 26 assertions, termasuk dua
regresi render/kontrak `onBefore` form PR. Preflight skill dijalankan melalui modul
runner dengan hanya `composer setup` dikecualikan karena memutasi APP_KEY/database
aplikasi; CI, frontend test, dan build tetap dijalankan dan lulus. Tidak ada commit
atau push pada tugas review ini; perubahan lokal pengguna dipertahankan.

Preflight final setelah perbaikan race draft: 194 feature test / 1702 assertions,
9 frontend test / 26 assertions, tanpa gagal/skip; TypeScript/Pint lulus, PHPStan
0 error. Build lulus dengan 2358 modul (4.57 detik). Empat checkpoint lolos
validator strict dan 19 tautan dokumentasi lokal valid; diff whitespace lulus.

Halaman `/` disederhanakan untuk portal internal sesuai permintaan pengguna:
header identitas NTS/Tulola, sapaan modern, satu CTA masuk/dashboard dan footer
ringkas. Bagian promosi, kategori dan alur panjang dihapus. Layout memakai `h-dvh`
dengan area tengah fleksibel, tipografi mengikuti ukuran viewport, serta penyesuaian
layar pendek yang hanya berlaku pada kelas welcome. Logo dan token terang/gelap
yang sudah ada dipakai kembali; tidak ada dependensi, schema atau route baru.
Verifikasi browser in-app pada mode gelap: 1280x720, 390x844 dan 844x390; pada ketiganya
`scrollWidth/scrollHeight` sama dengan lebar/tinggi viewport, sehingga tanpa scroll.
CTA tamu terverifikasi membuka `/login`; tidak memasukkan kredensial atau menyimpan
data. Jalur CTA pengguna login tetap memakai route dashboard yang sudah ada,
belum diuji dengan sesi login pada tugas landing ini. `bun run check` dan
`WelcomePageTest` lulus (1 test / 1 assertion). Verifikasi landing ini terpisah dari
QA formulir purchasing yang sebelumnya belum selesai.
Build final lulus (`bun run build`, 2358 modul, 8.29 detik); validator checkpoint
strict dan pemeriksaan whitespace lulus. Tidak menjalankan ulang CI backend penuh
untuk perubahan tampilan ini; bukti CI penuh sebelumnya tetap tercatat terpisah.

Polish berikutnya sesuai permintaan pengguna menambahkan efek CSS yang hanya
berlaku pada welcome: ambient glow bergerak perlahan, grid memudar di belakang
konten, teks aksen gradasi, animasi masuk berurutan dan glow/gerakan tombol saat
hover. Efek tidak memakai listener pointer atau dependensi baru, serta mengikuti
`prefers-reduced-motion`; teks gradasi memiliki fallback `forced-colors`.
Browser mode gelap memverifikasi versi efek pada 1280x720 dan 320x568, keduanya
tanpa overflow horizontal/vertikal. Viewport override direset setelah pemeriksaan.
TypeScript lulus; tema terang dan pengaturan reduced-motion belum diuji visual.
Build efek final lulus (2358 modul, 10.68 detik), validator strict dan diff
whitespace lulus. Tidak menambah test untuk efek visual CSS yang rendah dampak.

### Operational capabilities

- Login, reset password, verifikasi email, two-factor dan passkeys dikonfigurasi melalui Fortify; pendaftaran publik tidak diaktifkan pada `config/fortify.php`.
- Undangan lewat token memiliki controller serta test `tests/Feature/Auth/InvitationTest.php`.
- Portal pusat/toko dilindungi `auth`, `verified`, `active`, dan middleware role. Policy/gate terdaftar pada `AppServiceProvider`.
- Pengelolaan pengguna, toko/keanggotaan, dan master data memiliki route dan feature test pada `tests/Feature/Central/`.
- Pipeline pengembangan memakai Bun; test, Pint, PHPStan dan TypeScript tersedia pada script Composer.
- Halaman welcome internal satu layar memberi akses login atau dashboard sesuai sesi, dengan layout responsif tanpa bagian promosi panjang.
- Input tanggal bersama menampilkan DD/MM/YYYY dengan payload ISO; input waktu penerimaan mempertahankan datetime lokal dengan tanggal dan jam terpisah.

## Intentionally unimplemented or unapproved behavior

- Tugas baseline ini tidak mengaktifkan registrasi publik, mengubah role, atau memperluas hak mutasi.
- Tidak ada perubahan schema/dependensi atau konfigurasi deployment yang disetujui melalui checkpoint ini.

## Approved invariants and boundaries

Bagian ini merekam kontrak source/test yang harus dipertahankan, bukan keputusan
produk baru: gate `access-central` berbeda dari gate pengelolaan per modul;
keanggotaan toko aktif membatasi akses PIC. `Gate::before` super admin tetap
mengembalikan pemeriksaan stateful PR/order kepada policy. Pertahankan pembatasan
tersebut dan test `Central/WorkflowStateAuthorizationTest.php`.

## Evidence level and environment

Source diperiksa pada Windows, PHP 8.5.12 dan Bun 1.4.4. Hasil seluruh gate dan
batasnya ada pada [baseline verifikasi](../../development.md#baseline-verifikasi-2026-11-05).
Test relevan: `Auth/`, `Settings/`, `Central/MasterDataManagementTest.php`,
`Central/StoreManagementTest.php`, `Central/StoreUserManagementTest.php`, dan
`Central/WorkflowStateAuthorizationTest.php` di bawah `tests/Feature/`.

## Deployment and manual-QA status

Deployment dan migrasi database aplikasi belum diverifikasi. Tidak ada migrasi
database aplikasi, seed, atau uji browser manual pada tugas dokumentasi ini.

## Unresolved owner decisions

Belum ada bukti persetujuan operator/owner atas baseline ini atau target
deployment yang akan menjadi acuan penerimaan. Jangan menyimpulkan kesiapan produksi.

## Immediate next action

Lakukan QA operator tanggal kebutuhan PR, target order dan waktu penerimaan pada
form masing-masing; pengujian filter browser tidak menggantikan QA penyimpanan
semua form atau pengajuan serentak MySQL.
