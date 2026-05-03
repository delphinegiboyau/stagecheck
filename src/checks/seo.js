<<<<<<< HEAD
export function runSeoChecks(snapshot) {
  const issues = [];
  const { title, metaTags, headings, images } = snapshot;

  const getMetaContent = (name) =>
    metaTags.find((m) => m.name === name)?.content;

  // Title checks
  if (!title)
    issues.push({
      type: "error",
      category: "seo",
      title: "Missing page title",
    });
  else if (title.length > 60)
    issues.push({
      type: "error",
      category: "seo",
      title: `Meta title too long (${title.length} chars, max 60)`,
      detail: title,
    });

  // Meta description
  const desc = getMetaContent("description");
  if (!desc)
    issues.push({
      type: "error",
      category: "seo",
      title: "Missing meta description",
    });
  else if (desc.length > 160)
    issues.push({
      type: "warning",
      category: "seo",
      title: `Meta description too long (${desc.length} chars, max 160)`,
    });

  // Canonical
  const canonical = metaTags.find((m) => m.name === "canonical");
  if (!canonical && !snapshot.canonical) {
    issues.push({
      type: "warning",
      category: "seo",
      title: "No canonical link tag found",
    });
  }

  // H1 uniqueness
  const h1s = headings.filter((h) => h.level === 1);
  if (h1s.length === 0)
    issues.push({ type: "error", category: "seo", title: "No H1 found" });
  if (h1s.length > 1)
    issues.push({
      type: "warning",
      category: "seo",
      title: `Multiple H1 tags found (${h1s.length})`,
    });

  // Heading hierarchy
  let prevLevel = 0;
  for (const h of headings) {
    if (h.level > prevLevel + 1 && prevLevel !== 0) {
      issues.push({
        type: "warning",
        category: "seo",
        title: `Heading hierarchy skips h${prevLevel} → h${h.level}`,
        detail: `"${h.text}"`,
      });
    }
    prevLevel = h.level;
  }

  // OG tags
  ["og:title", "og:description", "og:image"].forEach((tag) => {
    if (!getMetaContent(tag))
      issues.push({
        type: "warning",
        category: "seo",
        title: `Missing Open Graph tag: ${tag}`,
      });
  });

  return issues;
}
=======
export function runSeoChecks(snapshot) {
  const issues = [];
  const { title, metaTags, headings, images, links, html, canonical, url } =
    snapshot;

  const getMeta = (name) =>
    metaTags.find((m) => m.name === name || m.name === `og:${name}`)?.content;

  // ── TITLES ──────────────────────────────────────────────
  if (!title) {
    issues.push({
      type: "error",
      category: "seo",
      title: "Missing page title",
    });
  } else {
    if (title.length > 60)
      issues.push({
        type: "error",
        category: "seo",
        title: `Page title too long (${title.length}/60 chars)`,
        element: title,
        detail: "Truncated in search results. Shorten to under 60 characters.",
      });
    if (title.length < 10)
      issues.push({
        type: "warning",
        category: "seo",
        title: `Page title too short (${title.length} chars)`,
        element: title,
        detail: "Title is too short to be descriptive for search engines.",
      });
    if (/^(home|welcome|untitled|page|index)/i.test(title))
      issues.push({
        type: "error",
        category: "seo",
        title: "Generic page title",
        element: title,
        detail: `"${title}" is a generic title. Use a descriptive, keyword-rich title.`,
      });
  }

  // ── H1 ──────────────────────────────────────────────────
  const h1s = headings.filter((h) => h.level === 1);
  if (h1s.length === 0)
    issues.push({
      type: "error",
      category: "seo",
      title: "No H1 tag found",
      detail: "Every page must have exactly one H1 describing the main topic.",
    });
  if (h1s.length > 1)
    issues.push({
      type: "error",
      category: "seo",
      title: `Multiple H1 tags found (${h1s.length})`,
      detail: `H1s found: ${h1s.map((h) => `"${h.text}"`).join(", ")}. Use only one H1 per page.`,
    });

  // ── HEADING HIERARCHY ────────────────────────────────────
  let prevLevel = 0;
  for (const h of headings) {
    if (prevLevel && h.level > prevLevel + 1) {
      issues.push({
        type: "warning",
        category: "seo",
        title: `Heading jumps from H${prevLevel} to H${h.level}`,
        element: h.text,
        detail: `Skipping heading levels confuses crawlers. Add an H${prevLevel + 1} before this heading.`,
      });
    }
    prevLevel = h.level;
  }

  // ── META DESCRIPTION ────────────────────────────────────
  const desc = getMeta("description");
  if (!desc) {
    issues.push({
      type: "error",
      category: "seo",
      title: "Missing meta description",
      detail:
        "Meta descriptions appear in search results and affect click-through rate.",
    });
  } else {
    if (desc.length > 160)
      issues.push({
        type: "warning",
        category: "seo",
        title: `Meta description too long (${desc.length}/160 chars)`,
        element: desc,
      });
    if (desc.length < 50)
      issues.push({
        type: "warning",
        category: "seo",
        title: `Meta description too short (${desc.length} chars)`,
        element: desc,
        detail:
          "Aim for 120–160 characters to maximise search result real estate.",
      });
    if (/^(welcome|this page|learn more|click here)/i.test(desc))
      issues.push({
        type: "warning",
        category: "seo",
        title: "Generic meta description",
        element: desc,
        detail: "Avoid filler openers. Start with the core benefit or keyword.",
      });
  }

  // ── CANONICAL ────────────────────────────────────────────
  if (!canonical) {
    issues.push({
      type: "warning",
      category: "seo",
      title: "No canonical tag found",
      detail: "Add <link rel='canonical'> to prevent duplicate content issues.",
    });
  }

  // ── OPEN GRAPH ───────────────────────────────────────────
  ["og:title", "og:description", "og:image", "og:url"].forEach((tag) => {
    const val = metaTags.find((m) => m.name === tag)?.content;
    if (!val)
      issues.push({
        type: "warning",
        category: "seo",
        title: `Missing Open Graph tag: ${tag}`,
        detail:
          "OG tags control how the page appears when shared on social media.",
      });
  });

  // ── TWITTER CARD ─────────────────────────────────────────
  const twitterCard = metaTags.find((m) => m.name === "twitter:card")?.content;
  if (!twitterCard)
    issues.push({
      type: "warning",
      category: "seo",
      title: "Missing twitter:card meta tag",
      detail:
        "Add twitter:card, twitter:title, and twitter:description for Twitter/X sharing.",
    });

  // ── FAVICON ──────────────────────────────────────────────
  const hasFavicon =
    /<link[^>]+rel=["'](?:icon|shortcut icon)["'][^>]*>/i.test(html) ||
    /<link[^>]+href=["'][^"']*favicon[^"']*["'][^>]*>/i.test(html);
  if (!hasFavicon)
    issues.push({
      type: "warning",
      category: "seo",
      title: "No favicon detected",
      detail:
        "Add a <link rel='icon'> tag. Favicons improve brand recognition in browser tabs.",
    });

  // ── HTTPS ────────────────────────────────────────────────
  if (snapshot.pageUrl && snapshot.pageUrl.startsWith("http://")) {
    issues.push({
      type: "error",
      category: "seo",
      title: "Page served over HTTP, not HTTPS",
      detail:
        "HTTPS is a Google ranking factor. Enable SSL and redirect HTTP to HTTPS.",
    });
  }

  // ── MIXED CONTENT ────────────────────────────────────────
  const httpResources = (html.match(/src=["']http:\/\//g) || []).length;
  if (httpResources > 0)
    issues.push({
      type: "error",
      category: "seo",
      title: `${httpResources} mixed content resource(s) loaded over HTTP`,
      detail:
        "Resources loaded over HTTP on an HTTPS page cause browser security warnings.",
    });

  // ── IMAGES ───────────────────────────────────────────────
  const missingAlt = images.filter((i) => i.alt === null);
  const emptyAlt = images.filter((i) => i.alt === "");
  const notLazy = images.filter((i) => i.loading !== "lazy");

  if (missingAlt.length)
    issues.push({
      type: "error",
      category: "seo",
      title: `${missingAlt.length} image(s) missing alt attribute`,
      detail: missingAlt
        .slice(0, 5)
        .map((i) => i.src.split("/").pop())
        .join(", "),
    });
  if (emptyAlt.length > 3)
    issues.push({
      type: "warning",
      category: "seo",
      title: `${emptyAlt.length} image(s) have empty alt text`,
      detail:
        "Only decorative images should have empty alt. Content images need descriptive alt text.",
    });
  if (notLazy.length > 3)
    issues.push({
      type: "warning",
      category: "seo",
      title: `${notLazy.length} image(s) not lazy-loaded`,
      detail:
        "Add loading='lazy' to images below the fold to improve page speed.",
    });

  // ── URL STRUCTURE ────────────────────────────────────────
  if (snapshot.pageUrl) {
    const urlObj = new URL(snapshot.pageUrl);
    const path = urlObj.pathname;

    if (path !== path.toLowerCase())
      issues.push({
        type: "error",
        category: "seo",
        title: "URL contains uppercase characters",
        element: path,
        detail:
          "Google treats URLs with different capitalisation as separate pages. Use lowercase only.",
      });

    if (/[^a-z0-9\-\/\.\_~:@!$&'()*+,;=]/.test(path))
      issues.push({
        type: "warning",
        category: "seo",
        title: "URL contains unusual characters",
        element: path,
        detail:
          "Use only letters, numbers, and hyphens in URLs for best compatibility.",
      });

    if (/_/.test(path))
      issues.push({
        type: "warning",
        category: "seo",
        title: "URL uses underscores instead of hyphens",
        element: path,
        detail:
          "Google recommends hyphens over underscores as word separators in URLs.",
      });
  }

  // ── XML SITEMAP ──────────────────────────────────────────
  const hasSitemap = links.some((l) => l.href.includes("sitemap"));
  if (!hasSitemap)
    issues.push({
      type: "warning",
      category: "seo",
      title: "No sitemap link found on page",
      detail:
        "Ensure /sitemap.xml exists and is submitted to Google Search Console.",
    });

  // ── ROBOTS META ──────────────────────────────────────────
  const robotsMeta = getMeta("robots");
  if (robotsMeta && /noindex/i.test(robotsMeta))
    issues.push({
      type: "error",
      category: "seo",
      title: "Page has noindex meta tag — will not appear in search results",
      element: robotsMeta,
      detail: "Remove noindex if this page should be indexed by Google.",
    });

  // ── INTERNAL LINKS ───────────────────────────────────────
  const internalLinks = links.filter((l) => l.isInternal);
  if (internalLinks.length < 3)
    issues.push({
      type: "warning",
      category: "seo",
      title: `Very few internal links (${internalLinks.length})`,
      detail:
        "Internal links distribute page authority and help Google discover content.",
    });

  const unsafeBlankLinks = links.filter(
    (l) => l.target === "_blank" && (!l.rel || !l.rel.includes("noopener")),
  );
  for (const l of unsafeBlankLinks) {
    issues.push({
      type: "warning",
      category: "seo",
      title: "Link opens in new tab without rel='noopener'",
      element: l.text || l.href,
      detail: `URL: ${l.href}\nFix: <a href="${l.href}" target="_blank" rel="noopener noreferrer">`,
    });
  }

  // ── CONTACT DETAILS ──────────────────────────────────────
  const hasPhone =
    /tel:|(\+\d{1,3}[\s\-]?)?\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{4}/.test(html);
  const hasEmail =
    /mailto:|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(html);
  if (!hasPhone && !hasEmail)
    issues.push({
      type: "warning",
      category: "seo",
      title: "No contact details found on page",
      detail:
        "Visible phone or email builds trust with users and search engines.",
    });

  // ── SOCIAL PROFILES ──────────────────────────────────────
  const socialDomains = [
    "linkedin.com",
    "twitter.com",
    "x.com",
    "facebook.com",
    "instagram.com",
    "youtube.com",
  ];
  const hasSocial = links.some((l) =>
    socialDomains.some((s) => l.href.includes(s)),
  );
  if (!hasSocial)
    issues.push({
      type: "warning",
      category: "seo",
      title: "No social profile links found",
      detail:
        "Link to your social profiles to signal brand credibility to Google.",
    });

  // ── CTAs ─────────────────────────────────────────────────
  const ctaPatterns =
    /\b(get started|sign up|contact us|book a demo|try free|buy now|learn more|subscribe|download|request a quote)\b/i;
  const hasCTA = ctaPatterns.test(html);
  if (!hasCTA)
    issues.push({
      type: "warning",
      category: "seo",
      title: "No clear call-to-action detected",
      detail:
        "Add prominent CTAs (e.g. 'Get Started', 'Contact Us') to drive conversions.",
    });

  // ── FOOTER NAVIGATION ────────────────────────────────────
  const hasFooter = /<footer/i.test(html);
  const hasPrivacyLink = links.some(
    (l) =>
      /privacy|legal|terms/i.test(l.text) ||
      /privacy|legal|terms/i.test(l.href),
  );
  if (!hasFooter)
    issues.push({
      type: "warning",
      category: "seo",
      title: "No <footer> element found",
      detail:
        "Footers typically contain privacy policy, terms, and contact links that build trust.",
    });
  if (!hasPrivacyLink)
    issues.push({
      type: "warning",
      category: "seo",
      title: "No privacy policy or terms link found",
      detail:
        "Privacy and legal links are expected trust signals, especially for E-E-A-T.",
    });

  // ── VIEWPORT META ────────────────────────────────────────
  const viewport = getMeta("viewport");
  if (!viewport)
    issues.push({
      type: "error",
      category: "seo",
      title: "Missing viewport meta tag",
      detail:
        "Add <meta name='viewport' content='width=device-width, initial-scale=1'>. Required for mobile-friendliness.",
    });

  // ── LANG ATTRIBUTE ───────────────────────────────────────
  if (!/<html[^>]+lang=/i.test(html))
    issues.push({
      type: "warning",
      category: "seo",
      title: "Missing lang attribute on <html>",
      detail:
        "Add lang='en' (or your language) to help Google serve the right language results.",
    });

  return issues;
}
>>>>>>> 8f72303 (feat: new criteria and advanced full check added)
