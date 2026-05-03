export function runFormChecks(snapshot) {
  const issues = [];
  const { forms = [] } = snapshot;

  if (!forms.length) return issues;

  for (const form of forms) {
    // Missing action
    if (!form.action) {
      issues.push({
        type: "warning",
        category: "forms",
        title: "Form missing action attribute",
        detail:
          "A form with no action attribute may not submit correctly without JavaScript.",
        element: form.outerHTML.slice(0, 100),
      });
    }

    // No submit button
    if (!form.hasSubmit) {
      issues.push({
        type: "error",
        category: "forms",
        title: "Form has no submit button",
        detail:
          "Forms must have a submit button to be usable without JavaScript.",
        element: form.outerHTML.slice(0, 100),
      });
    }

    for (const input of form.inputs) {
      // Missing label
      if (
        !input.hasLabel &&
        !["hidden", "submit", "button", "reset"].includes(input.type)
      ) {
        issues.push({
          type: "error",
          category: "forms",
          title: `Form input missing label`,
          element: `<input type="${input.type}" name="${input.name || ""}" id="${input.id || ""}">`,
          detail: `Input "${input.name || input.id || input.type}" has no associated label. Screen readers cannot identify this field.`,
        });
      }

      // Missing autocomplete on common fields
      const autocompletable = ["email", "tel", "text", "search"];
      const commonNames = ["email", "phone", "name", "first", "last", "search"];
      const needsAutocomplete =
        autocompletable.includes(input.type) &&
        commonNames.some((n) => (input.name || "").toLowerCase().includes(n)) &&
        !input.autocomplete;

      if (needsAutocomplete) {
        issues.push({
          type: "warning",
          category: "forms",
          title: `Input "${input.name}" missing autocomplete attribute`,
          element: `<input type="${input.type}" name="${input.name}">`,
          detail: `Add autocomplete="${input.type === "email" ? "email" : "on"}" to help users fill forms faster.`,
        });
      }
    }
  }

  return issues;
}
