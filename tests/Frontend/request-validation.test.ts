import { describe, expect, test } from 'bun:test';
import { stockRequestQuantity } from '../../resources/js/lib/stock-request-quantity';
import { validationMessages } from '../../resources/js/lib/validation-messages';

describe('jumlah permintaan sesuai stok tersedia', () => {
    test('stok kosong tidak menyimpan jumlah yang bisa diajukan', () => {
        expect(stockRequestQuantity('1', 0)).toBe('');
        expect(stockRequestQuantity('99', 0)).toBe('');
    });

    test('ketikan, paste dan perubahan barang dibatasi stok baru', () => {
        expect(stockRequestQuantity('99', 2)).toBe('2');
        expect(stockRequestQuantity('2', 2)).toBe('2');
        expect(stockRequestQuantity('1', 2)).toBe('1');
        expect(stockRequestQuantity('10', 3)).toBe('3');
    });

    test('jumlah tetap integer positif dan kolom bisa dikosongkan', () => {
        expect(stockRequestQuantity('1.9', 5)).toBe('1');
        expect(stockRequestQuantity('-1', 5)).toBe('1');
        expect(stockRequestQuantity('0', 5)).toBe('1');
        expect(stockRequestQuantity('', 5)).toBe('');
        expect(stockRequestQuantity('invalid', 5)).toBe('');
    });
});

describe('pesan validasi tunggal', () => {
    test('error stok yang sama pada ringkasan dan kolom hanya dihitung sekali', () => {
        expect(validationMessages({ stock: 'Stok habis', 'stock_items.0.requested_quantity': 'Stok habis' }))
            .toEqual(['Stok habis']);
    });

    test('ringkasan banyak item tidak mengulang detail setiap kolom', () => {
        expect(validationMessages({ stock: 'A dan B tidak cukup', 'stock_items.0.requested_quantity': 'A tidak cukup', 'stock_items.1.requested_quantity': 'B tidak cukup' }))
            .toEqual(['A tidak cukup', 'B tidak cukup']);
    });

    test('error action tanpa detail kolom tetap muncul', () => {
        expect(validationMessages({ stock: 'Stok sudah dicadangkan' })).toEqual(['Stok sudah dicadangkan']);
    });

    test('duplikat array dan string dinormalisasi tanpa menghilangkan error lain', () => {
        expect(validationMessages({ first: [' Jumlah wajib diisi ', 'Jumlah wajib diisi'], second: 'Toko wajib dipilih', empty: '', invalid: null }))
            .toEqual(['Jumlah wajib diisi', 'Toko wajib dipilih']);
    });
});
