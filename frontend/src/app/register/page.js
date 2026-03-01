"use client";

import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const { data } = await axios.post(`${apiUrl}/api/auth/register`, {
        name,
        email,
        password,
        phone
      });
      setOtpSent(true);
      setMessage(data.message || "OTP sent to your email.");
      if (data.devOtp) {
        setMessage(`${data.message} Dev OTP: ${data.devOtp}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const { data } = await axios.post(`${apiUrl}/api/auth/verify-email-otp`, {
        email,
        otp
      });
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      window.dispatchEvent(new Event("storage"));
      router.push("/products");
    } catch (err) {
      setError(err.response?.data?.message || "OTP verification failed.");
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const { data } = await axios.post(`${apiUrl}/api/auth/resend-email-otp`, { email });
      setMessage(data.message || "OTP resent.");
      if (data.devOtp) {
        setMessage(`${data.message} Dev OTP: ${data.devOtp}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend OTP.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-200px)] bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center text-gray-900">Create your account</h2>

        {!otpSent ? (
          <form className="space-y-6" onSubmit={handleRegister}>
            <div>
              <label htmlFor="name" className="text-sm font-medium text-gray-700 block">Full Name</label>
              <input id="name" type="text" required value={name} onChange={(e) => setName(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
            </div>
            <div>
              <label htmlFor="email" className="text-sm font-medium text-gray-700 block">Email address</label>
              <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
            </div>
            <div>
              <label htmlFor="phone" className="text-sm font-medium text-gray-700 block">Phone</label>
              <input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
            </div>
            <div>
              <label htmlFor="password" className="text-sm font-medium text-gray-700 block">Password</label>
              <input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            {message && <p className="text-sm text-green-700">{message}</p>}
            <button type="submit" disabled={loading} className="w-full py-2 px-4 rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400">
              {loading ? "Sending OTP..." : "Sign up"}
            </button>
          </form>
        ) : (
          <form className="space-y-6" onSubmit={handleVerifyOtp}>
            <p className="text-sm text-gray-600">Enter OTP sent to <span className="font-semibold">{email}</span></p>
            <div>
              <label htmlFor="otp" className="text-sm font-medium text-gray-700 block">Email OTP</label>
              <input id="otp" type="text" required value={otp} onChange={(e) => setOtp(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            {message && <p className="text-sm text-green-700">{message}</p>}
            <button type="submit" disabled={loading} className="w-full py-2 px-4 rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400">
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
            <button type="button" disabled={loading} onClick={resendOtp} className="w-full py-2 px-4 rounded-md text-sm font-medium border border-gray-300 hover:bg-gray-50">
              Resend OTP
            </button>
          </form>
        )}

        <p className="text-sm text-center text-gray-600">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-green-600 hover:text-green-500">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
