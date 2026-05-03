export async function runLlmReadinessChecks(snapshot) {
  const issues = [];
  const { structuredData, headings, html, metaTags } = snapshot;

  // 1. Structured data
  if (!structuredData.length) {
    issues.push({
      type: "warning",
      category: "llm-ready",
      title: "No JSON-LD structured data found",
      detail:
        "Add schema.org markup (Organization, WebPage, Article…) so LLMs and crawlers can extract structured facts.",
    });
  }

  // 2. Semantic HTML5 elements
  const hasSemanticTags =
    /<(article|section|main|nav|aside|header|footer)/i.test(html);
  if (!hasSemanticTags) {
    issues.push({
      type: "warning",
      category: "llm-ready",
      title: "No semantic HTML5 elements detected",
      detail:
        "Use <main>, <article>, <section>, <nav> etc. instead of generic <div> wrappers.",
    });
  }

  // 3. Heading clarity — headings that are too short to be meaningful
  const vagueHeadings = headings.filter((h) => h.text.split(" ").length < 2); // ← ADD THIS
  for (const h of vagueHeadings) {
    const locator = [
      h.id ? `#${h.id}` : null,
      h.classes ? `.${h.classes.trim().split(/\s+/).join(".")}` : null,
      Object.keys(h.dataAttrs || {}).length
        ? Object.entries(h.dataAttrs)
            .map(([k, v]) => `${k}="${v}"`)
            .join(" ")
        : null,
      h.parentId ? `parent: #${h.parentId}` : null,
      h.parentClasses
        ? `parent: .${h.parentClasses.trim().split(/\s+/).slice(0, 3).join(".")}`
        : null,
      h.nearbyText ? `near: "${h.nearbyText}"` : null,
    ]
      .filter(Boolean)
      .join(" · ");

    issues.push({
      type: "warning",
      category: "llm-ready",
      title: `H${h.level} heading is too vague`,
      element: h.outerHTML || `<h${h.level}>(empty)</h${h.level}>`,
      detail: h.text
        ? `"${h.text}" is a single word with no descriptive value. Replace it with a phrase that explains what this section contains.\nLocate it: ${locator || "no class or id found — search by nearby text"}`
        : `Empty H${h.level} tag with no text content. Either add descriptive text or remove the tag.\nLocate it: ${locator || "no class or id found — search by nearby text"}`,
    });
  }

  // 4. Missing meta description (LLMs use this for page summarization)
  const desc = metaTags.find((m) => m.name === "description")?.content;
  if (!desc) {
    issues.push({
      type: "warning",
      category: "llm-ready",
      title: "No meta description — LLMs lack a page summary",
    });
  }

  // 5. No lang attribute on <html>
  const hasLang = /html[^>]+lang=/i.test(html);
  if (!hasLang) {
    issues.push({
      type: "warning",
      category: "llm-ready",
      title: "Missing lang attribute on <html>",
      detail:
        "Language declaration helps LLMs and screen readers process content correctly.",
    });
  }

  // 6. No <main> landmark
  if (!/<main[\s>]/i.test(html)) {
    issues.push({
      type: "warning",
      category: "llm-ready",
      title: "No <main> landmark element found",
      detail:
        "LLMs and crawlers use <main> to identify primary content vs chrome.",
    });
  }

  return issues;
}
