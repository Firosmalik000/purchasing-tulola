import { beforeEach, expect, mock, test } from 'bun:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

let formProps: Record<string, unknown>;
const showError = mock(() => {});

mock.module('sonner', () => ({ toast: { error: showError } }));
mock.module('@inertiajs/react', () => ({
    Form: (props: Record<string, unknown>) => {
        formProps = props;
        const children = props.children;
        return <form>{typeof children === 'function'
            ? children({ processing: false, errors: {} })
            : children as React.ReactNode}</form>;
    },
    Head: () => null,
    Link: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
    router: {},
}));

const { default: RequestForm } = await import('../../resources/js/pages/store/requests/form');
const { default: CentralRequestIndex } = await import('../../resources/js/pages/central/requests/index');

beforeEach(() => showError.mockClear());

function renderForm(available: number, requested: number) {
    return renderToStaticMarkup(<RequestForm
        stores={[{ id: 1, code: 'A', name: 'Store A' }]}
        selectedStoreId={1}
        items={[{ id: 1, name: 'Item', sku: 'ITEM', central_stock: available }]}
        units={[]}
        purchaseRequest={{ id: 1, number: 'REQ/1', store_id: 1, required_date: null, notes: null,
            items: [{ id: 1, type: 'STOCK', item_id: 1, name: null, description: null, sample_image_url: null, unit_id: 1, requested_quantity: requested, required_date: null, reason: null }] }}
    />);
}

test('stok nol menghasilkan input hanya-baca kosong dan onBefore membatalkan pengajuan', () => {
    const html = renderForm(0, 2);
    const input = html.match(/<input[^>]*name="stock_items\[0\]\[requested_quantity\]"[^>]*>/)?.[0] ?? '';
    expect(input).toContain('readOnly=""');
    expect(input).toContain('max="0"');
    expect(input).toContain('value=""');
    expect((formProps.onBefore as () => boolean)()).toBe(false);
    expect(showError).toHaveBeenCalledTimes(1);
    expect(formProps.onSubmit).toBeUndefined();
});

test('draft dengan jumlah melebihi stok ditampilkan sesuai batas dan boleh diproses', () => {
    const html = renderForm(2, 99);
    const input = html.match(/<input[^>]*name="stock_items\[0\]\[requested_quantity\]"[^>]*>/)?.[0] ?? '';
    expect(input).toContain('max="2"');
    expect(input).toContain('value="2"');
    expect(input).not.toContain('readOnly');
    expect((formProps.onBefore as () => boolean)()).toBe(true);
    expect(showError).not.toHaveBeenCalled();
});

test('filter PR menampilkan DD/MM/YYYY dan mengirim ISO tanpa menukar hari dan bulan', () => {
    const html = renderToStaticMarkup(<CentralRequestIndex
        requests={{ data: [], links: [] }} stores={[]} statuses={[]} types={[]}
        filters={{ store_id: '', status: '', type: '', keyword: '', date_from: '2026-11-01', date_to: '2026-11-30' }}
    />);
    expect(html).toMatch(/name="date_from"[^>]*value="2026-11-01"/);
    expect(html).toMatch(/name="date_to"[^>]*value="2026-11-30"/);
    expect(html).toContain('value="01/11/2026"');
    expect(html).toContain('value="30/11/2026"');
    expect(formProps.transform).toBeUndefined();
});
