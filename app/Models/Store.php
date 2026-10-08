<?php

namespace App\Models;

use Database\Factories\StoreFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['code', 'name', 'address', 'is_active'])]
class Store extends Model
{
    /** @use HasFactory<StoreFactory> */
    use HasFactory;

    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }

    /** @return BelongsToMany<User, $this> */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class)
            ->withPivot(['is_pic', 'is_active'])
            ->withTimestamps();
    }

    /** @return HasMany<StoreStock, $this> */
    public function stocks(): HasMany
    {
        return $this->hasMany(StoreStock::class);
    }

    /** @return HasMany<StoreStockStandard, $this> */
    public function stockStandards(): HasMany
    {
        return $this->hasMany(StoreStockStandard::class);
    }

    /** @return HasMany<PurchaseRequest, $this> */
    public function purchaseRequests(): HasMany
    {
        return $this->hasMany(PurchaseRequest::class);
    }

    /** @return HasMany<Receipt, $this> */
    public function receipts(): HasMany
    {
        return $this->hasMany(Receipt::class);
    }
}
