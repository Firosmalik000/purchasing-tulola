<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $subject ?? 'Tulola Jewelry Purchasing' }}</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background-color: #f7f6f2;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            color: #262626;
            -webkit-font-smoothing: antialiased;
        }
        .wrapper {
            width: 100%;
            background-color: #f7f6f2;
            padding: 40px 16px;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            border: 1px solid #e8e4db;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
        }
        .header {
            background-color: #1a1918;
            padding: 32px 36px;
            text-align: center;
            border-bottom: 3px solid #c8a355;
        }
        .brand-title {
            color: #fdfbf7;
            font-size: 22px;
            font-weight: 700;
            letter-spacing: 0.18em;
            text-transform: uppercase;
            margin: 0;
        }
        .brand-subtitle {
            color: #c8a355;
            font-size: 11px;
            letter-spacing: 0.22em;
            text-transform: uppercase;
            margin-top: 6px;
            font-weight: 500;
        }
        .content {
            padding: 36px;
            line-height: 1.65;
            font-size: 14px;
            color: #3f3f46;
        }
        .greeting {
            font-size: 16px;
            font-weight: 600;
            color: #18181b;
            margin-bottom: 16px;
        }
        .card-box {
            background-color: #fcfbf9;
            border: 1px solid #eee9df;
            border-radius: 8px;
            padding: 20px;
            margin: 24px 0;
        }
        .card-row {
            display: flex;
            justify-content: space-between;
            padding: 6px 0;
            font-size: 13px;
            border-bottom: 1px dashed #e8e4db;
        }
        .card-row:last-child {
            border-bottom: none;
        }
        .card-label {
            color: #71717a;
            font-weight: 500;
        }
        .card-value {
            color: #18181b;
            font-weight: 600;
            text-align: right;
        }
        .btn-container {
            text-align: center;
            margin: 32px 0 24px;
        }
        .btn {
            display: inline-block;
            background-color: #1a1918;
            color: #fdfbf7 !important;
            text-decoration: none;
            padding: 13px 32px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 14px;
            letter-spacing: 0.04em;
            border: 1px solid #c8a355;
        }
        .btn-gold {
            background-color: #c8a355;
            color: #ffffff !important;
            border: none;
        }
        .table-data {
            width: 100%;
            border-collapse: collapse;
            margin: 18px 0;
            font-size: 13px;
        }
        .table-data th {
            background-color: #f4efe6;
            color: #3f3f46;
            text-align: left;
            padding: 10px 12px;
            font-weight: 600;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            border-bottom: 1px solid #e0d9cc;
        }
        .table-data td {
            padding: 10px 12px;
            border-bottom: 1px solid #f0eee8;
            color: #27272a;
        }
        .footer {
            background-color: #faf9f6;
            padding: 24px 36px;
            text-align: center;
            border-top: 1px solid #ece8e0;
            font-size: 12px;
            color: #a1a1aa;
            line-height: 1.6;
        }
        .footer a {
            color: #c8a355;
            text-decoration: none;
        }
        .badge {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 9999px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        .badge-gold {
            background-color: #fbf5e6;
            color: #946e1e;
            border: 1px solid #ebdcb7;
        }
        .badge-green {
            background-color: #ecfdf5;
            color: #047857;
            border: 1px solid #a7f3d0;
        }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="container">
            <div class="header">
                <h1 class="brand-title">T U L O L A</h1>
                <div class="brand-subtitle">Purchasing & Supply Chain Portal</div>
            </div>
            <div class="content">
                @yield('content')
            </div>
            <div class="footer">
                <p style="margin: 0 0 6px 0;">Email ini dikirim otomatis oleh Sistem Purchasing <strong>Tulola Jewelry</strong>.</p>
                <p style="margin: 0;">Harap tidak membalas email ini secara langsung. Butuh bantuan? Hubungi tim purchasing pusat.</p>
            </div>
        </div>
    </div>
</body>
</html>
