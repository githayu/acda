import { defineConfig, devices } from '@playwright/test'

/** E2Eで配信に使うHostingエミュレーターのポート (firebase.jsonと合わせる) */
const port = 5050

/** テストするURL (E2E_BASE_URLを指定すると、ローカルのサーバーを立てずにそのURLをテストする) */
const baseURL = process.env.E2E_BASE_URL ?? `http://127.0.0.1:${port}`

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
    baseURL,
    trace: 'retain-on-failure',
  },
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: 'pnpm build && firebase emulators:start --only hosting --project acnl-hayu-io',
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
        url: baseURL,
      },
})
