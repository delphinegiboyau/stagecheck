export function runJavaScriptChecks(snapshot) {
  const issues = [];
  const { consoleErrors = [], pageErrors = [] } = snapshot;

  for (const err of pageErrors) {
    issues.push({
      type: "error",
      category: "javascript",
      title: "JavaScript error on page load",
      element: err.slice(0, 200),
      detail:
        "This error fires when the page loads. It may break functionality for all users.",
    });
  }

  for (const err of consoleErrors) {
    // Filter out known noise from browser extensions, ads, etc.
    if (
      err.includes("chrome-extension") ||
      err.includes("moz-extension") ||
      err.includes("favicon") ||
      err.includes("ERR_BLOCKED_BY_CLIENT")
    )
      continue;

    issues.push({
      type: "warning",
      category: "javascript",
      title: "Console error detected",
      element: err.slice(0, 200),
      detail:
        "A console error was logged on page load. This may indicate a broken script or failed resource.",
    });
  }

  return issues;
}
