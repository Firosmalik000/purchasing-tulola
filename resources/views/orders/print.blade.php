<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Surat Order Internal {{ $order['number'] }} — Tulola Jewelry</title>
    <style>
        @page {
            size: A4 portrait;
            margin: 10mm 12mm 10mm 12mm;
        }

        * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }

        body {
            margin: 0;
            padding: 0;
            background-color: #f1f5f9;
            color: #1f2937;
            font-family: DejaVu Sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            font-size: 8.5pt;
            line-height: 1.35;
        }

        /* Screen toolbar */
        .toolbar {
            position: sticky;
            top: 0;
            z-index: 1000;
            background: #ffffff;
            border-bottom: 1px solid #e2e8f0;
            padding: 10px 18px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        }

        .toolbar-info {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .toolbar-badge {
            background: #f3e8ff;
            color: #6b21a8;
            font-size: 10px;
            font-weight: 700;
            padding: 3px 8px;
            border-radius: 9999px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .toolbar-title {
            font-size: 13px;
            font-weight: 700;
            color: #1e1b4b;
        }

        .toolbar-actions {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .btn {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 6px 14px;
            font-size: 11px;
            font-weight: 600;
            border-radius: 6px;
            text-decoration: none;
            cursor: pointer;
            border: none;
            transition: all 0.15s ease;
        }

        .btn-primary {
            background: #4c1d95;
            color: #ffffff;
        }

        .btn-primary:hover {
            background: #3b0764;
        }

        .btn-secondary {
            background: #ffffff;
            color: #374151;
            border: 1px solid #d1d5db;
        }

        .btn-secondary:hover {
            background: #f9fafb;
            color: #111827;
        }

        /* Sheet presentation */
        .sheet-container {
            max-width: 210mm;
            min-height: 297mm;
            margin: 18px auto;
            background: #ffffff;
            padding: 12mm 14mm;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
            border-radius: 3px;
        }

        /* Header block */
        .doc-header {
            display: table;
            width: 100%;
            border-bottom: 2px solid #4c1d95;
            padding-bottom: 8px;
            margin-bottom: 10px;
        }

        .doc-brand {
            display: table-cell;
            vertical-align: top;
            width: 58%;
        }

        .brand-logo-text {
            font-size: 18pt;
            font-weight: 800;
            letter-spacing: 1.5px;
            color: #4c1d95;
            margin: 0 0 2px 0;
            text-transform: uppercase;
        }

        .brand-sub {
            font-size: 8pt;
            font-weight: 600;
            color: #374151;
            margin: 0 0 1px 0;
            letter-spacing: 0.3px;
        }

        .brand-desc {
            font-size: 7pt;
            color: #6b7280;
            margin: 0;
        }

        .doc-meta {
            display: table-cell;
            vertical-align: top;
            text-align: right;
            width: 42%;
        }

        .doc-type-title {
            font-size: 12pt;
            font-weight: 800;
            color: #1e1b4b;
            margin: 0 0 3px 0;
            letter-spacing: 0.5px;
        }

        .order-number-tag {
            display: inline-block;
            background: #f8fafc;
            border: 1.5px solid #4c1d95;
            color: #4c1d95;
            font-family: monospace;
            font-size: 10pt;
            font-weight: 700;
            padding: 2px 8px;
            border-radius: 4px;
            margin-bottom: 3px;
        }

        .status-badge {
            display: inline-block;
            font-size: 7.5pt;
            font-weight: 700;
            padding: 2px 7px;
            border-radius: 4px;
            text-transform: uppercase;
            letter-spacing: 0.4px;
            border: 1px solid #cbd5e1;
            background: #f1f5f9;
            color: #334155;
        }

        .status-draft { background: #fef3c7; color: #92400e; border-color: #fde68a; }
        .status-ordered { background: #dbeafe; color: #1e40af; border-color: #bfdbfe; }
        .status-partial { background: #ffedd5; color: #9a3412; border-color: #fed7aa; }
        .status-completed { background: #d1fae5; color: #065f46; border-color: #a7f3d0; }
        .status-cancelled { background: #fee2e2; color: #991b1b; border-color: #fecaca; }

        /* Context Information Grid */
        .info-grid {
            display: table;
            width: 100%;
            border: 1px solid #e2e8f0;
            border-radius: 4px;
            background: #f8fafc;
            margin-bottom: 12px;
            border-collapse: separate;
        }

        .info-row {
            display: table-row;
        }

        .info-cell {
            display: table-cell;
            padding: 5px 8px;
            border-bottom: 1px solid #e2e8f0;
            vertical-align: top;
            width: 50%;
        }

        .info-row:last-child .info-cell {
            border-bottom: none;
        }

        .info-cell:first-child {
            border-right: 1px solid #e2e8f0;
        }

        .info-label {
            display: inline-block;
            width: 130px;
            font-size: 7.5pt;
            color: #64748b;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.3px;
        }

        .info-value {
            font-size: 8.5pt;
            font-weight: 700;
            color: #1e293b;
        }

        /* Items Table */
        .table-section {
            margin-bottom: 12px;
        }

        table.items-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 8pt;
        }

        table.items-table th {
            background-color: #312e81;
            color: #ffffff;
            font-size: 7.5pt;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.4px;
            padding: 5px 6px;
            border: 1px solid #312e81;
            text-align: left;
        }

        table.items-table th.center { text-align: center; }
        table.items-table th.right { text-align: right; }

        table.items-table td {
            padding: 4.5px 6px;
            border: 1px solid #e2e8f0;
            vertical-align: middle;
            color: #1f2937;
        }

        table.items-table td.center { text-align: center; }
        table.items-table td.right { text-align: right; }

        table.items-table tbody tr:nth-child(even) {
            background-color: #fafafa;
        }

        table.items-table tbody tr {
            page-break-inside: avoid;
        }

        .sku-code {
            font-family: monospace;
            font-size: 8pt;
            font-weight: 600;
            color: #374151;
        }

        .item-name {
            font-weight: 600;
            color: #111827;
        }

        .badge-type {
            font-size: 6.5pt;
            font-weight: 600;
            padding: 1.5px 4px;
            border-radius: 3px;
            display: inline-block;
        }

        .badge-stock {
            background: #fef3c7;
            color: #92400e;
        }

        .badge-special {
            background: #f3e8ff;
            color: #6b21a8;
        }

        .qty-cell {
            font-family: monospace;
            font-weight: 700;
            font-size: 8.5pt;
        }

        /* Summary Total Row */
        table.items-table tfoot tr {
            background-color: #f1f5f9;
            font-weight: 700;
            border-top: 2px solid #312e81;
        }

        table.items-table tfoot td {
            padding: 5px 6px;
            border: 1px solid #cbd5e1;
            font-size: 8pt;
        }

        /* Notes Box */
        .notes-box {
            border: 1px dashed #c084fc;
            background: #faf5ff;
            border-radius: 4px;
            padding: 6px 10px;
            margin-bottom: 12px;
            page-break-inside: avoid;
        }

        .notes-title {
            font-size: 7.5pt;
            font-weight: 700;
            color: #6b21a8;
            text-transform: uppercase;
            letter-spacing: 0.4px;
            margin-bottom: 3px;
        }

        .notes-content {
            font-size: 8pt;
            color: #374151;
            white-space: pre-line;
            line-height: 1.35;
        }

        /* Signatures Block */
        .signatures-section {
            margin-top: 14px;
            page-break-inside: avoid;
        }

        .signatures-grid {
            display: table;
            width: 100%;
            table-layout: fixed;
            border-collapse: separate;
            border-spacing: 8px 0;
        }

        .signature-box {
            display: table-cell;
            width: 33.333%;
            border: 1px solid #cbd5e1;
            border-radius: 4px;
            padding: 6px 8px;
            text-align: center;
            background: #ffffff;
            vertical-align: top;
        }

        .signature-role {
            font-size: 7.5pt;
            font-weight: 700;
            color: #334155;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            margin-bottom: 2px;
            padding-bottom: 4px;
            border-bottom: 1px solid #f1f5f9;
        }

        .signature-dept {
            font-size: 6.5pt;
            color: #64748b;
            margin-bottom: 4px;
        }

        .signature-space {
            height: 48px;
        }

        .signature-name {
            font-size: 7.5pt;
            font-weight: 700;
            color: #1e293b;
            border-top: 1px dotted #94a3b8;
            padding-top: 4px;
            margin-top: 2px;
        }

        .signature-date {
            font-size: 6.5pt;
            color: #64748b;
            margin-top: 2px;
        }

        /* Document Footer */
        .doc-footer {
            margin-top: 14px;
            padding-top: 6px;
            border-top: 1px solid #e2e8f0;
            display: table;
            width: 100%;
            font-size: 7pt;
            color: #64748b;
            page-break-inside: avoid;
        }

        .footer-left {
            display: table-cell;
            vertical-align: middle;
            width: 70%;
        }

        .footer-right {
            display: table-cell;
            vertical-align: middle;
            text-align: right;
            width: 30%;
            font-weight: 600;
        }

        /* Print Media Styles */
        @media print {
            body {
                background: #ffffff !important;
            }

            .toolbar {
                display: none !important;
            }

            .sheet-container {
                max-width: 100% !important;
                min-height: 0 !important;
                margin: 0 !important;
                padding: 0 !important;
                box-shadow: none !important;
                border-radius: 0 !important;
                width: 100% !important;
            }

            thead {
                display: table-header-group;
            }

            tfoot {
                display: table-footer-group;
            }

            tr {
                page-break-inside: avoid;
            }
        }
    </style>
</head>
<body>

    @if ($print ?? true)
        <div class="toolbar">
            <div class="toolbar-info">
                <span class="toolbar-badge">Dokumen Resmi A4</span>
                <span class="toolbar-title">Surat Order Internal: {{ $order['number'] }}</span>
            </div>
            <div class="toolbar-actions">
                <a href="{{ url('/central/orders/'.$purchaseOrder->id) }}" class="btn btn-secondary">
                    ← Kembali ke Order
                </a>
                <a href="{{ url('/central/orders/'.$purchaseOrder->id.'/pdf') }}" class="btn btn-secondary" target="_blank">
                    Unduh PDF
                </a>
                <button type="button" onclick="window.print()" class="btn btn-primary">
                    🖨️ Cetak Lembar Order
                </button>
            </div>
        </div>
    @endif

    @php
        $logoFile = public_path('images/logo/nts-logo-light.png');
        $logoDataUri = file_exists($logoFile) ? 'data:image/png;base64,' . base64_encode(file_get_contents($logoFile)) : null;
    @endphp

    <div class="sheet-container">
        <!-- Header -->
        <div class="doc-header">
            <div class="doc-brand">
                <table style="border-collapse: collapse; border: none; margin: 0; padding: 0;">
                    <tr>
                        @if ($logoDataUri)
                            <td style="border: none; padding: 0 12px 0 0; vertical-align: middle;">
                                <img src="{{ $logoDataUri }}" alt="PT. Napak Tilas Seni" style="height: 48px; width: auto; display: block;" />
                            </td>
                        @endif
                        <td style="border: none; padding: 0; vertical-align: middle;">
                            <div class="brand-logo-text">TULOLA</div>
                            <div class="brand-sub">PT. NAPAK TILAS SENI • DIVISI PURCHASING & LOGISTIK</div>
                            <div class="brand-desc">Head Office & Central Fulfillment • Shoptulola Jewelry</div>
                        </td>
                    </tr>
                </table>
            </div>
            <div class="doc-meta">
                <div class="doc-type-title">SURAT ORDER INTERNAL</div>
                <div class="order-number-tag">{{ $order['number'] }}</div>
                <div>
                    @php
                        $statusClass = match($order['status']) {
                            'DRAFT' => 'status-draft',
                            'ORDERED' => 'status-ordered',
                            'PARTIALLY_RECEIVED' => 'status-partial',
                            'COMPLETED' => 'status-completed',
                            'CANCELLED' => 'status-cancelled',
                            default => 'status-ordered',
                        };
                    @endphp
                    <span class="status-badge {{ $statusClass }}">Status: {{ $order['status_label'] }}</span>
                </div>
            </div>
        </div>

        <!-- Order Information Context Grid -->
        <div class="info-grid">
            <div class="info-row">
                <div class="info-cell">
                    <span class="info-label">Toko Tujuan / Pemesan</span>
                    <span class="info-value">: {{ $order['target_store_name'] }}</span>
                </div>
                <div class="info-cell">
                    <span class="info-label">Tanggal Order</span>
                    <span class="info-value">: {{ $order['order_date'] }}</span>
                </div>
            </div>
            <div class="info-row">
                <div class="info-cell">
                    <span class="info-label">Nomor Permintaan (PR)</span>
                    <span class="info-value">: {{ $order['request_number'] }}</span>
                </div>
                <div class="info-cell">
                    <span class="info-label">Target Tiba di Toko</span>
                    <span class="info-value">: {{ $order['expected_date'] }}</span>
                </div>
            </div>
            <div class="info-row">
                <div class="info-cell">
                    <span class="info-label">Dibuat Oleh</span>
                    <span class="info-value">: {{ $order['creator_name'] }}</span>
                </div>
                <div class="info-cell">
                    <span class="info-label">Waktu Cetak</span>
                    <span class="info-value">: {{ $order['printed_at'] }}</span>
                </div>
            </div>
        </div>

        <!-- Table of Items -->
        <div class="table-section">
            <table class="items-table">
                <thead>
                    <tr>
                        <th class="center" style="width: 26px;">#</th>
                        <th class="center" style="width: 80px;">Kode / SKU</th>
                        <th>Nama & Deskripsi Barang</th>
                        <th class="center" style="width: 75px;">Tipe</th>
                        <th class="right" style="width: 60px;">Dipesan</th>
                        <th class="center" style="width: 40px;">Satuan</th>
                        <th class="right" style="width: 60px;">Diterima</th>
                        <th class="center" style="width: 75px;">Status</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse ($order['items'] as $item)
                        <tr>
                            <td class="center">{{ $item['no'] }}</td>
                            <td class="center sku-code">{{ $item['sku'] }}</td>
                            <td>
                                <span class="item-name">{{ $item['name'] }}</span>
                                @if (!empty($item['category']) && $item['category'] !== '—')
                                    <span style="display: block; font-size: 7pt; color: #64748b;">Kat: {{ $item['category'] }}</span>
                                @endif
                            </td>
                            <td class="center">
                                @if ($item['type'] === 'STOCK')
                                    <span class="badge-type badge-stock">Stok Reguler</span>
                                @else
                                    <span class="badge-type badge-special">Item Khusus</span>
                                @endif
                            </td>
                            <td class="right qty-cell">{{ number_format($item['quantity'], 0, ',', '.') }}</td>
                            <td class="center" style="font-size: 7.5pt; color: #475569;">{{ $item['unit'] }}</td>
                            <td class="right qty-cell" style="color: {{ $item['received_quantity'] > 0 ? '#059669' : '#64748b' }};">
                                {{ number_format($item['received_quantity'], 0, ',', '.') }}
                            </td>
                            <td class="center">
                                @if ($item['status_label'] === 'Lengkap')
                                    <span style="color: #059669; font-weight: 700; font-size: 7pt;">Lengkap</span>
                                @elseif ($item['status_label'] === 'Sebagian')
                                    <span style="color: #d97706; font-weight: 700; font-size: 7pt;">Sebagian</span>
                                @else
                                    <span style="color: #64748b; font-size: 7pt;">Belum</span>
                                @endif
                            </td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="8" class="center" style="padding: 18px; color: #64748b;">
                                Tidak ada item dalam order internal ini.
                            </td>
                        </tr>
                    @endforelse
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="4" class="right" style="text-transform: uppercase; font-size: 7.5pt; letter-spacing: 0.3px;">
                            Total Keseluruhan ({{ $order['total_items'] }} Jenis Item):
                        </td>
                        <td class="right qty-cell">
                            {{ number_format($order['total_ordered'], 0, ',', '.') }}
                        </td>
                        <td class="center" style="font-size: 7.5pt;">Unit</td>
                        <td class="right qty-cell" style="color: #059669;">
                            {{ number_format($order['total_received'], 0, ',', '.') }}
                        </td>
                        <td></td>
                    </tr>
                </tfoot>
            </table>
        </div>

        <!-- Notes / Delivery Instructions -->
        @if (!empty($order['notes']))
            <div class="notes-box">
                <div class="notes-title">Catatan & Petunjuk Pengiriman:</div>
                <div class="notes-content">{{ $order['notes'] }}</div>
            </div>
        @endif

        <!-- Signatures Block -->
        <div class="signatures-section">
            <div class="signatures-grid">
                <div class="signature-box">
                    <div class="signature-role">Dibuat Oleh</div>
                    <div class="signature-dept">Purchasing Central</div>
                    <div class="signature-space"></div>
                    <div class="signature-name">{{ $order['creator_name'] }}</div>
                    <div class="signature-date">Tgl: {{ $order['order_date_raw'] }}</div>
                </div>
                <div class="signature-box">
                    <div class="signature-role">Diserahkan / Ekspedisi</div>
                    <div class="signature-dept">Logistik & Distribusi Central</div>
                    <div class="signature-space"></div>
                    <div class="signature-name">( ........................................ )</div>
                    <div class="signature-date">Tgl: .................................</div>
                </div>
                <div class="signature-box">
                    <div class="signature-role">Diterima Oleh</div>
                    <div class="signature-dept">Store Manager / Tim Toko</div>
                    <div class="signature-space"></div>
                    <div class="signature-name">( ........................................ )</div>
                    <div class="signature-date">Tgl: .................................</div>
                </div>
            </div>
        </div>

        <!-- Document Footer -->
        <div class="doc-footer">
            <div class="footer-left">
                Dokumen resmi diterbitkan melalui Sistem Purchasing Tulola Jewelry • Dicetak oleh: {{ $order['printed_by'] }} pada {{ $order['printed_at'] }}
            </div>
            <div class="footer-right">
                Format Cetak A4 (Maks. 2 Lembar)
            </div>
        </div>
    </div>

    @if (!empty($autoPrint))
        <script>
            window.addEventListener('load', function() {
                window.print();
            });
        </script>
    @endif
</body>
</html>
