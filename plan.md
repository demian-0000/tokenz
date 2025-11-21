# Dingo 3

## Overview
Dingo 3 is a chat interface powered by Groq's LLM API with specialized features for vision-based text extraction, translation, and currency conversion. The app supports multiple AI models, custom agent prompts, and intelligent post-processing of responses.

## Key Features

### 🤖 Multi-Model Support
- Access to 13+ Groq models including Llama 4, GPT-OSS, Qwen, and Whisper
- Vision-capable models for image analysis (Llama 4 Maverick, Llama 4 Scout)
- Automatic model filtering based on API availability
- Model preferences saved per session

### 👤 Custom Agent System
- Create and manage custom agent prompts
- Soft model preferences: agents auto-select their preferred model
- Visual hints showing model associations in dropdown
- Import/export agent configurations via JSON
- Three merge strategies: keep, replace, or rename on conflicts

### 💰 Intelligent Currency Conversion
- JavaScript-based post-processing for precise EUR conversions
- Automatic detection of "price" agents
- Real-time exchange rates from exchangerate-api.com
- 12-hour rate caching in localStorage
- Non-blocking background rate refresh
- Currency name normalization (Yen → JPY, Dollar → USD, etc.)

### 🖼️ Vision & Image Processing
- Upload and analyze images with vision-capable models
- Automatic image compression (max 768px, 40% quality JPEG)
- Image preview with size information
- Vision-only model detection (blocks text-only queries)
- Auto-clear conversation when switching between vision/text models

### 🎨 ASCII Box Art Rendering
- Auto-detection of ASCII box patterns
- Monospace font rendering for proper alignment
- Seamless handling of mixed content (text + box art)

### 📋 Copy to Clipboard
- One-click copy button on all assistant messages
- Visual feedback with checkmark animation
- Handles both plain text and pre-formatted content
- Mobile-optimized touch targets
- Fallback support for older browsers

## Architecture

## 🆕 New Feature: Soft Model Preference

Agents can now have a **preferred LLM model** that auto-selects when you choose the agent. This simplifies the workflow from two steps (select model + select agent) to one step (select agent).

### How It Works:
1. **Create/Edit Agent**: In the prompts modal, select a preferred model for each agent from the dropdown
2. **Auto-Switch**: When you select an agent, it automatically switches to the preferred model (if available)
3. **Manual Override**: You can still manually change the model after selection - it's a soft preference, not a hard requirement
4. **Visual Hints**: Agent dropdown shows which model is associated with each agent (e.g., "price → llama-4-maverick")
5. **Notification**: A brief status message confirms the model switch

### Example:
- "price" agent → auto-selects "llama-4-maverick" (vision model for image analysis)
- "super duper" agent → auto-selects "llama-3.3-70b-versatile" (text model)

### Benefits:
- ✅ Eliminates errors from forgetting to select the right model
- ✅ Faster workflow (one click instead of two)
- ✅ Clear intent (each agent optimized for specific model)
- ✅ Still flexible (manual override available)

## Project Structure
```
tokenz/
├── index.html                    # Main HTML file
├── favicon.svg                   # App icon
├── plan.md                       # This documentation
│
├── css/                          # Stylesheets
│   ├── styles.css               # Main stylesheet
│   └── copy-button.css          # Copy button module styles
│
├── js/                           # JavaScript modules
│   ├── app.js                   # Main app logic & message handling
│   ├── currencyConverter.js     # Currency conversion post-processor
│   ├── promptSaver.js           # Agent prompt import/export
│   └── copyButton.js            # Copy-to-clipboard functionality
│
├── json/                         # Data files
│   └── agent_prompts.json       # Saved agent configurations
│
├── img/                          # Assets
│   └── copy.svg                 # Copy button icon
│
└── Backup/                       # Previous versions
    ├── 01/                      # Version 1
    └── 02/                      # Version 2
```

## Workflow Diagrams

### Text-Only Conversation Flow
```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERACTION                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    Select Agent (optional)
                              │
                    ┌─────────┴─────────┐
              Agent has preferred    No preference
                   model?                  │
                    │                      │
                    ▼                      │
            Auto-switch model              │
            (soft preference)              │
                    │                      │
                    └─────────┬────────────┘
                              │
                              ▼
                    Type text message
                              │
                              ▼
                    Click Send
                              │
                              ▼
            ┌─────────────────────────────┐
            │ Build API Request           │
            │ - System prompt (if agent)  │
            │ - Conversation history      │
            │ - User message              │
            │ - Temperature (0.7 default) │
            └─────────────────────────────┘
                              │
                              ▼
                    Send to Groq API
                              │
                              ▼
                    Receive Response
                              │
                              ▼
                    Display in Chat
                              │
                              ▼
                    Add Copy Button
```

