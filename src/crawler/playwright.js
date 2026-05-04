import { chromium } from "playwright";
import { AxeBuilder } from "@axe-core/playwright";

export async function crawlPage(url) {
  const browser = await chromium.launch({
    headless: true,
  });

  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    viewport: { width: 1280, height: 900 },
    ignoreHTTPSErrors: true,
    extraHTTPHeaders: {
      "Accept-Language": "en-US,en;q=0.9",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    },
  });

  const page = await context.newPage();

  // ── CONSOLE + JS ERROR TRACKING ─────────────────────
  const consoleErrors = [];
  const pageErrors = [];

  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => {
    pageErrors.push(err.message);
  });

  try {
    // ── MAIN PAGE LOAD + TIMING ──────────────────────────
    const mainResponse = await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    const responseHeaders = mainResponse ? mainResponse.headers() : {};

    await page.waitForTimeout(2000);

    const fullLoadTime = await page.evaluate(() => {
      const nav = performance.getEntriesByType("navigation")[0];
      if (!nav) return null;
      return {
        dns: Math.round(nav.domainLookupEnd - nav.domainLookupStart),
        tcp: Math.round(nav.connectEnd - nav.connectStart),
        ttfb: Math.round(nav.responseStart - nav.requestStart),
        download: Math.round(nav.responseEnd - nav.responseStart),
        domParsing: Math.round(nav.domInteractive - nav.responseEnd),
        domContentLoaded: Math.round(
          nav.domContentLoadedEventEnd - nav.startTime,
        ),
        fullLoad:
          nav.loadEventEnd > 0
            ? Math.round(nav.loadEventEnd - nav.startTime)
            : Math.round(nav.domContentLoadedEventEnd - nav.startTime),
        transferSize: nav.transferSize || 0,
        encodedSize: nav.encodedBodySize || 0,
      };
    });

    const lcp = await page.evaluate(() => {
      return new Promise((resolve) => {
        let lcpValue = null;
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          lcpValue = Math.round(entries[entries.length - 1].startTime);
        });
        try {
          observer.observe({
            type: "largest-contentful-paint",
            buffered: true,
          });
        } catch {
          resolve(null);
          return;
        }
        setTimeout(() => {
          observer.disconnect();
          resolve(lcpValue);
        }, 1000);
      });
    });

    const timing = {
      ...fullLoadTime,
      lcpMs: lcp,
      measuredAt: new Date().toISOString(),
    };

    // ── ACCESSIBILITY ────────────────────────────────────
    const axeResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "best-practice"])
      .exclude("#aswift_1, #aswift_2, #aswift_3, #aswift_4, #aswift_5")
      .exclude("iframe")
      .analyze();

    const accessibilityResults = axeResults.violations
      .map((v) => ({
        type: "error",
        category: "accessibility",
        rule: v.id,
        title: v.description,
        impact: v.impact,
        elements: v.nodes
          .map((n) => n.target.join(" > "))
          .filter((sel) => !sel.includes("aswift") && !sel.includes("iframe")),
        help: v.helpUrl,
      }))
      .filter((v) => v.elements.length > 0);

    // ── DOM SNAPSHOT ─────────────────────────────────────
    const snapshot = await page.evaluate(() => ({
      title: document.title,
      pageUrl: window.location.href,
      canonical:
        document.querySelector('link[rel="canonical"]')?.getAttribute("href") ||
        null,
      metaTags: [...document.querySelectorAll("meta")].map((m) => ({
        name: m.getAttribute("name") || m.getAttribute("property"),
        content: m.getAttribute("content"),
      })),
      headings: [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].map(
        (h) => ({
          level: parseInt(h.tagName[1]),
          text: h.innerText.trim(),
          id: h.id || null,
          classes: h.className || null,
          dataAttrs: Object.fromEntries(
            [...h.attributes]
              .filter((a) => a.name.startsWith("data-"))
              .map((a) => [a.name, a.value]),
          ),
          parentId: h.parentElement?.id || null,
          parentClasses: h.parentElement?.className || null,
          nearbyText:
            h.previousElementSibling?.innerText?.trim().slice(0, 60) ||
            h.nextElementSibling?.innerText?.trim().slice(0, 60) ||
            null,
          outerHTML: h.outerHTML.slice(0, 200),
        }),
      ),
      semanticUsage: {
        // Sections with no heading
        sectionsWithoutHeading: [
          ...document.querySelectorAll("section, article"),
        ]
          .filter((el) => !el.querySelector("h1, h2, h3, h4, h5, h6"))
          .map((el) => ({
            tag: el.tagName.toLowerCase(),
            classes: el.className || null,
            id: el.id || null,
          })),

        // Clickable divs/spans (should be buttons or links)
        clickableDivs: [
          ...document.querySelectorAll(
            "div[onclick], span[onclick], div[role='button'], span[role='button']",
          ),
        ]
          .map((el) => ({
            tag: el.tagName.toLowerCase(),
            classes: el.className?.slice(0, 100) || null,
            text: el.innerText?.trim().slice(0, 50) || null,
          }))
          .slice(0, 10),

        // Empty links or links with no href
        emptyLinks: [...document.querySelectorAll("a")].filter(
          (a) =>
            !a.href ||
            a.href === window.location.href + "#" ||
            a.innerText.trim() === "",
        ).length,

        // BR used for spacing (more than 3 consecutive)
        brAbuse: (
          document.body.innerHTML.match(/<br\s*\/?>\s*<br\s*\/?>/gi) || []
        ).length,

        // b/i instead of strong/em
        weakEmphasis: {
          b: document.querySelectorAll("b:not([class])").length,
          i: document.querySelectorAll("i:not([class]):not([aria-hidden])")
            .length,
        },

        // Images in figures without figcaption
        figuresWithoutCaption: [...document.querySelectorAll("figure")].filter(
          (f) => !f.querySelector("figcaption"),
        ).length,

        // Time elements without datetime
        timeWithoutDatetime: [...document.querySelectorAll("time")].filter(
          (t) => !t.getAttribute("datetime"),
        ).length,

        // Dates written as plain text (no <time> tag) - heuristic
        hasTimeTag: document.querySelectorAll("time").length > 0,

        // Address tag used
        hasAddressTag: document.querySelectorAll("address").length > 0,

        // Lists used properly vs divs with <br>
        listCount: {
          ul: document.querySelectorAll("ul").length,
          ol: document.querySelectorAll("ol").length,
        },

        // Abbr tags with title
        abbrWithoutTitle: [...document.querySelectorAll("abbr")].filter(
          (a) => !a.getAttribute("title"),
        ).length,

        // Nav landmark
        navCount: document.querySelectorAll("nav").length,

        // Main landmark
        mainCount: document.querySelectorAll("main").length,

        // Strong vs b, em vs i usage
        strongCount: document.querySelectorAll("strong").length,
        emCount: document.querySelectorAll("em").length,
      },
      images: [...document.querySelectorAll("img")].map((i) => ({
        src: i.src,
        alt: i.getAttribute("alt"),
        loading: i.getAttribute("loading"),
      })),
      imagesExtended: [...document.querySelectorAll("img")].map((i) => ({
        src: i.src,
        alt: i.getAttribute("alt"),
        loading: i.getAttribute("loading"),
        width: i.getAttribute("width"),
        height: i.getAttribute("height"),
        naturalWidth: i.naturalWidth,
        naturalHeight: i.naturalHeight,
        complete: i.complete,
      })),
      links: [...document.querySelectorAll("a")].map((a) => ({
        href: a.href,
        text: a.innerText.trim(),
        isInternal: a.href.startsWith(window.location.origin),
        target: a.getAttribute("target"),
        rel: a.getAttribute("rel"),
        outerHTML: a.outerHTML.slice(0, 300),
      })),
      bodyScrollWidth: document.body.scrollWidth,
      viewportWidth: window.innerWidth,
      overflowingElements: [...document.querySelectorAll("*")]
        .filter((el) => el.scrollWidth > document.body.clientWidth)
        .map((el) => ({
          selector:
            el.tagName.toLowerCase() +
            (el.id ? "#" + el.id : "") +
            (el.className ? "." + [...el.classList].join(".") : ""),
          scrollWidth: el.scrollWidth,
        }))
        .slice(0, 20),
      structuredData: [
        ...document.querySelectorAll('script[type="application/ld+json"]'),
      ]
        .map((s) => {
          try {
            return JSON.parse(s.innerText);
          } catch {
            return null;
          }
        })
        .filter(Boolean),
      html: document.documentElement.outerHTML,
      forms: [...document.querySelectorAll("form")].map((f) => ({
        action: f.getAttribute("action"),
        method: f.getAttribute("method"),
        inputs: [...f.querySelectorAll("input, textarea, select")].map((i) => ({
          type: i.getAttribute("type") || i.tagName.toLowerCase(),
          name: i.getAttribute("name"),
          id: i.getAttribute("id"),
          autocomplete: i.getAttribute("autocomplete"),
          hasLabel: !!(
            (i.id && document.querySelector(`label[for="${i.id}"]`)) ||
            i.closest("label")
          ),
        })),
        hasSubmit: !!f.querySelector(
          '[type="submit"], button:not([type="button"])',
        ),
        outerHTML: f.outerHTML.slice(0, 500),
      })),
      videos: [...document.querySelectorAll("video")].map((v) => ({
        src: v.src || v.querySelector("source")?.src,
        hasControls: v.hasAttribute("controls"),
        autoplay: v.hasAttribute("autoplay"),
        muted: v.hasAttribute("muted"),
        hasCaptions: !!v.querySelector(
          'track[kind="captions"], track[kind="subtitles"]',
        ),
      })),
      tables: [...document.querySelectorAll("table")].map((t) => ({
        hasCaption: !!t.querySelector("caption"),
        headers: [...t.querySelectorAll("th")].map((th) => ({
          scope: th.getAttribute("scope"),
          text: th.innerText.trim(),
        })),
        rowCount: t.querySelectorAll("tr").length,
      })),
      fonts: [
        ...document.querySelectorAll(
          'link[rel="stylesheet"], link[rel="preload"][as="font"]',
        ),
      ].map((l) => ({
        href: l.href,
        rel: l.getAttribute("rel"),
        as: l.getAttribute("as"),
      })),
      fontFamilies: [
        ...new Set(
          [...document.querySelectorAll("*")]
            .map((el) =>
              window
                .getComputedStyle(el)
                .fontFamily.split(",")[0]
                .trim()
                .replace(/['"]/g, ""),
            )
            .filter(
              (f) =>
                f &&
                f !== "serif" &&
                f !== "sans-serif" &&
                f !== "monospace" &&
                f !== "inherit",
            ),
        ),
      ].slice(0, 20),
      preloadedFonts: [
        ...document.querySelectorAll('link[rel="preload"][as="font"]'),
      ].map((l) => l.href),
      thirdPartyScripts: [...document.querySelectorAll("script[src]")]
        .map((s) => ({
          src: s.src,
          async: s.hasAttribute("async"),
          defer: s.hasAttribute("defer"),
        }))
        .filter((s) => {
          try {
            return new URL(s.src).hostname !== window.location.hostname;
          } catch {
            return false;
          }
        }),
      cookies: document.cookie,
    }));

    // ── LINKS + OVERFLOW ─────────────────────────────────
    const linkResults = await checkLinks(snapshot.links, context, url);
    const overflowResults = await checkViewportOverflows(context, url);

    // ── RETURN EVERYTHING ────────────────────────────────
    return {
      url,
      snapshot: { ...snapshot, consoleErrors, pageErrors },
      accessibilityResults,
      linkResults,
      overflowResults,
      timing,
      responseHeaders,
    };
  } finally {
    await browser.close();
  }
}

