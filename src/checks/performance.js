export function runPerformanceChecks(snapshot, timing = {}) {
  const issues = [];
  const { html, images } = snapshot;

  // ── TIMING CHECKS ────────────────────────────────────────

  if (timing.ttfb > 800)
    issues.push({
      type: timing.ttfb > 1800 ? "error" : "warning",
      category: "performance",
      title: `Slow TTFB: ${timing.ttfb}ms (target < 800ms)`,
      detail:
        "Time To First Byte is slow. Check server response time, caching headers, and CDN configuration.",
    });

  if (timing.domContentLoaded > 3000)
    issues.push({
      type: timing.domContentLoaded > 5000 ? "error" : "warning",
      category: "performance",
      title: `Slow DOMContentLoaded: ${(timing.domContentLoaded / 1000).toFixed(1)}s (target < 3s)`,
      detail:
        "The DOM is taking too long to load. Reduce render-blocking resources and large HTML payloads.",
    });

  if (timing.fullLoad > 5000)
    issues.push({
      type: timing.fullLoad > 8000 ? "error" : "warning",
      category: "performance",
      title: `Slow full page load: ${(timing.fullLoad / 1000).toFixed(1)}s (target < 5s)`,
      detail:
        "Total load time is too high. Optimise images, scripts, and third-party resources.",
    });

  if (timing.lcpMs && timing.lcpMs > 2500)
    issues.push({
      type: timing.lcpMs > 4000 ? "error" : "warning",
      category: "performance",
      title: `Poor LCP: ${(timing.lcpMs / 1000).toFixed(1)}s (target < 2.5s)`,
      detail:
        "Largest Contentful Paint is slow. Optimise hero images, fonts, and above-the-fold content.",
    });

  if (timing.transferSize > 5 * 1024 * 1024)
    issues.push({
      type: "warning",
      category: "performance",
      title: `Large page transfer size: ${(timing.transferSize / 1024 / 1024).toFixed(1)}MB`,
      detail:
        "Total page weight exceeds 5MB. Compress assets, use WebP images, and enable gzip/brotli.",
    });
  return issues;
}

// ... rest of your existing checks below
