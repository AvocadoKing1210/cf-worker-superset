import { CloudflareRenderRequest, CloudflareRenderResponse } from '../types';

export class BrowserRenderer {
  private accountId: string;
  private apiToken: string;

  constructor(accountId: string, apiToken: string) {
    this.accountId = accountId;
    this.apiToken = apiToken;
  }

  private startLoadingIndicator(timeoutMs: number): NodeJS.Timeout {
    let elapsed = 0;
    const interval = setInterval(() => {
      elapsed += 5000;
      if (elapsed < timeoutMs) {
        console.log(`Loading... ${elapsed/1000}s elapsed (waiting for selector)`);
      }
    }, 5000);
    return interval;
  }

  async captureScreenshot(request: CloudflareRenderRequest): Promise<CloudflareRenderResponse> {
    const url = `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/browser-rendering/screenshot`;
    
    const payload: any = {
      url: request.url,
      screenshotOptions: {
        fullPage: request.fullPage || false,
        type: 'png'
      }
    };

    // Add waitForSelector if provided
    if (request.waitForSelector) {
      payload.waitForSelector = {
        selector: request.waitForSelector,
        timeout: request.timeout || 60000 // 1 minute max
      };
    }

    try {
      // Start loading indicator if we're waiting for a selector
      let loadingInterval: NodeJS.Timeout | null = null;
      if (request.waitForSelector) {
        const timeoutMs = request.timeout || 60000;
        loadingInterval = this.startLoadingIndicator(timeoutMs);
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
          'Accept': 'image/png',
        },
        body: JSON.stringify(payload),
      });

      // Clear loading indicator
      if (loadingInterval) {
        clearInterval(loadingInterval);
      }

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: `HTTP ${response.status}: ${errorText}`,
        };
      }

      // The API returns binary PNG data when successful
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('image/png')) {
        const buffer = await response.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        return {
          success: true,
          screenshot: base64,
        };
      } else {
        // If not PNG, it might be an error response
        const errorText = await response.text();
        return {
          success: false,
          error: `Unexpected response type: ${contentType}. Response: ${errorText}`,
        };
      }
    } catch (error) {
      // Clear loading indicator if it was started
      if (loadingInterval) {
        clearInterval(loadingInterval);
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

export function generateSelectorFromColumns(columns: string[]): string {
  // Generate selector for the first column header
  if (columns.length === 0) return '';
  const firstColumn = columns[0];
  // Use the ID selector for the table header
  return `#header-${firstColumn}`;
}

export function saveScreenshotToFile(base64Data: string, filename: string): string {
  const fs = require('fs');
  const path = require('path');
  
  // Create screenshots directory if it doesn't exist
  const screenshotsDir = path.join(process.cwd(), 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }
  
  // Remove data URL prefix if present
  const base64 = base64Data.replace(/^data:image\/png;base64,/, '');
  
  // Save to file
  const filePath = path.join(screenshotsDir, filename);
  fs.writeFileSync(filePath, base64, 'base64');
  
  return filePath;
}
