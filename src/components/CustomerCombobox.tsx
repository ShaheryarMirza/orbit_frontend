"use client";

import React, { useState, useRef, useEffect } from "react";
import { Search, Building2, Check, ChevronsUpDown, X, MapPin } from "lucide-react";

export interface Shop {
  id: number;
  company_name: string;
  contact_name?: string | null;
  account_ref?: string | null;
  phone_number?: string | null;
  address?: string | null;
  city?: string | null;
  postcode?: string | null;
  country?: string | null;
  approval_status?: string | null;
  user?: {
    email?: string;
  };
}

interface CustomerComboboxProps {
  shops: Shop[];
  selectedShopId: number | "";
  onSelectShop: (shopId: number | "") => void;
  error?: string | null;
}

export default function CustomerCombobox({
  shops,
  selectedShopId,
  onSelectShop,
  error,
}: CustomerComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Find currently selected shop
  const selectedShop = shops.find((s) => s.id === selectedShopId);

  // Filter shops by Company Name, Account Ref, City, Contact Name, or User Email
  const filteredShops = shops.filter((shop) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const matchCompany = shop.company_name?.toLowerCase().includes(q);
    const matchRef = shop.account_ref?.toLowerCase().includes(q);
    const matchCity = shop.city?.toLowerCase().includes(q);
    const matchContact = shop.contact_name?.toLowerCase().includes(q);
    const matchEmail = shop.user?.email?.toLowerCase().includes(q);

    return matchCompany || matchRef || matchCity || matchContact || matchEmail;
  });

  // Focus search input when popover opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery("");
    }
  }, [isOpen]);

  // Click outside listener to auto-close popover
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full text-left py-2.5 px-3.5 border rounded-xl bg-white transition-all flex items-center justify-between text-xs font-medium cursor-pointer shadow-xs ${
          error
            ? "border-red-400 focus:ring-2 focus:ring-red-400"
            : isOpen
            ? "border-teal-600 ring-2 ring-teal-500/20"
            : "border-gray-300 hover:border-gray-400"
        }`}
      >
        {selectedShop ? (
          <div className="flex items-center gap-2 text-slate-900 truncate">
            <Building2 className="w-4 h-4 text-teal-600 shrink-0" />
            <span className="font-bold">{selectedShop.company_name}</span>
            {selectedShop.account_ref && (
              <span className="px-1.5 py-0.5 bg-teal-50 text-teal-700 border border-teal-200 rounded-md font-mono text-[10px] font-bold">
                {selectedShop.account_ref}
              </span>
            )}
            <span className="text-gray-400 font-normal truncate">
              • {selectedShop.city}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-gray-400">
            <Building2 className="w-4 h-4 text-gray-400 shrink-0" />
            <span>Search company, city, or Ref (e.g. OR349)...</span>
          </div>
        )}

        <div className="flex items-center gap-1">
          {selectedShop && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                onSelectShop("");
                setIsOpen(false);
              }}
              className="p-1 text-gray-400 hover:text-red-500 rounded-md transition-colors"
              title="Clear selection"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronsUpDown className="w-4 h-4 text-gray-400 shrink-0" />
        </div>
      </button>

      {/* Searchable Dropdown Popover */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-80 animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Search Bar Input */}
          <div className="p-2.5 border-b border-gray-100 bg-slate-50/80 flex items-center gap-2">
            <Search className="w-4 h-4 text-teal-600 shrink-0 ml-1" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Type company, city, or Account Ref..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs bg-transparent text-slate-900 placeholder-gray-400 focus:outline-none font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Shop Options List */}
          <div className="overflow-y-auto divide-y divide-gray-50 flex-1 p-1">
            {filteredShops.length === 0 ? (
              <div className="py-6 px-4 text-center text-xs text-gray-400">
                No matching customer accounts found
                {searchQuery && (
                  <span className="block font-semibold text-slate-600 mt-1">
                    "{searchQuery}"
                  </span>
                )}
              </div>
            ) : (
              filteredShops.map((shop) => {
                const isSelected = shop.id === selectedShopId;
                return (
                  <button
                    key={shop.id}
                    type="button"
                    onClick={() => {
                      onSelectShop(shop.id);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left p-2.5 rounded-xl transition-all flex items-start justify-between gap-3 text-xs cursor-pointer ${
                      isSelected
                        ? "bg-teal-50 text-teal-900 font-semibold"
                        : "hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 truncate">
                          {shop.company_name}
                        </span>
                        {shop.account_ref && (
                          <span className="px-1.5 py-0.2 bg-teal-100/70 text-teal-800 rounded font-mono text-[10px] font-bold shrink-0">
                            {shop.account_ref}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-gray-500 font-normal">
                        <span className="flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                          {shop.city}
                        </span>
                        {shop.contact_name && (
                          <span className="truncate">
                            Contact: {shop.contact_name}
                          </span>
                        )}
                      </div>
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4 text-teal-600 shrink-0 mt-1" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
