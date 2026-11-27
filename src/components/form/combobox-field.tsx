"use client";

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";

export type ComboboxOption = { value: string; label: string };

/**
 * Type-to-search single select over a long list (design 02 §4, replaces
 * Select2). The value is the option's string id; "" means nothing chosen.
 */
export function ComboboxField({
  id,
  options,
  value,
  onChange,
  placeholder = "พิมพ์เพื่อค้นหา…",
  emptyText = "ไม่พบรายการ",
  invalid,
}: {
  id?: string;
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  emptyText?: string;
  invalid?: boolean;
}) {
  const selected = options.find((option) => option.value === value) ?? null;
  return (
    <Combobox<ComboboxOption>
      items={options}
      value={selected}
      onValueChange={(option) => onChange(option?.value ?? "")}
      itemToStringLabel={(option) => option.label}
      isItemEqualToValue={(a, b) => a.value === b.value}
    >
      <ComboboxInput id={id} placeholder={placeholder} showClear aria-invalid={invalid} className="w-full" />
      <ComboboxContent>
        <ComboboxEmpty>{emptyText}</ComboboxEmpty>
        <ComboboxList>
          {(option: ComboboxOption) => (
            <ComboboxItem key={option.value} value={option}>
              {option.label}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
