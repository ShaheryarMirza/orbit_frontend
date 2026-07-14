"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useCartStore, Product } from "@/store/cartStore";
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
      const params: any = { is_active: true, page_size: 100 };
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
  const handleQuantityChange = (productId: number, val: number, maxQty: number) => {
    setQuantities((prev) => ({
      ...prev,
      [productId]: Math.max(1, Math.min(maxQty, val)),
    }));
  };

  // 6. Handle Add to Zustand Cart
  const handleAddToCart = (product: Product) => {
    const qtyToAdd = quantities[product.id] || 1;
    
    // Check stock limits based on cart contents
    const existingCartItem = items.find((item) => item.product.id === product.id);
    const currentCartQty = existingCartItem?.quantity || 0;
    
    if (currentCartQty + qtyToAdd > product.quantity) {
      alert(`Cannot add ${qtyToAdd} items. You already have ${currentCartQty} in cart, and max stock is ${product.quantity}.`);
      return;
    }

    addItem(product, qtyToAdd);
    alert(`${qtyToAdd} x ${product.product_name} added to cart!`);
    
    // Reset selection quantity back to 1
    setQuantities((prev) => ({
      ...prev,
      [product.id]: 1,
    }));
  };

  // Search filter client-side (combined with server-side category filters)
  const filteredProducts = products.filter((prod) =>
    prod.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    prod.product_code.toLowerCase().includes(searchQuery.toLowerCase())
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
        <div className="relative overflow-hidden rounded-3xl border border-gray-200 bg-white p-8 sm:p-12 shadow-sm">
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full text-xs font-bold bg-teal-50 text-teal-600 border border-teal-200">
                <Sparkles className="w-3.5 h-3.5" />
                B2B Catalog Connected to Sage 50
              </span>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-905 tracking-tight font-sans">Product Catalog</h1>
              <p className="text-slate-500 text-sm max-w-xl">
                Browse inventory, check stock levels, and place direct orders synced to your business account.
              </p>
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
                className="w-full pl-11 pr-4 py-3 border border-gray-300 bg-white text-slate-900 placeholder-gray-405 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all text-sm"
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

        {/* Two-Column Layout (Sidebar filter + Products Catalog Grid) */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* 1. Categories Sidebar (Left Column) */}
          <div className="lg:col-span-1 space-y-6">
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

          {/* 2. Product Grid (Right Column) */}
          <div className="lg:col-span-3">
            {isLoadingProducts ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div key={n} className="bg-white border border-gray-200 rounded-2xl p-4 space-y-4 animate-pulse">
                    <div className="aspect-square w-full bg-gray-100 rounded-xl" />
                    <div className="h-4 bg-gray-100 rounded w-2/3" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                    <div className="h-5 bg-gray-100 rounded w-1/3" />
                    <div className="h-10 bg-gray-100 rounded w-full" />
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
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {filteredProducts.map((product) => {
                  const currentQty = quantities[product.id] || 1;
                  const hasStock = product.quantity > 0;
                  const priceNum = typeof product.price === "string" ? parseFloat(product.price) : product.price;

                  return (
                    <div
                      key={product.id}
                      className="group bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm flex flex-col relative"
                    >
                      {/* Stock tag */}
                      <div className="absolute top-3 right-3 z-10">
                        {hasStock ? (
                          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {product.quantity} In Stock
                          </span>
                        ) : (
                          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                            Out of Stock
                          </span>
                        )}
                      </div>

                      {/* Product Image */}
                      <div className="aspect-square bg-gray-50 flex items-center justify-center overflow-hidden border-b border-gray-100 relative">
                        {product.image_url ? (
                           <img
                             src={API_BASE_URL + product.image_url}
                             alt={product.product_name}
                             className="w-full h-full object-cover"
                           />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-gray-400 space-y-2">
                            <ShoppingBag className="w-12 h-12 stroke-[1.5]" />
                            <span className="text-xs font-bold uppercase font-mono tracking-wider bg-gray-100 px-2.5 py-1 rounded-lg border border-gray-200">
                              {product.product_code}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Product info */}
                      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                        <div className="space-y-1">
                          <span className="text-xs text-slate-500 font-bold uppercase tracking-wider font-mono">
                            {product.product_code}
                          </span>
                          <h3 className="text-sm font-extrabold text-slate-900 leading-tight line-clamp-2">
                            {product.product_name}
                          </h3>
                        </div>

                        <div className="space-y-3.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xl font-extrabold text-slate-905 flex items-baseline gap-1 font-mono">
                              £{priceNum.toFixed(2)}
                              <span className="text-[10px] text-slate-500 font-normal normal-case">ex. VAT</span>
                            </span>
                          </div>

                          {/* Quantity Selector & Add to Cart */}
                          {hasStock ? (
                            <div className="space-y-3">
                              {/* Qty controller */}
                              <div className="flex items-center justify-between border border-gray-200 bg-gray-50 rounded-xl p-1">
                                <button
                                  onClick={() => handleQuantityChange(product.id, currentQty - 1, product.quantity)}
                                  className="p-1.5 hover:bg-gray-200 rounded-lg text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                                >
                                  <Minus className="w-4 h-4" />
                                </button>
                                <span className="text-sm font-bold text-slate-800 w-8 text-center font-mono">
                                  {currentQty}
                                </span>
                                <button
                                  onClick={() => handleQuantityChange(product.id, currentQty + 1, product.quantity)}
                                  className="p-1.5 hover:bg-gray-200 rounded-lg text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                              </div>

                              <button
                                onClick={() => handleAddToCart(product)}
                                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-white bg-teal-600 hover:bg-teal-700 text-sm font-bold shadow-sm transition-all cursor-pointer"
                              >
                                <ShoppingCart className="w-4 h-4" />
                                Add to Cart
                              </button>
                            </div>
                          ) : (
                            <button
                              disabled
                              className="w-full py-3 px-4 rounded-xl text-slate-400 bg-gray-100 border border-gray-200 text-sm font-bold cursor-not-allowed opacity-60 font-sans"
                            >
                              Sold Out
                            </button>
                          )}
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
