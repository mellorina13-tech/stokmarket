// api/portfolio.js - Vercel Serverless Function
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

  try {
    // GET - Portföyü Getir
    if (req.method === 'GET') {
      const result = await sql`
        SELECT * FROM portfolios WHERE user_id = ${req.query.userId}
      `;

      return res.status(200).json(result);
    }

    // POST - Portföyü Güncelle
    if (req.method === 'POST') {
      const { userId, portfolio } = req.body;

      // Önce mevcut portföyü sil
      await sql`
        DELETE FROM portfolios WHERE user_id = ${userId}
      `;

      // Yeni portföy öğelerini ekle
      if (portfolio && portfolio.length > 0) {
        for (const item of portfolio) {
          await sql`
            INSERT INTO portfolios (user_id, product_id, product_name, quantity, avg_buy_price, total_invested)
            VALUES (${userId}, ${item.productId}, ${item.productName}, ${item.quantity}, ${item.avgBuyPrice}, ${item.totalInvested})
          `;
        }
      }

      return res.status(200).json({ success: true });
    }
    
    return res.status(405).json({ success: false, message: 'Method not allowed' });
    
  } catch (error) {
    console.error('Portfolio API Error:', error);
    return res.status(500).json({ success: false, message: 'Sunucu hatası!', error: error.message });
  }
}
