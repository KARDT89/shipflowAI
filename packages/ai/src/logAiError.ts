type AiErrorLike = {
  message?: unknown
  statusCode?: unknown
  responseBody?: unknown
  data?: unknown
  isRetryable?: unknown
}

export type AiErrorContext = {
  workflow: string
  model?: string
}

function getErrorDetails(error: unknown): AiErrorLike {
  if (typeof error !== "object" || error === null) {
    return { message: String(error) }
  }

  const record = error as Record<string, unknown>
  return {
    message:
      typeof record.message === "string" ? record.message : String(error),
    statusCode: record.statusCode,
    responseBody: record.responseBody,
    data: record.data,
    isRetryable: record.isRetryable,
  }
}

function formatDiagnosticValue(value: unknown) {
  if (typeof value === "undefined") return "unknown"
  if (typeof value === "string") return value

  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

export function getAiErrorDiagnosticMessage(
  error: unknown,
  context: AiErrorContext
) {
  const details = getErrorDetails(error)

  return [
    "[ai] provider call failed",
    `workflow=${context.workflow}`,
    `model=${context.model ?? "unknown"}`,
    `message=${formatDiagnosticValue(details.message)}`,
    `statusCode=${formatDiagnosticValue(details.statusCode)}`,
    `responseBody=${formatDiagnosticValue(details.responseBody)}`,
    `data=${formatDiagnosticValue(details.data)}`,
    `isRetryable=${formatDiagnosticValue(details.isRetryable)}`,
  ].join(" ")
}

export function logAiError(error: unknown, context: AiErrorContext) {
  const details = getErrorDetails(error)

  console.error("[ai] provider call failed", {
    workflow: context.workflow,
    model: context.model,
    message: details.message,
    statusCode: details.statusCode,
    responseBody: details.responseBody,
    data: details.data,
    isRetryable: details.isRetryable,
  })
}
