"use client";

import "./globals.css";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

export default function RootLayout({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const syncStateFromStorage = () => {
      const token = localStorage.getItem('token');
      setIsLoggedIn(!!token);
      
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      const count = cart.reduce((acc, item) => acc + item.qty, 0);
      setCartCount(count);
    };

    syncStateFromStorage(); // Initial check

    window.addEventListener('storage', syncStateFromStorage);
    return () => {
      window.removeEventListener('storage', syncStateFromStorage);
    };
  }, []); // Run only once on mount

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('cart'); // Also clear cart on logout
    setIsLoggedIn(false);
    window.dispatchEvent(new Event('storage')); // Notify other tabs/components
    router.push('/login');
  };

  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen flex flex-col">
        <header className="bg-white shadow-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <Link href="/">
              <h1 className="text-2xl font-bold text-green-600">Grocery Shop</h1>
            </Link>
            <nav className="hidden md:flex items-center gap-8">
              <Link href="/" className="text-gray-600 hover:text-green-600 font-medium">Home</Link>
              <Link href="/products" className="text-gray-600 hover:text-green-600 font-medium">Products</Link>
            </nav>
            <div className="flex items-center gap-6">
              <Link href="/cart" className="relative text-gray-600 hover:text-green-600">
                <span className="text-2xl">🛒</span>
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>
              {isLoggedIn ? (
                <button onClick={handleLogout} className="text-gray-600 hover:text-red-600 font-medium">Logout</button>
              ) : (
                <Link href="/login" className="bg-green-600 text-white px-4 py-2 rounded-full hover:bg-green-700 transition">
                  Login
                </Link>
              )}
            </div>
          </div>
        </header>
        <main className="flex-grow">
          {children}
        </main>
        <footer className="bg-gray-800 text-white py-8 mt-auto">
          <div className="container mx-auto px-4 text-center">
            <p>&copy; 2024 Grocery Shop. All rights reserved.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
