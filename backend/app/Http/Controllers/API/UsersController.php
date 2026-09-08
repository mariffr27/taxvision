<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Traits\ApiResponse;
use App\Services\UserService;
use App\Http\Requests\User\StoreUserRequest;
use App\Http\Requests\User\UpdatedUserRequest;
class UsersController extends Controller
{

    use ApiResponse;
    protected $userService;

    public function __construct(UserService $userService)
    {
        $this->userService = $userService;
    }

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $users = $this->userService->getAll();
        return $this->successResponse
            (
                $users, 'Users retrieved successfully'
            );
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreUserRequest $request)
    {
        $user = $this->userService->store(
            $request->validated()
        );

        return $this->successResponse(
            $user, 'User created successfully', 201
        );
    }

    /**
     * Display the specified resource.
     */
    public function show($id)
    {
        $user = $this->userService->getById($id);

        return $this->successResponse(
            $user, 'User retrieved successfully'
        );
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdatedUserRequest $request, $id)
    {
        $user = $this->userService->update(
            $id, $request->validated()
        );

        return $this->successResponse(
            $user, 'User updated successfully'
        );
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        $this->userService->delete($id);

        return $this->successResponse(
            null, 'User deleted successfully'
        );
    }
}
