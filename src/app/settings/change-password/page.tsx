"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import {
  Loader2,
  KeyRound,
  Lock,
  CheckCircle2,
  AlertCircle,
  ArrowLeft
} from "lucide-react";

export default function ChangePasswordPage() {
  const { user, isAuthenticated, initialize } = useAuthStore();
  const router = useRouter();

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Form State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Notifications
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // 1. Auth Guard
  useEffect(() => {
    initialize();
    setIsCheckingAuth(false);
  }, [initialize]);

  useEffect(() => {
    if (isCheckingAuth) return;
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isCheckingAuth, isAuthenticated, router]);

  // 2. Submit Request
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    if (newPassword !== confirmNewPassword) {
      setError("New password and confirm password do not match.");
      setIsSubmitting(false);
      return;
    }

    const payload = {
      current_password: currentPassword,
      new_password: newPassword,
      confirm_new_password: confirmNewPassword,
    };

    try {
      await api.post("/auth/change-password", payload);
      setSuccess("Your password has been successfully updated!");
      
      // Update local storage user state to clear must_change_password flag
      if (user) {
        const updatedUser = { ...user, must_change_password: false };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        initialize(); // Reload the zustand store from localStorage
      }

      // Reset form
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");

      // Redirect after a short delay
      setTimeout(() => {
        if (user?.role === "admin") {
          router.push("/admin/dashboard");
        } else if (user?.role === "salesperson") {
          router.push("/sales/dashboard");
        } else {
          router.push("/shop");
        }
      }, 2000);

    } catch (err: any) {
      console.error(err);
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError("Failed to update password. Please check your current password and try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isCheckingAuth || !isAuthenticated || !user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] gap-4 bg-gray-50 text-slate-800">
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
        <p className="text-slate-500 text-sm">Verifying security credentials...</p>
      </div>
    );
  }

  const forcePasswordChange = user.must_change_password;

  return (
    <div className="flex-1 bg-gray-50 text-slate-800 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto space-y-6">
        
        {/* Back navigation button */}
        <Link
          href={user.role === "admin" ? "/admin/dashboard" : user.role === "salesperson" ? "/sales/dashboard" : "/shop"}
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-teal-650 font-semibold uppercase tracking-wider transition-colors mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Dashboard
        </Link>

        {/* Card Header & Body */}
        <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm space-y-6 relative overflow-hidden">
          
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center p-3 bg-teal-500/10 rounded-2xl border border-teal-500/20 mb-2">
              <KeyRound className="w-8 h-8 text-teal-600" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Security Settings</h1>
            <p className="text-slate-500 text-xs">Update your portal account credentials</p>
          </div>

          {/* Forced change message banner */}
          {forcePasswordChange && (
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-2xl text-xs leading-normal">
              <AlertCircle className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
              <div>
                <span className="font-bold block mb-0.5">First-Time Sign In Requirement</span>
                <span>You are logged in with a temporary password. You must update your password before you can access the ordering features.</span>
              </div>
            </div>
          )}

          {/* Success Notification */}
          {success && (
            <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-2xl text-xs">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Error Notification */}
          {error && (
            <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl text-xs">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div className="space-y-1.5">
              <label className="text-xs text-slate-600 font-semibold block">Current Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="appearance-none rounded-xl relative block w-full pl-10 pr-3 py-2.5 border border-gray-300 bg-white placeholder-gray-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all text-sm"
                  placeholder="Enter current password"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-600 font-semibold block">New Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <KeyRound className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="appearance-none rounded-xl relative block w-full pl-10 pr-3 py-2.5 border border-gray-300 bg-white placeholder-gray-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all text-sm"
                  placeholder="Create new password"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-600 font-semibold block">Confirm New Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <KeyRound className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="password"
                  required
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className="appearance-none rounded-xl relative block w-full pl-10 pr-3 py-2.5 border border-gray-300 bg-white placeholder-gray-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all text-sm"
                  placeholder="Confirm new password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm cursor-pointer"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                "Update Password"
              )}
            </button>
          </form>

        </div>

      </div>
    </div>
  );
}
