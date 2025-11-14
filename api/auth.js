// api/auth.js - Vercel Serverless Function
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // Handle GET requests - API health check
  if (req.method === 'GET') {
    return res.status(200).json({ 
      success: true, 
      message: 'Auth API is running',
      endpoints: ['register', 'login', 'getUserData', 'updateBalance']
    });
  }
  
  // Only accept POST requests for actual operations
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed. Use POST.' });
  }
  
  const { action, email, password, fullName, userId, balance } = req.body || {};
  
  try {
    // Kullanıcı Kaydı
    if (action === 'register') {
      if (!email || !password || !fullName) {
        return res.status(400).json({ success: false, message: 'Email, şifre ve ad soyad gerekli!' });
      }
      
      // Email kontrolü
      const existing = await sql`
        SELECT * FROM users WHERE email = ${email}
      `;
      
      if (existing.length > 0) {
        return res.status(400).json({ success: false, message: 'Bu email zaten kayıtlı!' });
      }
      
      // Yeni kullanıcı oluştur
      const result = await sql`
        INSERT INTO users (email, password, full_name, balance, created_at)
        VALUES (${email}, ${password}, ${fullName}, 10000, NOW())
        RETURNING id, email, full_name, balance, created_at
      `;
      
      const user = result[0];
      const token = Buffer.from(`${user.id}:${Date.now()}`).toString('base64');
      
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
    
    // Kullanıcı Girişi
    if (action === 'login') {
      if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email ve şifre gerekli!' });
      }
      
      const result = await sql`
        SELECT * FROM users WHERE email = ${email} AND password = ${password}
      `;
      
      if (result.length === 0) {
        return res.status(401).json({ success: false, message: 'Email veya şifre hatalı!' });
      }
      
      const user = result[0];
      const token = Buffer.from(`${user.id}:${Date.now()}`).toString('base64');
      
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
