@extends('errors.layout')

@section('title', '404 - Halaman Tidak Ditemukan')
@section('code', '404')

@section('content')
    <div class="badge badge-info">Error 404 &bull; Tidak Ditemukan</div>
    <h1>Halaman Tidak Ditemukan</h1>
    <p class="desc">
        Halaman yang Anda tuju mungkin telah dipindahkan, dinonaktifkan, atau alamat URL yang Anda masukkan tidak tepat.
    </p>
    <div class="hint-box">
        <strong>Saran Navigasi:</strong> Periksa kembali tautan yang Anda tuju atau kembali ke beranda/dashboard pengadaan untuk mencari data yang dibutuhkan.
    </div>
    <div class="actions">
        <a href="/dashboard" class="btn btn-primary">Ke Dashboard</a>
        <a href="/" class="btn btn-outline">Ke Beranda</a>
    </div>
@endsection
