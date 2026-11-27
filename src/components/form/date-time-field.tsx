"use client";

import { CalendarDays, X } from "lucide-react";
import { useState } from "react";
import { th } from "react-day-picker/locale";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export type DateTimeValue = { date: string; time: string };

function toYmd(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function fromYmd(value: string): Date | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : undefined;
}

/** "2026-11-27" → "27/11/2569": straight from the picked day, so the browser's time zone cannot shift it. */
function formatYmdTh(value: string): string {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${Number(year) + 543}`;
}

/** Typing "830", "0830" or "8:30" becomes "08:30". */
function tidyTime(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (/^\d{1,2}:\d{2}$/.test(value.trim())) return value.trim().padStart(5, "0");
  if (digits.length === 3 || digits.length === 4) return `${digits.slice(0, -2).padStart(2, "0")}:${digits.slice(-2)}`;
  return value.trim();
}

/**
 * Date (calendar with Thai months and Buddhist year) + 24-hour time
 * (ADR-0008, BR-WO-10). Value is { date: "YYYY-MM-DD", time: "HH:mm" }.
 */
export function DateTimeField({
  id,
  value,
  onChange,
  onBlur,
  invalid,
}: {
  id?: string;
  value: DateTimeValue;
  onChange: (value: DateTimeValue) => void;
  onBlur?: () => void;
  invalid?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selected = fromYmd(value.date);

  return (
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              id={id}
              type="button"
              variant="outline"
              className="flex-1 justify-start font-normal"
              aria-invalid={invalid}
            />
          }
        >
          <CalendarDays className="text-muted-foreground" />
          {value.date ? formatYmdTh(value.date) : <span className="text-muted-foreground">เลือกวันที่</span>}
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selected}
            defaultMonth={selected}
            onSelect={(date) => {
              onChange({ ...value, date: date ? toYmd(date) : "" });
              setOpen(false);
            }}
            locale={th}
            formatters={{
              formatCaption: (month) => `${month.toLocaleString("th-TH", { month: "long" })} ${month.getFullYear() + 543}`,
            }}
          />
        </PopoverContent>
      </Popover>
      <Input
        aria-label="เวลา (24 ชม.)"
        placeholder="HH:mm"
        inputMode="numeric"
        maxLength={5}
        className="w-20 text-center tabular-nums"
        value={value.time}
        onChange={(event) => onChange({ ...value, time: event.target.value })}
        onBlur={() => {
          const time = tidyTime(value.time);
          if (time !== value.time) onChange({ ...value, time });
          onBlur?.();
        }}
        aria-invalid={invalid}
      />
      {value.date || value.time ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="ล้างวันเวลา"
          onClick={() => onChange({ date: "", time: "" })}
        >
          <X />
        </Button>
      ) : null}
    </div>
  );
}
