import { defineBackground } from 'wxt/utils/define-background';

export default defineBackground(() => {
  // Forward keyboard commands to the active tab's content script.
  browser.commands.onCommand.addListener(async (command) => {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) browser.tabs.sendMessage(tab.id, { type: command });
  });

  // Right-click → save selection (wired to the integrations layer later).
  browser.runtime.onInstalled.addListener(() => {
    browser.contextMenus.create({
      id: 'afr-save-selection',
      title: 'Save selection to library',
      contexts: ['selection'],
    });
  });

  browser.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === 'afr-save-selection' && tab?.id) {
      // TODO(integrations): persist via lib/integrations + saved library.
      browser.tabs.sendMessage(tab.id, {
        type: 'save-selection',
        text: info.selectionText,
        url: info.pageUrl,
      });
    }
  });
});
