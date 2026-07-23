"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { Loader2 } from "lucide-react";

export default function Home() {
  const { user, isAuthenticated, initialize } = useAuthStore();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    initialize();
    setIsChecking(false);
  }, [initialize]);

  // If already logged in, automatically redirect to their relevant portal
  useEffect(() => {
    if (isChecking) return;
    if (isAuthenticated && user) {
      if (user.role === "admin" || user.role === "root_admin") {
        router.push("/admin/dashboard");
      } else if (user.role === "salesperson") {
        router.push("/sales/dashboard");
      } else if (user.role === "shop_owner") {
        router.push("/shop");
      }
    }
  }, [isChecking, isAuthenticated, user, router]);

  if (isChecking || (isAuthenticated && user)) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] gap-4 bg-gray-50 text-slate-800">
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
        <p className="text-slate-500 text-sm">Loading ordering portal...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-10 bg-gray-50 px-4">
      
      {/* Centered Brand Logo */}
      <div className="flex justify-center">
        <img
          src="/logo.png"
          alt="Orbit Food Limited"
          className="w-64 sm:w-80 h-auto object-contain"
        />
      </div>

      {/* Uniform Action Buttons */}
      <div className="flex flex-col items-center gap-4 w-full max-w-[280px]">
        
        {/* Login Button */}
        <Link
          href="/login"
          className="w-full text-center py-3.5 px-8 rounded-2xl text-white bg-teal-600 hover:bg-teal-700 font-bold text-sm shadow-sm transition-all cursor-pointer block"
        >
          Login
        </Link>

        {/* Register Shop Button */}
        <Link
          href="/register"
          className="w-full text-center py-3.5 px-8 rounded-2xl text-slate-700 border border-gray-300 hover:border-gray-400 bg-white font-semibold text-sm shadow-sm transition-all cursor-pointer block"
        >
          Register Shop
        </Link>
        
      </div>
      
    </div>
  );
}
