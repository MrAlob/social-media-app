# AI Usage Log

This file records AI assistance used while completing the CSS frameworks assignment. Each entry describes the assistance received and the outcome. I review and understand any code changes before keeping them.

- **Tool used:** ChatGPT
- **Purpose:** Regain context after time away from the assignment by reading the repository, summarising its structure and current functionality, and brainstorming a clear approach for meeting the CSS framework requirements.
- **Outcome:** Created a simple staged plan for adding Tailwind through npm, styling three existing pages incrementally, and checking native form validation before making code changes.

- **Tool used:** ChatGPT
- **Purpose:** Find and understand the relevant Tailwind documentation, work out the npm installation commands, and get help connecting Tailwind correctly to the Vite project.
- **Outcome:** Tailwind was installed locally and the Vite integration was fixed so the project builds successfully. The login page kept its existing behavior, native browser validation was enabled by removing `novalidate`, and the focused authentication tests passed.

- **Tool used:** ChatGPT
- **Purpose:** Brainstorm how Tailwind utility classes could be added to the feed page's existing markup while preserving its JavaScript behavior, event listeners, and navigation.
- **Outcome:** Planned a small styling change focused on layout, spacing, responsive behavior, and post-card presentation without restructuring the existing markup or changing how the feed works.

- **Tool used:** GitHub Copilot
- **Purpose:** Investigate the Playwright browser failure after confirming that a local browser was already installed.
- **Outcome:** Found that Playwright's cached headless shell was incomplete, configured the existing E2E setup to use the installed Google Chrome channel, and verified that all three browser tests pass.

- **Tool used:** ChatGPT
- **Purpose:** Get help creating a `curl` request for testing the Noroff API, including how to send the API key in the request headers and inspect the response.
- **Outcome:** Created a command-line example for checking the API connection and understanding whether the environment variables and API key were working before testing the application.

- **Tool used:** ChatGPT
- **Purpose:** Brainstorm a simple Tailwind animation for the login screen without changing the existing markup structure, validation, or JavaScript behavior.
- **Outcome:** Added a named card entrance animation, subtle input focus transitions, and a register-link hover transition.

- **Tool used:** ChatGPT
- **Purpose:** Plan a one-time diagonal gloss effect for the login button when the user hovers over it.
- **Outcome:** Added a scoped CSS element animation that sweeps across the button once per hover without changing the submit behavior.