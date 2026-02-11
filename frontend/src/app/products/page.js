"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import axios from "axios";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&h=500&fit=crop";
const INDIAN_SUBCATEGORIES = [
  { label: "All", key: "all", keywords: [] },
  { label: "Rice", key: "rice", keywords: ["rice", "basmati", "brown rice"] },
  { label: "Dal & Pulses", key: "dal_pulses", keywords: ["dal", "lentil", "pulse", "toor", "moong", "chana"] },
  { label: "Atta & Flour", key: "atta_flour", keywords: ["atta", "flour", "wheat"] },
  { label: "Oil & Ghee", key: "oil_ghee", keywords: ["oil", "ghee", "mustard oil", "sunflower"] },
  { label: "Spices", key: "spices", keywords: ["masala", "spice", "turmeric", "chilli", "coriander"] },
  { label: "Tea & Beverages", key: "tea_beverages", keywords: ["tea", "coffee", "beverage", "juice"] }
];

const SAMPLE_PRODUCTS = [
  {
    _id: "1",
    name: "Organic Brown Rice 5kg",
    description: "Premium quality organic brown rice.",
    price: 450,
    images: ["https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=400&fit=crop"],
    category: { name: "Grains" }
  },
  {
    _id: "2",
    name: "Fresh Organic Tomatoes 1kg",
    description: "Farm-fresh organic tomatoes.",
    price: 80,
    images: ["https://images.unsplash.com/photo-1546470427-7fc6460e3a82?w=400&h=400&fit=crop"],
    category: { name: "Vegetables" }
  }
];

function resolveImage(images) {
  if (!Array.isArray(images) || images.length === 0) return FALLBACK_IMAGE;
  const first = images[0];
  const url = typeof first === "string" ? first : first?.url || "";
  return url || FALLBACK_IMAGE;
}

function resolveCategoryName(product) {
  if (!product?.category) return "Uncategorized";
  if (typeof product.category === "string") return product.category;
  return product.category?.name || "Uncategorized";
}

export default function ProductsPage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  const searchParams = useSearchParams();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedSubcategory, setSelectedSubcategory] = useState("all");

  const formatINR = (value) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value || 0);

  useEffect(() => {
    const categoryFromUrl = searchParams.get("category");
    const subFromUrl = searchParams.get("sub");
    if (categoryFromUrl) {
      setSelectedCategory(categoryFromUrl);
    }
    if (subFromUrl) {
      setSelectedSubcategory(subFromUrl);
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          axios.get(`${apiUrl}/api/products?limit=100`),
          axios.get(`${apiUrl}/api/categories`)
        ]);

        const apiProducts = productsRes.data?.products || [];
        if (productsRes.data?.success && apiProducts.length > 0) {
          setProducts(apiProducts);
        } else {
          setProducts(SAMPLE_PRODUCTS);
        }

        const apiCategories = categoriesRes.data?.categories || [];
        if (categoriesRes.data?.success && apiCategories.length > 0) {
          setCategories(apiCategories.map((cat) => cat.name));
        } else {
          const derived = [...new Set((apiProducts.length ? apiProducts : SAMPLE_PRODUCTS).map(resolveCategoryName))];
          setCategories(derived);
        }
      } catch (error) {
        setProducts(SAMPLE_PRODUCTS);
        setCategories([...new Set(SAMPLE_PRODUCTS.map(resolveCategoryName))]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [apiUrl]);

  const addToCart = async (product) => {
    const token = localStorage.getItem("token");

    if (token) {
      try {
        await axios.post(
          `${apiUrl}/api/cart/items`,
          { productId: product._id, quantity: 1 },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (error) {
        alert(error.response?.data?.message || "Failed to add to cart");
        return;
      }
    } else {
      const cart = JSON.parse(localStorage.getItem("cart") || "[]");
      const existing = cart.find((item) => item._id === product._id);
      if (existing) {
        existing.qty += 1;
      } else {
        cart.push({ ...product, qty: 1 });
      }
      localStorage.setItem("cart", JSON.stringify(cart));
    }

    alert("Added to cart!");
    window.dispatchEvent(new Event("storage"));
  };

  const categoryList = useMemo(() => ["All", ...categories], [categories]);

  const filteredProducts = products.filter((product) => {
    const categoryMatch = selectedCategory === "All" || resolveCategoryName(product) === selectedCategory;
    if (!categoryMatch) return false;

    const selectedSub = INDIAN_SUBCATEGORIES.find((entry) => entry.key === selectedSubcategory);
    if (!selectedSub || selectedSub.key === "all") return true;

    const haystack = `${product.name || ""} ${product.description || ""}`.toLowerCase();
    return selectedSub.keywords.some((keyword) => haystack.includes(keyword));
  });

  if (loading) return <div className="p-8 text-center">Loading products...</div>;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:py-8">
      <div className="grid grid-cols-1 md:grid-cols-[230px_1fr] gap-6 md:gap-8">
        <aside className="bg-white rounded-xl shadow-sm p-4 h-fit">
          <h2 className="text-lg font-bold mb-3">Shop by Category</h2>
          <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
            {categoryList.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg text-left whitespace-nowrap text-sm ${selectedCategory === category ? "bg-slate-900 text-white" : "bg-slate-100 hover:bg-slate-200"}`}
              >
                {category}
              </button>
            ))}
          </div>
        </aside>

        <main>
          <h1 className="text-2xl md:text-3xl font-extrabold mb-5">
            {selectedCategory === "All" ? "All Products" : selectedCategory}
          </h1>
          <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-4">
            {INDIAN_SUBCATEGORIES.map((sub) => (
              <button
                key={sub.key}
                onClick={() => setSelectedSubcategory(sub.key)}
                className={`px-3 py-1.5 text-xs md:text-sm rounded-full whitespace-nowrap ${
                  selectedSubcategory === sub.key ? "bg-amber-400 text-slate-900 font-semibold" : "bg-slate-200 text-slate-700"
                }`}
              >
                {sub.label}
              </button>
            ))}
          </div>

          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-8 text-center text-slate-600">
              No products available for this category.
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {filteredProducts.map((product) => (
                <div key={product._id} className="bg-white rounded-xl shadow-sm overflow-hidden flex flex-col border border-slate-200">
                  <div className="h-36 sm:h-44 bg-slate-100">
                    <img
                      src={resolveImage(product.images)}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = FALLBACK_IMAGE;
                      }}
                    />
                  </div>
                  <div className="p-3 md:p-4 flex-grow flex flex-col">
                    <p className="text-[11px] md:text-xs uppercase tracking-wide text-slate-500 mb-1">{resolveCategoryName(product)}</p>
                    <h3 className="font-bold text-sm md:text-base mb-1 line-clamp-2">{product.name}</h3>
                    <p className="text-slate-600 text-xs md:text-sm mb-3 line-clamp-2">{product.description}</p>
                    <div className="mt-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <span className="text-lg md:text-xl font-bold text-emerald-700">{formatINR(product.price)}</span>
                      <button
                        onClick={() => addToCart(product)}
                        className="bg-amber-400 text-slate-900 px-3 py-2 rounded-lg text-sm font-semibold hover:bg-amber-300"
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
