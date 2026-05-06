import { pool } from './config';

const initDatabase = async () => {
  const client = await pool.connect();

  try {
    console.log('Creating tables...');

    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        category VARCHAR(100) NOT NULL,
        image_url VARCHAR(500),
        available BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        customer_name VARCHAR(255) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        total DECIMAL(10, 2) NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(id),
        product_name VARCHAR(255) NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price DECIMAL(10, 2) NOT NULL,
        subtotal DECIMAL(10, 2) NOT NULL
      );
    `);

    // Check if products table is empty
    const { rows } = await client.query('SELECT COUNT(*) FROM products');
    
    if (parseInt(rows[0].count) === 0) {
      console.log('Seeding products...');
      
      await client.query(`
        INSERT INTO products (name, description, price, category, image_url, available) VALUES
        ('X-Burger Clássico', 'Hambúrguer artesanal 180g, queijo cheddar, alface, tomate e molho especial', 28.90, 'Lanches', '/images/x-burger.jpg', true),
        ('X-Bacon', 'Hambúrguer 180g, bacon crocante, queijo, cebola caramelizada', 32.90, 'Lanches', '/images/x-bacon.jpg', true),
        ('X-Salada', 'Hambúrguer 150g, alface, tomate, cebola, picles e maionese', 24.90, 'Lanches', '/images/x-salada.jpg', true),
        ('Hot Dog Tradicional', 'Salsicha premium, molho, batata palha, milho e ervilha', 18.90, 'Lanches', '/images/hotdog.jpg', true),
        ('Batata Frita Grande', 'Porção generosa de batatas fritas crocantes', 19.90, 'Acompanhamentos', '/images/batata.jpg', true),
        ('Onion Rings', 'Anéis de cebola empanados e fritos', 22.90, 'Acompanhamentos', '/images/onion-rings.jpg', true),
        ('Refrigerante Lata', 'Coca-Cola, Guaraná ou Sprite 350ml', 6.90, 'Bebidas', '/images/refrigerante.jpg', true),
        ('Suco Natural', 'Laranja, limão ou maracujá 400ml', 9.90, 'Bebidas', '/images/suco.jpg', true),
        ('Milkshake', 'Chocolate, morango ou baunilha 500ml', 16.90, 'Bebidas', '/images/milkshake.jpg', true),
        ('Sundae', 'Sorvete de creme com calda de chocolate ou morango', 12.90, 'Sobremesas', '/images/sundae.jpg', true);
      `);
    }

    console.log('Database initialized successfully!');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

initDatabase();
