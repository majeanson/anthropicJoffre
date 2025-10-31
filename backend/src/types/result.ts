/**
 * Result type for explicit error handling
 *
 * Replaces exception-based error handling with explicit success/failure values.
 * This makes error handling more visible and forces callers to handle errors.
 *
 * Benefits:
 * - More explicit error handling
 * - No hidden control flow (exceptions)
 * - Easier to test
 * - Better for functional programming patterns
 *
 * @example
 * ```typescript
 * function divide(a: number, b: number): Result<number, string> {
 *   if (b === 0) {
 *     return { success: false, error: 'Division by zero' };
 *   }
 *   return { success: true, value: a / b };
 * }
 *
 * const result = divide(10, 2);
 * if (result.success) {
 *   console.log(result.value); // 5
 * } else {
 *   console.error(result.error);
 * }
 * ```
 */

/**
 * Success result containing a value
 */
export interface Success<T> {
  success: true;
  value: T;
}

/**
 * Failure result containing an error
 */
export interface Failure<E> {
  success: false;
  error: E;
}

/**
 * Result type - either Success or Failure
 *
 * @template T - Type of success value
 * @template E - Type of error (defaults to string for simple error messages)
 */
export type Result<T, E = string> = Success<T> | Failure<E>;

/**
 * Create a success result
 *
 * @example
 * ```typescript
 * return ok(42);
 * // { success: true, value: 42 }
 * ```
 */
export function ok<T>(value: T): Success<T> {
  return { success: true, value };
}

/**
 * Create a failure result
 *
 * @example
 * ```typescript
 * return err('Something went wrong');
 * // { success: false, error: 'Something went wrong' }
 * ```
 */
export function err<E>(error: E): Failure<E> {
  return { success: false, error };
}

/**
 * Type guard to check if result is success
 *
 * @example
 * ```typescript
 * const result = divide(10, 2);
 * if (isSuccess(result)) {
 *   console.log(result.value); // TypeScript knows this is Success
 * }
 * ```
 */
export function isSuccess<T, E>(result: Result<T, E>): result is Success<T> {
  return result.success === true;
}

/**
 * Type guard to check if result is failure
 *
 * @example
 * ```typescript
 * const result = divide(10, 0);
 * if (isFailure(result)) {
 *   console.error(result.error); // TypeScript knows this is Failure
 * }
 * ```
 */
export function isFailure<T, E>(result: Result<T, E>): result is Failure<E> {
  return result.success === false;
}

/**
 * Map a success value to a new value
 * Leaves failure unchanged
 *
 * @example
 * ```typescript
 * const result = ok(5);
 * const doubled = mapResult(result, x => x * 2);
 * // { success: true, value: 10 }
 * ```
 */
export function mapResult<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => U
): Result<U, E> {
  if (result.success) {
    return ok(fn(result.value));
  }
  return result;
}

/**
 * Chain multiple Result-returning operations
 * Short-circuits on first failure
 *
 * @example
 * ```typescript
 * const result = ok(10)
 *   .then(x => divide(x, 2))  // ok(5)
 *   .then(x => divide(x, 0))  // err('Division by zero')
 *   .then(x => ok(x * 2));    // Never runs
 * ```
 */
export function andThen<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>
): Result<U, E> {
  if (result.success) {
    return fn(result.value);
  }
  return result;
}

/**
 * Unwrap a Result, throwing if it's a failure
 * Use sparingly - prefer explicit error handling
 *
 * @throws {Error} If result is a failure
 *
 * @example
 * ```typescript
 * const value = unwrap(ok(42)); // 42
 * const error = unwrap(err('Oops')); // throws Error('Oops')
 * ```
 */
export function unwrap<T, E>(result: Result<T, E>): T {
  if (result.success) {
    return result.value;
  }
  throw new Error(String(result.error));
}

/**
 * Unwrap a Result with a default value for failures
 *
 * @example
 * ```typescript
 * const value = unwrapOr(ok(42), 0); // 42
 * const value = unwrapOr(err('Oops'), 0); // 0
 * ```
 */
export function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
  if (result.success) {
    return result.value;
  }
  return defaultValue;
}
