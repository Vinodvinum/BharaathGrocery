"use client";

import "./globals.css";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

const CATEGORY_FALLBACK = [
  { _id: "all", name: "All" },
  { _id: "vegetables", name: "Vegetables" },
  { _id: "fruits", name: "Fruits" },
  { _id: "dairy", name: "Dairy" },
  { _id: "bakery", name: "Bakery" },
  { _id: "beverages", name: "Beverages" }
];
const QUICK_SUBCATEGORY_LINKS = [
  /*{ key: "dal_pulses", label: "Dal & Pulses", href: "/products?sub=dal_pulses" },
  { key: "atta_flour", label: "Atta & Flour", href: "/products?sub=atta_flour" },
  { key: "oil_ghee", label: "Oil & Ghee", href: "/products?sub=oil_ghee" },
  { key: "tea_beverages", label: "Tea & Beverages", href: "/products?sub=tea_beverages" }*/
];

export default function RootLayout({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [categories, setCategories] = useState(CATEGORY_FALLBACK);

  const pathname = usePathname();
  const router = useRouter();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  const isAdmin = user?.role === "admin";
  const isAdminRoute = pathname?.startsWith("/admin");

  useEffect(() => {
    const syncStateFromStorage = async () => {
      const token = localStorage.getItem("token");
      setIsLoggedIn(!!token);

      let storedUser = null;
      try {
        storedUser = JSON.parse(localStorage.getItem("user") || "null");
      } catch {}

      if (!storedUser && token) {
        try {
          const res = await fetch(`${apiUrl}/api/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const data = await res.json();
          if (data?.success && data.user) {
            storedUser = data.user;
            localStorage.setItem("user", JSON.stringify(storedUser));
          }
        } catch {}
      }

      setUser(storedUser);

      if (token) {
        try {
          const res = await fetch(`${apiUrl}/api/cart`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const data = await res.json();
          const count = (data?.cart?.items || []).reduce((acc, item) => acc + item.quantity, 0);
          setCartCount(count);
          return;
        } catch {}
      }

      const cart = JSON.parse(localStorage.getItem("cart") || "[]");
      const count = cart.reduce((acc, item) => acc + item.qty, 0);
      setCartCount(count);
    };

    const loadCategories = async () => {
      try {
        const res = await fetch(`${apiUrl}/api/categories`);
        const data = await res.json();
        if (data?.success && Array.isArray(data.categories) && data.categories.length > 0) {
          setCategories([{ _id: "all", name: "All" }, ...data.categories]);
        }
      } catch {}
    };

    syncStateFromStorage();
    loadCategories();

    window.addEventListener("storage", syncStateFromStorage);
    return () => {
      window.removeEventListener("storage", syncStateFromStorage);
    };
  }, [apiUrl]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("cart");
    setIsLoggedIn(false);
    setUser(null);
    window.dispatchEvent(new Event("storage"));
    router.push("/login");
  };

  return (
    <html lang="en">
      <body className="bg-slate-100 min-h-screen flex flex-col text-slate-900">
        <header className="sticky top-0 z-50 shadow-sm">
          <div className="bg-slate-900 text-white">
            <div className="mx-auto max-w-7xl px-3 md:px-4 py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  className="md:hidden inline-flex items-center justify-center w-9 h-9 rounded border border-slate-700 text-lg"
                  aria-label="Toggle navigation"
                  onClick={() => setMobileOpen((v) => !v)}
                >
                  =
                </button>
                <Link href="/" className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-amber-400 text-slate-900 font-black grid place-items-center">B</div>
                  <div>
                    <p className="text-lg font-extrabold tracking-wide">Bharat Basket</p>
                    <p className="text-[10px] uppercase text-amber-300 tracking-[0.2em]">Indian Grocery</p>
                  </div>
                </Link>
              </div>

              <nav className="hidden md:flex items-center gap-6 text-sm">
                <Link href="/" className={pathname === "/" ? "text-amber-300 font-semibold" : "text-slate-100 hover:text-amber-200"}>Home</Link>
                {!isAdmin && (
                  <Link href="/products" className={pathname?.startsWith("/products") ? "text-amber-300 font-semibold" : "text-slate-100 hover:text-amber-200"}>Products</Link>
                )}
                {isLoggedIn && !isAdmin && (
                  <Link href="/orders" className={pathname?.startsWith("/orders") ? "text-amber-300 font-semibold" : "text-slate-100 hover:text-amber-200"}>My Orders</Link>
                )}
                {isAdmin && (
                  <Link href="/admin" className={pathname?.startsWith("/admin") ? "text-amber-300 font-semibold" : "text-slate-100 hover:text-amber-200"}>Admin</Link>
                )}
              </nav>

              <div className="flex items-center gap-3 md:gap-5">
                <p className="hidden sm:block text-xs md:text-sm text-slate-200">
                  {isLoggedIn && user?.name ? <>Hello, <span className="font-semibold">{user.name.split(" ")[0]}</span></> : "Hello, Guest"}
                </p>
                {!isAdmin && (
                  <Link href="/cart" className="relative inline-flex items-center gap-1 text-slate-100 hover:text-amber-200">
                    <span className="text-xl md:text-2xl font-semibold">🛒</span>
                    <span className="hidden md:inline text-sm">Cart</span>
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-2 bg-rose-500 text-white text-[10px] rounded-full min-w-5 h-5 px-1 grid place-items-center font-semibold">
                        {cartCount}
                      </span>
                    )}
                  </Link>
                )}
                {isLoggedIn ? (
                  <button onClick={handleLogout} className="text-xs md:text-sm border border-slate-600 rounded px-3 py-1.5 hover:border-rose-400 hover:text-rose-300">Logout</button>
                ) : (
                  <Link href="/login" className="text-xs md:text-sm bg-amber-400 text-slate-900 px-3 py-1.5 rounded font-semibold hover:bg-amber-300">Login</Link>
                )}
              </div>
            </div>
          </div>

          {!isAdmin && !isAdminRoute && (
            <div className="bg-white border-b border-slate-200">
            <div className="mx-auto max-w-7xl px-3 md:px-4 py-2 overflow-x-auto">
              <div className="flex items-center gap-2 min-w-max">
                {categories.map((cat) => {
                  const isAll = cat._id === "all";
                  const href = isAll
                    ? "/products"
                    : `/products?category=${encodeURIComponent(cat.name)}`;

                  return (
                    <Link
                      key={cat._id || cat.name}
                      href={href}
                      className="px-3 py-1.5 text-xs md:text-sm rounded-full bg-slate-100 hover:bg-amber-100 hover:text-amber-900"
                    >
                      {cat.name}
                    </Link>
                  );
                })}
                {QUICK_SUBCATEGORY_LINKS.map((link) => (
                  <Link
                    key={link.key}
                    href={link.href}
                    className="px-3 py-1.5 text-xs md:text-sm rounded-full bg-amber-50 text-amber-800 hover:bg-amber-100"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
            </div>
          )}

          {mobileOpen && (
            <div className="md:hidden bg-white border-b border-slate-200">
              <div className="px-4 py-3 flex flex-col gap-3 text-sm">
                <Link href="/" className={pathname === "/" ? "font-semibold text-amber-700" : "text-slate-700"} onClick={() => setMobileOpen(false)}>Home</Link>
                {!isAdmin && (
                  <Link href="/products" className={pathname?.startsWith("/products") ? "font-semibold text-amber-700" : "text-slate-700"} onClick={() => setMobileOpen(false)}>Products</Link>
                )}
                {isLoggedIn && !isAdmin && (
                  <Link href="/orders" className={pathname?.startsWith("/orders") ? "font-semibold text-amber-700" : "text-slate-700"} onClick={() => setMobileOpen(false)}>My Orders</Link>
                )}
                {isAdmin && (
                  <Link href="/admin" className={pathname?.startsWith("/admin") ? "font-semibold text-amber-700" : "text-slate-700"} onClick={() => setMobileOpen(false)}>Admin</Link>
                )}
              </div>
            </div>
          )}
        </header>

        <main className="flex-grow">{children}</main>

        <footer className="bg-slate-900 text-slate-200 py-6 mt-auto">
          <div className="mx-auto max-w-7xl px-4 text-center text-sm">
            <p>&copy; 2026 Bharat Basket. All rights reserved.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
