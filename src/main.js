import "./styles/main.css";
import { renderFeedPage } from "./features/feed/feed.js";
import { renderLoginPage } from "./features/auth/login.js";
import { renderRegisterPage } from "./features/auth/register.js";
import { renderPostDetailPage } from "./features/feed/post-detail.js";
import { getAccessToken } from "./services/storage.js";

const app = document.querySelector("#app");

const routes = [
	{
		matches: (hash) => hash === "#register",
		requiresAuth: false,
		render: (rootElement) => renderRegisterPage(rootElement),
	},
	{
		matches: (hash) => hash === "#feed",
		requiresAuth: true,
		render: (rootElement) => renderFeedPage(rootElement),
	},
	{
		matches: (hash) => hash.startsWith("#post"),
		requiresAuth: true,
		render: (rootElement) => renderPostDetailPage(rootElement, getPostIdFromHash()),
	},
];

function getPostIdFromHash() {
	const hashValue = window.location.hash || "";

	if (!hashValue.startsWith("#post")) {
		return "";
	}

	const queryString = hashValue.split("?")[1] || "";
	const params = new URLSearchParams(queryString);
	return params.get("id") || "";
}

function getMatchingRoute(hash) {
	return routes.find((route) => route.matches(hash)) || null;
}

function canAccessRoute(route) {
	if (!route?.requiresAuth) {
		return true;
	}

	return Boolean(getAccessToken());
}

function renderCurrentPage() {
	if (!app) {
		return;
	}

	const hash = window.location.hash || "#login";
	const route = getMatchingRoute(hash);

	if (!route) {
		renderLoginPage(app);
		return;
	}

	if (!canAccessRoute(route)) {
		window.location.hash = "#login";
		return;
	}

	route.render(app);
}

window.addEventListener("hashchange", renderCurrentPage);
renderCurrentPage();
