@extends('errors.layout')

@section('title', '500 - Kesalahan Server')
@section('code', '500')

@section('content')
    <div class="badge badge-error">Error 500 &bull; Kendala Server</div>
    <h1>Terjadi Kesalahan Sistem</h1>
    <p class="desc">
        Sistem mengalami kendala tak terduga saat memproses permintaan Anda. Riwayat log kesalahan telah tersimpan otomatis untuk audit teknis.
    </p>
    <div class="hint-box">
        <strong>Langkah Penanganan:</strong> Silakan coba muat ulang halaman beberapa saat lagi. Jika kendala menetap, hubungi tim IT Administrator Tulola.
    </div>
    <div class="actions">
        <a href="javascript:location.reload()" class="btn btn-primary">Coba Muat Ulang</a>
        <a href="/dashboard" class="btn btn-outline">Ke Dashboard</a>
    </div>
@endsection
