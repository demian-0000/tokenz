# Performance Optimization Proposals for Test Version

## Current Issue
Test version takes ~2x longer than main version despite having shorter system prompt.

## Root Cause Analysis

### Main Version
- System prompt: ~200 tokens (base prompt + currency rates)
- LLM task: Extract prices AND convert to EUR (familiar task)
- Output: Clean, formatted with EUR conversions
- Processing time: Fast (LLM does everything in one pass)

### Test Version  
- System prompt: ~180 tokens (base prompt + modified instructions)
- LLM task: Extract prices but DON'T convert (unusual instruction)
- Output: May be verbose or confused
- Processing time: Slower (LLM confused by "don't convert" instruction)

## Proposed Solutions

### Option 1: Simplify the Prompt (RECOMMENDED)
**Remove the confusing "don't convert" instruction entirely.**

Instead of telling the LLM what NOT to do, just tell it what TO do:

```
Extract ALL prices and their associated products shown in the image.

Format your response as:
[Product name in English] | [amount] [CURRENCY_CODE] ::

Example:
Chocolate Bar | 50 MXN ::
Coffee | 120 MXN ::

Be concise. List only the data, no explanations.
```

**Expected improvement:** 30-50% faster (clearer task = faster inference)

### Option 2: Use Lower Temperature
Change temperature from 0.7 to 0.1 for price extraction tasks.

```javascript
temperature: currentAgent?.toLowerCase().includes('price') ? 0.1 : 0.7
```

**Expected improvement:** 10-20% faster (less sampling randomness)

### Option 3: Use Faster Model for Extraction
Switch to a faster model specifically for price extraction:
- Current: `llama-4-maverick-17b-128e-instruct` (slower, more capable)
- Suggested: `llama-3.1-8b-instant` (faster, sufficient for extraction)

**Expected improvement:** 50-70% faster (smaller model)

### Option 4: Reduce Max Tokens
Set lower max_tokens for price extraction:

```javascript
max_tokens: currentAgent?.toLowerCase().includes('price') ? 512 : 1024
```

**Expected improvement:** 5-10% faster (less generation overhead)

### Option 5: Hybrid Approach (BEST PERFORMANCE)
Combine multiple optimizations:

```javascript
// In sendMessage() function
const isPriceAgent = currentAgent?.toLowerCase().includes('price');

const apiPayload = {
    model: currentModel,
    messages: messagesToSend,
    temperature: isPriceAgent ? 0.1 : 0.7,
    max_tokens: isPriceAgent ? 512 : 1024
};
```

Plus simplified prompt from Option 1.

**Expected improvement:** 60-80% faster than current test version

## Implementation Priority

1. **Option 1** (Simplify prompt) - Easy, high impact
2. **Option 2** (Lower temperature) - Easy, medium impact  
3. **Option 4** (Reduce max_tokens) - Easy, low impact
4. **Option 3** (Faster model) - Medium effort, high impact
5. **Option 5** (Hybrid) - Combine all above

## Recommendation

Start with **Option 1 + Option 2 + Option 4** (all easy changes):
- Simplify the prompt to remove confusion
- Lower temperature to 0.1 for deterministic extraction
- Reduce max_tokens to 512 for price tasks

This should make the test version **faster than the main version** while maintaining 100% accuracy.

## Additional Benefits

- **Consistency**: Lower temperature = more consistent output format
- **Cost**: Fewer tokens = lower API costs
- **Reliability**: Simpler prompt = fewer parsing errors