### Vision + Currency Conversion Flow
```
┌─────────────────────────────────────────────────────────────────┐
│                    INITIALIZATION (Page Load)                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
            currencyConverter.initialize()
                              │
                    ┌─────────┴─────────┐
              Cache Valid?          Cache Expired?
                    │                   │
                    ▼                   ▼
            Use Cached          fetchRates()
                    │                   │
                    └─────────┬─────────┘
                              │
                    Store in localStorage
                    (12-hour expiration)

┌─────────────────────────────────────────────────────────────────┐
│                      USER SENDS IMAGE MESSAGE                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    Select Vision Agent
                    (e.g., "Min Label", "Full Label JP")
                              │
                              ▼
                    Auto-switch to preferred
                    vision model (if configured)
                              │
                              ▼
                    Upload Image (+button)
                              │
                              ▼
            ┌─────────────────────────────┐
            │ Image Processing            │
            │ - Resize to max 768px       │
            │ - Convert to JPEG           │
            │ - Compress to 40% quality   │
            │ - Generate base64 data URL  │
            └─────────────────────────────┘
                              │
                              ▼
                    Show Preview
                    (compressed size displayed)
                              │
                              ▼
                    Type message (optional)
                              │
                              ▼
                    Click Send
                              │
                              ▼
            currencyConverter.checkAndRefresh()
            (non-blocking background)
                              │
                              ▼
            ┌─────────────────────────────┐
            │ Build Vision API Request    │
            │ - System prompt (agent)     │
            │ - Conversation history      │
            │ - User message content:     │
            │   [                         │
            │     {type: "text", ...},    │
            │     {type: "image_url", ...}│
            │   ]                         │
            │ - Temperature (0.7 default) │
            └─────────────────────────────┘
                              │
                              ▼
                    Send to Groq API
                              │
                              ▼
                    ┌──────────────────┐
                    │ LLM PROCESSES    │
                    │ IMAGE + PROMPT   │
                    └──────────────────┘
                              │
                              ▼
                    Raw Response:
                    (ASCII boxes with prices)
                              │
                              ▼
            Is "price" agent active?
                              │
                    ┌─────────┴─────────┐
                   YES                 NO
                    │                   │
                    ▼                   │
    currencyConverter.processLLMResponse()
                    │                   │
                    ▼                   │
        ┌──────────────────────┐       │
        │ Parse Response       │       │
        │ - Extract prices     │       │
        │ - Normalize currency │       │
        │ - Convert to EUR     │       │
        │ - Calculate: amt/rate│       │
        │ - Preserve ASCII art │       │
        └──────────────────────┘       │
                    │                   │
                    ▼                   │
        Enhanced Response:              │
        (ASCII boxes + EUR conversions) │
                    │                   │
                    └─────────┬─────────┘
                              │
                              ▼
            ┌─────────────────────────────┐
            │ Render Message              │
            │ - Detect ASCII box art      │
            │ - Wrap in <pre> if detected │
            │ - Apply monospace font      │
            └─────────────────────────────┘
                              │
                              ▼
                    Display in Chat
                              │
                              ▼
                    Add Copy Button
                              │
                              ▼
                    Clear Image Preview
```

## Technical Details

### Currency Conversion
- **Exchange Rate Source**: api.exchangerate-api.com
- **Caching**: 12-hour localStorage cache
- **Processing**: JavaScript post-processes LLM responses
- **Trigger**: Automatic when agent name contains "price"
- **Currency Mapping**: Yen→JPY, Dollar→USD, Euro→EUR, Pound→GBP
- **Precision**: 2 decimal places for EUR conversions

### Image Processing
- **Max Dimension**: 768px (largest side)
- **Format**: JPEG
- **Quality**: 40% compression
- **Encoding**: Base64 data URL
- **Preview**: Shows compressed file size

### ASCII Box Art Detection
- **Pattern**: `/^[+\-|]+$|^\|.*\|$/m`
- **Font**: Monaco, Menlo, Consolas, "Courier New", monospace
- **Size**: 13px
- **Rendering**: Automatic `<pre>` tag wrapping

