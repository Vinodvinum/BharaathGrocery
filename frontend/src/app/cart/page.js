"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import axios from "axios";

function resolveImage(images) {
  if (!Array.isArray(images) || images.length === 0) return '';
  const first = images[0];
  return typeof first === 'string' ? first : first?.url || '';
}

export default function CartPage() {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  const loadCart = async () => {
    const token = localStorage.getItem('token');

    if (!token) {
      const items = JSON.parse(localStorage.getItem('cart') || '[]');
      setCart(items.map((item) => ({ ...item, _cartItemId: item._id })));
      setLoading(false);
      return;
    }

    try {
      const { data } = await axios.get(`${apiUrl}/api/cart`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const normalized = (data.cart?.items || []).map((item) => ({
        _id: item.product?._id,
        _cartItemId: item._id,
        name: item.product?.name,
        price: item.price,
        qty: item.quantity,
        stock: item.product?.stock,
        images: item.product?.images || []
      }));
      setCart(normalized);
    } catch (error) {
      setCart([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCart();
  }, []);

  const updateQty = async (id, delta) => {
    const token = localStorage.getItem('token');

    if (!token) {
      const newCart = cart.map((item) => {
        if (item._id === id) return { ...item, qty: Math.max(1, item.qty + delta) };
        return item;
      });
      setCart(newCart);
      localStorage.setItem('cart', JSON.stringify(newCart));
      window.dispatchEvent(new Event('storage'));
      return;
    }

    const item = cart.find((entry) => entry._id === id);
    if (!item) return;

    const nextQty = Math.max(1, item.qty + delta);
    await axios.put(
      `${apiUrl}/api/cart/items/${item._cartItemId}`,
      { quantity: nextQty },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    await loadCart();
    window.dispatchEvent(new Event('storage'));
  };

  const removeItem = async (id) => {
    const token = localStorage.getItem('token');

    if (!token) {
      const newCart = cart.filter((item) => item._id !== id);
      setCart(newCart);
      localStorage.setItem('cart', JSON.stringify(newCart));
      window.dispatchEvent(new Event('storage'));
      return;
    }

    const item = cart.find((entry) => entry._id === id);
    if (!item) return;

    await axios.delete(`${apiUrl}/api/cart/items/${item._cartItemId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    await loadCart();
    window.dispatchEvent(new Event('storage'));
  };

  const total = cart.reduce((acc, item) => acc + item.price * item.qty, 0);

  if (loading) return <div className="p-8 text-center">Loading cart...</div>;

  if (cart.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
        <Link href="/products" className="text-green-600 hover:underline">Continue Shopping</Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {cart.map((item) => (
            <div key={item._cartItemId || item._id} className="flex items-center gap-4 bg-white p-4 rounded-lg shadow-sm mb-4">
              <div className="w-20 h-20 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                {resolveImage(item.images) && (
                  <img src={resolveImage(item.images)} alt={item.name} className="w-full h-full object-cover" />
                )}
              </div>
              <div className="flex-grow">
                <h3 className="font-bold">{item.name}</h3>
                <p className="text-gray-600">${item.price}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => updateQty(item._id, -1)} className="px-2 py-1 bg-gray-200 rounded">-</button>
                <span className="w-8 text-center">{item.qty}</span>
                <button onClick={() => updateQty(item._id, 1)} className="px-2 py-1 bg-gray-200 rounded">+</button>
              </div>
              <button onClick={() => removeItem(item._id)} className="text-red-500 hover:text-red-700">Remove</button>
            </div>
          ))}
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm h-fit">
          <h3 className="text-xl font-bold mb-4">Order Summary</h3>
          <div className="flex justify-between mb-2"><span>Subtotal</span><span>${total.toFixed(2)}</span></div>
          <div className="border-t pt-4 mt-4">
            <div className="flex justify-between font-bold text-lg mb-6"><span>Total</span><span>${total.toFixed(2)}</span></div>
            <Link href="/checkout"><button className="w-full bg-green-600 text-white py-3 rounded font-bold hover:bg-green-700">Proceed to Checkout</button></Link>
          </div>
        </div>
      </div>
    </div>
  );
}
