const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('../models/Product');
const User = require('../models/User');
const connectDatabase = require('../config/database');

dotenv.config({ path: '../.env' });

const MONGO_URI = process.env.MONGODB_URI_PROD || process.env.MONGODB_URI; // Use Atlas URI if available

// Sample organic grocery products
const groceryProducts = [
  {
    name: 'Organic Brown Rice 5kg',
    description: 'Premium quality organic brown rice, grown without pesticides. Rich in fiber and nutrients. Perfect for daily meals.',
    price: 450,
    originalPrice: 550,
    discount: 18,
    category: 'Grocery',
    subcategory: 'Rice & Grains',
    brand: 'Organic India',
    images: [
      { url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=400&fit=crop', alt: 'Organic Brown Rice' }
    ],
    stock: 150,
    rating: 4.6,
    numReviews: 234,
    specifications: {
      'Weight': '5 kg',
      'Type': 'Brown Rice',
      'Certification': 'USDA Organic',
      'Shelf Life': '12 months'
    },
    tags: ['organic', 'gluten-free', 'whole-grain', 'healthy'],
    isFeatured: true,
    isActive: true
  },
  {
    name: 'Fresh Organic Tomatoes 1kg',
    description: 'Farm-fresh organic tomatoes, handpicked daily. No chemicals or artificial ripening. Rich in vitamins and antioxidants.',
    price: 80,
    originalPrice: 100,
    discount: 20,
    category: 'Grocery',
    subcategory: 'Vegetables',
    brand: 'FreshFarm',
    images: [
      { url: 'https://images.unsplash.com/photo-1546470427-7fc6460e3a82?w=400&h=400&fit=crop', alt: 'Organic Tomatoes' }
    ],
    stock: 200,
    rating: 4.8,
    numReviews: 567,
    specifications: {
      'Weight': '1 kg',
      'Type': 'Fresh Vegetables',
      'Storage': 'Refrigerate',
      'Shelf Life': '7 days'
    },
    tags: ['organic', 'fresh', 'vegetables', 'farm-to-table'],
    isFeatured: true,
    isActive: true
  },
  {
    name: 'Organic Whole Wheat Flour 10kg',
    description: 'Stone-ground whole wheat flour from organic wheat. Perfect for chapatis, bread, and baking. High in fiber.',
    price: 650,
    originalPrice: 750,
    discount: 13,
    category: 'Grocery',
    subcategory: 'Flours & Grains',
    brand: 'Aashirvaad Organic',
    images: [
      { url: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&h=400&fit=crop', alt: 'Whole Wheat Flour' }
    ],
    stock: 120,
    rating: 4.7,
    numReviews: 892,
    specifications: {
      'Weight': '10 kg',
      'Type': 'Whole Wheat',
      'Certification': 'India Organic',
      'Shelf Life': '6 months'
    },
    tags: ['organic', 'whole-wheat', 'flour', 'baking'],
    isFeatured: true,
    isActive: true
  },
  {
    name: 'Organic Toor Dal 1kg',
    description: 'Premium quality organic toor dal (pigeon peas). Rich in protein and essential amino acids. Ideal for Indian cuisine.',
    price: 180,
    originalPrice: 220,
    discount: 18,
    category: 'Grocery',
    subcategory: 'Pulses & Lentils',
    brand: 'Organic Tattva',
    images: [
      { url: 'https://images.unsplash.com/photo-1599909533662-7900ebbb6cb8?w=400&h=400&fit=crop', alt: 'Organic Toor Dal' }
    ],
    stock: 180,
    rating: 4.5,
    numReviews: 445,
    specifications: {
      'Weight': '1 kg',
      'Type': 'Toor Dal',
      'Certification': 'USDA Organic',
      'Shelf Life': '12 months'
    },
    tags: ['organic', 'protein-rich', 'pulses', 'vegan'],
    isFeatured: false,
    isActive: true
  },
  {
    name: 'Organic Milk 1 Liter',
    description: 'Fresh organic full cream milk from grass-fed cows. No hormones or antibiotics. Rich and creamy taste.',
    price: 85,
    originalPrice: 95,
    discount: 11,
    category: 'Grocery',
    subcategory: 'Dairy',
    brand: 'Amul Organic',
    images: [
      { url: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&h=400&fit=crop', alt: 'Organic Milk' }
    ],
    stock: 300,
    rating: 4.9,
    numReviews: 1243,
    specifications: {
      'Volume': '1 Liter',
      'Type': 'Full Cream',
      'Storage': 'Refrigerate',
      'Shelf Life': '4 days'
    },
    tags: ['organic', 'dairy', 'fresh', 'calcium-rich'],
    isFeatured: true,
    isActive: true
  },
  {
    name: 'Organic Green Spinach 500g',
    description: 'Fresh organic spinach leaves, packed with iron and vitamins. Perfect for salads, smoothies, and cooking.',
    price: 40,
    originalPrice: 55,
    discount: 27,
    category: 'Grocery',
    subcategory: 'Vegetables',
    brand: 'FreshFarm',
    images: [
      { url: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400&h=400&fit=crop', alt: 'Organic Spinach' }
    ],
    stock: 150,
    rating: 4.6,
    numReviews: 334,
    specifications: {
      'Weight': '500 g',
      'Type': 'Leafy Greens',
      'Storage': 'Refrigerate',
      'Shelf Life': '5 days'
    },
    tags: ['organic', 'vegetables', 'iron-rich', 'healthy'],
    isFeatured: false,
    isActive: true
  },
  {
    name: 'Organic Honey 500g',
    description: 'Pure raw organic honey from Himalayan forests. Unprocessed and unpasteurized. Natural sweetness with health benefits.',
    price: 350,
    originalPrice: 450,
    discount: 22,
    category: 'Grocery',
    subcategory: 'Sweeteners',
    brand: 'Dabur Organic',
    images: [
      { url: 'https://images.unsplash.com/photo-1587049352846-4a222e784acc?w=400&h=400&fit=crop', alt: 'Organic Honey' }
    ],
    stock: 90,
    rating: 4.8,
    numReviews: 678,
    specifications: {
      'Weight': '500 g',
      'Type': 'Raw Honey',
      'Source': 'Himalayan',
      'Shelf Life': '24 months'
    },
    tags: ['organic', 'honey', 'natural', 'immunity-booster'],
    isFeatured: true,
    isActive: true
  },
  {
    name: 'Organic Chicken Eggs (12 pcs)',
    description: 'Farm-fresh organic eggs from free-range chickens. Rich in omega-3 and protein. No antibiotics or hormones.',
    price: 120,
    originalPrice: 140,
    discount: 14,
    category: 'Grocery',
    subcategory: 'Eggs & Meat',
    brand: 'Keggfarms Organic',
    images: [
      { url: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=400&h=400&fit=crop', alt: 'Organic Eggs' }
    ],
    stock: 250,
    rating: 4.7,
    numReviews: 892,
    specifications: {
      'Quantity': '12 pieces',
      'Type': 'Free Range',
      'Storage': 'Refrigerate',
      'Shelf Life': '21 days'
    },
    tags: ['organic', 'protein', 'eggs', 'farm-fresh'],
    isFeatured: false,
    isActive: true
  },
  {
    name: 'Organic Bananas 1 Dozen',
    description: 'Fresh organic bananas, naturally ripened. Rich in potassium and fiber. Perfect for snacks and smoothies.',
    price: 60,
    originalPrice: 75,
    discount: 20,
    category: 'Grocery',
    subcategory: 'Fruits',
    brand: 'FreshFarm',
    images: [
      { url: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400&h=400&fit=crop', alt: 'Organic Bananas' }
    ],
    stock: 180,
    rating: 4.5,
    numReviews: 456,
    specifications: {
      'Quantity': '12 pieces (1 dozen)',
      'Type': 'Fresh Fruits',
      'Storage': 'Room Temperature',
      'Shelf Life': '5 days'
    },
    tags: ['organic', 'fruits', 'potassium', 'healthy-snack'],
    isFeatured: false,
    isActive: true
  },
  {
    name: 'Organic Basmati Rice 5kg',
    description: 'Premium aged organic basmati rice with extra-long grains. Aromatic and fluffy when cooked. Perfect for biryani.',
    price: 850,
    originalPrice: 1000,
    discount: 15,
    category: 'Grocery',
    subcategory: 'Rice & Grains',
    brand: 'India Gate Organic',
    images: [
      { url: 'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=400&h=400&fit=crop', alt: 'Organic Basmati Rice' }
    ],
    stock: 100,
    rating: 4.9,
    numReviews: 1567,
    specifications: {
      'Weight': '5 kg',
      'Type': 'Basmati Rice',
      'Age': '1 Year Aged',
      'Shelf Life': '12 months'
    },
    tags: ['organic', 'basmati', 'premium', 'aromatic'],
    isFeatured: true,
    isActive: true
  },
  {
    name: 'Organic Green Tea 100g',
    description: 'Premium organic green tea leaves from Assam. Rich in antioxidants. Perfect for health-conscious tea lovers.',
    price: 250,
    originalPrice: 300,
    discount: 17,
    category: 'Grocery',
    subcategory: 'Beverages',
    brand: 'Organic India',
    images: [
      { url: 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=400&h=400&fit=crop', alt: 'Organic Green Tea' }
    ],
    stock: 200,
    rating: 4.7,
    numReviews: 789,
    specifications: {
      'Weight': '100 g',
      'Type': 'Green Tea',
      'Source': 'Assam',
      'Shelf Life': '18 months'
    },
    tags: ['organic', 'green-tea', 'antioxidant', 'healthy'],
    isFeatured: false,
    isActive: true
  },
  {
    name: 'Organic Carrots 1kg',
    description: 'Crunchy organic carrots, fresh from the farm. Rich in beta-carotene and vitamins. Great for salads and cooking.',
    price: 70,
    originalPrice: 90,
    discount: 22,
    category: 'Grocery',
    subcategory: 'Vegetables',
    brand: 'FreshFarm',
    images: [
      { url: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400&h=400&fit=crop', alt: 'Organic Carrots' }
    ],
    stock: 160,
    rating: 4.6,
    numReviews: 543,
    specifications: {
      'Weight': '1 kg',
      'Type': 'Root Vegetables',
      'Storage': 'Refrigerate',
      'Shelf Life': '10 days'
    },
    tags: ['organic', 'vegetables', 'vitamin-a', 'fresh'],
    isFeatured: false,
    isActive: true
  }
];

// Sample admin user
const adminUser = {
  name: 'Admin User',
  email: 'admin@shopease.com',
  password: 'admin123',
  phone: '9876543210',
  role: 'admin'
};

// Seed function
const seedDatabase = async () => {
  try {
    await connectDatabase();

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await Product.deleteMany();
    await User.deleteMany();

    // Create admin user
    console.log('👤 Creating admin user...');
    const admin = await User.create(adminUser);
    console.log(`✅ Admin created: ${admin.email} / password: admin123`);

    // Add createdBy to all products
    const productsWithAdmin = groceryProducts.map(product => ({
      ...product,
      createdBy: admin._id
    }));

    // Insert products
    console.log('📦 Seeding products...');
    const createdProducts = await Product.insertMany(productsWithAdmin);
    console.log(`✅ ${createdProducts.length} products created successfully!`);

    console.log('🎉 Database seeded successfully!');
    console.log('📊 Summary:');
    console.log(`   • Admin User: ${admin.email}`);
    console.log(`   • Password: admin123`);
    console.log(`   • Products: ${createdProducts.length}`);
    console.log(`   • Categories: Grocery`);
    console.log(`   • Subcategories: Rice & Grains, Vegetables, Fruits, Dairy, Pulses, etc.`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

// Run seeder
seedDatabase();