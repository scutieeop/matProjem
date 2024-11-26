import tensorflow as tf
import numpy as np
import pandas as pd
from tensorflow.keras import layers
from tensorflow.keras.models import Model
from transformers import TFAutoModel, AutoTokenizer
import json

class GelismisMatematikUretici:
    def __init__(self, model_adi="bert-base-multilingual-cased", max_uzunluk=128):
        self.max_uzunluk = max_uzunluk
        self.tokenizer = AutoTokenizer.from_pretrained(model_adi)
        self.bert = TFAutoModel.from_pretrained(model_adi)
        self.zorluk_seviyeleri = ['kolay', 'orta', 'zor']
        
    def transformer_blok(self, x, head_size, num_heads, ff_dim, dropout=0):
        """Transformer bloğu oluşturur"""
        attention_output = layers.MultiHeadAttention(
            num_heads=num_heads, key_dim=head_size)(x, x)
        attention_output = layers.Dropout(dropout)(attention_output)
        x1 = layers.Add()([x, attention_output])
        x1 = layers.LayerNormalization(epsilon=1e-6)(x1)
        
        ff_output = layers.Dense(ff_dim, activation="relu")(x1)
        ff_output = layers.Dense(x.shape[-1])(ff_output)
        ff_output = layers.Dropout(dropout)(ff_output)
        x2 = layers.Add()([x1, ff_output])
        return layers.LayerNormalization(epsilon=1e-6)(x2)
    
    def model_olustur(self):
        """Soru ve cevap üreteci modeli oluşturur"""
        # Giriş katmanları
        zorluk_input = layers.Input(shape=(1,), name='zorluk')
        konu_input = layers.Input(shape=(1,), name='konu')
        
        # Embedding katmanları
        zorluk_embedding = layers.Embedding(len(self.zorluk_seviyeleri), 32)(zorluk_input)
        konu_embedding = layers.Embedding(10, 32)(konu_input)  # 10 farklı konu için
        
        # BERT çıktısını al
        bert_input = layers.Input(shape=(self.max_uzunluk,), dtype=tf.int32)
        bert_output = self.bert(bert_input)[0]
        
        # Transformer blokları
        x = self.transformer_blok(bert_output, 64, 8, 256)
        x = self.transformer_blok(x, 64, 8, 256)
        
        # Zorluk ve konu bilgisini ekle
        zorluk_konu = layers.Concatenate()([zorluk_embedding, konu_embedding])
        zorluk_konu = layers.Dense(768, activation='relu')(zorluk_konu)
        zorluk_konu = layers.RepeatVector(self.max_uzunluk)(zorluk_konu)
        
        # Çıktıları birleştir
        x = layers.Concatenate()([x, zorluk_konu])
        
        # Soru üreteci
        soru_output = layers.Dense(self.tokenizer.vocab_size, activation='softmax', name='soru')(x)
        
        # Cevap üreteci
        cevap_vec = layers.GlobalAveragePooling1D()(x)
        cevap_vec = layers.Dense(256, activation='relu')(cevap_vec)
        cevap_output = layers.Dense(self.tokenizer.vocab_size, activation='softmax', name='cevap')(cevap_vec)
        
        # Model oluştur
        self.model = Model(
            inputs=[bert_input, zorluk_input, konu_input],
            outputs=[soru_output, cevap_output]
        )
        
        # Model derleme
        self.model.compile(
            optimizer=tf.keras.optimizers.Adam(learning_rate=1e-5),
            loss={
                'soru': 'sparse_categorical_crossentropy',
                'cevap': 'sparse_categorical_crossentropy'
            },
            metrics=['accuracy']
        )
    
    def veri_yukle(self, dosya_yolu):
        """JSON formatında eğitim verisini yükler"""
        with open(dosya_yolu, 'r', encoding='utf-8') as f:
            self.veri = json.load(f)
            
    def veri_hazirla(self):
        """Eğitim verilerini hazırlar"""
        X_soru = []
        X_zorluk = []
        X_konu = []
        y_soru = []
        y_cevap = []
        
        for ornek in self.veri:
            # Tokenization
            encoded = self.tokenizer(
                ornek['soru'],
                padding='max_length',
                truncation=True,
                max_length=self.max_uzunluk,
                return_tensors='tf'
            )
            
            X_soru.append(encoded['input_ids'][0])
            X_zorluk.append(self.zorluk_seviyeleri.index(ornek['zorluk']))
            X_konu.append(ornek['konu_id'])
            
            # Soru ve cevap tokenları
            y_soru.append(encoded['input_ids'][0][1:])  # İlk token hariç
            
            cevap_encoded = self.tokenizer(
                ornek['cevap'],
                padding='max_length',
                truncation=True,
                max_length=self.max_uzunluk,
                return_tensors='tf'
            )
            y_cevap.append(cevap_encoded['input_ids'][0])
        
        return {
            'bert_input': tf.stack(X_soru),
            'zorluk': tf.stack(X_zorluk),
            'konu': tf.stack(X_konu)
        }, {
            'soru': tf.stack(y_soru),
            'cevap': tf.stack(y_cevap)
        }
    
    def egit(self, epochs=10, batch_size=32):
        """Modeli eğitir"""
        X, y = self.veri_hazirla()
        self.model.fit(
            X, y,
            epochs=epochs,
            batch_size=batch_size,
            validation_split=0.1
        )
    
    def soru_uret(self, zorluk, konu_id, baslangic_kelimesi="Bir"):
        """Yeni soru ve cevap üretir"""
        # Başlangıç tokenları
        start_tokens = self.tokenizer(
            baslangic_kelimesi,
            padding='max_length',
            truncation=True,
            max_length=self.max_uzunluk,
            return_tensors='tf'
        )
        
        # Girişleri hazırla
        inputs = {
            'bert_input': start_tokens['input_ids'],
            'zorluk': tf.constant([[self.zorluk_seviyeleri.index(zorluk)]]),
            'konu': tf.constant([[konu_id]])
        }
        
        # Soru ve cevap üret
        soru_tokens, cevap_tokens = self.model.predict(inputs)
        
        # Token'ları metne çevir
        soru = self.tokenizer.decode(np.argmax(soru_tokens[0], axis=-1))
        cevap = self.tokenizer.decode(np.argmax(cevap_tokens[0], axis=-1))
        
        return soru.strip(), cevap.strip()
    
    def kaydet(self, dosya_yolu):
        """Modeli kaydet"""
        self.model.save_weights(dosya_yolu)
    
    def yukle(self, dosya_yolu):
        """Modeli yükle"""
        self.model.load_weights(dosya_yolu)