### Copy Button
- **API**: navigator.clipboard.writeText()
- **Fallback**: document.execCommand('copy')
- **Feedback**: Green checkmark for 2 seconds
- **Scope**: Assistant messages only
- **Mobile**: Larger touch targets (32px vs 28px)

## Usage Guide

### Quick Start
1. Open `index.html` in a browser
2. Click user icon to set Groq API key
3. Select a model from the dropdown
4. Start chatting!

### Using Agents
1. Click prompts icon (document icon in header)
2. Create a new agent or select existing
3. Optionally set a preferred model
4. Agent auto-activates when selected from dropdown

### Vision Analysis
1. Select a vision-capable model (Llama 4 Maverick/Scout)
2. Click + button to upload image
3. Image auto-compresses and shows preview
4. Type message or leave blank for default prompt
5. Send to analyze

### Currency Conversion
1. Create/select an agent with "price" in the name
2. Upload image with prices
3. LLM extracts prices in original currency
4. JavaScript automatically adds EUR conversions

## Current Agent Configurations

The following agents are currently configured in `json/agent_prompts.json`:

### 1. super duper
**Purpose**: Concise text responses (100 words max)  
**Preferred Model**: llama-3.1-8b-instant  
**Use Case**: Quick answers, summaries, brief explanations

**Prompt**:
```
CRITICAL INSTRUCTION: Your response MUST be 100 words or less. This is a hard limit.

Format:
- Single paragraph
- Direct answer only
- No unnecessary details
- Professional tone

After writing your response, count the words. If over 100, rewrite shorter. End your response with: [Words: X]
```

### 2. Min Label
**Purpose**: Minimal product label extraction with ASCII box formatting  
**Preferred Model**: meta-llama/llama-4-scout-17b-16e-instruct  
**Use Case**: Quick price extraction from product images

**Prompt**:
```
Extract ALL prices and their associated products shown in the image.

For each price found:
1. Identify the product name in original language AND translate it to English
2. Note the original price and currency
3. Convert to Euros using exchange rate: 1 EUR = 179 JPY (or appropriate rate for other currencies)

FORMAT YOUR RESPONSE AS ASCII BOXES:

Rules for box formatting:
- Each product gets its own box
- Use + for corners, - for horizontal lines, | for vertical borders
- Original language text on first line
- English translation on second line
- Price information follows (original currency, then EUR conversion)
- Left-align all text with consistent spacing
- Each line must be the same width to maintain box shape

FORMAT YOUR RESPONSE AS ASCII BOXES:
+--------------------------------+
| [Original text line 1]         |
| [Original text line 2 if long] |
| [English translation line 1]   |
| [English translation line 2]   |
+--------------------------------+
| [Original price]               |
| [Price in English]             |
| [EUR conversion]               |
+--------------------------------+

CRITICAL RULES:
- Maximum 32 characters per line (including | borders)
- If text exceeds 30 chars, split it across multiple lines
- Each line MUST have proper spacing to reach the closing |
- Use newlines between each line

EXAMPLE:
+--------------------------------+
| シマダヤ 「健美麺」             |
| 国産そば粉使用食塩ゼロ本そば1食 |
| Shimadaya "Kenbimen"           |
| Domestic Buckwheat Noodles     |
| Salt-Free, 1 serving           |
+--------------------------------+
| 本体価格 80円 (税抜)            |
| Body price: 80 yen             |
| (excluding tax: 86.40 yen)     |
| 0.45 eur                       |
+--------------------------------+

CRITICAL:
- Output ONLY the ASCII boxes, no additional commentary
- If multiple products exist, create separate boxes for each
- Maintain exact spacing and alignment
- Use lowercase "eur" for Euro amounts
- Always show 2 decimal places for EUR (e.g., 1.80 not 1.8)
```

### 3. Full Label JP
**Purpose**: Comprehensive Japanese label extraction with translation  
**Preferred Model**: meta-llama/llama-4-scout-17b-16e-instruct  
**Use Case**: Detailed product information extraction from Japanese labels

