const path = require('path');
const dotenv = require('dotenv');
const Product = require('../models/Product');
const Category = require('../models/Category');
const User = require('../models/User');
const connectDatabase = require('../config/database');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const adminUser = {
  name: process.env.ADMIN_NAME || 'Admin User',
  email: process.env.ADMIN_EMAIL || 'admin@shopease.com',
  password: process.env.ADMIN_PASSWORD || 'admin123',
  phone: process.env.ADMIN_PHONE || '9876543210',
  role: 'admin',
  isEmailVerified: true
};

const categorySeed = [
  { name: 'Rice & Grains', description: 'Daily staples and premium grains.' },
  { name: 'Vegetables', description: 'Farm fresh vegetables.' },
  { name: 'Fruits', description: 'Fresh and seasonal fruits.' },
  { name: 'Dairy', description: 'Milk and dairy essentials.' },
  { name: 'Pulses & Lentils', description: 'Protein-rich pulses and lentils.' },
  { name: 'Beverages', description: 'Healthy beverages and tea.' },
  { name: 'Organic Vegetables', description: 'Certified organic fresh vegetables.' },
  { name: 'Organic Fruits', description: 'Certified organic seasonal fruits.' },
  { name: 'Organic Dairy', description: 'Organic milk and dairy items.' },
  { name: 'Organic Staples', description: 'Organic staples for daily cooking.' },
  { name: 'Organic Breakfast', description: 'Healthy organic breakfast items.' },
  { name: 'Organic Superfoods', description: 'Nutrient-dense organic superfoods.' }
];

const imagePool = {
  'Rice & Grains': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=400&fit=crop',
  'Vegetables': 'https://images.unsplash.com/photo-1546470427-7fc6460e3a82?w=400&h=400&fit=crop',
  'Fruits': 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400&h=400&fit=crop',
  'Dairy': 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&h=400&fit=crop',
  'Pulses & Lentils': 'https://images.unsplash.com/photo-1599909533662-7900ebbb6cb8?w=400&h=400&fit=crop',
  'Beverages': 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=400&h=400&fit=crop',
  'Organic Vegetables': 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=400&h=400&fit=crop',
  'Organic Fruits': 'https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=400&h=400&fit=crop',
  'Organic Dairy': 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&h=400&fit=crop',
  'Organic Staples': 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&h=400&fit=crop',
  'Organic Breakfast': 'https://images.unsplash.com/photo-1517673400267-0251440c45dc?w=400&h=400&fit=crop',
  'Organic Superfoods': 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=400&h=400&fit=crop'
};

const productNamesByCategory = {
  'Rice & Grains': ['Basmati Rice 5kg', 'Brown Rice 5kg', 'Sona Masoori Rice 5kg', 'Poha Thick 1kg', 'Quinoa Grain 1kg', 'Ragi Flour 1kg', 'Jowar Flour 1kg', 'Bajra Flour 1kg', 'Semolina Suji 1kg', 'Flattened Rice Premium 1kg'],
  'Vegetables': ['Tomato 1kg', 'Potato 2kg', 'Onion 2kg', 'Carrot 1kg', 'Cucumber 1kg', 'Capsicum 500g', 'Spinach 500g', 'Beetroot 1kg', 'Cauliflower 1pc', 'Green Beans 500g'],
  'Fruits': ['Banana 12pc', 'Apple 1kg', 'Orange 1kg', 'Pomegranate 1kg', 'Papaya 1pc', 'Guava 1kg', 'Watermelon 1pc', 'Mango 1kg', 'Grapes 500g', 'Pineapple 1pc'],
  'Dairy': ['Full Cream Milk 1L', 'Toned Milk 1L', 'Curd 500g', 'Paneer 200g', 'Butter 100g', 'Ghee 500ml', 'Cheese Cubes 200g', 'Greek Yogurt 400g', 'Buttermilk 1L', 'Fresh Cream 200ml'],
  'Pulses & Lentils': ['Toor Dal 1kg', 'Moong Dal 1kg', 'Masoor Dal 1kg', 'Chana Dal 1kg', 'Urad Dal 1kg', 'Rajma 1kg', 'Kabuli Chana 1kg', 'Black Chana 1kg', 'Green Moong 1kg', 'Mixed Dal 1kg'],
  'Beverages': ['Green Tea 100g', 'Assam Tea 500g', 'Instant Coffee 100g', 'Filter Coffee 250g', 'Coconut Water 1L', 'Lemon Juice 1L', 'Aloe Vera Juice 1L', 'Badam Milk 200ml', 'Herbal Tea 50g', 'Iced Tea 1L'],
  'Organic Vegetables': ['Organic Tomato 1kg', 'Organic Potato 2kg', 'Organic Carrot 1kg', 'Organic Cucumber 1kg', 'Organic Capsicum 500g', 'Organic Spinach 500g', 'Organic Beetroot 1kg', 'Organic Cauliflower 1pc', 'Organic Green Beans 500g', 'Organic Bottle Gourd 1pc'],
  'Organic Fruits': ['Organic Banana 12pc', 'Organic Apple 1kg', 'Organic Orange 1kg', 'Organic Pomegranate 1kg', 'Organic Papaya 1pc', 'Organic Guava 1kg', 'Organic Mango 1kg', 'Organic Grapes 500g', 'Organic Pineapple 1pc', 'Organic Dragon Fruit 2pc'],
  'Organic Dairy': ['Organic Full Cream Milk 1L', 'Organic Curd 500g', 'Organic Paneer 200g', 'Organic Butter 100g', 'Organic Ghee 500ml', 'Organic Cheese 200g', 'Organic Greek Yogurt 400g', 'Organic Buttermilk 1L', 'Organic Fresh Cream 200ml', 'Organic Cow Milk 1L'],
  'Organic Staples': ['Organic Basmati Rice 5kg', 'Organic Brown Rice 5kg', 'Organic Wheat Flour 5kg', 'Organic Besan 1kg', 'Organic Ragi Flour 1kg', 'Organic Jowar Flour 1kg', 'Organic Bajra Flour 1kg', 'Organic Quinoa 1kg', 'Organic Poha 1kg', 'Organic Suji 1kg'],
  'Organic Breakfast': ['Organic Oats 1kg', 'Organic Muesli 500g', 'Organic Corn Flakes 500g', 'Organic Peanut Butter 340g', 'Organic Honey 500g', 'Organic Chia Mix 250g', 'Organic Granola 400g', 'Organic Almond Spread 250g', 'Organic Millet Flakes 500g', 'Organic Breakfast Mix 500g'],
  'Organic Superfoods': ['Organic Chia Seeds 250g', 'Organic Flax Seeds 250g', 'Organic Pumpkin Seeds 250g', 'Organic Sunflower Seeds 250g', 'Organic Walnuts 250g', 'Organic Almonds 250g', 'Organic Cashews 250g', 'Organic Dates 500g', 'Organic Turmeric Powder 200g', 'Organic Moringa Powder 200g']
};

