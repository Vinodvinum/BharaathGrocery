"use client";

import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="bg-gray-50">
      <section className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
          Fresh Organic Groceries Delivered
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
          Shop high-quality organic produce, grains, dairy, and more. Fast delivery and best prices.
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/products" className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
            Shop Now
          </Link>
          <Link href="/register" className="px-6 py-3 bg-white text-green-700 border border-green-600 rounded-lg hover:bg-green-50 transition">
            Create Account
          </Link>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-16 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-semibold text-lg mb-2">100% Organic</h3>
          <p className="text-gray-600">Sourced from trusted organic farms for your family’s health.</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-semibold text-lg mb-2">Fast Delivery</h3>
          <p className="text-gray-600">Get your groceries delivered quickly and reliably.</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-semibold text-lg mb-2">Great Prices</h3>
          <p className="text-gray-600">Competitive pricing with regular offers and discounts.</p>
        </div>
      </section>
    </div>
  );
}
