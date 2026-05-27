<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Controllers
use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\UserController;
use App\Http\Controllers\API\SantriController;
use App\Http\Controllers\API\DataCalonSantriController;
use App\Http\Controllers\API\DataAyahCalonSantriController;
use App\Http\Controllers\API\DataIbuCalonSantriController;
use App\Http\Controllers\API\DataWaliCalonSantriController;
use App\Http\Controllers\API\DataSekolahAsalCalonSantriController;
use App\Http\Controllers\API\UjianController;
use App\Http\Controllers\API\SoalController;
use App\Http\Controllers\API\JadwalUjianController;
use App\Http\Controllers\API\JawabanController;

    Route::get('/test', function () {
        return response()->json([
            'status'  => true,
            'message' => 'API MASUK'
        ]);
    });

    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login'])->name('login');
    Route::post('/admin/login', [AuthController::class, 'adminLogin']);


    Route::middleware(['auth:sanctum', 'throttle:100,1'])->group(function () {

    // AUTH
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/auth-user', [AuthController::class, 'authUser']);
    // CALON SANTRI
    Route::post('/calon-santri', [DataCalonSantriController::class, 'store']);
    Route::post('/calon-santri/dokumen', [DataCalonSantriController::class, 'uploadDokumen']);
    Route::get('/calon-santri', [DataCalonSantriController::class, 'show']);

    Route::post('/ayah-calon-santri', [DataAyahCalonSantriController::class, 'store']);
    Route::get('/ayah-calon-santri', [DataAyahCalonSantriController::class, 'show']);

    Route::post('/ibu-calon-santri', [DataIbuCalonSantriController::class, 'store']);
    Route::get('/ibu-calon-santri', [DataIbuCalonSantriController::class, 'show']);

    Route::post('/wali-calon-santri', [DataWaliCalonSantriController::class, 'store']);
    Route::get('/wali-calon-santri', [DataWaliCalonSantriController::class, 'show']);

    Route::post('/sekolah-asal-calon-santri', [DataSekolahAsalCalonSantriController::class, 'store']);
    Route::get('/sekolah-asal-calon-santri', [DataSekolahAsalCalonSantriController::class, 'show']);

    Route::middleware('role:admin')->group(function () {
        // ====================
        // SANTRI
        // ====================
        Route::get('/santri', [SantriController::class, 'index']);
        Route::get('/santri/{id}', [SantriController::class, 'show']);
        Route::post('/santri', [SantriController::class, 'store']);
        Route::put('/santri/{id}', [SantriController::class, 'update']);
        Route::delete('/santri/{id}', [SantriController::class, 'destroy']);

        // ====================
        // USERS
        // ====================
        Route::get('/users', [UserController::class, 'index']);
        Route::get('/users/{id}', [UserController::class, 'show']);
        Route::post('/users', [UserController::class, 'store']);
        Route::put('/users/{id}', [UserController::class, 'update']);
        Route::delete('/users/{id}', [UserController::class, 'destroy']);
    });

    Route::get('/ujian/{ujian_id}/soal', [SoalController::class, 'index']);
    Route::get('/ujian/{ujian_id}/santri/{santri_id}/soal-jawaban', [SoalController::class, 'indexWithJawaban']);
    Route::get('/soal/{id}', [SoalController::class, 'show']);

    Route::get('/ujian', [UjianController::class, 'index']);
    Route::get('/ujian/{id}', [UjianController::class, 'show']);

    Route::middleware('role:admin')->group(function () {
        Route::post('/ujian/{ujian_id}/soal/import', [SoalController::class, 'import']);
        Route::post('/soal', [SoalController::class, 'store']);
        Route::put('/soal/{id}', [SoalController::class, 'update']);
        Route::delete('/soal/{id}', [SoalController::class, 'destroy']);

        Route::post('/ujian', [UjianController::class, 'store']);
        Route::put('/ujian/{id}', [UjianController::class, 'update']);
        Route::delete('/ujian/{id}', [UjianController::class, 'destroy']);

        Route::get('/jadwal-ujian', [JadwalUjianController::class, 'index']);
        Route::get('/jadwal-ujian/{id}', [JadwalUjianController::class, 'show']);
        Route::post('/jadwal-ujian', [JadwalUjianController::class, 'store']);
        Route::put('/jadwal-ujian/{id}', [JadwalUjianController::class, 'update']);
        Route::delete('/jadwal-ujian/{id}', [JadwalUjianController::class, 'destroy']);
    });

    Route::get('/jawaban', [JawabanController::class, 'index']);
    Route::post('/jawaban/bulk', [JawabanController::class, 'bulkStore']);
    Route::get('/jawaban/{id}', [JawabanController::class, 'show']);
    Route::post('/jawaban', [JawabanController::class, 'store']);
    Route::put('/jawaban/{id}', [JawabanController::class, 'update']);
    Route::delete('/jawaban/{id}', [JawabanController::class, 'destroy']);
});
