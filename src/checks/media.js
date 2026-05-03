export function runMediaChecks(snapshot) {
  const issues = [];
  const {
    videos = [],
    tables = [],
    imagesExtended = [],
    fontFamilies = [],
    preloadedFonts = [],
  } = snapshot;

  // ── VIDEOS ───────────────────────────────────────────
  for (const v of videos) {
    if (!v.hasControls) {
      issues.push({
        type: "error",
        category: "media",
        title: "Video missing controls attribute",
        element: v.src || "(embedded video)",
        detail:
          "Videos without controls are inaccessible. Add the controls attribute.",
      });
    }
    if (v.autoplay && !v.muted) {
      issues.push({
        type: "error",
        category: "media",
        title: "Autoplaying video is not muted",
        element: v.src || "(embedded video)",
        detail:
          "Autoplay videos must be muted to avoid unexpected audio. Add the muted attribute.",
      });
    }
    if (!v.hasCaptions) {
      issues.push({
        type: "warning",
        category: "media",
        title: "Video missing captions or subtitles",
        element: v.src || "(embedded video)",
        detail: "Add a <track kind='captions'> element for accessibility.",
      });
    }
  }

  // ── TABLES ───────────────────────────────────────────
  for (const t of tables) {
    if (!t.hasCaption) {
      issues.push({
        type: "warning",
        category: "media",
        title: "Table missing <caption>",
        detail: `A table with ${t.rowCount} rows has no caption. Captions help screen readers understand table purpose.`,
      });
    }
    const headersWithoutScope = t.headers.filter((h) => !h.scope);
    if (headersWithoutScope.length) {
      issues.push({
        type: "warning",
        category: "media",
        title: `${headersWithoutScope.length} table header(s) missing scope attribute`,
        detail: `Headers without scope: ${headersWithoutScope.map((h) => `"${h.text}"`).join(", ")}. Add scope="col" or scope="row".`,
      });
    }
  }

  // ── IMAGES WITHOUT DIMENSIONS ────────────────────────
  const noDimensions = (imagesExtended || []).filter(
    (i) => (!i.width || !i.height) && i.src && !i.src.startsWith("data:"),
  );
  if (noDimensions.length) {
    issues.push({
      type: "warning",
      category: "media",
      title: `${noDimensions.length} image(s) missing width/height attributes`,
      detail:
        "Images without explicit dimensions cause Cumulative Layout Shift (CLS). Add width and height attributes matching the image's aspect ratio.",
      element: noDimensions
        .slice(0, 3)
        .map((i) => i.src.split("/").pop())
        .join(", "),
    });
  }

  // ── BROKEN IMAGES ────────────────────────────────────
  const broken = (imagesExtended || []).filter(
    (i) =>
      i.complete && i.naturalWidth === 0 && i.src && !i.src.startsWith("data:"),
  );
  if (broken.length) {
    for (const img of broken) {
      issues.push({
        type: "error",
        category: "media",
        title: "Broken image (failed to load)",
        element: img.src,
        detail: `Image returned no content. Check the file exists at: ${img.src}`,
      });
    }
  }

  // ── FONTS ────────────────────────────────────────────
  if (fontFamilies.length > 4) {
    issues.push({
      type: "warning",
      category: "media",
      title: `Too many font families loaded (${fontFamilies.length})`,
      detail: `Fonts detected: ${fontFamilies.slice(0, 6).join(", ")}. More than 3-4 font families hurts performance and visual consistency.`,
    });
  }

  if (fontFamilies.length > 0 && preloadedFonts.length === 0) {
    issues.push({
      type: "warning",
      category: "media",
      title: "Custom fonts not preloaded",
      detail: `Add <link rel="preload" as="font"> for your main font to prevent Flash Of Unstyled Text (FOUT).`,
    });
  }

  return issues;
}
