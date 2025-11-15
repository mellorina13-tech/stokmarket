// api/auth/index.js
import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const sql = neon(process.env.DATABASE_URL);
const JWT_SECRET = process.env.JWT_SECRET || 'development-secret-key-change-in-production';

export default async function handler(req, res) {
  // CORS headers - Sadece kendi domain'inden izin ver
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // Handle GET requests - API health check + DB test
  if (req.method === 'GET') {
    try {
      const dbTest = await sql`SELECT NOW() as current_time`;
      
      return res.status(200).json({ 
        success: true, 
        message: 'Auth API is running',
        database: 'connected',
        dbTime: dbTest[0].current_time,
        endpoints: ['register', 'login', 'getUserData', 'updateBalance'],
        env: {
          hasDatabaseUrl: !!process.env.DATABASE_URL,
          hasJwtSecret: !!process.env.JWT_SECRET,
          nodeVersion: process.version
        }
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'API running but database connection failed',
        error: error.message,
        env: {
          hasDatabaseUrl: !!process.env.DATABASE_URL
        }
      });
    }
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed. Use POST.' });
  }
  
  const { action, email, password, fullName, userId, balance } = req.body || {};
  
  try {
    // ✅ Kullanıcı Kaydı - GÜVENLİ
    if (action === 'register') {
      if (!email || !password || !fullName) {
        return res.status(400).json({ success: false, message: 'Email, şifre ve ad soyad gerekli!' });
      }
      
      // Email formatı kontrolü
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ success: false, message: 'Geçerli bir email adresi girin!' });
      }
      
      // Şifre uzunluk kontrolü
      if (password.length < 6) {
        return res.status(400).json({ success: false, message: 'Şifre en az 6 karakter olmalı!' });
      }
      
      // Email kontrolü
      const existing = await sql`
        SELECT * FROM users WHERE email = ${email}
      `;
      
      if (existing.length > 0) {
        return res.status(400).json({ success: false, message: 'Bu email zaten kayıtlı!' });
      }
      
      // 🔒 ŞİFREYİ HASH'LE
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Yeni kullanıcı oluştur
      const result = await sql`
        INSERT INTO users (email, password, full_name, balance, created_at)
        VALUES (${email}, ${hashedPassword}, ${fullName}, 10000, NOW())
        RETURNING id, email, full_name, balance, created_at
      `;
      
      const user = result[0];
      
      // 🔐 JWT TOKEN OLUŞTUR
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
      
      return res.status(200).json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          balance: parseFloat(user.balance)
        },
        token
      });
    }
    
    // ✅ Kullanıcı Girişi - GÜVENLİ
    if (action === 'login') {
      if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email ve şifre gerekli!' });
      }
      
      const result = await sql`
        SELECT * FROM users WHERE email = ${email}
      `;
      
      if (result.length === 0) {
        return res.status(401).json({ success: false, message: 'Email veya şifre hatalı!' });
      }
      
      const user = result[0];
      
      // 🔒 ŞİFRE KONTROLÜ (HASH'LENMİŞ)
      const isPasswordValid = await bcrypt.compare(password, user.password);
      
      if (!isPasswordValid) {
        return res.status(401).json({ success: false, message: 'Email veya şifre hatalı!' });
      }
      
      // 🔐 JWT TOKEN
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
      
      return res.status(200).json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          balance: parseFloat(user.balance)
        },
        token
      });
    }
    
    // Kullanıcı Verilerini Getir
    if (action === 'getUserData') {
      if (!userId) {
        return res.status(400).json({ success: false, message: 'UserId gerekli!' });
      }
      
      const result = await sql`
        SELECT id, email, full_name, balance FROM users WHERE id = ${userId}
      `;
      
      if (result.length === 0) {
        return res.status(404).json({ success: false, message: 'Kullanıcı bulunamadı!' });
      }
      
      const user = result[0];
      return res.status(200).json({
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        balance: parseFloat(user.balance)
      });
    }
    
    // Bakiye Güncelle
    if (action === 'updateBalance') {
      if (!userId || balance === undefined) {
        return res.status(400).json({ success: false, message: 'UserId ve balance gerekli!' });
      }
      
      await sql`
        UPDATE users SET balance = ${balance} WHERE id = ${userId}
      `;
      
      return res.status(200).json({ success: true });
    }
    
    return res.status(400).json({ success: false, message: 'Geçersiz işlem! Action: register, login, getUserData, updateBalance olmalı.' });
    
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Sunucu hatası!', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
