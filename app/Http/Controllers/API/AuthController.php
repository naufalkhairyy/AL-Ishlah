<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\DataCalonSantri;
use App\Models\Santri;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $request->validate([
            'username' => 'required|string|unique:users,username',
            'password' => 'required|string|min:6',
        ]);

        $user = User::create([
            'username' => $request->username,
            'password' => Hash::make($request->password),
            'role'     => 'calon_santri',
        ]);

        $token = $user->createToken('API Token')->plainTextToken;

        return response()->json([
            'status'  => true,
            'message' => 'Register berhasil',
            'data'    => [
                'user'  => $user->makeHidden('password'),
                'token' => $token,
            ]
        ], 201);
    }

    public function login(Request $request)
    {
        $request->validate([
            'username' => 'required|string',
            'password' => 'required|string'
        ]);

        $user = User::where('username', $request->username)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'status'  => false,
                'message' => 'Invalid credentials'
            ], 401);
        }

        $token = $user->createToken('API Token')->plainTextToken;

        return response()->json([
            'status'  => true,
            'message' => 'Login berhasil',
            'data'    => [
                'user'  => $user->makeHidden('password'),
                'token' => $token,
            ]
        ]);
    }

    public function adminLogin(Request $request)
    {
        $request->validate([
            'username' => 'required|string',
            'password' => 'required|string',
        ]);

        $user = User::where('username', $request->username)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'status'  => false,
                'message' => 'Invalid credentials',
            ], 401);
        }

        if ($user->role !== 'admin') {
            return response()->json([
                'status'  => false,
                'message' => 'Akun ini bukan admin',
            ], 403);
        }

        $token = $user->createToken('Admin API Token')->plainTextToken;

        return response()->json([
            'status'  => true,
            'message' => 'Login admin berhasil',
            'data'    => [
                'user'  => $user->makeHidden('password'),
                'token' => $token,
            ],
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'status'  => true,
            'message' => 'Logout berhasil'
        ]);
    }

    public function authUser(Request $request)
    {
        $user = $request->user();
        $data = $user->toArray();
        $data['santri_id'] = Santri::where('user_id', $user->user_id)->value('santri_id');
        $data['calon_santri_id'] = DataCalonSantri::where('user_id', $user->user_id)->value('calon_santri_id');

        return response()->json([
            'status' => true,
            'data'   => $data,
        ]);
    }
}
