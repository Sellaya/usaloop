/**
 * Default API key slot. The real key is injected into google-maps-config.js by `npm run build`
 * (reads GOOGLE_MAPS_API_KEY from .env) or by Vercel at deploy time.
 * If google-maps-config.js is missing (404), this keeps the page stable — run build to generate it.
 */
window.__GOOGLE_MAPS_API_KEY__ = window.__GOOGLE_MAPS_API_KEY__ || "";
