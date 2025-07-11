// DeepSeek Chat Extension - Main JavaScript

// Подключаем Tesseract.js через CDN
// Удалён блок с document.head.appendChild(tesseractScript) для tesseract.js

// Указываем локальные пути для Tesseract.js worker и языковых файлов
// Отключаем использование воркера для Tesseract.js (single-threaded mode)
window.Tesseract = window.Tesseract || {};
// workerPath и langPath не нужны

class DeepSeekChat {
  constructor() {
    this.currentChatId = null;
    this.chats = [];
    this.settings = {
      apiKey: '',
      model: 'deepseek-chat',
      maxTokens: 4096,
      temperature: 0.7
    };
    
    this.init();
  }

  async init() {
    await this.loadSettings();
    await this.loadChats();
    this.setupEventListeners();
    this.updateUI();
    this.checkApiStatus();
  }

  // Settings Management
  async loadSettings() {
    try {
      const result = await chrome.storage.sync.get(['deepseekSettings']);
      if (result.deepseekSettings) {
        this.settings = { ...this.settings, ...result.deepseekSettings };
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }

  async saveSettings() {
    try {
      await chrome.storage.sync.set({ deepseekSettings: this.settings });
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }

  // Chat Management
  async loadChats() {
    try {
      const result = await chrome.storage.local.get(['deepseekChats']);
      this.chats = result.deepseekChats || [];
    } catch (error) {
      console.error('Error loading chats:', error);
      this.chats = [];
    }
  }

  async saveChats() {
    try {
      await chrome.storage.local.set({ deepseekChats: this.chats });
    } catch (error) {
      console.error('Error saving chats:', error);
    }
  }

  createNewChat() {
    const chatId = Date.now().toString();
    const newChat = {
      id: chatId,
      title: 'Новый чат',
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    this.chats.unshift(newChat);
    this.currentChatId = chatId;
    this.saveChats();
    this.updateUI();
  }

  selectChat(chatId) {
    this.currentChatId = chatId;
    this.updateUI();
  }

  async deleteChat(chatId) {
    if (confirm('Вы уверены, что хотите удалить этот чат?')) {
      this.chats = this.chats.filter(chat => chat.id !== chatId);
      
      if (this.currentChatId === chatId) {
        this.currentChatId = this.chats.length > 0 ? this.chats[0].id : null;
      }
      
      await this.saveChats();
      this.updateUI();
    }
  }

  async clearAllChats() {
    if (confirm('Вы уверены, что хотите очистить всю историю чатов? Это действие нельзя отменить.')) {
      this.chats = [];
      this.currentChatId = null;
      await this.saveChats();
      this.updateUI();
    }
  }

  // Message Management
  addMessage(content, role = 'user') {
    if (!this.currentChatId) {
      this.createNewChat();
    }

    const chat = this.chats.find(c => c.id === this.currentChatId);
    if (!chat) return;

    const message = {
      id: Date.now().toString(),
      content,
      role,
      timestamp: new Date().toISOString()
    };

    chat.messages.push(message);
    chat.updatedAt = new Date().toISOString();
    
    // Update chat title if it's the first user message
    if (chat.messages.length === 1 && role === 'user') {
      chat.title = content.substring(0, 50) + (content.length > 50 ? '...' : '');
    }

    this.saveChats();
    this.updateUI();
    this.scrollToBottom();
  }

  // API Communication
  async sendMessage(content) {
    if (this.settings.provider === 'openrouter') {
      if (!this.settings.openrouterApiKey) {
        alert('Пожалуйста, настройте OpenRouter API ключ в настройках');
        return;
      }
      this.addMessage(content, 'user');
      this.showLoading(true);
      try {
        const response = await this.callOpenRouterAPI(content);
        this.addMessage(response, 'assistant');
      } catch (error) {
        console.error('API Error:', error);
        this.addMessage('Ошибка при отправке сообщения: ' + error.message, 'assistant');
      } finally {
        this.showLoading(false);
      }
    } else {
      if (!this.settings.apiKey) {
        alert('Пожалуйста, настройте API ключ в настройках');
        return;
      }
      this.addMessage(content, 'user');
      this.showLoading(true);
      try {
        const response = await this.callDeepSeekAPI(content);
        this.addMessage(response, 'assistant');
      } catch (error) {
        console.error('API Error:', error);
        this.addMessage('Ошибка при отправке сообщения: ' + error.message, 'assistant');
      } finally {
        this.showLoading(false);
      }
    }
  }

  async callDeepSeekAPI(content) {
    const currentChat = this.chats.find(c => c.id === this.currentChatId);
    if (!currentChat) throw new Error('Чат не найден');

    const messages = currentChat.messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    const requestBody = {
      model: this.settings.model,
      messages: messages,
      max_tokens: this.settings.maxTokens,
      temperature: this.settings.temperature,
      stream: false
    };

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.settings.apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  async callOpenRouterAPI(content) {
    const currentChat = this.chats.find(c => c.id === this.currentChatId);
    if (!currentChat) throw new Error('Чат не найден');

    const messages = currentChat.messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    const requestBody = {
      model: this.settings.openrouterModel || 'openai/gpt-3.5-turbo',
      messages: messages,
      max_tokens: this.settings.maxTokens,
      temperature: this.settings.temperature,
      stream: false
    };

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.settings.openrouterApiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  // UI Management
  updateUI() {
    this.updateChatList();
    this.updateChatInterface();
    this.updateWelcomeScreen();
  }

  updateChatList() {
    const chatList = document.getElementById('chatList');
    const chatSidebar = document.getElementById('chatSidebar');
    chatList.innerHTML = '';

    // Кнопка сворачивания/разворачивания
    // const toggleBtn = document.createElement('button');
    // toggleBtn.id = 'toggleSidebarBtn';
    // toggleBtn.className = 'sidebar-toggle-btn';
    // toggleBtn.title = 'Свернуть/развернуть список чатов';
    // toggleBtn.innerHTML = '<span id="sidebarToggleIcon">←</span>';
    // chatSidebar.prepend(toggleBtn);

    this.chats.forEach(chat => {
      const chatItem = document.createElement('div');
      chatItem.className = `chat-item ${chat.id === this.currentChatId ? 'active' : ''}`;
      chatItem.onclick = () => this.selectChat(chat.id);

      const lastMessage = chat.messages[chat.messages.length - 1];
      const preview = lastMessage ? lastMessage.content.substring(0, 50) + (lastMessage.content.length > 50 ? '...' : '') : 'Нет сообщений';
      const date = new Date(chat.updatedAt).toLocaleDateString('ru-RU');

      chatItem.innerHTML = `
        <div class="chat-item-title-container"><span class="chat-item-title">${chat.title}</span>
          <button class="delete-chat-btn" title="Удалить чат" data-id="${chat.id}">×</button>
        </div>
        <div class="chat-item-preview">${preview}</div>
        <div class="chat-item-date">${date}</div>
      `;

      chatList.appendChild(chatItem);
    });

    // Обработчик удаления чата
    chatList.querySelectorAll('.delete-chat-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        if (id) this.deleteChat(id);
      });
    });

    // Обработчик сворачивания/разворачивания
    const sidebarToggleIcon = document.getElementById('sidebarToggleIcon');

    const toggleSidebarBtn = document.getElementById('toggleSidebarBtn');

    console.log({toggleSidebarBtn, chatSidebar , sidebarToggleIcon})
  }

  updateChatInterface() {
    const chatInterface = document.getElementById('chatInterface');
    const welcomeScreen = document.getElementById('welcomeScreen');

    if (this.currentChatId) {
      const chat = this.chats.find(c => c.id === this.currentChatId);
      if (chat) {
        document.getElementById('currentChatTitle').textContent = chat.title;
        this.updateMessages();
        chatInterface.style.display = 'flex';
        welcomeScreen.style.display = 'none';
      }
    } else {
      chatInterface.style.display = 'none';
      welcomeScreen.style.display = 'flex';
    }
  }

  updateWelcomeScreen() {
    const welcomeScreen = document.getElementById('welcomeScreen');
    if (this.chats.length === 0) {
      welcomeScreen.style.display = 'flex';
    }
  }

  updateMessages() {
    const messagesContainer = document.getElementById('messagesContainer');
    const chat = this.chats.find(c => c.id === this.currentChatId);
    
    if (!chat) return;

    messagesContainer.innerHTML = '';

    chat.messages.forEach(message => {
      const messageElement = document.createElement('div');
      messageElement.className = `message ${message.role}`;
      
      const time = new Date(message.timestamp).toLocaleTimeString('ru-RU', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });

      messageElement.innerHTML = `
        <div class="message-avatar">${message.role === 'user' ? 'U' : 'A'}</div>
        <div class="message-content">
          ${this.formatMessageContent(message.content)}
          <div class="message-time">${time}</div>
        </div>
      `;

      messagesContainer.appendChild(messageElement);
    });
  }

  formatMessageContent(content) {
    // Simple markdown-like formatting
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
      .replace(/\n/g, '<br>');
  }

  scrollToBottom() {
    const messagesContainer = document.getElementById('messagesContainer');
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  showLoading(show, text) {
    const loadingOverlay = document.getElementById('loadingOverlay');
    loadingOverlay.style.display = show ? 'flex' : 'none';
    if (text) {
      loadingOverlay.querySelector('p').textContent = text;
    } else {
      loadingOverlay.querySelector('p').textContent = 'Отправка сообщения...';
    }
  }

  checkApiStatus() {
    const apiStatus = document.getElementById('apiStatus');
    if (this.settings.apiKey) {
      apiStatus.textContent = 'API настроен';
      apiStatus.className = 'api-status connected';
    } else {
      apiStatus.textContent = 'API не настроен';
      apiStatus.className = 'api-status';
    }
  }

  // Event Listeners
  setupEventListeners() {
    // New chat buttons
    document.getElementById('newChatBtn').onclick = () => this.createNewChat();
    document.getElementById('startNewChatBtn').onclick = () => this.createNewChat();

    // Settings
    document.getElementById('settingsBtn').onclick = () => this.openSettings();
    document.getElementById('closeSettingsBtn').onclick = () => this.closeSettings();
    document.getElementById('saveSettingsBtn').onclick = () => this.saveSettingsFromUI();
    document.getElementById('cancelSettingsBtn').onclick = () => this.closeSettings();

    // Chat actions
    document.getElementById('deleteChatBtn').onclick = () => {
      if (this.currentChatId) this.deleteChat(this.currentChatId);
    };
    document.getElementById('clearHistoryBtn').onclick = () => this.clearAllChats();
    document.getElementById('exportChatBtn').onclick = () => this.exportChat();

    // Message input
    const messageInput = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');

    messageInput.oninput = () => {
      const content = messageInput.value.trim();
      sendBtn.disabled = !content;
      
      // Update character count
      document.getElementById('charCount').textContent = `${content.length}/4000`;
      
      // Auto-resize textarea
      messageInput.style.height = 'auto';
      messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + 'px';
    };

    messageInput.onkeydown = (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessageFromInput();
      }
    };

    sendBtn.onclick = () => this.sendMessageFromInput();

    // Temperature slider
    const temperatureInput = document.getElementById('temperatureInput');
    const temperatureValue = document.getElementById('temperatureValue');
    
    temperatureInput.oninput = () => {
      temperatureValue.textContent = temperatureInput.value;
    };

    // Функция для распознавания текста через OCR.space API
    async function recognizeWithOCRSpace(imageBase64) {
      const formData = new FormData();
      formData.append('base64Image', imageBase64);
      formData.append('language', 'auto');
      formData.append('OCREngine', '2');
      formData.append('isOverlayRequired', 'false');
      formData.append('apikey', 'K82472750288957'); // Пользовательский API-ключ

      const response = await fetch('https://api.ocr.space/parse/image', {
        method: 'POST',
        body: formData
      });
      const result = await response.json();
      return result.ParsedResults?.[0]?.ParsedText || '';
    }

    // В setupEventListeners добавляю обработку вставки изображения через Ctrl+V и выбор файла
    const imagePreviewContainer = document.getElementById('imagePreviewContainer');
    const imagePreview = document.getElementById('imagePreview');
    const imageInput = document.getElementById('imageInput');
    const attachImageBtn = document.getElementById('attachImageBtn');
    const removeImageBtn = document.getElementById('removeImageBtn');

    attachImageBtn.onclick = () => imageInput.click();
    imageInput.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (ev) => {
        imagePreview.src = ev.target.result;
        imagePreviewContainer.style.display = 'block';
        this.showLoading(true, 'Распознавание текста...');
        try {
          const text = await recognizeWithOCRSpace(ev.target.result);
          if (text) {
            messageInput.value = `"${text}"`;
            messageInput.dispatchEvent(new Event('input'));
          } else {
            alert('Текст не распознан. Попробуйте другой скриншот.');
          }
        } catch (err) {
          alert('Ошибка при распознавании текста: ' + err.message);
        } finally {
          this.showLoading(false);
        }
      };
      reader.readAsDataURL(file);
    };
    removeImageBtn.onclick = () => {
      imagePreview.src = '';
      imagePreviewContainer.style.display = 'none';
      imageInput.value = '';
    };
    messageInput.addEventListener('paste', async (e) => {
      if (!e.clipboardData) return;
      const items = e.clipboardData.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf('image') !== -1) {
          const file = item.getAsFile();
          if (!file) return;
          const reader = new FileReader();
          reader.onload = async (ev) => {
            imagePreview.src = ev.target.result;
            imagePreviewContainer.style.display = 'block';
            this.showLoading(true, 'Распознавание текста...');
            try {
              const text = await recognizeWithOCRSpace(ev.target.result);
              if (text) {
                messageInput.value = `"${text}"`;
                messageInput.dispatchEvent(new Event('input'));
              } else {
                alert('Текст не распознан. Попробуйте другой скриншот.');
              }
            } catch (err) {
              alert('Ошибка при распознавании текста: ' + err.message);
            } finally {
              this.showLoading(false);
            }
          };
          reader.readAsDataURL(file);
          e.preventDefault();
          break;
        }
      }
    });
  }

  sendMessageFromInput() {
    const messageInput = document.getElementById('messageInput');
    const content = messageInput.value.trim();
    
    if (content && !document.getElementById('sendBtn').disabled) {
      this.sendMessage(content);
      messageInput.value = '';
      messageInput.style.height = 'auto';
      document.getElementById('charCount').textContent = '0/4000';
      document.getElementById('sendBtn').disabled = true;
    }
  }

  openSettings() {
    const modal = document.getElementById('settingsModal');
    const providerSelect = document.getElementById('providerSelect');
    const apiKeyInput = document.getElementById('apiKeyInput');
    const openrouterApiKeyInput = document.getElementById('openrouterApiKeyInput');
    const openrouterModelSelect = document.getElementById('openrouterModelSelect');
    const modelSelect = document.getElementById('modelSelect');
    const maxTokensInput = document.getElementById('maxTokensInput');
    const temperatureInput = document.getElementById('temperatureInput');
    const temperatureValue = document.getElementById('temperatureValue');

    // Populate form with current settings
    providerSelect.value = this.settings.provider || 'deepseek';
    apiKeyInput.value = this.settings.apiKey || '';
    openrouterApiKeyInput.value = this.settings.openrouterApiKey || '';
    openrouterModelSelect.value = this.settings.openrouterModel || 'openai/gpt-3.5-turbo';
    modelSelect.value = this.settings.model;
    maxTokensInput.value = this.settings.maxTokens;
    temperatureInput.value = this.settings.temperature;
    temperatureValue.textContent = this.settings.temperature;

    modal.style.display = 'flex';
  }

  closeSettings() {
    document.getElementById('settingsModal').style.display = 'none';
  }

  async saveSettingsFromUI() {
    const providerSelect = document.getElementById('providerSelect');
    const apiKeyInput = document.getElementById('apiKeyInput');
    const openrouterApiKeyInput = document.getElementById('openrouterApiKeyInput');
    const openrouterModelSelect = document.getElementById('openrouterModelSelect');
    const modelSelect = document.getElementById('modelSelect');
    const maxTokensInput = document.getElementById('maxTokensInput');
    const temperatureInput = document.getElementById('temperatureInput');

    this.settings = {
      ...this.settings,
      provider: providerSelect.value,
      apiKey: apiKeyInput.value.trim(),
      openrouterApiKey: openrouterApiKeyInput.value.trim(),
      openrouterModel: openrouterModelSelect.value,
      model: modelSelect.value,
      maxTokens: parseInt(maxTokensInput.value),
      temperature: parseFloat(temperatureInput.value)
    };

    await this.saveSettings();
    this.checkApiStatus();
    this.closeSettings();
  }

  exportChat() {
    if (!this.currentChatId) return;

    const chat = this.chats.find(c => c.id === this.currentChatId);
    if (!chat) return;

    const exportData = {
      title: chat.title,
      createdAt: chat.createdAt,
      messages: chat.messages
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `deepseek-chat-${chat.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new DeepSeekChat();
  const chatSidebar = document.getElementById('chatSidebar');
  const toggleSidebarBtn = document.getElementById('toggleSidebarBtn');
  const sidebarToggleIcon = document.getElementById('sidebarToggleIcon');
  if (toggleSidebarBtn && chatSidebar && sidebarToggleIcon) {
    toggleSidebarBtn.addEventListener('click', function() {
      if (chatSidebar.classList.contains('sidebar-collapsed')) {
        chatSidebar.classList.remove('sidebar-collapsed');
        sidebarToggleIcon.textContent = '←';
      } else {
        chatSidebar.classList.add('sidebar-collapsed');
        sidebarToggleIcon.textContent = '→';
      }
    });
  }
});