const basePriceByCategory = {
  'Rice & Grains': 120,
  'Vegetables': 45,
  'Fruits': 70,
  'Dairy': 65,
  'Pulses & Lentils': 110,
  'Beverages': 90,
  'Organic Vegetables': 80,
  'Organic Fruits': 120,
  'Organic Dairy': 110,
  'Organic Staples': 150,
  'Organic Breakfast': 180,
  'Organic Superfoods': 220
};

const ensureAdmin = async () => {
  let admin = await User.findOne({ email: adminUser.email });

  if (!admin) {
    admin = await User.create(adminUser);
    console.log(`Admin created: ${admin.email} / password: ${adminUser.password}`);
    return admin;
  }

  admin.name = adminUser.name;
  admin.phone = adminUser.phone;
  admin.role = 'admin';
  admin.isEmailVerified = true;
  admin.password = adminUser.password;
  await admin.save();

  console.log(`Admin updated: ${admin.email} / password reset to: ${adminUser.password}`);
  return admin;
};

const buildProducts = () => {
  const products = [];

  categorySeed.forEach((category, categoryIndex) => {
    const names = productNamesByCategory[category.name] || [];
    const basePrice = basePriceByCategory[category.name] || 100;

    names.forEach((name, itemIndex) => {
      const price = basePrice + categoryIndex * 12 + itemIndex * 7;
      const stock = 40 + ((categoryIndex + 1) * (itemIndex + 3)) % 180;

      products.push({
        name,
        description: `${name} from ${category.name}. Fresh quality, reliable sourcing, and daily-use value.`,
        price,
        stock,
        categoryName: category.name,
        images: [imagePool[category.name]],
        featured: itemIndex % 5 === 0,
        isActive: true
      });
    });
  });

  return products;
};

const seedDatabase = async () => {
  try {
    await connectDatabase();

    const admin = await ensureAdmin();

    console.log('Clearing existing products and categories...');
    await Product.deleteMany({});
    await Category.deleteMany({});

    console.log('Creating categories...');
    const createdCategories = await Category.insertMany(categorySeed);
    const categoryMap = createdCategories.reduce((acc, cat) => {
      acc[cat.name] = cat._id;
      return acc;
    }, {});

    const productSeed = buildProducts();

    console.log('Seeding products...');
    const productsToInsert = productSeed.map((product) => ({
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      category: categoryMap[product.categoryName],
      images: product.images,
      featured: product.featured,
      isActive: product.isActive,
      createdBy: admin._id
    }));

    const createdProducts = await Product.insertMany(productsToInsert);

    console.log('Database seeded successfully.');
    console.log(`Admin: ${admin.email}`);
    console.log(`Categories: ${createdCategories.length}`);
    console.log(`Products: ${createdProducts.length}`);

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
