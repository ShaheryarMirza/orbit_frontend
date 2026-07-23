"use client";

import React, { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import {
  Loader2,
  ArrowLeft,
  Calendar,
  AlertCircle,
  Building2,
  Phone,
  MapPin,
  ShoppingBag,
  Briefcase,
  FileText
} from "lucide-react";

interface OrderDetail {
  order: {
    id: number;
    order_number: string | null;
    status: "placed" | "cancelled";
    created_at: string;
    created_by_role: string;
    created_by_user_id: number;
    customer_reference: string | null;
    subtotal: string | number;
    discount_type: string | null;
    discount_value: string | number | null;
    discount_amount: string | number;
    final_total: string | number;
    total_vat: string | number;
    sage_sync_status: "pending" | "processing" | "synced" | "failed";
    salesperson_id: number | null;
    sage_order_number: string | null;
    sync_notes: string | null;
  };
  shop: {
    id: number;
    company_name: string;
    phone_number: string;
    address: string;
    postcode: string;
    city: string;
  };
  items: Array<{
    product_code: string;
    product_name: string;
    unit_price: string | number;
    quantity: number;
    line_total: string | number;
    vat_rate: number;
    vat_amount: number;
  }>;
}

export default function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user, isAuthenticated, initialize } = useAuthStore();
  const router = useRouter();

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [orderDetail, setOrderDetail] = useState<OrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isActioning, setIsActioning] = useState(false);

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

  // 2. Fetch Order Details
  const fetchOrderDetail = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get(`/orders/${id}/sales-order-detail`);
      setOrderDetail(res.data);
    } catch (err: any) {
      console.error(err);
      if (err.response?.status === 403) {
        setError("You do not have permission to view this order.");
      } else if (err.response?.status === 404) {
        setError("Order not found.");
      } else {
        setError("Failed to fetch order details. Please check server connection.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isCheckingAuth && isAuthenticated) {
      fetchOrderDetail();
    }
  }, [isCheckingAuth, isAuthenticated, id]);

  const handleCancelOrder = async () => {
    if (!confirm("Are you sure you want to cancel this order?")) return;
    setIsActioning(true);
    try {
      await api.patch(`/orders/${id}/cancel`);
      alert("Order cancelled successfully!");
      fetchOrderDetail();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.detail || "Failed to cancel order.");
    } finally {
      setIsActioning(false);
    }
  };

  const handleRetrySync = async () => {
    setIsActioning(true);
    try {
      await api.patch(`/orders/${id}/retry-sage-sync`);
      alert("Sage sync status reset to pending successfully!");
      fetchOrderDetail();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.detail || "Failed to retry Sage sync.");
    } finally {
      setIsActioning(false);
    }
  };

  if (isCheckingAuth || !isAuthenticated) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] gap-4 bg-gray-50 text-slate-800">
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
        <p className="text-slate-500 text-sm font-semibold">Verifying credentials...</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] gap-4 bg-gray-50 text-slate-800">
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
        <p className="text-slate-500 text-sm font-semibold">Retrieving order details...</p>
      </div>
    );
  }

  if (error || !orderDetail) {
    return (
      <div className="flex-1 bg-gray-50 text-slate-800 min-h-screen py-12 px-4">
        <div className="max-w-3xl mx-auto space-y-6">
          <Link
            href="/orders"
            className="inline-flex items-center gap-1.5 text-xs text-teal-600 hover:text-teal-700 font-bold uppercase tracking-wider transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Orders
          </Link>
          <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 text-rose-700 p-6 rounded-2xl">
            <AlertCircle className="w-6 h-6 shrink-0" />
            <div className="font-bold">{error || "Could not retrieve order detail."}</div>
          </div>
        </div>
      </div>
    );
  }

  const { order, shop, items } = orderDetail;

  const formattedDate = new Date(order.created_at).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  const subtotalVal = typeof order.subtotal === "string" ? parseFloat(order.subtotal) : order.subtotal;
  const discountAmountVal = typeof order.discount_amount === "string" ? parseFloat(order.discount_amount) : order.discount_amount;
  const finalTotalVal = typeof order.final_total === "string" ? parseFloat(order.final_total) : order.final_total;
  const totalVatVal = typeof order.total_vat === "string" ? parseFloat(order.total_vat) : (order.total_vat || 0);
  const totalPriceVal = finalTotalVal + totalVatVal;

  return (
    <div className="flex-1 bg-gray-50 text-slate-800 min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Back Link & Title */}
        <div className="flex flex-col gap-4 border-b border-gray-200 pb-6">
          <Link
            href="/orders"
            className="inline-flex items-center gap-1.5 text-xs text-teal-600 hover:text-teal-700 font-semibold uppercase tracking-wider transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Orders
          </Link>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  Order <span className="text-teal-600">{order.order_number || `SO-PEND-${order.id}`}</span>
                  {order.sage_order_number && (
                    <span className="text-xs bg-gray-150 text-slate-700 ml-3 px-2.5 py-1 rounded font-mono border border-gray-300">
                      Sage Ref: {order.sage_order_number}
                    </span>
                  )}
                </h1>
                {order.created_by_role === "salesperson" && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-0.5 rounded-full">
                    <Briefcase className="w-3 h-3" />
                    Salesperson Assisted
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span>Placed on {formattedDate}</span>
              </div>
            </div>

            {/* Badges container */}
            <div className="flex items-center gap-3">
              {/* Order Status */}
              {order.status === "placed" ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Placed
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                  Cancelled
                </span>
              )}

              {/* Sage Sync status */}
              {order.sage_sync_status === "pending" && (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                  Sage Sync: Pending
                </span>
              )}
              {order.sage_sync_status === "processing" && (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded bg-blue-55 text-blue-700 border border-blue-200">
                  Sage Sync: Processing
                </span>
              )}
              {order.sage_sync_status === "synced" && (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Sage Sync: Synced
                </span>
              )}
              {order.sage_sync_status === "failed" && (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                  Sage Sync: Failed
                </span>
              )}
            </div>
          </div>

          {order.sage_sync_status === "failed" && order.sync_notes && (
            <div className="flex items-start gap-3 bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Sage Synchronization Failure:</p>
                <p className="mt-1 font-mono text-xs leading-relaxed">{order.sync_notes}</p>
              </div>
            </div>
          )}
        </div>

        {/* Customer Info & Order Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Shop Card */}
          <div className="md:col-span-2 bg-white border border-gray-200 rounded-2xl p-6 space-y-4 shadow-sm">
            <h3 className="text-lg font-bold text-slate-950 flex items-center gap-2 border-b border-gray-100 pb-3">
              <Building2 className="w-5 h-5 text-teal-600" />
              Customer Information
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="space-y-1.5">
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Registered Shop</span>
                <p className="text-slate-900 font-bold text-base">{shop.company_name}</p>
                <p className="text-xs text-slate-500 font-mono">Shop ID: {shop.id}</p>
              </div>
              <div className="space-y-1.5">
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Contact Number</span>
                <p className="text-slate-700 font-mono flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-gray-400" />
                  {shop.phone_number}
                </p>
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Billing Address</span>
                <p className="text-slate-700 flex items-start gap-1.5">
                  <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                  <span>{shop.address}, {shop.city}, {shop.postcode}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Reference Card */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-6 shadow-sm flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-950 flex items-center gap-2 border-b border-gray-100 pb-3">
                <FileText className="w-5 h-5 text-teal-600" />
                References
              </h3>
              
              <div className="space-y-3 text-sm">
                <div className="space-y-1">
                  <span className="text-xs text-slate-505 font-bold uppercase tracking-wider">PO Reference</span>
                  <p className="text-slate-800 font-mono font-semibold">{order.customer_reference || <span className="text-slate-400 italic font-normal">None Provided</span>}</p>
                </div>
                {user?.role !== "shop_owner" && (
                  <div className="space-y-1">
                    <span className="text-xs text-slate-505 font-bold uppercase tracking-wider">Placed By User ID</span>
                    <p className="text-slate-800 font-mono">ID: {order.created_by_user_id}</p>
                  </div>
                )}
              </div>
            </div>

            {order.status === "placed" && (
              <div className="border-t border-gray-200 pt-4 space-y-3">
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Order Actions</span>
                <div className="flex flex-col gap-2">
                  {(user?.role === "admin" || user?.role === "root_admin") && order.sage_sync_status === "failed" && (
                    <button
                      onClick={handleRetrySync}
                      disabled={isActioning}
                      className="w-full inline-flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-white bg-teal-600 hover:bg-teal-700 text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isActioning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Retry Sage Sync"}
                    </button>
                  )}
                  {(user?.role === "admin" || user?.role === "root_admin" || (user?.role === "salesperson" && order.salesperson_id === user.id) || user?.role === "shop_owner") && (
                    <button
                      onClick={handleCancelOrder}
                      disabled={isActioning}
                      className="w-full inline-flex items-center justify-center gap-2 py-2 px-4 rounded-xl border border-gray-300 hover:border-rose-500 hover:bg-rose-50 text-slate-700 hover:text-rose-600 text-xs font-bold transition-all cursor-pointer disabled:opacity-50 shadow-xs"
                    >
                      {isActioning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Cancel Order"}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Line Items Table */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-5 border-b border-gray-100 bg-gray-50/50">
            <h3 className="text-lg font-bold text-slate-950 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-teal-600" />
              Order Items
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-slate-505 text-xs font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-6">Product Code</th>
                  <th className="py-3.5 px-6">Product Name</th>
                  <th className="py-3.5 px-6 text-right">Unit Price</th>
                  <th className="py-3.5 px-6 text-center">Quantity</th>
                  <th className="py-3.5 px-6 text-center">VAT Rate</th>
                  <th className="py-3.5 px-6 text-right">Line Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {items.map((item, index) => {
                  const price = typeof item.unit_price === "string" ? parseFloat(item.unit_price) : item.unit_price;
                  const total = typeof item.line_total === "string" ? parseFloat(item.line_total) : item.line_total;

                  return (
                    <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-4 px-6 font-mono text-slate-500 text-xs">{item.product_code}</td>
                      <td className="py-4 px-6 font-bold text-slate-900">{item.product_name}</td>
                      <td className="py-4 px-6 text-right font-mono text-slate-700">£{price.toFixed(2)}</td>
                      <td className="py-4 px-6 text-center font-bold text-slate-700">{item.quantity}</td>
                      <td className="py-4 px-6 text-center font-mono text-slate-700">{item.vat_rate !== undefined ? `${item.vat_rate}%` : "20%"}</td>
                      <td className="py-4 px-6 text-right font-mono font-bold text-slate-950">£{total.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Totals panel */}
          <div className="bg-gray-50/50 p-6 flex flex-col items-end border-t border-gray-200 space-y-3.5 text-sm">
            <div className="flex justify-between w-64 text-slate-500">
              <span>Subtotal</span>
              <span className="font-mono text-slate-900">£{subtotalVal.toFixed(2)}</span>
            </div>
            
            {order.discount_type && (
              <div className="flex justify-between w-64 text-rose-600 font-semibold">
                <span>
                  Discount ({order.discount_type === "percentage" ? `${order.discount_value}%` : `Fixed`})
                </span>
                <span className="font-mono">-£{discountAmountVal.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between w-64 text-slate-550">
              <span>VAT</span>
              <span className="font-mono text-slate-900">£{totalVatVal.toFixed(2)}</span>
            </div>

            <div className="flex justify-between w-64 text-base font-extrabold text-slate-950 border-t border-gray-200 pt-3">
              <span>Total Price</span>
              <span className="font-mono text-teal-600">£{totalPriceVal.toFixed(2)}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
