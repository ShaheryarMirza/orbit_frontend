"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import api, { API_BASE_URL } from "@/lib/api";
import {
  Loader2,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  CreditCard,
  ArrowLeft,
  AlertCircle,
  FileText
} from "lucide-react";

export default function CartPage() {
  const { user, isAuthenticated, initialize } = useAuthStore();
  const { items, updateQuantity, removeItem, clearCart, getSubtotal } = useCartStore();
  const router = useRouter();

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [customerReference, setCustomerReference] = useState("");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Route Protection
  useEffect(() => {
    initialize();
    setIsCheckingAuth(false);
  }, [initialize]);

  useEffect(() => {
    if (isCheckingAuth) return;

    if (!isAuthenticated) {
      router.push("/login");
    } else if (user?.role !== "shop_owner") {
      router.push("/");
    }
  }, [isCheckingAuth, isAuthenticated, user, router]);

  // 2. Place Order Operation
  const handlePlaceOrder = async () => {
    if (items.length === 0) return;

    setIsPlacingOrder(true);
    setError(null);

    // Map cart items into payload format expected by backend:
    const orderItems = items.map((item) => ({
      product_id: item.product.id,
      quantity: item.quantity,
    }));

    const payload = {
      items: orderItems,
      customer_reference: customerReference.trim() || null,
    };

    try {
      await api.post("/orders", payload);
      
      // Clear Cart state, alert, and redirect
      clearCart();
      alert("Order placed successfully!");
      router.push("/shop");
    } catch (err: any) {
      console.error(err);
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError("Failed to place order. Please check stock levels and try again.");
      }
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (isCheckingAuth || !isAuthenticated || user?.role !== "shop_owner") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] gap-4 bg-gray-50 text-slate-800">
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
        <p className="text-slate-500 text-sm">Verifying customer credentials...</p>
      </div>
    );
  }

  const subtotal = getSubtotal();

  return (
    <div className="flex-1 bg-gray-50 text-slate-800 min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Back Link & Title */}
        <div className="flex items-center justify-between border-b border-gray-200 pb-6">
          <div className="space-y-1">
            <Link
              href="/shop"
              className="inline-flex items-center gap-1.5 text-xs text-teal-600 hover:text-teal-700 font-semibold uppercase tracking-wider transition-colors mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Catalog
            </Link>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Shopping Cart</h1>
          </div>
          <span className="text-sm text-slate-500 font-semibold">
            {items.length} {items.length === 1 ? "item" : "items"} selected
          </span>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Approved Warning Banner */}
        {user && !user.is_approved && (
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 text-amber-850 p-4 rounded-2xl text-sm leading-normal">
            <AlertCircle className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
            <div>
              <span className="font-bold block mb-0.5">Account Review In Progress</span>
              <span>Your account is currently under review. Purchasing will be enabled as soon as an administrator approves your profile.</span>
            </div>
          </div>
        )}

        {items.length === 0 ? (
          /* Empty Cart State */
          <div className="flex flex-col items-center justify-center py-24 border border-dashed border-gray-300 rounded-3xl bg-white text-center px-4 shadow-sm">
            <ShoppingBag className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-bold text-slate-800">Your cart is empty</h3>
            <p className="text-slate-400 text-sm max-w-sm mt-1 mb-6">
              You haven't added any products to your cart yet. Head back to the catalog to choose your items.
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 py-3 px-6 rounded-xl text-white bg-teal-600 hover:bg-teal-700 text-sm font-bold shadow-sm transition-all"
            >
              Browse Catalog
            </Link>
          </div>
        ) : (
          /* Cart & Summary Columns */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* Cart Items list */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => {
                const priceNum = typeof item.product.price === "string"
                  ? parseFloat(item.product.price)
                  : item.product.price;
                const lineTotal = priceNum * item.quantity;

                return (
                  <div
                    key={item.product.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 bg-white border border-gray-200 rounded-2xl gap-4 hover:border-gray-300 transition-colors shadow-sm"
                  >
                    {/* Item Details */}
                    <div className="flex items-center gap-4">
                      {/* Image Thumbnail */}
                      <div className="w-16 h-16 bg-gray-50 border border-gray-200 rounded-xl overflow-hidden shrink-0 flex items-center justify-center text-gray-400 font-mono text-xs">
                        {item.product.image_url ? (
                          <img
                            src={item.product.image_url.startsWith("http") ? item.product.image_url : (API_BASE_URL + item.product.image_url)}
                            alt={item.product.product_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-center px-1 font-semibold">{item.product.product_code}</span>
                        )}
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-extrabold text-slate-905 leading-snug line-clamp-1">{item.product.product_name}</h4>
                        {item.product.description && (
                          <p className="text-[11px] text-slate-500 line-clamp-1 leading-normal font-normal">
                            {item.product.description}
                          </p>
                        )}
                        <p className="text-xs text-slate-500 font-mono">{item.product.product_code}</p>
                        <p className="text-xs text-slate-400">£{priceNum.toFixed(2)} ex. VAT each</p>
                      </div>
                    </div>

                    {/* Quantity & line total controls */}
                    <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto border-t sm:border-t-0 border-gray-100 pt-3 sm:pt-0">
                      {/* Qty incrementors */}
                      <div className="flex items-center border border-gray-200 bg-gray-50 rounded-lg p-0.5">
                        <button
                          disabled={isPlacingOrder}
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="p-1 hover:bg-gray-200 rounded text-slate-500 hover:text-slate-800 cursor-pointer disabled:opacity-50"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-xs font-bold text-slate-800 w-8 text-center font-mono">
                          {item.quantity}
                        </span>
                        <button
                          disabled={isPlacingOrder || item.quantity >= item.product.quantity}
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="p-1 hover:bg-gray-200 rounded text-slate-500 hover:text-slate-800 cursor-pointer disabled:opacity-50"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Line Total Price & Delete */}
                      <div className="flex items-center gap-4">
                        <span className="text-base font-extrabold text-slate-900 w-28 text-right font-mono flex items-baseline justify-end gap-1">
                          £{lineTotal.toFixed(2)}
                          <span className="text-[10px] text-slate-500 font-normal normal-case">ex. VAT</span>
                        </span>
                        <button
                          disabled={isPlacingOrder}
                          onClick={() => removeItem(item.product.id)}
                          className="p-2 text-slate-400 hover:text-red-650 hover:bg-red-50 rounded-lg transition-all cursor-pointer disabled:opacity-50"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Checkout Form & Summary */}
            <div className="bg-white border border-gray-200 rounded-3xl p-6 space-y-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-955 border-b border-gray-100 pb-3 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-teal-600" />
                Order Summary
              </h3>

              {/* Customer Reference */}
              <div className="space-y-2">
                <label htmlFor="ref" className="text-xs font-bold text-slate-650 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-teal-600" />
                  Customer Reference (PO Ref)
                </label>
                <input
                  id="ref"
                  type="text"
                  disabled={isPlacingOrder}
                  placeholder="e.g. PO-10294-A"
                  value={customerReference}
                  onChange={(e) => setCustomerReference(e.target.value)}
                  className="w-full py-2.5 px-3 border border-gray-300 bg-white text-slate-900 placeholder-gray-405 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all text-sm font-mono"
                />
              </div>

              {/* Total calculations */}
              <div className="space-y-3 pt-2">
                <div className="flex justify-between text-sm text-slate-505">
                  <span>Subtotal</span>
                  <span className="font-mono text-slate-900 font-bold">£{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-505">
                  <span>VAT (20%)</span>
                  <span className="font-mono text-slate-900 font-bold">£{(subtotal * 0.20).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base font-extrabold text-slate-950 border-t border-gray-200 pt-3">
                  <span>Total Price</span>
                  <span className="font-mono text-teal-600">£{(subtotal * 1.20).toFixed(2)}</span>
                </div>
              </div>

              {/* Place Order CTA */}
              <button
                onClick={handlePlaceOrder}
                disabled={isPlacingOrder || items.length === 0 || !user.is_approved}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-teal-600 hover:bg-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm cursor-pointer"
              >
                {isPlacingOrder ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Placing Order...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    Place Order
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
