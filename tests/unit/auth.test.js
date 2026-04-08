import { describe, expect, it } from "vitest";
import { validateLoginForm, validateRegistrationForm } from "../../src/services/auth.js";

describe("validateLoginForm", () => {
	it("accepts valid stud.noroff.no credentials", () => {
		const result = validateLoginForm({
			email: "student@stud.noroff.no",
			password: "password123",
		});

		expect(result.isValid).toBe(true);
		expect(result.errors).toEqual({});
		expect(result.email).toBe("student@stud.noroff.no");
	});

	it("returns required errors when email and password are missing", () => {
		const result = validateLoginForm({ email: "", password: "" });

		expect(result.isValid).toBe(false);
		expect(result.errors.email).toBe("Email is required");
		expect(result.errors.password).toBe("Password is required");
	});

	it("rejects non-stud email domains", () => {
		const result = validateLoginForm({
			email: "person@example.com",
			password: "password123",
		});

		expect(result.isValid).toBe(false);
		expect(result.errors.email).toBe("Use a @stud.noroff.no email");
	});
});

describe("validateRegistrationForm", () => {
	it("accepts valid registration data", () => {
		const result = validateRegistrationForm({
			name: "student_1",
			email: "student@stud.noroff.no",
			password: "password123",
		});

		expect(result.isValid).toBe(true);
		expect(result.errors).toEqual({});
		expect(result.data).toEqual({
			name: "student_1",
			email: "student@stud.noroff.no",
			password: "password123",
		});
	});

	it("rejects invalid name characters", () => {
		const result = validateRegistrationForm({
			name: "bad name",
			email: "student@stud.noroff.no",
			password: "password123",
		});

		expect(result.isValid).toBe(false);
		expect(result.errors.name).toBe("Name can only use letters, numbers, and underscore");
	});

	it("rejects short passwords", () => {
		const result = validateRegistrationForm({
			name: "student_1",
			email: "student@stud.noroff.no",
			password: "short",
		});

		expect(result.isValid).toBe(false);
		expect(result.errors.password).toBe("Password must be at least 8 characters");
	});
});