# Örnek eğitim verisi formatı
ornek_veri = [
    {
        "soru": "Bir çiftçinin 45 koyunu vardır. 12 koyun satar ise kaç koyunu kalır?",
        "cevap": "33 koyun",
        "zorluk": "kolay",
        "konu_id": 0  # 0: Temel matematik işlemleri
    },
    {
        "soru": "Bir dairenin çapı 10 cm ise, çevresi kaç cm'dir? (π=3.14 alınız)",
        "cevap": "31.4 cm",
        "zorluk": "orta",
        "konu_id": 3  # 3: Geometri
    }
    # Daha fazla örnek eklenecek...
]

# Kullanım örneği
if __name__ == "__main__":
    # Model oluştur
    uretici = GelismisMatematikUretici()
    uretici.model_olustur()
    
    # Veriyi JSON dosyasına kaydet
    with open('matematik_veri.json', 'w', encoding='utf-8') as f:
        json.dump(ornek_veri, f, ensure_ascii=False, indent=2)
    
    # Veriyi yükle ve modeli eğit
    uretici.veri_yukle('matematik_veri.json')
    uretici.egit(epochs=50, batch_size=16)
    
    # Yeni soru üret
    soru, cevap = uretici.soru_uret('orta', 0, "Bir market")
    print(f"Soru: {soru}")
    print(f"Cevap: {cevap}")