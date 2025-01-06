// app.js
const express = require('express');
const path = require('path');
const { OpenAI } = require("openai");

const app = express();
const port = 3000;

// OpenAI API ayarları
const openai = new OpenAI({
    apiKey: "psadkpwa",
    baseURL: "https://nixaut-ai-api.onrender.com/v1/"
});

// Statik dosyalar için klasör
app.use(express.static('public'));

// Ana sayfa
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// AI API endpoint
app.get('/api/chat/:message', async (req, res) => {
    try {
        const userMessage = decodeURIComponent(req.params.message);
        
        const response = await openai.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "Mesajlara yalnızca matematiksel ifadelerle cevap ver; kesirler, köklü ifadeler ve benzeri matematiksel gösterimler kullan."
                },
                {
                    role: "user",
                    content: userMessage
                }
            ],
            model: "claude-3.5-sonnet"
        });

        // Yapay düşünme süresi ekleyelim (1-3 saniye)
        setTimeout(() => {
            res.json({
                success: true,
                message: response.choices[0].message.content
            });
        }, Math.random() * 2000 + 1000);

    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({
            success: false,
            message: 'Bir hata oluştu. Lütfen tekrar deneyin.'
        });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

// Klasör yapısı oluştur
const fs = require('fs');
const publicDir = path.join(__dirname, 'public');

if (!fs.existsSync(publicDir)){
    fs.mkdirSync(publicDir);
}

// index.html dosyasını oluştur
const htmlContent = `
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vc-laude Chat</title>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        body {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
        }

        .chat-container {
            width: 90%;
            max-width: 800px;
            height: 80vh;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }

        .chat-header {
            background: rgba(255, 255, 255, 0.1);
            padding: 20px;
            text-align: center;
            color: white;
            font-size: 1.5em;
            font-weight: bold;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
        }

        .chat-messages {
            flex: 1;
            padding: 20px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 20px;
        }

        .message {
            max-width: 80%;
            padding: 15px;
            border-radius: 15px;
            animation: messageAppear 0.5s ease-out;
            position: relative;
            color: white;
        }

        .user-message {
            background: rgba(255, 255, 255, 0.2);
            align-self: flex-end;
            border-bottom-right-radius: 5px;
        }

        .bot-message {
            background: rgba(255, 255, 255, 0.15);
            align-self: flex-start;
            border-bottom-left-radius: 5px;
        }

        .thinking {
            align-self: flex-start;
            background: rgba(255, 255, 255, 0.15);
            padding: 15px;
            border-radius: 15px;
            color: white;
            display: none;
            animation: messageAppear 0.3s ease-out;
        }

        .typing {
            display: flex;
            gap: 5px;
            align-items: center;
        }

        .typing span {
            display: inline-block;
            width: 8px;
            height: 8px;
            background: white;
            border-radius: 50%;
            animation: typing 1s infinite;
        }

        .typing span:nth-child(2) { animation-delay: 0.2s; }
        .typing span:nth-child(3) { animation-delay: 0.4s; }

        @keyframes typing {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-5px); }
        }

        @keyframes messageAppear {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .chat-input {
            padding: 20px;
            background: rgba(255, 255, 255, 0.1);
            display: flex;
            gap: 10px;
        }

        .chat-input input {
            flex: 1;
            padding: 15px;
            border: none;
            border-radius: 10px;
            background: rgba(255, 255, 255, 0.2);
            color: white;
            font-size: 1em;
            outline: none;
            transition: all 0.3s ease;
        }

        .chat-input input::placeholder {
            color: rgba(255, 255, 255, 0.7);
        }

        .chat-input button {
            padding: 15px 25px;
            border: none;
            border-radius: 10px;
            background: rgba(255, 255, 255, 0.2);
            color: white;
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .chat-input button:hover {
            background: rgba(255, 255, 255, 0.3);
            transform: scale(1.05);
        }

        .chat-input button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .chat-input input:focus {
            background: rgba(255, 255, 255, 0.3);
        }

        .chat-messages::-webkit-scrollbar {
            width: 6px;
        }

        .chat-messages::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.1);
        }

        .chat-messages::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.3);
            border-radius: 3px;
        }
    </style>
</head>
<body>
    <div class="chat-container">
        <div class="chat-header">
            <i class="fas fa-robot"></i>
            Vc-laude Chat
        </div>
        <div class="chat-messages">
            <div class="message bot-message">
                Merhaba! Ben Vc-laude. Size nasıl yardımcı olabilirim?
            </div>
            <div class="thinking">
                <div class="typing">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        </div>
        <div class="chat-input">
            <input type="text" placeholder="Mesajınızı yazın..." id="messageInput">
            <button onclick="sendMessage()" id="sendButton">
                <i class="fas fa-paper-plane"></i>
            </button>
        </div>
    </div>

    <script>
        const messageInput = document.getElementById('messageInput');
        const sendButton = document.getElementById('sendButton');
        const chatMessages = document.querySelector('.chat-messages');
        const thinking = document.querySelector('.thinking');

        messageInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !sendButton.disabled) {
                sendMessage();
            }
        });

        async function sendMessage() {
            const message = messageInput.value.trim();
            if (!message) return;

            // Disable input and button while processing
            messageInput.disabled = true;
            sendButton.disabled = true;

            // Add user message
            addMessage(message, 'user');
            messageInput.value = '';

            // Show thinking animation
            thinking.style.display = 'block';
            scrollToBottom();

            try {
                // Send message to API
                const response = await fetch(\`/api/chat/\${encodeURIComponent(message)}\`);
                const data = await response.json();

                // Hide thinking animation and show bot response
                thinking.style.display = 'none';
                
                if (data.success) {
                    addMessage(data.message, 'bot');
                } else {
                    addMessage('Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.', 'bot');
                }

            } catch (error) {
                thinking.style.display = 'none';
                addMessage('Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.', 'bot');
            }

            // Re-enable input and button
            messageInput.disabled = false;
            sendButton.disabled = false;
            messageInput.focus();
        }

        function addMessage(text, sender) {
            const messageDiv = document.createElement('div');
            messageDiv.classList.add('message', \`\${sender}-message\`);
            messageDiv.textContent = text;
            chatMessages.insertBefore(messageDiv, thinking);
            scrollToBottom();
        }

        function scrollToBottom() {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    </script>
</body>
</html>
`;

fs.writeFileSync(path.join(publicDir, 'index.html'), htmlContent);
