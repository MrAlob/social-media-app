import { registerUser, validateRegistrationForm } from "../../services/auth.js";

export function renderRegisterPage(rootElement) {
	if (!rootElement) {
		return;
	}

	rootElement.innerHTML = `
		<main class="page">
			<section class="login-card" aria-labelledby="register-title">
				<h1 id="register-title" class="title">Register</h1>
				<form class="login-form" id="register-form" novalidate>
					<label class="field-label" for="name">Name</label>
					<input
						class="field-input"
						id="name"
						name="name"
						type="text"
						autocomplete="username"
						placeholder="username"
						required
					/>
					<p class="field-error" data-error-for="name" aria-live="polite"></p>

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
						autocomplete="new-password"
						placeholder="Minimum 8 characters"
						required
					/>
					<p class="field-error" data-error-for="password" aria-live="polite"></p>

					<button class="submit-button" id="register-submit" type="submit">Create account</button>
					<p class="form-message" id="register-message" aria-live="polite"></p>
				</form>
				<p class="register-text">
					Already have an account?
					<a class="register-link" href="#login">Log in</a>
				</p>
			</section>
		</main>
	`;

	const registerForm = rootElement.querySelector("#register-form");
	const submitButton = rootElement.querySelector("#register-submit");
	const messageElement = rootElement.querySelector("#register-message");
	const nameError = rootElement.querySelector('[data-error-for="name"]');
	const emailError = rootElement.querySelector('[data-error-for="email"]');
	const passwordError = rootElement.querySelector('[data-error-for="password"]');

	if (!registerForm || !submitButton || !messageElement || !nameError || !emailError || !passwordError) {
		return;
	}

	registerForm.addEventListener("submit", async (event) => {
		event.preventDefault();

		messageElement.textContent = "";
		messageElement.classList.remove("is-error", "is-success");
		nameError.textContent = "";
		emailError.textContent = "";
		passwordError.textContent = "";

		const formData = new FormData(registerForm);
		const registrationData = {
			name: String(formData.get("name") || ""),
			email: String(formData.get("email") || ""),
			password: String(formData.get("password") || ""),
		};

		const validation = validateRegistrationForm(registrationData);

		if (!validation.isValid) {
			nameError.textContent = validation.errors.name || "";
			emailError.textContent = validation.errors.email || "";
			passwordError.textContent = validation.errors.password || "";
			return;
		}

		submitButton.disabled = true;
		submitButton.textContent = "Creating...";

		try {
			await registerUser(validation.data);
			messageElement.textContent = "Registration successful. Redirecting to login...";
			messageElement.classList.add("is-success");

			setTimeout(() => {
				window.location.hash = "#login";
			}, 700);
		} catch (error) {
			messageElement.textContent = error.message || "Registration failed. Please try again.";
			messageElement.classList.add("is-error");
		} finally {
			submitButton.disabled = false;
			submitButton.textContent = "Create account";
		}
	});
}
