// Typewriter effect
// Initialize Gemini API
let geminiApi;

try {
    geminiApi = new GeminiAPI();
} catch (error) {
    console.error('Failed to initialize Gemini API:', error);
}

// Simple anti-spam cooldown (milliseconds)
let lastSentAt = 0;
const COOLDOWN_MS = 1500; // 1.5 seconds between sends

function formatTime(date = new Date()) {
    const h = String(date.getHours()).padStart(2, '0');
    const m = String(date.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
}

function showChatNote(text, type = 'info', timeout = 3000) {
    const note = document.getElementById('chat-note');
    if (!note) return;
    note.textContent = '';
    const small = document.createElement('small');
    small.innerHTML = text;
    note.appendChild(small);
    if (type === 'warning') note.classList.add('warning'); else note.classList.remove('warning');
    if (timeout) {
        setTimeout(() => {
            // restore default message
            note.classList.remove('warning');
            note.innerHTML = '<small><strong>Perhatian:</strong> Jangan spam. Penggunaan berlebihan akan dibatasi untuk mencegah penyalahgunaan.</small>';
        }, timeout);
    }
}

function updateMessageCount() {
    const el = document.getElementById('message-count');
    if (!el) return;
    const count = document.querySelectorAll('#chat-messages .message').length;
    el.textContent = `Pesan: ${count}`;
}

// Helper: escape HTML to avoid injection in messages
function escapeHtml(unsafe) {
    return unsafe
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

// Helper: type out text into element (appends characters one by one)
// Current typing controller (if a message is being typed)
let currentTyping = null;

// Helper: type out text into element (appends characters one by one)
function typeOut(containerEl, text, charDelay = 20) {
    return new Promise((resolve) => {
        const safeText = escapeHtml(String(text || ''));
        let i = 0;

        // remove any existing text nodes but keep cursor span if present
        const cursor = containerEl.querySelector('.typing-cursor');
        containerEl.innerHTML = '';
        if (cursor) containerEl.appendChild(cursor);

        // expose finish() to allow skipping
        currentTyping = {
            finish: () => {
                try {
                    if (cursor) {
                        // insert remaining text before cursor
                        const rest = safeText.slice(i);
                        if (rest) cursor.insertAdjacentText('beforebegin', rest);
                    } else {
                        containerEl.textContent = safeText;
                    }
                } catch (e) {
                    // ignore
                }
                // ensure scroll
                const scroller = containerEl.closest('#chat-messages');
                if (scroller) scroller.scrollTop = scroller.scrollHeight;
                // clear controller and resolve
                currentTyping = null;
                resolve();
            }
        };

        function step() {
            if (i >= safeText.length) {
                // clear controller then resolve
                currentTyping = null;
                resolve();
                return;
            }
            // append next character before the cursor
            if (cursor) {
                cursor.insertAdjacentText('beforebegin', safeText[i]);
            } else {
                containerEl.textContent = safeText.slice(0, i + 1);
            }
            // keep chat scrolled to bottom while typing
            const scroller = containerEl.closest('#chat-messages');
            if (scroller) scroller.scrollTop = scroller.scrollHeight;
            i++;
            setTimeout(step, charDelay);
        }

        step();
    });
}

// Handle chat functionality
async function sendMessage() {
    const userInput = document.getElementById('user-input');
    const chatMessages = document.getElementById('chat-messages');
    const sendButton = document.querySelector('.send-button');
    
    if (!userInput.value.trim()) return;
    
    // Disable input and button while processing
    userInput.disabled = true;
    sendButton.disabled = true;
    
    // Anti-spam: enforce cooldown between sends
    const now = Date.now();
    if (now - lastSentAt < COOLDOWN_MS) {
        const wait = Math.ceil((COOLDOWN_MS - (now - lastSentAt)) / 1000 * 10) / 10;
        showChatNote(`<strong>Perhatian:</strong> Tunggu ${wait}s sebelum mengirim lagi.`, 'warning', 2000);
        userInput.disabled = false;
        sendButton.disabled = false;
        return;
    }

    // Add user message (escaped)
    const userMessage = document.createElement('div');
    userMessage.className = 'message user-message';

    const userContent = document.createElement('div');
    userContent.className = 'message-content';
    userContent.textContent = userInput.value;

    const userMeta = document.createElement('div');
    userMeta.className = 'meta';
    const ts = document.createElement('span');
    ts.className = 'timestamp';
    ts.textContent = formatTime();
    userMeta.appendChild(ts);

    userMessage.appendChild(userContent);
    userMessage.appendChild(userMeta);
    chatMessages.appendChild(userMessage);

    // update counters and last sent time
    lastSentAt = now;
    updateMessageCount();
    
    try {
    // Get response from Gemini API
    const response = await geminiApi.generateResponse(userInput.value);

    // Create bot message container and type out the response
    const botMessage = document.createElement('div');
    botMessage.className = 'message bot-message';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    // Add a blinking typing cursor element inside the content
    const cursor = document.createElement('span');
    cursor.className = 'typing-cursor';
    contentDiv.appendChild(cursor);

    botMessage.appendChild(contentDiv);
    chatMessages.appendChild(botMessage);

        // enable skip button
        const skipBtn = document.getElementById('skip-button');
        if (skipBtn) skipBtn.disabled = false;

        // Wait for the typing animation to finish
        await typeOut(contentDiv, response, 18); // 18ms per char for smoother pace

        // Remove cursor after typing finishes
        cursor.remove();

        // disable skip button
        if (skipBtn) skipBtn.disabled = true;

    // Append metadata (timestamp) for the bot message
    const botMeta = document.createElement('div');
    botMeta.className = 'meta';
    const botTs = document.createElement('span');
    botTs.className = 'timestamp';
    botTs.textContent = formatTime();
    botMeta.appendChild(botTs);
    botMessage.appendChild(botMeta);

    // Update message count
    updateMessageCount();
    } catch (error) {
        // Handle error
        const errorMessage = document.createElement('div');
        errorMessage.className = 'message bot-message';
        errorMessage.innerHTML = `<div class="message-content error">${error.message}</div>`;
        chatMessages.appendChild(errorMessage);
    } finally {
        // Re-enable input and button
        userInput.value = '';
        userInput.disabled = false;
        sendButton.disabled = false;
        userInput.focus();
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

// Handle Enter key in chat input
document.getElementById('user-input')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// Skip typing handler (called from button)
function skipTyping() {
    if (currentTyping && typeof currentTyping.finish === 'function') {
        currentTyping.finish();
    }
}

class Typewriter {
    constructor(element, phrases, speed = 60) {
        this.element = element;
        this.phrases = phrases;
        this.speed = speed;
        this.currentPhrase = 0;
        this.currentChar = 0;
        this.isDeleting = false;
        this.isPaused = false;
        
        // Create cursor element
        this.cursor = document.createElement('span');
        this.cursor.className = 'typewriter-cursor';
        this.element.parentNode.insertBefore(this.cursor, this.element.nextSibling);
        
        this.type();
    }
    
    type() {
        const currentText = this.phrases[this.currentPhrase];
        
        if (this.isDeleting) {
            // Remove character
            this.element.textContent = currentText.substring(0, this.currentChar - 1);
            this.currentChar--;
            
            if (this.currentChar === 0) {
                this.isDeleting = false;
                this.currentPhrase = (this.currentPhrase + 1) % this.phrases.length;
                
                // Pause before typing next phrase
                this.isPaused = true;
                setTimeout(() => {
                    this.isPaused = false;
                    this.type();
                }, 1000);
                return;
            }
        } else {
            // Add character
            this.element.textContent = currentText.substring(0, this.currentChar + 1);
            this.currentChar++;
            
            if (this.currentChar === currentText.length) {
                // Pause at the end of phrase
                this.isPaused = true;
                setTimeout(() => {
                    this.isPaused = false;
                    this.isDeleting = true;
                    this.type();
                }, 2000);
                return;
            }
        }
        
        // Calculate typing speed
        const typingSpeed = this.isDeleting ? this.speed / 2 : this.speed;
        
        if (!this.isPaused) {
            setTimeout(() => this.type(), typingSpeed);
        }
    }
}

// Initialize typewriter when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Typewriter effect
    const typewriterElement = document.querySelector('.typewriter');
    if (typewriterElement) {
        new Typewriter(typewriterElement, [
            "Hai, aku Xiuchatbot 👋",
            "Tanya apa aja ke aku!",
            "Aku siap bantu keseharianmu 💡"
        ], 60);
    }
    
    // Scroll reveal animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    // Observe elements with fade-in class
    document.querySelectorAll('.feature-card, .section-title, .about-content').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
        observer.observe(el);
    });
    
    // Mobile menu toggle
    const menuToggle = document.querySelector('.menu-toggle');
    const mobileMenu = document.querySelector('.mobile-menu');
    
    if (menuToggle && mobileMenu) {
        menuToggle.addEventListener('click', () => {
            mobileMenu.classList.toggle('active');
            // Animate menu toggle spans
            menuToggle.classList.toggle('active');
        });
    }
    
    // Smooth scroll for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
                // Close mobile menu if open
                if (mobileMenu && mobileMenu.classList.contains('active')) {
                    mobileMenu.classList.remove('active');
                    menuToggle.classList.remove('active');
                }
            }
        });
    });
});