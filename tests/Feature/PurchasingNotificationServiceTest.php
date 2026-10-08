<?php

namespace Tests\Feature;

use App\Enums\PurchaseOrderStatus;
use App\Enums\PurchaseRequestItemType;
use App\Enums\UserRole;
use App\Mail\GoodsReceiptConfirmedMail;
use App\Mail\PurchaseOrderPlacedMail;
use App\Mail\PurchaseRequestSubmittedMail;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use App\Models\PurchaseOrderRequestItem;
use App\Models\PurchaseRequest;
use App\Models\PurchaseRequestItem;
use App\Models\Receipt;
use App\Models\Store;
use App\Models\Supplier;
use App\Models\Unit;
use App\Models\User;
use App\Services\PurchasingNotificationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class PurchasingNotificationServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_pr_submitted_notification_sends_email_to_central_admins(): void
    {
        Mail::fake();

        $centralAdmin = User::factory()->centralAdmin()->create(['email' => 'central@tulolajewelry.com']);
        $store = Store::factory()->create();
        $pic = User::factory()->storePic()->create();
        $store->users()->attach($pic, ['is_pic' => true, 'is_active' => true]);

        $unit = Unit::factory()->create(['symbol' => 'PCS']);
        $pr = PurchaseRequest::factory()->create([
            'store_id' => $store->id,
            'requested_by' => $pic->id,
        ]);
        PurchaseRequestItem::factory()->create([
            'purchase_request_id' => $pr->id,
            'type' => PurchaseRequestItemType::NON_STOCK,
            'name' => 'Kotak Cincin Beludru',
            'unit_id' => $unit->id,
            'requested_quantity' => '10.000',
        ]);

        $service = app(PurchasingNotificationService::class);
        $service->sendPurchaseRequestSubmitted($pr);

        Mail::assertSent(PurchaseRequestSubmittedMail::class, function ($mail) {
            return $mail->hasTo('central@tulolajewelry.com');
        });
    }

    public function test_po_placed_notification_sends_email_to_store_pics(): void
    {
        Mail::fake();

        $store = Store::factory()->create();
        $pic = User::factory()->storePic()->create(['email' => 'storepic@tulolajewelry.com']);
        $store->users()->attach($pic, ['is_pic' => true, 'is_active' => true]);

        $unit = Unit::factory()->create(['symbol' => 'PCS']);
        $supplier = Supplier::factory()->create();
        $centralAdmin = User::factory()->centralAdmin()->create();

        $pr = PurchaseRequest::factory()->create(['store_id' => $store->id, 'requested_by' => $pic->id]);
        $prItem = PurchaseRequestItem::factory()->create([
            'purchase_request_id' => $pr->id,
            'type' => PurchaseRequestItemType::NON_STOCK,
            'name' => 'Pouch Beludru Luxury',
            'unit_id' => $unit->id,
            'requested_quantity' => '50.000',
        ]);

        $po = PurchaseOrder::factory()->create([
            'supplier_id' => $supplier->id,
            'created_by' => $centralAdmin->id,
            'status' => PurchaseOrderStatus::ORDERED,
        ]);

        $poItem = PurchaseOrderItem::factory()->create([
            'purchase_order_id' => $po->id,
            'item_type' => PurchaseRequestItemType::NON_STOCK,
            'name' => 'Pouch Beludru Luxury',
            'unit_id' => $unit->id,
            'unit_price' => '15000.00',
            'total' => '750000.00',
        ]);

        PurchaseOrderRequestItem::create([
            'purchase_order_item_id' => $poItem->id,
            'purchase_request_item_id' => $prItem->id,
            'allocated_quantity' => '50.000',
        ]);

        $service = app(PurchasingNotificationService::class);
        $service->sendPurchaseOrderPlaced($po);

        Mail::assertSent(PurchaseOrderPlacedMail::class, function ($mail) {
            return $mail->hasTo('storepic@tulolajewelry.com');
        });
    }

    public function test_goods_receipt_confirmed_notification_sends_email_to_central_admins(): void
    {
        Mail::fake();

        $centralAdmin = User::factory()->centralAdmin()->create(['email' => 'central@tulolajewelry.com']);
        $store = Store::factory()->create();
        $pic = User::factory()->storePic()->create();
        $supplier = Supplier::factory()->create();

        $po = PurchaseOrder::factory()->create([
            'supplier_id' => $supplier->id,
            'created_by' => $centralAdmin->id,
        ]);

        $receipt = Receipt::factory()->create([
            'purchase_order_id' => $po->id,
            'store_id' => $store->id,
            'received_by' => $pic->id,
        ]);

        $service = app(PurchasingNotificationService::class);
        $service->sendGoodsReceiptConfirmed($receipt);

        Mail::assertSent(GoodsReceiptConfirmedMail::class, function ($mail) {
            return $mail->hasTo('central@tulolajewelry.com');
        });
    }
}
