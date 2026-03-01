"use client";

import { useState } from "react";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function ResetPasswordPage() {
  const params = useParams();
  const router = useRouter();
  const token = params?.token;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.post(`${apiUrl}/api/auth/reset-password/${token}`, { password });
      setMessage(data.message || "Password reset successful");

      if (data.success && data.token && data.user) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        window.dispatchEvent(new Event("storage"));
        router.push("/orders");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Unable to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-200px)] bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center text-gray-900">Reset Password</h2>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="password" className="text-sm font-medium text-gray-700 block">New Password</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700 block">Confirm Password</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {message && <p className="text-sm text-green-700">{message}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400"
          >
            {loading ? "Updating..." : "Reset Password"}
          </button>
        </form>

        <p className="text-sm text-center text-gray-600">
          <Link href="/login" className="font-medium text-green-600 hover:text-green-500">Back to Login</Link>
        </p>
      </div>
    </div>
  );
}
