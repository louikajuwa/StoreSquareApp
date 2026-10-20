<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropUnique(['paypal_order_id']);
            $table->renameColumn('paypal_order_id', 'square_payment_id');
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->string('square_payment_id')->nullable()->change();
            $table->unique('square_payment_id');
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropUnique(['square_payment_id']);
            $table->renameColumn('square_payment_id', 'paypal_order_id');
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->string('paypal_order_id')->nullable(false)->change();
            $table->unique('paypal_order_id');
        });
    }
};
