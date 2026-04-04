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

export function validateRegistrationForm(formData) {
	const errors = {};
	const name = (formData.name || "").trim();
	const email = (formData.email || "").trim();
	const password = String(formData.password || "");

	if (name === "") {
		errors.name = "Name is required";
	}

	if (name && !/^[A-Za-z0-9_]+$/.test(name)) {
		errors.name = "Name can only use letters, numbers, and underscore";
	}

	if (email === "") {
		errors.email = "Email is required";
	}

	if (email && !/^[^\s@]+@stud\.noroff\.no$/i.test(email)) {
		errors.email = "Use a @stud.noroff.no email";
	}

	if (password.trim() === "") {
		errors.password = "Password is required";
	}

	if (password && password.length < 8) {
		errors.password = "Password must be at least 8 characters";
	}

	return {
		isValid: Object.keys(errors).length === 0,
		errors,
		data: {
			name,
			email,
			password,
		},
	};
}

export async function registerUser(userData) {
	const response = await fetch(`${API_BASE_URL}/auth/register`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(userData),
	});

	const responseBody = await response.json().catch(() => ({}));

	if (!response.ok) {
		const apiMessage = responseBody?.errors?.[0]?.message || responseBody?.message;
		throw new Error(apiMessage || "Registration failed");
	}

	return responseBody?.data;
}
