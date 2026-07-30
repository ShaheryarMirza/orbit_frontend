"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useCartStore, Product } from "@/store/cartStore";
import { useToastStore } from "@/store/toastStore";
import api, { API_BASE_URL } from "@/lib/api";
import {
  Loader2,
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Sparkles,
  ShoppingBag,
  Info,
  Layers,
  ChevronRight,
  Filter
} from "lucide-react";

interface SubCategory {
  id: number;
  name: string;
  slug: string;
}

interface Category {
  id: number;
  name: string;
  slug: string;
  subcategories: SubCategory[];
}

export default function ShopCatalog() {
  const { user, isAuthenticated, initialize } = useAuthStore();
  const { addItem, items } = useCartStore();
  const router = useRouter();

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [quantities, setQuantities] = useState<{ [key: number]: number }>({});
  const [error, setError] = useState<string | null>(null);

  // Filtering States
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string | null>(null);
  const [selectedSubCategorySlug, setSelectedSubCategorySlug] = useState<string | null>(null);

  // 1. Route Protection & Auth Guard
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

  // 2. Fetch Catalog Products
  const fetchProducts = async (catSlug?: string | null, subSlug?: string | null) => {
    setIsLoadingProducts(true);
    setError(null);
    try {
      const params: any = { is_active: true, page_size: 100000 };
      if (catSlug) params.category_slug = catSlug;
      if (subSlug) params.subcategory_slug = subSlug;

      const res = await api.get("/products", { params });
      const itemsList = res.data.items || [];
      setProducts(itemsList);
      
      // Initialize quantities dictionary to 1 for all products
      const initialQtys: { [key: number]: number } = {};
      itemsList.forEach((prod: Product) => {
        initialQtys[prod.id] = 1;
      });
      setQuantities(initialQtys);
    } catch (err: any) {
      console.error(err);
      setError("Failed to load catalog products. Please check server connection.");
    } finally {
      setIsLoadingProducts(false);
    }
  };

  // 3. Initial load & sync with URL params
  useEffect(() => {
    if (!isCheckingAuth && isAuthenticated && user?.role === "shop_owner") {
      const urlParams = new URLSearchParams(window.location.search);
      const catParam = urlParams.get("category");
      const subParam = urlParams.get("subcategory");

      setSelectedCategorySlug(catParam);
      setSelectedSubCategorySlug(subParam);

      fetchProducts(catParam, subParam);

      // Fetch sidebar categories
      api.get("/api/categories")
        .then((res) => {
          setCategories(res.data || []);
        })
        .catch((err) => {
          console.error("Failed to load catalog categories:", err);
        });
    }
  }, [isCheckingAuth, isAuthenticated, user]);

  // 4. Handle Category selections & url query syncing
  const handleSelectCategory = (catSlug: string | null, subSlug: string | null = null) => {
    setSelectedCategorySlug(catSlug);
    setSelectedSubCategorySlug(subSlug);

    const url = new URL(window.location.href);
    if (catSlug) {
      url.searchParams.set("category", catSlug);
    } else {
      url.searchParams.delete("category");
    }

    if (subSlug) {
      url.searchParams.set("subcategory", subSlug);
    } else {
      url.searchParams.delete("subcategory");
    }

    window.history.pushState({}, "", url.toString());
    fetchProducts(catSlug, subSlug);
  };

  // 5. Handle Quantity Tweaking
  const handleQuantityChange = (productId: number, val: number) => {
    setQuantities((prev) => ({
      ...prev,
      [productId]: Math.max(1, val),
    }));
  };

  const { showToast } = useToastStore();

  // 6. Handle Add to Zustand Cart
  const handleAddToCart = (product: Product) => {
    const qtyToAdd = quantities[product.id] || 1;
    
    addItem(product, qtyToAdd);
    showToast(`${qtyToAdd} x ${product.product_name} added to cart!`, "success");
    
    // Reset selection quantity back to 1
    setQuantities((prev) => ({
      ...prev,
      [product.id]: 1,
    }));
  };

  // Search filter client-side (combined with server-side category filters)
  const filteredProducts = products.filter((prod) =>
    prod.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    prod.product_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (prod.description && prod.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (isCheckingAuth || !isAuthenticated || user?.role !== "shop_owner") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] gap-4 bg-gray-50 text-slate-800">
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
        <p className="text-slate-500 text-sm">Verifying customer credentials...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50 text-slate-800 min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Banner header */}
        <div className="relative overflow-hidden rounded-3xl border border-gray-200 bg-white p-5 sm:p-8 shadow-sm">
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-905 tracking-tight font-sans">Product Catalog</h1>
            </div>
            
            {/* Search inputs */}
            <div className="relative w-full md:max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search products by name or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 sm:py-3 border border-gray-300 bg-white text-slate-900 placeholder-gray-405 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all text-sm"
              />
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl text-sm">
            <Info className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Mobile Horizontal Categories Bar */}
        <div className="lg:hidden bg-white border border-gray-200 rounded-2xl p-3 shadow-sm">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => handleSelectCategory(null, null)}
              className={`shrink-0 py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                !selectedCategorySlug
                  ? "bg-teal-600 text-white shadow-xs"
                  : "bg-gray-100 text-slate-700 hover:bg-gray-200"
              }`}
            >
              All Products
            </button>
            {categories.map((cat) => {
              const isCatSelected = selectedCategorySlug === cat.slug;
              return (
                <button
                  key={cat.id}
                  onClick={() => handleSelectCategory(cat.slug, null)}
                  className={`shrink-0 py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isCatSelected
                      ? "bg-teal-600 text-white shadow-xs"
                      : "bg-gray-100 text-slate-700 hover:bg-gray-200"
                  }`}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Two-Column Layout (Sidebar filter + Products Catalog Grid) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* 1. Categories Sidebar (Left Column - Desktop) */}
          <div className="hidden lg:block lg:col-span-3 space-y-6">
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-2">
                <Filter className="w-4 h-4 text-teal-600" />
                Filter by Category
              </h3>
              
              <div className="space-y-1.5">
                {/* Clear Filter Button */}
                <button
                  onClick={() => handleSelectCategory(null, null)}
                  className={`w-full text-left py-2 px-3 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                    !selectedCategorySlug
                      ? "bg-teal-50 text-teal-700 border border-teal-200"
                      : "text-slate-600 hover:text-teal-600 hover:bg-gray-50 border border-transparent"
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  All Products
                </button>

                {categories.map((cat) => {
                  const isCatSelected = selectedCategorySlug === cat.slug;
                  return (
                    <div key={cat.id} className="space-y-1">
                      <button
                        onClick={() => handleSelectCategory(cat.slug, null)}
                        className={`w-full text-left py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                          isCatSelected && !selectedSubCategorySlug
                            ? "bg-teal-55 text-teal-700 border border-teal-200 font-bold"
                            : isCatSelected
                            ? "text-teal-600 font-bold"
                            : "text-slate-600 hover:text-teal-650 hover:bg-gray-50/50"
                        }`}
                      >
                        <span>{cat.name}</span>
                        {cat.subcategories.length > 0 && (
                          <ChevronRight className={`w-3 h-3 transition-transform ${isCatSelected ? "rotate-90 text-teal-600" : "text-gray-400"}`} />
                        )}
                      </button>

                      {/* Subcategories (Indented & expanded if parent is selected) */}
                      {isCatSelected && cat.subcategories.length > 0 && (
                        <div className="pl-4 py-1 space-y-1 border-l border-gray-200 ml-3">
                          {cat.subcategories.map((sub) => {
                            const isSubSelected = selectedSubCategorySlug === sub.slug;
                            return (
                              <button
                                key={sub.id}
                                onClick={() => handleSelectCategory(cat.slug, sub.slug)}
                                className={`w-full text-left py-1.5 px-3 rounded-md text-[11px] font-semibold block transition-all cursor-pointer ${
                                  isSubSelected
                                    ? "bg-teal-50 text-teal-700 font-bold border border-teal-200"
                                    : "text-slate-500 hover:text-teal-600 hover:bg-gray-50/50"
                                }`}
                              >
                                {sub.name}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 2. Product Grid (Right Column - 9 cols, 5 cards per row on lg/xl) */}
          <div className="lg:col-span-9">
            {isLoadingProducts ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                  <div key={n} className="bg-white border border-gray-200 rounded-2xl p-3 space-y-3 animate-pulse">
                    <div className="aspect-square w-full bg-gray-100 rounded-xl" />
                    <div className="h-3 bg-gray-100 rounded w-2/3" />
                    <div className="h-4 bg-gray-100 rounded w-full" />
                    <div className="h-4 bg-gray-100 rounded w-1/2" />
                    <div className="h-8 bg-gray-100 rounded w-full" />
                  </div>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-gray-300 rounded-3xl bg-white">
                <ShoppingBag className="w-16 h-16 text-gray-300 mb-4" />
                <h3 className="text-xl font-bold text-slate-805 animate-none">No products found</h3>
                <p className="text-slate-400 text-sm max-w-sm mt-1">
                  Try adjusting your search query or choosing another product category.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
                {filteredProducts.map((product) => {
                  const currentQty = quantities[product.id] || 1;
                  const priceNum = typeof product.price === "string" ? parseFloat(product.price) : product.price;
                  const vatRateVal = product.vat_rate !== undefined ? product.vat_rate : 20.0;
                  const priceIncVat = priceNum * (1 + vatRateVal / 100);

                  return (
                    <div
                      key={product.id}
                      className="group bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div>
                        {/* Fixed-Aspect-Ratio Image Container with Object-Contain */}
                        <div className="aspect-square bg-gray-50/80 flex items-center justify-center p-3 overflow-hidden border-b border-gray-100 relative">
                          {product.image_url ? (
                            <img
                              src={product.image_url.startsWith("http") ? product.image_url : (API_BASE_URL + product.image_url)}
                              alt={product.product_name}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center text-gray-400 space-y-1">
                              <ShoppingBag className="w-8 h-8 stroke-[1.5]" />
                              <span className="text-[9px] font-bold uppercase font-mono tracking-wider bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                                {product.product_code}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Product Info */}
                        <div className="p-3 space-y-1">
                          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider font-mono">
                            {product.product_code}
                          </span>
                          <h3 className="text-xs font-extrabold text-slate-900 leading-snug line-clamp-2" title={product.product_name}>
                            {product.product_name}
                          </h3>
                        </div>
                      </div>

                      {/* Pricing & Add to Cart Controls */}
                      <div className="p-3 pt-0 space-y-2">
                        <div className="flex flex-col gap-0.5 border-t border-gray-100 pt-2">
                          <span className="text-sm font-extrabold text-slate-900 flex items-baseline gap-1 font-mono">
                            £{priceNum.toFixed(2)}
                            <span className="text-[9px] text-slate-500 font-normal normal-case">ex. VAT</span>
                          </span>
                          <span className="text-[10px] text-teal-600 font-bold font-mono">
                            £{priceIncVat.toFixed(2)} <span className="text-[9px] text-teal-500 font-normal">inc. VAT</span>
                          </span>
                        </div>

                        {/* Qty Selector & Add Button */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between border border-gray-200 bg-gray-50 rounded-lg p-0.5">
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(product.id, currentQty - 1)}
                              className="p-1 hover:bg-gray-200 rounded text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-xs font-bold text-slate-800 w-6 text-center font-mono">
                              {currentQty}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(product.id, currentQty + 1)}
                              className="p-1 hover:bg-gray-200 rounded text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleAddToCart(product)}
                            className="w-full flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-white bg-teal-600 hover:bg-teal-700 text-[11px] font-bold shadow-xs transition-all cursor-pointer"
                          >
                            <Plus className="w-3 h-3" /> Add to Cart
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
