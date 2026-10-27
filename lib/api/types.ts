// This file holds the types of the backend response wrapper and of the API errors.

/** The wrapper the backend puts around every response. */
export type ApiEnvelope<T> = {
  statusCode: number;
  isSuccess: boolean;
  data: T;
  errors: unknown;
  timestamp: string;
};

/** Why an API call failed. */
export type ApiErrorKind = "network" | "timeout" | "server" | "missing_config";
