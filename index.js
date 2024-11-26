const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const app = express();
const port = 3000;

// Soruları JSON'dan Yükleme Fonksiyonu
const sorularYukle = () => {
    if (!fs.existsSync('sorular.json')) {
        console.error('sorular.json bulunamadı.');
        return [];
    }
    const data = fs.readFileSync('sorular.json');
    return JSON.parse(data);
};

// Skorları Yükleme ve Kaydetme Fonksiyonları
const skorYukle = () => {
    if (!fs.existsSync('skorlar.json')) return {};
    const data = fs.readFileSync('skorlar.json');
    return JSON.parse(data);
};

const skorKaydet = (skorlar) => {
    fs.writeFileSync('skorlar.json', JSON.stringify(skorlar, null, 2));
};

// Middlewares
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');

// Giriş Sayfası
app.get('/isim', (req, res) => {
    res.render('isim');
});

// Quiz Sayfası
app.post('/quiz', (req, res) => {
    const username = req.body.kullaniciAdi;
    if (!username || username.trim() === '') {
        return res.redirect('/');
    }
    const sorular = sorularYukle(); // JSON'dan yükle
    res.render('quiz', { username, sorular });
});

// Cevap Kontrolü API'si
app.post('/kontrol-cevap', (req, res) => {
    const { soruId, cevap } = req.body;
    const sorular = sorularYukle();
    const soru = sorular.find(s => s.id === parseInt(soruId));
    
    if (!soru) {
        return res.json({ hata: 'Soru bulunamadı' });
    }

    const dogruMu = soru.cevap === cevap;
    if (!dogruMu) {
        return res.json({
            dogruMu: false,
            cozum: soru.cozum,
            dogruCevap: soru.cevap
        });
    }

    return res.json({ dogruMu: true });
});

// Cevap İşleme
app.post('/cevapla', (req, res) => {
    const { kullaniciAdi, ...cevaplar } = req.body;
    const sorular = sorularYukle();
    let skorlar = skorYukle();

    let toplamPuan = 0;
    sorular.forEach(soru => {
        const kullaniciCevabi = cevaplar[`cevap${soru.id}`];
        if (kullaniciCevabi === soru.cevap) {
            toplamPuan += 2;
        }
    });

    skorlar[kullaniciAdi] = (skorlar[kullaniciAdi] || 0) + toplamPuan;
    skorKaydet(skorlar);

    res.render('sonuc', {
        username: kullaniciAdi,
        toplamPuan: toplamPuan,
        genelSkor: skorlar[kullaniciAdi]
    });
});

app.listen(port, () => {
    console.log(`Sunucu http://localhost:${port} üzerinde çalışıyor.`);
});
