"use client";

import Link from "next/link";

const HERO_IMAGE = "https://images.unsplash.com/photo-1543168256-418811576931?w=1400&h=900&fit=crop";

const featuredBlocks = [
  {
    title: "Rice & Atta",
    image: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=700&h=450&fit=crop",
    href: "/products?sub=rice"
  },
  {
    title: "Dal & Pulses",
    image: "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?w=700&h=450&fit=crop",
    href: "/products?sub=dal_pulses"
  },
  {
    title: "Fresh Vegetables",
    image: "https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=700&h=450&fit=crop",
    href: "/products?category=Vegetables"
  },
  {
    title: "Tea & Snacks",
    image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=700&h=450&fit=crop",
    href: "/products?sub=tea_beverages"
  }
];

export default function HomePage() {
  return (
    <div className="bg-slate-100">
      <section className="relative">
        <img src={HERO_IMAGE} alt="Indian grocery" className="w-full h-[260px] md:h-[360px] object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/85 via-slate-900/50 to-transparent" />
        <div className="absolute inset-0 max-w-7xl mx-auto px-4 flex items-center">
          <div className="max-w-xl text-white">
            <p className="uppercase text-xs tracking-[0.2em] text-amber-300 mb-2">India Grocery Store</p>
            <h1 className="text-3xl md:text-5xl font-black leading-tight mb-3">Daily Essentials Delivered Faster</h1>
            <p className="text-sm md:text-base text-slate-100 mb-5">Rice, dal, atta, vegetables, dairy and household staples at local-market prices.</p>
            <div className="flex gap-3">
              <Link href="/products" className="px-5 py-2.5 rounded bg-amber-400 text-slate-900 font-semibold hover:bg-amber-300">Start Shopping</Link>
              <Link href="/orders" className="px-5 py-2.5 rounded border border-white/70 text-white font-semibold hover:bg-white/10">Track Orders</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {featuredBlocks.map((item) => (
            <Link key={item.title} href={item.href} className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-200 hover:shadow-md transition">
              <img src={item.image} alt={item.title} className="w-full h-28 md:h-36 object-cover" />
              <div className="p-3">
                <p className="font-semibold text-sm md:text-base">{item.title}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 pb-10">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 md:p-7 grid md:grid-cols-3 gap-4">
          <div className="rounded-xl bg-orange-50 p-4">
            <p className="font-bold text-orange-900 mb-1">Local Price Promise</p>
            <p className="text-sm text-orange-800">Competitive rates matched for Indian kirana baskets.</p>
          </div>
          <div className="rounded-xl bg-emerald-50 p-4">
            <p className="font-bold text-emerald-900 mb-1">Fast Delivery Slots</p>
            <p className="text-sm text-emerald-800">Morning and evening slots with reliable updates.</p>
          </div>
          <div className="rounded-xl bg-sky-50 p-4">
            <p className="font-bold text-sky-900 mb-1">Trusted Quality</p>
            <p className="text-sm text-sky-800">Fresh produce and pantry staples from verified suppliers.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
