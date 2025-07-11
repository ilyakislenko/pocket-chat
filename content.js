// DeepSeek Chat Extension - Content Script

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getSelectedText') {
    const selectedText = window.getSelection().toString();
    sendResponse({ text: selectedText });
  }
});

// Optional: Add keyboard shortcut to open chat with selected text
document.addEventListener('keydown', (event) => {
  // Ctrl+Shift+D to open chat with selected text
  if (event.ctrlKey && event.shiftKey && event.key === 'D') {
    const selectedText = window.getSelection().toString();
    if (selectedText) {
      // Store selected text for popup to use
      chrome.storage.local.set({ 
        selectedText: selectedText,
        openWithText: true 
      });
      
      // Open popup (this will be handled by the popup script)
      chrome.runtime.sendMessage({ action: 'openPopup' });
    }
  }
});

// Optional: Add floating button for quick access
let floatingButton = null;

function createFloatingButton() {
  if (floatingButton) return;
  
  floatingButton = document.createElement('div');
  floatingButton.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
  `;
  
  floatingButton.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 50px;
    height: 50px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 10000;
    transition: all 0.2s ease;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;
  
  floatingButton.addEventListener('mouseenter', () => {
    floatingButton.style.transform = 'scale(1.1)';
  });
  
  floatingButton.addEventListener('mouseleave', () => {
    floatingButton.style.transform = 'scale(1)';
  });
  
  floatingButton.addEventListener('click', () => {
    const selectedText = window.getSelection().toString();
    if (selectedText) {
      chrome.storage.local.set({ 
        selectedText: selectedText,
        openWithText: true 
      });
    }
    chrome.runtime.sendMessage({ action: 'openPopup' });
  });
  
  document.body.appendChild(floatingButton);
}

function removeFloatingButton() {
  if (floatingButton) {
    floatingButton.remove();
    floatingButton = null;
  }
}

// Show floating button on certain websites (optional)
const showFloatingButtonSites = [
  'github.com',
  'stackoverflow.com',
  'developer.mozilla.org',
  'medium.com'
];

if (showFloatingButtonSites.some(site => window.location.hostname.includes(site))) {
  // Delay to ensure page is loaded
  setTimeout(createFloatingButton, 2000);
}

// Clean up when page unloads
window.addEventListener('beforeunload', () => {
  removeFloatingButton();
});