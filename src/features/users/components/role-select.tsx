"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ROLE_LABELS, ROLES, type Role } from "@/lib/permissions";

const ROLE_ITEMS = ROLES.map((role) => ({ value: role, label: ROLE_LABELS[role] }));

export function RoleSelect({
  id,
  value,
  onChange,
  invalid,
}: {
  id?: string;
  value: Role | undefined;
  onChange: (role: Role) => void;
  invalid?: boolean;
}) {
  return (
    <Select items={ROLE_ITEMS} value={value ?? null} onValueChange={(next) => next && onChange(next as Role)}>
      <SelectTrigger id={id} className="w-full" aria-invalid={invalid}>
        <SelectValue placeholder="เลือกบทบาท" />
      </SelectTrigger>
      <SelectContent>
        {ROLE_ITEMS.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
