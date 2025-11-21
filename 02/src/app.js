// === Groq Models API integration ===
let apiKey = localStorage.getItem('groqApiKey') || '';
let models = [];
let currentModel = localStorage.getItem('lastUsedModel') || '';

// Allowed models list (in display order)
const ALLOWED_MODELS = [
    'meta-llama/llama-4-maverick-17b-128e-instruct',
    'llama-3.1-8b-instant',
    'moonshotai/kimi-k2-instruct-0905',
    'groq/compound',
    'groq/compound-mini',
    'llama-3.3-70b-versatile',
    'meta-llama/llama-4-scout-17b-16e-instruct',
    'openai/gpt-oss-120b',
    'openai/gpt-oss-20b',
    'playai-tts',
    'qwen/qwen3-32b',
    'whisper-large-v3',
    'whisper-large-v3-turbo'
];

// Vision-capable models
const VISION_MODELS = [
    'meta-llama/llama-4-maverick-17b-128e-instruct',
    'meta-llama/llama-4-scout-17b-16e-instruct'
];

// Function to check if model supports vision
function isVisionModel(modelId) {
    return VISION_MODELS.includes(modelId);
}

// Function to get display name (remove prefix)
function getModelDisplayName(modelId) {
    return modelId.replace(/^(meta-llama|groq|moonshotai|openai|qwen)\//, '');
}

// Function to check if conversation has vision messages
function hasVisionMessages() {
    return conversationHistory.some(msg => 
        msg.role === 'user' && Array.isArray(msg.content)
    );
}

// Function to convert vision messages to text-only
function sanitizeMessagesForTextModel(messages) {
    return messages.map(msg => {
        if (msg.role === 'user' && Array.isArray(msg.content)) {
            // Extract only text from vision message
            const textPart = msg.content.find(part => part.type === 'text');
            return {
                role: msg.role,
                content: textPart ? textPart.text : 'Image was sent'
            };
        }
        return msg;
    });
}

// Fetch available models from Groq API
async function loadModels() {
    const statusEl = document.getElementById('apiStatus');
    const modelTagEl = document.getElementById('modelTag');
    
    if (!apiKey) {
        modelTagEl.textContent = 'No API Key';
        statusEl.textContent = 'No API key';
        statusEl.className = 'api-status error';
        return;
    }
    
    statusEl.textContent = 'Loading models...';
    statusEl.className = 'api-status';
    
    try {
        const response = await fetch('https://api.groq.com/openai/v1/models', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Get only allowed models from API response (maintain order)
        const availableModels = data.data.map(m => m.id);
        models = ALLOWED_MODELS.filter(id => availableModels.includes(id));
        
        if (models.length === 0) {
            models = ALLOWED_MODELS;
        }
        
        // Use saved model if valid, otherwise use first model
        if (!currentModel || !models.includes(currentModel)) {
            currentModel = models[0];
        }
        updateModelTag();
        statusEl.textContent = `${models.length} models available`;
        statusEl.className = 'api-status connected';
    } catch (err) {
        console.error('Error loading models:', err);
        models = ALLOWED_MODELS;
        currentModel = models[0];
        updateModelTag();
        statusEl.textContent = 'Using default models';
        statusEl.className = 'api-status error';
    }
}

function updateModelTag() {
    const modelTagEl = document.getElementById('modelTag');
    if (currentModel) {
        modelTagEl.textContent = getModelDisplayName(currentModel);
    }
}

// Modal logic
const modal = document.getElementById('apiModal');
const userIcon = document.getElementById('userIcon');
const cancelBtn = document.getElementById('cancelBtn');
const saveBtn = document.getElementById('saveBtn');
const apiKeyInput = document.getElementById('apiKeyInput');

userIcon.onclick = function() {
    modal.classList.add('show');
    // Show only last 4 digits if API key exists
    if (apiKey && apiKey.length > 4) {
        apiKeyInput.value = '...' + apiKey.slice(-4);
        apiKeyInput.dataset.truncated = 'true';
    } else {
        apiKeyInput.value = apiKey;
        apiKeyInput.dataset.truncated = 'false';
    }
    // Don't auto-focus to prevent clearing the truncated value
    setTimeout(() => apiKeyInput.select(), 100);
};

cancelBtn.onclick = function() {
    modal.classList.remove('show');
};

saveBtn.onclick = function() {
    const newKey = apiKeyInput.value.trim();
    // Don't save if it's the truncated display value
    if (newKey && newKey !== '...' + apiKey.slice(-4)) {
        apiKey = newKey;
        localStorage.setItem('groqApiKey', apiKey);
        modal.classList.remove('show');
        loadModels();
    } else if (apiKeyInput.dataset.truncated === 'true') {
        // User didn't change the key, just close modal
        modal.classList.remove('show');
    }
};

modal.onclick = function(e) {
    if (e.target === modal) {
        modal.classList.remove('show');
    }
};

// Clear truncated value when user starts typing
apiKeyInput.oninput = function() {
    if (apiKeyInput.dataset.truncated === 'true') {
        apiKeyInput.dataset.truncated = 'false';
    }
};

apiKeyInput.onkeypress = function(e) {
    if (e.key === 'Enter') {
        saveBtn.click();
    }
};

// Model dropdown logic
const modelSelector = document.getElementById('modelSelector');
const modelTagEl = document.getElementById('modelTag');
const dropdown = document.getElementById('modelsDropdown');

modelSelector.onclick = function(e) {
    e.stopPropagation();
    if (models.length === 0) {
        alert('Please set your API key first');
        userIcon.click();
        return;
    }
    // Close agents dropdown if open
    agentsDropdown.classList.remove('show');
    dropdown.classList.toggle('show');
    dropdown.innerHTML = models.map(id => 
      `<div class="model-item ${id === currentModel ? 'active' : ''}" data-id="${id}">${getModelDisplayName(id)}</div>`
    ).join('');
};

dropdown.onclick = function(e) {
    e.stopPropagation();
    if (e.target.classList.contains('model-item')) {
        const newModel = e.target.getAttribute('data-id');
        
        // Check if switching between vision and text-only models
        const wasVisionModel = isVisionModel(currentModel);
        const isNewVisionModel = isVisionModel(newModel);
        
        // Auto-clear conversation when switching between vision and text-only models
        if (wasVisionModel !== isNewVisionModel && conversationHistory.length > 0) {
            clearChat();
        }
        
        currentModel = newModel;
        localStorage.setItem('lastUsedModel', currentModel);
        updateModelTag();
        dropdown.classList.remove('show');
    }
};

// Prompts management
let agentPrompts = JSON.parse(localStorage.getItem('agentPrompts') || '[]');
let currentAgent = localStorage.getItem('lastUsedAgent') || null;
let currentAgentPrompt = null;

function savePrompts() {
    localStorage.setItem('agentPrompts', JSON.stringify(agentPrompts));
}

function renderPromptsList() {
    const promptsList = document.getElementById('promptsList');
    if (agentPrompts.length === 0) {
        promptsList.innerHTML = '<div style="text-align: center; color: #666; padding: 20px;">No prompts yet. Create one below.</div>';
        return;
    }
    
    promptsList.innerHTML = agentPrompts.map((prompt, index) => `
        <div class="prompt-item">
            <div class="prompt-item-info">
                <div class="prompt-item-name">${prompt.name}</div>
                <div class="prompt-item-preview">${prompt.prompt.substring(0, 60)}${prompt.prompt.length > 60 ? '...' : ''}</div>
            </div>
            <div class="prompt-item-actions">
                <button class="prompt-item-btn prompt-item-btn-edit" data-index="${index}">Edit</button>
                <button class="prompt-item-btn prompt-item-btn-delete" data-index="${index}">Delete</button>
            </div>
        </div>
    `).join('');
}

// Prompts modal logic
const promptsModal = document.getElementById('promptsModal');
const promptsIcon = document.getElementById('promptsIcon');
const closePromptsBtn = document.getElementById('closePromptsBtn');
const addPromptBtn = document.getElementById('addPromptBtn');
const promptName = document.getElementById('promptName');
const promptText = document.getElementById('promptText');
const promptsList = document.getElementById('promptsList');
let editingIndex = null;

promptsIcon.onclick = function() {
    promptsModal.classList.add('show');
    renderPromptsList();
};

closePromptsBtn.onclick = function() {
    promptsModal.classList.remove('show');
    clearPromptForm();
};

function clearPromptForm() {
    promptName.value = '';
    promptText.value = '';
    editingIndex = null;
    addPromptBtn.textContent = 'Add';
}

addPromptBtn.onclick = function() {
    const name = promptName.value.trim();
    const prompt = promptText.value.trim();
    
    if (!name || !prompt) {
        alert('Please fill in both name and prompt fields');
        return;
    }

    if (editingIndex !== null) {
        // Update existing prompt
        agentPrompts[editingIndex] = { name, prompt };
        editingIndex = null;
        addPromptBtn.textContent = 'Add';
    } else {
        // Add new prompt
        agentPrompts.push({ name, prompt });
    }

    savePrompts();
    renderPromptsList();
    clearPromptForm();
};

promptsList.addEventListener('click', function(e) {
    const index = e.target.dataset.index;
    if (!index) return;

    if (e.target.classList.contains('prompt-item-btn-edit')) {
        const prompt = agentPrompts[index];
        promptName.value = prompt.name;
        promptText.value = prompt.prompt;
        editingIndex = parseInt(index);
        addPromptBtn.textContent = 'Update';
    } else if (e.target.classList.contains('prompt-item-btn-delete')) {
        if (confirm('Delete this prompt?')) {
            agentPrompts.splice(index, 1);
            savePrompts();
            renderPromptsList();
        }
    }
});

// Save prompts to JSON file handler
const savePromptsBtn = document.getElementById('savePromptsBtn');
if (savePromptsBtn) {
    savePromptsBtn.onclick = function() {
        if (agentPrompts.length === 0) {
            alert('No prompts to save');
            return;
        }

        try {
            PromptSaver.saveToFile(agentPrompts);
            alert('Prompts saved successfully');
        } catch (error) {
            alert(`Failed to save prompts: ${error.message}`);
        }
    };
}

// Load prompts from JSON file handler
const loadPromptsBtn = document.getElementById('loadPromptsBtn');
if (loadPromptsBtn) {
    loadPromptsBtn.onclick = async function() {
        try {
            const loadedPrompts = await PromptSaver.loadFromFile();
            
            // Check for conflicts
            const conflicts = loadedPrompts.filter(loaded => 
                agentPrompts.some(existing => existing.name === loaded.name)
            );

            let strategy = 'keep';
            if (conflicts.length > 0) {
                const choice = prompt(
                    `${conflicts.length} prompt(s) have conflicting names.\n` +
                    `Choose strategy:\n` +
                    `- "keep" to keep existing prompts\n` +
                    `- "replace" to replace with loaded prompts\n` +
                    `- "rename" to rename loaded prompts`,
                    'keep'
                );
                
                if (!choice || !['keep', 'replace', 'rename'].includes(choice)) {
                    alert('Invalid choice. Operation cancelled.');
                    return;
                }
                strategy = choice;
            }

            // Merge prompts
            agentPrompts = PromptSaver.mergePrompts(agentPrompts, loadedPrompts, strategy);
            savePrompts();
            renderPromptsList();
            alert('Prompts loaded successfully');
        } catch (error) {
            alert(`Failed to load prompts: ${error.message}`);
        }
    };
}

// Agents dropdown logic
const agentsSelector = document.getElementById('agentsSelector');
const agentsDropdown = document.getElementById('agentsDropdown');

function updateAgentsDropdown() {
    const agentNames = agentPrompts.map(p => p.name);
    if (agentNames.length === 0) {
        agentNames.push('No agents (create in prompts)');
    }
    return agentNames;
}

agentsSelector.onclick = function(e) {
    e.stopPropagation();
    // Close model dropdown if open
    dropdown.classList.remove('show');
    
    const agentNames = updateAgentsDropdown();
    agentsDropdown.classList.toggle('show');
    agentsDropdown.innerHTML = agentNames.map(name => {
        const isActive = currentAgent === name;
        return `<div class="agent-item ${isActive ? 'active' : ''}" data-agent="${name}">${name}</div>`;
    }).join('');
};

agentsDropdown.onclick = function(e) {
    e.stopPropagation();
    if (e.target.classList.contains('agent-item')) {
        const agentName = e.target.getAttribute('data-agent');
        if (agentName === 'No agents (create in prompts)') {
            agentsDropdown.classList.remove('show');
            promptsIcon.click();
            return;
        }
        
        currentAgent = agentName;
        localStorage.setItem('lastUsedAgent', currentAgent);
        const agentData = agentPrompts.find(p => p.name === agentName);
        currentAgentPrompt = agentData ? agentData.prompt : null;
        agentsDropdown.classList.remove('show');
        
        // Update the agents selector text to show selected agent
        const agentsSelectorSpan = agentsSelector.querySelector('span');
        if (agentsSelectorSpan) {
            agentsSelectorSpan.textContent = agentName;
        }
        
        console.log('Selected agent:', currentAgent, 'Prompt:', currentAgentPrompt);
    }
};

document.body.onclick = function(e) {
    if (!dropdown.contains(e.target) && !modelSelector.contains(e.target)) {
        dropdown.classList.remove('show');
    }
    if (!agentsDropdown.contains(e.target) && !agentsSelector.contains(e.target)) {
        agentsDropdown.classList.remove('show');
    }
};

// Chat functionality
const chatMessages = document.getElementById('chatMessages');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const welcomeSection = document.getElementById('welcomeSection');
const plusBtn = document.getElementById('plusBtn');
const imageInput = document.getElementById('imageInput');
const imagePreview = document.getElementById('imagePreview');
const previewImg = document.getElementById('previewImg');
const imageName = document.getElementById('imageName');
const imageSize = document.getElementById('imageSize');
const removeImageBtn = document.getElementById('removeImage');
let conversationHistory = [];
let currentImage = null;

function addMessage(content, role, imageUrl = null) {
    welcomeSection.classList.add('hidden');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;
    
    if (imageUrl) {
        // Create container for text and image
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        // Add text
        const textDiv = document.createElement('div');
        textDiv.textContent = content;
        contentDiv.appendChild(textDiv);
        
        // Add image thumbnail
        const img = document.createElement('img');
        img.src = imageUrl;
        img.className = 'message-image';
        img.alt = 'Uploaded image';
        img.onclick = () => window.open(imageUrl, '_blank');
        contentDiv.appendChild(img);
        
        messageDiv.appendChild(contentDiv);
    } else {
        messageDiv.textContent = content;
    }
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollIntoView({ behavior: 'smooth', block: 'end' });
}

function addLoadingMessage() {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message loading';
    messageDiv.id = 'loadingMessage';
    messageDiv.textContent = 'Thinking...';
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollIntoView({ behavior: 'smooth', block: 'end' });
}

function removeLoadingMessage() {
    const loadingMsg = document.getElementById('loadingMessage');
    if (loadingMsg) {
        loadingMsg.remove();
    }
}

function clearChat() {
    conversationHistory = [];
    chatMessages.innerHTML = '';
    welcomeSection.classList.remove('hidden');
    clearImage();
    // Reset agent selector text
    const agentsSelectorSpan = document.querySelector('#agentsSelector span');
    if (agentsSelectorSpan) {
        agentsSelectorSpan.textContent = 'agents';
    }
    currentAgent = null;
    currentAgentPrompt = null;
}

function clearImage() {
    currentImage = null;
    imagePreview.classList.remove('show');
    imageInput.value = '';
}

// Image compression function
async function compressImage(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                // Calculate new dimensions (max 768px on largest side)
                let width = img.width;
                let height = img.height;
                const maxDimension = 768;

                if (width > height) {
                    if (width > maxDimension) {
                        height = (height * maxDimension) / width;
                        width = maxDimension;
                    }
                } else {
                    if (height > maxDimension) {
                        width = (width * maxDimension) / height;
                        height = maxDimension;
                    }
                }

                // Create canvas and compress
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Convert to JPEG with 40% quality (0.4)
                canvas.toBlob(
                    (blob) => {
                        const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), {
                            type: 'image/jpeg'
                        });
                        resolve({
                            file: compressedFile,
                            dataUrl: canvas.toDataURL('image/jpeg', 0.4)
                        });
                    },
                    'image/jpeg',
                    0.4
                );
            };
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Handle image selection
imageInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
        // Compress the image
        const compressed = await compressImage(file);
        currentImage = compressed.dataUrl;

        // Show preview
        previewImg.src = compressed.dataUrl;
        imageName.textContent = compressed.file.name;
        imageSize.textContent = `${(compressed.file.size / 1024).toFixed(1)} KB (compressed)`;
        imagePreview.classList.add('show');
    } catch (error) {
        console.error('Error processing image:', error);
        alert('Failed to process image. Please try another file.');
    }
});

