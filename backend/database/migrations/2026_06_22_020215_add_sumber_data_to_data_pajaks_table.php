<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('data_pajaks', function (Blueprint $table) {
            $table->enum('sumber_data', ['aktual', 'prediksi'])->default('aktual');
            $table->foreignId('hasil_prediksi_id')->nullable()->constrained('hasil_prediksis')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('data_pajaks', function (Blueprint $table) {
            //
        });
    }
};
