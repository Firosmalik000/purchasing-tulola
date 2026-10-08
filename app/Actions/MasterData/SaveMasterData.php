<?php

namespace App\Actions\MasterData;

use App\Services\ActivityLogger;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class SaveMasterData
{
    public function __construct(private ActivityLogger $logger) {}

    /** @param array<string, mixed> $values */
    public function handle(Model $model, array $values, string $subject): Model
    {
        return DB::transaction(function () use ($model, $values, $subject): Model {
            $creating = ! $model->exists;
            $old = $creating ? null : $model->only(array_keys($values));
            $model->fill($values)->save();
            $this->logger->log($subject.'.'.($creating ? 'created' : 'updated'), $model, $old, $model->only(array_keys($values)));

            return $model;
        });
    }
}
