
// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('PocketChat installed');
    
    // Initialize default settings
    chrome.storage.sync.set({
      deepseekSettings: {
        apiKey: '',
        model: 'deepseek-chat',
        maxTokens: 4096,
        temperature: 0.7
      }
    });
    
    // Initialize empty chat storage
    chrome.storage.local.set({
      deepseekChats: []
    });
  }
});

// Handle messages from popup or content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getSettings') {
    chrome.storage.sync.get(['deepseekSettings'], (result) => {
      sendResponse(result.deepseekSettings || {});
    });
    return true; // Keep message channel open for async response
  }
  
  if (request.action === 'saveSettings') {
    chrome.storage.sync.set({ deepseekSettings: request.settings }, () => {
      sendResponse({ success: true });
    });
    return true;
  }
  
  if (request.action === 'getChats') {
    chrome.storage.local.get(['deepseekChats'], (result) => {
      sendResponse(result.deepseekChats || []);
    });
    return true;
  }
  
  if (request.action === 'saveChats') {
    chrome.storage.local.set({ deepseekChats: request.chats }, () => {
      sendResponse({ success: true });
    });
    return true;
  }
});

// Удалён блок chrome.action.onClicked.addListener, так как action больше не используется

// Optional: Handle context menu (for future features)
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'deepseekChat',
    title: 'Отправить в DeepSeek Chat',
    contexts: ['selection']
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'deepseekChat' && info.selectionText) {
    // Store selected text for potential use in popup
    chrome.storage.local.set({ 
      selectedText: info.selectionText 
    });
  }
});

// Handle storage changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync' && changes.deepseekSettings) {
    console.log('Settings updated:', changes.deepseekSettings.newValue);
  }
  
  if (namespace === 'local' && changes.deepseekChats) {
    console.log('Chats updated:', changes.deepseekChats.newValue);
  }
});