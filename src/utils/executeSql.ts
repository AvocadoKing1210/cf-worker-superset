import type { Env, ExecuteSqlRequest, ExecuteSqlResponse, ExecuteSqlMeta, SupersetExecuteResult } from '../types';
import { authenticateWithSuperset } from './auth';

const DEFAULT_LIMIT = 1000;
const MAX_LIMIT = 10000;

function isSelectSingleStatement(sql: string): boolean {
  const trimmed = sql.trim();
  if (!/^\s*select\b/i.test(trimmed)) return false;
  const parts = trimmed.split(';').filter(s => s.trim().length > 0);
  return parts.length === 1;
}

function injectOrClampLimit(sql: string, full: boolean, requestedLimit?: number): { finalSql: string; meta: ExecuteSqlMeta } {
  let finalSql = sql;
  let effectiveLimit: number | null = null;
  let wasClamped = false;

  const hasLimit = /\blimit\s+\d+\b/i.test(sql);

  if (!full) {
    if (hasLimit) {
      const match = sql.match(/\blimit\s+(\d+)\b/i);
      const current = match ? Number(match[1]) : undefined;
      if (current && current > MAX_LIMIT) {
        wasClamped = true;
        effectiveLimit = MAX_LIMIT;
        finalSql = sql.replace(/\blimit\s+\d+\b/i, `LIMIT ${MAX_LIMIT}`);
      } else if (typeof current === 'number') {
        effectiveLimit = current;
      }
    } else {
      const target = requestedLimit && requestedLimit > 0 ? Math.min(requestedLimit, MAX_LIMIT) : DEFAULT_LIMIT;
      effectiveLimit = target;
      if (/;\s*$/.test(sql)) {
        finalSql = sql.replace(/;\s*$/, ` LIMIT ${target};`);
      } else {
        finalSql = `${sql} LIMIT ${target}`;
      }
    }
  } else if (requestedLimit != null) {
    const target = Math.min(Math.max(0, requestedLimit), MAX_LIMIT);
    if (!hasLimit) {
      effectiveLimit = target;
      if (/;\s*$/.test(sql)) {
        finalSql = sql.replace(/;\s*$/, ` LIMIT ${target};`);
      } else {
        finalSql = `${sql} LIMIT ${target}`;
      }
    } else {
      const match = sql.match(/\blimit\s+(\d+)\b/i);
      const current = match ? Number(match[1]) : undefined;
      if (current && current > MAX_LIMIT) {
        wasClamped = true;
        effectiveLimit = MAX_LIMIT;
        finalSql = sql.replace(/\blimit\s+\d+\b/i, `LIMIT ${MAX_LIMIT}`);
      } else if (typeof current === 'number') {
        effectiveLimit = current;
      }
    }
  }

  return {
    finalSql,
    meta: { full, effectiveLimit, wasClamped },
  };
}

export async function executeSql(env: Env, req: ExecuteSqlRequest): Promise<ExecuteSqlResponse> {
  if (!req || !req.database_id || !Number.isFinite(req.database_id)) {
    throw new Error('database_id is required and must be a number');
  }
  const sql = (req.sql || '').trim();
  if (!sql) {
    throw new Error('sql is required');
  }
  if (!isSelectSingleStatement(sql)) {
    throw new Error('Only single-statement SELECT queries are allowed');
  }

  const { finalSql, meta } = injectOrClampLimit(sql, !!req.full, req.limit);

  const auth = await authenticateWithSuperset(env as any);
  if (!auth.success || !auth.tokens?.csrfToken || !auth.tokens?.sessionCookies) {
    throw new Error(`Authentication to Superset failed: ${auth.error || 'unknown error'}`);
  }

  const baseUrl = env.SUPERSET_BASE_URL as string;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-CSRFToken': auth.tokens.csrfToken,
    'Cookie': auth.tokens.sessionCookies,
    'Referer': `${baseUrl}/sqllab/`,
    'Origin': baseUrl,
  };

  const payload = {
    database_id: req.database_id,
    sql: finalSql,
  };

  const resp = await fetch(`${baseUrl}/api/v1/sqllab/execute/`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  const text = await resp.text();
  let result: SupersetExecuteResult;
  try {
    result = text ? (JSON.parse(text) as SupersetExecuteResult) : {};
  } catch {
    result = { raw: text } as any;
  }

  if (!resp.ok) {
    const msg = `Superset SQL execution failed (${resp.status})`;
    throw new Error(`${msg}: ${typeof result === 'object' ? JSON.stringify(result) : String(result)}`);
  }

  return {
    status: 'ok',
    meta,
    result,
  };
}


