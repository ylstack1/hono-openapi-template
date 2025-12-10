-- Insert sample users
INSERT OR IGNORE INTO users (id, name, email, phone_number, password_hash, role, email_verified, phone_verified)
VALUES 
  ('user1', 'John Merchant', 'john@example.com', '+1234567890', 'hashed_password_1', 'merchant', 1, 1),
  ('user2', 'Jane Admin', 'jane@example.com', '+0987654321', 'hashed_password_2', 'admin', 1, 1),
  ('user3', 'Bob Customer', 'bob@example.com', '+1122334455', 'hashed_password_3', 'customer', 1, 1);

-- Insert sample stores
INSERT OR IGNORE INTO stores (id, name, owner_id, description, logo, status)
VALUES 
  ('store1', 'John''s Electronics', 'user1', 'Electronics and gadgets', 'https://example.com/logo.png', 'active'),
  ('store2', 'Premium Shop', 'user1', 'Premium products', 'https://example.com/logo2.png', 'active');

-- Insert sample products
INSERT OR IGNORE INTO products (id, store_id, name, description, price, currency, inventory, status)
VALUES 
  ('prod1', 'store1', 'Laptop', 'High-performance laptop', 999.99, 'USD', 5, 'active'),
  ('prod2', 'store1', 'Mouse', 'Wireless mouse', 29.99, 'USD', 50, 'active'),
  ('prod3', 'store2', 'Premium Keyboard', 'Mechanical keyboard', 149.99, 'USD', 20, 'active');
