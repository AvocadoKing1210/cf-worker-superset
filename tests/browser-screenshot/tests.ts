import { TestSuite, TestResult } from '../types';
import { BrowserTestConfig, ScreenshotTest, ScreenshotResult } from './types';
import { BrowserRenderer, generateSelectorFromColumns, saveScreenshotToFile } from './utils/browser';
import { postJson } from '../utils/http';

export const browserScreenshotTestSuite: TestSuite = {
  name: 'Browser Screenshot Tests',
  tests: [
    {
      name: 'Weather Code Chart Screenshot',
      run: async (config: BrowserTestConfig): Promise<TestResult> => {
        const startTime = Date.now();
        
        try {
          // Test configuration
          const test: ScreenshotTest = {
            name: 'weather-code-chart',
            sql: 'SELECT weather_code, AVG(cnt) AS avg_usage, COUNT(*) AS rows FROM london_bike_data GROUP BY weather_code ORDER BY avg_usage DESC LIMIT 10',
            database_id: 1,
            viz_type: 'table',
            expected_columns: ['weather_code', 'avg_usage', 'rows'],
            wait_for_selector: generateSelectorFromColumns(['weather_code']),
            description: 'Test screenshot of weather code chart with proper table headers'
          };

          console.log(`Testing chart creation for: ${test.name}`);
          console.log(`Waiting for selector: ${test.wait_for_selector}`);

          // Step 1: Create chart via our API
          const chartResponse = await postJson(
            `${config.worker_url}/charts/create`,
            {
              database_id: test.database_id,
              sql: test.sql,
              viz_type: test.viz_type,
            },
            config.timeout || 30
          );

          if (chartResponse.status !== 200) {
            return {
              success: false,
              message: `Chart creation failed: ${chartResponse.status} - ${JSON.stringify(chartResponse.data)}`,
            };
          }

          const chartData = chartResponse.data;
          if (!chartData.embed_url) {
            return {
              success: false,
              message: 'No embed_url returned from chart creation',
            };
          }

          console.log(`Chart created successfully`);
          console.log(`Embed URL: ${chartData.embed_url.substring(0, 50)}...`);

          // Step 2: Capture screenshot using Cloudflare Browser Rendering API
          const renderer = new BrowserRenderer(config.cloudflare_account_id, config.cloudflare_api_token);
          
          const screenshotResult = await renderer.captureScreenshot({
            url: chartData.embed_url,
            waitForSelector: test.wait_for_selector,
            timeout: 60000, // 1 minute
            fullPage: true,
          });

          if (!screenshotResult.success) {
            return {
              success: false,
              message: `Screenshot capture failed: ${screenshotResult.error}`,
            };
          }

          // Step 3: Save screenshot to file
          const filename = `${test.name}-${Date.now()}.png`;
          const filePath = saveScreenshotToFile(screenshotResult.screenshot!, filename);
          
          const responseTime = Date.now() - startTime;

          console.log(`Screenshot saved: ${filePath}`);
          console.log(`Response time: ${responseTime}ms`);

          return {
            success: true,
            message: `Screenshot test passed. File: ${filename}, Time: ${responseTime}ms`,
            data: {
              screenshot_path: filePath,
              filename: filename,
              embed_url: chartData.embed_url,
              response_time_ms: responseTime,
              wait_for_selector: test.wait_for_selector,
            },
          };

        } catch (error) {
          return {
            success: false,
            message: `Screenshot test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          };
        }
      },
    },
    {
      name: 'Temperature Chart Screenshot',
      run: async (config: BrowserTestConfig): Promise<TestResult> => {
        const startTime = Date.now();
        
        try {
          // Test configuration for temperature data
          const test: ScreenshotTest = {
            name: 'temperature-chart',
            sql: 'SELECT ROUND(t1) AS temperature, AVG(cnt) AS avg_usage, COUNT(*) AS rows FROM london_bike_data WHERE t1 IS NOT NULL GROUP BY ROUND(t1) ORDER BY temperature LIMIT 15',
            database_id: 1,
            viz_type: 'table',
            expected_columns: ['temperature', 'avg_usage', 'rows'],
            wait_for_selector: generateSelectorFromColumns(['temperature']),
            description: 'Test screenshot of temperature vs usage chart'
          };

          console.log(`Testing chart creation for: ${test.name}`);
          console.log(`Waiting for selector: ${test.wait_for_selector}`);

          // Step 1: Create chart via our API
          const chartResponse = await postJson(
            `${config.worker_url}/charts/create`,
            {
              database_id: test.database_id,
              sql: test.sql,
              viz_type: test.viz_type,
            },
            config.timeout || 30
          );

          if (chartResponse.status !== 200) {
            return {
              success: false,
              message: `Chart creation failed: ${chartResponse.status} - ${JSON.stringify(chartResponse.data)}`,
            };
          }

          const chartData = chartResponse.data;
          if (!chartData.embed_url) {
            return {
              success: false,
              message: 'No embed_url returned from chart creation',
            };
          }

          console.log(`✅ Chart created successfully`);

          // Step 2: Capture screenshot using Cloudflare Browser Rendering API
          const renderer = new BrowserRenderer(config.cloudflare_account_id, config.cloudflare_api_token);
          
          const screenshotResult = await renderer.captureScreenshot({
            url: chartData.embed_url,
            waitForSelector: test.wait_for_selector,
            timeout: 30000,
            fullPage: true,
          });

          if (!screenshotResult.success) {
            return {
              success: false,
              message: `Screenshot capture failed: ${screenshotResult.error}`,
            };
          }

          // Step 3: Save screenshot to file
          const filename = `${test.name}-${Date.now()}.png`;
          const filePath = saveScreenshotToFile(screenshotResult.screenshot!, filename);
          
          const responseTime = Date.now() - startTime;

          console.log(`📸 Screenshot saved: ${filePath}`);

          return {
            success: true,
            message: `Screenshot test passed. File: ${filename}, Time: ${responseTime}ms`,
            data: {
              screenshot_path: filePath,
              filename: filename,
              embed_url: chartData.embed_url,
              response_time_ms: responseTime,
              wait_for_selector: test.wait_for_selector,
            },
          };

        } catch (error) {
          return {
            success: false,
            message: `Screenshot test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          };
        }
      },
    },
  ],
};
