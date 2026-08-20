const HUB_URL = chrome.runtime.getURL("hub.html");

chrome.action.onClicked.addListener(async () => {
  const [existing] = await chrome.tabs.query({ url: HUB_URL });
  if (existing) {
    await chrome.tabs.update(existing.id, { active: true });
    await chrome.windows.update(existing.windowId, { focused: true });
    return;
  }
  await chrome.tabs.create({ url: HUB_URL });
});
