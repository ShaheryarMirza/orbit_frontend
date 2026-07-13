"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { LogOut, User as UserIcon, ShoppingCart, LayoutDashboard, Store, FileText, Briefcase, Layers, Package, Users, KeyRound } from "lucide-react";

export default function Navbar() {
  const { user, isAuthenticated, logout, initialize } = useAuthStore();
  const { items } = useCartStore();
  const router = useRouter();
  const pathname = usePathname();

  const cartItemCount = items.reduce((total, item) => total + item.quantity, 0);

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Intercept and redirect if must_change_password is true
  useEffect(() => {
    if (isAuthenticated && user?.must_change_password && pathname !== "/settings/change-password") {
      router.push("/settings/change-password");
    }
  }, [isAuthenticated, user, pathname, router]);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  if (pathname === "/") return null;

  return (
    <nav className="bg-white border-b border-gray-200 text-slate-800 shadow-sm relative z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-2 sm:py-3">
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="flex items-center gap-2 cursor-pointer"
            >
              <img src="/logo.png" alt="Orbit Food Limited" className="h-16 w-auto object-contain" />
            </Link>

            {/* Navigation links based on role */}
            {isAuthenticated && user && !user.must_change_password && (
              <div className="hidden sm:flex items-center gap-5 ml-4 border-l border-gray-200 pl-5">
                <Link
                  href="/orders"
                  className="text-sm font-medium text-slate-600 hover:text-teal-600 transition-colors flex items-center gap-1.5"
                >
                  <FileText className="w-4 h-4 text-teal-600" />
                  Orders
                </Link>

                {user.role === "admin" && (
                  <>
                    <Link
                      href="/admin/dashboard"
                      className="text-sm font-medium text-slate-600 hover:text-teal-600 transition-colors flex items-center gap-1.5"
                    >
                      <LayoutDashboard className="w-4 h-4 text-teal-600" />
                      Dashboard
                    </Link>
                    <Link
                      href="/admin/team"
                      className="text-sm font-medium text-slate-600 hover:text-teal-600 transition-colors flex items-center gap-1.5"
                    >
                      <Users className="w-4 h-4 text-teal-600" />
                      Team
                    </Link>
                    <Link
                      href="/admin/categories"
                      className="text-sm font-medium text-slate-600 hover:text-teal-600 transition-colors flex items-center gap-1.5"
                    >
                      <Layers className="w-4 h-4 text-teal-600" />
                      Categories
                    </Link>
                    <Link
                      href="/admin/products"
                      className="text-sm font-medium text-slate-600 hover:text-teal-600 transition-colors flex items-center gap-1.5"
                    >
                      <Package className="w-4 h-4 text-teal-600" />
                      Inventory
                    </Link>
                    <Link
                      href="/sales/assisted-order"
                      className="text-sm font-medium text-slate-600 hover:text-teal-600 transition-colors flex items-center gap-1.5"
                    >
                      <Briefcase className="w-4 h-4 text-teal-600" />
                      Assisted Order
                    </Link>
                  </>
                )}

                {user.role === "salesperson" && (
                  <>
                    <Link
                      href="/sales/dashboard"
                      className="text-sm font-medium text-slate-600 hover:text-teal-600 transition-colors flex items-center gap-1.5"
                    >
                      <LayoutDashboard className="w-4 h-4 text-teal-600" />
                      Sales Dashboard
                    </Link>
                    <Link
                      href="/sales/assisted-order"
                      className="text-sm font-medium text-slate-600 hover:text-teal-600 transition-colors flex items-center gap-1.5"
                    >
                      <Briefcase className="w-4 h-4 text-teal-600" />
                      Assisted Order
                    </Link>
                  </>
                )}

                {user.role === "shop_owner" && (
                  <>
                    <Link
                      href="/shop"
                      className="text-sm font-medium text-slate-600 hover:text-teal-600 transition-colors flex items-center gap-1.5"
                    >
                      <Store className="w-4 h-4 text-teal-600" />
                      Shop Catalog
                    </Link>
                    <Link
                      href="/shop/cart"
                      className="text-sm font-medium text-slate-600 hover:text-teal-600 transition-colors flex items-center gap-1.5 relative"
                    >
                      <ShoppingCart className="w-4 h-4 text-teal-600" />
                      Cart
                      {cartItemCount > 0 && (
                        <span className="absolute -top-2 -right-3.5 bg-teal-600 text-white font-bold text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-mono">
                          {cartItemCount}
                        </span>
                      )}
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm bg-gray-50 border border-gray-200 py-1.5 px-3 rounded-full">
                  <UserIcon className="w-4 h-4 text-teal-600" />
                  <span className="font-semibold text-slate-800">{user.name}</span>
                  <span className="text-xs text-slate-500 bg-gray-200 px-2 py-0.5 rounded-full capitalize font-medium">
                    {user.role}
                  </span>
                </div>
                <Link
                  href="/settings/change-password"
                  className="flex items-center gap-1.5 text-sm font-semibold text-slate-650 hover:text-teal-600 transition-colors py-1.5 px-2.5 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <KeyRound className="w-4 h-4 text-teal-600" />
                  Security
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 text-sm font-semibold text-red-650 hover:text-red-500 transition-colors py-1.5 px-2.5 rounded-lg hover:bg-red-50 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 py-2 px-4 rounded-lg shadow-sm transition-all"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
