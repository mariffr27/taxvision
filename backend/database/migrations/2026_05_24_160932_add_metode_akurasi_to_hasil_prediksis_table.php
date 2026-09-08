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
        Schema::table('hasil_prediksis', function (Blueprint $table) {
            $table->string('metode_akurasi', 20)->nullable()->after('nilai_prediksi');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('hasil_prediksis', function (Blueprint $table) {
            //
        });
    }
};
