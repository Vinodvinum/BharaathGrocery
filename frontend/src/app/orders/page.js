"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8?w=240&h=240&fit=crop";

function money(value) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value || 0);
}

function resolveImage(images) {
  if (!Array.isArray(images) || images.length === 0) return FALLBACK_IMAGE;
  const first = images[0];
  const src = typeof first === "string" ? first : first?.url || "";
  return src || FALLBACK_IMAGE;
}

function formatDate(input) {
  if (!input) return "-";
  return new Date(input).toLocaleString("en-IN");
}

export default function OrdersPage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadOrders = async () => {
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user") || "null");

      if (!token) {
        window.location.href = "/login";
        return;
      }

      if (user?.role === "admin") {
        window.location.href = "/admin";
        return;
      }

      try {
        setError("");
        const { data } = await axios.get(`${apiUrl}/api/orders/my`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setOrders(data.orders || []);
      } catch (e) {
        setError(e.response?.data?.message || "Unable to fetch order history");
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [apiUrl]);

  if (loading) return <div className="p-8 text-center">Loading your orders...</div>;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl md:text-3xl font-extrabold">Your Orders</h1>
        <Link href="/products" className="text-sm bg-amber-400 px-3 py-2 rounded font-semibold hover:bg-amber-300">Shop More</Link>
      </div>

      {!!error && <div className="bg-red-100 text-red-700 rounded-lg px-4 py-3 mb-4">{error}</div>}

      {orders.length === 0 ? (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <p className="mb-3 text-slate-700">You do not have any orders yet.</p>
          <Link href="/products" className="text-emerald-700 font-semibold hover:underline">Start shopping</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order._id} className="bg-white p-4 md:p-5 rounded-xl shadow-sm border border-slate-200">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
                <div>
                  <p className="font-semibold text-sm md:text-base">Order #{order._id}</p>
                  <p className="text-xs md:text-sm text-slate-500">Placed on {formatDate(order.createdAt)}</p>
                </div>
                <div className="text-left md:text-right">
                  <p className="font-bold text-lg">{money(order.totalAmount)}</p>
                  <p className="text-xs md:text-sm">Payment: <span className="capitalize font-medium">{order.paymentStatus || "pending"}</span></p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-3 text-xs md:text-sm">
                <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800">Status: <span className="capitalize">{order.status || "pending"}</span></span>
                <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">Items: {order.items?.length || 0}</span>
              </div>

              <div className="space-y-2 border-t pt-3">
                {(order.items || []).map((item, idx) => (
                  <div key={`${order._id}-${idx}`} className="flex items-center gap-3">
                    <img
                      src={resolveImage(item.product?.images || [])}
                      alt={item.name || item.product?.name || "Product"}
                      className="w-14 h-14 rounded object-cover bg-slate-100"
                      onError={(e) => {
                        e.currentTarget.src = FALLBACK_IMAGE;
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.name || item.product?.name || "Product"}</p>
                      <p className="text-xs text-slate-500">Qty: {item.quantity} • {money(item.price)}</p>
                    </div>
                    <p className="text-sm font-semibold">{money((item.price || 0) * (item.quantity || 0))}</p>
                  </div>
                ))}
              </div>

              {!!order.statusHistory?.length && (
                <div className="mt-4 border-t pt-3">
                  <p className="text-sm font-semibold mb-2">Order Timeline</p>
                  <ul className="space-y-1 text-xs md:text-sm text-slate-600">
                    {order.statusHistory.map((step, index) => (
                      <li key={`${order._id}-${index}`}>{formatDate(step.timestamp)} - <span className="capitalize">{step.status}</span></li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
