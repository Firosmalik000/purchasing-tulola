<?php

namespace App\Support;

use Illuminate\Http\Request;

final class Paging
{
    public const DEFAULT_PER_PAGE = 15;

    public const ALLOWED_PER_PAGE = [15, 25, 50, 100];

    /**
     * Resolve per_page value from request, defaulting to 15.
     * Allowed values: 15, 25, 50, 100.
     */
    public static function perPage(Request $request, int $default = self::DEFAULT_PER_PAGE): int
    {
        $perPage = (int) $request->input('per_page', $default);

        if (! in_array($perPage, self::ALLOWED_PER_PAGE, true)) {
            return $default;
        }

        return $perPage;
    }
}
