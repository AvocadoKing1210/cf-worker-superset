/**
 * Cloudflare Worker entrypoint
 */

import type { Env } from './types';
import { handleRequest } from './routes';

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    return handleRequest(request, env);
  },
};
