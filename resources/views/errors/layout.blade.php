<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>@yield('title', 'Terjadi Kendala') — Tulola Purchasing</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg: #090d16;
            --card: #111726;
            --border: #1e293b;
            --text: #f8fafc;
            --muted: #94a3b8;
            --primary: #3b82f6;
            --primary-hover: #2563eb;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
            background-color: var(--bg);
            color: var(--text);
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            overflow-x: hidden;
            position: relative;
        }
        .glow-1 {
            position: absolute;
            top: -100px;
            right: 0;
            width: 400px;
            height: 400px;
            background: radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%);
            pointer-events: none;
        }
        .glow-2 {
            position: absolute;
            bottom: 0;
            left: -100px;
            width: 400px;
            height: 400px;
            background: radial-gradient(circle, rgba(14, 165, 233, 0.12) 0%, transparent 70%);
            pointer-events: none;
        }
        header {
            border-bottom: 1px solid var(--border);
            padding: 1rem 1.5rem;
            backdrop-filter: blur(12px);
            background: rgba(17, 23, 38, 0.6);
        }
        .header-content {
            max-width: 1200px;
            margin: 0 auto;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        .brand {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            text-decoration: none;
            color: inherit;
        }
        .brand-logo {
            width: 36px;
            height: 36px;
            border-radius: 10px;
            background: linear-gradient(135deg, #2563eb, #4f46e5, #0f172a);
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 8px rgba(37, 99, 235, 0.3);
            border: 1px solid rgba(59, 130, 246, 0.4);
        }
        .brand-title {
            font-size: 0.95rem;
            font-weight: 700;
            letter-spacing: 0.15em;
        }
        .brand-sub {
            font-size: 0.65rem;
            color: var(--muted);
            letter-spacing: 0.05em;
            text-transform: uppercase;
        }
        main {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem 1rem;
        }
        .card {
            width: 100%;
            max-width: 480px;
            background: var(--card);
            border: 1px solid var(--border);
            border-radius: 1.25rem;
            overflow: hidden;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
            text-align: center;
            position: relative;
        }
        .accent-strip {
            height: 5px;
            width: 100%;
            background: linear-gradient(90deg, #2563eb, #4f46e5, #38bdf8);
        }
        .card-body {
            padding: 2.25rem 2rem;
            position: relative;
        }
        .watermark {
            position: absolute;
            right: 1.5rem;
            top: 1rem;
            font-size: 5.5rem;
            font-weight: 800;
            font-family: monospace;
            opacity: 0.05;
            pointer-events: none;
            line-height: 1;
        }
        .badge {
            display: inline-flex;
            align-items: center;
            gap: 0.35rem;
            padding: 0.25rem 0.75rem;
            border-radius: 9999px;
            font-size: 0.75rem;
            font-weight: 600;
            margin-bottom: 0.75rem;
            border: 1px solid;
        }
        .badge-error { background: rgba(239, 68, 68, 0.1); color: #f87171; border-color: rgba(239, 68, 68, 0.2); }
        .badge-warning { background: rgba(245, 158, 11, 0.1); color: #fbbf24; border-color: rgba(245, 158, 11, 0.2); }
        .badge-info { background: rgba(59, 130, 246, 0.1); color: #60a5fa; border-color: rgba(59, 130, 246, 0.2); }
        h1 {
            font-size: 1.5rem;
            font-weight: 700;
            letter-spacing: -0.02em;
            margin-bottom: 0.5rem;
        }
        p.desc {
            font-size: 0.85rem;
            color: var(--muted);
            line-height: 1.5;
            margin-bottom: 1.25rem;
        }
        .hint-box {
            background: rgba(30, 41, 59, 0.4);
            border: 1px solid var(--border);
            border-radius: 0.75rem;
            padding: 0.85rem 1rem;
            text-align: left;
            font-size: 0.75rem;
            color: var(--muted);
            line-height: 1.4;
            margin-bottom: 1.5rem;
        }
        .actions {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        }
        @media (min-width: 640px) {
            .actions { flex-direction: row; justify-content: center; }
        }
        .btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 0.4rem;
            padding: 0.6rem 1.2rem;
            border-radius: 0.5rem;
            font-size: 0.8rem;
            font-weight: 500;
            text-decoration: none;
            cursor: pointer;
            transition: all 0.15s ease;
            border: 1px solid transparent;
        }
        .btn-primary {
            background: var(--primary);
            color: #fff;
        }
        .btn-primary:hover { background: var(--primary-hover); }
        .btn-outline {
            background: transparent;
            color: var(--text);
            border-color: var(--border);
        }
        .btn-outline:hover { background: rgba(255, 255, 255, 0.05); }
        footer {
            border-top: 1px solid var(--border);
            padding: 1rem;
            text-align: center;
            font-size: 0.75rem;
            color: var(--muted);
        }
    </style>
</head>
<body>
    <div class="glow-1"></div>
    <div class="glow-2"></div>

    <header>
        <div class="header-content">
            <a href="/" class="brand">
                <div class="brand-logo">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M6 3h12l4 7-10 11L2 10l4-7z" fill="currentColor" fill-opacity="0.2" />
                        <path d="M11 3 8 10l4 11 4-11-3-7" />
                        <path d="M2 10h20" />
                    </svg>
                </div>
                <div>
                    <div class="brand-title">TULOLA</div>
                    <div class="brand-sub">Purchasing Portal</div>
                </div>
            </a>
            <div>
                <a href="/" class="btn btn-outline" style="padding: 0.4rem 0.8rem; font-size: 0.75rem;">Beranda</a>
            </div>
        </div>
    </header>

    <main>
        <div class="card">
            <div class="accent-strip"></div>
            <div class="card-body">
                <div class="watermark">@yield('code')</div>
                @yield('content')
            </div>
        </div>
    </main>

    <footer>
        &copy; {{ date('Y') }} PT Tulola Desain Perhiasan. Sistem Pengadaan Resmi.
    </footer>
</body>
</html>
