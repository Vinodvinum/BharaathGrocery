"use client";

import Link from 'next/link';

export default function WhyOrganicGroceries() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto bg-white p-6 rounded shadow">
        <h1 className="text-3xl font-bold mb-4">Why Organic Groceries Matter</h1>
        <p className="text-gray-700 mb-4">
          Choosing organic groceries can reduce exposure to pesticides and support sustainable
          farming practices. Organic produce often contains higher levels of certain nutrients and is
          grown with respect for ecological balance.
        </p>
        <p className="text-gray-700 mb-4">
          By shopping organic, you also contribute to a healthier planet—soil quality improves,
          biodiversity increases, and water pollution is minimized.
        </p>
        <Link href="/blog" className="text-green-600 hover:text-green-700">← Back to Blog</Link>
      </div>
    </div>
  );
}
