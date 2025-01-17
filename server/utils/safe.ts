type Unwrap<T> = T extends Promise<infer R> ? R : T;

export function safe<T extends (...args: any[]) => any>(
  fn: T
): (...args: Parameters<T>) => Promise<Unwrap<ReturnType<T>> | null> {
  return async (
    ...args: Parameters<T>
  ): Promise<Unwrap<ReturnType<T>> | null> => {
    try {
      return await fn(...args);
    } catch (error) {
      return null;
    }
  };
}
