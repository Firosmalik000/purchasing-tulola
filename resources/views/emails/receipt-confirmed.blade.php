@extends('emails.layout')

@section('content')
    <div class="greeting">Konfirmasi Penerimaan Barang dari Cabang</div>
    
    <p>Halo Tim Purchasing Pusat,</p>
    
    <p>Cabang <strong>{{ $receipt->store->name }}</strong> telah mengonfirmasi penerimaan fisik barang untuk Pesanan Pembelian nomor <strong>{{ $receipt->purchaseOrder->number }}</strong> dengan bukti tanda terima nomor <strong>{{ $receipt->number }}</strong>.</p>
    
    <div class="card-box">
        <div class="card-row">
            <span class="card-label">Nomor Penerimaan:</span>
            <span class="card-value">{{ $receipt->number }}</span>
        </div>
        <div class="card-row">
            <span class="card-label">Nomor Purchase Order:</span>
            <span class="card-value">{{ $receipt->purchaseOrder->number }}</span>
        </div>
        <div class="card-row">
            <span class="card-label">Cabang Penerima:</span>
            <span class="card-value">{{ $receipt->store->name }} ({{ $receipt->store->code }})</span>
        </div>
        <div class="card-row">
            <span class="card-label">Diterima Oleh:</span>
            <span class="card-value">{{ $receipt->receiver->name }}</span>
        </div>
        <div class="card-row">
            <span class="card-label">Waktu Diterima:</span>
            <span class="card-value">{{ \Carbon\Carbon::parse($receipt->received_at)->translatedFormat('d F Y, H:i') }}</span>
        </div>
        @if($receipt->notes)
        <div class="card-row">
            <span class="card-label">Catatan Penerimaan:</span>
            <span class="card-value">{{ $receipt->notes }}</span>
        </div>
        @endif
    </div>
    
    <div style="font-weight: 600; font-size: 13px; margin-top: 20px; color: #18181b;">Rincian Barang yang Diterima:</div>
    <table class="table-data">
        <thead>
            <tr>
                <th>Item / Barang</th>
                <th style="text-align: right;">Jumlah Dipesan</th>
                <th style="text-align: right;">Jumlah Diterima</th>
            </tr>
        </thead>
        <tbody>
            @foreach($receipt->items as $item)
            <tr>
                <td>
                    <strong>{{ $item->purchaseOrderItem->name ?? ($item->purchaseOrderItem->item->name ?? 'Item') }}</strong>
                </td>
                <td style="text-align: right; color: #71717a;">
                    {{ number_format((int) $item->ordered_quantity, 0, ',', '.') }}
                </td>
                <td style="text-align: right; font-weight: 700; color: #047857;">
                    {{ number_format((int) $item->received_quantity, 0, ',', '.') }} {{ $item->purchaseOrderItem->unit->symbol ?? '' }}
                </td>
            </tr>
            @endforeach
        </tbody>
    </table>
    
    <div class="btn-container">
        <a href="{{ $viewUrl }}" class="btn">Lihat Detail PO di Pusat</a>
    </div>
@endsection
