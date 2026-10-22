import { defineConfig, devices } from '@playwright/test'

/** E2Eで配信に使うHostingエミュレーターのポート (firebase.jsonと合わせる) */
const port = 5050

export default defineConfig({
  forbidOnly: !!process.env.CI,
  fullyParallel: true,
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile',
      use: { ...devices['Pixel 7'] },
    },
  ],
  reporter: 'list',
  retries: process.env.CI ? 1 : 0,
  testDir: './e2e',
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'pnpm build && firebase emulators:start --only hosting --project acnl-hayu-io',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    url: `http://127.0.0.1:${port}`,
  },
})