async function checkLinks(links, context, baseUrl) {
  const results = [];
  const seen = new Set();

  const toCheck = links
    .filter((l) => {
      if (
        !l.href ||
        l.href.startsWith("mailto:") ||
        l.href.startsWith("tel:") ||
        l.href.startsWith("javascript:")
      )
        return false;
      if (l.href.includes("#") && l.href.split("#")[0] === baseUrl)
        return false;
      if (seen.has(l.href)) return false;
      seen.add(l.href);
      return true;
    })
    .slice(0, 100);

  const batchSize = 10;
  for (let i = 0; i < toCheck.length; i += batchSize) {
    const batch = toCheck.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map((link) => checkSingleLink(link, context)),
    );
    results.push(...batchResults.filter(Boolean));
  }

  return results;
}

async function checkSingleLink(link, context) {
  try {
    const page = await context.newPage();
    const redirectChain = [];

    page.on("response", (response) => {
      if ([301, 302, 303, 307, 308].includes(response.status())) {
        redirectChain.push({
          from: response.url(),
          status: response.status(),
          to: response.headers()["location"] || "unknown",
        });
      }
    });

    const response = await page
      .goto(link.href, { waitUntil: "domcontentloaded", timeout: 10000 })
      .catch(() => null);

    await page.close();

    if (!response)
      return {
        type: "error",
        category: "links",
        title: "Link unreachable",
        element: link.text || link.href,
        detail: `Could not connect to: ${link.href}`,
      };

    const status = response.status();

    if (status === 404)
      return {
        type: "error",
        category: "links",
        title: "Broken link (404)",
        element: link.text || link.href,
        detail: `Page not found: ${link.href}`,
      };

    if (status >= 500)
      return {
        type: "error",
        category: "links",
        title: `Server error on link (${status})`,
        element: link.text || link.href,
        detail: `Server returned ${status} for: ${link.href}`,
      };

    if (redirectChain.length > 0) {
      const chain = redirectChain
        .map((r) => `${r.from} → ${r.to} (${r.status})`)
        .join("\n");
      return {
        type: redirectChain.length > 1 ? "error" : "warning",
        category: "links",
        title:
          redirectChain.length > 1
            ? `Redirect chain (${redirectChain.length} hops)`
            : `Redirect (${redirectChain[0].status})`,
        element: link.text || link.href,
        detail: chain,
      };
    }

    return null;
  } catch {
    return {
      type: "warning",
      category: "links",
      title: "Link check timed out",
      element: link.text || link.href,
      detail: `Could not verify within timeout: ${link.href}`,
    };
  }
}

