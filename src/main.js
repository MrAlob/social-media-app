import "./styles/main.css";
import { renderFeedPage } from "./features/feed/feed.js";
import { renderLoginPage } from "./features/auth/login.js";
import { renderRegisterPage } from "./features/auth/register.js";
import { renderPostDetailPage } from "./features/feed/post-detail.js";
import { canAccessRoute, createRoutes, getMatchingRoute } from "./router.js";
import { getAccessToken } from "./services/storage.js";

const app = document.querySelector("#app");

const routes = createRoutes({
	renderLoginPage,
	renderRegisterPage,
	renderFeedPage,
	renderPostDetailPage,
});

function renderCurrentPage() {
	if (!app) {
		return;
	}

	const hash = window.location.hash || "#login";
	const route = getMatchingRoute(hash, routes);

	if (!canAccessRoute(route, getAccessToken())) {
		window.location.hash = "#login";
		return;
	}

	route.render(app);
}

window.addEventListener("hashchange", renderCurrentPage);
renderCurrentPage();
