// api/portfolio/index.js
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
      const userId = req.query.userId;
      
      if (!userId) {
        return res.status(400).json({ 
          success: false, 
          message: 'UserId parametresi gerekli!' 
        });
      }
      
      const result = await sql`
        SELECT * FROM portfolios WHERE user_id = ${userId}
      `;
      
      // Convert database fields to camelCase for frontend
      const portfolio = result.map(item => ({
        id: item.id,
        userId: item.user_id,
        productId: item.product_id,
        productName: item.product_name,
        quantity: parseInt(item.quantity),
        avgBuyPrice: parseFloat(item.avg_buy_price),
        totalInvested: parseFloat(item.total_invested),
        createdAt: item.created_at,
        updatedAt: item.updated_at
      }));
      
      return res.status(200).json(portfolio);
    }
    
    // POST - Portföyü Güncelle
    if (req.method === 'POST') {
      const { userId, portfolio } = req.body || {};
      
      if (!userId) {
        return res.status(400).json({ 
          success: false, 
          message: 'UserId gerekli!' 
        });
      }
      
      // Önce mevcut portföyü sil
      await sql`
        DELETE FROM portfolios WHERE user_id = ${userId}
      `;
      
      // Yeni portföy öğelerini ekle
      if (portfolio && Array.isArray(portfolio) && portfolio.length > 0) {
        for (const item of portfolio) {
          if (!item.productId || !item.productName || !item.quantity || !item.avgBuyPrice || !item.totalInvested) {
            console.warn('Skipping invalid portfolio item:', item);
            continue;
          }
          
          await sql`
            INSERT INTO portfolios (user_id, product_id, product_name, quantity, avg_buy_price, total_invested)
            VALUES (
              ${userId}, 
              ${item.productId}, 
              ${item.productName}, 
              ${item.quantity}, 
              ${item.avgBuyPrice}, 
              ${item.totalInvested}
            )
          `;
        }
      }
      
      return res.status(200).json({ success: true, message: 'Portföy güncellendi!' });
    }
    
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed. Use GET or POST.' 
    });
    
  } catch (error) {
    console.error('Portfolio API Error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Sunucu hatası!', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