async function checkViewportOverflows(context, url) {
  const viewports = [
    { name: "mobile", width: 390, height: 844 },
    { name: "tablet", width: 768, height: 1024 },
    { name: "desktop", width: 1280, height: 900 },
  ];

  const results = [];

  for (const vp of viewports) {
    const page = await context.newPage();
    await page.setViewportSize({ width: vp.width, height: vp.height });

    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
      await page.waitForTimeout(1500);

      const overflows = await page.evaluate((vpName) => {
        const issues = [];
        const bodyWidth = document.documentElement.clientWidth;

        if (document.documentElement.scrollWidth > bodyWidth) {
          issues.push({
            viewport: vpName,
            selector: "<html>",
            scrollWidth: document.documentElement.scrollWidth,
            clientWidth: bodyWidth,
          });
        }
        if (document.body.scrollWidth > bodyWidth) {
          issues.push({
            viewport: vpName,
            selector: "<body>",
            scrollWidth: document.body.scrollWidth,
            clientWidth: bodyWidth,
          });
        }

        for (const el of document.querySelectorAll("*")) {
          const style = window.getComputedStyle(el);
          if (
            style.overflow === "hidden" ||
            style.overflowX === "hidden" ||
            style.display === "none" ||
            style.visibility === "hidden" ||
            style.position === "fixed"
          )
            continue;

          const rect = el.getBoundingClientRect();
          if (rect.right > bodyWidth + 2) {
            const tag = el.tagName.toLowerCase();
            const id = el.id ? `#${el.id}` : "";
            const cls = el.classList.length
              ? "." + [...el.classList].slice(0, 3).join(".")
              : "";
            issues.push({
              viewport: vpName,
              selector: `${tag}${id}${cls}`,
              overflowAmount: Math.round(rect.right - bodyWidth),
              scrollWidth: el.scrollWidth,
              clientWidth: bodyWidth,
            });
          }
        }

        const seen = new Set();
        return issues
          .filter((i) => {
            if (seen.has(i.selector)) return false;
            seen.add(i.selector);
            return true;
          })
          .slice(0, 15);
      }, vp.name);

      results.push(...overflows);
    } catch (err) {
      results.push({
        viewport: vp.name,
        selector: "page",
        error: err.message.split("\n")[0],
      });
    } finally {
      await page.close();
    }
  }

  return results;
}
