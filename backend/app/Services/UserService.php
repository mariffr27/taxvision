<?php

namespace App\Services;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserService
{
    public function getAll()
    {
        return User::latest()->get();
    }

    public function getById($id)
    {
        return User::findOrFail($id);
    }

    public function store(array $data)
    {
        $data['password'] = Hash::make($data['password']);
        return User::create($data);
    }

    public function update($id, array $data)
    {
        $user = User::findOrFail($id);
        if(!empty($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']);
        }
        $user->update($data);
        return $user;
    }

    public function delete($id)
    {
        $user = User::findOrFail($id);
        return $user->delete();
    }
}
