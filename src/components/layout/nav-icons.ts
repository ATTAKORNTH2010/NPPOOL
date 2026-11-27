import { Activity, Building2, ClipboardList, Contact, FilePlus2, MapPinned, Tags, Truck, Users, type LucideIcon } from "lucide-react";
import type { NavIcon } from "./nav-config";

/** Icons are looked up by name so the menu config can cross the server → client boundary. */
export const NAV_ICONS: Record<NavIcon, LucideIcon> = {
  filePlus: FilePlus2,
  clipboardList: ClipboardList,
  building: Building2,
  truck: Truck,
  contact: Contact,
  mapPinned: MapPinned,
  users: Users,
  tags: Tags,
  activity: Activity,
};
