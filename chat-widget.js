document.addEventListener('DOMContentLoaded', () => {
  // Configuration
  const API_URL = 'https://spilia-chatbot-821930721682.europe-west1.run.app/chat';
  const TENANT_ID = 'spilia_retreat'; 

  const chatToggle = document.getElementById('chat-toggle');
  const chatWindow = document.getElementById('chat-window');
  const chatMessages = document.getElementById('chat-messages');
  const chatInput = document.getElementById('chat-input-field');
  const chatSend = document.getElementById('chat-send-btn');
  const typingIndicator = document.getElementById('chat-typing');

  let isChatOpen = false;
  let chatHistory = [];

  // Toggle chat window
  chatToggle.addEventListener('click', () => {
    isChatOpen = !isChatOpen;
    chatToggle.classList.toggle('open', isChatOpen);
    chatWindow.classList.toggle('open', isChatOpen);
    if (isChatOpen) {
      chatInput.focus();
      if (chatHistory.length === 0) {
        addMessage("assistant", "Kalimera! I'm the Spilia Retreat virtual concierge. How can I help you plan your stay in Sifnos?");
      }
    }
  });

  // Handle message submission
  function sendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;

    // Add user message to UI
    addMessage('user', text);
    chatInput.value = '';
    chatInput.focus();
    
    // Add to history
    chatHistory.push({ role: 'user', content: text });

    // Show typing indicator
    typingIndicator.classList.add('active');
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Send to backend
    fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tenant_id: TENANT_ID,
        message: text,
        history: chatHistory.slice(0, -1) // send previous history
      })
    })
    .then(response => {
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json();
    })
    .then(data => {
      typingIndicator.classList.remove('active');
      addMessage('assistant', data.response);
      chatHistory.push({ role: 'assistant', content: data.response });
    })
    .catch(error => {
      console.error('Error:', error);
      typingIndicator.classList.remove('active');
      addMessage('assistant', "I'm having trouble connecting right now. Please try again or contact us directly at hello@spiliaretreat.gr.");
      chatHistory.pop(); // Remove failed user message from history array to keep sync
    });
  }

  // Helper to add message to UI
  function addMessage(role, text) {
    const msgEl = document.createElement('div');
    msgEl.classList.add('chat-message', role);
    msgEl.textContent = text;
    chatMessages.insertBefore(msgEl, typingIndicator);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  // Event Listeners for sending
  chatSend.addEventListener('click', sendMessage);
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
  });
});
