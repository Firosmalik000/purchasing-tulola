@extends('errors.layout')

@section('title', '403 - Akses Ditolak')
@section('code', '403')

@section('content')
    <div class="badge badge-error">Error 403 &bull; Akses Dibatasi</div>
    <h1>Wewenang Tidak Mencukupi</h1>
    <p class="desc">
        Akun Anda tidak memiliki izin untuk membuka halaman ini. Hak akses dipisahkan antara peran Kantor Pusat dan PIC Toko Cabang.
    </p>
    <div class="hint-box">
        <strong>Perhatian:</strong> Jika Anda memerlukan wewenang ke menu ini, silakan hubungi Administrator Purchasing Pusat untuk penyesuaian hak akses.
    </div>
    <div class="actions">
        <a href="/dashboard" class="btn btn-primary">Ke Dashboard</a>
        <a href="javascript:history.back()" class="btn btn-outline">Halaman Sebelumnya</a>
    </div>
@endsection
