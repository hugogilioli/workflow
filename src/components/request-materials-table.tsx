"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type CalcBasis = "FIBER_FT" | "STRAND_FT" | "TOTAL_FT";
type CalcRounding = "CEIL" | "ROUND" | "FLOOR" | "NONE";

export type RequestMaterialRow = {
  id: string;
  sapPn: string;
  name: string;
  description: string | null;
  unit: string | null;

  calcBasis: CalcBasis | null;
  calcFactor: number | null;
  calcRounding: CalcRounding;
};

function applyRounding(value: number, rounding: CalcRounding) {
  if (!Number.isFinite(value)) return 0;
  switch (rounding) {
    case "CEIL":
      return Math.ceil(value);
    case "FLOOR":
      return Math.floor(value);
    case "ROUND":
      return Math.round(value);
    case "NONE":
    default:
      return value;
  }
}

function computeSuggestedQty(
  m: RequestMaterialRow,
  fiberFt: number,
  strandFt: number
) {
  if (!m.calcBasis || !m.calcFactor) return null;

  const base =
    m.calcBasis === "FIBER_FT"
      ? fiberFt
      : m.calcBasis === "STRAND_FT"
      ? strandFt
      : fiberFt + strandFt;

  const raw = base * m.calcFactor;

  const rounded = applyRounding(raw, m.calcRounding);
  const asInt = Number.isFinite(rounded) ? Math.max(0, Math.trunc(rounded)) : 0;

  return asInt;
}

export function RequestMaterialsTable({ materials }: { materials: RequestMaterialRow[] }) {
  const [fiberFt, setFiberFt] = useState<string>("");
  const [strandFt, setStrandFt] = useState<string>("");

  const fiber = useMemo(() => {
    const n = parseFloat(fiberFt || "0");
    return Number.isFinite(n) ? n : 0;
  }, [fiberFt]);

  const strand = useMemo(() => {
    const n = parseFloat(strandFt || "0");
    return Number.isFinite(n) ? n : 0;
  }, [strandFt]);

  const suggestedMap = useMemo(() => {
    const map = new Map<string, number | null>();
    for (const m of materials) {
      map.set(m.id, computeSuggestedQty(m, fiber, strand));
    }
    return map;
  }, [materials, fiber, strand]);

  return (
    <div className="space-y-4">
      {/* Feet inputs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <div className="text-sm font-medium">Fiber feet</div>
          <Input
            inputMode="decimal"
            placeholder="e.g. 1200"
            value={fiberFt}
            onChange={(e) => setFiberFt(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium">Strand feet</div>
          <Input
            inputMode="decimal"
            placeholder="e.g. 8500"
            value={strandFt}
            onChange={(e) => setStrandFt(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium">Total feet</div>
          <Input value={String(Math.round(fiber + strand))} disabled />
        </div>
      </div>

      {/* Materials table */}
      <div className="overflow-x-auto border rounded-xl">
        <table className="w-full text-sm">
          <thead className="bg-zinc-900 text-white">
            <tr>
              <th className="text-left px-3 py-2 w-[60px]">Pick</th>
              <th className="text-left px-3 py-2 w-[140px]">SAP PN</th>
              <th className="text-left px-3 py-2">Material</th>
              <th className="text-left px-3 py-2 w-[140px]">Suggested</th>
              <th className="text-left px-3 py-2 w-[120px]">Qty</th>
              <th className="text-left px-3 py-2 w-[260px]">Notes</th>
            </tr>
          </thead>

          <tbody>
            {materials.map((m) => {
              const suggested = suggestedMap.get(m.id) ?? null;

              return (
                <tr key={m.id} className="border-t">
                  <td className="px-3 py-2">
                    <input type="checkbox" name={`m_${m.id}`} />
                  </td>

                  <td className="px-3 py-2 font-mono text-xs">{m.sapPn}</td>

                  <td className="px-3 py-2">
                    <div className="font-medium">{m.name}</div>
                    {m.description ? (
                      <div className="text-xs text-muted-foreground">
                        {m.description}
                      </div>
                    ) : null}
                  </td>

                  <td className="px-3 py-2">
                    {suggested === null ? (
                      <span className="text-xs text-muted-foreground">
                        —
                      </span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{suggested}</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // fill qty input
                            const el = document.querySelector(
                              `input[name="q_${m.id}"]`
                            ) as HTMLInputElement | null;
                            if (el) el.value = String(suggested);
                          }}
                        >
                          Use
                        </Button>
                      </div>
                    )}
                  </td>

                  <td className="px-3 py-2">
                    <Input
                      name={`q_${m.id}`}
                      type="number"
                      min={0}
                      placeholder="0"
                    />
                  </td>

                  <td className="px-3 py-2">
                    <Input name={`n_${m.id}`} placeholder="Optional notes" />
                  </td>
                </tr>
              );
            })}

            {materials.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-3 py-10 text-center text-sm text-muted-foreground"
                >
                  No active materials found. Add materials first.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">
        Suggested Qty uses material calc rules (basis + factor + rounding). If a material has no calc rule, it shows “—”.
      </p>
    </div>
  );
}
