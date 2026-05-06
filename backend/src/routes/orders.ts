import { Router, Request, Response } from 'express';
import { pool } from '../db/config';
import { Order, OrderItem, CreateOrderRequest, Product } from '../types';

const router = Router();

// GET /api/orders - List all orders
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    
    let orderQuery = `
      SELECT * FROM orders 
      ORDER BY 
        CASE status 
          WHEN 'pending' THEN 1 
          WHEN 'preparing' THEN 2 
          WHEN 'ready' THEN 3 
          ELSE 4 
        END,
        created_at DESC
    `;
    const params: string[] = [];
    
    if (status && status !== 'all') {
      orderQuery = `
        SELECT * FROM orders 
        WHERE status = $1 
        ORDER BY created_at DESC
      `;
      params.push(status as string);
    }
    
    const ordersResult = await pool.query<Order>(orderQuery, params);
    
    // Get items for each order
    const orders = await Promise.all(
      ordersResult.rows.map(async (order) => {
        const itemsResult = await pool.query<OrderItem>(
          'SELECT * FROM order_items WHERE order_id = $1',
          [order.id]
        );
        return { ...order, items: itemsResult.rows };
      })
    );
    
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// GET /api/orders/:id - Get single order
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const orderResult = await pool.query<Order>(
      'SELECT * FROM orders WHERE id = $1',
      [id]
    );
    
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const itemsResult = await pool.query<OrderItem>(
      'SELECT * FROM order_items WHERE order_id = $1',
      [id]
    );
    
    res.json({ ...orderResult.rows[0], items: itemsResult.rows });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// POST /api/orders - Create order
router.post('/', async (req: Request, res: Response) => {
  const client = await pool.connect();
  
  try {
    const { customer_name, notes, items } = req.body as CreateOrderRequest;
    
    if (!customer_name || !items || items.length === 0) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    await client.query('BEGIN');
    
    // Calculate total and get product info
    let total = 0;
    const orderItems: { product: Product; quantity: number }[] = [];
    
    for (const item of items) {
      const productResult = await client.query<Product>(
        'SELECT * FROM products WHERE id = $1 AND available = true',
        [item.product_id]
      );
      
      if (productResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: `Product ${item.product_id} not found or unavailable` });
      }
      
      const product = productResult.rows[0];
      total += product.price * item.quantity;
      orderItems.push({ product, quantity: item.quantity });
    }
    
    // Create order
    const orderResult = await client.query<Order>(
      `INSERT INTO orders (customer_name, status, total, notes)
       VALUES ($1, 'pending', $2, $3)
       RETURNING *`,
      [customer_name, total, notes || null]
    );
    
    const order = orderResult.rows[0];
    
    // Create order items
    const insertedItems: OrderItem[] = [];
    for (const { product, quantity } of orderItems) {
      const subtotal = product.price * quantity;
      const itemResult = await client.query<OrderItem>(
        `INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, subtotal)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [order.id, product.id, product.name, quantity, product.price, subtotal]
      );
      insertedItems.push(itemResult.rows[0]);
    }
    
    await client.query('COMMIT');
    
    res.status(201).json({ ...order, items: insertedItems });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  } finally {
    client.release();
  }
});

// PATCH /api/orders/:id/status - Update order status
router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const validStatuses = ['pending', 'preparing', 'ready', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const result = await pool.query<Order>(
      `UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [status, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    // Get items
    const itemsResult = await pool.query<OrderItem>(
      'SELECT * FROM order_items WHERE order_id = $1',
      [id]
    );
    
    res.json({ ...result.rows[0], items: itemsResult.rows });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// DELETE /api/orders/:id - Delete order
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM orders WHERE id = $1 RETURNING id', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ error: 'Failed to delete order' });
  }
});

export default router;
