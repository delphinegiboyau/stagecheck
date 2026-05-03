const KNOWN_TRACKERS = {
  "google-analytics.com": "Google Analytics",
  "googletagmanager.com": "Google Tag Manager",
  "facebook.net": "Facebook Pixel",
  "doubleclick.net": "Google Ads (DoubleClick)",
  "hotjar.com": "Hotjar",
  "clarity.ms": "Microsoft Clarity",
  "segment.com": "Segment",
  "intercom.io": "Intercom",
  "hubspot.com": "HubSpot",
  "drift.com": "Drift",
  "zdassets.com": "Zendesk",
  "cookiebot.com": "Cookiebot",
  "onetrust.com": "OneTrust",
};

export function runThirdPartyChecks(snapshot) {
  const issues = [];
  const { thirdPartyScripts = [], cookies = "", html = "" } = snapshot;

  // Count unique third-party domains
  const domains = [
    ...new Set(
      thirdPartyScripts
        .map((s) => {
          try {
            return new URL(s.src).hostname;
          } catch {
            return null;
          }
        })
        .filter(Boolean),
    ),
  ];

  if (domains.length > 10) {
    issues.push({
      type: "warning",
      category: "third-party",
      title: `High number of third-party domains loaded (${domains.length})`,
      detail: `Domains: ${domains.slice(0, 8).join(", ")}${domains.length > 8 ? "…" : ""}. Each domain adds DNS lookup time and increases privacy exposure.`,
    });
  }

  // Identify known trackers
  const detected = [];
  for (const [domain, name] of Object.entries(KNOWN_TRACKERS)) {
    if (
      thirdPartyScripts.some((s) => s.src.includes(domain)) ||
      html.includes(domain)
    ) {
      detected.push(name);
    }
  }
  if (detected.length) {
    issues.push({
      type: "info",
      category: "third-party",
      title: `${detected.length} tracking/analytics script(s) detected`,
      detail: `Detected: ${detected.join(", ")}. Ensure these are disclosed in your privacy policy and loaded after consent where required by GDPR.`,
    });
  }

  // GTM specifically
  if (html.includes("googletagmanager.com")) {
    issues.push({
      type: "info",
      category: "third-party",
      title: "Google Tag Manager detected",
      detail:
        "GTM is present. Ensure only necessary tags are firing and GTM is not loading additional trackers without consent.",
    });
  }

  // Cookie consent
  const consentKeywords =
    /cookie|consent|gdpr|ccpa|onetrust|cookiebot|cookiepro|privacy/i;
  const hasConsentMechanism = consentKeywords.test(html);
  if (!hasConsentMechanism && cookies.length > 0) {
    issues.push({
      type: "warning",
      category: "third-party",
      title: "Cookies set without detected consent mechanism",
      detail:
        "The page sets cookies but no cookie consent banner or GDPR mechanism was detected. This may violate GDPR/CCPA.",
    });
  }

  // Non-async/defer third party scripts
  const blockingThirdParty = thirdPartyScripts.filter(
    (s) => !s.async && !s.defer,
  );
  if (blockingThirdParty.length) {
    issues.push({
      type: "warning",
      category: "third-party",
      title: `${blockingThirdParty.length} third-party script(s) blocking page render`,
      element: blockingThirdParty
        .slice(0, 3)
        .map((s) => s.src.split("/").slice(0, 3).join("/"))
        .join("\n"),
      detail:
        "Third-party scripts without async/defer block HTML parsing and slow page load. Add async or defer attributes.",
    });
  }

  return issues;
}
