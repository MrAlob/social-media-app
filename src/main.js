import "./styles/main.css";
import { renderFeedPage } from "./features/feed/feed.js";
import { renderLoginPage } from "./features/auth/login.js";
import { renderRegisterPage } from "./features/auth/register.js";
import { getAccessToken } from "./services/storage.js";

const app = document.querySelector("#app");

function renderCurrentPage() {
	if (!app) {
		return;
	}

	if (window.location.hash === "#register") {
		renderRegisterPage(app);
		return;
	}

	if (window.location.hash === "#feed") {
		if (!getAccessToken()) {
			window.location.hash = "#login";
			return;
		}

		renderFeedPage(app);
		return;
	}

	renderLoginPage(app);
}

window.addEventListener("hashchange", renderCurrentPage);
renderCurrentPage();
