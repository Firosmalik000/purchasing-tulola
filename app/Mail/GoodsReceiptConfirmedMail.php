<?php

namespace App\Mail;

use App\Models\Receipt;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class GoodsReceiptConfirmedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Receipt $receipt,
        public string $viewUrl,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Penerimaan Barang Selesai [{$this->receipt->number}] - {$this->receipt->store->name}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.receipt-confirmed',
        );
    }
}
