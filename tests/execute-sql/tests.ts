/**
 * Execute SQL endpoint test cases
 */

import { TestCase, TestConfig } from '../types';
import { postJson } from '../utils/http';

function printTable(rows: any[], columns: string[]): void {
  const header = columns.join('\t');
  console.log(header);
  for (const row of rows) {
    const line = columns.map(c => String(row[c])).join('\t');
    console.log(line);
  }
}

async function testSampleRows(config: TestConfig): Promise<boolean> {
  const url = `${config.url}/execute-sql`;
  const body = {
    database_id: 1,
    sql: `SELECT id, timestamp\nFROM london_bike_data\nORDER BY timestamp\nLIMIT 10;`,
  };
  const res = await postJson(url, body, config.timeout);
  if (res.status !== 200) {
    console.log('Request failed', res);
    return false;
  }
  const data = res.data;
  const rows = data?.data || data?.result?.data || [];
  if (!Array.isArray(rows) || rows.length === 0) {
    console.log('No rows returned');
    return false;
  }
  console.log('\nSample rows (id, timestamp):');
  printTable(rows, ['id', 'timestamp']);
  return true;
}

export const executeSqlTests: TestCase[] = [
  { name: 'Sample Rows Pretty Print', run: testSampleRows },
  { name: 'Average Usage By Hour Of Day', run: async (config: TestConfig) => {
    const url = `${config.url}/execute-sql`;
    const body = {
      database_id: 1,
      sql: `SELECT EXTRACT(hour FROM timestamp) AS hour_of_day,\n             AVG(cnt) AS avg_usage,\n             COUNT(*) AS rows\n           FROM london_bike_data\n           GROUP BY EXTRACT(hour FROM timestamp)\n           ORDER BY hour_of_day\n           LIMIT 24;`,
    };
    const res = await postJson(url, body, config.timeout);
    if (res.status !== 200) {
      console.log('Request failed', res);
      return false;
    }
    const rows = res.data?.data || res.data?.result?.data || [];
    if (!Array.isArray(rows) || rows.length === 0) return false;
    console.log('\nAverage usage by hour of day:');
    printTable(rows, ['hour_of_day', 'avg_usage', 'rows']);
    return rows.length <= 24;
  } },
  { name: 'Average Usage By Day Type', run: async (config: TestConfig) => {
    const url = `${config.url}/execute-sql`;
    const body = {
      database_id: 1,
      sql: `SELECT CASE WHEN is_holiday THEN 'Holiday' ELSE 'Regular' END AS day_type,\n             AVG(cnt) AS avg_usage,\n             COUNT(*) AS rows\n           FROM london_bike_data\n           GROUP BY is_holiday\n           ORDER BY day_type;`,
    };
    const res = await postJson(url, body, config.timeout);
    if (res.status !== 200) {
      console.log('Request failed', res);
      return false;
    }
    const rows = res.data?.data || res.data?.result?.data || [];
    if (!Array.isArray(rows) || rows.length === 0) return false;
    console.log('\nAverage usage by day type:');
    printTable(rows, ['day_type', 'avg_usage', 'rows']);
    return rows.length >= 2;
  } },
  { name: 'Temperature vs Average Usage', run: async (config: TestConfig) => {
    const url = `${config.url}/execute-sql`;
    const body = {
      database_id: 1,
      sql: `SELECT ROUND(t1::numeric, 0) AS temp_c,\n             AVG(cnt) AS avg_usage,\n             COUNT(*) AS rows\n           FROM london_bike_data\n           WHERE t1 IS NOT NULL\n           GROUP BY ROUND(t1::numeric, 0)\n           ORDER BY temp_c\n           LIMIT 50;`,
    };
    const res = await postJson(url, body, config.timeout);
    if (res.status !== 200) {
      console.log('Request failed', res);
      return false;
    }
    const rows = res.data?.data || res.data?.result?.data || [];
    if (!Array.isArray(rows) || rows.length === 0) return false;
    console.log('\nTemperature vs average usage:');
    printTable(rows, ['temp_c', 'avg_usage', 'rows']);
    return true;
  } },
  { name: 'Top Weather Codes by Usage', run: async (config: TestConfig) => {
    const url = `${config.url}/execute-sql`;
    const body = {
      database_id: 1,
      sql: `SELECT weather_code,\n             AVG(cnt) AS avg_usage,\n             COUNT(*) AS rows\n           FROM london_bike_data\n           GROUP BY weather_code\n           ORDER BY avg_usage DESC\n           LIMIT 10;`,
    };
    const res = await postJson(url, body, config.timeout);
    if (res.status !== 200) {
      console.log('Request failed', res);
      return false;
    }
    const rows = res.data?.data || res.data?.result?.data || [];
    if (!Array.isArray(rows) || rows.length === 0) return false;
    console.log('\nTop 10 weather codes by average usage:');
    printTable(rows, ['weather_code', 'avg_usage', 'rows']);
    return rows.length <= 10;
  } },
];


