"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

const INITIAL_ADDRESS = {
  fullName: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  pincode: ""
};

const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(true));
      existing.addEventListener("error", () => resolve(false));
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

export default function CheckoutPage() {
  const [cart, setCart] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [address, setAddress] = useState(INITIAL_ADDRESS);
  const [addressErrors, setAddressErrors] = useState({});
  const router = useRouter();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  const formatINR = (value) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(value || 0);

  const sanitizeAddress = () => ({
    fullName: String(address.fullName || "").trim(),
    phone: String(address.phone || "").trim(),
    addressLine1: String(address.addressLine1 || "").trim(),
    addressLine2: String(address.addressLine2 || "").trim(),
    city: String(address.city || "").trim(),
    state: String(address.state || "").trim(),
    pincode: String(address.pincode || "").trim()
  });

  const validateAddress = () => {
    const a = sanitizeAddress();
    const errors = {};

    if (!a.fullName || a.fullName.length < 2) errors.fullName = "Enter a valid full name";
    if (!/^[0-9]{10}$/.test(a.phone)) errors.phone = "Enter a valid 10-digit phone number";
    if (!a.addressLine1 || a.addressLine1.length < 5) errors.addressLine1 = "Enter a valid address";
    if (!a.city || a.city.length < 2) errors.city = "Enter a valid city";
    if (!a.state || a.state.length < 2) errors.state = "Enter a valid state";
    if (!/^[0-9]{6}$/.test(a.pincode)) errors.pincode = "Enter a valid 6-digit pincode";

    setAddressErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const loadCart = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
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
    } catch {
      setCart([]);
    } finally {
      setLoading(false);
    }
  }, [apiUrl, router]);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  const placeFinalOrder = async (token, paymentPayload) => {
    await axios.post(
      `${apiUrl}/api/orders`,
      {
        items: cart.map((item) => ({ product: item.product, quantity: item.quantity })),
        shippingAddress: sanitizeAddress(),
        paymentMethod,
        paymentStatus: paymentMethod === "COD" ? "pending" : "paid",
        paymentDetails: paymentPayload || {}
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    localStorage.removeItem("cart");
    window.dispatchEvent(new Event("storage"));
    router.push("/orders");
  };

  const handleCODOrder = async (token) => {
    await placeFinalOrder(token);
  };

  const handleRazorpayOrder = async (token) => {
    const paymentOrderRes = await axios.post(
      `${apiUrl}/api/payments/razorpay/order`,
      {
        items: cart.map((item) => ({ product: item.product, quantity: item.quantity }))
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      throw new Error("Unable to load Razorpay checkout");
    }

    const order = paymentOrderRes.data?.razorpayOrder;
    const keyId = paymentOrderRes.data?.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

    if (!order?.id || !keyId) {
      throw new Error("Invalid Razorpay configuration");
    }

    const options = {
      key: keyId,
      amount: order.amount,
      currency: order.currency || "INR",
      name: "Bharat Basket",
      description: "Order Payment",
      order_id: order.id,
      prefill: {
        name: address.fullName,
        contact: address.phone
      },
      theme: { color: "#16a34a" },
      handler: async (response) => {
        try {
          await axios.post(
            `${apiUrl}/api/payments/razorpay/verify`,
            response,
            { headers: { Authorization: `Bearer ${token}` } }
          );

          await placeFinalOrder(token, {
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature
          });
        } catch (error) {
          const message = error.response?.data?.message || "Payment verification failed";
          alert(message);
          setPlacing(false);
        }
      },
      modal: {
        ondismiss: () => setPlacing(false)
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    if (!validateAddress()) {
      return;
    }

    setPlacing(true);
    try {
      if (paymentMethod === "COD") {
        await handleCODOrder(token);
      } else {
        await handleRazorpayOrder(token);
      }
    } catch (error) {
      alert(error.response?.data?.message || error.message || "Failed to place order");
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
            <div>
              <input
                type="text"
                placeholder="Full Name"
                required
                value={address.fullName}
                onChange={(e) => setAddress((v) => ({ ...v, fullName: e.target.value }))}
                className="w-full p-2 border rounded"
              />
              {addressErrors.fullName && <p className="text-xs text-red-600 mt-1">{addressErrors.fullName}</p>}
            </div>

            <div>
              <input
                type="text"
                placeholder="Phone (10 digits)"
                required
                value={address.phone}
                onChange={(e) => setAddress((v) => ({ ...v, phone: e.target.value }))}
                className="w-full p-2 border rounded"
              />
              {addressErrors.phone && <p className="text-xs text-red-600 mt-1">{addressErrors.phone}</p>}
            </div>

            <div>
              <input
                type="text"
                placeholder="Address Line 1"
                required
                value={address.addressLine1}
                onChange={(e) => setAddress((v) => ({ ...v, addressLine1: e.target.value }))}
                className="w-full p-2 border rounded"
              />
              {addressErrors.addressLine1 && <p className="text-xs text-red-600 mt-1">{addressErrors.addressLine1}</p>}
            </div>

            <input
              type="text"
              placeholder="Address Line 2 (Optional)"
              value={address.addressLine2}
              onChange={(e) => setAddress((v) => ({ ...v, addressLine2: e.target.value }))}
              className="w-full p-2 border rounded"
            />

            <div>
              <input
                type="text"
                placeholder="City"
                required
                value={address.city}
                onChange={(e) => setAddress((v) => ({ ...v, city: e.target.value }))}
                className="w-full p-2 border rounded"
              />
              {addressErrors.city && <p className="text-xs text-red-600 mt-1">{addressErrors.city}</p>}
            </div>

            <div>
              <input
                type="text"
                placeholder="State"
                required
                value={address.state}
                onChange={(e) => setAddress((v) => ({ ...v, state: e.target.value }))}
                className="w-full p-2 border rounded"
              />
              {addressErrors.state && <p className="text-xs text-red-600 mt-1">{addressErrors.state}</p>}
            </div>

            <div>
              <input
                type="text"
                placeholder="Pincode (6 digits)"
                required
                value={address.pincode}
                onChange={(e) => setAddress((v) => ({ ...v, pincode: e.target.value }))}
                className="w-full p-2 border rounded"
              />
              {addressErrors.pincode && <p className="text-xs text-red-600 mt-1">{addressErrors.pincode}</p>}
            </div>

            <div className="border rounded p-3">
              <p className="font-semibold mb-2">Payment Method</p>
              <label className="flex items-center gap-2 mb-2">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="COD"
                  checked={paymentMethod === "COD"}
                  onChange={() => setPaymentMethod("COD")}
                />
                <span>Cash on Delivery (COD)</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="RAZORPAY"
                  checked={paymentMethod === "RAZORPAY"}
                  onChange={() => setPaymentMethod("RAZORPAY")}
                />
                <span>Pay Online (Razorpay)</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={placing}
              className="w-full bg-green-600 text-white py-3 rounded font-bold hover:bg-green-700 mt-4 disabled:bg-gray-400"
            >
              {placing
                ? (paymentMethod === "COD" ? "Placing order..." : "Opening payment...")
                : `${paymentMethod === "COD" ? "Place COD Order" : "Pay & Place Order"} (${formatINR(total)})`}
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
