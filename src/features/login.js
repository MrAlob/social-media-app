export function renderLoginPage(rootElement) {
	if (!rootElement) {
		return;
	}

	rootElement.innerHTML = `
		<main class="page">
			<section class="login-card" aria-labelledby="login-title">
				<h1 id="login-title" class="title">Log In</h1>
				<form class="login-form" novalidate>
					<label class="field-label" for="email">Email</label>
					<input
						class="field-input"
						id="email"
						name="email"
						type="email"
						autocomplete="email"
						placeholder="name@example.com"
						required
					/>

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
					<button class="submit-button" type="submit">Log In</button>
				</form>
			</section>
		</main>
	`;
}
