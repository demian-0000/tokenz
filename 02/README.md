# Version 02: JavaScript-Based Currency Conversion

## Description
This version uses **JavaScript-based currency conversion** where the LLM only extracts prices and currency codes, then JavaScript performs precise mathematical conversions.

## How It Works
1. Currency rates are fetched from `api.exchangerate-api.com`
2. Rates are cached in localStorage for 12 hours
3. LLM is instructed to extract prices in format: `Product | 100 USD ::`
4. JavaScript parses the response and calculates EUR conversions
5. Final output: `Product | 100 USD | €94.79 ::`

## Files
- `test.html` - Main HTML file
- `test/app.js` - Application logic with post-processing
- `test/currencyConverter.js` - Currency conversion module
- `test/promptSaver.js` - Prompt management utilities
- `src/styles.css` - Stylesheet (shared)
- `favicon.svg` - App icon

## Pros
- Precise mathematical conversions
- No rates sent to LLM (saves tokens)
- Deterministic results
- Currency name mapping (Yen → JPY)

## Cons
- Requires strict output format from LLM
- More complex implementation
- Post-processing overhead

## Usage
1. Open `test.html` in a browser
2. Set your Groq API key
3. Create/select an agent with "price" in the name
4. Ask for prices - JavaScript will convert them after LLM responds

## Format Requirements
LLM must output in format:
```
Product Name | 100 USD ::
Another Item | 1650 JPY ::
```

JavaScript will convert to:
```
Product Name | 100 USD | €94.79 ::
Another Item | 1650 JPY | €10.09 ::
```
