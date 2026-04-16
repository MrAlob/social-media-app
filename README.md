# Social Media App [![CI](https://github.com/MrAlob/social-media-app/actions/workflows/ci.yml/badge.svg)](https://github.com/MrAlob/social-media-app/actions/workflows/ci.yml)

A frontend social media application built as a school project.

## Project Goals

- Practice building a modular JavaScript app
- Work with API calls using fetch and async/await
- Implement simple auth state with localStorage
- Build and test features incrementally

## Tech Stack

- JavaScript (ES modules)
- Vite (development server and build)
- Vitest (unit testing)
- Playwright (end-to-end testing)

## Prerequisites

- Node.js 20 or later
- npm 10 or later

## Setup

1. Clone the repository:

```bash
git clone https://github.com/MrAlob/social-media-app.git
cd social-media-app
```

2. Install dependencies:

```bash
npm install
```

3. Create an environment file named .env in the project root:

You need a Noroff account to generate and copy your API key.

```bash
VITE_API_BASE_URL=https://v2.api.noroff.dev
VITE_NOROFF_API_KEY=your_api_key_here
```

4. Start the app:

```bash
npm run dev
```

The app will be available at the local Vite URL shown in your terminal.

## Available Scripts

- npm run dev: Start development server
- npm run build: Build production assets
- npm run preview: Preview production build locally
- npm run test: Run unit tests once
- npm run test:watch: Run unit tests in watch mode
- npm run test:e2e: Run Playwright end-to-end tests
- npm run format: Format all HTML, CSS, and JS files with Prettier
- npm run format:check: Check formatting for all HTML, CSS, and JS files with Prettier

## Testing

This test setup is intentionally minimal and aimed at learning core testing workflows (unit and E2E).

### Unit tests (Vitest)

```bash
npm run test
```

Watch mode:

```bash
npm run test:watch
```

### End-to-end tests (Playwright)

```bash
npm run test:e2e
```

Test folders:

- tests/unit
- tests/e2e

Commands in this README are the same npm scripts defined in package.json and are used in local development and CI.

## Project Structure

```text
src/
  config/       Environment configuration
  features/     Feature modules (auth, feed, profile, search, social)
  services/     API/auth/storage service layer
  styles/       CSS layers (base, components, feature styles)
  ui/           Shared rendering and UI state helpers
  utils/        Formatting and validation utilities
  main.js       Application entry point
  router.js     Route matching and access control
```

## Auth and Routing Notes

- The app uses hash-based routes such as #login and #feed
- Route guards redirect unauthenticated users to login
- Tokens are read from localStorage through the storage service

## Environment Notes

- VITE_API_BASE_URL is required
- VITE_NOROFF_API_KEY is required for requests that need the Noroff API key header, for example:
  - GET /social/posts (feed list)
  - GET /social/posts/:id (single post detail)
- You need a Noroff account to create the API key used in VITE_NOROFF_API_KEY
- Missing required values will throw clear runtime errors from src/config/env.js

## CI

GitHub Actions runs the workflow in .github/workflows/ci.yml on every pull request targeting main.

Pipeline overview:

- Job 1: Unit Tests + Build
  - Uses Ubuntu latest runner and Node.js 20
  - Installs dependencies with npm ci
  - Runs unit tests with npm run test
  - Runs production build with npm run build
- Job 2: Playwright E2E
  - Runs only after Job 1 succeeds
  - Installs Chromium browser for Playwright
  - Runs end-to-end tests with npm run test:e2e
  - Uploads Playwright report artifact only if tests fail

This setup helps catch logic regressions (unit tests), build issues (Vite build), and user-flow problems (E2E tests) before merging.

## Troubleshooting

- Missing VITE_API_BASE_URL or VITE_NOROFF_API_KEY:
  - Symptom: runtime errors such as "Missing VITE_API_BASE_URL in .env" or "Missing VITE_NOROFF_API_KEY in .env"
  - Fix: check your .env file name and values, then restart npm run dev
- 401 or 403 API errors after login:
  - Symptom: feed or post requests fail even though you can sign in
  - Fix: confirm access token is stored, and verify your Noroff API key is valid and active
- Playwright E2E failures on first run:
  - Symptom: browser executable missing
  - Fix: run npx playwright install --with-deps chromium, then rerun npm run test:e2e
- npm install issues:
  - Symptom: dependency or lockfile mismatch
  - Fix: remove node_modules and run npm install again (or npm ci in CI environments)



