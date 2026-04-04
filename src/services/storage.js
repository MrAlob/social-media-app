export function storeAuthData(authData) {
	localStorage.setItem("accessToken", authData.accessToken);
	localStorage.setItem("userName", authData.name);
	localStorage.setItem("userEmail", authData.email);
}

export function clearAuthData() {
	localStorage.removeItem("accessToken");
	localStorage.removeItem("userName");
	localStorage.removeItem("userEmail");
}
