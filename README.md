# Pocket Chat Extension

Расширение для браузера Chrome, позволяющее интегрироваться с DeepSeek API и OpenRouter API и вести чаты прямо в браузере без необходимости открывать официальный сайт.

## Возможности

- 💬 **Интеграция с DeepSeek API и OpenRouter API** — поддержка двух провайдеров, выбор при настройке
- 🧠 **Поддержка популярных моделей** — DeepSeek Chat, DeepSeek Coder, а также модели OpenRouter: OpenAI GPT-4, Claude, Gemini, Mistral и другие
- 📝 **Неограниченное количество чатов** - создавайте столько чатов, сколько нужно
- 💾 **Сохранение истории** - все чаты сохраняются локально до тех пор, пока вы их не удалите
- 🎨 **Современный интерфейс** - красивый и удобный UI
- ⚙️ **Настраиваемые параметры** - выбор модели, температуры, максимального количества токенов
- 📤 **Экспорт чатов** - возможность экспортировать чаты в JSON формате
- 🔍 **Быстрый доступ** - плавающая кнопка на определенных сайтах
- ⌨️ **Горячие клавиши** - Ctrl+Shift+D для быстрого доступа с выделенным текстом

## Установка

### 1. Подготовка файлов
Убедитесь, что у вас есть все необходимые файлы:
- `manifest.json`
- `sidepanel.html`
- `sidepanel.js`
- `background.js`
- `content.js`
- `styles.css`
- Иконки: `icon16.png`, `icon32.png`, `icon48.png`, `icon128.png`

### 2. Установка в Chrome

1. Откройте Chrome и перейдите в `chrome://extensions/`
2. Включите "Режим разработчика" (Developer mode) в правом верхнем углу
3. Нажмите "Загрузить распакованное расширение" (Load unpacked)
4. Выберите папку с файлами расширения
5. Расширение появится в списке установленных

### 3. Настройка API ключа

1. Получите API ключ для выбранного провайдера:
   - **DeepSeek**: [platform.deepseek.com](https://platform.deepseek.com/)
   - **OpenRouter**: [openrouter.ai](https://openrouter.ai/)
2. Нажмите на иконку расширения в панели инструментов
3. Нажмите на кнопку настроек (⚙️)
4. Введите ваш API ключ в соответствующее поле ("DeepSeek API Key" или "OpenRouter API Key")
5. Выберите провайдера и модель
6. Настройте другие параметры по желанию
7. Нажмите "Сохранить"

## Использование

### Основные функции

1. **Создание нового чата**
   - Нажмите кнопку "+" в заголовке
   - Или кнопку "Начать новый чат" на главном экране

2. **Отправка сообщений**
   - Введите текст в поле ввода
   - Нажмите Enter или кнопку отправки
   - Подождите ответа от DeepSeek

3. **Управление чатами**
   - Выберите чат из списка слева
   - Удалите чат кнопкой корзины
   - Экспортируйте чат кнопкой экспорта

4. **Очистка истории**
   - Нажмите "Очистить историю" внизу списка чатов

### Дополнительные возможности

- **Плавающая кнопка**: На определенных сайтах (GitHub, Stack Overflow и др.) появляется плавающая кнопка для быстрого доступа
- **Горячие клавиши**: Выделите текст на любой странице и нажмите Ctrl+Shift+D для быстрого открытия чата
- **Контекстное меню**: Правый клик на выделенном тексте → "Отправить в DeepSeek Chat"

## Настройки

### Параметры API

- **Провайдер**: DeepSeek или OpenRouter
- **API Key**: Ваш ключ доступа к выбранному API
- **Модель**: Для DeepSeek — DeepSeek Chat, DeepSeek Coder; для OpenRouter — GPT-4, Claude, Gemini, Mistral и др. (см. [список моделей OpenRouter](https://openrouter.ai/docs#models))
- **Максимум токенов**: От 1 до 8192 (по умолчанию 4096)
- **Температура**: От 0 до 2 (по умолчанию 0.7)

### Рекомендуемые настройки

- **Для обычных чатов**: DeepSeek Chat или GPT-4, температура 0.7
- **Для программирования**: DeepSeek Coder, Claude 3, Gemini 1.5, температура 0.3
- **Для креативных задач**: Любая модель, температура 1.0-1.5

## Структура файлов

```
pocket-chat/
├── manifest.json          # Конфигурация расширения
├── sidepanel.html             # Главный интерфейс
├── sidepanel.js               # Основная логика
├── background.js          # Фоновый скрипт
├── content.js             # Скрипт для веб-страниц
├── styles.css             # Стили интерфейса
├── icon16.png             # Иконки расширения
├── icon32.png
├── icon48.png
├── icon128.png
└── README.md              # Этот файл
```

## Технические детали

### Хранение данных

- **Настройки**: Сохраняются в `chrome.storage.sync` (синхронизируются между устройствами)
- **Чаты**: Сохраняются в `chrome.storage.local` (локально на устройстве)

### API Endpoints

Расширение использует официальный DeepSeek API или OpenRouter API:
- DeepSeek: `https://api.deepseek.com/v1/chat/completions`
- OpenRouter: `https://openrouter.ai/api/v1/chat/completions` (см. [документацию OpenRouter](https://openrouter.ai/docs))
- Метод: POST
- Формат: JSON

### Безопасность

- API ключи хранятся локально в зашифрованном виде
- Никакие данные не отправляются на сторонние серверы
- Все коммуникации происходят напрямую с DeepSeek API

## Устранение неполадок

### Проблемы с API

1. **"API не настроен"**
   - Проверьте, что введен правильный API ключ
   - Убедитесь, что ключ активен на platform.deepseek.com

2. **"Ошибка при отправке сообщения"**
   - Проверьте интернет-соединение
   - Убедитесь, что API ключ действителен
   - Проверьте лимиты использования API

3. **Медленные ответы**
   - Уменьшите количество токенов в настройках
   - Проверьте скорость интернет-соединения

### Проблемы с интерфейсом

1. **Расширение не открывается**
   - Перезагрузите расширение в chrome://extensions/
   - Проверьте консоль браузера на ошибки

2. **Чаты не сохраняются**
   - Проверьте разрешения расширения
   - Очистите кэш браузера

## Разработка

### Локальная разработка

1. Клонируйте или скачайте файлы
2. Внесите изменения в код
3. Перезагрузите расширение в chrome://extensions/
4. Протестируйте изменения

### Отладка

- Откройте DevTools для popup: правый клик на иконке расширения → "Проверить"
- Просмотрите логи background script в chrome://extensions/ → "Подробности" → "Проверить представления: background page"

## Лицензия

Этот проект создан для личного использования. Используйте на свой страх и риск.

## Поддержка

При возникновении проблем:
1. Проверьте раздел "Устранение неполадок"
2. Убедитесь, что используете последнюю версию расширения
3. Проверьте совместимость с вашей версией Chrome

---

**Примечание**: Это расширение не является официальным продуктом DeepSeek или OpenRouter и не связано с компаниями DeepSeek или OpenRouter. 