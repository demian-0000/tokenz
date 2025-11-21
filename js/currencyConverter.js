/**
 * CurrencyConverter - Handles accurate currency conversions using live rates
 */

class CurrencyConverter {
  constructor() {
    this.rates = null;
    this.base = 'EUR';
    this.timestamp = null;
    this.CACHE_DURATION = 12 * 60 * 60 * 1000; // 12 hours
    this.STORAGE_KEY = 'currencyRatesCache_test';
    
    // Map currency names to codes (all lowercase for case-insensitive matching)
    this.currencyNameMap = {
      'yen': 'JPY',
      'dollar': 'USD',
      'dollars': 'USD',
      'usd': 'USD',
      'peso': 'MXN',
      'pesos': 'MXN',
      'mxn': 'MXN',
      'pound': 'GBP',
      'pounds': 'GBP',
      'gbp': 'GBP',
      'euro': 'EUR',
      'euros': 'EUR',
      'eur': 'EUR',
      'yuan': 'CNY',
      'cny': 'CNY',
      'rupee': 'INR',
      'rupees': 'INR',
      'inr': 'INR',
      'real': 'BRL',
      'reais': 'BRL',
      'brl': 'BRL',
      'franc': 'CHF',
      'francs': 'CHF',
      'chf': 'CHF',
      'jpy': 'JPY'
    };
  }

  /**
   * Convert currency name to code
   * @param {string} nameOrCode - Currency name or code
   * @returns {string} Currency code
   */
  normalizeCurrency(nameOrCode) {
    const trimmed = nameOrCode.trim();
    const lower = trimmed.toLowerCase();
    
    // If it's already a valid 3-letter ISO code, return uppercase
    if (/^[A-Z]{3}$/i.test(trimmed) && trimmed.toUpperCase() !== 'YEN') {
      return trimmed.toUpperCase();
    }
    
    // Look up in name map (handles "yen", "YEN", "Yen", etc.)
    const mapped = this.currencyNameMap[lower];
    if (mapped) {
      console.log(`Mapped currency name "${nameOrCode}" to code "${mapped}"`);
      return mapped;
    }
    
    // Default: return uppercase
    console.warn(`Unknown currency: "${nameOrCode}", returning as-is`);
    return trimmed.toUpperCase();
  }

