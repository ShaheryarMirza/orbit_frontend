"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import {
  Loader2,
  User as UserIcon,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Building,
  Phone,
  MapPin
} from "lucide-react";

export default function ProfilePage() {
  const { user, isAuthenticated, initialize } = useAuthStore();
  const router = useRouter();

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [telephone2, setTelephone2] = useState("");
  const [telephone3, setTelephone3] = useState("");
  const [address, setAddress] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [postcode, setPostcode] = useState("");
  const [country, setCountry] = useState("");
  const [accountRef, setAccountRef] = useState("");

  // Notifications
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // 1. Auth Guard
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

  // 2. Fetch Profile Details
  useEffect(() => {
    if (!isAuthenticated || user?.role !== "shop_owner") return;

    const fetchProfile = async () => {
      try {
        const res = await api.get("/shops/me");
        const shop = res.data;
        setCompanyName(shop.company_name || "");
        setContactName(shop.contact_name || "");
        setEmail(user.email || "");
        setPhoneNumber(shop.phone_number || "");
        setTelephone2(shop.telephone_2 || "");
        setTelephone3(shop.telephone_3 || "");
        setAddress(shop.address || "");
        setAddressLine2(shop.address_line_2 || "");
        setCity(shop.city || "");
        setPostcode(shop.postcode || "");
        setCountry(shop.country || "");
        setAccountRef(shop.account_ref || "");
      } catch (err: any) {
        console.error(err);
        setError("Failed to retrieve profile data.");
      } finally {
        setIsLoadingProfile(false);
      }
    };

    fetchProfile();
  }, [isAuthenticated, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    const payload = {
      company_name: companyName.trim(),
      contact_name: contactName.trim(),
      email: email.trim().toLowerCase(),
      address: address.trim(),
      address_line_2: addressLine2.trim() || null,
      postcode: postcode.trim(),
      city: city.trim(),
      country: country.trim(),
      phone_number: phoneNumber.trim(),
      telephone_2: telephone2.trim() || null,
      telephone_3: telephone3.trim() || null,
    };

    try {
      await api.patch("/shops/profile", payload);
      setSuccess("Profile settings successfully updated!");
      
      // Update local storage user state to match new email/name
      if (user) {
        const updatedUser = { ...user, email: payload.email, name: payload.contact_name };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        initialize(); // Reload the zustand store from localStorage
      }
    } catch (err: any) {
      console.error(err);
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError("Failed to update profile. Please verify your details and try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isCheckingAuth || !isAuthenticated || user?.role !== "shop_owner" || isLoadingProfile) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] gap-4 bg-gray-50 text-slate-800">
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
        <p className="text-slate-500 text-sm">Verifying profile credentials...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50 text-slate-800 min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Back navigation */}
        <Link
          href="/shop"
          className="inline-flex items-center gap-1.5 text-xs text-slate-505 hover:text-teal-600 font-semibold uppercase tracking-wider transition-colors mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Catalog
        </Link>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm space-y-8 relative overflow-hidden">
          
          <div className="text-center space-y-2 pb-2 border-b border-gray-100">
            <div className="inline-flex items-center justify-center p-3 bg-teal-500/10 rounded-2xl border border-teal-500/20 mb-2">
              <UserIcon className="w-8 h-8 text-teal-650" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Account Details</h1>
            <p className="text-slate-500 text-xs">Manage company details, contact person, and addresses</p>
          </div>

          {/* Success Banner */}
          {success && (
            <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl text-sm">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-605" />
              <span>{success}</span>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-605" />
              <span>{error}</span>
            </div>
          )}

          {/* Grid Layout fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Section 1: Identity */}
            <div className="space-y-4 md:col-span-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-teal-650" />
                Company Identity
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="company_name" className="text-xs font-bold text-slate-600">Company Name</label>
                  <input
                    id="company_name"
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full py-2.5 px-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="account_ref" className="text-xs font-bold text-slate-600">Sage Account Reference</label>
                  <input
                    id="account_ref"
                    type="text"
                    disabled
                    value={accountRef}
                    className="w-full py-2.5 px-3 border border-gray-205 bg-gray-100 text-slate-500 rounded-xl text-sm font-mono font-bold cursor-not-allowed"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="contact_name" className="text-xs font-bold text-slate-600">Contact Person Name</label>
                  <input
                    id="contact_name"
                    type="text"
                    required
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="w-full py-2.5 px-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-xs font-bold text-slate-600">Email Address</label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full py-2.5 px-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Contact Telephones */}
            <div className="space-y-4 md:col-span-2 pt-2 border-t border-gray-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-teal-650" />
                Contact Phone Numbers
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="phone_number" className="text-xs font-bold text-slate-600">Telephone 1</label>
                  <input
                    id="phone_number"
                    type="text"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full py-2.5 px-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="telephone_2" className="text-xs font-bold text-slate-600">Telephone 2 (Optional)</label>
                  <input
                    id="telephone_2"
                    type="text"
                    placeholder="e.g. 020 9876 5432"
                    value={telephone2}
                    onChange={(e) => setTelephone2(e.target.value)}
                    className="w-full py-2.5 px-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="telephone_3" className="text-xs font-bold text-slate-600">Telephone 3 (Optional)</label>
                  <input
                    id="telephone_3"
                    type="text"
                    placeholder="e.g. Mobile number"
                    value={telephone3}
                    onChange={(e) => setTelephone3(e.target.value)}
                    className="w-full py-2.5 px-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Address Details */}
            <div className="space-y-4 md:col-span-2 pt-2 border-t border-gray-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-teal-650" />
                Address Details
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 md:col-span-2">
                  <label htmlFor="address" className="text-xs font-bold text-slate-600">Address Line 1</label>
                  <input
                    id="address"
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full py-2.5 px-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm font-medium"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label htmlFor="address_line_2" className="text-xs font-bold text-slate-600">Address Line 2 (Optional)</label>
                  <input
                    id="address_line_2"
                    type="text"
                    value={addressLine2}
                    onChange={(e) => setAddressLine2(e.target.value)}
                    className="w-full py-2.5 px-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="city" className="text-xs font-bold text-slate-600">Town / City</label>
                  <input
                    id="city"
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full py-2.5 px-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="postcode" className="text-xs font-bold text-slate-600">Postcode</label>
                  <input
                    id="postcode"
                    type="text"
                    required
                    value={postcode}
                    onChange={(e) => setPostcode(e.target.value)}
                    className="w-full py-2.5 px-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm font-medium"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label htmlFor="country" className="text-xs font-bold text-slate-600">Country</label>
                  <input
                    id="country"
                    type="text"
                    required
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full py-2.5 px-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm font-medium"
                  />
                </div>
              </div>
            </div>

          </div>

          {/* Submit CTA */}
          <div className="pt-4 border-t border-gray-100 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 py-3 px-8 rounded-xl text-white bg-teal-600 hover:bg-teal-700 transition-all text-sm font-bold shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving Details...
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
