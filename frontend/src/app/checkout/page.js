"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CheckoutPage() {
  const [cart, setCart] = useState([]);
  const [total, setTotal] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const savedCart = JSON.parse(localStorage.getItem('cart') || '[]');
    setCart(savedCart);
    setTotal(savedCart.reduce((acc, item) => acc + item.price * item.qty, 0));
  }, []);

  const handlePlaceOrder = (e) => {
    e.preventDefault();
    // Here you would typically send the order to the backend
    alert('Order placed successfully!');
    localStorage.removeItem('cart');
    window.dispatchEvent(new Event('storage'));
    router.push('/');
  };

  if (cart.length === 0) {
    return <div className="p-8 text-center">Your cart is empty</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Shipping Form */}
        <div>
          <h2 className="text-xl font-bold mb-4">Shipping Details</h2>
          <form onSubmit={handlePlaceOrder} className="space-y-4">
            <input type="text" placeholder="Full Name" required className="w-full p-2 border rounded" />
            <input type="text" placeholder="Address" required className="w-full p-2 border rounded" />
            <input type="text" placeholder="City" required className="w-full p-2 border rounded" />
            <input type="text" placeholder="Postal Code" required className="w-full p-2 border rounded" />
            <button 
              type="submit" 
              className="w-full bg-green-600 text-white py-3 rounded font-bold hover:bg-green-700 mt-4"
            >
              Place Order (₹{total})
            </button>
          </form>
        </div>

        {/* Order Summary */}
        <div>
          <h2 className="text-xl font-bold mb-4">Order Summary</h2>
          <div className="bg-gray-50 p-4 rounded-lg">
            {cart.map(item => (
              <div key={item._id} className="flex justify-between border-b py-2">
                <span>{item.name} x {item.qty}</span>
                <span>₹{item.price * item.qty}</span>
              </div>
            ))}
            <div className="flex justify-between font-bold text-lg mt-4 pt-2 border-t border-gray-300">
              <span>Total</span>
              <span>₹{total}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}