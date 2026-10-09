<?php

namespace App\Actions\Requests;

use App\Enums\PurchaseRequestItemType;
use App\Enums\PurchaseRequestStatus;
use App\Models\Item;
use App\Models\PurchaseRequest;
use App\Models\Store;
use App\Models\User;
use App\Services\ActivityLogger;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Throwable;

class SavePurchaseRequestDraft
{
    public function __construct(private GeneratePurchaseRequestNumber $numbers, private ActivityLogger $logger) {}

    /** @param array<string, mixed> $data */
    public function handle(Store $store, User $actor, array $data, ?PurchaseRequest $request = null): PurchaseRequest
    {
        $newPaths = [];
        foreach ($data['special_items'] ?? [] as $index => $line) {
            if (($line['sample_image'] ?? null) instanceof UploadedFile) {
                $path = $line['sample_image']->store('purchase-request-samples', 'local');
                if (! $path) {
                    throw ValidationException::withMessages([
                        "special_items.{$index}.sample_image" => 'Foto sampel gagal disimpan. Silakan coba kembali.',
                    ]);
                }
                $data['special_items'][$index]['stored_sample_image_path'] = $path;
                $newPaths[] = $path;
            }
        }

        $stalePaths = [];

        try {
            $saved = DB::transaction(function () use ($store, $actor, $data, $request, &$stalePaths): PurchaseRequest {
                $creating = $request === null;
                $request ??= new PurchaseRequest([
                    'number' => $this->numbers->handle($store), 'store_id' => $store->id,
                    'requested_by' => $actor->id, 'status' => PurchaseRequestStatus::DRAFT,
                ]);
                $request->fill(['required_date' => $data['required_date'] ?? null, 'notes' => $data['notes'] ?? null])->save();

                $existingSpecialItems = $request->items()->where('type', PurchaseRequestItemType::SPECIAL)->get()->keyBy('id');
                $existingPaths = $existingSpecialItems->pluck('sample_image_path')->filter()->all();
                $usedPaths = [];

                $request->items()->delete();

                foreach ($data['stock_items'] ?? [] as $line) {
                    $item = Item::query()->findOrFail((int) $line['item_id']);
                    $request->items()->create(['type' => PurchaseRequestItemType::STOCK, 'item_id' => $item->id, 'unit_id' => $item->unit_id, 'requested_quantity' => $line['requested_quantity']]);
                }
                foreach ($data['special_items'] ?? [] as $line) {
                    $existingItem = isset($line['existing_item_id'])
                        ? $existingSpecialItems->get((int) $line['existing_item_id'])
                        : null;
                    if (isset($line['existing_item_id']) && ! $existingItem) {
                        throw ValidationException::withMessages(['special_items' => 'Item khusus pada draft tidak valid. Muat ulang halaman lalu coba kembali.']);
                    }

                    $sampleImagePath = $line['stored_sample_image_path'] ?? $existingItem?->sample_image_path;
                    if ($sampleImagePath) {
                        $usedPaths[] = $sampleImagePath;
                    }

                    $request->items()->create([
                        'type' => PurchaseRequestItemType::SPECIAL,
                        'name' => $line['name'],
                        'description' => $line['description'] ?? null,
                        'sample_image_path' => $sampleImagePath,
                        'unit_id' => $line['unit_id'],
                        'requested_quantity' => $line['requested_quantity'],
                        'required_date' => $line['required_date'] ?? null,
                        'reason' => $line['reason'],
                    ]);
                }

                $stalePaths = array_values(array_diff($existingPaths, $usedPaths));

                if ($creating) {
                    $request->statusHistories()->create(['from_status' => null, 'to_status' => PurchaseRequestStatus::DRAFT, 'changed_by' => $actor->id]);
                }
                $this->logger->log($creating ? 'purchase_request.draft_created' : 'purchase_request.draft_updated', $request, newValues: ['number' => $request->number, 'item_count' => $request->items()->count()]);

                return $request->load('items');
            }, 3);
        } catch (Throwable $exception) {
            Storage::disk('local')->delete($newPaths);

            throw $exception;
        }

        Storage::disk('local')->delete($stalePaths);

        return $saved;
    }
}
