"use client";

import { useState } from "react";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  const router = useRouter();

  const sendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const { data } = await axios.post(`${apiUrl}/api/auth/forgot-password`, { email });
      setMessage(data.message || "OTP sent.");
      if (data.devOtp) {
        setMessage(`${data.message} Dev OTP: ${data.devOtp}`);
      }
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  const resetWithOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      const { data } = await axios.post(`${apiUrl}/api/auth/reset-password-otp`, {
        email,
        otp,
        password
      });

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      window.dispatchEvent(new Event("storage"));
      router.push("/orders");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to reset password.");
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const { data } = await axios.post(`${apiUrl}/api/auth/forgot-password`, { email });
      setMessage(data.message || "OTP resent.");
      if (data.devOtp) {
        setMessage(`${data.message} Dev OTP: ${data.devOtp}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Unable to resend OTP.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-200px)] bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center text-gray-900">Forgot Password</h2>

        {step === 1 ? (
          <form className="space-y-5" onSubmit={sendOtp}>
            <div>
              <label htmlFor="email" className="text-sm font-medium text-gray-700 block">Email address</label>
              <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            {message && <p className="text-sm text-green-700">{message}</p>}
            <button type="submit" disabled={loading} className="w-full py-2 px-4 rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400">
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </form>
        ) : (
          <form className="space-y-5" onSubmit={resetWithOtp}>
            <p className="text-sm text-gray-600">Enter OTP sent to <span className="font-semibold">{email}</span></p>
            <div>
              <label htmlFor="otp" className="text-sm font-medium text-gray-700 block">OTP</label>
              <input id="otp" type="text" required value={otp} onChange={(e) => setOtp(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
            </div>
            <div>
              <label htmlFor="password" className="text-sm font-medium text-gray-700 block">New Password</label>
              <input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700 block">Confirm Password</label>
              <input id="confirmPassword" type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            {message && <p className="text-sm text-green-700">{message}</p>}
            <button type="submit" disabled={loading} className="w-full py-2 px-4 rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400">
              {loading ? "Resetting..." : "Reset Password"}
            </button>
            <button type="button" onClick={resendOtp} disabled={loading} className="w-full py-2 px-4 rounded-md text-sm font-medium border border-gray-300 hover:bg-gray-50">
              Resend OTP
            </button>
          </form>
        )}

        <p className="text-sm text-center text-gray-600">
          <Link href="/login" className="font-medium text-green-600 hover:text-green-500">Back to Login</Link>
        </p>
      </div>
    </div>
  );
}
