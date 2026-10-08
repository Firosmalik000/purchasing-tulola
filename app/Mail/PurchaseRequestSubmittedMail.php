<?php

namespace App\Mail;

use App\Models\PurchaseRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PurchaseRequestSubmittedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public PurchaseRequest $purchaseRequest,
        public string $viewUrl,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Permintaan Pembelian Baru [{$this->purchaseRequest->number}] - {$this->purchaseRequest->store->name}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.request-submitted',
        );
    }
}
