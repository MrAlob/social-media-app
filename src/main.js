import "./styles/main.css";
import { renderLoginPage } from "./features/auth/login.js";
import { renderRegisterPage } from "./features/auth/register.js";

const app = document.querySelector("#app");

function renderCurrentPage() {
	if (!app) {
		return;
	}

	if (window.location.hash === "#register") {
		renderRegisterPage(app);
		return;
	}

	renderLoginPage(app);
}

window.addEventListener("hashchange", renderCurrentPage);
renderCurrentPage();
