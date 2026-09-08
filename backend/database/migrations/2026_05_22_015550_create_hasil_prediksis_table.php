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
        Schema::create('hasil_prediksis', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_jenis_pajak')->constrained('jenis_pajaks')->onDelete('cascade');
            $table->foreignId('id_model')->constrained('model_prediksis')->onDelete('cascade');
            $table->date('perioda_prediksi');
            $table->decimal('nilai_prediksi', 15, 2);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('hasil_prediksis');
    }
};