// Remove image
removeImageBtn.addEventListener('click', clearImage);

// Currency rates cache with 12-hour persistence
const RATES_CACHE_DURATION = 12 * 60 * 60 * 1000; // 12 hours
const RATES_STORAGE_KEY = 'currencyRatesCache';
let currencyRates = null;

// Load cached rates from localStorage
function loadCachedRates() {
    try {
        const cached = localStorage.getItem(RATES_STORAGE_KEY);
        if (cached) {
            const data = JSON.parse(cached);
            const age = Date.now() - data.timestamp;
            
            if (age < RATES_CACHE_DURATION) {
                currencyRates = data;
                console.log('Loaded cached currency rates:', Object.keys(data.rates).length, 'currencies', 
                            `(${Math.round(age / 1000 / 60)} minutes old)`);
                return true;
            } else {
                console.log('Cached rates expired, will fetch fresh data');
            }
        }
    } catch (error) {
        console.error('Error loading cached rates:', error);
    }
    return false;
}

// Fetch comprehensive currency rates
async function fetchAllCurrencyRates() {
    try {
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/EUR');
        
        if (!response.ok) throw new Error('Failed to fetch rates');
        const data = await response.json();
        
        currencyRates = {
            base: 'EUR',
            rates: data.rates,
            lastUpdate: new Date().toISOString(),
            timestamp: Date.now()
        };
        
        // Save to localStorage for persistence
        localStorage.setItem(RATES_STORAGE_KEY, JSON.stringify(currencyRates));
        
        console.log('Currency rates fetched and cached:', Object.keys(data.rates).length, 'currencies');
        return true;
    } catch (error) {
        console.error('Failed to fetch currency rates:', error);
        return false;
    }
}

