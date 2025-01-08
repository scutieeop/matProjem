const express = require('express');
const fetch = require('node-fetch');
const FormData = require('form-data');

const app = express();
const port = 3000;

// IP bazlı mesaj geçmişini tutacak veri yapısı
const dataList = new Map();

app.use(express.json());

// IP bazlı mesaj geçmişini getiren yardımcı fonksiyon
function getMessageHistory(ip) {
    if (!dataList.has(ip)) {
        dataList.set(ip, []);
    }
    return dataList.get(ip);
}

app.get('/send-message', async (req, res) => {
    try {
        const { message } = req.query;
        const clientIP = req.ip; // Kullanıcının IP adresini al
        
        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // IP için mesaj geçmişini al
        const messageHistory = getMessageHistory(clientIP);
        
        // Yeni mesajı geçmişe ekle
        messageHistory.push({
            role: "user",
            content: message
        });

        const formData = new FormData();
        formData.append('chat_style', 'chat');
        formData.append('chatHistory', JSON.stringify(messageHistory));

        const response = await fetch('https://api.deepai.org/hacking_is_a_serious_crime', {
            method: 'POST',
            headers: {
                'accept': '*/*',
                'accept-language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
                "Api-Key": "4e254fae-f94f-42a2-b5a9-adf4dc47b53f",
                'priority': 'u=1, i',
                'sec-ch-ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"Windows"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-site',
                'cookie': 'user_sees_ads=false; messages=W1siX19qc29uX21lc3NhZ2UiLDAsMjUsIlN1Y2Nlc3NmdWxseSBzaWduZWQgaW4gYXMgb2ZvZjI0Njd5by4iLCIiXV0:1tVbPU:d2UwILC-f6QLkTDZtwXLACKyv2dJqDrxiWmVEPs1_Ps; csrftoken=I6I3yF5QtOxC23NKKyqw9fQiHHTpCKHl; sessionid=44n6y11r2c1vul2ri9kxboi5qhrcs34p'
            },
            body: formData
        });

        const data = await response.text();
        
        // API yanıtını mesaj geçmişine ekle
        messageHistory.push({
            role: "assistant",
            content: data
        });

        res.send(data);
        
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

// Mesaj geçmişini görüntüleme endpoint'i
app.get('/message-history', (req, res) => {
    const clientIP = req.ip;
    const history = getMessageHistory(clientIP);
    res.json(history);
});

// Mesaj geçmişini temizleme endpoint'i
app.delete('/clear-history', (req, res) => {
    const clientIP = req.ip;
    dataList.delete(clientIP);
    res.json({ message: 'Message history cleared successfully' });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
