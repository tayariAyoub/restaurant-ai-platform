export const TOKEN_KEY = "restaurant_ai_token";

export function getToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(TOKEN_KEY) || "";
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  window.location.href = "/admin/login";
}
