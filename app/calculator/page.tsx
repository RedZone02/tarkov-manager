"use client";

import { useState } from "react";

export default function CalculatorPage() {
  const [gearCost, setGearCost] = useState("");
  const [consumablesCost, setConsumablesCost] = useState("");
  const [lootValue, setLootValue] = useState("");
  const [insurance, setInsurance] = useState("");

  const gear = Number(gearCost) || 0;
  const consumables = Number(consumablesCost) || 0;
  const loot = Number(lootValue) || 0;
  const insuranceReturn = Number(insurance) || 0;

  const totalSpent = gear + consumables;
  const totalGained = loot + insuranceReturn;
  const profit = totalGained - totalSpent;

  const hasInput = gearCost || consumablesCost || lootValue || insurance;

  return (
    <main className="mx-auto max-w-xl px-4 py-10">
      <h1 className="text-3xl font-bold">💰 Raid Calculator</h1>
      <p className="mt-2 text-zinc-600">
        Punch in what you brought into the raid and what you walked out with,
        and we&apos;ll tell you if it was worth it.
      </p>

      <div className="mt-6 flex flex-col gap-4 rounded-md border border-zinc-200 bg-zinc-50 p-5">
        <Field label="Gear cost (₽)" value={gearCost} onChange={setGearCost} />
        <Field
          label="Consumables used (₽)"
          value={consumablesCost}
          onChange={setConsumablesCost}
        />
        <Field
          label="Loot extracted value (₽)"
          value={lootValue}
          onChange={setLootValue}
        />
        <Field
          label="Insurance returned (₽)"
          value={insurance}
          onChange={setInsurance}
        />
      </div>

      <div className="mt-6 rounded-md border border-zinc-200 p-5">
        <div className="flex justify-between text-sm text-zinc-600">
          <span>Total spent</span>
          <span>{totalSpent.toLocaleString()} ₽</span>
        </div>
        <div className="mt-1 flex justify-between text-sm text-zinc-600">
          <span>Total gained</span>
          <span>{totalGained.toLocaleString()} ₽</span>
        </div>
        <hr className="my-3 border-zinc-200" />
        <div className="flex items-center justify-between">
          <span className="font-medium">
            {profit >= 0 ? "Profit" : "Loss"}
          </span>
          <span
            className={`text-xl font-bold ${
              profit >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {profit >= 0 ? "+" : ""}
            {profit.toLocaleString()} ₽
          </span>
        </div>
        {!hasInput && (
          <p className="mt-2 text-xs text-zinc-400">
            Fill in the numbers above to see your raid result.
          </p>
        )}
      </div>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-zinc-700">{label}</span>
      <input
        type="number"
        min="0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0"
        className="rounded border border-zinc-300 px-3 py-2"
      />
    </label>
  );
}
