@extends('errors.layout')

@section('title', '419 - Sesi Kedaluwarsa')
@section('code', '419')

@section('content')
    <div class="badge badge-warning">Error 419 &bull; Sesi Kedaluwarsa</div>
    <h1>Sesi Keamanan Berakhir</h1>
    <p class="desc">
        Halaman telah lama tidak aktif demi melindungi keamanan data pengadaan. Token sesi Anda perlu diperbarui.
    </p>
    <div class="hint-box">
        <strong>Solusi:</strong> Silakan muat ulang halaman untuk memperbarui token keamanan atau masuk kembali ke akun portal Anda.
    </div>
    <div class="actions">
        <a href="javascript:location.reload()" class="btn btn-primary">Muat Ulang Halaman</a>
        <a href="/login" class="btn btn-outline">Masuk Ulang</a>
    </div>
@endsection
