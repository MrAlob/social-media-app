import "./styles/main.css";
import { renderFeedPage } from "./features/feed/feed.js";
import { renderLoginPage } from "./features/auth/login.js";
import { renderRegisterPage } from "./features/auth/register.js";
import { renderPostDetailPage } from "./features/feed/post-detail.js";
import { getAccessToken } from "./services/storage.js";

const app = document.querySelector("#app");

function getPostIdFromHash() {
	const hashValue = window.location.hash || "";

	if (!hashValue.startsWith("#post")) {
		return "";
	}

	const queryString = hashValue.split("?")[1] || "";
	const params = new URLSearchParams(queryString);
	return params.get("id") || "";
}

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

	if (window.location.hash.startsWith("#post")) {
		if (!getAccessToken()) {
			window.location.hash = "#login";
			return;
		}

		renderPostDetailPage(app, getPostIdFromHash());
		return;
	}

	renderLoginPage(app);
}

window.addEventListener("hashchange", renderCurrentPage);
renderCurrentPage();
