import { Router, Request, Response } from 'express';
import { pool } from '../db/config';
import { Product } from '../types';

const router = Router();

// GET /api/products - List all products
router.get('/', async (req: Request, res: Response) => {
  try {
    const { category } = req.query;
    
    let query = 'SELECT * FROM products ORDER BY category, name';
    const params: string[] = [];
    
    if (category && category !== 'Todos') {
      query = 'SELECT * FROM products WHERE category = $1 ORDER BY name';
      params.push(category as string);
    }
    
    const result = await pool.query<Product>(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// GET /api/products/:id - Get single product
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query<Product>(
      'SELECT * FROM products WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// POST /api/products - Create product
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, description, price, category, image_url, available } = req.body;
    
    const result = await pool.query<Product>(
      `INSERT INTO products (name, description, price, category, image_url, available)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, description, price, category, image_url, available ?? true]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// PATCH /api/products/:id - Update product
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, price, category, image_url, available } = req.body;
    
    const result = await pool.query<Product>(
      `UPDATE products SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        price = COALESCE($3, price),
        category = COALESCE($4, category),
        image_url = COALESCE($5, image_url),
        available = COALESCE($6, available)
       WHERE id = $7
       RETURNING *`,
      [name, description, price, category, image_url, available, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// DELETE /api/products/:id - Delete product
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING id', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

export default router;
