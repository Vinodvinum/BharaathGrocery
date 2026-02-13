"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import axios from "axios";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&h=500&fit=crop";

const INDIAN_SUBCATEGORIES = [
  { label: "All", key: "all", keywords: [] },
  { label: "Rice", key: "rice", keywords: ["rice", "basmati", "brown rice"] },
  { label: "Dal & Pulses", key: "dal_pulses", keywords: ["dal", "lentil", "pulse", "toor", "moong", "chana"] },
  { label: "Atta & Flour", key: "atta_flour", keywords: ["atta", "flour", "wheat"] },
  { label: "Oil & Ghee", key: "oil_ghee", keywords: ["oil", "ghee", "mustard oil", "sunflower"] },
  { label: "Spices", key: "spices", keywords: ["masala", "spice", "turmeric", "chilli", "coriander"] },
  { label: "Tea & Beverages", key: "tea_beverages", keywords: ["tea", "coffee", "beverage", "juice"] }
];

function resolveImage(images) {
  if (!Array.isArray(images) || images.length === 0) return FALLBACK_IMAGE;
  const first = images[0];
  return typeof first === "string" ? first : first?.url || FALLBACK_IMAGE;
}

function resolveCategoryName(product) {
  if (!product?.category) return "Uncategorized";
  if (typeof product.category === "string") return product.category;
  return product.category?.name || "Uncategorized";
}

export default function ProductsContent() {
  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  const searchParams = useSearchParams();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedSubcategory, setSelectedSubcategory] = useState("all");

  const formatINR = (value) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(value || 0);

  // URL PARAMS EFFECT
  useEffect(() => {
    const categoryFromUrl = searchParams.get("category");
    const subFromUrl = searchParams.get("sub");

    setSelectedCategory(categoryFromUrl || "All");
    setSelectedSubcategory(subFromUrl || "all");
  }, [searchParams]);

  // FETCH DATA
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          axios.get(`${apiUrl}/api/products?limit=100`),
          axios.get(`${apiUrl}/api/categories`)
        ]);

        const apiProducts = productsRes.data?.products || [];
        setProducts(apiProducts);

        const apiCategories = categoriesRes.data?.categories || [];
        setCategories(apiCategories.map((cat) => cat.name));
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [apiUrl]);

  const categoryList = useMemo(
    () => ["All", ...categories],
    [categories]
  );

  const filteredProducts = products.filter((product) => {
    const categoryMatch =
      selectedCategory === "All" ||
      resolveCategoryName(product) === selectedCategory;

    if (!categoryMatch) return false;

    const selectedSub = INDIAN_SUBCATEGORIES.find(
      (entry) => entry.key === selectedSubcategory
    );

    if (!selectedSub || selectedSub.key === "all") return true;

    const haystack = `${product.name || ""} ${product.description || ""}`.toLowerCase();

    return selectedSub.keywords.some((keyword) =>
      haystack.includes(keyword)
    );
  });

  if (loading)
    return <div className="p-8 text-center">Loading products...</div>;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:py-8">
      <div className="grid grid-cols-1 md:grid-cols-[230px_1fr] gap-6 md:gap-8">

        {/* SIDEBAR */}
        <aside className="hidden md:block bg-white rounded-xl shadow-sm p-4 h-fit sticky top-24 self-start">
          <h2 className="text-lg font-bold mb-3">Shop by Category</h2>
          <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible">
            {categoryList.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg text-left text-sm ${
                  selectedCategory === category
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 hover:bg-slate-200"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </aside>

        {/* MAIN */}
        <main>
          <h1 className="text-2xl md:text-3xl font-extrabold mb-5">
            {selectedCategory === "All"
              ? "All Products"
              : selectedCategory}
          </h1>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {filteredProducts.map((product) => (
              <div
                key={product._id}
                className="bg-white rounded-xl shadow-sm overflow-hidden flex flex-col border"
              >
                <div className="h-36 bg-slate-100">
                  <img
                    src={resolveImage(product.images)}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="p-4 flex flex-col flex-grow">
                  <p className="text-xs uppercase text-slate-500 mb-1">
                    {resolveCategoryName(product)}
                  </p>

                  <h3 className="font-bold text-sm mb-2">
                    {product.name}
                  </h3>

                  <span className="text-lg font-bold text-emerald-700 mt-auto">
                    {formatINR(product.price)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}