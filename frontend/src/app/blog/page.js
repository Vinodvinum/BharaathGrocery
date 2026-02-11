"use client";

import Link from 'next/link';

const POSTS = [
  { slug: 'why-organic-groceries', title: 'Why Organic Groceries Matter', summary: 'Understand the health and environmental benefits of choosing organic.' },
  { slug: 'storage-tips', title: 'Smart Storage Tips for Fresh Produce', summary: 'Keep your fruits and vegetables fresh for longer with these tips.' },
];

export default function BlogIndex() {
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-6">Our Blog</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {POSTS.map((post) => (
          <Link key={post.slug} href={`/blog/${post.slug}`} className="block bg-white p-6 rounded shadow hover:shadow-md transition">
            <h2 className="text-xl font-semibold mb-2">{post.title}</h2>
            <p className="text-gray-600">{post.summary}</p>
            <span className="text-green-600 font-medium inline-block mt-3">Read more →</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
