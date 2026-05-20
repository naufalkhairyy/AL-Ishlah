<?php

namespace App\Http\Middleware;

use Illuminate\Auth\Middleware\Authenticate as Middleware;

class Authenticate extends Middleware
{
    protected function redirectTo($request)
    {
        // Kalau request dari API (expectsJson), jangan redirect
        if ($request->expectsJson()) {
            // Return null supaya Laravel tidak redirect, cukup 401
            return null;
        }

        // Kalau web, redirect ke route login jika ada
        // return route('login'); // bisa komentar atau hapus
    }
}
