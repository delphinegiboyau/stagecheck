export function runSecurityChecks(responseHeaders = {}) {
  const issues = [];

  const headers = Object.fromEntries(
    Object.entries(responseHeaders).map(([k, v]) => [k.toLowerCase(), v]),
  );

  const securityHeaders = [
    {
      key: "content-security-policy",
      title: "Missing Content-Security-Policy header",
      detail:
        "CSP prevents XSS attacks by controlling which resources the browser can load. Add a CSP header to your server response.",
    },
    {
      key: "x-frame-options",
      title: "Missing X-Frame-Options header",
      detail:
        "Prevents your page from being embedded in iframes on other sites (clickjacking). Add: X-Frame-Options: SAMEORIGIN",
    },
    {
      key: "x-content-type-options",
      title: "Missing X-Content-Type-Options header",
      detail:
        "Prevents MIME type sniffing. Add: X-Content-Type-Options: nosniff",
    },
    {
      key: "referrer-policy",
      title: "Missing Referrer-Policy header",
      detail:
        "Controls how much referrer info is sent with requests. Add: Referrer-Policy: strict-origin-when-cross-origin",
    },
    {
      key: "permissions-policy",
      title: "Missing Permissions-Policy header",
      detail:
        "Controls access to browser features (camera, microphone, geolocation). Add a Permissions-Policy header to restrict unnecessary access.",
    },
  ];

  for (const h of securityHeaders) {
    if (!headers[h.key]) {
      issues.push({
        type: "warning",
        category: "security",
        title: h.title,
        detail: h.detail,
      });
    }
  }

  // HTTPS check
  if (headers["strict-transport-security"] === undefined) {
    issues.push({
      type: "warning",
      category: "security",
      title: "Missing Strict-Transport-Security (HSTS) header",
      detail:
        "HSTS forces browsers to always use HTTPS. Add: Strict-Transport-Security: max-age=31536000; includeSubDomains",
    });
  }

  return issues;
}
