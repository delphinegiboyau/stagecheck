import { crawlPage } from "../crawler/playwright.js";
import { runSeoChecks } from "./seo.js";
import { runLayoutChecks } from "./layout.js";
import { runLlmReadinessChecks } from "./llm.js";
import { runPerformanceChecks } from "./performance.js";
import { runSecurityChecks } from "./security.js";
import { runFormChecks } from "./forms.js";
import { runMediaChecks } from "./media.js";
import { runThirdPartyChecks } from "./thirdparty.js";
import { runJavaScriptChecks } from "./javascript.js";
import { runSemanticChecks } from "./semantic.js";

export async function runFullAudit(url) {
  const {
    snapshot,
    accessibilityResults,
    linkResults,
    overflowResults,
    timing,
    responseHeaders,
  } = await crawlPage(url);

  const [
    seoIssues,
    layoutIssues,
    llmIssues,
    perfIssues,
    securityIssues,
    formIssues,
    mediaIssues,
    thirdPartyIssues,
    semanticIssues,
    jsIssues,
  ] = await Promise.all([
    runSeoChecks(snapshot),
    runLayoutChecks(snapshot, overflowResults),
    runLlmReadinessChecks(snapshot),
    runPerformanceChecks(snapshot, timing),
    runSecurityChecks(responseHeaders),
    runFormChecks(snapshot),
    runMediaChecks(snapshot),
    runThirdPartyChecks(snapshot),
    runJavaScriptChecks(snapshot),
    runSemanticChecks(snapshot),
  ]);

  const allIssues = [
    ...seoIssues,
    ...layoutIssues,
    ...accessibilityResults,
    ...llmIssues,
    ...perfIssues,
    ...securityIssues,
    ...formIssues,
    ...mediaIssues,
    ...thirdPartyIssues,
    ...jsIssues,
    ...semanticIssues,
    ...linkResults,
  ];

  return {
    url,
    auditedAt: new Date().toISOString(),
    timing,
    summary: {
      total: allIssues.length,
      errors: allIssues.filter((i) => i.type === "error").length,
      warnings: allIssues.filter((i) => i.type === "warning").length,
    },
    issues: allIssues,
  };
}
