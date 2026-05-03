<<<<<<< HEAD
export function runLayoutChecks(snapshot) {
  const issues = [];
  const { bodyScrollWidth, viewportWidth, overflowingElements } = snapshot;

  if (bodyScrollWidth > viewportWidth) {
    issues.push({
      type: "error",
      category: "layout",
      title: "Horizontal overflow detected on body",
      detail: `scrollWidth: ${bodyScrollWidth}px, viewport: ${viewportWidth}px`,
    });
  }

  for (const el of overflowingElements) {
    issues.push({
      type: "error",
      category: "layout",
      title: `Element overflows container`,
      selector: el.selector,
      detail: `scrollWidth: ${el.scrollWidth}px`,
    });
  }

  return issues;
}
=======
export function runLayoutChecks(snapshot) {
  const issues = [];
  const { bodyScrollWidth, viewportWidth, overflowingElements } = snapshot;

  if (bodyScrollWidth > viewportWidth) {
    issues.push({
      type: "error",
      category: "layout",
      title: "Horizontal overflow detected on body",
      detail: `scrollWidth: ${bodyScrollWidth}px, viewport: ${viewportWidth}px`,
    });
  }

  for (const el of overflowingElements) {
    issues.push({
      type: "error",
      category: "layout",
      title: `Element overflows container`,
      selector: el.selector,
      detail: `scrollWidth: ${el.scrollWidth}px`,
    });
  }

  return issues;
}
>>>>>>> 8f72303 (feat: new criteria and advanced full check added)
