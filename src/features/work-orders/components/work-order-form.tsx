"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, CircleAlert, LoaderCircle, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useLayoutEffect, useState } from "react";
import { Controller, useFieldArray, useForm, useWatch, type Control, type UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import { applyFieldErrors } from "@/components/form/apply-field-errors";
import { AutocompleteField, type Suggestion } from "@/components/form/autocomplete-field";
import { ComboboxField, type ComboboxOption } from "@/components/form/combobox-field";
import { DateTimeField } from "@/components/form/date-time-field";
import { TextField } from "@/components/form/text-field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FUEL_PRICES } from "@/features/routes/schemas";
import { formatMoney } from "@/lib/format";
import { createWorkOrderAction, updateWorkOrderAction } from "../actions";
import { feeOptions, isKnownPair, routePairs, singlePrice, type RouteOption } from "../route-prices";
import {
  EMPTY_VEHICLE_LINE,
  EMPTY_WORK_ORDER,
  workOrderSchema,
  type WorkOrderFormValues,
  type WorkOrderInput,
} from "../schemas";
import type { WorkOrderEditData, WorkOrderFormOptions } from "../service";

type Form = UseFormReturn<WorkOrderFormValues, unknown, WorkOrderInput>;
type FormControl = Control<WorkOrderFormValues, unknown, WorkOrderInput>;

/** Suggested units until the real list is confirmed (Q16). */
const QUANTITY_UNITS = ["พาเลท", "กล่อง", "ชิ้น", "ลัง", "ถุง"];
const WEIGHT_UNITS = ["kg", "ตัน"];
const COUNT_ITEMS = Array.from({ length: 16 }, (_, n) => ({ value: String(n), label: String(n) }));

const unique = (values: string[]) => [...new Set(values)];

/**
 * WO-01..09 · design 02 §3.3: five sections, saved in one transaction.
 * With `edit`, the same form changes an existing work order (WO-14).
 */
export function WorkOrderForm({ options, edit }: { options: WorkOrderFormOptions; edit?: WorkOrderEditData }) {
  const router = useRouter();
  const form = useForm<WorkOrderFormValues, unknown, WorkOrderInput>({
    resolver: zodResolver(workOrderSchema),
    defaultValues: edit?.values ?? EMPTY_WORK_ORDER,
  });
  const lines = useFieldArray({ control: form.control, name: "vehicles" });
  const [summary, setSummary] = useState<string | null>(null);
  const submitting = form.formState.isSubmitting;
  const ids = { customer: useId(), status: useId(), receive: useId(), delivery: useId() };

  // Next.js keeps visited pages alive (Activity). Start fresh every time the
  // user comes back: no leftovers from the last work order or an abandoned
  // draft (user request 2026-11-27).
  const { reset } = form;
  useLayoutEffect(() => {
    return () => {
      reset();
      setSummary(null);
    };
  }, [reset]);

  const customerOptions: ComboboxOption[] = options.customers.map((c) => ({ value: String(c.id), label: c.name }));
  const statusItems = options.statuses.map((s) => ({ value: String(s.code), label: s.name }));
  const vehiclesError = form.formState.errors.vehicles;

  async function onValid() {
    setSummary(null);
    // Raw values: the Server Action validates them again with the same schema.
    const values = form.getValues();
    const result = edit
      ? await updateWorkOrderAction({ id: edit.id, version: edit.version }, values)
      : await createWorkOrderAction(values);
    if (!result.ok) {
      applyFieldErrors(result, form.setError);
      setSummary(result.message);
      toast.error(result.message);
      return;
    }
    toast.success(result.message);
    if (!result.data) return;
    form.reset();
    router.push(`/work-orders/${result.data.id}`);
  }

  return (
    <form
      noValidate
      onSubmit={form.handleSubmit(onValid, () => setSummary("กรุณาแก้ไขข้อมูลที่มีข้อความสีแดงก่อนบันทึก"))}
      className="grid gap-6"
    >
      {summary ? (
        <Alert variant="destructive">
          <CircleAlert />
          <AlertDescription>{summary}</AlertDescription>
        </Alert>
      ) : null}

      <Section title="1. ผู้ว่าจ้าง">
        <div className="grid gap-4 md:grid-cols-3">
          <Controller
            name="customerId"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className="md:col-span-2">
                <FieldLabel htmlFor={ids.customer}>ผู้ว่าจ้าง *</FieldLabel>
                <ComboboxField
                  id={ids.customer}
                  options={customerOptions}
                  value={field.value}
                  onChange={field.onChange}
                  invalid={fieldState.invalid}
                  emptyText={options.customers.length === 0 ? "ยังไม่มีผู้ว่าจ้างที่ใช้งานอยู่" : "ไม่พบผู้ว่าจ้าง"}
                />
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
          <Controller
            name="statusCode"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={ids.status}>สถานะงาน</FieldLabel>
                <Select items={statusItems} value={field.value} onValueChange={(v) => field.onChange(v ?? "")}>
                  <SelectTrigger id={ids.status} className="w-full" aria-invalid={fieldState.invalid}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusItems.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
          <TextField control={form.control} name="orderedBy" label="ผู้สั่งงาน" />
        </div>
      </Section>

      <Section title="2. สถานที่รับ-ส่ง">
        <PlacesSection form={form} options={options} />
      </Section>

      <Section
        title="3. รถและการขนส่ง"
        action={
          <Button type="button" variant="outline" size="sm" onClick={() => lines.append(EMPTY_VEHICLE_LINE)}>
            <Plus />
            เพิ่มรถ
          </Button>
        }
      >
        {lines.fields.map((line, index) => (
          <VehicleLine
            key={line.id}
            control={form.control}
            form={form}
            index={index}
            options={options}
            canRemove={lines.fields.length > 1}
            onRemove={() => lines.remove(index)}
          />
        ))}
        {vehiclesError?.message || vehiclesError?.root?.message ? (
          <p role="alert" className="text-sm text-destructive">
            {vehiclesError.message ?? vehiclesError.root?.message}
          </p>
        ) : null}
      </Section>

      <Section title="4. ข้อมูลงาน">
        <div className="grid gap-4 md:grid-cols-2">
          <Controller
            name="receiveAt"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={ids.receive}>วันเวลารับงาน</FieldLabel>
                <DateTimeField
                  id={ids.receive}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  invalid={fieldState.invalid}
                />
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
          <Controller
            name="deliveryAt"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={ids.delivery}>วันเวลาส่งงาน</FieldLabel>
                <DateTimeField
                  id={ids.delivery}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  invalid={fieldState.invalid}
                />
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
          <TextField control={form.control} name="customerJobNo" label="Job No., Shipment" />
          <TextField control={form.control} name="remark" label="Remark" multiline />
        </div>
      </Section>

      <Section title="5. ค่าใช้จ่ายเพิ่มเติม">
        <div className="grid gap-4 md:grid-cols-3">
          <MoneyField control={form.control} name="portFee" label="ค่าผ่านท่า (บาท)" />
          <MoneyField control={form.control} name="demurrageFee" label="ค่าเสียเวลา (บาท)" />
          <div className="hidden md:block" />
          <CountField control={form.control} name="overnightNights" label="จำนวนคืน" />
          <MoneyField control={form.control} name="overnightLaborFee" label="ค่าแรงค้างคืน (บาท)" />
          <div className="hidden md:block" />
          <CountField control={form.control} name="extraWorkers" label="จำนวนคน" />
          <MoneyField control={form.control} name="extraWorkerFee" label="ค่าแรงคน (บาท)" />
        </div>
      </Section>

      <div className="flex justify-end gap-2">
        <Link href={edit ? `/work-orders/${edit.id}` : "/work-orders"} className={buttonVariants({ variant: "outline" })}>
          ยกเลิก
        </Link>
        <Button type="submit" disabled={submitting}>
          {submitting ? <LoaderCircle className="animate-spin" aria-hidden /> : null}
          {edit ? "บันทึกการแก้ไข" : "บันทึกใบงาน"}
        </Button>
      </div>
    </form>
  );
}

function Section({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {action ? <CardAction>{action}</CardAction> : null}
      </CardHeader>
      <CardContent className="grid gap-4">{children}</CardContent>
    </Card>
  );
}

function MoneyField({
  control,
  name,
  label,
}: {
  control: FormControl;
  name: "transportFee" | "portFee" | "demurrageFee" | "overnightLaborFee" | "extraWorkerFee";
  label: string;
}) {
  return <TextField control={control} name={name} label={label} inputMode="decimal" placeholder="0.00" />;
}

function CountField({
  control,
  name,
  label,
}: {
  control: FormControl;
  name: "overnightNights" | "extraWorkers";
  label: string;
}) {
  const id = useId();
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={id}>{label}</FieldLabel>
          <Select items={COUNT_ITEMS} value={field.value} onValueChange={(v) => field.onChange(v ?? "0")}>
            <SelectTrigger id={id} className="w-full" aria-invalid={fieldState.invalid}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COUNT_ITEMS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  );
}

