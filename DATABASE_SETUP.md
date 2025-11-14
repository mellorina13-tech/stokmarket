# 🗄️ Neon Database Kurulum Rehberi

## Sorun
Sitenizde "Bağlantı hatası" almanızın nedeni Neon veritabanınızda gerekli tabloların olmamasıdır.

## ✅ Çözüm Adımları

### 1. Neon Console'a Giriş Yapın
- https://console.neon.tech adresine gidin
- Projenizi seçin

### 2. SQL Editor'ü Açın
- Sol menüden **"SQL Editor"** sekmesine tıklayın

### 3. Tabloları Oluşturun
Aşağıdaki SQL kodunu kopyalayıp SQL Editor'e yapıştırın ve **"Run"** butonuna tıklayın:

```sql
-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  balance DECIMAL(10, 2) DEFAULT 10000.00,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Portfolio Table
CREATE TABLE IF NOT EXISTS portfolio (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  portfolio_data JSONB NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_portfolio_user_id ON portfolio(user_id);
```

### 4. Tabloların Oluştuğunu Kontrol Edin
SQL Editor'de şu komutu çalıştırın:
```sql
SELECT * FROM users;
```

Eğer boş bir tablo görüyorsanız (hata almadan), kurulum başarılı! ✅

### 5. (Opsiyonel) Test Kullanıcısı Oluşturun
```sql
INSERT INTO users (email, password, full_name, balance)
VALUES ('test@test.com', '123456', 'Test User', 10000.00);
```

### 6. Sitenizi Test Edin
- https://stokmarket.vercel.app adresine gidin
- "Kayıt Ol" butonuna tıklayın
- Yeni bir hesap oluşturmayı deneyin

Artık kayıt işlemi çalışmalı! 🎉

## 📊 Tablo Açıklamaları

### `users` Tablosu
- `id`: Otomatik artan kullanıcı ID
- `email`: Kullanıcı email adresi (benzersiz)
- `password`: Kullanıcı şifresi (güvenlik için hashlenmelidir - gelişmiş versiyonda)
- `full_name`: Kullanıcının adı soyadı
- `balance`: Kullanıcı bakiyesi (varsayılan: 10,000 TL)
- `created_at`: Hesap oluşturulma tarihi

### `portfolio` Tablosu
- `id`: Otomatik artan portföy ID
- `user_id`: Kullanıcı referansı
- `portfolio_data`: Kullanıcının portföy verileri (JSON formatında)
- `updated_at`: Son güncelleme tarihi

## 🔒 Güvenlik Notu
⚠️ Şu anda şifreler düz metin olarak saklanıyor. Canlı kullanım için mutlaka bcrypt veya benzeri bir hash algoritması kullanılmalıdır!
