const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export function validateLoginForm(formData) {
	const errors = {};

	if (!formData.email || formData.email.trim() === "") {
		errors.email = "Email is required";
	}

	if (!formData.password || formData.password.trim() === "") {
		errors.password = "Password is required";
	}

	const email = (formData.email || "").trim();
	const isStudEmail = /^[^\s@]+@stud\.noroff\.no$/i.test(email);

	if (formData.email && !isStudEmail) {
		errors.email = "Use a @stud.noroff.no email";
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
