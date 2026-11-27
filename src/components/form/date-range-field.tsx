"use client";

import { CalendarDays, X } from "lucide-react";
import { useState } from "react";
import type { DateRange } from "react-day-picker";
import { th } from "react-day-picker/locale";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatYmdTh } from "@/lib/date-range";

export type DateRangeValue = { from: string; to: string };

export const EMPTY_DATE_RANGE: DateRangeValue = { from: "", to: "" };

function toYmd(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function fromYmd(value: string): Date | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : undefined;
}

export function formatRangeTh(value: DateRangeValue): string {
  if (!value.from) return "";
  if (!value.to || value.to === value.from) return formatYmdTh(value.from);
  return `${formatYmdTh(value.from)} – ${formatYmdTh(value.to)}`;
}

/**
 * Pick a range of days on a calendar with Thai months and Buddhist years
 * (ADR-0008): first click = start, second click = end. One day = click it
 * once. Values are "YYYY-MM-DD" days, both ends included.
 */
export function DateRangeField({
  id,
  value,
  onChange,
  placeholder = "เลือกช่วงวันที่",
}: {
  id?: string;
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected: DateRange | undefined = value.from ? { from: fromYmd(value.from), to: fromYmd(value.to) } : undefined;

  return (
    <div className="flex items-center gap-1">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={<Button id={id} type="button" variant="outline" className="min-w-0 flex-1 justify-start font-normal" />}
        >
          <CalendarDays className="text-muted-foreground" />
          {value.from ? (
            <span className="truncate tabular-nums">{formatRangeTh(value)}</span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            selected={selected}
            defaultMonth={selected?.from}
            numberOfMonths={2}
            onSelect={(range) => {
              const from = range?.from ? toYmd(range.from) : "";
              const to = range?.to ? toYmd(range.to) : from;
              onChange({ from, to });
            }}
            locale={th}
            formatters={{
              formatCaption: (month) =>
                `${month.toLocaleString("th-TH", { month: "long" })} ${month.getFullYear() + 543}`,
            }}
          />
          <div className="flex items-center justify-between gap-2 border-t p-2 text-xs text-muted-foreground">
            <span>คลิกวันเริ่ม แล้วคลิกวันสิ้นสุด</span>
            <Button type="button" size="sm" onClick={() => setOpen(false)}>
              ตกลง
            </Button>
          </div>
        </PopoverContent>
      </Popover>
      {value.from ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="ล้างช่วงวันที่"
          onClick={() => onChange(EMPTY_DATE_RANGE)}
        >
          <X />
        </Button>
      ) : null}
    </div>
  );
}
