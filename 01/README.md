# Version 01: LLM-Based Currency Conversion

## Description
This version uses **LLM-based currency conversion** where live exchange rates are injected into the system prompt, and the AI model performs the conversion calculations.

## How It Works
1. Currency rates are fetched from `api.exchangerate-api.com`
2. Rates are cached in localStorage for 12 hours
3. When an agent is selected, rates are appended to the system prompt
4. LLM receives rates and calculates conversions

## Files
- `index.html` - Main HTML file
- `src/app.js` - Application logic with rate injection
- `src/styles.css` - Stylesheet
- `src/promptSaver.js` - Prompt management utilities
- `favicon.svg` - App icon

## Pros
- Simple implementation
- No post-processing needed
- Flexible output format

## Cons
- Sends ~200-300 extra tokens per message (even for non-currency questions)
- LLM accuracy depends on model's math capabilities
- Less deterministic results

## Usage
1. Open `index.html` in a browser
2. Set your Groq API key
3. Create/select an agent
4. Ask questions - rates are automatically included in every message when agent is active
