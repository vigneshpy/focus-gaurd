// Default blocked sites
const DEFAULT_BLOCKED = ['discord.com', 'discord.gg'];

// Initialize storage
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['blockedSites', 'enabled', 'blockCount', 'cooldownMinutes'], (data) => {
    if (!data.blockedSites) {
      chrome.storage.local.set({ 
        blockedSites: DEFAULT_BLOCKED,
        enabled: true,
        blockCount: 0,
        cooldownMinutes: 5
      });
    }
  });
});

// Check navigation and block if needed
chrome.webNavigation.onBeforeNavigate.addListener((details) => {
  if (details.frameId !== 0) return; // Only main frame
  
  chrome.storage.local.get(['blockedSites', 'enabled', 'blockCount', 'tempUnblock'], (data) => {
    if (!data.enabled) return;
    
    const url = new URL(details.url);
    const isBlocked = (data.blockedSites || []).some(site => 
      url.hostname.includes(site)
    );
    
    // Check if temporarily unblocked
    if (data.tempUnblock && Date.now() < data.tempUnblock) {
      return;
    }
    
    if (isBlocked) {
      // Increment block count
      chrome.storage.local.set({ blockCount: (data.blockCount || 0) + 1 });
      
      // Redirect to blocked page
      const blockedUrl = chrome.runtime.getURL('blocked.html') + 
        '?site=' + encodeURIComponent(url.hostname);
      chrome.tabs.update(details.tabId, { url: blockedUrl });
    }
  });
});

// Listen for messages from popup/blocked page
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'tempUnblock') {
    chrome.storage.local.get(['cooldownMinutes'], (data) => {
      const unblockUntil = Date.now() + ((data.cooldownMinutes || 5) * 60 * 1000);
      chrome.storage.local.set({ tempUnblock: unblockUntil });
      sendResponse({ success: true });
    });
    return true;
  }
});