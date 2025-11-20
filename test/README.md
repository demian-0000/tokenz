# Test Version - JavaScript-Based Currency Conversion

This test version demonstrates accurate, consistent currency conversions using JavaScript calculations instead of relying on the LLM to perform math.

## Key Differences from Main Version

### Main Version (index.html + src/app.js)
- **LLM does the conversion**: Exchange rates are injected into the system prompt as text
- **Less reliable**: LLMs can make math errors, rounding inconsistencies
- **Variable results**: Temperature setting (0.7) means same input can give different outputs
- **Two-step process**: LLM reads rates and performs calculations

### Test Version (test.html + test/app.js)
- **JavaScript does the conversion**: LLM only extracts prices and currency codes
- **100% accurate**: JavaScript performs precise mathematical calculations
- **Consistent results**: Same input always produces identical output
- **One-step process**: LLM extracts data, JS converts immediately

## How It Works

1. **Currency Rates**: Fetched from `https://api.exchangerate-api.com/v4/latest/EUR`
2. **Caching**: Rates cached for 12 hours in localStorage (separate from main version)
3. **LLM Role**: Only extracts product names, prices, and currency codes
4. **JS Conversion**: `currencyConverter.js` performs accurate EUR conversions
5. **Output Format**: `Product | Amount CURRENCY | €X.XX ::`

## Files

- `test.html` - Main HTML file (loads test scripts)
- `test/app.js` - Modified app with JS-based conversion
- `test/currencyConverter.js` - Currency conversion utility class
- `test/promptSaver.js` - Copy of prompt management utility
- `test/agent_prompts_test.json` - Updated "price" agent prompt

## Usage

1. Open `test.html` in your browser
2. Set your Groq API key
3. Load the test agent prompts from `test/agent_prompts_test.json`
4. Select the "price" agent
5. Upload an image with prices
6. Compare results with the main version

## Benefits

✅ **Accuracy**: No math errors from LLM  
✅ **Consistency**: Same conversion every time  
✅ **Reliability**: JavaScript math is deterministic  
✅ **Transparency**: Conversion logic is visible in code  
✅ **Performance**: Faster processing (no rate text in prompt)

## Testing

To compare both versions:
1. Use the same image in both versions
2. Use the same model and agent
3. Compare EUR conversion results
4. Test version should be identical across multiple runs
5. Main version may vary slightly between runs
