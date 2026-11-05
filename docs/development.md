# Pengembangan dan pemeliharaan checkpoint

## Memulai

Baca [indeks](context/README.md) dan checkpoint terkait. Periksa `git status --short`,
lalu telusuri route, Form Request/policy, action/service, halaman dan test yang
relevan. Untuk pekerjaan lintas layer, baca sedikitnya dua referensi source yang
berdekatan agar pola dan batas data dipahami.

Catat rencana singkat untuk perubahan yang tidak sederhana. Jangan menganggap
contoh dalam skill sebagai aturan bisnis proyek; kontrak saat ini direkam pada
checkpoint dan harus cocok dengan kode/test.

## Setup dan perintah

PHP minimal 8.3, Composer dan Bun 1.4.4 diperlukan. `composer setup` adalah
bootstrap awal yang juga membuat key dan menjalankan `migrate --force`; jalankan
hanya pada lingkungan/database yang memang diotorisasi untuk setup. Jangan
menjalankannya sebagai pemeriksaan rutin pada database yang sudah berisi data.

| Tujuan | Perintah | Catatan |
| --- | --- | --- |
| Dependensi frontend | `bun install --frozen-lockfile` | Ikuti lockfile yang ada |
| Pengembangan | `composer dev` | Menggunakan perintah dev Laravel |
| Vite saja | `bun run dev` | Konfigurasi saat baseline menggunakan port 5174 |
| TypeScript | `bun run check` | Alias `bun run types:check` memanggil pemeriksaan yang sama |
| Test frontend | `bun run test:frontend` | Bun menjalankan `tests/Frontend`, termasuk render/kontrak form PR |
| Format PHP tanpa perubahan | `composer lint:check` | Pint `--test` |
| Analisis PHP | `composer types:check` | PHPStan/Larastan |
| Test terarah | `php artisan test --filter=InternalPurchasingWorkflowTest` | Pilih filter sesuai perubahan |
| Backend lengkap | `composer test` | Clear config, Pint, PHPStan, lalu feature test |
| Gate CI lokal | `composer ci:check` | TypeScript dua kali lewat alias, test frontend, lalu `composer test` |
| Build frontend | `bun run build` | Generate Wayfinder lalu Vite; perlu akses font yang dikonfigurasi bila belum tercache |
| Diff whitespace | `git diff --check` | Review juga file baru dan status akhir |

`phpunit.xml` mengonfigurasi `APP_ENV=testing`, SQLite `:memory:`, mail array,
cache/session array, serta queue sync. Feature test menggunakan database pengujian;
jangan mengganti konfigurasi itu dengan database aplikasi. Workflow
`.github/workflows/tests.yml` memakai PHP 8.4, Node 22, Bun 1.4.4,
`composer setup`, lalu `composer ci:check`.