// Get formatted rates string for LLM
function getFormattedRatesForLLM() {
    if (!currencyRates) return '';
    
    const majorCurrencies = ['USD', 'GBP', 'JPY', 'CNY', 'INR', 'AUD', 'CAD', 'CHF', 'MXN', 'BRL'];
    const age = Math.round((Date.now() - currencyRates.timestamp) / 1000 / 60);
    let ratesText = `\n\n=== LIVE EXCHANGE RATES (Base: EUR) ===\n`;
    ratesText += `Last updated: ${new Date(currencyRates.timestamp).toLocaleString()} (${age} min ago)\n\n`;
    
    majorCurrencies.forEach(currency => {
        if (currencyRates.rates[currency]) {
            ratesText += `1 EUR = ${currencyRates.rates[currency].toFixed(4)} ${currency}\n`;
        }
    });
    
    ratesText += `\nAll ${Object.keys(currencyRates.rates).length} currencies available. Use these live rates for accurate conversions.\n`;
    ratesText += `===================================\n`;
    
    return ratesText;
}

// Check if rates need refresh (non-blocking)
function checkAndRefreshRates() {
    if (!currencyRates || (Date.now() - currencyRates.timestamp > RATES_CACHE_DURATION)) {
        // Fetch in background without blocking
        fetchAllCurrencyRates().catch(err => 
            console.error('Background rate refresh failed:', err)
        );
    }
}

