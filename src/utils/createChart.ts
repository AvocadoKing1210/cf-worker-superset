import type {
  Env,
  ChartCreateRequest,
  ChartCreateResponse,
  ExecuteSqlRequest,
  ExecuteSqlMeta,
} from '../types';
import { authenticateWithSuperset } from './auth';
import { executeSql } from './executeSql';

function buildDefaultParams(
  datasource: string,
  vizType: string,
  requestParams?: Record<string, unknown>,
  allColumns?: string[],
) {
  const base = {
    time_range: 'No filter',
    row_limit: 1000,
    datasource,
    viz_type: vizType,
    metrics: [],
    groupby: [],
    all_columns: allColumns || [],
  } as Record<string, unknown>;
  return { ...base, ...(requestParams || {}) };
}

export async function createChart(env: Env, req: ChartCreateRequest): Promise<ChartCreateResponse> {
  // Determine datasource
  let datasource: string;
  let queryIdNum: number | undefined;
  let meta: ExecuteSqlMeta | undefined;

  let allColumns: string[] | undefined;

  if ('query_id' in req) {
    datasource = `${req.query_id}__query`;
    queryIdNum = req.query_id;
  } else {
    const sqlReq: ExecuteSqlRequest = {
      database_id: req.database_id,
      sql: req.sql,
      full: !!req.full,
      limit: typeof req.limit === 'number' ? req.limit : undefined as unknown as number,
    };
    const sqlResult = await executeSql(env, sqlReq);
    const queryId = (sqlResult.result as any)?.query?.queryId || (sqlResult as any)?.query_id || (sqlResult.result as any)?.query_id;
    datasource = `${queryId}__query`;
    queryIdNum = Number(queryId);
    meta = sqlResult.meta;
    const cols = (sqlResult.result as any)?.columns || (sqlResult.result as any)?.query?.extra?.columns;
    if (Array.isArray(cols)) {
      allColumns = cols.map((c: any) => c?.name || c?.column_name).filter(Boolean);
    }
  }

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
    'Referer': `${baseUrl}/explore/`,
    'Origin': baseUrl,
  };

  // Explore URL (recommended default)
  const form_data = buildDefaultParams(datasource, (req as any).viz_type, (req as any).params, allColumns);

  const formDataPayload: Record<string, unknown> = {
    datasource_id: queryIdNum,
    datasource_type: 'query',
    form_data: JSON.stringify(form_data),
  };

  const formDataResp = await fetch(`${baseUrl}/api/v1/explore/form_data`, {
    method: 'POST',
    headers,
    body: JSON.stringify(formDataPayload),
  });

  const formDataJson: any = await formDataResp.json().catch(() => ({}));
  if (!formDataResp.ok || !formDataJson || !formDataJson.key) {
    throw new Error(`Failed to create form_data: ${formDataResp.status}`);
  }

  const form_data_key = String(formDataJson.key);
  const explore_url = `${baseUrl}/explore/?form_data_key=${form_data_key}` +
    (queryIdNum ? `&datasource_id=${queryIdNum}&datasource_type=query` : '');

  // Create permalink for stable/embeddable code
  const permalinkResp = await fetch(`${baseUrl}/api/v1/explore/permalink`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      formData: form_data,
      urlParams: [],
    }),
  });
  let embed_url: string | undefined;
  if (permalinkResp.ok) {
    const permalinkJson: any = await permalinkResp.json().catch(() => ({}));
    const urlFromApi = permalinkJson?.url as string | undefined;
    const key = permalinkJson?.key as string | undefined;
    if (urlFromApi) {
      // API returned full URL suitable for embedding
      embed_url = urlFromApi.includes('?') ? `${urlFromApi}&standalone=1` : `${urlFromApi}?standalone=1`;
    } else if (key) {
      // Construct from key
      embed_url = `${baseUrl}/superset/explore/p/${key}/?standalone=1`;
    }
  }

  const resp: any = {
    status: 'ok',
    datasource,
    viz_type: (req as any).viz_type,
    explore_url,
    form_data_key,
    meta: meta || { full: false, effectiveLimit: null, wasClamped: false },
  };
  if (embed_url) resp.embed_url = embed_url;
  return resp;
}


