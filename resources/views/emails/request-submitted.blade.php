@extends('emails.layout')

@section('content')
    <div class="greeting">Permintaan Pembelian Baru Diajukan</div>
    
    <p>Halo Tim Purchasing Pusat,</p>
    
    <p>Cabang butik <strong>{{ $purchaseRequest->store->name }}</strong> telah mengajukan Surat Permintaan Pembelian (Purchase Request) baru dengan nomor <strong>{{ $purchaseRequest->number }}</strong>.</p>
    
    <div class="card-box">
        <div class="card-row">
            <span class="card-label">Nomor Permintaan:</span>
            <span class="card-value">{{ $purchaseRequest->number }}</span>
        </div>
        <div class="card-row">
            <span class="card-label">Cabang / Butik:</span>
            <span class="card-value">{{ $purchaseRequest->store->name }} ({{ $purchaseRequest->store->code }})</span>
        </div>
        <div class="card-row">
            <span class="card-label">Diajukan Oleh:</span>
            <span class="card-value">{{ $purchaseRequest->requester->name }}</span>
        </div>
        <div class="card-row">
            <span class="card-label">Tanggal Dibutuhkan:</span>
            <span class="card-value">{{ $purchaseRequest->required_date ? \Carbon\Carbon::parse($purchaseRequest->required_date)->translatedFormat('d F Y') : '-' }}</span>
        </div>
        @if($purchaseRequest->notes)
        <div class="card-row">
            <span class="card-label">Catatan Tambahan:</span>
            <span class="card-value">{{ $purchaseRequest->notes }}</span>
        </div>
        @endif
    </div>
    
    <div style="font-weight: 600; font-size: 13px; margin-top: 20px; color: #18181b;">Daftar Item yang Diminta:</div>
    <table class="table-data">
        <thead>
            <tr>
                <th>Item / Keperluan</th>
                <th>Tipe</th>
                <th style="text-align: right;">Jumlah Diminta</th>
            </tr>
        </thead>
        <tbody>
            @foreach($purchaseRequest->items as $item)
            <tr>
                <td>
                    <strong>{{ $item->item ? $item->item->name : $item->name }}</strong>
                    @if($item->description)
                        <div style="font-size: 11px; color: #71717a;">{{ $item->description }}</div>
                    @endif
                </td>
                <td>
                    <span class="badge {{ $item->type->value === 'STOCK' ? 'badge-gold' : 'badge-green' }}">
                        {{ $item->type->value === 'STOCK' ? 'Stok' : 'Khusus' }}
                    </span>
                </td>
                <td style="text-align: right; font-weight: 600;">
                    {{ rtrim(rtrim(number_format((float)$item->requested_quantity, 3, '.', ''), '0'), '.') }} {{ $item->unit->symbol ?? $item->unit->name }}
                </td>
            </tr>
            @endforeach
        </tbody>
    </table>
    
    <div class="btn-container">
        <a href="{{ $viewUrl }}" class="btn">Tinjau & Proses Permintaan</a>
    </div>
@endsection