// Initialize rates on page load (try cache first, then fetch if needed)
if (!loadCachedRates()) {
    fetchAllCurrencyRates();
}

// Check for refresh every hour (but only fetch if cache expired)
setInterval(checkAndRefreshRates, 60 * 60 * 1000);

async function sendMessage() {
    const message = messageInput.value.trim();
    if (!message && !currentImage) return;
    
    if (!apiKey) {
        alert('Please set your API key first');
        userIcon.click();
        return;
    }

    if (!currentModel) {
        addMessage('Please select a model first', 'error');
        return;
    }

    // Quick check for vision-only models without images
    const VISION_ONLY_MODELS = [
        'meta-llama/llama-4-scout-17b-16e-instruct',
        'meta-llama/llama-4-maverick-17b-128e-instruct'
    ];
    
    if (VISION_ONLY_MODELS.includes(currentModel) && !currentImage) {
        addMessage(message, 'user');
        addMessage('I only do images, dude...', 'assistant');
        messageInput.value = '';
        return;
    }

    // Check rates in background (non-blocking) - uses cached rates immediately
    checkAndRefreshRates();

    // Build message content
    let userMessage;
    if (currentImage) {
        // Vision message with image - Groq format
        userMessage = {
            role: 'user',
            content: [
                {
                    type: 'text',
                    text: message || 'What do you see in this image?'
                },
                {
                    type: 'image_url',
                    image_url: {
                        url: currentImage
                    }
                }
            ]
        };
    } else {
        // Text-only message
        userMessage = {
            role: 'user',
            content: message
        };
    }

    // Add user message to UI
    const displayMessage = currentImage ? (message || 'Analyzing image...') : message;
    const imageToDisplay = currentImage; // Save before clearing
    addMessage(displayMessage, 'user', imageToDisplay);
    
    // Add to conversation history
    conversationHistory.push(userMessage);

    // Build messages array with system prompt if agent is selected
    let messagesToSend = [];
    
    // Always add system prompt at the start if agent is selected
    if (currentAgentPrompt) {
        // Add live currency rates to system prompt
        let systemPrompt = String(currentAgentPrompt);
        if (currencyRates) {
            systemPrompt += getFormattedRatesForLLM();
        }
        
        messagesToSend.push({
            role: 'system',
            content: systemPrompt
        });
    }
    
    // Add conversation history
    let historyToSend = conversationHistory;
    
    // If using text-only model but history has vision messages, sanitize them
    if (!isVisionModel(currentModel) && hasVisionMessages()) {
        console.warn('Text-only model detected with vision messages in history. Sanitizing...');
        historyToSend = sanitizeMessagesForTextModel(conversationHistory);
    }
    
    messagesToSend = messagesToSend.concat(historyToSend);
    
    // Validate messages before sending
    console.log('Messages to send:', messagesToSend.map(m => ({
        role: m.role,
        contentType: typeof m.content,
        isArray: Array.isArray(m.content)
    })));
    
    messageInput.value = '';
    messageInput.disabled = true;
    sendBtn.disabled = true;
    
    // Clear image after sending
    const hadImage = currentImage !== null;
    clearImage();

    // Show loading
    addLoadingMessage();

    try {
        // Log what we're sending for debugging
        console.log('Sending to API:', {
            model: currentModel,
            messages: messagesToSend
        });

        const startTime = performance.now();

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: currentModel,
                messages: messagesToSend,
                temperature: 0.7,
                max_tokens: 1024
            })
        });

        removeLoadingMessage();

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `API Error: ${response.status}`);
        }

        const data = await response.json();
        const responseTime = ((performance.now() - startTime) / 1000).toFixed(2);
        const assistantMessage = data.choices[0]?.message?.content || 'No response';
        
        conversationHistory.push({ role: 'assistant', content: assistantMessage });
        addMessage(assistantMessage, 'assistant');

        // Update status with model name and response time
        const statusEl = document.getElementById('apiStatus');
        statusEl.textContent = `${getModelDisplayName(currentModel)}: ${responseTime}s`;
        statusEl.className = 'api-status connected';

    } catch (error) {
        removeLoadingMessage();
        console.error('Error:', error);
        let errorMsg = error.message;
        if (hadImage && errorMsg.includes('does not support')) {
            errorMsg = 'This model does not support vision. Please select a vision-capable model like llama-3.2-90b-vision-preview.';
        }
        addMessage(`Error: ${errorMsg}`, 'error');
    } finally {
        messageInput.disabled = false;
        sendBtn.disabled = false;
        messageInput.focus();
    }
}

// Event listeners
sendBtn.onclick = sendMessage;

// Auto-resize textarea as user types
messageInput.oninput = function() {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 200) + 'px';
};

// Enter sends message, Shift+Enter creates new line
messageInput.onkeydown = function(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
};

// Initialize on load
if (apiKey) {
    loadModels();
} else {
    document.getElementById('modelTag').textContent = 'No API Key';
    document.getElementById('apiStatus').textContent = 'Click user icon to set API key';
}

// Restore last used agent on page load
if (currentAgent) {
    const agentData = agentPrompts.find(p => p.name === currentAgent);
    if (agentData) {
        currentAgentPrompt = agentData.prompt;
        const agentsSelectorSpan = document.querySelector('#agentsSelector span');
        if (agentsSelectorSpan) {
            agentsSelectorSpan.textContent = currentAgent;
        }
    } else {
        // Agent was deleted, clear saved preference
        currentAgent = null;
        localStorage.removeItem('lastUsedAgent');
    }
}
