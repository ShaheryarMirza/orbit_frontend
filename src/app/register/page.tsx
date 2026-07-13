"use client";

import React, { useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { UserPlus, User, Mail, KeyRound, Building, Phone, MapPin, Hash, AlertCircle, CheckCircle, Globe, Printer, Link2 } from "lucide-react";

export default function RegisterPage() {
  // User Details State
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Business Details State
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [postcode, setPostcode] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("GB");
  const [companyRegNumber, setCompanyRegNumber] = useState("");
  const [fax, setFax] = useState("");
  const [website, setWebsite] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    // Build the request payload matching the updated backend schema
    const payload = {
      email: email.trim().toLowerCase(),
      password,
      full_name: fullName.trim(),
      shop: {
        company_name: companyName.trim(),
        phone_number: phone.trim(),
        address: address.trim(),
        address_line_2: addressLine2.trim() || null,
        postcode: postcode.trim(),
        city: city.trim(),
        country: country.trim(),
        company_registration_number: companyRegNumber.trim() || null,
        fax: fax.trim() || null,
        website: website.trim() || null,
      },
    };

    try {
      await api.post("/auth/register", payload);
      setSuccessMessage(
        "Registration successful! Your shop has been created and assigned a customer reference. It is currently pending admin approval."
      );
      
      // Clear form states
      setFullName("");
      setEmail("");
      setPassword("");
      setCompanyName("");
      setPhone("");
      setAddress("");
      setAddressLine2("");
      setPostcode("");
      setCity("");
      setCountry("GB");
      setCompanyRegNumber("");
      setFax("");
      setWebsite("");
    } catch (err: any) {
      console.error(err);
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError("Something went wrong during registration. Please verify details and try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12 bg-gray-50 text-slate-800 min-h-screen">
      <div className="w-full max-w-3xl space-y-8 bg-white border border-gray-200 p-8 rounded-3xl shadow-sm relative overflow-hidden">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <img src="/logo.png" alt="Orbit Food Limited" className="h-20 w-auto object-contain" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Register your shop
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Create a shop owner account to connect with our B2B ordering portal
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="flex items-start gap-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-xl text-sm">
            <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {/* Grid container */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Section 1: User Details */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-teal-600 uppercase tracking-wider border-b border-gray-200 pb-1.5">
                User Credentials
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="full-name" className="text-xs text-slate-600 font-semibold mb-1.5 block">Full Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="full-name"
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="appearance-none rounded-xl relative block w-full pl-10 pr-3 py-3 border border-gray-300 bg-white placeholder-gray-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all text-sm"
                      placeholder="e.g. John Doe"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email-address" className="text-xs text-slate-600 font-semibold mb-1.5 block">Email Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="email-address"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="appearance-none rounded-xl relative block w-full pl-10 pr-3 py-3 border border-gray-300 bg-white placeholder-gray-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all text-sm"
                      placeholder="e.g. contact@business.com"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="text-xs text-slate-600 font-semibold mb-1.5 block">Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <KeyRound className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="appearance-none rounded-xl relative block w-full pl-10 pr-3 py-3 border border-gray-300 bg-white placeholder-gray-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all text-sm"
                      placeholder="Password"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Business Details */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-teal-600 uppercase tracking-wider border-b border-gray-200 pb-1.5">
                Business Details
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="company-name" className="text-xs text-slate-600 font-semibold mb-1.5 block">Company Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Building className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="company-name"
                      type="text"
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="appearance-none rounded-xl relative block w-full pl-10 pr-3 py-3 border border-gray-300 bg-white placeholder-gray-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all text-sm"
                      placeholder="e.g. ABS Garages Ltd"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="phone-number" className="text-xs text-slate-600 font-semibold mb-1.5 block">Phone Number</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="phone-number"
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="appearance-none rounded-xl relative block w-full pl-10 pr-3 py-3 border border-gray-300 bg-white placeholder-gray-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all text-sm"
                      placeholder="e.g. 0191 254 5909"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="fax" className="text-xs text-slate-600 font-semibold mb-1.5 block">Fax (Optional)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Printer className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="fax"
                      type="text"
                      value={fax}
                      onChange={(e) => setFax(e.target.value)}
                      className="appearance-none rounded-xl relative block w-full pl-10 pr-3 py-3 border border-gray-300 bg-white placeholder-gray-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all text-sm"
                      placeholder="e.g. 0191 254 5907"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="website" className="text-xs text-slate-600 font-semibold mb-1.5 block">Website (Optional)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Link2 className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="website"
                      type="text"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      className="appearance-none rounded-xl relative block w-full pl-10 pr-3 py-3 border border-gray-300 bg-white placeholder-gray-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all text-sm"
                      placeholder="e.g. www.sage.co.uk"
                    />
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4 space-y-4">
                  <h4 className="text-xs font-bold text-teal-600 uppercase tracking-wider">Address details</h4>

                  <div>
                    <label htmlFor="address" className="text-xs text-slate-600 font-semibold mb-1.5 block">Address Line 1</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MapPin className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="address"
                        type="text"
                        required
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="appearance-none rounded-xl relative block w-full pl-10 pr-3 py-3 border border-gray-300 bg-white placeholder-gray-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all text-sm"
                        placeholder="e.g. Unit 34"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="address2" className="text-xs text-slate-600 font-semibold mb-1.5 block">Address Line 2 (Optional)</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MapPin className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="address2"
                        type="text"
                        value={addressLine2}
                        onChange={(e) => setAddressLine2(e.target.value)}
                        className="appearance-none rounded-xl relative block w-full pl-10 pr-3 py-3 border border-gray-300 bg-white placeholder-gray-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all text-sm"
                        placeholder="e.g. Holystone Ind Estate"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="postcode" className="text-xs text-slate-600 font-semibold mb-1.5 block">Postcode</label>
                      <input
                        id="postcode"
                        type="text"
                        required
                        value={postcode}
                        onChange={(e) => setPostcode(e.target.value)}
                        className="appearance-none rounded-xl relative block w-full px-3 py-3 border border-gray-300 bg-white placeholder-gray-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all text-sm"
                        placeholder="e.g. NE31 1VB"
                      />
                    </div>

                    <div>
                      <label htmlFor="city" className="text-xs text-slate-600 font-semibold mb-1.5 block">Town / City</label>
                      <input
                        id="city"
                        type="text"
                        required
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="appearance-none rounded-xl relative block w-full px-3 py-3 border border-gray-300 bg-white placeholder-gray-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all text-sm"
                        placeholder="e.g. Hebburn"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="country" className="text-xs text-slate-600 font-semibold mb-1.5 block">Country</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Globe className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                          id="country"
                          type="text"
                          required
                          value={country}
                          onChange={(e) => setCountry(e.target.value)}
                          className="appearance-none rounded-xl relative block w-full pl-9 pr-3 py-3 border border-gray-300 bg-white placeholder-gray-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all text-sm uppercase"
                          placeholder="e.g. GB"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="company-reg" className="text-xs text-slate-600 font-semibold mb-1.5 block">Company Reg No. (Optional)</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Hash className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          id="company-reg"
                          type="text"
                          value={companyRegNumber}
                          onChange={(e) => setCompanyRegNumber(e.target.value)}
                          className="appearance-none rounded-xl relative block w-full pl-10 pr-3 py-3 border border-gray-300 bg-white placeholder-gray-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all text-sm"
                          placeholder="e.g. GB745 4584 68"
                        />
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-gray-200">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm cursor-pointer"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                "Register Shop"
              )}
            </button>

            <div className="text-center">
              <Link href="/login" className="text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors">
                Already registered? Back to Login
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
