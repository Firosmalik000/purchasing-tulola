@extends('emails.layout')

@section('content')
    <div class="greeting">Order Internal Siap Diterima</div>
    
    <p>Halo Rekan di <strong>{{ $store->name }}</strong>,</p>
    
    <p>Tim purchasing pusat telah memproses pengajuan Anda dan mengirim Order Internal nomor <strong>{{ $purchaseOrder->number }}</strong>.</p>
    
    <div class="card-box">
        <div class="card-row">
            <span class="card-label">Nomor Order:</span>
            <span class="card-value">{{ $purchaseOrder->number }}</span>
        </div>
        <div class="card-row">
            <span class="card-label">Estimasi Kedatangan:</span>
            <span class="card-value">{{ $purchaseOrder->expected_date ? \Carbon\Carbon::parse($purchaseOrder->expected_date)->translatedFormat('d F Y') : 'Belum ditentukan' }}</span>
        </div>
        <div class="card-row">
            <span class="card-label">Status Pesanan:</span>
            <span class="card-value"><span class="badge badge-gold">{{ $purchaseOrder->status->label() }}</span></span>
        </div>
    </div>
    
    <div style="font-weight: 600; font-size: 13px; margin-top: 20px; color: #18181b;">Item yang Dialokasikan untuk Toko Anda:</div>
    <table class="table-data">
        <thead>
            <tr>
                <th>Item / Barang</th>
                <th style="text-align: right;">Jumlah Dipesan</th>
            </tr>
        </thead>
        <tbody>
            @foreach($items as $item)
            <tr>
                <td>
                    <strong>{{ $item['name'] }}</strong>
                    @if(!empty($item['sku']))
                        <div style="font-size: 11px; color: #71717a;">SKU: {{ $item['sku'] }}</div>
                    @endif
                </td>
                <td style="text-align: right; font-weight: 600;">
                    {{ $item['quantity'] }} {{ $item['unit'] }}
                </td>
            </tr>
            @endforeach
        </tbody>
    </table>
    
    <div class="btn-container">
        <a href="{{ $viewUrl }}" class="btn">Lihat Pesanan Masuk di Toko</a>
    </div>
    
    <p style="font-size: 13px; color: #71717a; text-align: center;">
        Saat barang fisik tiba di toko, pastikan untuk melakukan verifikasi dan konfirmasi penerimaan melalui modul <strong>Pesanan Masuk (Incoming Orders)</strong>.
    </p>
@endsection
