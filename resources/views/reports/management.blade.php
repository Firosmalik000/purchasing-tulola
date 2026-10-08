<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>{{ $report['title'] }}</title>
    <style>
        @page { margin: 22px; }
        * { box-sizing: border-box; }
        body { margin: 0; color: #171717; font-family: DejaVu Sans, Arial, sans-serif; font-size: 9px; }
        h1 { margin: 0 0 4px; color: #4c1d95; font-size: 19px; }
        .toolbar { margin-bottom: 14px; text-align: right; }
        .toolbar button { border: 0; border-radius: 6px; background: #6d28d9; color: white; cursor: pointer; padding: 8px 14px; }
        .muted { color: #666; }
        .heading { border-bottom: 2px solid #6d28d9; margin-bottom: 14px; padding-bottom: 10px; }
        .context { display: table; width: 100%; margin: 0 0 14px; }
        .context-item { display: inline-block; width: 25%; padding: 3px 12px 3px 0; vertical-align: top; }
        .context-label { color: #666; display: block; font-size: 7px; text-transform: uppercase; }
        .context-value { display: block; font-weight: bold; margin-top: 2px; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #d4d4d8; padding: 5px; vertical-align: top; }
        th { background: #312e81; color: white; font-size: 8px; text-align: left; }
        tbody tr:nth-child(even) { background: #fafafa; }
        .right { text-align: right; }
        .center { text-align: center; }
        .empty { color: #777; padding: 24px; text-align: center; }
        .summary { margin-left: auto; margin-top: 10px; width: 280px; }
        .summary td:first-child { font-weight: bold; }
        .signatures { display: table; margin-top: 35px; table-layout: fixed; width: 100%; }
        .signature { display: table-cell; text-align: center; width: 33.333%; }
        .signature-space { height: 55px; }
        .footer { color: #777; font-size: 7px; margin-top: 16px; }
        @media print { .toolbar { display: none; } body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
    </style>
</head>
<body>
    @if ($print)
        <div class="toolbar"><button type="button" onclick="window.print()">Cetak laporan</button></div>
    @endif
    <div class="heading">
        <h1>{{ $report['title'] }}</h1>
        <div class="muted">{{ $report['description'] }} · {{ $report['period'] }}</div>
    </div>
    @if (count($report['context']))
        <div class="context">
            @foreach ($report['context'] as $label => $value)
                <div class="context-item"><span class="context-label">{{ $label }}</span><span class="context-value">{{ $value }}</span></div>
            @endforeach
        </div>
    @endif
    <table>
        <thead><tr>@foreach ($report['columns'] as $column)<th class="{{ $column['align'] }}">{{ $column['label'] }}</th>@endforeach</tr></thead>
        <tbody>
        @forelse ($report['rows'] as $row)
            <tr>
                @foreach ($report['columns'] as $column)
                    <td class="{{ $column['align'] }}">
                        @if ($column['format'] === 'currency' && is_numeric($row[$column['key']] ?? null))
                            Rp {{ number_format((float) $row[$column['key']], 2, ',', '.') }}
                        @elseif ($column['format'] === 'quantity' && is_numeric($row[$column['key']] ?? null))
                            {{ number_format((float) $row[$column['key']], 3, ',', '.') }}
                        @else
                            {{ $row[$column['key']] ?? '—' }}
                        @endif
                    </td>
                @endforeach
            </tr>
        @empty
            <tr><td class="empty" colspan="{{ max(count($report['columns']), 1) }}">Tidak ada data transaksi untuk filter ini.</td></tr>
        @endforelse
        </tbody>
    </table>
    @if (count($report['summary']))
        <table class="summary">
            @foreach ($report['summary'] as $item)
                <tr><td>{{ $item['label'] }}</td><td class="right">{{ $item['format'] === 'currency' ? 'Rp '.number_format((float) $item['value'], 2, ',', '.') : $item['value'] }}</td></tr>
            @endforeach
        </table>
    @endif
    @if (count($report['signatures']))
        <div class="signatures">
            @foreach ($report['signatures'] as $label => $name)
                <div class="signature"><strong>{{ $label }}</strong><div class="signature-space"></div><span>{{ $name }}</span></div>
            @endforeach
        </div>
    @endif
    <div class="footer">Dibuat otomatis oleh Purchasing Tulola pada {{ $report['generated_at'] }}. Data berasal dari transaksi sistem.</div>
</body>
</html>