/** "3,500.00 บาท", or "3,500.00–4,200.00 บาท" when the price depends on fuel price or vehicle type. */
function priceHint(prices: string[]): string | undefined {
  const low = prices[0];
  const high = prices[prices.length - 1];
  if (low === undefined || high === undefined) return undefined;
  return low === high ? `${formatMoney(low)} บาท` : `${formatMoney(low)}–${formatMoney(high)} บาท`;
}

/**
 * BR-WO-05 + WO-18 (user requests 2026-11-27 and 2026-11-28: D29, D38, D40):
 * the pickup list comes from the route list; once a known pickup is chosen,
 * the drop-off list shows only the places paired with it, with their price or
 * price range. ราคาน้ำมัน picks the column of the routes' price lists: picking
 * a drop-off or a fuel price fills ค่าขนส่ง (still editable) when exactly one
 * price fits, otherwise the prices that fit are offered under the fee. Vehicle
 * types already on the work order narrow them. Free text stays allowed.
 */
function PlacesSection({ form, options }: { form: Form; options: WorkOrderFormOptions }) {
  const pickup = useWatch({ control: form.control, name: "pickupLocation" }).trim();
  const dropoff = useWatch({ control: form.control, name: "dropoffLocation" }).trim();
  const fuel = useWatch({ control: form.control, name: "fuelPrice" });
  const lines = useWatch({ control: form.control, name: "vehicles" });

  const pairs = routePairs(options.routes);
  const routeCounts = new Map<string, number>();
  for (const pair of pairs) routeCounts.set(pair.pickup, (routeCounts.get(pair.pickup) ?? 0) + 1);
  const pickupSuggestions: Suggestion[] = [...routeCounts].map(([place, count]) => ({
    value: place,
    hint: `${count} ปลายทาง`,
  }));

  const paired = pairs.filter((pair) => pair.pickup === pickup);
  const dropoffSuggestions: Suggestion[] =
    paired.length > 0
      ? paired.map((pair) => ({ value: pair.dropoff, hint: priceHint(pair.prices) }))
      : unique(pairs.map((pair) => pair.dropoff)).map((place) => ({ value: place }));

  const vehicleTypeIds = lines.map((line) => Number(line.vehicleTypeId)).filter((id) => id > 0);
  const fuelPrice = fuel ? Number(fuel) : null;

  function fill(price: string) {
    form.setValue("transportFee", price, { shouldDirty: true, shouldValidate: true });
  }

  /** Fills ค่าขนส่ง when exactly one price fits these places at this fuel price. */
  function fillIfSingle(places: { pickup: string; dropoff: string }, atFuelPrice: number | null) {
    const price = singlePrice(feeOptions(options.routes, { ...places, fuelPrice: atFuelPrice, vehicleTypeIds }));
    if (price !== null) fill(price);
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <PlaceField form={form} name="pickupLocation" label="สถานที่รับ" suggestions={pickupSuggestions} />
      <TextField control={form.control} name="pickupContactName" label="ชื่อผู้ติดต่อ (ฝั่งรับ)" />
      <TextField control={form.control} name="pickupContactPhone" label="เบอร์โทร (ฝั่งรับ)" type="tel" inputMode="tel" />
      <PlaceField
        form={form}
        name="dropoffLocation"
        label="สถานที่ส่ง"
        suggestions={dropoffSuggestions}
        onPick={(place) => fillIfSingle({ pickup, dropoff: place }, fuelPrice)}
        description={paired.length > 0 ? `แสดงเฉพาะปลายทางของ “${pickup}” พร้อมราคา` : undefined}
      />
      <TextField control={form.control} name="dropoffContactName" label="ชื่อผู้ติดต่อ (ฝั่งส่ง)" />
      <TextField control={form.control} name="dropoffContactPhone" label="เบอร์โทร (ฝั่งส่ง)" type="tel" inputMode="tel" />
      <FuelPriceField control={form.control} onPick={(value) => fillIfSingle({ pickup, dropoff }, value)} />
      <div className="grid content-start gap-2">
        <MoneyField control={form.control} name="transportFee" label="ค่าขนส่ง (บาท)" />
        <FeeOptions
          form={form}
          routes={options.routes}
          query={{ pickup, dropoff, fuelPrice, vehicleTypeIds }}
          onPick={fill}
        />
      </div>
    </div>
  );
}

