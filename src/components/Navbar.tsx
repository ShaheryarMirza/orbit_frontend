"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import {
  LogOut,
  User as UserIcon,
  ShoppingCart,
  LayoutDashboard,
  Store,
  FileText,
  Briefcase,
  Layers,
  Package,
  Users,
  KeyRound,
  Menu,
  X
} from "lucide-react";

export default function Navbar() {
  const { user, isAuthenticated, logout, initialize } = useAuthStore();
  const { items } = useCartStore();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const cartItemCount = items.reduce((total, item) => total + item.quantity, 0);

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  if (pathname === "/") return null;

  return (
    <nav className="bg-white border-b border-gray-200 text-slate-800 shadow-xs sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-2 sm:py-3">
          
          {/* Logo & Desktop Nav Links */}
          <div className="flex items-center gap-4 sm:gap-6">
            <Link href="/" className="flex items-center gap-2 cursor-pointer shrink-0">
              <img src="/logo.png" alt="Orbit Food Limited" className="h-10 sm:h-14 w-auto object-contain" />
            </Link>

            {/* Desktop Navigation Links */}
            {isAuthenticated && user && (
              <div className="hidden md:flex items-center gap-5 border-l border-gray-200 pl-5">
                <Link
                  href="/orders"
                  className={`text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    pathname === "/orders" ? "text-teal-600 font-bold" : "text-slate-650 hover:text-teal-600"
                  }`}
                >
                  <FileText className="w-4 h-4 text-teal-600" />
                  Orders
                </Link>

                {(user.role === "admin" || user.role === "root_admin") && (
                  <>
                    <Link
                      href="/admin/dashboard"
                      className={`text-sm font-medium transition-colors flex items-center gap-1.5 ${
                        pathname === "/admin/dashboard" ? "text-teal-600 font-bold" : "text-slate-650 hover:text-teal-600"
                      }`}
                    >
                      <LayoutDashboard className="w-4 h-4 text-teal-600" />
                      Dashboard
                    </Link>
                    <Link
                      href="/admin/team"
                      className={`text-sm font-medium transition-colors flex items-center gap-1.5 ${
                        pathname === "/admin/team" ? "text-teal-600 font-bold" : "text-slate-650 hover:text-teal-600"
                      }`}
                    >
                      <Users className="w-4 h-4 text-teal-600" />
                      Team
                    </Link>
                    <Link
                      href="/admin/categories"
                      className={`text-sm font-medium transition-colors flex items-center gap-1.5 ${
                        pathname === "/admin/categories" ? "text-teal-600 font-bold" : "text-slate-650 hover:text-teal-600"
                      }`}
                    >
                      <Layers className="w-4 h-4 text-teal-600" />
                      Categories
                    </Link>
                    <Link
                      href="/admin/products"
                      className={`text-sm font-medium transition-colors flex items-center gap-1.5 ${
                        pathname === "/admin/products" ? "text-teal-600 font-bold" : "text-slate-650 hover:text-teal-600"
                      }`}
                    >
                      <Package className="w-4 h-4 text-teal-600" />
                      Inventory
                    </Link>
                    <Link
                      href="/sales/assisted-order"
                      className={`text-sm font-medium transition-colors flex items-center gap-1.5 ${
                        pathname === "/sales/assisted-order" ? "text-teal-600 font-bold" : "text-slate-650 hover:text-teal-600"
                      }`}
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
                      className={`text-sm font-medium transition-colors flex items-center gap-1.5 ${
                        pathname === "/sales/dashboard" ? "text-teal-600 font-bold" : "text-slate-650 hover:text-teal-600"
                      }`}
                    >
                      <LayoutDashboard className="w-4 h-4 text-teal-600" />
                      Sales Dashboard
                    </Link>
                    <Link
                      href="/sales/assisted-order"
                      className={`text-sm font-medium transition-colors flex items-center gap-1.5 ${
                        pathname === "/sales/assisted-order" ? "text-teal-600 font-bold" : "text-slate-650 hover:text-teal-600"
                      }`}
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
                      className={`text-sm font-medium transition-colors flex items-center gap-1.5 ${
                        pathname === "/shop" ? "text-teal-600 font-bold" : "text-slate-650 hover:text-teal-600"
                      }`}
                    >
                      <Store className="w-4 h-4 text-teal-600" />
                      Shop Catalog
                    </Link>
                    <Link
                      href="/shop/cart"
                      className={`text-sm font-medium transition-colors flex items-center gap-1.5 relative ${
                        pathname === "/shop/cart" ? "text-teal-600 font-bold" : "text-slate-650 hover:text-teal-600"
                      }`}
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

          {/* Desktop & Mobile Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {isAuthenticated && user ? (
              <>
                {/* Desktop User Info & Buttons */}
                <div className="hidden sm:flex items-center gap-3">
                  <div className="flex items-center gap-2 text-xs sm:text-sm bg-gray-50 border border-gray-200 py-1.5 px-3 rounded-full">
                    <UserIcon className="w-3.5 h-3.5 text-teal-600" />
                    <span className="font-semibold text-slate-800 max-w-[120px] truncate">{user.name}</span>
                    <span className="text-[10px] text-slate-500 bg-gray-200 px-2 py-0.5 rounded-full capitalize font-medium">
                      {user.role === "root_admin" ? "Root Admin" : user.role}
                    </span>
                  </div>

                  {user.role === "shop_owner" && (
                    <Link
                      href="/settings/profile"
                      className="flex items-center gap-1 text-xs sm:text-sm font-semibold text-slate-650 hover:text-teal-600 transition-colors py-1.5 px-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                      title="My Profile"
                    >
                      <UserIcon className="w-4 h-4 text-teal-600" />
                      <span>Profile</span>
                    </Link>
                  )}

                  <Link
                    href="/settings/change-password"
                    className="flex items-center gap-1 text-xs sm:text-sm font-semibold text-slate-650 hover:text-teal-600 transition-colors py-1.5 px-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                    title="Security Settings"
                  >
                    <KeyRound className="w-4 h-4 text-teal-600" />
                    <span>Security</span>
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1 text-xs sm:text-sm font-semibold text-rose-600 hover:text-rose-700 transition-colors py-1.5 px-2 rounded-lg hover:bg-rose-50 cursor-pointer"
                    title="Logout"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>

                {/* Mobile Menu Toggle Button */}
                <div className="flex md:hidden items-center gap-2">
                  {user.role === "shop_owner" && (
                    <Link href="/shop/cart" className="relative p-2 text-teal-600 hover:bg-teal-50 rounded-xl transition-colors">
                      <ShoppingCart className="w-5 h-5" />
                      {cartItemCount > 0 && (
                        <span className="absolute top-0 right-0 bg-teal-600 text-white font-bold text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-mono">
                          {cartItemCount}
                        </span>
                      )}
                    </Link>
                  )}
                  <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="p-2 text-slate-700 hover:text-teal-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                  >
                    {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                  </button>
                </div>
              </>
            ) : (
              <Link
                href="/login"
                className="text-xs sm:text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 py-2 px-4 rounded-xl shadow-xs transition-all"
              >
                Login
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Expanded Menu Dropdown */}
        {mobileMenuOpen && isAuthenticated && user && (
          <div className="md:hidden border-t border-gray-100 py-3 space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
            {/* User Badge */}
            <div className="flex items-center justify-between px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-xl">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                <UserIcon className="w-4 h-4 text-teal-600" />
                <span>{user.name}</span>
              </div>
              <span className="text-[10px] text-slate-500 bg-gray-200 px-2 py-0.5 rounded-full capitalize font-bold">
                {user.role === "root_admin" ? "Root Admin" : user.role}
              </span>
            </div>

            {/* Navigation Links */}
            <div className="space-y-1">
              <Link
                href="/orders"
                className="flex items-center gap-2 py-2 px-3 rounded-xl text-xs font-bold text-slate-700 hover:bg-teal-50 hover:text-teal-600"
              >
                <FileText className="w-4 h-4 text-teal-600" />
                Orders
              </Link>

              {(user.role === "admin" || user.role === "root_admin") && (
                <>
                  <Link
                    href="/admin/dashboard"
                    className="flex items-center gap-2 py-2 px-3 rounded-xl text-xs font-bold text-slate-700 hover:bg-teal-50 hover:text-teal-600"
                  >
                    <LayoutDashboard className="w-4 h-4 text-teal-600" />
                    Dashboard
                  </Link>
                  <Link
                    href="/admin/team"
                    className="flex items-center gap-2 py-2 px-3 rounded-xl text-xs font-bold text-slate-700 hover:bg-teal-50 hover:text-teal-600"
                  >
                    <Users className="w-4 h-4 text-teal-600" />
                    Team Management
                  </Link>
                  <Link
                    href="/admin/categories"
                    className="flex items-center gap-2 py-2 px-3 rounded-xl text-xs font-bold text-slate-700 hover:bg-teal-50 hover:text-teal-600"
                  >
                    <Layers className="w-4 h-4 text-teal-600" />
                    Manage Categories
                  </Link>
                  <Link
                    href="/admin/products"
                    className="flex items-center gap-2 py-2 px-3 rounded-xl text-xs font-bold text-slate-700 hover:bg-teal-50 hover:text-teal-600"
                  >
                    <Package className="w-4 h-4 text-teal-600" />
                    Product Inventory
                  </Link>
                  <Link
                    href="/sales/assisted-order"
                    className="flex items-center gap-2 py-2 px-3 rounded-xl text-xs font-bold text-slate-700 hover:bg-teal-50 hover:text-teal-600"
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
                    className="flex items-center gap-2 py-2 px-3 rounded-xl text-xs font-bold text-slate-700 hover:bg-teal-50 hover:text-teal-600"
                  >
                    <LayoutDashboard className="w-4 h-4 text-teal-600" />
                    Sales Dashboard
                  </Link>
                  <Link
                    href="/sales/assisted-order"
                    className="flex items-center gap-2 py-2 px-3 rounded-xl text-xs font-bold text-slate-700 hover:bg-teal-50 hover:text-teal-600"
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
                    className="flex items-center gap-2 py-2 px-3 rounded-xl text-xs font-bold text-slate-700 hover:bg-teal-50 hover:text-teal-600"
                  >
                    <Store className="w-4 h-4 text-teal-600" />
                    Shop Catalog
                  </Link>
                  <Link
                    href="/settings/profile"
                    className="flex items-center gap-2 py-2 px-3 rounded-xl text-xs font-bold text-slate-700 hover:bg-teal-50 hover:text-teal-600"
                  >
                    <UserIcon className="w-4 h-4 text-teal-600" />
                    My Profile
                  </Link>
                </>
              )}

              <Link
                href="/settings/change-password"
                className="flex items-center gap-2 py-2 px-3 rounded-xl text-xs font-bold text-slate-700 hover:bg-teal-50 hover:text-teal-600"
              >
                <KeyRound className="w-4 h-4 text-teal-600" />
                Security Settings
              </Link>
            </div>

            {/* Logout Button */}
            <div className="pt-2 border-t border-gray-100">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Logout Account
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
