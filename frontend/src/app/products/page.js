"use client";

import { useState, useEffect } from "react";
import axios from "axios";

// Sample data fallback in case backend is empty or not running
const SAMPLE_PRODUCTS = [
  {
    _id: '1',
    name: 'Organic Brown Rice 5kg',
    description: 'Premium quality organic brown rice, grown without pesticides. Rich in fiber and nutrients. Perfect for daily meals.',
    price: 450,
    images: [{ url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=400&fit=crop', alt: 'Organic Brown Rice' }],
    rating: 4.6,
    subcategory: 'Rice & Grains'
  },
  {
    _id: '2',
    name: 'Fresh Organic Tomatoes 1kg',
    description: 'Farm-fresh organic tomatoes, handpicked daily. No chemicals or artificial ripening. Rich in vitamins and antioxidants.',
    price: 80,
    images: [{ url: 'https://images.unsplash.com/photo-1546470427-7fc6460e3a82?w=400&h=400&fit=crop', alt: 'Organic Tomatoes' }],
    rating: 4.8,
    subcategory: 'Vegetables'
  },
  {
    _id: '3',
    name: 'Organic Whole Wheat Flour 10kg',
    description: 'Stone-ground whole wheat flour from organic wheat. Perfect for chapatis, bread, and baking. High in fiber.',
    price: 650,
    images: [{ url: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&h=400&fit=crop', alt: 'Whole Wheat Flour' }],
    rating: 4.7,
    subcategory: 'Flours & Grains'
  },
  {
    _id: '4',
    name: 'Organic Toor Dal 1kg',
    description: 'Premium quality organic toor dal (pigeon peas). Rich in protein and essential amino acids. Ideal for Indian cuisine.',
    price: 180,
    images: [{ url: 'https://images.unsplash.com/photo-1599909533662-7900ebbb6cb8?w=400&h=400&fit=crop', alt: 'Organic Toor Dal' }],
    rating: 4.5,
    subcategory: 'Pulses & Lentils'
  },
  {
    _id: '5',
    name: 'Organic Milk 1 Liter',
    description: 'Fresh organic full cream milk from grass-fed cows. No hormones or antibiotics. Rich and creamy taste.',
    price: 85,
    images: [{ url: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&h=400&fit=crop', alt: 'Organic Milk' }],
    rating: 4.9,
    subcategory: 'Dairy'
  },
  {
    _id: '6',
    name: 'Organic Green Spinach 500g',
    description: 'Fresh organic spinach leaves, packed with iron and vitamins. Perfect for salads, smoothies, and cooking.',
    price: 40,
    images: [{ url: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400&h=400&fit=crop', alt: 'Organic Spinach' }],
    rating: 4.6,
    subcategory: 'Vegetables'
  },
  {
    _id: '7',
    name: 'Organic Honey 500g',
    description: 'Pure raw organic honey from Himalayan forests. Unprocessed and unpasteurized. Natural sweetness with health benefits.',
    price: 350,
    images: [{ url: 'https://images.unsplash.com/photo-1587049352846-4a222e784acc?w=400&h=400&fit=crop', alt: 'Organic Honey' }],
    rating: 4.8,
    subcategory: 'Sweeteners'
  },
  {
    _id: '8',
    name: 'Organic Chicken Eggs (12 pcs)',
    description: 'Farm-fresh organic eggs from free-range chickens. Rich in omega-3 and protein. No antibiotics or hormones.',
    price: 120,
    images: [{ url: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=400&h=400&fit=crop', alt: 'Organic Eggs' }],
    rating: 4.7,
    subcategory: 'Eggs & Meat'
  },
  {
    _id: '9',
    name: 'Organic Bananas 1 Dozen',
    description: 'Fresh organic bananas, naturally ripened. Rich in potassium and fiber. Perfect for snacks and smoothies.',
    price: 60,
    images: [{ url: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400&h=400&fit=crop', alt: 'Organic Bananas' }],
    rating: 4.5,
    subcategory: 'Fruits'
  },
  {
    _id: '10',
    name: 'Organic Basmati Rice 5kg',
    description: 'Premium aged organic basmati rice with extra-long grains. Aromatic and fluffy when cooked. Perfect for biryani.',
    price: 850,
    images: [{ url: 'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=400&h=400&fit=crop', alt: 'Organic Basmati Rice' }],
    rating: 4.9,
    subcategory: 'Rice & Grains'
  },
  {
    _id: '11',
    name: 'Organic Green Tea 100g',
    description: 'Premium organic green tea leaves from Assam. Rich in antioxidants. Perfect for health-conscious tea lovers.',
    price: 250,
    images: [{ url: 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=400&h=400&fit=crop', alt: 'Organic Green Tea' }],
    rating: 4.7,
    subcategory: 'Beverages'
  },
  {
    _id: '12',
    name: 'Organic Carrots 1kg',
    description: 'Crunchy organic carrots, fresh from the farm. Rich in beta-carotene and vitamins. Great for salads and cooking.',
    price: 70,
    images: [{ url: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400&h=400&fit=crop', alt: 'Organic Carrots' }],
    rating: 4.6,
    subcategory: 'Vegetables'
  }
];

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const { data } = await axios.get(`${apiUrl}/api/products`);
        if (data.success && data.products.length > 0) {
          setProducts(data.products);
        } else {
          console.warn("No products from backend, using sample data");
          setProducts(SAMPLE_PRODUCTS);
        }
      } catch (error) {
        console.error(error);
        console.warn("Backend error, using sample data");
        setProducts(SAMPLE_PRODUCTS);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const addToCart = (product) => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existing = cart.find(item => item._id === product._id);
    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({ ...product, qty: 1 });
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    alert('Added to cart!');
    window.dispatchEvent(new Event('storage')); // Trigger update in other components
  };

  // Get unique categories (subcategories) from products
  const categories = ['All', ...new Set(products.map(p => p.subcategory).filter(Boolean))];

  // Filter products based on selection
  const filteredProducts = selectedCategory === 'All' 
    ? products 
    : products.filter(p => p.subcategory === selectedCategory);

  if (loading) return <div className="p-8 text-center">Loading products...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!products || products.length === 0) return <div className="p-8 text-center text-gray-500">No products found.</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar for Categories */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <h2 className="text-xl font-bold mb-4">Categories</h2>
          <div className="flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-4 md:pb-0">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg text-left whitespace-nowrap transition-colors ${
                  selectedCategory === category 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </aside>

        {/* Product Grid */}
        <main className="flex-grow">
          <h1 className="text-3xl font-bold mb-8">{selectedCategory === 'All' ? 'All Products' : selectedCategory}</h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <div key={product._id} className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col">
                <div className="h-48 bg-gray-200">
                  {product.images?.[0]?.url && (
                    <img src={product.images[0].url} alt={product.name} className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="p-4 flex-grow flex flex-col">
                  <h3 className="font-bold text-lg mb-2">{product.name}</h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{product.description}</p>
                  <div className="mt-auto flex justify-between items-center">
                    <span className="text-xl font-bold text-green-600">₹{product.price}</span>
                    <button 
                      onClick={() => addToCart(product)}
                      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}