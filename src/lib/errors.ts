export type AppErrorCode =
  | "INVOKE_FAILED"
  | "HARNESS"
  | "GIT"
  | "FS"
  | "VALIDATION"
  | "UNKNOWN";

export type AppError = {
  code: AppErrorCode;
  message: string;
};
