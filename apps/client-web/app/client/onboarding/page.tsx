"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  User,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  Mail,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Sparkles,
  CheckCircle2,
  Users,
  Heart,
  Camera,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { CityAutocomplete } from "@/components/ui/CityAutocomplete";
import { Auth } from "@/services/Auth";
import { clientOnboardingService } from "@/services/clientOnboarding";

// ============== PALETTE ==============
const palette = {
  pink: "#ec4899",
  pink600: "#db2777",
  purple: "#a855f7",
  blue: "#3b82f6",
  blue600: "#2563eb",
  gray50: "#f9fafb",
  gray100: "#f3f4f6",
  gray200: "#e5e7eb",
  gray500: "#6b7280",
  gray600: "#4b5563",
  gray800: "#1f2937",
  emerald: "#059669",
  bgGradient: "linear-gradient(to bottom right, #f9fafb, #fdf2f8, #eff6ff)",
  brandGradient: "linear-gradient(to right, #ec4899, #a855f7, #3b82f6)",
  ctaGradient: "linear-gradient(to right, #ec4899, #3b82f6)",
};

// ============== TYPES ==============
interface FormData {
  fullName: string;
  email: string;
  phoneNumber: string;
  gender: string;
  dateOfBirth: string;
  profilePhoto: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  occupation: string;
  companyName: string;
  preferredCategories: string[];
}

// ============== GENDER OPTIONS ==============
const genderOptions = [
  { id: "male", label: "Male", icon: User },
  { id: "female", label: "Female", icon: User },
  { id: "prefer_not_to_say", label: "Prefer not to say", icon: Heart },
];

// ============== CATEGORY OPTIONS ==============
const categoryOptions = [
  { id: "wedding", label: "Wedding", emoji: "💒" },
  { id: "portrait", label: "Portrait", emoji: "📸" },
  { id: "commercial", label: "Commercial", emoji: "🏢" },
  { id: "event", label: "Events", emoji: "🎉" },
  { id: "product", label: "Product", emoji: "📦" },
  { id: "fashion", label: "Fashion", emoji: "👗" },
  { id: "travel", label: "Travel", emoji: "✈️" },
  { id: "food", label: "Food", emoji: "🍽️" },
];

// ============== OCCUPATION OPTIONS ==============
const occupationOptions = [
  "Business Owner",
  "Marketing Professional",
  "Event Planner",
  "Student",
  "Corporate Employee",
  "Freelancer",
  "Influencer/Content Creator",
  "Other",
];

