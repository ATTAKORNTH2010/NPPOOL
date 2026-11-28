"use client";

import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { useId, useRef, useState } from "react";
import { useController, type Control } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  FUEL_PRICE_MAX,
  FUEL_PRICE_MIN,
  FUEL_PRICES,
  routeRateSchema,
  type RouteDialogOutput,
  type RouteDialogValues,
  type RouteRateFormValues,
} from "../schemas";

const byFuelPrice = (rates: RouteRateFormValues[]) =>
  [...rates].sort((a, b) => Number(a.fuelPrice) - Number(b.fuelPrice));

/** The lowest fuel price that has no price yet, or "" when every one has. */
function firstFree(rates: RouteRateFormValues[]): string {
  const used = new Set(rates.map((rate) => rate.fuelPrice));
  const free = FUEL_PRICES.find((fuel) => !used.has(String(fuel)));
  return free === undefined ? "" : String(free);
}

/** First message anywhere in a react-hook-form error (the list, or one of its rows). */
function errorText(error: unknown): string | undefined {
  if (!error || typeof error !== "object") return undefined;
  if ("message" in error && typeof error.message === "string" && error.message) return error.message;
  for (const value of Object.values(error)) {
    const text = errorText(value);
    if (text) return text;
  }
  return undefined;
}

/**
 * ราคาขนส่งตามราคาน้ำมัน (user request 2026-11-28): pick a fuel price
 * (25–50 baht), type the transport price, press + to add it to the list.
 * Each row can be edited or removed; the list is saved with the route.
 */
