@extends('emails.layout')

@section('content')
    <div class="greeting">Halo, {{ $user->name }}!</div>
    
    <p>Anda telah diundang untuk bergabung ke portal operasional <strong>Tulola Jewelry Purchasing System</strong> dengan peran <span class="badge badge-gold">{{ $user->role->label() }}</span>.</p>
    
    <p>Untuk mengaktifkan akun dan mulai mengakses portal, silakan klik tombol di bawah ini untuk membuat kata sandi Anda:</p>
    
    <div class="btn-container">
        <a href="{{ $inviteUrl }}" class="btn btn-gold">Buat Kata Sandi Akun</a>
    </div>
    
    <div class="card-box">
        <div style="font-size: 12px; color: #71717a; margin-bottom: 8px;"><strong>Detail Akun:</strong></div>
        <div class="card-row">
            <span class="card-label">Email Terdaftar:</span>
            <span class="card-value">{{ $user->email }}</span>
        </div>
        <div class="card-row">
            <span class="card-label">Otoritas / Peran:</span>
            <span class="card-value">{{ $user->role->label() }}</span>
        </div>
    </div>
    
    <p style="font-size: 12px; color: #71717a;">Jika tombol di atas tidak berfungsi, salin dan buka tautan berikut di peramban Anda:<br>
    <a href="{{ $inviteUrl }}" style="color: #c8a355; word-break: break-all;">{{ $inviteUrl }}</a></p>
@endsection
