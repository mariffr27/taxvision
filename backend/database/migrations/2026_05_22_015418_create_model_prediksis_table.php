<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('model_prediksis', function (Blueprint $table) {
            $table->id();
            $table->string('nama_model', 50);
            $table->string('parameter', 255)->nullable();
            $table->decimal('akurasi', 5, 2)->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('model_prediksis');
    }
};
