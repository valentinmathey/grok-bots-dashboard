// Sesión larga: 400 días (máximo que aceptan los navegadores). Las cookies
// persisten al cerrar el navegador/PWA y el proxy las renueva en cada visita
// con la rotación de refresh tokens de Supabase.
export const SESSION_MAX_AGE_SECONDS = 400 * 24 * 60 * 60;

export const SESSION_COOKIE_OPTIONS = {
  maxAge: SESSION_MAX_AGE_SECONDS,
  path: "/",
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
};
