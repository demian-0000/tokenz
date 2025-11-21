// Copy button functionality for assistant messages
const CopyButton = {
    // Add copy button to a message element
    addToMessage(messageElement) {
        if (!messageElement || !messageElement.classList.contains('assistant')) {
            return;
        }

        // Create button
        const button = document.createElement('button');
        button.className = 'copy-button';
        button.setAttribute('aria-label', 'Copy message');
        button.setAttribute('title', 'Copy to clipboard');
        
        // Add copy icon SVG
        button.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
                <g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5">
                    <path d="M16.75 5.75a3 3 0 0 0-3-3h-6.5a3 3 0 0 0-3 3v9.5a3 3 0 0 0 3 3h6.5a3 3 0 0 0 3-3z"/>
                    <path d="M19.75 6.75v8.5a6 6 0 0 1-6 6h-5.5"/>
                </g>
            </svg>
        `;
        
        // Add click handler
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            this.copy(messageElement, button);
        });
        
        messageElement.appendChild(button);
    },

    // Copy message content to clipboard
    async copy(messageElement, button) {
        try {
            // Extract text content (handle both text and pre-formatted content)
            let text = '';
            const preElement = messageElement.querySelector('pre');
            if (preElement) {
                text = preElement.textContent;
            } else {
                text = messageElement.textContent;
            }
            
            // Remove the "Copy to clipboard" text from the button if present
            text = text.replace(/Copy to clipboard/g, '').trim();
            
            // Copy to clipboard
            await navigator.clipboard.writeText(text);
            
            // Visual feedback
            this.showCopiedState(button);
            
        } catch (err) {
            console.error('Failed to copy:', err);
            // Fallback for older browsers
            this.fallbackCopy(messageElement, button);
        }
    },

    // Fallback copy method for older browsers
    fallbackCopy(messageElement, button) {
        try {
            const text = messageElement.textContent.replace(/Copy to clipboard/g, '').trim();
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            
            this.showCopiedState(button);
        } catch (err) {
            console.error('Fallback copy failed:', err);
        }
    },

    // Show "copied" visual feedback
    showCopiedState(button) {
        const originalHTML = button.innerHTML;
        
        // Change to checkmark
        button.classList.add('copied');
        button.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
        `;
        
        // Reset after 2 seconds
        setTimeout(() => {
            button.classList.remove('copied');
            button.innerHTML = originalHTML;
        }, 2000);
    },

    // Initialize - set up event delegation for dynamically added messages
    initialize() {
        console.log('CopyButton module initialized');
    }
};

// Auto-initialize when script loads
CopyButton.initialize();
