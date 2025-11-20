# Prompt Save/Load Feature

## Overview

The application now supports saving and loading agent prompts to/from JSON files. This allows you to backup your custom prompts and share them across devices.

## How to Use

### Saving Prompts

1. Open the Prompts modal (click the document icon in the header)
2. Click the **"Save All"** button
3. Your browser will download a file named `agent_prompts.json`

### Loading Prompts

1. Open the Prompts modal
2. Click the **"Load"** button
3. Select a previously saved `agent_prompts.json` file
4. If there are conflicts (prompts with the same name), you'll be asked to choose:
   - **keep**: Keep your existing prompts, skip conflicting ones from the file
   - **replace**: Replace your existing prompts with the ones from the file
   - **rename**: Add the loaded prompts with a number suffix (e.g., "Helper (1)")

## File Format

The JSON file has the following structure:

```json
{
  "version": "1.0",
  "exportedAt": "2025-11-20T10:30:00.000Z",
  "promptCount": 2,
  "prompts": [
    {
      "name": "Code Helper",
      "prompt": "You are an expert programmer..."
    },
    {
      "name": "Writer",
      "prompt": "You are a creative writer..."
    }
  ]
}
```

## Notes

- Prompts are still saved to localStorage automatically
- The save/load feature is for backup and sharing purposes
- Files are saved to your browser's default download location
- No server or external storage is required
