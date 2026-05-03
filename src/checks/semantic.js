export function runSemanticChecks(snapshot) {
  const issues = [];
  const { semanticUsage: s, html } = snapshot;

  if (!s) return issues;

  // ── SECTIONS WITHOUT HEADINGS ────────────────────────
  for (const el of s.sectionsWithoutHeading) {
    const locator = [
      el.id ? `#${el.id}` : null,
      el.classes
        ? `.${el.classes.trim().split(/\s+/).slice(0, 3).join(".")}`
        : null,
    ]
      .filter(Boolean)
      .join(" ");

    issues.push({
      type: "warning",
      category: "semantic",
      title: `<${el.tag}> has no heading inside it`,
      element: `<${el.tag}${locator ? " " + locator : ""}>`,
      detail: `Every <${el.tag}> should contain a heading (h2-h6) to describe its content to crawlers and screen readers. Without a heading, the section has no semantic label.`,
    });
  }

  // ── CLICKABLE DIVS ───────────────────────────────────
  if (s.clickableDivs.length > 0) {
    for (const el of s.clickableDivs) {
      issues.push({
        type: "error",
        category: "semantic",
        title: `Clickable <${el.tag}> should be a <button> or <a>`,
        element: `<${el.tag} class="${el.classes || ""}">${el.text || ""}`,
        detail: `Using onclick on a <div> or <span> is not accessible or semantic. Replace with <button> for actions or <a href="..."> for navigation. Screen readers and keyboard users cannot interact with clickable divs.`,
      });
    }
  }

  // ── EMPTY LINKS ──────────────────────────────────────
  if (s.emptyLinks > 0) {
    issues.push({
      type: "error",
      category: "semantic",
      title: `${s.emptyLinks} empty or href-less link(s) found`,
      detail: `Links with no text or no href are invisible to screen readers and confuse crawlers. Add descriptive text and a valid href to every <a> tag.`,
    });
  }

  // ── BR ABUSE ─────────────────────────────────────────
  if (s.brAbuse > 3) {
    issues.push({
      type: "warning",
      category: "semantic",
      title: `<br> used for spacing ${s.brAbuse} times instead of <p> tags`,
      detail: `Multiple consecutive <br> tags are used for paragraph spacing. Use <p> tags instead — they are semantically meaningful and help LLMs identify distinct content blocks.`,
    });
  }

  // ── B/I INSTEAD OF STRONG/EM ─────────────────────────
  if (s.weakEmphasis.b > 5 && s.weakEmphasis.b > s.strongCount) {
    issues.push({
      type: "warning",
      category: "semantic",
      title: `<b> used ${s.weakEmphasis.b} times instead of <strong>`,
      detail: `<b> is purely visual. Use <strong> to convey semantic importance — search engines and LLMs use <strong> to identify key terms on the page.`,
    });
  }

  if (s.weakEmphasis.i > 5 && s.weakEmphasis.i > s.emCount) {
    issues.push({
      type: "warning",
      category: "semantic",
      title: `<i> used ${s.weakEmphasis.i} times instead of <em>`,
      detail: `<i> is purely visual. Use <em> to convey semantic stress emphasis. This helps LLMs understand which terms are being emphasised.`,
    });
  }

  // ── FIGURES WITHOUT FIGCAPTION ───────────────────────
  if (s.figuresWithoutCaption > 0) {
    issues.push({
      type: "warning",
      category: "semantic",
      title: `${s.figuresWithoutCaption} <figure> element(s) missing <figcaption>`,
      detail: `<figure> tags without <figcaption> provide no context for the image to crawlers or screen readers. Add a <figcaption> describing the image content.`,
    });
  }

  // ── TIME TAG ─────────────────────────────────────────
  if (s.timeWithoutDatetime > 0) {
    issues.push({
      type: "warning",
      category: "semantic",
      title: `${s.timeWithoutDatetime} <time> element(s) missing datetime attribute`,
      element: "<time>March 2024</time>",
      detail: `Add a machine-readable datetime attribute: <time datetime="2024-03">March 2024</time>. Without it, LLMs and crawlers cannot parse the date.`,
    });
  }

  if (
    !s.hasTimeTag &&
    /\b(january|february|march|april|may|june|july|august|september|october|november|december|\d{4})\b/i.test(
      html,
    )
  ) {
    issues.push({
      type: "warning",
      category: "semantic",
      title: "Dates found in content but no <time> tags used",
      detail: `Wrap dates in <time datetime="YYYY-MM-DD"> tags so LLMs and search engines can parse them as structured data rather than plain text.`,
    });
  }

  // ── ADDRESS TAG ──────────────────────────────────────
  if (
    !s.hasAddressTag &&
    /<footer/i.test(html) &&
    /\b(\d{1,5}\s\w+\s(street|st|avenue|ave|road|rd|boulevard|blvd|lane|ln|drive|dr))\b/i.test(
      html,
    )
  ) {
    issues.push({
      type: "warning",
      category: "semantic",
      title: "Physical address found but no <address> tag used",
      detail: `Wrap contact/address information in an <address> tag to make it machine-readable for local SEO and LLMs.`,
    });
  }

  // ── ABBR WITHOUT TITLE ───────────────────────────────
  if (s.abbrWithoutTitle > 0) {
    issues.push({
      type: "warning",
      category: "semantic",
      title: `${s.abbrWithoutTitle} <abbr> element(s) missing title attribute`,
      detail: `Add title attributes to <abbr> tags: <abbr title="Search Engine Optimisation">SEO</abbr>. This helps LLMs expand acronyms and understand terminology.`,
    });
  }

  // ── MULTIPLE MAIN ────────────────────────────────────
  if (s.mainCount > 1) {
    issues.push({
      type: "error",
      category: "semantic",
      title: `Multiple <main> elements found (${s.mainCount})`,
      detail: `A page should have exactly one <main> element. Multiple <main> tags confuse screen readers and crawlers about which content is primary.`,
    });
  }

  // ── MULTIPLE NAV WITHOUT ARIA-LABEL ─────────────────
  if (s.navCount > 1) {
    const unlabelledNavs = (html.match(/<nav(?![^>]*aria-label)[^>]*>/gi) || [])
      .length;
    if (unlabelledNavs > 1) {
      issues.push({
        type: "warning",
        category: "semantic",
        title: `${unlabelledNavs} <nav> elements without aria-label`,
        detail: `When multiple <nav> elements exist, each should have an aria-label to distinguish them: <nav aria-label="Main navigation"> and <nav aria-label="Footer navigation">.`,
      });
    }
  }

  return issues;
}