Simulasi dashboard lokal dan akun DEMO dijelaskan di [README](../README.md#simulasi-dashboard-lokal).
Seeder/checker bukan pemeriksaan tanpa efek samping: seeder menambah data dan
checker mengakses aplikasi lokal serta menulis report. Tidak dijalankan pada
database aplikasi untuk tugas dokumentasi ini.

## Memperbarui checkpoint

1. Pilih checkpoint pemilik modul; untuk perubahan lintas modul perbarui semuanya yang terdampak.
2. Tambahkan atau rekonsiliasi `### Current working-tree reconciliation — YYYY-MM-DD` dengan tanggal Asia/Jakarta. Gabungkan pekerjaan pada tanggal yang sama agar tidak ada dua status aktif yang bertentangan.
3. Tulis perilaku aktual dan rujukan source/test. Bedakan fakta source, hasil test, keputusan pemilik, serta hal yang belum diverifikasi.
4. Catat batas scope, invariant, hasil perintah beserta jumlah pass/skip/fail bila tersedia, status deploy/QA, pertanyaan terbuka, dan satu langkah berikutnya.
5. Sinkronkan indeks ketika kepemilikan modul, hasil baseline, atau status lintas modul berubah. Status terkini tidak boleh hanya disembunyikan dalam laporan historis.
6. Validasi struktur, tautan lokal, dan diff. Jangan menaikkan klaim bukti hanya karena format dokumen lolos.

Dengan skill global kantor terpasang, contoh validasi PowerShell:

```powershell
$checkpointValidator = Join-Path $env:USERPROFILE '.codex/skills/project-governance/scripts/validate_checkpoint.py'
$checkpointFiles = Get-ChildItem docs/context/checkpoint/*.md | Select-Object -ExpandProperty FullName
python $checkpointValidator --strict $checkpointFiles
git diff --check
```

## Baseline verifikasi 2026-11-05

Lingkungan pemeriksaan: Windows, PHP CLI 8.5.12 dan Bun 1.4.4; branch `main`,
HEAD `0cb4408` dengan working tree perbaikan. Perubahan awal pengguna pada
`.env.example` dan `vite.config.ts` dipertahankan. Hasil berikut merupakan
verifikasi terbaru setelah perbaikan, bukan status deployment.

| Pemeriksaan | Hasil aktual |
| --- | --- |
| `composer ci:check` (di luar sandbox) | Exit 0; TypeScript, Pint, PHPStan, dan seluruh feature test lulus |
| TypeScript di dalam CI | `bun run check` dan `bun run types:check` selesai tanpa error |
| Pint di dalam CI | Lulus; output tidak menyediakan jumlah file |
| PHPStan di dalam CI | 0 error pada konfigurasi level 7 dengan baseline yang masih ada; script memakai `--memory-limit=512M` |
| Feature test di dalam CI | 180 passed, 0 skipped, 0 failed; 1538 assertions; 17.618 detik |
| `bun run build` | Exit 0; Wayfinder dan Vite berhasil, 2356 modul ditransformasi; Rolldown memberikan informasi waktu plugin |
| Validator checkpoint `--strict` | 4/4 checkpoint lulus, masing-masing 6/6 bagian wajib |
| Tautan Markdown lokal | File dan anchor dokumentasi diperiksa |
| `git diff --check` | Lulus |

### Perbaikan dan bukti regresi

- Sebanyak 51 temuan aktif PHPStan sebelum perbaikan telah diselesaikan. Metadata
  model kuantitas diselaraskan dengan cast integer dan relasi nullable aktual;
  query Eloquent, kontrak list enum, agregasi receipt cetak, dan akses properti
  diperbaiki. Helper privat yang tidak dipakai dihapus.
- Filter stok mempertahankan perhitungan yang ada dengan status ternormalisasi
  dan parameter binding ID toko. Tidak ada perubahan schema/dependensi.
- Sebelas pengecualian baseline yang menjadi tidak relevan dihapus. Tidak ada
  penambahan baseline/ignore baru atau penurunan level PHPStan. Baseline lain
  yang sudah ada sebelum tugas ini masih dipakai; hasil 0 error tidak berarti
  repositori sudah bebas seluruh utang analisis statis yang dikecualikan.
- Test baru membuktikan role Management sebelumnya dapat membuat order dari Bank
  Permintaan (HTTP 302 ketika seharusnya 403). Endpoint kini memakai policy order;
  UI memakai `canCreateOrder`. Dua regression test memverifikasi Management hanya
  membaca dan Purchasing tetap dapat membuat order.
- Pada perbaikan awal, perilaku stok pusat kurang sempat dipertahankan sesuai pilihan pengguna. Instruksi berikutnya menggantinya dengan reservasi sejak submit dan penolakan penerimaan saat stok fisik pusat kurang. Lihat [batas inventory](context/checkpoint/inventory.md#approved-invariants-and-boundaries).

### Seeder stok manual

`LocalStockSeeder` hanya berjalan di local/testing dan tidak dipanggil otomatis
oleh `DatabaseSeeder`. Tiga feature test baru (22 assertions pada run terarah)
memverifikasi saldo dan ledger, idempotensi setelah saldo diubah, perlindungan
master item/standar, pengecualian data DEMO/inactive serta penolakan production.
Perintah dan skenario manual dijelaskan pada [README](../README.md#stok-untuk-pengujian-manual).
CI lengkap setelah penambahan seeder lulus dengan 180 test / 1538 assertions.

### Riwayat hambatan lingkungan

Percobaan awal dalam sandbox tidak dapat membaca konfigurasi PHPStan/bootstrap
PHPUnit. Pemeriksaan di luar sandbox berhasil menjalankan test. PHPStan awalnya
kehabisan memori 128 MB; script Composer kini menetapkan 512 MB. CI pertama saat
perbaikan juga menemukan dua file lama yang belum sesuai Pint; koreksi format
serta import diterapkan dan CI lengkap kemudian lulus.

Suite berisi 31 file feature test dan 180 metode test. `phpunit.xml` mendaftarkan
suite Feature; belum ada direktori `tests/Unit` atau test frontend/browser otomatis
yang ditemukan di `resources` dan `tests`. Persentase code coverage tidak diukur.
Feature test mencakup skenario yang tertulis, bukan seluruh kombinasi input dan
concurrency. Seeder stok manual dijalankan atas permintaan pengguna pada MySQL
lokal: 64 saldo baru serta 64 audit mutasi untuk HO-JKT dan PP. Ringkasan saldo
diperiksa sesudah seeding. Tidak ada deploy, migrasi database aplikasi, pengiriman
email nyata, atau QA browser manual oleh agent dalam tugas ini.

## Verifikasi reservasi stok — 2026-11-05

- `php artisan test --compact --filter=StockReservationTest`: sebelum perbaikan,
  3 gagal dan 2 lulus (22 assertions), membuktikan pengajuan kedua, approval dan
  pengajuan setelah penerimaan parsial belum dibatasi reservasi. Sesudah perbaikan
  awal, 5/5 lulus (49 assertions); assertion tambahan kemudian ikut CI lengkap.
- `composer ci:check` akhir: exit 0, TypeScript/Pint lulus, PHPStan 0 error,
  185 passed / 0 skipped / 0 failed, 1594 assertions, 11.541 detik pada feature test.
- `bun run build`: exit 0, Wayfinder/Vite berhasil, 2356 modul, 7.88 detik.
- Percobaan test dalam sandbox gagal membaca `vendor/autoload.php`; test dan CI
  dijalankan di luar sandbox dengan SQLite in-memory. CI pertama berhenti karena
  urutan import Pint; PHPStan terarah kemudian menemukan satu penggunaan nullsafe
  yang tidak diperlukan. Keduanya diperbaiki tanpa menambah baseline/ignore.
- Tidak menjalankan migrasi, seeding, koreksi data aplikasi, deploy, atau email
  nyata. Uji konkurensi MySQL dan QA browser belum dilakukan. Permintaan/order
  lama otomatis ikut hitungan reservasi; data historis tidak dikoreksi otomatis.

## Pengujian menyeluruh lanjutan — 2026-11-05

- `StockReservationTest.php` diperluas dari 5 menjadi 13 skenario. Pengujian
  menambahkan dua PIC berbeda, banyak item, alokasi gabungan, SPECIAL, saldo pusat
  hilang, draft lama duplikat dan action dengan snapshot formulir kedaluwarsa.
  Tidak ada perubahan kode produksi atau dependensi pada tugas pengujian ini.
- `php artisan test --compact --filter=StockReservationTest`: 13 passed,
  159 assertions, 17.912 detik. Output sempat tertunda; run diagnostik
  `php artisan test --filter=StockReservationTest --debug` juga lulus 13/13,
  159 assertions, 1.857 detik; tidak ditemukan test macet atau gagal.
- `composer ci:check`: exit 0; 193 passed / 0 skipped / 0 failed,
  1697 assertions, 21.392 detik pada feature test. TypeScript dan Pint lulus;
  PHPStan level 7 dengan baseline yang ada melaporkan 0 error.
- `bun run build`: exit 0; 2356 modul, 8.91 detik; informasi waktu plugin
  Rolldown tetap muncul tanpa kegagalan build.
- Pengujian memakai SQLite in-memory dan mail array, tanpa mutasi data aplikasi,
  migrasi database aplikasi, pengiriman email nyata atau deployment. Xdebug/PCOV
  tidak tersedia pada PHP CLI sehingga persentase coverage tidak diukur. Belum
  ada pengujian browser atau proses pengajuan serentak pada MySQL.

## Batas penerimaan

### Perbaikan UX validasi PR — 2026-11-05

- Dua screenshot pengguna membuktikan toast stok ganda dan input yang dapat
  melebihi stok tersedia. Toast lokal form/detail dihapus; hook global membuang
  pesan duplikat dan menampilkan satu pesan utama. Input reguler dibatasi stok
  tersedia, termasuk saat barang diganti, paste dan prop stok diperbarui.
- `bun test tests/Frontend/request-validation.test.ts`: 7 passed / 0 failed,
  15 assertions. Test frontend ini memakai runner bawaan Bun, tanpa dependensi baru.
- `composer ci:check`: exit 0; 193 passed / 0 skipped / 0 failed,
  1697 assertions, 12.754 detik. TypeScript, Pint dan PHPStan lulus (0 error).
- `bun run build` setelah perbaikan awal: exit 0, 2358 modul, 6.33 detik.
  Tidak ada perubahan server, schema, dependensi atau data operasional.
- Computer Use mencoba memeriksa jendela Chrome form PR tetapi alat menghentikan
  akses karena URL Windows tidak dapat dipastikan. QA browser setelah perubahan
  belum terverifikasi; screenshot pengguna hanya membuktikan kondisi sebelum fix.

### Review sebelum push — 2026-11-05

- Pemeriksaan source paket Inertia yang terpasang membuktikan prop `onSubmit`
  ditimpa handler internal. Guard form PR dipindahkan ke `onBefore`, yang mendukung
  pembatalan visit melalui `false`; dua test render komponen ditambahkan.
- `bun test tests/Frontend`: 9 passed / 0 failed, 26 assertions. Dua test baru
  memeriksa input stok 0 yang kosong/hanya-baca dan penolakan guard, serta jumlah
  draft 99 yang ditampilkan 2 ketika tersedia 2. Inertia dimock pada render server;
  hasil ini tidak membuktikan interaksi browser secara end-to-end.
- `bun run test:frontend` kini menjadi bagian `composer ci:check` melalui script
  package/Composer, tanpa perubahan dependensi atau lockfile.
- Preflight skill `verify_ci.py --pm bun --dry-run .` menemukan `composer setup`
  sebagai langkah bootstrap. Runner preflight kemudian dipanggil via modul dengan
  langkah itu dikecualikan, karena mengganti APP_KEY dan menjalankan migrasi aplikasi.
  Seluruh langkah pemeriksaan tetap dijalankan: `composer ci:check` lulus dengan
  193 feature test / 1697 assertions, Pint/TypeScript lulus dan PHPStan 0 error;
  test frontend lulus 9/9; build lulus (2358 modul, 4.59 detik).
- Tidak ada commit, push, migrasi aplikasi, seeding atau email nyata. Perubahan
  `.env.example` dan `vite.config.ts` yang sudah ada dipertahankan. QA browser dan
  concurrency MySQL tetap belum terverifikasi.
- Review tambahan mereproduksi edit draft terlambat yang dapat mengubah jumlah
  PR setelah diajukan. Test
  `test_stale_draft_cannot_be_rewritten_after_it_has_been_submitted` gagal 1/1
  sebelum perbaikan; action kini memeriksa status dengan row lock dalam transaksi.
  `php artisan test --compact --filter=StockReservationTest` kemudian lulus
  14/14, 164 assertions, 1.980 detik. Simulasi model kedaluwarsa ini tidak mengganti
  pengujian konkurensi dua proses pada MySQL.

- Preflight final setelah perbaikan race draft: `composer ci:check` lulus,
  194 passed / 0 skipped / 0 failed, 1702 assertions, 14.682 detik pada feature
  test; frontend 9 passed / 0 failed, 26 assertions. TypeScript/Pint lulus,
  PHPStan 0 error. `bun run build` lulus (2358 modul, 4.57 detik).
  Validator strict 4/4 checkpoint lulus, 19 tautan lokal valid, `git diff --check`
  lulus. Tidak ada commit/push atau migrasi database aplikasi.

### Landing internal satu layar — 2026-11-05

- `resources/js/pages/welcome.tsx` disederhanakan ke identitas, sapaan, satu CTA
  dan footer. CSS welcome menyesuaikan ukuran judul dan jarak menurut tinggi layar;
  tidak mengubah route, autentikasi atau dependensi.
- `bun run check`: exit 0. `php artisan test --compact --filter=WelcomePageTest`:
  1 passed, 0 skipped/failed, 1 assertion, 0.643 detik. Tidak menambahkan test baru
  untuk perubahan tampilan yang rendah dampak ini.
- Browser in-app mode gelap diverifikasi pada 1280x720, 390x844 dan 844x390;
  `documentElement.scrollWidth/scrollHeight` sama dengan ukuran viewport pada
  ketiganya. Tampilan diperiksa lewat screenshot dan CTA tamu membuka `/login`.
  Viewport override dikembalikan ke default. Tema terang dan CTA sesi login belum
  diperiksa secara visual. Tidak memasukkan kredensial atau mengubah data aplikasi.
- `bun run build` final: exit 0, 2358 modul, 8.29 detik. Validator checkpoint
  platform `--strict` dan `git diff --check` lulus. CI backend penuh tidak diulang
  untuk perubahan halaman ini; hasil CI sebelumnya bukan bukti run baru.

### Efek visual welcome — 2026-11-05

- Polish CSS menambahkan ambient glow, grid memudar, teks gradasi, animasi masuk
  dan hover tombol. Seluruh efek dibatasi kelas welcome; dukungan reduced-motion
  dan fallback forced-colors disertakan, tanpa dependensi atau handler pointer.
- `bun run check` dan `bun run build` lulus; build 2358 modul, 10.68 detik.
  Validator checkpoint platform strict dan `git diff --check` lulus.
- Browser mode gelap: desktop 1280x720 dan ponsel 320x568 tanpa scroll vertikal
  maupun horizontal, tampilan diperiksa lewat screenshot. Viewport direset.
  Tema terang dan reduced-motion belum diuji visual. Tidak menambah test baru atau
  mengulang CI backend untuk efek CSS ini; tidak mengubah database aplikasi.

### Audit input tanggal — 2026-11-05

- Audit `resources/` tidak lagi menemukan native `type="date"` atau
  `type="datetime-local"` setelah 17 input tanggal dan satu input datetime diganti.
  `DateInput` membungkus kalender lokal dengan tampilan DD/MM/YYYY dan hidden
  payload/callback ISO. `DateTimeInput` menampilkan tanggal serta jam terpisah
  tanpa mengubah kontrak datetime lokal. Tidak ada dependensi atau schema baru.
- Browser Chrome memverifikasi pilihan 27/11/2026 menghasilkan query
  date_from=2026-11-27, Reset menampilkan 01/11/2026–30/11/2026, dan daftar order
  memakai format Indonesia yang sama. QA hanya filter GET, tanpa menyimpan data.
- `bun run test:frontend`: 15 passed / 0 failed, 45 assertions. Run awal sempat
  gagal karena assertion mengandalkan urutan atribut HTML disabled, lalu diperbaiki
  menjadi pemeriksaan atribut terpisah. Transform Form GET awal yang mengirim
  tanggal kosong ditemukan lewat browser dan diganti hidden input ISO.
- `bun run build`: exit 0, 2360 modul, 7.06 detik. `bun run check` lulus.
- `git diff --check` global menemukan whitespace di `resources/css/app.css:191`
  yang muncul dari perubahan di luar audit tanggal ini; source CSS pengguna tidak
  diubah. Pemeriksaan scope tanggal dicatat terpisah dari perubahan lokal lainnya.
- `composer ci:check` akhir: exit 0; 194 passed / 0 skipped / 0 failed,
  1702 assertions, 19.405 detik pada backend; frontend 15 passed / 0 failed,
  45 assertions. TypeScript/Pint lulus dan PHPStan 0 error. Empat checkpoint strict
  dan `git diff --check` yang dibatasi file audit tanggal lulus.

### Preflight push seluruh perubahan — 2026-11-06

- Pengguna mengotorisasi commit/push seluruh working tree, termasuk perubahan
  `.env.example` dan `vite.config.ts` yang sebelumnya dipertahankan. Branch `main`,
  remote `origin`; fetch selesai dan HEAD/origin/main tidak divergen sebelum commit.
- Preflight skill code-quality dijalankan via module runner dengan hanya bootstrap
  `composer setup` dilewati agar tidak mengganti APP_KEY atau memigrasi database
  aplikasi. Seluruh pemeriksaan CI dan build tetap dijalankan.
- `composer ci:check` lulus: 194 passed / 0 skipped / 0 failed, 1702 assertions,
  15.605 detik pada feature test; frontend 15 passed / 0 failed, 45 assertions.
  TypeScript dan Pint lulus, PHPStan 0 error.
- `bun run build` lulus: 2360 modul, 5.62 detik. Empat checkpoint strict lulus,
  23 tautan Markdown lokal valid, `git diff --check` global lulus setelah dua
  whitespace dibersihkan. Tidak ada perubahan perilaku pada perapian whitespace.
- Tidak menjalankan migrasi/seeding database aplikasi atau email nyata. QA browser
  lengkap dan pengajuan serentak di MySQL tetap memiliki batas bukti sebelumnya.
  Status commit/push dilaporkan dari hasil Git, bukan diasumsikan oleh dokumen ini.

Lulus pemeriksaan otomatis bukan persetujuan operator. Uji alur browser,
akurasi tampilan cetak/PDF/Excel, pengiriman SMTP nyata, concurrency database
deployment, backup/restore, dan deployment masih perlu bukti tersendiri.
