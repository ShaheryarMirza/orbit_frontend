"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import {
  Loader2,
  FileSpreadsheet,
  Calendar,
  AlertCircle,
  RefreshCw,
  Eye,
  Briefcase
} from "lucide-react";

interface Salesperson {
  id: number;
  name: string;
  email: string;
}

interface Order {
  id: number;
  order_number: string | null;
  shop_id: number;
  created_by_user_id: number;
  created_by_role: string;
  salesperson_id: number | null;
  customer_reference: string | null;
  subtotal: string | number;
  discount_type: string | null;
  discount_value: string | number | null;
  discount_amount: string | number;
  final_total: string | number;
  status: "placed" | "cancelled";
  sage_sales_order_id: string | null;
  sage_sync_status: "pending" | "processing" | "synced" | "failed";
  created_at: string;
  salesperson: Salesperson | null;
}

export default function OrderHistoryPage() {
  const { user, isAuthenticated, initialize } = useAuthStore();
  const router = useRouter();

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  // 2. Fetch Orders
  const fetchOrders = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get("/orders", {
        params: { page_size: 100 }
      });
      setOrders(res.data.items || []);
    } catch (err: any) {
      console.error(err);
      setError("Failed to fetch order history. Please check connection to server.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isCheckingAuth && isAuthenticated) {
      fetchOrders();
    }
  }, [isCheckingAuth, isAuthenticated]);

  if (isCheckingAuth || !isAuthenticated) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] gap-4 bg-gray-50 text-slate-800">
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
        <p className="text-slate-500 text-sm">Verifying credentials...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50 text-slate-800 min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 pb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-teal-500/10 rounded-2xl border border-teal-500/20">
              <FileSpreadsheet className="w-7 h-7 text-teal-600" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Order History</h1>
              <p className="text-slate-505 text-sm mt-1 font-medium">
                {user?.role === "shop_owner" 
                  ? "View and track orders placed for your shop" 
                  : "View and manage B2B customer orders placed across all shops"}
              </p>
            </div>
          </div>
          <button
            onClick={fetchOrders}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 text-sm font-semibold border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 py-2.5 px-4 rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50 text-slate-700"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Table Container */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <Loader2 className="w-10 h-10 text-teal-600 animate-spin" />
              <p className="text-slate-500 text-sm font-semibold">Retrieving orders list...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-4">
              <FileSpreadsheet className="w-12 h-12 text-slate-300 mb-4" />
              <h3 className="text-lg font-bold text-slate-800">No Orders Found</h3>
              <p className="text-slate-500 text-sm max-w-sm mt-1 mb-6">
                No orders have been recorded in your account history yet.
              </p>
              {user?.role === "shop_owner" && (
                <Link
                  href="/shop"
                  className="inline-flex items-center gap-2 py-2.5 px-5 rounded-xl text-white bg-teal-600 hover:bg-teal-700 text-sm font-bold shadow-sm transition-all"
                >
                  Start Shopping
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                    <th className="py-4 px-6">Order Number</th>
                    <th className="py-4 px-6">Date Placed</th>
                    {user?.role === "admin" && <th className="py-4 px-6">Salesperson</th>}
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6">Sage Sync Status</th>
                    <th className="py-4 px-6">Final Total</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {orders.map((order) => {
                    const formattedDate = new Date(order.created_at).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    });
                    const finalTotalVal = typeof order.final_total === "string" 
                      ? parseFloat(order.final_total) 
                      : order.final_total;

                    return (
                      <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                        
                        {/* Order Number & Details */}
                        <td className="py-4.5 px-6 font-semibold text-slate-900">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-teal-600">{order.order_number || `SO-PEND-${order.id}`}</span>
                            {order.customer_reference && (
                              <span className="text-[10px] bg-gray-100 text-slate-500 px-2 py-0.5 rounded font-mono border border-gray-200">
                                Ref: {order.customer_reference}
                              </span>
                            )}
                            {order.created_by_role === "salesperson" && (
                              <span className="inline-flex items-center gap-0.5 text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.5 rounded">
                                <Briefcase className="w-2.5 h-2.5" />
                                Assisted
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Date */}
                        <td className="py-4.5 px-6 text-slate-700">
                          <div className="flex items-center gap-1.5 text-xs font-semibold">
                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                            <span>{formattedDate}</span>
                          </div>
                        </td>

                        {/* Salesperson (Admin only) */}
                        {user?.role === "admin" && (
                          <td className="py-4.5 px-6 text-slate-700">
                            {order.salesperson ? (
                              <span className="text-xs text-indigo-700 font-bold">
                                {order.salesperson.name}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400 italic">
                                Direct Purchase
                              </span>
                            )}
                          </td>
                        )}

                        {/* Order Status */}
                        <td className="py-4.5 px-6">
                          {order.status === "placed" ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Placed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded bg-rose-50 text-rose-700 border border-rose-200">
                              Cancelled
                            </span>
                          )}
                        </td>

                        {/* Sage Sync Status */}
                        <td className="py-4.5 px-6">
                          {order.sage_sync_status === "pending" && (
                            <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded bg-amber-50 text-amber-700 border border-amber-200">
                              Pending
                            </span>
                          )}
                          {order.sage_sync_status === "processing" && (
                            <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200">
                              Processing
                            </span>
                          )}
                          {order.sage_sync_status === "synced" && (
                            <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Synced
                            </span>
                          )}
                          {order.sage_sync_status === "failed" && (
                            <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded bg-rose-50 text-rose-700 border border-rose-200">
                              Failed
                            </span>
                          )}
                        </td>

                        {/* Final Total */}
                        <td className="py-4.5 px-6 font-mono font-bold text-slate-905">
                          £{finalTotalVal.toFixed(2)}
                        </td>

                        {/* Actions */}
                        <td className="py-4.5 px-6 text-right">
                          <Link
                            href={`/orders/${order.id}`}
                            className="inline-flex items-center justify-center gap-1 text-xs font-bold border border-gray-300 hover:border-teal-500/40 bg-white hover:bg-teal-50 hover:text-teal-600 py-1.5 px-3 rounded-lg transition-all cursor-pointer shadow-xs"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            View Details
                          </Link>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
