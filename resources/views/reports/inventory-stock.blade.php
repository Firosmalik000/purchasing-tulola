<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $report['title'] }} — Tulola Jewelry</title>
    <style>
        @page {
            size: A4 landscape;
            margin: 10mm 12mm;
        }
        * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        body {
            margin: 0;
            padding: 0;
            color: #1f2937;
            font-family: DejaVu Sans, 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            font-size: 8.5px;
            background-color: #ffffff;
            line-height: 1.35;
        }

        /* Screen toolbar when opened in browser for print */
        .toolbar {
            position: sticky;
            top: 0;
            z-index: 100;
            background: #ffffff;
            border-bottom: 1px solid #e5e7eb;
            padding: 10px 16px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
            margin-bottom: 14px;
        }
        .toolbar-title {
            font-size: 13px;
            font-weight: 700;
            color: #4c1d95;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .toolbar-actions {
            display: flex;
            gap: 8px;
        }
        .btn {
            border: none;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 600;
            padding: 7px 14px;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            text-decoration: none;
            transition: background 0.15s ease;
        }
        .btn-primary {
            background: #4c1d95;
            color: #ffffff;
        }
        .btn-primary:hover {
            background: #3b0764;
        }
        .btn-secondary {
            background: #f3f4f6;
            color: #374151;
            border: 1px solid #d1d5db;
        }
        .btn-secondary:hover {
            background: #e5e7eb;
        }

        /* Document Header */
        .report-header {
            border-bottom: 2px solid #4c1d95;
            padding-bottom: 10px;
            margin-bottom: 12px;
            display: table;
            width: 100%;
        }
        .brand-col {
            display: table-cell;
            vertical-align: top;
            width: 60%;
        }
        .meta-col {
            display: table-cell;
            vertical-align: top;
            text-align: right;
            width: 40%;
        }
        .company-name {
            font-size: 17px;
            font-weight: 800;
            color: #4c1d95;
            letter-spacing: 0.5px;
            margin: 0 0 2px;
            text-transform: uppercase;
        }
        .document-title {
            font-size: 12px;
            font-weight: 700;
            color: #1e1b4b;
            margin: 0 0 2px;
        }
        .document-subtitle {
            font-size: 8px;
            color: #6b7280;
            margin: 0;
        }
        .meta-box {
            display: inline-block;
            text-align: right;
            font-size: 8px;
            line-height: 1.4;
        }
        .meta-box strong {
            color: #374151;
        }

        /* KPI Cards Grid */
        .kpi-grid {
            display: table;
            width: 100%;
            margin-bottom: 12px;
            table-layout: fixed;
        }
        .kpi-card {
            display: table-cell;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 5px;
            padding: 6px 10px;
            text-align: center;
        }
        .kpi-card + .kpi-card {
            border-left: none;
        }
        .kpi-label {
            font-size: 7px;
            text-transform: uppercase;
            font-weight: 700;
            color: #64748b;
            letter-spacing: 0.4px;
            margin-bottom: 2px;
        }
        .kpi-value {
            font-size: 11px;
            font-weight: 800;
            color: #0f172a;
        }
        .kpi-value.purple { color: #4c1d95; }
        .kpi-value.success { color: #15803d; }
        .kpi-value.warning { color: #b45309; }
        .kpi-value.danger { color: #b91c1c; }

        /* Stock Table */
        table.stock-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 14px;
        }
        table.stock-table th {
            background: #312e81;
            color: #ffffff;
            font-size: 7.5px;
            font-weight: 700;
            text-transform: uppercase;
            padding: 5px 6px;
            border: 1px solid #312e81;
            letter-spacing: 0.3px;
        }
        table.stock-table td {
            border: 1px solid #e2e8f0;
            padding: 4px 6px;
            vertical-align: middle;
            font-size: 8px;
        }
        table.stock-table tbody tr:nth-child(even) {
            background-color: #f8fafc;
        }
        table.stock-table tbody tr {
            page-break-inside: avoid;
        }

        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .text-left { text-align: left; }
        .font-mono { font-family: monospace, DejaVu Sans, sans-serif; }
        .font-bold { font-weight: 700; }

        /* Status Badge Pills */
        .badge {
            display: inline-block;
            padding: 1.5px 5px;
            border-radius: 9999px;
            font-size: 7px;
            font-weight: 700;
            text-align: center;
            white-space: nowrap;
        }
        .badge-success {
            background: #dcfce7;
            color: #166534;
            border: 0.5px solid #bbf7d0;
        }
        .badge-warning {
            background: #fef9c3;
            color: #854d0e;
            border: 0.5px solid #fef08a;
        }
        .badge-critical {
            background: #fef3c7;
            color: #92400e;
            border: 0.5px solid #fde68a;
        }
        .badge-danger {
            background: #fee2e2;
            color: #991b1b;
            border: 0.5px solid #fecaca;
        }

        /* Summary Total Row */
        .total-row td {
            background-color: #eef2ff !important;
            font-weight: 800;
            color: #1e1b4b;
            border-top: 1.5px solid #312e81 !important;
            border-bottom: 2px solid #312e81 !important;
        }

        /* Signatures Block */
        .signatures {
            display: table;
            width: 100%;
            margin-top: 24px;
            table-layout: fixed;
            page-break-inside: avoid;
        }
        .signature-box {
            display: table-cell;
            text-align: center;
            width: 33.333%;
            padding: 0 16px;
        }
        .sig-title {
            font-size: 8px;
            font-weight: 700;
            color: #4b5563;
            margin-bottom: 45px;
            text-transform: uppercase;
        }
        .sig-name {
            font-size: 8.5px;
            font-weight: 700;
            color: #111827;
            border-top: 1px solid #9ca3af;
            padding-top: 4px;
            display: inline-block;
            min-width: 140px;
        }
        .sig-role {
            font-size: 7px;
            color: #6b7280;
            margin-top: 1px;
        }

        /* Footer */
        .report-footer {
            margin-top: 20px;
            padding-top: 8px;
            border-top: 1px dashed #cbd5e1;
            display: table;
            width: 100%;
            font-size: 7px;
            color: #64748b;
        }
        .footer-left {
            display: table-cell;
            text-align: left;
        }
        .footer-right {
            display: table-cell;
            text-align: right;
        }

        @media print {
            .toolbar {
                display: none !important;
            }
            body {
                background: #ffffff;
            }
        }
    </style>
</head>
<body>
    @if ($print)
        <div class="toolbar">
            <div class="toolbar-title">
                <span>Tulola Jewelry</span> &bull; <span>Laporan Stok Fisik Terbaru</span>
            </div>
            <div class="toolbar-actions">
                <button type="button" class="btn btn-secondary" onclick="window.close()">Tutup Lembar</button>
                <button type="button" class="btn btn-primary" onclick="window.print()">Cetak Lembar (Print A4)</button>
            </div>
        </div>
    @endif

    @php
        $logoFile = public_path('images/logo/nts-logo-light.png');
        $logoDataUri = file_exists($logoFile) ? 'data:image/png;base64,' . base64_encode(file_get_contents($logoFile)) : null;
    @endphp

    <div style="padding: {{ $print ? '0 16px 20px' : '0' }};">
        <!-- Header -->
        <div class="report-header">
            <div class="brand-col">
                <table style="border-collapse: collapse; border: none; margin: 0; padding: 0;">
                    <tr>
                        @if ($logoDataUri)
                            <td style="border: none; padding: 0 10px 0 0; vertical-align: middle;">
                                <img src="{{ $logoDataUri }}" alt="PT. Napak Tilas Seni" style="height: 40px; width: auto; display: block;" />
                            </td>
                        @endif
                        <td style="border: none; padding: 0; vertical-align: middle;">
                            <h1 class="company-name" style="margin: 0; font-size: 15px;">TULOLA JEWELRY</h1>
                            <div style="font-size: 8px; font-weight: 600; color: #4b5563; text-transform: uppercase;">PT. NAPAK TILAS SENI</div>
                        </td>
                    </tr>
                </table>
                <h2 class="document-title" style="margin-top: 6px;">{{ $report['title'] }}</h2>
                <p class="document-subtitle">{{ $report['subtitle'] }} &bull; Lokasi: <strong>{{ $report['store']['name'] }} ({{ $report['store']['code'] }})</strong></p>
            </div>
            <div class="meta-col">
                <div class="meta-box">
                    <div>Waktu Cetak: <strong>{{ $report['generated_at'] }}</strong></div>
                    <div>Dicetak Oleh: <strong>{{ $report['generated_by'] }}</strong></div>
                    @if ($report['search_query'])
                        <div>Filter Pencarian: <strong>"{{ $report['search_query'] }}"</strong></div>
                    @endif
                </div>
            </div>
        </div>

        <!-- KPI Cards -->
        <div class="kpi-grid">
            <div class="kpi-card">
                <div class="kpi-label">Total SKU Barang</div>
                <div class="kpi-value purple">{{ number_format($report['summary']['total_items'], 0, ',', '.') }} Item</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-label">Total Stok Fisik</div>
                <div class="kpi-value">{{ number_format($report['summary']['total_physical_qty'], 0, ',', '.') }} Unit</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-label">Estimasi Valuasi Aset</div>
                <div class="kpi-value purple">Rp {{ number_format($report['summary']['total_valuation'], 0, ',', '.') }}</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-label">Stok Aman</div>
                <div class="kpi-value success">{{ $report['summary']['count_aman'] }} SKU</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-label">Di Bawah Standar</div>
                <div class="kpi-value warning">{{ $report['summary']['count_menipis'] }} SKU</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-label">Stok Kritis / Habis</div>
                <div class="kpi-value danger">{{ $report['summary']['count_kritis'] + $report['summary']['count_habis'] }} SKU</div>
            </div>
        </div>

        <!-- Stock Table -->
        <table class="stock-table">
            <thead>
                <tr>
                    <th class="text-center" style="width: 25px;">No</th>
                    <th class="text-center" style="width: 80px;">SKU</th>
                    <th class="text-left">Nama Barang</th>
                    <th class="text-left" style="width: 85px;">Kategori</th>
                    <th class="text-center" style="width: 45px;">Satuan</th>
                    <th class="text-right" style="width: 60px;">Stok Fisik</th>
                    <th class="text-right" style="width: 50px;">Min</th>
                    <th class="text-right" style="width: 50px;">Target</th>
                    <th class="text-right" style="width: 75px;">Harga Pokok (HPP)</th>
                    <th class="text-right" style="width: 90px;">Total Valuasi</th>
                    <th class="text-center" style="width: 75px;">Status</th>
                </tr>
            </thead>
            <tbody>
                @forelse ($report['rows'] as $row)
                    <tr>
                        <td class="text-center">{{ $row['no'] }}</td>
                        <td class="text-center font-mono font-bold">{{ $row['sku'] }}</td>
                        <td class="text-left font-bold">{{ $row['name'] }}</td>
                        <td class="text-left">{{ $row['category_name'] }}</td>
                        <td class="text-center">{{ $row['unit_symbol'] }}</td>
                        <td class="text-right font-mono font-bold" style="color: {{ $row['current_quantity'] <= 0 ? '#b91c1c' : '#111827' }};">
                            {{ number_format($row['current_quantity'], 0, ',', '.') }}
                        </td>
                        <td class="text-right font-mono">{{ number_format($row['min_stock'], 0, ',', '.') }}</td>
                        <td class="text-right font-mono">{{ number_format($row['target_stock'], 0, ',', '.') }}</td>
                        <td class="text-right font-mono">
                            Rp {{ number_format($row['unit_cost'], 0, ',', '.') }}
                        </td>
                        <td class="text-right font-mono font-bold">
                            Rp {{ number_format($row['total_value'], 0, ',', '.') }}
                        </td>
                        <td class="text-center">
                            @if ($row['status'] === 'HABIS')
                                <span class="badge badge-danger">Habis</span>
                            @elseif ($row['status'] === 'KRITIS')
                                <span class="badge badge-critical">Kritis</span>
                            @elseif ($row['status'] === 'MENIPIS')
                                <span class="badge badge-warning">Menipis</span>
                            @else
                                <span class="badge badge-success">Aman</span>
                            @endif
                        </td>
                    </tr>
                @empty
                    <tr>
                        <td colspan="11" class="text-center" style="padding: 30px; color: #64748b;">
                            Tidak ada data inventaris yang sesuai dengan filter.
                        </td>
                    </tr>
                @endforelse
            </tbody>
            @if (count($report['rows']) > 0)
                <tfoot>
                    <tr class="total-row">
                        <td colspan="5" class="text-right font-bold">TOTAL KESELURUHAN:</td>
                        <td class="text-right font-mono font-bold">{{ number_format($report['summary']['total_physical_qty'], 0, ',', '.') }}</td>
                        <td colspan="3" class="text-center font-bold">{{ count($report['rows']) }} Item SKU</td>
                        <td class="text-right font-mono font-bold">Rp {{ number_format($report['summary']['total_valuation'], 0, ',', '.') }}</td>
                        <td class="text-center font-bold">100% Tercatat</td>
                    </tr>
                </tfoot>
            @endif
        </table>

        <!-- Signatures -->
        <div class="signatures">
            @foreach ($report['signatures'] as $role => $name)
                <div class="signature-box">
                    <div class="sig-title">{{ $role }}</div>
                    <div class="sig-name">{{ $name }}</div>
                    <div class="sig-role">Tulola Purchasing & Inventory</div>
                </div>
            @endforeach
        </div>

        <!-- Footer Note -->
        <div class="report-footer">
            <div class="footer-left">
                Dokumen resmi digenerate otomatis oleh Sistem Purchasing Tulola pada {{ $report['generated_at'] }}. Data bersifat rahasia.
            </div>
            <div class="footer-right">
                Halaman Cetak &bull; Tulola Purchasing Management
            </div>
        </div>
    </div>

    @if ($print)
        <script>
            window.addEventListener('load', function() {
                setTimeout(function() {
                    window.print();
                }, 350);
            });
        </script>
    @endif
</body>
</html>
