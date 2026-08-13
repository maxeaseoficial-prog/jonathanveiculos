import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const loginAttemptInput = z.object({
  username: z.string().trim().min(1),
});

/**
 * Rate limiting state (In-memory for server functions)
 * In a real production environment with multiple workers, this should be in Redis
 * or a database table. For TanStack Start on Cloudflare Workers, we use a simple
 * in-memory map as a starting point, but note that it's per-isolate.
 */
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_ATTEMPTS = 5;
const BLOCK_WINDOW = 15 * 60 * 1000; // 15 minutes

export const checkRateLimit = createServerFn({ method: "POST" })
  .inputValidator((data) => loginAttemptInput.parse(data))
  .handler(async ({ data }) => {
    const { getRequest } = await import("@tanstack/react-start/server");
    const request = getRequest();
    
    // Get client IP from headers
    const ip = request.headers.get("x-forwarded-for") || 
               request.headers.get("cf-connecting-ip") || 
               "unknown";
    
    const key = `${ip}:${data.username.toLowerCase()}`;
    const now = Date.now();
    const attempt = loginAttempts.get(key);

    if (attempt) {
      // Check if the block window has passed
      if (attempt.count >= MAX_ATTEMPTS && now - attempt.lastAttempt < BLOCK_WINDOW) {
        throw new Error("Muitas tentativas de acesso. Aguarde alguns minutos e tente novamente.");
      }
      
      // Reset if window passed
      if (now - attempt.lastAttempt >= BLOCK_WINDOW) {
        loginAttempts.set(key, { count: 1, lastAttempt: now });
      } else {
        // Increment count
        loginAttempts.set(key, { count: attempt.count + 1, lastAttempt: now });
      }
    } else {
      loginAttempts.set(key, { count: 1, lastAttempt: now });
    }

    return { allowed: true };
  });

export const resetRateLimit = createServerFn({ method: "POST" })
  .inputValidator((data) => loginAttemptInput.parse(data))
  .handler(async ({ data }) => {
    const { getRequest } = await import("@tanstack/react-start/server");
    const request = getRequest();
    
    const ip = request.headers.get("x-forwarded-for") || 
               request.headers.get("cf-connecting-ip") || 
               "unknown";
    const key = `${ip}:${data.username.toLowerCase()}`;
    loginAttempts.delete(key);
    return { reset: true };
  });
