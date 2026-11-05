# Panduan kerja agent

## Mulai setiap tugas

- Baca `docs/context/README.md` dan checkpoint pemilik modul di `docs/context/checkpoint/` sebelum mengubah kode.
- Periksa `git status --short`. Pertahankan perubahan pengguna yang sudah ada; jangan melakukan reset atau mengikutsertakan perubahan itu sebagai hasil tugas sendiri.
- Cocokkan checkpoint dengan source saat ini. Jika berbeda, jelaskan selisihnya dan perbarui dokumentasi berdasarkan bukti, tanpa mengarang keputusan produk.
- Gunakan skill global kantor yang relevan bila tersedia: `project-governance`, `laravel-suite`, `backend-engineering`, `frontend-craft`, `code-quality`, dan `security-engineering`. Dokumentasi repositori tetap bisa dipakai tanpa instalasi skill tersebut.

## Pola proyek

- Backend: route/middleware, Form Request dan policy, controller, action/service, lalu Eloquent. Ikuti pola modul yang disentuh; jangan menambahkan repository layer hanya untuk memenuhi pola skill generik.
- Frontend: Inertia React, TypeScript, Tailwind, dan komponen lokal. Gunakan Bun serta `bun.lock` untuk dependensi frontend.
- Pertahankan aturan bisnis dalam checkpoint. Kuantitas dan nilai uang saat ini berupa integer; jangan mengganti ke pecahan atau desimal tanpa keputusan pemilik proyek.
- Otorisasi dan batas status harus ditegakkan di server, termasuk untuk super admin. Pertahankan transaksi, locking, alokasi penerimaan, dan audit mutasi stok.
- Jangan menjalankan migrasi pada database aplikasi, seeding, atau penghapusan data tanpa otorisasi yang sesuai. Migrasi pada SQLite in-memory oleh feature test adalah bagian pemeriksaan otomatis.
- Jangan menambahkan dependensi atau mengubah schema di luar cakupan tugas yang disetujui. Jangan menyimpan `.env`, token, password operasional, atau data produksi di dokumentasi.

## Selesaikan dan serahkan

- Jalankan pemeriksaan yang relevan; perintah tersedia di `docs/development.md`. Catat perintah, hasil aktual, kegagalan, skip, dan batas pengujian. Untuk baseline penuh gunakan `composer ci:check` dan `bun run build`.
- Perbarui checkpoint pemilik modul pada `### Current working-tree reconciliation — YYYY-MM-DD`, kemampuan, keputusan terbuka, dan satu langkah berikutnya. Gunakan tanggal Asia/Jakarta. Sinkronkan indeks jika status lintas modul berubah.
- Validasi checkpoint dengan `validate_checkpoint.py --strict` dari skill `project-governance` jika tersedia. Untuk dokumentasi, periksa juga tautan lokal dan `git diff --check`.
- Review diff akhir. Jangan mengklaim deploy, migrasi aplikasi, pengiriman email nyata, atau penerimaan QA manual tanpa bukti.
- Sebelum push yang memang diminta, jalankan pemeriksaan CI dan preflight skill `code-quality` bila tersedia. Jangan melakukan commit atau push hanya karena checkpoint diperbarui.
