import { getApiConfig } from '../config/env.js';

/**
 * Validates login form input and normalizes the email field.
 * @param {{ email?: string, password?: string }} formData - Raw login form values.
 * @returns {{ isValid: boolean, errors: Record<string, string>, email: string }}
 */
export function validateLoginForm(formData) {
  const errors = {};

  if (!formData.email || formData.email.trim() === '') {
    errors.email = 'Email is required';
  }

  if (!formData.password || formData.password.trim() === '') {
    errors.password = 'Password is required';
  }

  const email = (formData.email || '').trim();
  const isStudEmail = /^[^\s@]+@stud\.noroff\.no$/i.test(email);

  if (formData.email && !isStudEmail) {
    errors.email = 'Use a @stud.noroff.no email';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    email,
  };
}

/**
 * Sends login credentials to the API and returns the authenticated user payload.
 * @param {{ email: string, password: string }} credentials - Login credentials.
 * @returns {Promise<object|undefined>} Resolved API data object when login succeeds.
 * @throws {Error} When the API request fails or credentials are invalid.
 */
export async function loginUser(credentials) {
  const { apiBaseUrl } = getApiConfig();

  const response = await fetch(`${apiBaseUrl}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  const responseBody = await response.json().catch(() => ({}));

  if (!response.ok) {
    const apiMessage = responseBody?.errors?.[0]?.message || responseBody?.message;
    throw new Error(apiMessage || 'Invalid credentials');
  }

  return responseBody?.data;
}

/**
 * Validates registration input and returns sanitized values for API submission.
 * @param {{ name?: string, email?: string, password?: string }} formData - Raw registration form values.
 * @returns {{ isValid: boolean, errors: Record<string, string>, data: { name: string, email: string, password: string } }}
 */
export function validateRegistrationForm(formData) {
  const errors = {};
  const name = (formData.name || '').trim();
  const email = (formData.email || '').trim();
  const password = String(formData.password || '');

  if (name === '') {
    errors.name = 'Name is required';
  }

  if (name && !/^[A-Za-z0-9_]+$/.test(name)) {
    errors.name = 'Name can only use letters, numbers, and underscore';
  }

  if (email === '') {
    errors.email = 'Email is required';
  }

  if (email && !/^[^\s@]+@stud\.noroff\.no$/i.test(email)) {
    errors.email = 'Use a @stud.noroff.no email';
  }

  if (password.trim() === '') {
    errors.password = 'Password is required';
  }

  if (password && password.length < 8) {
    errors.password = 'Password must be at least 8 characters';
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

/**
 * Sends registration data to the API and returns the created user payload.
 * @param {{ name: string, email: string, password: string }} userData - Sanitized registration data.
 * @returns {Promise<object|undefined>} Resolved API data object when registration succeeds.
 * @throws {Error} When the API request fails or validation is rejected by the API.
 */
export async function registerUser(userData) {
  const { apiBaseUrl } = getApiConfig();

  const response = await fetch(`${apiBaseUrl}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });

  const responseBody = await response.json().catch(() => ({}));

  if (!response.ok) {
    const apiMessage = responseBody?.errors?.[0]?.message || responseBody?.message;
    throw new Error(apiMessage || 'Registration failed');
  }

  return responseBody?.data;
}
