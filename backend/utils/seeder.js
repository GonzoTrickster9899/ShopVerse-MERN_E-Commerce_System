const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const connectDB = require('../config/db');

const seedDatabase = async () => {
  try {
    await connectDB();
    console.log('Starting database seed...');

    await Promise.all([User.deleteMany(), Category.deleteMany(), Product.deleteMany(), Coupon.deleteMany()]);

    const admin = await User.create({
      firstName: 'Admin', lastName: 'User', email: 'admin@shopverse.com',
      password: 'admin123456', phone: '+639171234567', role: 'admin', isEmailVerified: true,
    });

    await User.create({
      firstName: 'Juan', lastName: 'Dela Cruz', email: 'juan@test.com',
      password: 'test123456', phone: '+639181234567', role: 'user', isEmailVerified: true,
      addresses: [{
        label: 'Home', fullName: 'Juan Dela Cruz', phone: '+639181234567',
        street: '123 Rizal Street', city: 'Quezon City', state: 'Metro Manila',
        zipCode: '1100', country: 'Philippines', isDefault: true,
      }],
    });

    const cats = await Category.create([
      { name: 'Electronics', description: 'Gadgets and devices', sortOrder: 1 },
      { name: 'Fashion', description: 'Clothing and accessories', sortOrder: 2 },
      { name: 'Home & Living', description: 'Furniture and decor', sortOrder: 3 },
      { name: 'Sports', description: 'Athletic gear', sortOrder: 4 },
      { name: 'Beauty', description: 'Skincare and makeup', sortOrder: 5 },
      { name: 'Books', description: 'Books and media', sortOrder: 6 },
    ]);

    const subcats = await Category.create([
      { name: 'Smartphones', parent: cats[0]._id, level: 1 },
      { name: 'Laptops', parent: cats[0]._id, level: 1 },
      { name: 'Audio', parent: cats[0]._id, level: 1 },
      { name: "Men's Wear", parent: cats[1]._id, level: 1 },
      { name: "Women's Wear", parent: cats[1]._id, level: 1 },
    ]);

    const products = [
      { name: 'iPhone 15 Pro Max 256GB', description: 'The most advanced iPhone with titanium design, A17 Pro chip, and 48MP camera system.', shortDescription: 'Titanium design with A17 Pro chip', price: 74990, compareAtPrice: 79990, category: subcats[0]._id, brand: 'Apple', tags: ['smartphone','apple','5g'], specifications: [{ key: 'Display', value: '6.7" OLED' },{ key: 'Chip', value: 'A17 Pro' },{ key: 'Storage', value: '256GB' },{ key: 'Camera', value: '48MP' }], stock: 90, images: [{ url: 'https://placehold.co/600x600/1a1a2e/e94560?text=iPhone+15+Pro', isPrimary: true }], seller: admin._id, isFeatured: true, ratings: 4.8, numReviews: 124, totalSold: 450 },
      { name: 'Samsung Galaxy S24 Ultra', description: 'Galaxy S24 Ultra with titanium exterior and 200MP camera. AI-powered flagship.', shortDescription: 'AI-powered Galaxy flagship', price: 69990, compareAtPrice: 74990, category: subcats[0]._id, brand: 'Samsung', tags: ['smartphone','samsung','5g'], specifications: [{ key: 'Display', value: '6.8" AMOLED' },{ key: 'Chip', value: 'Snapdragon 8 Gen 3' },{ key: 'Camera', value: '200MP' }], stock: 60, images: [{ url: 'https://placehold.co/600x600/1a1a2e/53d8fb?text=Galaxy+S24', isPrimary: true }], seller: admin._id, isFeatured: true, ratings: 4.7, numReviews: 89, totalSold: 320 },
      { name: 'MacBook Pro 14" M3 Pro', description: 'Supercharged by M3 Pro chip with exceptional performance and stunning Liquid Retina XDR display.', shortDescription: 'M3 Pro, 18GB RAM, 512GB SSD', price: 109990, compareAtPrice: 119990, category: subcats[1]._id, brand: 'Apple', tags: ['laptop','apple','professional'], specifications: [{ key: 'Display', value: '14.2" Retina XDR' },{ key: 'Chip', value: 'M3 Pro' },{ key: 'RAM', value: '18GB' },{ key: 'Storage', value: '512GB SSD' }], stock: 35, images: [{ url: 'https://placehold.co/600x600/16213e/e94560?text=MacBook+Pro', isPrimary: true }], seller: admin._id, isFeatured: true, ratings: 4.9, numReviews: 67, totalSold: 180 },
      { name: 'Sony WH-1000XM5 Headphones', description: 'Industry-leading noise canceling with Auto NC Optimizer. Exceptional sound quality and 30-hour battery.', shortDescription: 'Premium noise canceling headphones', price: 19990, compareAtPrice: 22990, category: subcats[2]._id, brand: 'Sony', tags: ['audio','headphones','wireless'], specifications: [{ key: 'Type', value: 'Over-ear' },{ key: 'ANC', value: 'Yes' },{ key: 'Battery', value: '30 hours' }], stock: 120, images: [{ url: 'https://placehold.co/600x600/0f3460/e94560?text=Sony+XM5', isPrimary: true }], seller: admin._id, isFeatured: true, ratings: 4.6, numReviews: 203, totalSold: 890 },
      { name: 'ASUS ROG Zephyrus G14', description: 'Ultra-slim gaming laptop with AMD Ryzen 9, RTX 4060, and 165Hz display.', shortDescription: 'Slim gaming powerhouse', price: 89990, category: subcats[1]._id, brand: 'ASUS', tags: ['laptop','gaming','rog'], specifications: [{ key: 'Display', value: '14" 165Hz' },{ key: 'CPU', value: 'Ryzen 9 7940HS' },{ key: 'GPU', value: 'RTX 4060' },{ key: 'RAM', value: '16GB' }], stock: 25, images: [{ url: 'https://placehold.co/600x600/1a1a2e/00ff88?text=ROG+G14', isPrimary: true }], seller: admin._id, ratings: 4.5, numReviews: 45, totalSold: 120 },
      { name: 'AirPods Pro 2nd Gen', description: 'Rebuilt from the ground up with H2 chip. 2x more active noise cancellation.', shortDescription: 'H2 chip with adaptive audio', price: 14990, compareAtPrice: 16990, category: subcats[2]._id, brand: 'Apple', tags: ['audio','earbuds','wireless','apple'], specifications: [{ key: 'Type', value: 'In-ear' },{ key: 'ANC', value: 'Adaptive' },{ key: 'Battery', value: '6 hours' }], stock: 200, images: [{ url: 'https://placehold.co/600x600/1a1a2e/ffffff?text=AirPods+Pro', isPrimary: true }], seller: admin._id, isFeatured: true, ratings: 4.7, numReviews: 312, totalSold: 1200 },
      { name: 'Google Pixel 8 Pro', description: 'The best of Google with Tensor G3, advanced AI features, and pro-level camera.', shortDescription: 'AI-first smartphone', price: 54990, category: subcats[0]._id, brand: 'Google', tags: ['smartphone','google','ai','5g'], specifications: [{ key: 'Display', value: '6.7" LTPO OLED' },{ key: 'Chip', value: 'Tensor G3' },{ key: 'Camera', value: '50MP' }], stock: 45, images: [{ url: 'https://placehold.co/600x600/16213e/53d8fb?text=Pixel+8+Pro', isPrimary: true }], seller: admin._id, ratings: 4.4, numReviews: 56, totalSold: 150 },
      { name: 'iPad Air M2', description: 'Powerful M2 chip in a thin, light, and versatile design. Perfect for work and play.', shortDescription: 'M2 chip in a versatile design', price: 39990, compareAtPrice: 44990, category: cats[0]._id, brand: 'Apple', tags: ['tablet','apple','ipad'], specifications: [{ key: 'Display', value: '11" Liquid Retina' },{ key: 'Chip', value: 'M2' },{ key: 'Storage', value: '128GB' }], stock: 55, images: [{ url: 'https://placehold.co/600x600/0f3460/ffffff?text=iPad+Air', isPrimary: true }], seller: admin._id, isFeatured: true, ratings: 4.6, numReviews: 78, totalSold: 250 },
      { name: 'Classic Oxford Shirt - White', description: 'Premium cotton Oxford shirt with button-down collar. Timeless style for any occasion.', shortDescription: 'Premium cotton button-down', price: 1990, compareAtPrice: 2490, category: subcats[3]._id, brand: 'Uniqlo', tags: ['shirt','formal','cotton'], specifications: [{ key: 'Material', value: '100% Cotton' },{ key: 'Fit', value: 'Regular' },{ key: 'Care', value: 'Machine Wash' }], variants: [{ name: 'Size', options: [{ label: 'S', value: 's', stock: 30 },{ label: 'M', value: 'm', stock: 40 },{ label: 'L', value: 'l', stock: 35 },{ label: 'XL', value: 'xl', stock: 20 }] }], stock: 125, images: [{ url: 'https://placehold.co/600x600/ffffff/1a1a2e?text=Oxford+Shirt', isPrimary: true }], seller: admin._id, ratings: 4.3, numReviews: 89, totalSold: 560 },
      { name: 'Running Shoes - Ultra Boost', description: 'Responsive Boost midsole with Primeknit upper for cloud-like comfort on every run.', shortDescription: 'Cloud-like running comfort', price: 8990, compareAtPrice: 9990, category: cats[3]._id, brand: 'Adidas', tags: ['shoes','running','sports'], specifications: [{ key: 'Upper', value: 'Primeknit' },{ key: 'Midsole', value: 'Boost' },{ key: 'Drop', value: '10mm' }], stock: 80, images: [{ url: 'https://placehold.co/600x600/1a1a2e/ff6b6b?text=Ultra+Boost', isPrimary: true }], seller: admin._id, isFeatured: true, ratings: 4.5, numReviews: 167, totalSold: 720 },
      { name: 'Minimalist Desk Lamp', description: 'LED desk lamp with adjustable brightness and color temperature. USB charging port included.', shortDescription: 'Adjustable LED with USB port', price: 2490, category: cats[2]._id, brand: 'Xiaomi', tags: ['lamp','desk','led','home'], specifications: [{ key: 'Light', value: 'LED' },{ key: 'Brightness', value: '3 levels' },{ key: 'Power', value: 'USB-C' }], stock: 150, images: [{ url: 'https://placehold.co/600x600/f8f9fa/1a1a2e?text=Desk+Lamp', isPrimary: true }], seller: admin._id, ratings: 4.2, numReviews: 34, totalSold: 280 },
      { name: 'Vitamin C Serum 30ml', description: 'Brightening vitamin C serum with hyaluronic acid. Reduces dark spots and evens skin tone.', shortDescription: 'Brightening serum with HA', price: 890, compareAtPrice: 1290, category: cats[4]._id, brand: 'The Ordinary', tags: ['skincare','serum','vitamin-c'], specifications: [{ key: 'Volume', value: '30ml' },{ key: 'Key Ingredient', value: 'Vitamin C 15%' },{ key: 'Skin Type', value: 'All' }], stock: 300, images: [{ url: 'https://placehold.co/600x600/fff5f5/e94560?text=Vitamin+C', isPrimary: true }], seller: admin._id, ratings: 4.4, numReviews: 256, totalSold: 1500 },
    ];

    await Product.create(products);
    console.log(`${products.length} products created`);

    // Create coupons
    await Coupon.create([
      { code: 'WELCOME10', description: '10% off your first order', type: 'percentage', value: 10, maxDiscount: 500, minOrderAmount: 1000, perUserLimit: 1, startDate: new Date(), endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), isActive: true },
      { code: 'SAVE500', description: '₱500 off orders over ₱5000', type: 'fixed', value: 500, minOrderAmount: 5000, perUserLimit: 3, startDate: new Date(), endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), isActive: true },
      { code: 'FREESHIP', description: 'Free shipping on orders over ₱2000', type: 'fixed', value: 100, minOrderAmount: 2000, usageLimit: 1000, startDate: new Date(), endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), isActive: true },
    ]);
    console.log('3 coupons created');

    console.log('\n✅ Database seeded successfully!');
    console.log('Admin: admin@shopverse.com / admin123456');
    console.log('User:  juan@test.com / test123456');
    console.log('Coupons: WELCOME10, SAVE500, FREESHIP\n');

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedDatabase();
