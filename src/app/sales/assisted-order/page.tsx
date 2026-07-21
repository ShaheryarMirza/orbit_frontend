"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import {
  Loader2,
  Plus,
  Trash2,
  Briefcase,
  AlertCircle,
  CheckCircle2,
  Building,
  Package,
  Percent,
  FileText
} from "lucide-react";

interface Shop {
  id: number;
  company_name: string;
  city: string;
  phone_number: string;
  approval_status: string;
  account_ref?: string | null;
}

interface Product {
  id: number;
  product_code: string;
  product_name: string;
  price: string | number;
  quantity: number; // stock qty
}

interface OrderItemRow {
  product_id: number;
  quantity: number;
  vat_rate: number;
}

export default function AssistedOrderPage() {
  const { user, isAuthenticated, initialize } = useAuthStore();
  const router = useRouter();

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [shops, setShops] = useState<Shop[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [selectedShopId, setSelectedShopId] = useState<number | "">("");
  const [itemRows, setItemRows] = useState<OrderItemRow[]>([{ product_id: 0, quantity: 1, vat_rate: 20 }]);
  const [discountType, setDiscountType] = useState<"fixed" | "percentage" | "">("");
  const [discountValue, setDiscountValue] = useState<number | "">("");
  const [customerReference, setCustomerReference] = useState("");
  const [internalNotes, setInternalNotes] = useState("");

  // 1. Auth Guard - Admin & Salesperson only
  useEffect(() => {
    initialize();
    setIsCheckingAuth(false);
  }, [initialize]);

  useEffect(() => {
    if (isCheckingAuth) return;

    if (!isAuthenticated) {
      router.push("/login");
    } else if (user?.role !== "admin" && user?.role !== "salesperson") {
      router.push("/");
    }
  }, [isCheckingAuth, isAuthenticated, user, router]);

  // 2. Fetch Dropdowns Data
  const loadFormData = async () => {
    setIsLoadingData(true);
    setError(null);
    try {
      const [shopsRes, productsRes] = await Promise.all([
        api.get("/admin/shops", { params: { page_size: 100, approval_status: "approved" } }),
        api.get("/products", { params: { page_size: 100, is_active: true } })
      ]);
      setShops(shopsRes.data.items || []);
      setProducts(productsRes.data.items || []);
    } catch (err: any) {
      console.error(err);
      setError("Failed to load approved shops or active products. Check server connection.");
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    if (!isCheckingAuth && isAuthenticated && (user?.role === "admin" || user?.role === "salesperson")) {
      loadFormData();
    }
  }, [isCheckingAuth, isAuthenticated, user]);

  // 3. Dynamic row manipulators
  const handleAddRow = () => {
    setItemRows((prev) => [...prev, { product_id: 0, quantity: 1, vat_rate: 20 }]);
  };

  const handleRemoveRow = (index: number) => {
    setItemRows((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleRowChange = (index: number, field: keyof OrderItemRow, value: number) => {
    setItemRows((prev) =>
      prev.map((row, idx) => (idx === index ? { ...row, [field]: value } : row))
    );
  };

  // 4. Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedShopId) {
      setError("Please select a registered shop.");
      return;
    }

    // Filter out rows with no product selected
    const validRows = itemRows.filter((row) => row.product_id > 0);
    if (validRows.length === 0) {
      setError("Please add at least one product with quantity.");
      return;
    }

    // Check for duplicate products in lines
    const productIds = validRows.map((row) => row.product_id);
    const hasDuplicates = new Set(productIds).size !== productIds.length;
    if (hasDuplicates) {
      setError("Duplicate products selected. Please merge items or select unique products.");
      return;
    }

    // Removed stock quantity checks for B2B ordering

    setIsSubmitting(true);

    const payload = {
      shop_id: Number(selectedShopId),
      items: validRows.map((row) => ({
        product_id: row.product_id,
        quantity: row.quantity,
        vat_rate: row.vat_rate,
      })),
      discount_type: discountType || null,
      discount_value: discountType ? Number(discountValue) : null,
      customer_reference: customerReference.trim() || null,
      internal_notes: internalNotes.trim() || null,
    };

    try {
      await api.post("/orders/assisted", payload);
      alert("Assisted order created successfully!");
      router.push("/orders");
    } catch (err: any) {
      console.error(err);
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError("Failed to create assisted order. Please check inputs.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate Totals for summary
  const validRowsForTotals = itemRows.filter((row) => row.product_id > 0);
  const calculatedSubtotal = validRowsForTotals.reduce((sum, row) => {
    const product = products.find((p) => p.id === row.product_id);
    const price = product 
      ? (typeof product.price === "string" ? parseFloat(product.price) : product.price)
      : 0;
    return sum + (price * row.quantity);
  }, 0);

  const calculatedDiscount = (() => {
    if (!discountType || !discountValue) return 0;
    if (discountType === "fixed") return Number(discountValue);
    return (calculatedSubtotal * Number(discountValue)) / 100;
  })();

  const calculatedVat = validRowsForTotals.reduce((sum, row) => {
    const product = products.find((p) => p.id === row.product_id);
    const price = product 
      ? (typeof product.price === "string" ? parseFloat(product.price) : product.price)
      : 0;
    const itemTotal = price * row.quantity;
    return sum + (itemTotal * (row.vat_rate / 100));
  }, 0);

  const calculatedTotal = calculatedSubtotal - calculatedDiscount + calculatedVat;

  if (isCheckingAuth || !isAuthenticated || (user?.role !== "admin" && user?.role !== "salesperson")) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] gap-4 bg-gray-50 text-slate-800">
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
        <p className="text-slate-500 text-sm">Verifying salesperson credentials...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50 text-slate-800 min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-gray-200 pb-6">
          <div className="p-3 bg-teal-500/10 rounded-2xl border border-teal-500/20">
            <Briefcase className="w-7 h-7 text-teal-600" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight font-sans">Assisted Order Desk</h1>
            <p className="text-slate-500 text-sm mt-1">Create an assisted sales order on behalf of an approved shop owner</p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {isLoadingData ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
            <p className="text-slate-500 text-sm">Loading available shops and catalogs...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* 1. Shop Selector card */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4 shadow-sm">
              <h3 className="text-base font-bold text-slate-950 flex items-center gap-2 border-b border-gray-100 pb-2">
                <Building className="w-4 h-4 text-teal-600" />
                Select Customer Account
              </h3>
              <div className="space-y-1">
                <label className="text-xs text-slate-600 font-bold uppercase tracking-wider">Approved Shop</label>
                <select
                  required
                  value={selectedShopId}
                  onChange={(e) => setSelectedShopId(e.target.value ? Number(e.target.value) : "")}
                  className="w-full py-3 px-3 border border-gray-300 bg-white text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all text-sm font-sans"
                >
                  <option value="">Select an approved shop...</option>
                  {shops.map((shop) => {
                    const refLabel = shop.account_ref ? ` [${shop.account_ref}]` : "";
                    return (
                      <option key={shop.id} value={shop.id}>
                        {shop.company_name}{refLabel} ({shop.city}) — Phone: {shop.phone_number}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* 2. Products List card */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4 shadow-sm">
              <h3 className="text-base font-bold text-slate-950 flex items-center gap-2 border-b border-gray-100 pb-2">
                <Package className="w-4 h-4 text-teal-600" />
                Catalog Items
              </h3>
              
              <div className="space-y-3">
                {itemRows.map((row, index) => {
                  const selectedProduct = products.find((p) => p.id === row.product_id);
                  const price = selectedProduct 
                    ? (typeof selectedProduct.price === "string" ? parseFloat(selectedProduct.price) : selectedProduct.price)
                    : 0;
                  const rowTotal = price * row.quantity;

                  return (
                    <div
                      key={index}
                      className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 bg-gray-50 p-3 rounded-xl border border-gray-200"
                    >
                      {/* Product Selector */}
                      <div className="flex-1 space-y-1">
                        <select
                          required
                          value={row.product_id || ""}
                          onChange={(e) => handleRowChange(index, "product_id", e.target.value ? Number(e.target.value) : 0)}
                          className="w-full py-2 px-3 border border-gray-300 bg-white text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm font-sans"
                        >
                          <option value="">Select product...</option>
                          {products.map((prod) => (
                            <option key={prod.id} value={prod.id}>
                              [{prod.product_code}] {prod.product_name} — £{parseFloat(prod.price as string).toFixed(2)} (Stock: {prod.quantity})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Quantity Input */}
                      <div className="w-full sm:w-24 space-y-1">
                        <input
                          type="number"
                          min={1}
                          required
                          placeholder="Qty"
                          value={row.quantity || ""}
                          onChange={(e) => handleRowChange(index, "quantity", Number(e.target.value))}
                          className="w-full py-2 px-3 border border-gray-300 bg-white text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm font-mono text-center"
                        />
                      </div>

                      {/* VAT Selector */}
                      <div className="w-full sm:w-28 space-y-1">
                        <select
                          value={row.vat_rate}
                          onChange={(e) => handleRowChange(index, "vat_rate", Number(e.target.value))}
                          className="w-full py-2 px-3 border border-gray-300 bg-white text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm font-sans"
                        >
                          <option value={20}>20% VAT</option>
                          <option value={5}>5% VAT</option>
                          <option value={0}>0% VAT</option>
                        </select>
                      </div>

                      {/* Row Total & Delete button */}
                      <div className="flex items-center justify-between sm:justify-end gap-4">
                        <span className="text-sm font-bold text-slate-800 w-20 text-right font-mono">
                          £{rowTotal.toFixed(2)}
                        </span>
                        
                        <button
                          type="button"
                          disabled={itemRows.length === 1}
                          onClick={() => handleRemoveRow(index)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer disabled:opacity-30 disabled:hover:bg-transparent"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={handleAddRow}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-600 hover:text-teal-700 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add Line Item
              </button>
            </div>

            {/* 3. Discount, Ref & Notes card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Discount panel */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4 shadow-sm">
                <h3 className="text-base font-bold text-slate-950 flex items-center gap-2 border-b border-gray-100 pb-2">
                  <Percent className="w-4 h-4 text-teal-600" />
                  Assisted Order Discount
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-600 font-bold uppercase tracking-wider">Type</label>
                    <select
                      value={discountType}
                      onChange={(e) => {
                        const val = e.target.value as "fixed" | "percentage" | "";
                        setDiscountType(val);
                        if (!val) setDiscountValue("");
                      }}
                      className="w-full py-2.5 px-3 border border-gray-300 bg-white text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm font-sans"
                    >
                      <option value="">None</option>
                      <option value="fixed">Fixed (£)</option>
                      <option value="percentage">Percentage (%)</option>
                    </select>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-xs text-slate-600 font-bold uppercase tracking-wider">Value</label>
                    <input
                      type="number"
                      step="any"
                      min={0}
                      disabled={!discountType}
                      required={!!discountType}
                      placeholder={discountType === "fixed" ? "£0.00" : discountType === "percentage" ? "0%" : "—"}
                      value={discountValue}
                      onChange={(e) => setDiscountValue(e.target.value ? Number(e.target.value) : "")}
                      className="w-full py-2.5 px-3 border border-gray-300 bg-white text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Reference & Notes panel */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4 shadow-sm">
                <h3 className="text-base font-bold text-slate-950 flex items-center gap-2 border-b border-gray-100 pb-2">
                  <FileText className="w-4 h-4 text-teal-600" />
                  Order References & Notes
                </h3>
                
                <div className="space-y-4 text-sm">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-600 font-bold uppercase tracking-wider">Customer PO Ref</label>
                    <input
                      type="text"
                      placeholder="e.g. PO-REF-10948"
                      value={customerReference}
                      onChange={(e) => setCustomerReference(e.target.value)}
                      className="w-full py-2 px-3 border border-gray-300 bg-white text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-600 font-bold uppercase tracking-wider">Internal Notes</label>
                    <textarea
                      placeholder="Enter sales representative notes (not visible to customer)..."
                      value={internalNotes}
                      onChange={(e) => setInternalNotes(e.target.value)}
                      rows={2}
                      className="w-full py-2 px-3 border border-gray-300 bg-white text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm font-sans"
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* 4. Totals Breakdown Card */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col items-end space-y-3.5 text-sm shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 border-b border-gray-100 pb-2 w-64 text-right">
                Financial Summary
              </h3>
              <div className="flex justify-between w-64 text-slate-500">
                <span>Subtotal</span>
                <span className="font-mono text-slate-900">£{calculatedSubtotal.toFixed(2)}</span>
              </div>
              
              {calculatedDiscount > 0 && (
                <div className="flex justify-between w-64 text-rose-600 font-semibold">
                  <span>
                    Discount ({discountType === "percentage" ? `${discountValue}%` : `Fixed`})
                  </span>
                  <span className="font-mono">-£{calculatedDiscount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between w-64 text-slate-505">
                <span>VAT</span>
                <span className="font-mono text-slate-900">£{calculatedVat.toFixed(2)}</span>
              </div>

              <div className="flex justify-between w-64 text-base font-extrabold text-slate-950 border-t border-gray-200 pt-3">
                <span>Total Price</span>
                <span className="font-mono text-teal-600">£{calculatedTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Submission CTA */}
            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 py-3 px-8 border border-transparent text-sm font-bold rounded-xl text-white bg-teal-600 hover:bg-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting Order Desk...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Place Assisted Order
                  </>
                )}
              </button>
            </div>

          </form>
        )}
      </div>
    </div>
  );
}
