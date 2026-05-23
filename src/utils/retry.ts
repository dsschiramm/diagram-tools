import { AppError } from './errors.js';

const DEFAULT_DELAYS = [2000, 4000, 8000];

export async function retryWithBackoff<T>(
  task: () => Promise<T>,
  shouldRetry: (error: unknown) => boolean = defaultRetryPredicate,
  delays = DEFAULT_DELAYS
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= delays.length; attempt += 1) {
    try {
      return await task();
    } catch (error) {
      lastError = error;
      if (attempt === delays.length || !shouldRetry(error)) {
        throw error;
      }
      await sleep(delays[attempt]);
    }
  }

  throw lastError;
}

function defaultRetryPredicate(error: unknown): boolean {
  return error instanceof AppError ? error.retryable : true;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
