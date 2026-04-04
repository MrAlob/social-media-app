import { loginUser, validateLoginForm } from "../../services/auth.js";
import { storeAuthData } from "../../services/storage.js";

export function renderLoginPage(rootElement) {
	if (!rootElement) {
		return;
	}

	rootElement.innerHTML = `
		<main class="page">
			<section class="login-card" aria-labelledby="login-title">
				<h1 id="login-title" class="title">Log In</h1>
				<form class="login-form" id="login-form" novalidate>
					<label class="field-label" for="email">Email</label>
					<input
						class="field-input"
						id="email"
						name="email"
						type="email"
						autocomplete="email"
						placeholder="name@stud.noroff.no"
						required
					/>
					<p class="field-error" data-error-for="email" aria-live="polite"></p>

					<label class="field-label" for="password">Password</label>
					<input
						class="field-input"
						id="password"
						name="password"
						type="password"
						autocomplete="current-password"
						placeholder="Enter your password"
						required
					/>
					<p class="field-error" data-error-for="password" aria-live="polite"></p>
					<button class="submit-button" id="login-submit" type="submit">Log In</button>
					<p class="form-message" id="login-message" aria-live="polite"></p>
				</form>
				<p class="register-text">
					Don't have an account?
					<a class="register-link" href="#register">Register account</a>
				</p>
			</section>
		</main>
	`;

	const loginForm = rootElement.querySelector("#login-form");
	const submitButton = rootElement.querySelector("#login-submit");
	const messageElement = rootElement.querySelector("#login-message");
	const emailError = rootElement.querySelector('[data-error-for="email"]');
	const passwordError = rootElement.querySelector('[data-error-for="password"]');
	const passwordInput = rootElement.querySelector("#password");

	if (!loginForm || !submitButton || !messageElement || !emailError || !passwordError || !passwordInput) {
		return;
	}

	loginForm.addEventListener("submit", async (event) => {
		event.preventDefault();

		messageElement.textContent = "";
		messageElement.classList.remove("is-error", "is-success");
		emailError.textContent = "";
		passwordError.textContent = "";

		const formData = new FormData(loginForm);
		const loginData = {
			email: String(formData.get("email") || "").trim(),
			password: String(formData.get("password") || ""),
		};

		const validation = validateLoginForm(loginData);

		if (!validation.isValid) {
			emailError.textContent = validation.errors.email || "";
			passwordError.textContent = validation.errors.password || "";
			return;
		}

		submitButton.disabled = true;
		submitButton.textContent = "Logging in...";

		try {
			const authResult = await loginUser({
				email: validation.email,
				password: loginData.password,
			});

			storeAuthData(authResult);
			messageElement.textContent = "Login successful. Redirecting to feed...";
			messageElement.classList.add("is-success");

			setTimeout(() => {
				window.location.hash = "#feed";
			}, 600);
		} catch (error) {
			messageElement.textContent = error.message || "Login failed. Please try again.";
			messageElement.classList.add("is-error");
			passwordInput.value = "";
		} finally {
			submitButton.disabled = false;
			submitButton.textContent = "Log In";
		}
	});
}