**Prompt**:
```
You are an expert in Japanese text extraction and translation with precise spatial awareness.

CRITICAL: Your ONLY output should be the FINAL FORMATTED RESULT. Do not show your analysis process, phases, or working steps.

ANALYSIS PROCESS (internal - do not output):
1. Scan image top to bottom, left to right
2. Identify distinct text regions by visual boundaries
3. Extract Japanese text from each region separately
4. Translate based on visual context and semantic meaning
5. Format as structured boxes

TRANSLATION RULES:
- Contextual Translation: Consider visual context (e.g., "1玉" = "1 fruit" for yuzu)
- Preserve Intent: Reflect meaning (e.g., "高知県産" = "Yuzu from Kōchi Prefecture")
- Product Origins: Always extract and translate prefecture/region information
- Numbers: Translate purpose (e.g., "550小" = "Seat 550 (Child)")
- Labels: Translate function/purpose, not literal characters
- Prices: Extract both tax-excluded (税抜) and tax-included (税込) amounts

Marketing & Promotional Text:
- Translate the intent and emotional appeal, not literal words
- Use natural English retail/marketing language
- Avoid awkward literal translations that sound unnatural
- Examples:
  - 生活応援価格 → "Everyday low price!" or "Budget-friendly price!"
  - お買い得 → "Great deal!" not "Good to buy value"
  - 特価 → "Special offer!" not "Special price"
  - 限定 → "Limited time!" not "Limited"

Common Phrase Mappings:
- 生活応援 = "supporting your lifestyle" / "helping you save" (NOT "life support")
- コレいい値 = "Great value!" (NOT "This good price")
- お得 = "Great deal!" / "Value!" (NOT "Profitable")


EUR CONVERSION:
- Use exchange rate: 1 EUR = 179 JPY
- Convert ONLY the tax-inclusive (税込) price
- Round to 2 decimal places
- Format: "X.XX eur" (lowercase)

OUTPUT FORMAT (copy this structure exactly):
+-------------------------------------+
| [Japanese Text Line 1]              |
| [English Translation Line 1]        |
+-------------------------------------+
| [Japanese Text Line 2]              |
| [English Translation Line 2]        |
+-------------------------------------+
| [Price Information in Japanese]     |
| [Price Information in English]      |
| [Tax-inclusive price in Japanese]   |
| [Tax-inclusive price in English]    |
| [EUR conversion]                    |
+-------------------------------------+

EXAMPLE OUTPUT:
+-------------------------------------+
| 高知県産 ゆず                         |
| Yuzu from Kōchi Prefecture          |
+-------------------------------------+
| 産地は商品に記載                       |
| Place of production is indicated on |
| the product                          |
+-------------------------------------+
| ゆず 1玉                             |
| 1 Yuzu fruit                        |
+-------------------------------------+
| 本体価格 298円 (税抜)                 |
| Base price: 298 yen (excluding tax) |
| 税込 321.84円                        |
| 321.84 yen (including tax)          |
| 1.80 eur                            |
+-------------------------------------+

CRITICAL RULES:
- Output ONLY the formatted boxes - no phase headers, no analysis text
- Never combine text from different visual areas
- Always extract prefecture/origin information if present
- Calculate EUR: tax-inclusive JPY ÷ 179 = EUR
- Use lowercase "eur" in conversion line
```

## Agent Import/Export

Agents can be saved and loaded via JSON files:

**Export**: Click "Save" in prompts modal → Downloads `agent_prompts.json`  
**Import**: Click "Load" → Select JSON file → Choose merge strategy:
- **keep**: Keep existing agents, add new ones
- **replace**: Replace conflicting agents with imported versions
- **rename**: Rename imported agents if conflicts exist

## Version History

### v3.3 (Current)
- ✅ Copy button feature for assistant messages
- ✅ Modular CSS/JS architecture
- ✅ Mobile-optimized touch targets

### v3.2
- ✅ Soft model preferences for agents
- ✅ Visual model hints in agent dropdown
- ✅ Auto-switch notification

### v3.1
- ✅ ASCII box art auto-detection
- ✅ Monospace font rendering
- ✅ Currency conversion post-processing

### v3.0
- ✅ Vision model support
- ✅ Image compression
- ✅ Agent system with import/export

## Development Notes

### Modular Architecture
New features should be implemented as separate modules:
- Create `js/featureName.js` for logic
- Create `css/featureName.css` for styles
- Add references in `index.html`
- Integrate with minimal changes to `app.js`

### Rollback Strategy
To disable a feature:
1. Comment out script/link tags in `index.html`
2. Or delete the feature's files
3. Remove integration code from `app.js`

### Testing
- Test on desktop and mobile browsers
- Verify vision models with image uploads
- Test currency conversion with price agents
- Check ASCII box art rendering
- Verify copy button on various message types