export default function ClientOnboardingPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    email: "",
    phoneNumber: "",
    gender: "",
    dateOfBirth: "",
    profilePhoto: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    occupation: "",
    companyName: "",
    preferredCategories: [],
  });

  const totalSteps = 3;

  // Check auth and load existing data
  useEffect(() => {
    const initialize = async () => {
      try {
        const userData = await Auth.me();
        if (!userData?.user) {
          router.replace("/login");
          return;
        }

        // Check if already onboarded
        if (userData.user.client_onboarding_completed) {
          router.replace(`/client/dashboard/${encodeURIComponent(userData.user.email)}`);
          return;
        }

        setUserEmail(userData.user.email);
        setFormData((prev) => ({
          ...prev,
          fullName: userData.user.name || "",
          email: userData.user.email || "",
        }));

        // Try to load existing onboarding data
        try {
          const existingData = await clientOnboardingService.get();
          if (existingData) {
            setFormData((prev) => ({
              ...prev,
              fullName: existingData.full_name || prev.fullName,
              phoneNumber: existingData.phone_number || "",
              gender: existingData.gender || "",
              dateOfBirth: existingData.date_of_birth || "",
              profilePhoto: existingData.profile_photo || "",
              address: existingData.address || "",
              city: existingData.city || "",
              state: existingData.state || "",
              pincode: existingData.pincode || "",
              occupation: existingData.occupation || "",
              companyName: existingData.company_name || "",
              preferredCategories: existingData.preferred_categories || [],
            }));
          }
        } catch {
          // No existing data, fresh start
        }
      } catch {
        router.replace("/login");
      } finally {
        setInitialLoading(false);
      }
    };

    initialize();
  }, [router]);

  const handleCategoryToggle = (categoryId: string) => {
    setFormData((prev) => ({
      ...prev,
      preferredCategories: prev.preferredCategories.includes(categoryId)
        ? prev.preferredCategories.filter((c) => c !== categoryId)
        : [...prev.preferredCategories, categoryId],
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    setUploadingImage(true);
    try {
      const imageUrl = await clientOnboardingService.uploadProfilePhoto(file);
      setFormData((prev) => ({ ...prev, profilePhoto: imageUrl }));
      toast.success("Profile photo uploaded!");
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  const removeProfilePhoto = () => {
    setFormData((prev) => ({ ...prev, profilePhoto: "" }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!formData.fullName.trim()) {
          toast.error("Please enter your full name");
          return false;
        }
        if (!formData.phoneNumber.trim() || formData.phoneNumber.length < 10) {
          toast.error("Please enter a valid phone number");
          return false;
        }
        if (!formData.gender) {
          toast.error("Please select your gender");
          return false;
        }
        if (!formData.dateOfBirth) {
          toast.error("Please enter your date of birth");
          return false;
        }
        return true;
      case 2:
        if (!formData.address.trim()) {
          toast.error("Please enter your address");
          return false;
        }
        if (!formData.city.trim()) {
          toast.error("Please enter your city");
          return false;
        }
        if (!formData.state.trim()) {
          toast.error("Please enter your state");
          return false;
        }
        if (!formData.pincode.trim() || formData.pincode.length < 5) {
          toast.error("Please enter a valid pincode");
          return false;
        }
        return true;
      case 3:
        if (!formData.occupation) {
          toast.error("Please select your occupation");
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setLoading(true);
    try {
      const payload = {
        full_name: formData.fullName,
        phone_number: formData.phoneNumber,
        gender: formData.gender,
        date_of_birth: formData.dateOfBirth,
        profile_photo: formData.profilePhoto,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        occupation: formData.occupation,
        company_name: formData.companyName,
        preferred_categories: formData.preferredCategories,
      };

      await clientOnboardingService.submit(payload);
      toast.success("Profile completed successfully! 🎉");
      router.push(`/client/dashboard/${encodeURIComponent(userEmail)}`);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to save profile");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center"
        style={{ background: palette.bgGradient }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        >
          <Loader2 className="w-12 h-12" style={{ color: palette.pink }} />
        </motion.div>
        <p className="mt-4 font-medium" style={{ color: palette.gray600 }}>
          Loading your profile...
        </p>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen py-8 px-4 sm:px-6"
      style={{ background: palette.bgGradient }}
    >
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-sm font-medium mb-6 backdrop-blur-md"
            style={{
              backgroundColor: "#ffffff",
              borderColor: "#e5e7eb",
              color: palette.pink,
            }}
          >
            <Sparkles className="w-4 h-4" />
            Complete Your Profile
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold mb-3 tracking-tight text-gray-800">
            Welcome to{" "}
            <span
              className="text-transparent bg-clip-text"
              style={{ backgroundImage: palette.brandGradient }}
            >
              VisionMatch
            </span>
          </h1>
          <p style={{ color: palette.gray600 }}>
            Complete your profile to get personalized recommendations
          </p>
        </motion.div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div
            className="flex items-center justify-between text-xs font-bold uppercase tracking-wider mb-3"
            style={{ color: palette.gray600 }}
          >
            <span>Step {currentStep} of {totalSteps}</span>
            <span>
              {currentStep === 1 && "Personal Info"}
              {currentStep === 2 && "Address"}
              {currentStep === 3 && "Preferences"}
            </span>
          </div>
          <div className="h-2 w-full bg-white rounded-full overflow-hidden border border-gray-100">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
              transition={{ duration: 0.3 }}
              className="h-full"
              style={{ background: palette.brandGradient }}
            />
          </div>
        </div>

        {/* Form Card */}
        <Card className="bg-white/70 backdrop-blur-xl border-white rounded-3xl shadow-xl overflow-hidden">
          <AnimatePresence mode="wait">
            {/* Step 1: Personal Information */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-6 sm:p-8"
              >
                <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <div
                    className="w-1.5 h-6 rounded-full"
                    style={{ backgroundColor: palette.blue }}
                  />
                  Personal Information
                </h2>

                <div className="space-y-5">
                  {/* Profile Photo Upload */}
                  <div>
                    <label
                      className="text-xs font-bold uppercase tracking-widest mb-3 block"
                      style={{ color: palette.gray600 }}
                    >
                      Profile Photo
                    </label>
                    <div className="flex items-center gap-6">
                      <div className="relative">
                        {formData.profilePhoto ? (
                          <div className="relative">
                            <img
                              src={formData.profilePhoto}
                              alt="Profile"
                              className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                            />
                            <button
                              type="button"
                              onClick={removeProfilePhoto}
                              className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-red-600 transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div
                            className="w-24 h-24 rounded-full flex items-center justify-center border-2 border-dashed"
                            style={{
                              borderColor: palette.gray200,
                              backgroundColor: palette.gray50,
                            }}
                          >
                            <Camera
                              className="w-8 h-8"
                              style={{ color: palette.gray500 }}
                            />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleImageUpload}
                          accept="image/*"
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingImage}
                          className="h-10 rounded-xl border-gray-200 hover:bg-gray-50"
                        >
                          {uploadingImage ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Upload className="w-4 h-4 mr-2" />
                          )}
                          {uploadingImage ? "Uploading..." : "Upload Photo"}
                        </Button>
                        <p
                          className="text-xs mt-2"
                          style={{ color: palette.gray500 }}
                        >
                          JPG, PNG or GIF. Max 5MB.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Full Name */}
                  <div>
                    <label
                      className="text-xs font-bold uppercase tracking-widest mb-2 block"
                      style={{ color: palette.gray600 }}
                    >
                      Full Name *
                    </label>
                    <div className="relative">
                      <User
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4"
                        style={{ color: palette.pink }}
                      />
                      <Input
                        className="h-12 pl-12 rounded-xl border-gray-200 bg-white/50 focus:ring-2 focus:ring-pink-400"
                        placeholder="Enter your full name"
                        value={formData.fullName}
                        onChange={(e) =>
                          setFormData({ ...formData, fullName: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  {/* Email (Read-only) */}
                  <div>
                    <label
                      className="text-xs font-bold uppercase tracking-widest mb-2 block"
                      style={{ color: palette.gray600 }}
                    >
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4"
                        style={{ color: palette.blue }}
                      />
                      <Input
                        className="h-12 pl-12 rounded-xl border-gray-200 bg-gray-50 text-gray-500"
                        value={formData.email}
                        disabled
                      />
                    </div>
                  </div>

                  {/* Phone Number */}
                  <div>
                    <label
                      className="text-xs font-bold uppercase tracking-widest mb-2 block"
                      style={{ color: palette.gray600 }}
                    >
                      Mobile Number *
                    </label>
                    <div className="relative">
                      <Phone
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4"
                        style={{ color: palette.pink }}
                      />
                      <Input
                        type="tel"
                        className="h-12 pl-12 rounded-xl border-gray-200 bg-white/50 focus:ring-2 focus:ring-pink-400"
                        placeholder="+91 98765 43210"
                        value={formData.phoneNumber}
                        onChange={(e) =>
                          setFormData({ ...formData, phoneNumber: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  {/* Gender Selection */}
                  <div>
                    <label
                      className="text-xs font-bold uppercase tracking-widest mb-3 block"
                      style={{ color: palette.gray600 }}
                    >
                      Gender *
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {genderOptions.map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() =>
                            setFormData({ ...formData, gender: option.id })
                          }
                          className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1.5 relative ${
                            formData.gender === option.id
                              ? "bg-white shadow-md"
                              : "bg-white/40 border-transparent hover:bg-white/60"
                          }`}
                          style={{
                            borderColor:
                              formData.gender === option.id
                                ? palette.pink
                                : "transparent",
                          }}
                        >
                          <option.icon
                            className="w-5 h-5"
                            style={{
                              color:
                                formData.gender === option.id
                                  ? palette.pink
                                  : palette.gray500,
                            }}
                          />
                          <span
                            className="text-xs font-medium"
                            style={{
                              color:
                                formData.gender === option.id
                                  ? palette.gray800
                                  : palette.gray600,
                            }}
                          >
                            {option.label}
                          </span>
                          {formData.gender === option.id && (
                            <CheckCircle2
                              className="w-4 h-4 absolute top-2 right-2"
                              style={{ color: palette.pink }}
                            />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Date of Birth */}
                  <div>
                    <label
                      className="text-xs font-bold uppercase tracking-widest mb-2 block"
                      style={{ color: palette.gray600 }}
                    >
                      Date of Birth *
                    </label>
                    <div className="relative">
                      <Calendar
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4"
                        style={{ color: palette.purple }}
                      />
                      <Input
                        type="date"
                        className="h-12 pl-12 rounded-xl border-gray-200 bg-white/50 focus:ring-2 focus:ring-pink-400"
                        value={formData.dateOfBirth}
                        onChange={(e) =>
                          setFormData({ ...formData, dateOfBirth: e.target.value })
                        }
                        max={new Date().toISOString().split("T")[0]}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: Address */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-6 sm:p-8"
              >
                <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <div
                    className="w-1.5 h-6 rounded-full"
                    style={{ backgroundColor: palette.purple }}
                  />
                  Address Details
                </h2>

                <div className="space-y-5">
                  {/* Street Address */}
                  <div>
                    <label
                      className="text-xs font-bold uppercase tracking-widest mb-2 block"
                      style={{ color: palette.gray600 }}
                    >
                      Street Address *
                    </label>
                    <div className="relative">
                      <MapPin
                        className="absolute left-4 top-3 w-4 h-4"
                        style={{ color: palette.pink }}
                      />
                      <textarea
                        className="w-full min-h-[80px] pl-12 pr-4 py-3 rounded-xl border border-gray-200 bg-white/50 focus:ring-2 focus:ring-pink-400 focus:outline-none resize-none text-sm"
                        placeholder="House/Flat No., Building Name, Street"
                        value={formData.address}
                        onChange={(e) =>
                          setFormData({ ...formData, address: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  {/* City & State */}
                  <CityAutocomplete
                    city={formData.city}
                    state={formData.state}
                    onCityChange={(city) =>
                      setFormData(prev => ({ ...prev, city }))
                    }
                    onStateChange={(state) =>
                      setFormData(prev => ({ ...prev, state }))
                    }
                    iconColor={palette.pink}
                    inputClassName="h-12 pl-12 rounded-xl border-gray-200 bg-white/50 focus:ring-2 focus:ring-pink-400 text-gray-600"
                  />

                  {/* Pincode */}
                  <div>
                    <label
                      className="text-xs font-bold uppercase tracking-widest mb-2 block"
                      style={{ color: palette.gray600 }}
                    >
                      Pincode *
                    </label>
                    <Input
                      type="text"
                      maxLength={6}
                      className="h-12 rounded-xl border-gray-200 bg-white/50 focus:ring-2 focus:ring-pink-400"
                      placeholder="400001"
                      value={formData.pincode}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          pincode: e.target.value.replace(/\D/g, ""),
                        })
                      }
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 3: Preferences */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-6 sm:p-8"
              >
                <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <div
                    className="w-1.5 h-6 rounded-full"
                    style={{ backgroundColor: palette.emerald }}
                  />
                  Your Preferences
                </h2>

                <div className="space-y-6">
                  {/* Occupation */}
                  <div>
                    <label
                      className="text-xs font-bold uppercase tracking-widest mb-3 block"
                      style={{ color: palette.gray600 }}
                    >
                      Occupation *
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {occupationOptions.map((occupation) => (
                        <button
                          key={occupation}
                          type="button"
                          onClick={() =>
                            setFormData({ ...formData, occupation })
                          }
                          className={`p-3 rounded-xl border-2 transition-all text-left ${
                            formData.occupation === occupation
                              ? "bg-white shadow-md"
                              : "bg-white/40 border-transparent hover:bg-white/60"
                          }`}
                          style={{
                            borderColor:
                              formData.occupation === occupation
                                ? palette.blue
                                : "transparent",
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <Briefcase
                              className="w-4 h-4"
                              style={{
                                color:
                                  formData.occupation === occupation
                                    ? palette.blue
                                    : palette.gray500,
                              }}
                            />
                            <span
                              className="text-sm font-medium"
                              style={{
                                color:
                                  formData.occupation === occupation
                                    ? palette.gray800
                                    : palette.gray600,
                              }}
                            >
                              {occupation}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Company Name (Optional) */}
                  <div>
                    <label
                      className="text-xs font-bold uppercase tracking-widest mb-2 block"
                      style={{ color: palette.gray600 }}
                    >
                      Company/Organization{" "}
                      <span className="text-gray-400">(Optional)</span>
                    </label>
                    <Input
                      className="h-12 rounded-xl border-gray-200 bg-white/50 focus:ring-2 focus:ring-pink-400"
                      placeholder="Where do you work?"
                      value={formData.companyName}
                      onChange={(e) =>
                        setFormData({ ...formData, companyName: e.target.value })
                      }
                    />
                  </div>

                  {/* Preferred Categories */}
                  <div>
                    <label
                      className="text-xs font-bold uppercase tracking-widest mb-2 block"
                      style={{ color: palette.gray600 }}
                    >
                      Interested In{" "}
                      <span className="text-gray-400">(Select all that apply)</span>
                    </label>
                    <p
                      className="text-xs mb-4"
                      style={{ color: palette.gray500 }}
                    >
                      What type of photography/videography are you looking for?
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {categoryOptions.map((category) => (
                        <button
                          key={category.id}
                          type="button"
                          onClick={() => handleCategoryToggle(category.id)}
                          className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1.5 ${
                            formData.preferredCategories.includes(category.id)
                              ? "bg-white shadow-md"
                              : "bg-white/40 border-transparent hover:bg-white/60"
                          }`}
                          style={{
                            borderColor: formData.preferredCategories.includes(
                              category.id
                            )
                              ? palette.pink
                              : "transparent",
                          }}
                        >
                          <span className="text-2xl">{category.emoji}</span>
                          <span
                            className="text-xs font-medium"
                            style={{
                              color: formData.preferredCategories.includes(
                                category.id
                              )
                                ? palette.gray800
                                : palette.gray600,
                            }}
                          >
                            {category.label}
                          </span>
                          {formData.preferredCategories.includes(
                            category.id
                          ) && (
                            <CheckCircle2
                              className="w-4 h-4"
                              style={{ color: palette.pink }}
                            />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="px-6 sm:px-8 pb-6 sm:pb-8 flex justify-between gap-4">
            {currentStep > 1 ? (
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                className="flex-1 h-12 rounded-xl border-gray-200 hover:bg-gray-50"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            ) : (
              <div className="flex-1" />
            )}

            {currentStep < totalSteps ? (
              <Button
                type="button"
                onClick={handleNext}
                className="flex-1 h-12 rounded-xl text-white font-bold shadow-lg"
                style={{ background: palette.ctaGradient }}
              >
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 h-12 rounded-xl text-white font-bold shadow-lg"
                style={{ background: palette.ctaGradient }}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Complete Setup
                    <CheckCircle2 className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            )}
          </div>
        </Card>

        {/* Footer */}
        <p className="text-center text-[10px] font-bold uppercase tracking-[0.2em] mt-8 opacity-40 text-gray-500">
          Powered by VisionMatch AI
        </p>
      </div>
    </div>
  );
}
