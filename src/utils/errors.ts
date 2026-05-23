export class AppError extends Error {
  constructor(
    message: string,
    public readonly userMessage: string,
    public readonly retryable = false
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function toUserMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.userMessage;
  }

  if (error instanceof Error) {
    if (error.name === 'AbortError') {
      return 'The operation timed out. Check the network connection and try again.';
    }
    return error.message;
  }

  return 'Something went wrong. Try again or check the app configuration.';
}
