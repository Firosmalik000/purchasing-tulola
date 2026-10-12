<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" @class(['dark' => ($appearance ?? 'system') == 'dark'])>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        {{-- Inline script to detect system dark mode preference and apply it immediately --}}
        <script>
            (function() {
                const appearance = '{{ $appearance ?? "system" }}';

                if (appearance === 'system') {
                    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

                    if (prefersDark) {
                        document.documentElement.classList.add('dark');
                    }
                }
            })();
        </script>

        {{-- Inline style to set the HTML background color based on our theme in app.css --}}
        <style>
            html {
                background-color: #ffffff;
            }

            html.dark {
                background-color: #0b0f19;
            }
        </style>

        <link rel="icon" type="image/svg+xml" href="/favicon.svg?v=20261012">
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png?v=20261012">
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png?v=20261012">
        <link rel="shortcut icon" href="/favicon.ico?v=20261012">
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png?v=20261012">

        @fonts

        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
        <x-inertia::head>
            <title>{{ config('app.name', 'Purchasing Tulola') }}</title>
        </x-inertia::head>
    </head>
    <body class="font-sans antialiased">
        <x-inertia::app />
    </body>
</html>
