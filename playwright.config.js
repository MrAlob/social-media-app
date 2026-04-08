import { defineConfig } from "@playwright/test";

export default defineConfig({
	testDir: "./tests/e2e",
	timeout: 30_000,
	use: {
		baseURL: "http://127.0.0.1:4173",
		headless: true,
	},
	webServer: {
		command: "npm run dev -- --host 127.0.0.1 --port 4173",
		url: "http://127.0.0.1:4173",
		env: {
			VITE_API_BASE_URL: "https://api.noroff.dev/api/v1",
			VITE_NOROFF_API_KEY: "playwright-ci-placeholder",
		},
		reuseExistingServer: true,
		timeout: 120_000,
	},
});
