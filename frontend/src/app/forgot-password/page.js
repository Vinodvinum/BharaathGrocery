"use client";

import { useState } from "react";
import axios from "axios";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [resetUrl, setResetUrl] = useState("");
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    setResetUrl("");

    try {
      const { data } = await axios.post(`${apiUrl}/api/auth/forgot-password`, { email });
      setMessage(data.message || "Reset link generated.");
      if (data.resetUrl) setResetUrl(data.resetUrl);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to generate reset link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-200px)] bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center text-gray-900">Forgot Password</h2>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="text-sm font-medium text-gray-700 block">Email address</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {message && <p className="text-sm text-green-700">{message}</p>}
          {resetUrl && (
            <div className="text-xs bg-amber-50 border border-amber-200 rounded p-2 break-all">
              Dev reset link: <a href={resetUrl} className="underline text-blue-700">{resetUrl}</a>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400"
          >
            {loading ? "Generating..." : "Generate Reset Link"}
          </button>
        </form>

        <p className="text-sm text-center text-gray-600">
          <Link href="/login" className="font-medium text-green-600 hover:text-green-500">Back to Login</Link>
        </p>
      </div>
    </div>
  );
}
