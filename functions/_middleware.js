// GaniBook landing — Cloudflare Pages Function (middleware).
// Runs on every request to ganibook.com. It sets a first-party cookie with the
// visitor's country code (from Cloudflare's edge data) so consent.js can decide
// whether to show the cookie notice (EU/UK visitors only).
// The cookie holds only a 2-letter country code (e.g. "IN", "DE", "GB") —
// no personal data, no tracking. It is a session cookie, re-set on each visit.
// If Cloudflare does not provide a country, no cookie is set and consent.js
// falls back to showing the notice (privacy-safe default).
export async function onRequest(context) {
  const response = await context.next();
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) return response;
  const country = (context.request.cf && context.request.cf.country) || '';
  if (!country) return response;
  response.headers.append(
    'Set-Cookie',
    'gb-country=' + country + '; Path=/; SameSite=Lax'
  );
  return response;
}
