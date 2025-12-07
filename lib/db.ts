// lib/db.ts
import { Pool } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: true,
});

export { pool };

// Test the connection
export async function testConnection() {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('Database connected successfully:', result.rows[0]);
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

// User management functions
export async function createUser(email: string, password: string, username?: string, role?: string) {
  const hashedPassword = await bcrypt.hash(password, 10);
  const result = await pool.query(
    'INSERT INTO users (email, password, username, role) VALUES ($1, $2, $3, $4) RETURNING *',
    [email, hashedPassword, username || '', role || 'member']
  );
  return result.rows[0];
}

export async function updateUserRole(userId: string, role: string) {
  try {
    const result = await pool.query(
      'UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [role, userId]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Role update failed:', error);
    return null;
  }
}

export async function getAllUsers() {
  try {
    const result = await pool.query(
      'SELECT id, email, role, wallet_address, created_at FROM users ORDER BY created_at DESC'
    );
    return result.rows;
  } catch (error) {
    console.error('Users fetch failed:', error);
    return [];
  }
}

export async function isUserAdmin(userId: string) {
  try {
    const result = await pool.query(
      'SELECT role FROM users WHERE id = $1',
      [userId]
    );
    
    return result.rows[0]?.role === 'admin';
  } catch (error) {
    console.error('Admin check failed:', error);
    return false;
  }
}

export async function getUserByEmail(email: string) {
  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('User lookup failed:', error);
    return null;
  }
}

export async function getUserById(id: string) {
  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('User lookup failed:', error);
    return null;
  }
}

// Session management functions
export async function createSession(userId: string) {
  try {
    const sessionToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await pool.query(
      `INSERT INTO sessions (user_id, session_token, expires_at, created_at)
       VALUES ($1, $2, $3, NOW())`,
      [userId, sessionToken, expiresAt]
    );

    return sessionToken;
  } catch (error) {
    console.error('Session creation failed:', error);
    throw new Error('Failed to create session');
  }
}

export async function validateSession(sessionToken: string) {
  try {
    const result = await pool.query(
      `SELECT s.*, u.* FROM sessions s
       JOIN users u ON s.user_id = u.id
       WHERE s.session_token = $1 AND s.expires_at > NOW()`,
      [sessionToken]
    );

    return result.rows[0] || null;
  } catch (error) {
    console.error('Session validation failed:', error);
    return null;
  }
}

export async function destroySession(sessionToken: string) {
  try {
    await pool.query(
      'DELETE FROM sessions WHERE session_token = $1',
      [sessionToken]
    );
  } catch (error) {
    console.error('Session destruction failed:', error);
  }
}

// Conspiracy template functions
export async function getConspiracyTemplate(slug: string) {
  try {
    const result = await pool.query(
      'SELECT * FROM conspiracy_templates WHERE slug = $1 AND is_active = true',
      [slug]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error fetching conspiracy template:', error);
    return null;
  }
}

export async function getAllConspiracyTemplates() {
  try {
    const result = await pool.query(
      'SELECT * FROM conspiracy_templates WHERE is_active = true ORDER BY created_at DESC'
    );
    return result.rows;
  } catch (error) {
    console.error('Error fetching conspiracy templates:', error);
    return [];
  }
}

export async function insertConspiracyTemplate(data: any) {
  console.log('Inserting template:', data);  // Add logging
  const result = await pool.query(
    'INSERT INTO conspiracy_templates (title, slug, category, status, key_facts, debunking_points, sources, difficulty_level, is_active, content_type, article_content, prompt_template) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *',
    [data.title, data.slug, data.category, data.status, data.key_facts, data.debunking_points, data.sources, data.difficulty_level, data.is_active, data.content_type, data.article_content, data.prompt_template || 'Default prompt']
  );
  console.log('Insert result:', result.rows[0]);  // Add logging
  return result.rows[0];
}

export async function updateConspiracyTemplate(id: string, data: any) {
  const result = await pool.query(
    `UPDATE conspiracy_templates 
     SET title = $1, slug = $2, category = $3, status = $4, prompt_template = $5, article_content = $6, 
     key_facts = $7, debunking_points = $8, sources = $9, difficulty_level = $10, is_active = $11, content_type = $12
 WHERE id = $13
 
     RETURNING *`,
    [
      data.title,
      data.slug,
      data.category,
      data.status,
      data.prompt_template,
      data.article_content,
      data.key_facts,
      data.debunking_points,
      data.sources,
      data.difficulty_level,
      data.is_active,
      data.content_type,
      id,
    ]
  );
  return result.rows[0];
}

export async function deleteConspiracyTemplate(id: string) {
  await pool.query('DELETE FROM conspiracy_templates WHERE id = $1', [id]);
}

// Enlightenment Templates
export async function getAllEnlightenmentTemplates() {
  const result = await pool.query(
    `SELECT id, slug, title, description, category, status, is_active, difficulty_level, created_at
     FROM enlightenment_templates 
     WHERE is_active = true 
     ORDER BY title ASC`
  );
  return result.rows;
}

export async function getEnlightenmentTemplate(slug: string) {
  const result = await pool.query(
    `SELECT * FROM enlightenment_templates WHERE slug = $1`,
    [slug]
  );
  return result.rows[0];
}

export async function getEnlightenmentTemplateById(id: string) {
  const result = await pool.query(
    `SELECT * FROM enlightenment_templates WHERE id = $1`,
    [id]
  );
  return result.rows[0];
}

export async function createEnlightenmentTemplate(data: {
  title: string;
  slug: string;
  description?: string;
  category?: string;
  status?: string;
  key_teachings?: string[];
  spiritual_practices?: string[];
  sources?: string[];
  difficulty_level?: string;
  is_active?: boolean;
  content_type?: string;
  article_content?: string;
}) {
  const result = await pool.query(
    `INSERT INTO enlightenment_templates 
      (title, slug, description, category, status, key_teachings, spiritual_practices, 
       sources, difficulty_level, is_active, content_type, article_content)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     RETURNING *`,
    [
      data.title,
      data.slug,
      data.description || '',
      data.category || '',
      data.status || 'Draft',
      data.key_teachings || [],
      data.spiritual_practices || [],
      data.sources || [],
      data.difficulty_level || 'beginner',
      data.is_active ?? true,
      data.content_type || 'ai',
      data.article_content || '',
    ]
  );
  return result.rows[0];
}

export async function updateEnlightenmentTemplate(id: string, data: Partial<{
  title: string;
  slug: string;
  description: string;
  category: string;
  status: string;
  key_teachings: string[];
  spiritual_practices: string[];
  sources: string[];
  difficulty_level: string;
  is_active: boolean;
  content_type: string;
  article_content: string;
}>) {
  const fields: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) {
      fields.push(`${key} = $${paramCount}`);
      values.push(value);
      paramCount++;
    }
  });

  if (fields.length === 0) return null;

  fields.push(`updated_at = NOW()`);
  values.push(id);

  const result = await pool.query(
    `UPDATE enlightenment_templates 
     SET ${fields.join(', ')}
     WHERE id = $${paramCount}
     RETURNING *`,
    values
  );
  return result.rows[0];
}

