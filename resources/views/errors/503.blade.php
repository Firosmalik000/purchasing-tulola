@extends('errors.layout')

@section('title', '503 - Pemeliharaan Sistem')
@section('code', '503')

@section('content')
    <div class="badge badge-warning">Status 503 &bull; Pemeliharaan Rutin</div>
    <h1>Sistem Sedang Ditingkatkan</h1>
    <p class="desc">
        Portal Purchasing Tulola sedang dalam proses pemeliharaan sistem terencana demi meningkatkan performa dan keandalan data.
    </p>
    <div class="hint-box">
        <strong>Pemberitahuan:</strong> Pemeliharaan diperkirakan selesai dalam waktu singkat. Terima kasih atas kesabaran seluruh tim toko cabang dan pusat.
    </div>
    <div class="actions">
        <a href="javascript:location.reload()" class="btn btn-primary">Periksa Status Layanan</a>
    </div>
@endsection
