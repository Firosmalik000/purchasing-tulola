<?php

namespace App\Mail;

use App\Models\PurchaseOrder;
use App\Models\Store;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PurchaseOrderPlacedMail extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * @param array<int, array{name: string, sku: string|null, quantity: string, unit: string}> $items
     */
    public function __construct(
        public PurchaseOrder $purchaseOrder,
        public Store $store,
        public array $items,
        public string $viewUrl,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Pesanan Pembelian Telah Dipesan [{$this->purchaseOrder->number}] - {$this->purchaseOrder->supplier->name}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.order-placed',
        );
    }
}
