<?php

namespace Database\Seeders;

use App\Actions\Inventory\UpdateStoreStock;
use App\Enums\StockMovementType;
use App\Enums\UserRole;
use App\Models\Item;
use App\Models\Store;
use App\Models\StoreStock;
use App\Models\StoreStockStandard;
use App\Models\User;
use App\Services\ActivityLogger;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class LocalStockSeeder extends Seeder
{
    public function run(): void
    {
        if (! app()->environment(['local', 'testing'])) {
            throw new RuntimeException('Seeder stok manual hanya tersedia untuk local/testing.');
        }

        $central = Store::centralStore();
        $stores = Store::query()->where('is_active', true)->where('code', 'not like', 'DEMO-%')->orderBy('id')->get();
        $items = Item::query()->where('is_active', true)->where('sku', 'not like', 'DEMO-%')->orderBy('sku')->get();
        $actor = User::query()->where('is_active', true)
            ->whereIn('role', [UserRole::SUPER_ADMIN, UserRole::CENTRAL_ADMIN])->orderBy('id')->first();

        if (! $central || $stores->isEmpty() || $items->isEmpty() || ! $actor) {
            throw new RuntimeException('Siapkan toko pusat aktif, item master dan admin aktif sebelum menjalankan seeder stok.');
        }

        $previousUser = Auth::user();

        try {
            Auth::setUser($actor);
            $created = DB::transaction(function () use ($central, $stores, $items, $actor): int {
                $created = 0;
                foreach ($stores as $store) {
                    $isCentral = $store->id === $central->id;
                    foreach ($items as $index => $item) {
                        $standard = StoreStockStandard::query()->firstOrCreate(
                            ['store_id' => $store->id, 'item_id' => $item->id],
                            ['standard_quantity' => $isCentral ? 100 : 20, 'min_quantity' => $isCentral ? 20 : 5],
                        );
                        if ($standard->wasRecentlyCreated) {
                            app(ActivityLogger::class)->log('stock_standard.updated', $standard, newValues: $standard->only(['standard_quantity', 'min_quantity']));
                        }

                        if (StoreStock::query()->where('store_id', $store->id)->where('item_id', $item->id)->exists()) {
                            continue;
                        }

                        $quantity = $isCentral ? 200 : [0, 3, 10, 25][$index % 4];
                        app(UpdateStoreStock::class)->handle(
                            store: $store,
                            item: $item,
                            quantity: (string) $quantity,
                            type: StockMovementType::OPENING_BALANCE,
                            reason: 'LOCAL-STOCK: Saldo awal untuk pengujian manual',
                            notes: 'Data lokal; harga simulasi 1000 bila harga master belum tersedia. Seeder tidak mengisi ulang saldo yang sudah ada.',
                            actor: $actor,
                            unitCost: (string) ($item->cost_price ?? 1000),
                        );
                        $created++;
                    }
                }

                return $created;
            });

            $this->command?->info("Seeder stok lokal selesai: {$created} saldo baru. Saldo/standar yang sudah ada dan data DEMO dipertahankan.");
        } finally {
            if ($previousUser) {
                Auth::setUser($previousUser);
            } else {
                Auth::forgetGuards();
            }
        }
    }
}
