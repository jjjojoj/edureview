import { defineEventHandler, toWebRequest } from "@tanstack/react-start/server";
import { env } from "~/server/env";

interface LogEntry {
  level: string;
  message: string;
  timestamp: Date;
  url?: string;
  userAgent?: string;
  stacks?: string[];
  extra?: unknown;
}

interface ClientLogRequest {
  logs: LogEntry[];
}

// Only enable in development mode
const isDev = env.NODE_ENV === "development";

export default defineEventHandler(async (event) => {
  // Disable in production
  if (!isDev) {
    return new Response("Not available", { status: 404 });
  }

  const request = toWebRequest(event);
  if (!request || request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const body = (await request.json()) as ClientLogRequest;

    if (!body.logs || !Array.isArray(body.logs)) {
      return new Response("Invalid request body", { status: 400 });
    }

    // Limit to prevent abuse - max 50 log entries per request
    const logs = body.logs.slice(0, 50);

    // Forward each log to the server console
    logs.forEach((log) => {
      const timestamp = new Date(log.timestamp).toLocaleTimeString();
      const location = log.url ? ` (${log.url})` : "";
      const prefix = `[browser] [${timestamp}]`;

      let message = `${prefix} [${log.level}] ${log.message}${location}`;

      // Add stack traces if available
      if (log.stacks && log.stacks.length > 0) {
        message +=
          "\n" +
          log.stacks
            .map((stack) =>
              stack
                .split("\n")
                .map((line) => `    ${line}`)
                .join("\n"),
            )
            .join("\n");
      }

      // Add extra data if available (skip if too large)
      if (log.extra) {
        const extraStr = JSON.stringify(log.extra);
        if (extraStr.length < 2048) {
          message +=
            "\n    Extra data: " +
            extraStr
              .split("\n")
              .map((line, i) => (i === 0 ? line : `    ${line}`))
              .join("\n");
        }
      }

      // Log to server console based on level
      switch (log.level) {
        case "error":
          console.error(message);
          break;
        case "warn":
          console.warn(message);
          break;
        case "info":
          console.info(message);
          break;
        case "debug":
          console.log(message);
          break;
        default:
          console.log(message);
      }
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error processing client logs:", error);
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
});
