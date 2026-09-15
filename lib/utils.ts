import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Runs `worker` over `items` with at most `concurrency` in flight at once,
 * calling `onItemDone` as each one finishes (in completion order, not input
 * order) so callers can drive a live progress counter. Stops picking up new
 * items once `isCancelled()` returns true, but lets in-flight ones finish.
 */
export async function runWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>,
  onItemDone?: (item: T, index: number, result: R | null, error: unknown) => void,
  isCancelled?: () => boolean
): Promise<void> {
  let cursor = 0;

  async function runNext(): Promise<void> {
    while (cursor < items.length) {
      if (isCancelled?.()) return;
      const index = cursor++;
      const item = items[index];
      try {
        const result = await worker(item, index);
        onItemDone?.(item, index, result, null);
      } catch (error) {
        onItemDone?.(item, index, null, error);
      }
    }
  }

  const runners = Array.from({ length: Math.min(concurrency, items.length) }, () => runNext());
  await Promise.all(runners);
}
