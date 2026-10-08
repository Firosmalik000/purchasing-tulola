<?php

use App\Http\Controllers\Central\InventoryController;
use App\Http\Controllers\Central\ItemCategoryController;
use App\Http\Controllers\Central\ItemController;
use App\Http\Controllers\Central\ManagementReportController;
use App\Http\Controllers\Central\PurchaseOrderController;
use App\Http\Controllers\Central\PurchasePlanningController;
use App\Http\Controllers\Central\PurchaseRequestController as CentralPurchaseRequestController;
use App\Http\Controllers\Central\StoreController;
use App\Http\Controllers\Central\StoreUserController;
use App\Http\Controllers\Central\SupplierController;
use App\Http\Controllers\Central\UnitController;
use App\Http\Controllers\Central\UserController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\Store\IncomingOrderController;
use App\Http\Controllers\Store\InventoryController as StoreInventoryController;
use App\Http\Controllers\Store\PurchaseRequestController as StorePurchaseRequestController;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Auth\InvitationController;

Route::inertia('/', 'welcome')->name('home');

Route::get('invitation/{token}', [InvitationController::class, 'show'])->name('invitation.accept');
Route::post('invitation/{token}', [InvitationController::class, 'update'])->name('invitation.update');

Route::middleware(['auth', 'verified', 'active'])->group(function () {
    Route::get('dashboard', DashboardController::class)->name('dashboard');

    Route::middleware('central')->prefix('central')->name('central.')->group(function () {
        Route::inertia('dashboard', 'central/dashboard')->name('dashboard');
        Route::resource('stores', StoreController::class)->only(['index', 'store', 'update']);
        Route::resource('users', UserController::class)->only(['index', 'store', 'update']);
        Route::post('stores/{store}/users', [StoreUserController::class, 'store'])->name('stores.users.store');
        Route::delete('stores/{store}/users/{user}', [StoreUserController::class, 'destroy'])->name('stores.users.destroy');
        Route::resource('items', ItemController::class)->only(['index', 'store', 'update']);
        Route::resource('item-categories', ItemCategoryController::class)->only(['store', 'update']);
        Route::resource('units', UnitController::class)->only(['store', 'update']);
        Route::resource('suppliers', SupplierController::class)->only(['index', 'store', 'update']);
        Route::get('inventory', [InventoryController::class, 'index'])->name('inventory.index');
        Route::put('inventory/stock', [InventoryController::class, 'updateStock'])->name('inventory.stock.update');
        Route::put('inventory/standard', [InventoryController::class, 'updateStandard'])->name('inventory.standard.update');
        Route::post('inventory/receipts/{receipt}/apply', [InventoryController::class, 'applyReceipt'])->name('inventory.receipts.apply');
        Route::get('requests', [CentralPurchaseRequestController::class, 'index'])->name('requests.index');
        Route::get('requests/{purchase_request}', [CentralPurchaseRequestController::class, 'show'])->name('requests.show');
        Route::post('requests/{purchase_request}/process', [CentralPurchaseRequestController::class, 'process'])->name('requests.process');
        Route::post('requests/{purchase_request}/reject', [CentralPurchaseRequestController::class, 'reject'])->name('requests.reject');
        Route::get('purchase-planning', PurchasePlanningController::class)->name('planning.index');
        Route::resource('orders', PurchaseOrderController::class)
            ->parameters(['orders' => 'purchase_order'])
            ->only(['index', 'store', 'show', 'update']);
        Route::post('orders/{purchase_order}/place', [PurchaseOrderController::class, 'place'])->name('orders.place');
        Route::post('orders/{purchase_order}/wait-for-receipt', [PurchaseOrderController::class, 'waitForReceipt'])->name('orders.wait-for-receipt');
        Route::post('orders/{purchase_order}/cancel', [PurchaseOrderController::class, 'cancel'])->name('orders.cancel');
        Route::get('reports', [ManagementReportController::class, 'index'])->name('reports.index');
        Route::get('reports/print', [ManagementReportController::class, 'print'])->name('reports.print');
        Route::get('reports/pdf', [ManagementReportController::class, 'pdf'])->name('reports.pdf');
        Route::get('reports/excel', [ManagementReportController::class, 'excel'])->name('reports.excel');
    });

    Route::middleware('store')->prefix('store')->name('store.')->group(function () {
        Route::inertia('dashboard', 'store/dashboard')->name('dashboard');
        Route::get('inventory', [StoreInventoryController::class, 'index'])->name('inventory.index');
        Route::get('incoming', [IncomingOrderController::class, 'index'])->name('incoming.index');
        Route::get('incoming/{purchase_order}', [IncomingOrderController::class, 'show'])->name('incoming.show');
        Route::post('incoming/{purchase_order}/receipts', [IncomingOrderController::class, 'store'])->name('incoming.receipts.store');
        Route::resource('requests', StorePurchaseRequestController::class)
            ->parameters(['requests' => 'purchase_request'])
            ->only(['index', 'create', 'store', 'show', 'edit', 'update']);
        Route::post('requests/{purchase_request}/submit', [StorePurchaseRequestController::class, 'submit'])->name('requests.submit');
    });
});

require __DIR__.'/settings.php';