const FUEL_ITEMS = [
  { value: "", label: "— ไม่ระบุ —" },
  ...FUEL_PRICES.map((fuelPrice) => ({ value: String(fuelPrice), label: String(fuelPrice) })),
];

/** ราคาน้ำมัน 25–50 (D40): saved with the work order; choosing one looks up ค่าขนส่ง. */
function FuelPriceField({ control, onPick }: { control: FormControl; onPick: (fuelPrice: number) => void }) {
  const id = useId();
  return (
    <Controller
      name="fuelPrice"
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={id}>ราคาน้ำมัน (บาท/ลิตร)</FieldLabel>
          <Select
            items={FUEL_ITEMS}
            value={field.value}
            onValueChange={(value) => {
              const next = value ?? "";
              field.onChange(next);
              if (next) onPick(Number(next));
            }}
          >
            <SelectTrigger id={id} className="w-full" aria-invalid={fieldState.invalid}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FUEL_ITEMS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldDescription>ใช้หาค่าขนส่งจากตารางราคาของสถานที่รับ-ส่ง</FieldDescription>
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  );
}

/** Same amount, whatever the commas or trailing zeros ("3,500" = "3500.00"); display only. */
const sameAmount = (price: string, typed: string) =>
  typed.trim() !== "" && Number(typed.replace(/,/g, "")) === Number(price);

