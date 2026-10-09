<?php

namespace Tests\Feature;

use Tests\TestCase;

class ErrorPagesTest extends TestCase
{
    public function test_can_render_various_error_pages(): void
    {
        foreach ([401, 403, 404, 419, 500, 503] as $code) {
            $response = $this->get("/errors/{$code}");
            $response->assertOk();
            $response->assertInertia(fn ($page) => $page
                ->component('error')
                ->where('status', $code)
            );
        }
    }
}
