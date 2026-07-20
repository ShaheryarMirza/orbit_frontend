"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { LogIn, KeyRound, Mail, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const loginAction = useAuthStore((state) => state.login);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Forgot password state
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotRef, setForgotRef] = useState("");
  const [forgotCompany, setForgotCompany] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotPhone, setForgotPhone] = useState("");
  const [isSubmittingForgot, setIsSubmittingForgot] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);
  const [forgotError, setForgotError] = useState<string | null>(null);

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingForgot(true);
    setForgotError(null);
    setForgotSuccess(null);

    try {
      await api.post("/api/auth/forgot-password-request", {
        account_ref: forgotRef,
        phone_number: forgotPhone,
      });

      setForgotSuccess(
        "Your password reset request has been sent to our administration team. An administrator will contact you shortly to verify your identity and reset your account."
      );
      setForgotRef("");
      setForgotCompany("");
      setForgotEmail("");
      setForgotPhone("");
    } catch (err: any) {
      console.error(err);
      if (err.response?.data?.detail) {
        setForgotError(err.response.data.detail);
      } else {
        setForgotError("Failed to submit request. Please verify your connection.");
      }
    } finally {
      setIsSubmittingForgot(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // 1. Authenticate and retrieve token
      const loginRes = await api.post("/auth/login", { email, password });
      const { access_token } = loginRes.data;

      // 2. Fetch authenticated user details
      const meRes = await api.get("/auth/me", {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });
      const user = meRes.data;

      // 3. Save to auth state and redirect
      loginAction(access_token, user);
      if (user.role === "admin") {
        router.push("/admin/dashboard");
      } else {
        router.push("/");
      }
    } catch (err: any) {
      console.error(err);
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError("Invalid email or password. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12 bg-gray-50 text-slate-800 min-h-screen">
      <div className="w-full max-w-md space-y-8 bg-white border border-gray-200 p-8 rounded-2xl shadow-sm relative overflow-hidden">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <img src="/logo.png" alt="Orbit Food Limited" className="h-20 w-auto object-contain" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome back
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Sign in to manage your B2B Sage ordering portal
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label htmlFor="email-address" className="sr-only">
                Email, Phone Number, or Account Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email-address"
                  name="email"
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none rounded-xl relative block w-full pl-10 pr-3 py-3 border border-gray-300 bg-white placeholder-gray-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all text-sm"
                  placeholder="Email, Phone Number, or Account Number"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <KeyRound className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none rounded-xl relative block w-full pl-10 pr-3 py-3 border border-gray-300 bg-white placeholder-gray-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all text-sm"
                  placeholder="Enter your password"
                />
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsForgotOpen(true)}
                  className="text-xs font-medium text-slate-500 hover:text-teal-600 transition-colors cursor-pointer bg-transparent border-0 outline-none"
                >
                  Forgot Password?
                </button>
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm cursor-pointer animate-none"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                "Sign in"
              )}
            </button>
          </div>

          <div className="text-center">
            <Link
              href="/register"
              className="text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors"
            >
              Don't have an account? Register your shop here.
            </Link>
          </div>
        </form>
      </div>
      {isForgotOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-all duration-300">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-100 shadow-2xl p-6 relative animate-none">
            <h3 className="text-xl font-bold text-slate-900">Forgot Password?</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Submit a request for our admin team to reset your password.
            </p>

            {forgotSuccess ? (
              <div className="space-y-4">
                <div className="bg-teal-50 border border-teal-200 text-teal-800 p-4 rounded-xl text-sm leading-relaxed">
                  {forgotSuccess}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotOpen(false);
                    setForgotSuccess(null);
                  }}
                  className="w-full py-2.5 px-4 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-4">
                {forgotError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{forgotError}</span>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Account Number (Account Ref) *
                  </label>
                  <input
                    type="text"
                    required
                    value={forgotRef}
                    onChange={(e) => setForgotRef(e.target.value)}
                    placeholder="e.g. OR1001"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm placeholder-slate-300 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Contact Phone Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={forgotPhone}
                    onChange={(e) => setForgotPhone(e.target.value)}
                    placeholder="e.g. 0123456789"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm placeholder-slate-300 text-slate-900"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotOpen(false);
                      setForgotError(null);
                    }}
                    className="flex-1 py-2.5 px-4 border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors cursor-pointer bg-transparent"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingForgot}
                    className="flex-1 py-2.5 px-4 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isSubmittingForgot ? "Submitting..." : "Submit Request"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
