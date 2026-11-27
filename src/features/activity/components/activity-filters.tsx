"use client";

import { Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { DateRangeField, type DateRangeValue } from "@/components/form/date-range-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ACTIVITY_ACTIONS, ACTIVITY_MODULES } from "../catalog";
import type { ActivityFilters } from "../service";

const ALL = "all";

function SelectFilter({
  label,
  value,
  onChange,
  items,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  items: { value: string; label: string }[];
}) {
  const id = useId();
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Select items={items} value={value} onValueChange={(v) => onChange(v ?? ALL)}>
        <SelectTrigger id={id} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {items.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

/** Who / which function / what / when (ADR-0012). The page re-mounts this form when the URL changes. */
export function ActivityFiltersForm({
  filters,
  users,
}: {
  filters: ActivityFilters;
  users: { id: string; name: string }[];
}) {
  const router = useRouter();
  const rangeId = useId();
  const [user, setUser] = useState(filters.userId ?? ALL);
  const [moduleKey, setModuleKey] = useState<string>(filters.module ?? ALL);
  const [action, setAction] = useState<string>(filters.action ?? ALL);
  const [range, setRange] = useState<DateRangeValue>({ from: filters.from ?? "", to: filters.to ?? "" });

  function search(event: React.FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (user !== ALL) params.set("user", user);
    if (moduleKey !== ALL) params.set("module", moduleKey);
    if (action !== ALL) params.set("action", action);
    if (range.from) params.set("from", range.from);
    if (range.to) params.set("to", range.to);
    const query = params.toString();
    router.push(query ? `/admin/activity?${query}` : "/admin/activity");
  }

  return (
    <Card>
      <CardContent>
        <form onSubmit={search} className="grid gap-4" role="search" aria-label="ค้นหา Activity Logs">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SelectFilter
              label="ผู้ใช้"
              value={user}
              onChange={setUser}
              items={[{ value: ALL, label: "ทุกคน" }, ...users.map((u) => ({ value: u.id, label: u.name }))]}
            />
            <SelectFilter
              label="ฟังก์ชัน"
              value={moduleKey}
              onChange={setModuleKey}
              items={[
                { value: ALL, label: "ทุกฟังก์ชัน" },
                ...Object.entries(ACTIVITY_MODULES).map(([value, label]) => ({ value, label })),
              ]}
            />
            <SelectFilter
              label="การกระทำ"
              value={action}
              onChange={setAction}
              items={[
                { value: ALL, label: "ทุกการกระทำ" },
                ...Object.entries(ACTIVITY_ACTIONS).map(([value, label]) => ({ value, label })),
              ]}
            />
            <Field>
              <FieldLabel htmlFor={rangeId}>ช่วงวันที่</FieldLabel>
              <DateRangeField id={rangeId} value={range} onChange={setRange} />
            </Field>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => router.push("/admin/activity")}>
              <X />
              ล้างการค้นหา
            </Button>
            <Button type="submit">
              <Search />
              ค้นหา
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
