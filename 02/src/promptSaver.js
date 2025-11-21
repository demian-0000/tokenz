/**
 * PromptSaver - Simple utility to save and load agent prompts to/from JSON files
 */

class PromptSaver {
  /**
   * Save prompts to a JSON file
   * @param {Array} prompts - Array of prompt objects
   * @param {string} filename - Optional custom filename
   */
  static saveToFile(prompts, filename = 'agent_prompts.json') {
    const data = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      promptCount: prompts.length,
      prompts: prompts
    };

    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    
    URL.revokeObjectURL(url);
  }

  /**
   * Load prompts from a JSON file
   * @returns {Promise<Array>} Promise that resolves to array of prompts
   */
  static loadFromFile() {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      
      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) {
          reject(new Error('No file selected'));
          return;
        }

        try {
          const text = await file.text();
          const data = JSON.parse(text);
          
          // Validate structure
          if (!data.prompts || !Array.isArray(data.prompts)) {
            throw new Error('Invalid prompts file format');
          }

          // Validate each prompt has required fields
          for (const prompt of data.prompts) {
            if (!prompt.name || !prompt.prompt) {
              throw new Error('Invalid prompt structure: missing name or prompt field');
            }
          }

          resolve(data.prompts);
        } catch (error) {
          reject(error);
        }
      };

      input.click();
    });
  }

  /**
   * Merge loaded prompts with existing prompts
   * @param {Array} existingPrompts - Current prompts
   * @param {Array} loadedPrompts - Prompts from file
   * @param {string} conflictStrategy - 'keep', 'replace', or 'rename'
   */
  static mergePrompts(existingPrompts, loadedPrompts, conflictStrategy = 'keep') {
    const merged = [...existingPrompts];
    const existingNames = new Set(existingPrompts.map(p => p.name));

    for (const loadedPrompt of loadedPrompts) {
      if (existingNames.has(loadedPrompt.name)) {
        // Handle conflict
        if (conflictStrategy === 'replace') {
          const index = merged.findIndex(p => p.name === loadedPrompt.name);
          merged[index] = loadedPrompt;
        } else if (conflictStrategy === 'rename') {
          let newName = loadedPrompt.name;
          let counter = 1;
          while (existingNames.has(newName)) {
            newName = `${loadedPrompt.name} (${counter})`;
            counter++;
          }
          merged.push({ ...loadedPrompt, name: newName });
          existingNames.add(newName);
        }
        // 'keep' strategy: do nothing, skip the loaded prompt
      } else {
        // No conflict, add the prompt
        merged.push(loadedPrompt);
        existingNames.add(loadedPrompt.name);
      }
    }

    return merged;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PromptSaver;
}