export async function deleteEnlightenmentTemplate(id: string) {
  const result = await pool.query(
    `DELETE FROM enlightenment_templates WHERE id = $1 RETURNING id`,
    [id]
  );
  return result.rowCount !== null && result.rowCount > 0;
}

// Generated content functions
export async function saveGeneratedContent(templateId: string, content: string, debunking: string, sources: string[]) {
  try {
    const result = await pool.query(
      `INSERT INTO generated_content (template_id, content, debunking_content, sources, expires_at)
       VALUES ($1, $2, $3, $4, NOW() + INTERVAL '24 hours')
       RETURNING *`,
      [templateId, content, debunking, sources]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error saving generated content:', error);
    return null;
  }
}

export async function getCachedContent(templateId: string) {
  try {
    const result = await pool.query(
      'SELECT * FROM generated_content WHERE template_id = $1 AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
      [templateId]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error fetching cached content:', error);
    return null;
  }
}

export async function incrementViewCount(templateId: string) {
  try {
    await pool.query(
      'UPDATE conspiracy_templates SET view_count = view_count + 1 WHERE id = $1',
      [templateId]
    );
  } catch (error) {
    console.error('Error updating view count:', error);
  }
}

// Product functions
export async function getAllProducts() {
  try {
    const result = await pool.query(
      'SELECT * FROM products WHERE is_active = true ORDER BY created_at DESC'
    );
    return result.rows;
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

export async function getProductBySlug(slug: string) {
  try {
    const result = await pool.query(
      'SELECT * FROM products WHERE slug = $1 AND is_active = true',
      [slug]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
}
export async function insertProduct(data: any) {
  const result = await pool.query(
    'INSERT INTO products (title, slug, description, image, status, category) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
    [data.title, data.slug, data.description, data.image, data.status, data.category]
  );
  return result.rows[0];
}

export async function getProducts() {
  const result = await pool.query('SELECT * FROM products ORDER BY created_at DESC');
  console.log('DB result:', result.rows);  
  return result.rows;
}

export async function updateProduct(id: string, data: any) {
  const result = await pool.query(
    'UPDATE articles SET title = $1, slug = $2, content = $3, pre_summary = $4, post_summary = $5, status = $6, category = $7 WHERE id = $8 RETURNING *',
    [data.title, data.slug, data.content, data.pre_summary, data.post_summary, data.status, data.category, id]
  );
  return result.rows[0];
}

export async function deleteProduct(id: string) {
  await pool.query('DELETE FROM articles WHERE id = $1', [id]);
}

export async function getProduct(slug: string) {
  const result = await pool.query('SELECT * FROM products WHERE slug = $1', [slug]);
  return result.rows[0];
}

// Article functions
export async function getAllArticles() {
  try {
    const result = await pool.query(
      'SELECT * FROM articles WHERE status = $1 ORDER BY published_at DESC',
      ['published']
    );
    return result.rows;
  } catch (error) {
    console.error('Error fetching articles:', error);
    return [];
  }
}

export async function getArticleBySlug(slug: string) {
  try {
    const result = await pool.query(
      'SELECT * FROM articles WHERE slug = $1 AND status = $2',
      [slug, 'published']
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error fetching article:', error);
    return null;
  }
}

export async function insertArticle(data: any) {
  const result = await pool.query(
    'INSERT INTO articles (title, slug, content, pre_summary, post_summary, status, category) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
    [data.title, data.slug, data.content, data.pre_summary, data.post_summary, data.status, data.category]
  );
  return result.rows[0];
}

export async function getArticles() {
  const result = await pool.query('SELECT * FROM articles ORDER BY created_at DESC');
  console.log('DB result:', result.rows);  // Add logging
  return result.rows;
}

export async function updateArticle(id: string, data: any) {
  const result = await pool.query(
    'UPDATE articles SET title = $1, slug = $2, content = $3, pre_summary = $4, post_summary = $5, status = $6, category = $7 WHERE id = $8 RETURNING *',
    [data.title, data.slug, data.content, data.pre_summary, data.post_summary, data.status, data.category, id]
  );
  return result.rows[0];
}

export async function deleteArticle(id: string) {
  await pool.query('DELETE FROM articles WHERE id = $1', [id]);
}

export async function getArticle(slug: string) {
  const result = await pool.query('SELECT * FROM articles WHERE slug = $1', [slug]);
  return result.rows[0];
}