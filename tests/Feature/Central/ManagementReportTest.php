<?php

namespace Tests\Feature\Central;

use App\Enums\ManagementReportType;
use App\Enums\PurchaseOrderStatus;
use App\Enums\PurchaseRequestItemStatus;
use App\Enums\PurchaseRequestItemType;
use App\Enums\PurchaseRequestStatus;
use App\Enums\StockMovementType;
use App\Enums\UserRole;
use App\Models\Item;
use App\Models\ItemCategory;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use App\Models\PurchaseRequest;
use App\Models\PurchaseRequestItem;
use App\Models\Receipt;
use App\Models\StockMovement;
use App\Models\Store;
use App\Models\StoreStock;
use App\Models\StoreStockStandard;
use App\Models\Supplier;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ManagementReportTest extends TestCase
{
    use RefreshDatabase;

    public function test_management_report_screen_uses_actual_transactions_and_derived_store_distribution(): void
    {
        [$user, $order] = $this->reportScenario();

        $this->actingAs($user)->get(route('central.reports.index', [
            'report' => ManagementReportType::PURCHASING_REQUEST->value,
            'order_id' => $order->id,
            'date_from' => now()->startOfMonth()->toDateString(),
            'date_to' => now()->toDateString(),
        ]))->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('central/reports/index')
            ->has('reportTypes', count(ManagementReportType::cases()))
            ->where('report.context.Order No', $order->number)
            ->where('report.rows.0.stock', 'PP 3.000, PIM 4.000')
            ->where('report.rows.0.standard_stock', 'PP 5.000, PIM 6.000')
            ->where('report.rows.0.remarks', 'PP 2.000, PIM 4.000')
            ->where('report.rows.1.stock', '-')
            ->where('report.rows.1.standard_stock', '-')
            ->where('report.summary.0.value', '850.00'));
    }

    public function test_every_phase_ten_report_type_renders(): void
    {
        [$user] = $this->reportScenario();

        foreach (ManagementReportType::cases() as $type) {
            $this->actingAs($user)->get(route('central.reports.index', [
                'report' => $type->value,
                'date_from' => now()->startOfMonth()->toDateString(),
                'date_to' => now()->toDateString(),
            ]))->assertOk()->assertInertia(fn (Assert $page) => $page
                ->where('report.type', $type->value)
                ->has('report.columns'));
        }
    }

    public function test_report_filters_validate_dates_and_limit_store_data(): void
    {
        [$user, , $primaryStore] = $this->reportScenario();

        $this->actingAs($user)->get(route('central.reports.index', [
            'report' => ManagementReportType::STOCK_BY_STORE->value,
            'store_id' => $primaryStore->id,
        ]))->assertOk()->assertInertia(fn (Assert $page) => $page
            ->has('report.rows', 1)
            ->where('report.rows.0.store', 'PP - Plaza Permata'));

        $this->actingAs($user)->get(route('central.reports.index', [
            'date_from' => '2026-10-10', 'date_to' => '2026-10-01',
        ]))->assertSessionHasErrors('date_to');
    }

    public function test_print_pdf_and_excel_exports_share_the_report_contract(): void
    {
        [$user, $order] = $this->reportScenario();
        $parameters = [
            'report' => ManagementReportType::PURCHASING_REQUEST->value,
            'order_id' => $order->id,
            'date_from' => now()->startOfMonth()->toDateString(),
            'date_to' => now()->toDateString(),
        ];

        $this->actingAs($user)->get(route('central.reports.print', $parameters))
            ->assertOk()->assertSee('Purchasing Request')->assertSee('PP 2.000, PIM 4.000');

        $pdf = $this->actingAs($user)->get(route('central.reports.pdf', $parameters));
        $pdf->assertOk()->assertHeader('content-type', 'application/pdf');
        $this->assertStringStartsWith('%PDF-', $pdf->getContent());

        $excel = $this->actingAs($user)->get(route('central.reports.excel', $parameters));
        $excel->assertOk()->assertHeader('content-type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        $this->assertStringStartsWith('PK', $excel->streamedContent());
    }

    public function test_only_authorized_central_roles_can_view_or_export_reports(): void
    {
        $management = User::factory()->create(['role' => UserRole::MANAGEMENT]);
        $purchasing = User::factory()->create(['role' => UserRole::PURCHASING]);
        $storePic = User::factory()->create(['role' => UserRole::STORE_PIC]);

        $this->actingAs($management)->get(route('central.reports.index'))->assertOk();
        $this->actingAs($purchasing)->get(route('central.reports.pdf'))->assertOk();
        $this->actingAs($storePic)->get(route('central.reports.index'))->assertForbidden();
        $this->actingAs($storePic)->get(route('central.reports.excel'))->assertForbidden();
    }

    /** @return array{User, PurchaseOrder, Store} */
    private function reportScenario(): array
    {
        $user = User::factory()->centralAdmin()->create(['name' => 'Central Buyer']);
        $requester = User::factory()->create(['name' => 'Store Requester']);
        $unit = Unit::create(['name' => 'Piece', 'symbol' => 'pcs', 'is_active' => true]);
        $category = ItemCategory::create(['name' => 'ATK', 'code' => 'ATK', 'is_active' => true]);
        $item = Item::create(['sku' => 'ATK-001', 'name' => 'Pulpen', 'item_category_id' => $category->id, 'unit_id' => $unit->id, 'is_active' => true]);
        $pp = Store::factory()->create(['code' => 'PP', 'name' => 'Plaza Permata']);
        $pim = Store::factory()->create(['code' => 'PIM', 'name' => 'Pondok Indah Mall']);
        $first = $this->requestLine($pp, $requester, $unit, $item, 2, 3, 5);
        $second = $this->requestLine($pim, $requester, $unit, $item, 4, 4, 6);
        $special = $this->requestLine($pp, $requester, $unit, null, 1, null, null, 'Display Acrylic');
        $supplier = Supplier::create(['code' => 'SUP', 'name' => 'Supplier Utama', 'is_active' => true]);
        $order = PurchaseOrder::factory()->create([
            'number' => 'ORD/2026/10/0010', 'supplier_id' => $supplier->id, 'order_date' => now()->toDateString(),
            'status' => PurchaseOrderStatus::ORDERED, 'created_by' => $user->id, 'payment_method' => 'Transfer', 'payment_term' => '30 hari',
        ]);
        $stockOrderLine = $this->orderLine($order, $unit, PurchaseRequestItemType::STOCK, $item, null, 6, 100);
        $stockOrderLine->allocations()->create(['purchase_request_item_id' => $first->id, 'allocated_quantity' => 2]);
        $stockOrderLine->allocations()->create(['purchase_request_item_id' => $second->id, 'allocated_quantity' => 4]);
        $specialOrderLine = $this->orderLine($order, $unit, PurchaseRequestItemType::SPECIAL, null, 'Display Acrylic', 1, 250);
        $specialOrderLine->allocations()->create(['purchase_request_item_id' => $special->id, 'allocated_quantity' => 1]);

        StoreStock::create(['store_id' => $pp->id, 'item_id' => $item->id, 'quantity' => 3]);
        StoreStock::create(['store_id' => $pim->id, 'item_id' => $item->id, 'quantity' => 4]);
        StoreStockStandard::create(['store_id' => $pp->id, 'item_id' => $item->id, 'standard_quantity' => 5]);
        StoreStockStandard::create(['store_id' => $pim->id, 'item_id' => $item->id, 'standard_quantity' => 6]);
        StockMovement::create(['store_id' => $pp->id, 'item_id' => $item->id, 'previous_quantity' => 1, 'new_quantity' => 3, 'quantity_difference' => 2, 'movement_type' => StockMovementType::MANUAL_UPDATE, 'reason' => 'Stock opname', 'created_by' => $user->id]);
        $receipt = Receipt::create(['number' => 'RCV/2026/10/0001', 'purchase_order_id' => $order->id, 'store_id' => $pp->id, 'received_by' => $requester->id, 'received_at' => now(), 'status' => 'CONFIRMED']);
        $receipt->items()->create(['purchase_order_item_id' => $stockOrderLine->id, 'purchase_request_item_id' => $first->id, 'ordered_quantity' => 2, 'received_quantity' => 1]);

        return [$user, $order, $pp];
    }

    private function requestLine(Store $store, User $requester, Unit $unit, ?Item $item, float $quantity, ?float $stock, ?float $standard, ?string $name = null): PurchaseRequestItem
    {
        $request = PurchaseRequest::factory()->create(['store_id' => $store->id, 'requested_by' => $requester->id, 'status' => PurchaseRequestStatus::PROCESSED, 'processed_at' => now()]);

        return $request->items()->create([
            'type' => $item ? PurchaseRequestItemType::STOCK : PurchaseRequestItemType::SPECIAL,
            'item_id' => $item?->id, 'name' => $name, 'unit_id' => $unit->id,
            'current_stock_snapshot' => $stock, 'standard_stock_snapshot' => $standard,
            'requested_quantity' => $quantity, 'approved_quantity' => $quantity, 'estimated_price' => 100,
            'status' => PurchaseRequestItemStatus::APPROVED,
        ]);
    }

    private function orderLine(PurchaseOrder $order, Unit $unit, PurchaseRequestItemType $type, ?Item $item, ?string $name, float $quantity, float $price): PurchaseOrderItem
    {
        return $order->items()->create([
            'item_type' => $type, 'item_id' => $item?->id, 'name' => $name, 'unit_id' => $unit->id,
            'quantity' => $quantity, 'unit_price' => $price, 'total' => $quantity * $price,
        ]);
    }
}
