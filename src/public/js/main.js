let allIssues = [];
let activeFilter = "all";

async function runAudit() {
  const url = document.getElementById("urlInput").value.trim();
  if (!url) return;

  const btn = document.getElementById("runBtn");
  const status = document.getElementById("status");

  btn.disabled = true;
  btn.textContent = "Auditing…";
  status.className = "status running";
  status.textContent =
    "Crawling page and running checks… this takes 10–20 seconds.";
  document.getElementById("results").style.display = "none";
<<<<<<< HEAD
=======
  document.getElementById("timingBar").innerHTML = "";
>>>>>>> 8f72303 (feat: new criteria and advanced full check added)

  try {
    const res = await fetch("/audit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });

    const data = await res.json();
<<<<<<< HEAD
=======
    console.log("timing:", JSON.stringify(data.timing));
>>>>>>> 8f72303 (feat: new criteria and advanced full check added)
    if (!res.ok) throw new Error(data.error || "Audit failed");

    status.className = "status";
    status.textContent = `Audit complete — ${data.issues.length} issues found.`;
    renderResults(data);
  } catch (err) {
    status.className = "status error";
<<<<<<< HEAD
    status.textContent = "Error: " + err.message;
=======
    status.textContent = err.message.includes("ERR_HTTP")
      ? "Could not reach that URL. Make sure it is accessible and not behind bot protection."
      : "Error: " + err.message;
>>>>>>> 8f72303 (feat: new criteria and advanced full check added)
  } finally {
    btn.disabled = false;
    btn.textContent = "Run audit";
  }
}

<<<<<<< HEAD
=======
function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderTimingBar(label, ms, total, color) {
  if (!ms || !total) return "";
  const pct = Math.max(1, Math.round((ms / total) * 100));
  return `<div title="${label}: ${ms}ms" style="width:${pct}%;background:${color};border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:9px;color:#555;overflow:hidden;white-space:nowrap;padding:0 4px;">${pct > 8 ? label : ""}</div>`;
}

function renderTimingStat(label, ms, warnThreshold, errorThreshold) {
  if (ms === null || ms === undefined) return "";
  const color =
    ms > errorThreshold
      ? "#dc2626"
      : ms > warnThreshold
        ? "#d97706"
        : "#16a34a";
  return `<div style="font-size:12px;"><span style="color:#888;">${label}</span><br><strong style="color:${color};">${ms >= 1000 ? (ms / 1000).toFixed(1) + "s" : ms + "ms"}</strong></div>`;
}

>>>>>>> 8f72303 (feat: new criteria and advanced full check added)
function renderResults(data) {
  allIssues = data.issues;
  activeFilter = "all";

  document.getElementById("numErrors").textContent = data.summary.errors;
  document.getElementById("numWarnings").textContent = data.summary.warnings;
  document.getElementById("numTotal").textContent = data.summary.total;
  document.getElementById("numPassed").textContent = "—";

<<<<<<< HEAD
=======
  // Timing bar
  const t = data.timing || {};
  const timingMeta = {
    TTFB: {
      label: "TTFB",
      full: "Time To First Byte",
      desc: "How long the server takes to respond",
    },
    DOMContentLoaded: {
      label: "DCL",
      full: "DOMContentLoaded",
      desc: "When HTML is fully parsed and DOM is ready",
    },
    "Full Load": {
      label: "Load",
      full: "Full Page Load",
      desc: "Everything including images and scripts",
    },
    LCP: {
      label: "LCP",
      full: "Largest Contentful Paint",
      desc: "When the main content becomes visible",
    },
  };

  document.getElementById("timingBar").innerHTML =
    t.fullLoad != null
      ? `
 
  <div style="background:#fff;border:1px solid #e5e5e0;border-radius:8px;padding:16px 20px;margin-bottom:20px;">
    <div style="font-size:11px;font-weight:500;color:#888;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:12px;">Page load timing</div>

    <div style="display:flex;gap:6px;align-items:stretch;height:32px;margin-bottom:10px;">
      ${renderTimingBar("DNS", t.dns, t.fullLoad, "#bfdbfe")}
      ${renderTimingBar("TCP", t.tcp, t.fullLoad, "#a7f3d0")}
      ${renderTimingBar("TTFB", t.ttfb, t.fullLoad, "#fde68a")}
      ${renderTimingBar("Download", t.download, t.fullLoad, "#fbcfe8")}
      ${renderTimingBar("DOM", t.domParsing, t.fullLoad, "#ddd6fe")}
    </div>

    <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:14px;">
      ${renderTimingStat("TTFB", t.ttfb, 800, 1800)}
      ${renderTimingStat("DOMContentLoaded", t.domContentLoaded, 3000, 5000)}
      ${renderTimingStat("Full Load", t.fullLoad, 5000, 8000)}
      ${renderTimingStat("LCP", t.lcpMs, 2500, 4000)}
      ${
        t.transferSize
          ? `
        <div style="font-size:12px;">
          <span style="color:#888;">Transfer size</span><br>
          <strong>${(t.transferSize / 1024 / 1024).toFixed(2)} MB</strong>
        </div>`
          : ""
      }
    </div>

    <div style="border-top:1px solid #f0f0ee;padding-top:12px;display:flex;flex-wrap:wrap;gap:12px;">
      ${Object.entries(timingMeta)
        .map(
          ([key, m]) => `
        <div style="display:flex;align-items:flex-start;gap:6px;font-size:11px;color:#666;min-width:180px;">
          <span style="font-weight:600;color:#333;white-space:nowrap;">${m.label} —</span>
          <span><span style="font-weight:500;color:#333;">${m.full}:</span> ${m.desc}</span>
        </div>
      `,
        )
        .join("")}
      <div style="display:flex;align-items:flex-start;gap:6px;font-size:11px;color:#666;min-width:180px;">
        <span style="font-weight:600;color:#333;white-space:nowrap;">DNS —</span>
        <span><span style="font-weight:500;color:#333;">DNS Lookup:</span> Time to resolve the domain name to an IP address</span>
      </div>
      <div style="display:flex;align-items:flex-start;gap:6px;font-size:11px;color:#666;min-width:180px;">
        <span style="font-weight:600;color:#333;white-space:nowrap;">TCP —</span>
        <span><span style="font-weight:500;color:#333;">TCP Handshake:</span> Time to establish a connection with the server</span>
      </div>
    </div>

    <div style="margin-top:10px;font-size:11px;color:#aaa;">
      🟢 Good &nbsp; 🟡 Needs improvement &nbsp; 🔴 Poor — based on Google Core Web Vitals thresholds
    </div>
  </div>
`
      : "";

  // Filters
>>>>>>> 8f72303 (feat: new criteria and advanced full check added)
  const categories = ["all", ...new Set(allIssues.map((i) => i.category))];
  const filtersEl = document.getElementById("filters");
  filtersEl.innerHTML = categories
    .map(
<<<<<<< HEAD
      (c) => `
      <button class="filter-btn ${c === "all" ? "active" : ""}" onclick="setFilter('${c}')">${c === "all" ? "All issues" : c}</button>
    `,
=======
      (c) =>
        `<button class="filter-btn ${c === "all" ? "active" : ""}" onclick="setFilter('${c}')">${c === "all" ? "All issues" : c}</button>`,
>>>>>>> 8f72303 (feat: new criteria and advanced full check added)
    )
    .join("");

  renderIssues();
  document.getElementById("results").style.display = "block";
}

function setFilter(cat) {
  activeFilter = cat;
  document.querySelectorAll(".filter-btn").forEach((b) => {
    b.classList.toggle(
      "active",
      b.textContent === cat ||
        (cat === "all" && b.textContent === "All issues"),
    );
  });
  renderIssues();
}

function renderIssues() {
  const filtered =
    activeFilter === "all"
      ? allIssues
      : allIssues.filter((i) => i.category === activeFilter);
  const el = document.getElementById("issuesList");

  if (!filtered.length) {
    el.innerHTML = '<div class="empty">No issues in this category</div>';
    return;
  }

  el.innerHTML = filtered
    .map(
      (issue) => `
<<<<<<< HEAD
      <div class="issue ${issue.type}">
        <div class="issue-top">
          <span class="issue-title">${issue.title}</span>
          <span class="badge badge-${issue.category}">${issue.category}</span>
        </div>
        ${issue.detail ? `<div class="issue-detail">${issue.detail}</div>` : ""}
        ${issue.selector ? `<div class="issue-selector">${issue.selector}</div>` : ""}
        ${issue.elements?.length ? `<div class="issue-code">${issue.elements.slice(0, 3).join("\n")}</div>` : ""}
=======
      <div class="issue ${escapeHtml(issue.type)}">
        <div class="issue-top">
          <span class="issue-title">${escapeHtml(issue.title)}</span>
          <span class="badge badge-${escapeHtml(issue.category)}">${escapeHtml(issue.category)}${issue.source === "claude" ? " ✦" : ""}</span>
        </div>
        ${issue.element ? `<div class="issue-code">❯ ${escapeHtml(issue.element)}</div>` : ""}
        ${issue.detail ? `<div class="issue-detail">${escapeHtml(issue.detail)}</div>` : ""}
        ${issue.selector ? `<div class="issue-selector">${escapeHtml(issue.selector)}</div>` : ""}
        ${issue.elements?.length ? `<div class="issue-code">${issue.elements.slice(0, 3).map(escapeHtml).join("<br>")}</div>` : ""}
        ${issue.help ? `<a href="${escapeHtml(issue.help)}" target="_blank" style="font-size:11px;color:#2563eb;display:block;margin-top:6px;">Learn more ↗</a>` : ""}
>>>>>>> 8f72303 (feat: new criteria and advanced full check added)
      </div>
    `,
    )
    .join("");
}

document.getElementById("urlInput").addEventListener("keydown", (e) => {
  if (e.key === "Enter") runAudit();
});
