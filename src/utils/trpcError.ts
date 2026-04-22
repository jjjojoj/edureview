/**
 * Shared tRPC error handler — converts tRPC / fetch errors into
 * user-friendly Chinese messages.
 *
 * Usage:
 *   import { getErrorMessage } from "~/utils/trpcError";
 *   try { … } catch (err) {
 *     toast.error(getErrorMessage(err));
 *   }
 */

// Common tRPC / HTTP error code → Chinese message mapping
const ERROR_CODE_MAP: Record<string, string> = {
  UNAUTHORIZED: "认证失败，请重新登录",
  FORBIDDEN: "您没有权限执行此操作",
  NOT_FOUND: "请求的资源不存在",
  BAD_REQUEST: "请求参数有误，请检查后重试",
  INTERNAL_SERVER_ERROR: "服务器内部错误，请稍后重试",
  TIMEOUT: "请求超时，请检查网络后重试",
  TOO_MANY_REQUESTS: "操作过于频繁，请稍后再试",
  CONFLICT: "数据冲突，请刷新后重试",
  PARSE_ERROR: "服务器响应格式错误，请联系管理员",
  RATE_LIMITED: "请求过于频繁，请稍后再试",
  INVALID_INPUT: "输入信息有误，请检查后重试",
};

/**
 * Extract a user-friendly Chinese error message from any thrown error.
 *
 * Priority:
 *  1. Known tRPC error code  → mapped Chinese message
 *  2. JSON.parse / fetch hints → network / parse specific messages
 *  3. error.data?.zodError    → first Zod validation message
 *  4. error.message           → raw message (may be Chinese already)
 *  5. Fallback                → generic "操作失败"
 */
export function getErrorMessage(error: unknown): string {
  // Guard: null / undefined
  if (error == null) return "操作失败，请稍后重试";

  // Already a plain string
  if (typeof error === "string") return error;

  // Standard Error-like objects
  const err = error as Record<string, unknown>;
  const message = typeof err.message === "string" ? err.message : "";

  // 1. Network / JSON parse hints in message string
  if (message.includes("JSON.parse") || message.includes("Unexpected token")) {
    return "服务器响应格式错误，请检查网络连接或联系管理员";
  }
  if (message.includes("fetch") || message.includes("NetworkError") || message.includes("Failed to fetch")) {
    return "网络连接错误，请检查网络连接";
  }
  if (message.includes("timeout") || message.includes("Timeout")) {
    return "请求超时，请检查网络后重试";
  }

  // 2. tRPC error shape: { data: { code, zodError, ... } }
  const data = err.data as Record<string, unknown> | undefined;
  if (data) {
    const code = typeof data.code === "string" ? data.code : "";
    if (code && ERROR_CODE_MAP[code]) {
      return ERROR_CODE_MAP[code];
    }

    // Zod validation errors
    const zodError = data.zodError as { fieldErrors: Record<string, string[]> } | undefined;
    if (zodError?.fieldErrors) {
      const firstField = Object.values(zodError.fieldErrors)[0];
      if (Array.isArray(firstField) && firstField.length > 0) {
        return firstField[0];
      }
    }
  }

  // 3. Raw message (already may be Chinese)
  if (message) return message;

  // 4. Fallback
  return "操作失败，请稍后重试";
}
