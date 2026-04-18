# Code Flow Visualization created by Claude code

This folder contains a visual map of how the social media app is organized and how data and control move through the app.

## What This Is

The file `code_flow_visualization.html` is a standalone, interactive HTML visualization. It is useful for:

- Understanding the big picture before reading code
- Explaining architecture decisions in code review
- Tracing how a user action can move between modules

## File In This Folder

- `code_flow_visualization.html`: The generated code flow diagram

## How To Open It

1. Open `docs/code_flow_visualization.html` in your browser.
2. Wait for the page to finish loading.


## How To Read The Diagram

Use this order:

1. Start at app entry and routing:
	- `src/main.js`
	- `src/router.js`
2. Move to feature modules:
	- `src/features/auth/*`
	- `src/features/feed/*`
	- `src/features/profile/*`
3. Show shared services used by features:
	- `src/services/api.js`
	- `src/services/auth.js`
	- `src/services/storage.js`
4. End with utilities and UI helpers:
	- `src/ui/*`
	- `src/utils/*`
	- `src/styles/*`

Path:

`user action -> route -> feature handler -> service call -> state/storage update -> UI render`

## Presentation

1. "The app starts in `main.js` and route matching is handled in `router.js`."
2. "Each route points to a feature module like login, feed, or profile."
3. "Feature modules call shared services for API requests and auth state."
4. "Services isolate side effects like network calls and localStorage access."
5. "UI updates are rendered from feature logic after data is fetched or changed."

## Limitations

- This diagram is a snapshot in time.
