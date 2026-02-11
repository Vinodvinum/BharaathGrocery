"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

export default function CheckoutPage() {
  const [cart, setCart] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [address, setAddress] = useState({
    fullName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: ''
  });
  const router = useRouter();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  const formatINR = (value) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value || 0);

  useEffect(() => {
    const load = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const { data } = await axios.get(`${apiUrl}/api/cart`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const normalized = (data.cart?.items || []).map((item) => ({
          product: item.product?._id,
          quantity: item.quantity,
          price: item.price,
          name: item.product?.name
        }));

        setCart(normalized);
        setTotal(normalized.reduce((acc, item) => acc + item.price * item.quantity, 0));
      } catch (error) {
        setCart([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [apiUrl, router]);

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    setPlacing(true);
    try {
      await axios.post(
        `${apiUrl}/api/orders`,
        {
          items: cart.map((item) => ({ product: item.product, quantity: item.quantity })),
          shippingAddress: address,
          paymentStatus: 'pending'
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      localStorage.removeItem('cart');
      window.dispatchEvent(new Event('storage'));
      router.push('/orders');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to place order');
    } finally {
      setPlacing(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading checkout...</div>;
  if (cart.length === 0) return <div className="p-8 text-center">Your cart is empty</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-bold mb-4">Shipping Details</h2>
          <form onSubmit={handlePlaceOrder} className="space-y-4">
            <input type="text" placeholder="Full Name" required value={address.fullName} onChange={(e) => setAddress((v) => ({ ...v, fullName: e.target.value }))} className="w-full p-2 border rounded" />
            <input type="text" placeholder="Phone" required value={address.phone} onChange={(e) => setAddress((v) => ({ ...v, phone: e.target.value }))} className="w-full p-2 border rounded" />
            <input type="text" placeholder="Address Line 1" required value={address.addressLine1} onChange={(e) => setAddress((v) => ({ ...v, addressLine1: e.target.value }))} className="w-full p-2 border rounded" />
            <input type="text" placeholder="Address Line 2" value={address.addressLine2} onChange={(e) => setAddress((v) => ({ ...v, addressLine2: e.target.value }))} className="w-full p-2 border rounded" />
            <input type="text" placeholder="City" required value={address.city} onChange={(e) => setAddress((v) => ({ ...v, city: e.target.value }))} className="w-full p-2 border rounded" />
            <input type="text" placeholder="State" required value={address.state} onChange={(e) => setAddress((v) => ({ ...v, state: e.target.value }))} className="w-full p-2 border rounded" />
            <input type="text" placeholder="Postal Code" required value={address.pincode} onChange={(e) => setAddress((v) => ({ ...v, pincode: e.target.value }))} className="w-full p-2 border rounded" />
            <button type="submit" disabled={placing} className="w-full bg-green-600 text-white py-3 rounded font-bold hover:bg-green-700 mt-4 disabled:bg-gray-400">
              {placing ? 'Placing order...' : `Place Order (${formatINR(total)})`}
            </button>
          </form>
        </div>

        <div>
          <h2 className="text-xl font-bold mb-4">Order Summary</h2>
          <div className="bg-gray-50 p-4 rounded-lg">
            {cart.map((item) => (
              <div key={item.product} className="flex justify-between border-b py-2">
                <span>{item.name} x {item.quantity}</span>
                <span>{formatINR(item.price * item.quantity)}</span>
              </div>
            ))}
            <div className="flex justify-between font-bold text-lg mt-4 pt-2 border-t border-gray-300">
              <span>Total</span>
              <span>{formatINR(total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