/** The prices from the price list that fit, as buttons that fill ค่าขนส่ง. */
function FeeOptions({
  form,
  routes,
  query,
  onPick,
}: {
  form: Form;
  routes: RouteOption[];
  query: { pickup: string; dropoff: string; fuelPrice: number | null; vehicleTypeIds: number[] };
  onPick: (price: string) => void;
}) {
  const fee = useWatch({ control: form.control, name: "transportFee" });
  if (!query.pickup || !query.dropoff || !isKnownPair(routes, query.pickup, query.dropoff)) return null;

  const byFuel = routes.some(
    (route) => route.pickup === query.pickup && route.dropoff === query.dropoff && route.rates.length > 0,
  );
  if (query.fuelPrice === null && byFuel) {
    return <p className="text-sm text-muted-foreground">ราคาขึ้นกับราคาน้ำมัน — เลือกราคาน้ำมันเพื่อเติมค่าขนส่ง</p>;
  }

  const choices = feeOptions(routes, query);
  if (choices.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        ยังไม่มีราคาที่ราคาน้ำมัน {query.fuelPrice} บาทสำหรับคู่สถานที่นี้ — กรอกค่าขนส่งเอง
      </p>
    );
  }
  // Old single-price routes without a fuel price: one price is filled on pick already.
  if (query.fuelPrice === null && singlePrice(choices) !== null) return null;
  return (
    <div className="grid gap-1.5">
      <p className="text-sm text-muted-foreground">
        {query.fuelPrice === null ? "ราคาของคู่สถานที่นี้" : `ราคาตามตาราง (น้ำมัน ${query.fuelPrice} บาท)`} กดเพื่อใช้
      </p>
      <div className="flex flex-wrap gap-1.5">
        {choices.map((choice) => {
          const inUse = sameAmount(choice.price, fee);
          return (
            <Button
              key={`${choice.vehicleTypeName ?? ""}|${choice.price}`}
              type="button"
              size="xs"
              variant={inUse ? "secondary" : "outline"}
              aria-pressed={inUse}
              onClick={() => onPick(choice.price)}
            >
              {inUse ? <Check /> : null}
              {choice.vehicleTypeName ?? "ราคาเดิม"} · {formatMoney(choice.price)}
            </Button>
          );
        })}
      </div>
    </div>
  );
}

