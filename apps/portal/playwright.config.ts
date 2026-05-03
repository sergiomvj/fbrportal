import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  webServer: {
    command:
      'set SESSION_SECRET=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa&& set SUPABASE_URL=https://example.supabase.co&& set SUPABASE_ANON_KEY=anon-key&& set NEXTAUTH_URL=http://127.0.0.1:3101&& set OPENCLAW_GATEWAY_URL=http://127.0.0.1:8000&& next dev -p 3101',
    url: 'http://127.0.0.1:3101/login',
    reuseExistingServer: false,
    timeout: 120_000,
  },
  use: {
    baseURL: 'http://127.0.0.1:3101',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
