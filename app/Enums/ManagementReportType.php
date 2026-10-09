<?php

namespace App\Enums;

enum ManagementReportType: string
{
    case PURCHASING_REQUEST = 'purchasing-request';
    case REQUEST_BY_STORE = 'request-by-store';
    case ORDER = 'order';
    case OUTSTANDING_ORDER = 'outstanding-order';
    case RECEIVED_ORDER = 'received-order';
    case STOCK_BY_STORE = 'stock-by-store';
    case STOCK_VS_STANDARD = 'stock-vs-standard';
    case STOCK_UPDATE_HISTORY = 'stock-update-history';
    case SPECIAL_REQUEST = 'special-request';

    public function label(): string
    {
        return match ($this) {
            self::PURCHASING_REQUEST => 'Purchasing Request',
            self::REQUEST_BY_STORE => 'Permintaan per Toko',
            self::ORDER => 'Laporan Pesanan',
            self::OUTSTANDING_ORDER => 'Pesanan Outstanding',
            self::RECEIVED_ORDER => 'Pesanan Diterima',
            self::STOCK_BY_STORE => 'Stok per Toko',
            self::STOCK_VS_STANDARD => 'Stok vs Standar',
            self::STOCK_UPDATE_HISTORY => 'Riwayat Pembaruan Stok',
            self::SPECIAL_REQUEST => 'Permintaan Khusus',
        };
    }

    public function description(): string
    {
        return match ($this) {
            self::PURCHASING_REQUEST => 'Dokumen purchasing request dengan distribusi toko otomatis.',
            self::REQUEST_BY_STORE => 'Ringkasan jumlah permintaan dan kuantitas per toko.',
            self::ORDER => 'Daftar order internal beserta kuantitas dan status.',
            self::OUTSTANDING_ORDER => 'Sisa kuantitas pesanan yang belum diterima.',
            self::RECEIVED_ORDER => 'Rincian penerimaan aktual dari toko.',
            self::STOCK_BY_STORE => 'Posisi stok terkini untuk setiap toko.',
            self::STOCK_VS_STANDARD => 'Perbandingan stok terkini dengan stok standar.',
            self::STOCK_UPDATE_HISTORY => 'Audit perubahan kuantitas stok.',
            self::SPECIAL_REQUEST => 'Rincian item khusus di luar master item.',
        };
    }

    public function isSnapshot(): bool
    {
        return in_array($this, [self::STOCK_BY_STORE, self::STOCK_VS_STANDARD], true);
    }
}
