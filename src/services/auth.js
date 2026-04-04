const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;


function toStudEmail(usernameOrEmail) {
	const value = usernameOrEmail.trim();

	if (value.includes("@")) {
		return value;
	}

	return `${value}@stud.noroff.no`;
}

export function validateLoginForm(formData) {
	const errors = {};

	if (!formData.usernameOrEmail || formData.usernameOrEmail.trim() === "") {
		errors.usernameOrEmail = "Username or email is required";
	}

	if (!formData.password || formData.password.trim() === "") {
		errors.password = "Password is required";
	}

	const email = toStudEmail(formData.usernameOrEmail || "");
	const isStudEmail = /^[^\s@]+@stud\.noroff\.no$/i.test(email);

	if (formData.usernameOrEmail && !isStudEmail) {
		errors.usernameOrEmail = "Use a @stud.noroff.no email or username";
	}

	return {
		isValid: Object.keys(errors).length === 0,
		errors,
		email,
	};
}

export async function loginUser(credentials) {
	const response = await fetch(`${API_BASE_URL}/auth/login`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(credentials),
	});

	const responseBody = await response.json().catch(() => ({}));

	if (!response.ok) {
		const apiMessage = responseBody?.errors?.[0]?.message || responseBody?.message;
		throw new Error(apiMessage || "Invalid credentials");
	}

	return responseBody?.data;
}
