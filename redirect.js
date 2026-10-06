// Opera applies the declarativeNetRequest redirects to Google search pages only once per
// browser session, then never again (rules still enabled and matching). Content scripts
// keep running, so this redoes the same rewrite as rules.json and minus-ai.json from the
// page. When the rule did fire, the URL already has what it needs and this does nothing.
chrome.runtime.sendMessage({ enabled: true }, (ids) => {
  if (chrome.runtime.lastError || !ids) return;
  const url = new URL(location.href);
  const p = url.searchParams;
  if (p.has("sa")) return; // a click inside Google: go where the user aimed

  const q = p.get("q");
  if (ids.includes("minus-ai") && q && !/-ai$/i.test(q)) p.set("q", `${q} -ai`);
  if (ids.includes("ruleset")) {
    if (p.get("udm") === "26") p.set("udm", "48");
    else if (!p.has("udm") && !p.has("tbm") && p.has("q")) p.set("udm", "14");
  }

  // Never redirect to the same URL twice in a row, so a server that drops our change
  // can't loop. Any page that needs no redirect ends the run.
  if (url.href === location.href) return sessionStorage.removeItem("udm14");
  if (sessionStorage.udm14 === url.href) return;
  sessionStorage.udm14 = url.href;
  location.replace(url.href);
});
