import { expect, test } from 'bun:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { DateInput } from '../../resources/js/components/ui/date-input';
import { DateTimeInput } from '../../resources/js/components/ui/date-time-input';

test('tanggal Indonesia tampil konsisten dan named input mengirim ISO untuk Form GET maupun POST', () => {
    const html = renderToStaticMarkup(<DateInput name="date" defaultValue="2026-11-01" />);
    expect(html).toContain('value="01/11/2026"');
    expect(html).toMatch(/type="hidden" name="date" value="2026-11-01"/);
    expect(html).not.toContain('type="date"');
});

test('akhir bulan dan tahun kabisat tidak tertukar atau bergeser timezone', () => {
    const html = renderToStaticMarkup(<DateInput name="date" value="2028-02-29" />);
    expect(html).toContain('value="29/02/2028"');
    expect(html).toMatch(/name="date" value="2028-02-29"/);
});

test('tanggal parsial tidak diinterpretasi menjadi Januari 2001', () => {
    const html = renderToStaticMarkup(<DateInput value="1" />);
    expect(html).toContain('value="1"');
    expect(html).not.toContain('2001');
});

test('tanggal opsional bisa kosong dan disabled tidak mengirim hidden input aktif', () => {
    const html = renderToStaticMarkup(<DateInput name="date" defaultValue="" disabled />);
    const hidden = html.match(/<input[^>]*type="hidden"[^>]*>/)?.[0] ?? '';
    expect(hidden).toContain('disabled=""');
    expect(hidden).toContain('name="date"');
    expect(hidden).toContain('value=""');
});

test('tanggal penerimaan memakai DD/MM/YYYY dan mempertahankan jam lokal', () => {
    const html = renderToStaticMarkup(<DateTimeInput id="received_at" value="2026-11-05T14:30" onChange={() => {}} required />);
    expect(html).toContain('value="05/11/2026"');
    expect(html).toContain('type="time"');
    expect(html).toContain('value="14:30"');
    expect(html).not.toContain('datetime-local');
});