function PlaceField({
  form,
  name,
  label,
  suggestions,
  onPick,
  description,
}: {
  form: Form;
  name: "pickupLocation" | "dropoffLocation";
  label: string;
  suggestions: Suggestion[];
  onPick?: (value: string) => void;
  description?: string;
}) {
  const id = useId();
  return (
    <Controller
      name={name}
      control={form.control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={id}>{label}</FieldLabel>
          <AutocompleteField
            id={id}
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            onPick={(suggestion) => onPick?.(suggestion.value)}
            suggestions={suggestions}
            invalid={fieldState.invalid}
          />
          {description ? <FieldDescription>{description}</FieldDescription> : null}
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  );
}

/** One vehicle line (BR-WO-07/08): picking a vehicle fills its type; picking a driver shows the phone. */
function VehicleLine({
  control,
  form,
  index,
  options,
  canRemove,
  onRemove,
}: {
  control: FormControl;
  form: Form;
  index: number;
  options: WorkOrderFormOptions;
  canRemove: boolean;
  onRemove: () => void;
}) {
  const ids = { type: useId(), driver: useId(), vehicle: useId(), phone: useId(), qtyUnits: useId(), wUnits: useId() };
  const typeId = useWatch({ control, name: `vehicles.${index}.vehicleTypeId` });
  const driverId = useWatch({ control, name: `vehicles.${index}.driverId` });

  const typeItems = [
    { value: "", label: "— ไม่ระบุ —" },
    ...options.vehicleTypes.map((t) => ({ value: String(t.id), label: t.name })),
  ];
  const driverOptions = options.drivers.map((d) => ({ value: String(d.id), label: d.name }));
  const vehicleOptions = options.vehicles
    .filter((v) => !typeId || String(v.vehicleTypeId) === typeId)
    .map((v) => ({ value: String(v.id), label: v.plateNo }));
  const driverPhone = options.drivers.find((d) => String(d.id) === driverId)?.phone ?? "";

  return (
    <fieldset className="grid gap-4 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <legend className="text-sm font-medium">รถคันที่ {index + 1}</legend>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRemove}
          disabled={!canRemove}
          title={canRemove ? undefined : "ต้องมีข้อมูลรถอย่างน้อย 1 รายการ"}
        >
          <Trash2 />
          ลบ
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <Controller
          name={`vehicles.${index}.vehicleTypeId`}
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={ids.type}>ประเภทรถ</FieldLabel>
              <Select items={typeItems} value={field.value} onValueChange={(v) => field.onChange(v ?? "")}>
                <SelectTrigger id={ids.type} className="w-full" aria-invalid={fieldState.invalid}>
                  <SelectValue placeholder="เลือกประเภทรถ" />
                </SelectTrigger>
                <SelectContent>
                  {typeItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
        <Controller
          name={`vehicles.${index}.vehicleId`}
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={ids.vehicle}>ทะเบียน</FieldLabel>
              <ComboboxField
                id={ids.vehicle}
                options={vehicleOptions}
                value={field.value}
                onChange={(value) => {
                  field.onChange(value);
                  const vehicle = options.vehicles.find((v) => String(v.id) === value);
                  if (vehicle) form.setValue(`vehicles.${index}.vehicleTypeId`, String(vehicle.vehicleTypeId));
                }}
                invalid={fieldState.invalid}
                emptyText={typeId ? "ไม่มีรถของประเภทนี้" : "ไม่พบทะเบียน"}
              />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
        <Controller
          name={`vehicles.${index}.driverId`}
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={ids.driver}>พนักงานขับรถ</FieldLabel>
              <ComboboxField
                id={ids.driver}
                options={driverOptions}
                value={field.value}
                onChange={field.onChange}
                invalid={fieldState.invalid}
                emptyText="ไม่พบพนักงานขับรถ"
              />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
        <Field>
          <FieldLabel htmlFor={ids.phone}>เบอร์ พขร.</FieldLabel>
          <Input id={ids.phone} value={driverPhone} readOnly placeholder="ขึ้นเองเมื่อเลือกคนขับ" tabIndex={-1} />
        </Field>
      </div>
      <datalist id={ids.qtyUnits}>
        {QUANTITY_UNITS.map((unit) => (
          <option key={unit} value={unit} />
        ))}
      </datalist>
      <datalist id={ids.wUnits}>
        {WEIGHT_UNITS.map((unit) => (
          <option key={unit} value={unit} />
        ))}
      </datalist>
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-5">
        <TextField control={control} name={`vehicles.${index}.quantity`} label="จำนวน" inputMode="decimal" />
        <TextField control={control} name={`vehicles.${index}.quantityUnit`} label="หน่วย" list={ids.qtyUnits} placeholder="พาเลท" />
        <TextField control={control} name={`vehicles.${index}.weight`} label="น้ำหนัก" inputMode="decimal" />
        <TextField control={control} name={`vehicles.${index}.weightUnit`} label="หน่วย" list={ids.wUnits} placeholder="kg" />
        <TextField control={control} name={`vehicles.${index}.dimensions`} label="ขนาด" />
      </div>
    </fieldset>
  );
}
