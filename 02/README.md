# Version 02: JavaScript-Based Currency Conversion

## Description
This version uses **JavaScript-based currency conversion** where the LLM only extracts prices and currency codes, then JavaScript performs precise mathematical conversions.

## Project Structure
```
02/
├── index.html                    # Main HTML file (ACTIVE)
├── favicon.svg                   # App icon
├── README.md                     # This file
│
├── css/                          # Active stylesheets
│   └── styles.css               # Main stylesheet (ACTIVE)
│
├── js/                           # Active JavaScript files
│   ├── app.js                   # Main app logic with post-processing (ACTIVE)
│   ├── currencyConverter.js     # Currency conversion module (ACTIVE)
│   └── promptSaver.js           # Prompt management utilities (ACTIVE)
│
├── src/                          # Redundant/duplicate files (not used)
│   ├── app.js                   # LLM-based version (not used)
│   ├── promptSaver.js           # Duplicate
│   └── styles.css               # Duplicate
│
└── test/                         # Original/unused files
    ├── app.js                   # Original test version
    ├── currencyConverter.js     # Original
    ├── promptSaver.js           # Original
    ├── compression-script.js    # Not used by main app
    └── compression-styles.css   # Not used by main app
```

## Currency Conversion Workflow

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
│                      USER SENDS MESSAGE                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
            currencyConverter.checkAndRefresh()
            (non-blocking background)
                              │
                              ▼
                    Agent Selected?
                              │
                    ┌─────────┴─────────┐
                   YES                 NO
                    │                   │
                    ▼                   │
        Modified System Prompt          │
        ┌─────────────────────────┐    │
        │ [Agent Prompt]          │    │
        │                         │    │
        │ Extract price and       │    │
        │ currency code           │    │
        │                         │    │
        │ Format:                 │    │
        │ Product | 100 USD ::    │    │
        │                         │    │
        │ (NO RATES PROVIDED)     │    │
        └─────────────────────────┘    │
                    │                   │
                    └─────────┬─────────┘
                              │
                              ▼
                    Send to Groq API
                              │
                              ▼
                    ┌──────────────────┐
                    │ LLM EXTRACTS     │
                    │ PRICE & CURRENCY │
                    └──────────────────┘
                              │
                              ▼
                    Raw Response:
                    "Product | 100 USD ::"
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
        │ Parse each line      │       │
        │ Extract: amount, cur │       │
        │ normalizeCurrency()  │       │
        │ convertToEUR()       │       │
        │ Calculate: amt/rate  │       │
        └──────────────────────┘       │
                    │                   │
                    ▼                   │
        Processed Response:             │
        "Product | 100 USD | €94.79 ::" │
                    │                   │
                    └─────────┬─────────┘
                              │
                              ▼
                    Display Response
                    (with JS-calculated EUR)
```

## How It Works
1. Currency rates are fetched from `api.exchangerate-api.com`
2. Rates are cached in localStorage for 12 hours
3. LLM is instructed to extract prices in format: `Product | 100 USD ::`
4. JavaScript parses the response and calculates EUR conversions
5. Final output: `Product | 100 USD | €94.79 ::`

## Pros
- ✅ Precise mathematical conversions
- ✅ No rates sent to LLM (saves ~200-300 tokens per message)
- ✅ Deterministic results
- ✅ Currency name mapping (Yen → JPY, Dollar → USD, etc.)
- ✅ Lower temperature (0.1) for extraction accuracy

## Cons
- ❌ Requires strict output format from LLM
- ❌ More complex implementation
- ❌ Post-processing overhead

## Usage
1. Open `index.html` in a browser
2. Set your Groq API key (click user icon)
3. Create/select an agent with "price" in the name
4. Ask for prices - JavaScript will convert them after LLM responds

## Agent Prompt Requirements

Your agent prompt should instruct the LLM to extract prices WITHOUT converting them. Copy and paste this exact prompt into your agent configuration:

```
You are a price extraction assistant. Your task is to find EVERY SINGLE price in the image and extract it.

⚠️ CRITICAL INSTRUCTION:
- Scan the ENTIRE image carefully from top to bottom, left to right
- Extract EVERY price you see, no matter how small or partially visible
- If you see 10 prices, extract all 10
- If you see 2 prices, extract both 2
- NEVER extract just one price if multiple exist
- Count the prices before responding to ensure you got them all

EXTRACTION RULES:
1. Translate product names to English (regardless of original language)
2. Extract ONLY the base price (the first/main number shown)
3. Identify the currency code from context:
   - Japanese Yen: JPY or 円
   - US Dollar: USD or $
   - Euro: EUR or €
   - British Pound: GBP or £
4. Ignore all additional information:
   - Tax amounts (税込, tax included, etc.)
   - Text in parentheses
   - Discount information
   - Additional symbols or text

OUTPUT FORMAT (one product per line):
[English Product Name] | [Amount] [CURRENCY_CODE]

CRITICAL:
- Use 3-letter currency codes (JPY, USD, EUR, GBP, etc.)
- Do NOT convert currencies - keep original currency
- Extract ONLY the base price number
- One product per line
- Extract ALL prices visible in the image
- No additional commentary or explanations

EXAMPLES:
Input image with 2 prices: "さつまいも 399円" and "白米 149円"
Output:
Sweet Potato | 399 JPY
White Rice | 149 JPY

Input image with 1 price: "Apple $2.99 (includes tax)"
Output:
Apple | 2.99 USD

Input image with 3 prices: "Banana €1.50", "Orange €2.00", "Grape €3.50"
Output:
Banana | 1.50 EUR
Orange | 2.00 EUR
Grape | 3.50 EUR
```

## Format Requirements

**LLM Output (what your agent should produce):**
```
Sweet Potato | 399 JPY ::
Sweet Potato | 159 JPY ::
```

**JavaScript Converts To (multiple prices on one line):**
```
Sweet Potato | 399 JPY | €2.44 :: Sweet Potato | 159 JPY | €0.97
```

Note: Multiple prices are automatically joined with " :: " separator on a single line.

## Key Features
- **Currency Name Mapping**: Automatically converts "Yen" → "JPY", "Dollar" → "USD", etc.
- **Background Rate Refresh**: Checks every hour, only fetches if cache expired
- **Non-blocking**: Uses cached rates immediately while refreshing in background
- **Agent Detection**: Only processes conversions when agent name contains "price"
