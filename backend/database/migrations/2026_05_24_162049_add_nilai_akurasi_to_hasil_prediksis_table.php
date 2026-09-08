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
            $table->decimal('nilai_akurasi', 8, 2)->nullable()->after('metode_akurasi');
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
