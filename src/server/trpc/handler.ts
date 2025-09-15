import { defineEventHandler, toWebRequest } from "@tanstack/react-start/server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./root";

export default defineEventHandler((event) => {
  const request = toWebRequest(event);
  if (!request) {
    console.error("No request received in tRPC handler");
    return new Response("No request", { status: 400 });
  }

  console.log(`[tRPC] ${request.method} ${request.url}`);

  return fetchRequestHandler({
    endpoint: "/trpc",
    req: request,
    router: appRouter,
    createContext() {
      return {};
    },
    onError({ error, path, input }) {
      console.error(`[tRPC ERROR] Path: ${path}`);
      console.error(`[tRPC ERROR] Input:`, input);
      console.error(`[tRPC ERROR] Error:`, error);
      
      // Log additional details for debugging
      if (error.cause) {
        console.error(`[tRPC ERROR] Cause:`, error.cause);
      }
      
      if (error.stack) {
        console.error(`[tRPC ERROR] Stack:`, error.stack);
      }
    },
  });
});
