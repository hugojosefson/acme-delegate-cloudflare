export async function filterAsyncIterable<T>(
  asyncIterable: AsyncIterable<T>,
  predicate: (value: T) => Promise<boolean> | boolean,
): Promise<T[]> {
  const results: T[] = [];
  for await (const value of asyncIterable) {
    if (await predicate(value)) {
      results.push(value);
    }
  }
  return results;
}

export async function findInAsyncIterable<T>(
  asyncIterable: AsyncIterable<T>,
  predicate: (value: T) => Promise<boolean> | boolean,
): Promise<T | undefined> {
  for await (const value of asyncIterable) {
    if (await predicate(value)) {
      return value;
    }
  }
  return undefined;
}
