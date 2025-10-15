export interface BrowserTestConfig {
  worker_url: string;
  cloudflare_account_id: string;
  cloudflare_api_token: string;
  timeout?: number;
  retries?: number;
}

export interface ScreenshotTest {
  name: string;
  sql: string;
  database_id: number;
  viz_type: string;
  expected_columns: string[];
  wait_for_selector: string;
  description?: string;
}

export interface ScreenshotResult {
  test_name: string;
  success: boolean;
  screenshot_path?: string;
  error?: string;
  embed_url?: string;
  response_time_ms?: number;
}

export interface CloudflareRenderRequest {
  url: string;
  waitForSelector?: string;
  timeout?: number;
  fullPage?: boolean;
}

export interface CloudflareRenderResponse {
  success: boolean;
  screenshot?: string; // base64 encoded
  error?: string;
}
