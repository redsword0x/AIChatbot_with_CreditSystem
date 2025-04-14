

const OPENROUTER_API_KEY = "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";
const SITE_URL = window.location.origin;
const SITE_NAME = "ChatSpot";


const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const messagesContainer = document.getElementById('messages');


document.addEventListener('DOMContentLoaded', () => {

  messageInput.addEventListener('input', () => {
    messageInput.style.height = 'auto';
    messageInput.style.height = (messageInput.scrollHeight) + 'px';
  });
  

  sendButton.addEventListener('click', sendMessage);
  

  messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
  

  auth.onAuthStateChanged((user) => {
    if (user) {
      loadMessageHistory(user.uid);
    }
  });
});


function sendMessage() {
  const messageText = messageInput.value.trim();
  
  if (!messageText) return;
  
  const user = auth.currentUser;
  if (!user) {
    showToast('You must be logged in to send messages', 'error');
    return;
  }
  

  addMessageToUI(messageText, 'user');
  

  messageInput.value = '';
  messageInput.style.height = 'auto';
  

  useCredit(user.uid)
    .then(() => {
      // Save message to database
      return saveMessage(user.uid, messageText, true);
    })
    .then(() => {
      // Show typing indicator
      showTypingIndicator();
      
      // Send request to AI API
      return getAIResponse(messageText);
    })
    .then((aiResponse) => {
      // Remove typing indicator
      removeTypingIndicator();
      
      // Add AI response to UI
      addMessageToUI(aiResponse, 'ai');
      
      // Save AI response to database
      return saveMessage(user.uid, aiResponse, false);
    })
    .catch((error) => {
      removeTypingIndicator();
      
      if (error.message === 'No credits remaining') {
        // Don't show additional error, already handled in useCredit
        return;
      }
      
      console.error('Error:', error);
      showToast('Failed to get response. Please try again.', 'error');
    });
}

// Get AI response from OpenRouter API
async function getAIResponse(message) {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": SITE_URL,
        "X-Title": SITE_NAME,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "model": "nvidia/llama-3.1-nemotron-ultra-253b-v1:free",
        "messages": [
          {
            "role": "system",
            "content": "You are ChatSpot, a helpful AI assistant that provides clear, concise, and accurate information. Always be respectful and provide truthful responses. If you don't know the answer, say so rather than making something up."
          },
          {
            "role": "user",
            "content": message
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("API error:", error);
    throw error;
  }
}

// Add message to UI
function addMessageToUI(message, sender) {
  const messageElement = document.createElement('div');
  messageElement.className = `message ${sender}`;
  
  const messageContent = document.createElement('div');
  messageContent.className = 'message-content';
  
  // Process message text (convert URLs to links, handle markdown, etc)
  messageContent.innerHTML = processMessageText(message);
  
  messageElement.appendChild(messageContent);
  messagesContainer.appendChild(messageElement);
  
  // Scroll to bottom
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Process message text (convert URLs to links, basic markdown)
function processMessageText(text) {
  // Replace URLs with clickable links
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  text = text.replace(urlRegex, url => `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`);
  
  // Replace line breaks with <br>
  text = text.replace(/\n/g, '<br>');
  
  return text;
}

// Show typing indicator
function showTypingIndicator() {
  const typingElement = document.createElement('div');
  typingElement.className = 'message ai typing-indicator';
  typingElement.id = 'typing-indicator';
  
  const messageContent = document.createElement('div');
  messageContent.className = 'message-content';
  messageContent.innerHTML = '<span class="dot"></span><span class="dot"></span><span class="dot"></span>';
  
  typingElement.appendChild(messageContent);
  messagesContainer.appendChild(typingElement);
  
  // Scroll to bottom
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
  
  // Add the styles for typing indicator
  if (!document.getElementById('typing-styles')) {
    const style = document.createElement('style');
    style.id = 'typing-styles';
    style.textContent = `
      @keyframes blink {
        0% { opacity: 0.4; }
        20% { opacity: 1; }
        100% { opacity: 0.4; }
      }
      .typing-indicator .dot {
        display: inline-block;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        margin-right: 3px;
        background-color: var(--text-color);
        animation: blink 1.4s infinite both;
      }
      .typing-indicator .dot:nth-child(2) {
        animation-delay: 0.2s;
      }
      .typing-indicator .dot:nth-child(3) {
        animation-delay: 0.4s;
      }
    `;
    document.head.appendChild(style);
  }
}

// Remove typing indicator
function removeTypingIndicator() {
  const typingIndicator = document.getElementById('typing-indicator');
  if (typingIndicator) {
    typingIndicator.remove();
  }
}
