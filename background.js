const CSS = { purge: "purge.css", "all-tab": "alltab.css" };

const iconPaths = (on) =>
  Object.fromEntries(
    [16, 32, 48, 128].map((s) => [s, `/images/icon-${s}${on ? "" : "-off"}.png`])
  );

async function apply(id, on) {
  if (id in CSS) {
    const has = (await chrome.scripting.getRegisteredContentScripts({ ids: [id] })).length > 0;
    if (on && !has)
      await chrome.scripting.registerContentScripts([
        { id, css: [CSS[id]], matches: chrome.runtime.getManifest().host_permissions, runAt: "document_start" },
      ]);
    else if (!on && has) await chrome.scripting.unregisterContentScripts({ ids: [id] });
    return;
  }
  await chrome.declarativeNetRequest.updateEnabledRulesets(
    on ? { enableRulesetIds: [id] } : { disableRulesetIds: [id] }
  );
  if (id === "ruleset") await chrome.action.setIcon({ path: iconPaths(on) });
}

chrome.runtime.onInstalled.addListener(async () => {
  for (const [id, on] of Object.entries(await chrome.storage.local.get())) await apply(id, on);
});

chrome.runtime.onStartup.addListener(async () => {
  const enabled = await chrome.declarativeNetRequest.getEnabledRulesets();
  if (!enabled.includes("ruleset")) chrome.action.setIcon({ path: iconPaths(false) });
});

chrome.runtime.onMessage.addListener((msg, sender, respond) => {
  if ("id" in msg)
    chrome.storage.local.set({ [msg.id]: msg.on }).then(() => apply(msg.id, msg.on)).finally(respond);
  else chrome.declarativeNetRequest.getEnabledRulesets().then(respond);
  return true;
});
