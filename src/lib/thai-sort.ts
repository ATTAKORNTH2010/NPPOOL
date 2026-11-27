/** Thai-aware ordering for lists and dropdowns (BR-MD-06). */
const collator = new Intl.Collator("th", { numeric: true, sensitivity: "base" });

export function thaiCompare(a: string, b: string): number {
  return collator.compare(a, b);
}

export function sortByThai<T>(rows: T[], ...keys: ((row: T) => string)[]): T[] {
  return [...rows].sort((a, b) => {
    for (const key of keys) {
      const result = collator.compare(key(a), key(b));
      if (result !== 0) return result;
    }
    return 0;
  });
}
