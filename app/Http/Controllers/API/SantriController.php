<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Santri;

class SantriController extends Controller
{
    public function mine(Request $request)
    {
        $santri = Santri::where('user_id', $request->user()->user_id)->first();

        if (!$santri) {
            return response()->json([
                'status' => false,
                'message' => 'Data santri untuk user login belum ditemukan',
                'data' => null,
            ], 404);
        }

        return response()->json([
            'status' => true,
            'data' => $santri,
        ]);
    }

    // GET all santri
    public function index()
    {
        $santri = Santri::all();
        return response()->json([
            'status' => true,
            'data' => $santri
        ]);
    }

    // GET santri by ID
   public function show($id)
{
    $santri = Santri::where('santri_id', $id)->first();

    if (!$santri) {
        return response()->json(['status' => false], 404);
    }

    return response()->json(['status' => true, 'data' => $santri]);
}



    // POST create santri
 public function store(Request $request)
{
    $request->validate([
        'user_id' => 'sometimes|exists:users,user_id',
        'nama_lengkap' => 'required|string',
        'tempat_lahir' => 'required|string',
        'tanggal_lahir' => 'required|date',
        'jenis_kelamin' => 'required|string',
        'alamat' => 'required|string',
        'no_hp' => 'required|string',
        'kelas' => 'required|string'
    ]);

    $santri = Santri::create([
        'user_id' => $request->input('user_id', auth()->user()->user_id),
        'nama_lengkap' => $request->nama_lengkap,
        'tempat_lahir' => $request->tempat_lahir,
        'tanggal_lahir' => $request->tanggal_lahir,
        'jenis_kelamin' => $request->jenis_kelamin,
        'alamat' => $request->alamat,
        'no_hp' => $request->no_hp,
        'kelas' => $request->kelas,
    ]);

    return response()->json([
        'status' => true,
        'message' => 'Santri berhasil ditambahkan',
        'data' => $santri
    ], 201);
}

    // PUT update santri
  public function update(Request $request, $id)
{
    $santri = Santri::find($id);

    if (!$santri) {
        return response()->json([
            'status' => false,
            'message' => 'Santri tidak ditemukan'
        ], 404);
    }

    $request->validate([
        'user_id' => 'required|exists:users,user_id',
        'nama_lengkap' => 'required',
        'tempat_lahir' => 'required',
        'tanggal_lahir' => 'required|date',
        'jenis_kelamin' => 'required',
        'alamat' => 'required',
        'no_hp' => 'required',
        'kelas' => 'required'
    ]);

    $santri->update($request->all());

    return response()->json([
        'status' => true,
        'message' => 'Santri berhasil diupdate',
        'data' => $santri
    ]);
}



    // DELETE santri
    public function destroy($id)
    {
        $santri = Santri::find($id);

        if (!$santri) {
            return response()->json([
                'status' => false,
                'message' => 'Santri not found'
            ], 404);
        }

        $santri->delete();

        return response()->json([
            'status' => true,
            'message' => 'Santri deleted successfully'
        ]);
    }
}
