"use client";

import { Autocomplete } from "@base-ui/react/autocomplete";
import { Input } from "@/components/ui/input";

export type Suggestion = {
  value: string;
  /** Shown on the right, e.g. a price. */
  hint?: string;
};

/**
 * Free text with a list of suggestions (design 02 §4): the value is whatever
 * is typed; picking a suggestion also calls `onPick`, e.g. to fill a price.
 */
export function AutocompleteField({
  id,
  value,
  onChange,
  onBlur,
  onPick,
  suggestions,
  placeholder = "พิมพ์หรือเลือกจากรายการ",
  emptyText = "ไม่มีรายการแนะนำ พิมพ์เองได้",
  invalid,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  onPick?: (suggestion: Suggestion) => void;
  suggestions: Suggestion[];
  placeholder?: string;
  emptyText?: string;
  invalid?: boolean;
}) {
  return (
    <Autocomplete.Root
      items={suggestions}
      value={value}
      itemToStringValue={(item: Suggestion) => item.value}
      openOnInputClick
      onValueChange={(next, details) => {
        onChange(next);
        if (details.reason !== "item-press") return;
        const picked = suggestions.find((item) => item.value === next);
        if (picked) onPick?.(picked);
      }}
    >
      <Autocomplete.Input
        id={id}
        placeholder={placeholder}
        aria-invalid={invalid}
        onBlur={onBlur}
        render={<Input autoComplete="off" />}
      />
      <Autocomplete.Portal>
        <Autocomplete.Positioner sideOffset={6} align="start" className="isolate z-50">
          <Autocomplete.Popup className="max-h-(--available-height) w-(--anchor-width) max-w-(--available-width) min-w-56 origin-(--transform-origin) overflow-hidden rounded-lg bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10 duration-100 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95">
            <Autocomplete.Empty className="px-2 py-2 text-center text-sm text-muted-foreground empty:p-0">
              {emptyText}
            </Autocomplete.Empty>
            <Autocomplete.List className="max-h-72 scroll-py-1 overflow-y-auto overscroll-contain p-1 data-empty:p-0">
              {(item: Suggestion) => (
                <Autocomplete.Item
                  key={item.value}
                  value={item}
                  className="flex w-full cursor-default items-center gap-3 rounded-md px-2 py-1.5 text-sm outline-hidden select-none data-highlighted:bg-accent data-highlighted:text-accent-foreground"
                >
                  <span className="min-w-0 flex-1 truncate">{item.value}</span>
                  {item.hint ? <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{item.hint}</span> : null}
                </Autocomplete.Item>
              )}
            </Autocomplete.List>
          </Autocomplete.Popup>
        </Autocomplete.Positioner>
      </Autocomplete.Portal>
    </Autocomplete.Root>
  );
}