  /**
   * Load cached rates from localStorage
   */
  loadCachedRates() {
    try {
      const cached = localStorage.getItem(this.STORAGE_KEY);
      if (cached) {
        const data = JSON.parse(cached);
        const age = Date.now() - data.timestamp;
        
        if (age < this.CACHE_DURATION) {
          this.rates = data.rates;
          this.timestamp = data.timestamp;
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

  /**
   * Fetch fresh currency rates from API
   */
  async fetchRates() {
    try {
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/EUR');
      
      if (!response.ok) throw new Error('Failed to fetch rates');
      const data = await response.json();
      
      this.rates = data.rates;
      this.timestamp = Date.now();
      
      // Save to localStorage
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify({
        rates: this.rates,
        timestamp: this.timestamp
      }));
      
      console.log('Currency rates fetched and cached:', Object.keys(data.rates).length, 'currencies');
      return true;
    } catch (error) {
      console.error('Failed to fetch currency rates:', error);
      return false;
    }
  }

  /**
   * Initialize rates (try cache first, then fetch)
   */
  async initialize() {
    if (!this.loadCachedRates()) {
      await this.fetchRates();
    }
  }

  /**
   * Check if rates need refresh and update in background
   */
  checkAndRefresh() {
    if (!this.rates || (Date.now() - this.timestamp > this.CACHE_DURATION)) {
      this.fetchRates().catch(err => 
        console.error('Background rate refresh failed:', err)
      );
    }
  }

  /**
   * Convert amount from source currency to EUR
   * @param {number} amount - Amount to convert
   * @param {string} fromCurrency - Source currency code (e.g., 'USD', 'MXN')
   * @returns {number|null} Converted amount in EUR, or null if conversion fails
   */
  convertToEUR(amount, fromCurrency) {
    if (!this.rates) {
      console.error('Currency rates not loaded');
      return null;
    }

    // If already EUR, return as is
    if (fromCurrency === 'EUR') {
      return amount;
    }

    const rate = this.rates[fromCurrency];
    if (!rate) {
      console.error(`Currency ${fromCurrency} not found in rates. Available currencies:`, Object.keys(this.rates).slice(0, 10));
      return null;
    }

    // Since base is EUR, rate tells us 1 EUR = X fromCurrency
    // So to convert fromCurrency to EUR: amount / rate
    const result = amount / rate;
    console.log(`Conversion: ${amount} ${fromCurrency} / ${rate} = €${result.toFixed(2)}`);
    return result;
  }

  /**
   * Parse LLM response and convert currencies to EUR
   * Expected formats: 
   *   "Product Name | 100 USD ::"
   *   "Product Name | 100 USD | EUR ::"
   * Converts to: "Product Name | 100 USD | €X.XX ::"
   * @param {string} llmResponse - Raw response from LLM
   * @returns {string} Response with accurate EUR conversions appended
   */
  processLLMResponse(llmResponse) {
    if (!this.rates) {
      console.error('No rates available for conversion');
      return llmResponse + '\n\n[⚠️ Currency conversion unavailable - rates not loaded. Please refresh the page.]';
    }

    // Quick check: if no currency patterns found, return as-is (optimization)
    if (!/\d+(?:\.\d+)?\s+[A-Za-z]{3,6}/.test(llmResponse)) {
      console.log('No currency patterns detected, skipping conversion');
      return llmResponse;
    }

    console.log('Processing LLM response:', llmResponse);
    console.log('Available rates:', this.rates ? Object.keys(this.rates).length : 0);

    // Split by lines and process each line
    const lines = llmResponse.split('\n');
    const processedLines = lines.map(line => {
      // Trim the line first
      const trimmedLine = line.trim();
      
      // Check if already converted (has € symbol)
      if (trimmedLine.includes('€')) {
        console.log(`Already converted: "${trimmedLine}"`);
        return line;
      }
      
      // Check if it has a number after pipe but no currency code (e.g., "Product | 149 ::")
      // This might happen if LLM forgot to include currency
      const noCurrencyMatch = trimmedLine.match(/^(.+?)\|\s*(\d+(?:\.\d+)?)\s*(?:\([^)]+\))?\s*::$/);
      if (noCurrencyMatch && !/[A-Za-z]{3,6}/.test(noCurrencyMatch[0])) {
        console.warn(`⚠️ No currency code found in: "${trimmedLine}" - Cannot convert without currency`);
        return line + ' [⚠️ Missing currency code - cannot convert]';
      }
      
      // Try multiple patterns to be flexible
      // Pattern 1: "Product | 1650 JPY ::" or "Product | 1650 Yen ::"
      // Pattern 2: "Product | 1650 JPY | JPY ::"
      // Pattern 3: "Product | 1650 JPY"
      let match = trimmedLine.match(/^(.+?)\|\s*(\d+(?:\.\d+)?)\s+([A-Za-z]{3,6})\s*(?:\|\s*[A-Za-z]{3,6}\s*)?::$/);
      
      // If no match with ::, try without it
      if (!match) {
        match = trimmedLine.match(/^(.+?)\|\s*(\d+(?:\.\d+)?)\s+([A-Za-z]{3,6})\s*$/);
      }
      
      // If still no match, try with pipe before currency
      if (!match) {
        match = trimmedLine.match(/^(.+?)\|\s*(\d+(?:\.\d+)?)\s*\|\s*([A-Za-z]{3,6})\s*$/);
      }
      
      if (!match) {
        console.log(`No match for line: "${trimmedLine}"`);
        return line; // Return unchanged if no match
      }

      const [, product, amount, currencyRaw] = match;
      const numAmount = parseFloat(amount);
      
      // Normalize currency (convert "Yen" to "JPY", etc.)
      const currency = this.normalizeCurrency(currencyRaw);
      
      console.log(`✓ Found: product="${product.trim()}", amount=${amount}, currency=${currencyRaw} -> ${currency}`);
      
      if (currency === 'EUR') {
        // Already in EUR, just format nicely
        return `${product}| ${amount} EUR | €${numAmount.toFixed(2)} ::`;
      }
      
      const eurAmount = this.convertToEUR(numAmount, currency);
      
      if (eurAmount !== null) {
        console.log(`✓ Converted ${amount} ${currency} to €${eurAmount.toFixed(2)}`);
        return `${product}| ${amount} ${currency} | €${eurAmount.toFixed(2)} ::`;
      } else {
        console.error(`✗ Failed to convert ${currency}`);
        return `${product}| ${amount} ${currency} | €? (rate not found) ::`;
      }
    });

    // Filter out empty lines, remove trailing "::" from each line, then join with " :: "
    const nonEmptyLines = processedLines
      .filter(line => line.trim().length > 0)
      .map(line => line.trim().replace(/\s*::\s*$/, '')); // Remove trailing ::
    
    let processedResponse = nonEmptyLines.join(' :: ');

    // No footer message - rate age is shown in api-status

    return processedResponse;
  }

  /**
   * Get formatted rates info for display
   */
  getRatesInfo() {
    if (!this.rates || !this.timestamp) return 'No rates loaded';
    
    const age = Math.round((Date.now() - this.timestamp) / 1000 / 60);
    return `${Object.keys(this.rates).length} currencies (${age} min old)`;
  }
}

// Create global instance
const currencyConverter = new CurrencyConverter();