export function RouteRatesField({
  control,
  legacyPrice,
}: {
  control: Control<RouteDialogValues, unknown, RouteDialogOutput>;
  /** The old single price of a route that has no prices by fuel price yet. */
  legacyPrice: string | null;
}) {
  const fuelId = useId();
  const priceId = useId();
  const rowErrorId = useId();
  const rates = useController({ control, name: "rates" });
  const draft = useController({ control, name: "draftPrice" });
  const priceInput = useRef<HTMLInputElement | null>(null);

  const list = rates.field.value;
  const [editing, setEditing] = useState<string | null>(null);
  // An old route starts with no fuel price chosen, so its old price is not filed under 25 by accident.
  const [fuel, setFuel] = useState(() => (legacyPrice ? "" : firstFree(list)));
  const [rowError, setRowError] = useState<string | null>(null);

  const used = new Set(list.map((rate) => rate.fuelPrice));
  const full = !editing && used.size >= FUEL_PRICES.length;
  const draftError = draft.fieldState.error?.message;

  function setDraft(value: string) {
    draft.field.onChange(value);
    setRowError(null);
  }

  function startOver(next: RouteRateFormValues[]) {
    setEditing(null);
    setRowError(null);
    draft.field.onChange("");
    setFuel(firstFree(next));
  }

  function commit() {
    const parsed = routeRateSchema.safeParse({ fuelPrice: fuel, price: draft.field.value });
    if (!parsed.success) {
      setRowError(parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง");
      return;
    }
    const fuelPrice = String(parsed.data.fuelPrice);
    if (fuelPrice !== editing && used.has(fuelPrice)) {
      setRowError(`ราคาน้ำมัน ${fuelPrice} บาท มีราคาแล้ว กดแก้ไขที่รายการด้านล่าง`);
      return;
    }
    const next = byFuelPrice([
      ...list.filter((rate) => rate.fuelPrice !== editing),
      { fuelPrice, price: parsed.data.price },
    ]);
    rates.field.onChange(next);
    startOver(next);
    priceInput.current?.focus();
  }

  function edit(rate: RouteRateFormValues) {
    setEditing(rate.fuelPrice);
    setFuel(rate.fuelPrice);
    draft.field.onChange(rate.price);
    setRowError(null);
    priceInput.current?.focus();
  }

  function remove(rate: RouteRateFormValues) {
    const next = list.filter((item) => item.fuelPrice !== rate.fuelPrice);
    rates.field.onChange(next);
    if (editing === rate.fuelPrice) startOver(next);
    else if (!fuel) setFuel(firstFree(next));
  }

  const rowMessage = rowError ?? draftError;

  return (
    <FieldSet className="gap-3">
      <FieldLegend variant="label">ราคาขนส่งตามราคาน้ำมัน</FieldLegend>
      <FieldDescription className="-mt-2">
        ราคาน้ำมัน {FUEL_PRICE_MIN}–{FUEL_PRICE_MAX} บาท ราคาละ 1 รายการ · เลือกราคาน้ำมัน กรอกราคา แล้วกด +
      </FieldDescription>

      {legacyPrice && list.length === 0 ? (
        <p className="rounded-lg border border-dashed px-3 py-2 text-sm text-muted-foreground">
          ราคาเดิม <span className="font-medium text-foreground tabular-nums">{formatMoney(legacyPrice)}</span> บาท
          ยังไม่ได้ระบุราคาน้ำมัน — เลือกราคาน้ำมันแล้วกด + เพื่อเก็บราคานี้ไว้ เมื่อบันทึกแล้วระบบจะใช้ราคาตามราคาน้ำมันแทนราคาเดิม
        </p>
      ) : null}

      <div className="grid grid-cols-[6.5rem_minmax(0,1fr)_auto] items-end gap-2">
        <Field data-invalid={Boolean(rowError) && !fuel}>
          <FieldLabel htmlFor={fuelId}>ราคาน้ำมัน</FieldLabel>
          <Select
            items={FUEL_PRICES.map((value) => ({ value: String(value), label: String(value) }))}
            value={fuel || null}
            onValueChange={(value) => {
              setFuel(value ?? "");
              setRowError(null);
            }}
          >
            <SelectTrigger id={fuelId} className="w-full" aria-invalid={Boolean(rowError) && !fuel}>
              <SelectValue placeholder="เลือก" />
            </SelectTrigger>
            <SelectContent>
              {FUEL_PRICES.map((value) => {
                const key = String(value);
                const taken = used.has(key) && key !== editing;
                return (
                  <SelectItem key={key} value={key} disabled={taken}>
                    {taken ? `${key} · มีราคาแล้ว` : key}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </Field>
        <Field data-invalid={Boolean(rowMessage)}>
          <FieldLabel htmlFor={priceId}>ราคา (บาท)</FieldLabel>
          <Input
            id={priceId}
            ref={(element) => {
              draft.field.ref(element);
              priceInput.current = element;
            }}
            name={draft.field.name}
            value={draft.field.value}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={draft.field.onBlur}
            onKeyDown={(event) => {
              // Enter adds the row instead of saving the whole dialog.
              if (event.key === "Enter") {
                event.preventDefault();
                commit();
              }
            }}
            inputMode="decimal"
            autoComplete="off"
            placeholder="เช่น 3500"
            aria-invalid={Boolean(rowMessage)}
            aria-describedby={rowMessage ? rowErrorId : undefined}
          />
        </Field>
        <div className="flex gap-1">
          {editing ? (
            <>
              <Button type="button" size="icon" onClick={commit} aria-label="บันทึกราคานี้" title="บันทึกราคานี้">
                <Check />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={() => startOver(list)}
                aria-label="ยกเลิกการแก้ไข"
                title="ยกเลิกการแก้ไข"
              >
                <X />
              </Button>
            </>
          ) : (
            <Button type="button" size="icon" onClick={commit} disabled={full} aria-label="เพิ่มราคานี้" title="เพิ่มราคานี้">
              <Plus />
            </Button>
          )}
        </div>
      </div>
      {rowMessage ? (
        <FieldError id={rowErrorId} className="-mt-1">
          {rowMessage}
        </FieldError>
      ) : full ? (
        <FieldDescription className="-mt-1">มีราคาครบทุกราคาน้ำมันแล้ว แก้ไขหรือลบในรายการด้านล่างได้</FieldDescription>
      ) : null}

      <div className="rounded-lg border">
        {list.length === 0 ? (
          <p className="px-3 py-4 text-center text-sm text-muted-foreground">ยังไม่มีราคา</p>
        ) : (
          <div className="max-h-56 overflow-y-auto">
            <table className="w-full text-sm">
              <caption className="sr-only">ราคาขนส่งตามราคาน้ำมัน {list.length} รายการ</caption>
              <thead className="sticky top-0 bg-muted text-muted-foreground">
                <tr>
                  <th scope="col" className="px-3 py-1.5 text-left font-medium">
                    ราคาน้ำมัน
                  </th>
                  <th scope="col" className="px-3 py-1.5 text-right font-medium">
                    ราคาขนส่ง (บาท)
                  </th>
                  <th scope="col" className="w-20 px-1">
                    <span className="sr-only">แก้ไขหรือลบ</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {list.map((rate) => (
                  <tr key={rate.fuelPrice} className={cn("border-t", rate.fuelPrice === editing && "bg-accent")}>
                    <td className="px-3 py-1 tabular-nums">{rate.fuelPrice} บาท</td>
                    <td className="px-3 py-1 text-right tabular-nums">{formatMoney(rate.price)}</td>
                    <td className="px-1 py-1 text-right whitespace-nowrap">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => edit(rate)}
                        aria-label={`แก้ไขราคาที่น้ำมัน ${rate.fuelPrice} บาท`}
                        title="แก้ไข"
                      >
                        <Pencil />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => remove(rate)}
                        aria-label={`ลบราคาที่น้ำมัน ${rate.fuelPrice} บาท`}
                        title="ลบ"
                      >
                        <Trash2 />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <FieldError>{errorText(rates.fieldState.error)}</FieldError>
    </FieldSet>
  );
}
