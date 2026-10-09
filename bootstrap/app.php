<?php

use App\Http\Middleware\EnsureActiveUser;
use App\Http\Middleware\EnsureCentralUser;
use App\Http\Middleware\EnsureStoreUser;
use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);

        $middleware->web(append: [
            HandleAppearance::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);

        $middleware->alias([
            'active' => EnsureActiveUser::class,
            'central' => EnsureCentralUser::class,
            'store' => EnsureStoreUser::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );

        $exceptions->respond(function (Response $response, Throwable $exception, Request $request) {
            $status = $response->getStatusCode();

            if (! app()->environment(['local', 'testing']) && in_array($status, [500, 503, 404, 403, 401])) {
                return Inertia::render('error', [
                    'status' => $status,
                ])->toResponse($request)->setStatusCode($status);
            }

            if ($status === 419) {
                return back()->with([
                    'error' => 'Sesi keamanan Anda telah berakhir. Silakan coba kembali.',
                ]);
            }

            return $response;
        });
    })->create();
