"use client";

import Link from 'next/link';

export default function StorageTips() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto bg-white p-6 rounded shadow">
        <h1 className="text-3xl font-bold mb-4">Smart Storage Tips for Fresh Produce</h1>
        <p className="text-gray-700 mb-4">
          Keep leafy greens crisp by wrapping them in a paper towel and placing them in a perforated bag.
          Store root vegetables like carrots and beets in a cool, dark place.
        </p>
        <p className="text-gray-700 mb-4">
          Fruits like bananas, apples, and avocados release ethylene—store them away from greens to prevent premature ripening.
        </p>
        <Link href="/blog" className="text-green-600 hover:text-green-700">← Back to Blog</Link>
      </div>
    </div>
  );
}
