"use client";

import { useEffect, useState } from "react";
import { 
  ArrowRight, ArrowLeft, MapPin, Briefcase, 
  Globe, Camera, X, Plus, Loader2, Sparkles, Languages, Phone 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { CityAutocomplete } from "@/components/ui/CityAutocomplete";
// Import centralized details service
import { detailsService } from "@/services/onboarding";

const DetailsOnboarding = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // Palette Integration from Guidelines
  const palette = {
    pink: "#ec4899",
    purple: "#a855f7",
    blue: "#3b82f6",
    gray600: "#4b5563",
    bgGradient: "linear-gradient(to bottom right, #f9fafb, #fdf2f8, #eff6ff)",
    brandGradient: "linear-gradient(to right, #ec4899, #a855f7, #3b82f6)"
  };

  const [formData, setFormData] = useState({
    fullName: "",
    phoneNumber: "",
    city: "",
    state: "",
    experience: "",
    bio: "",
    travelAvailable: true,
  });
  
  const [gear, setGear] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>(["English"]);
  const [gearInput, setGearInput] = useState("");
  const [languageInput, setLanguageInput] = useState("");

  useEffect(() => {
    const loadDetails = async () => {
      try {
        const data = await detailsService.get();
        if (data) {
          setFormData({
            fullName: data.full_name || "",
            phoneNumber: data.phone_number || "",
            city: data.city || "",
            state: data.state || "",
            experience: data.years_experience?.toString() || "",
            bio: data.bio || "",
            travelAvailable: data.travel_available ?? true,
          });
          setGear(data.gear_list || []);
          setLanguages(data.languages || ["English"]);
        }
      } catch (error) {
        console.log("No existing data found, starting fresh.");
      } finally {
        setFetching(false);
      }
    };
    loadDetails();
  }, []);

  const addGear = () => {
    if (gearInput.trim() && !gear.includes(gearInput.trim())) {
      setGear([...gear, gearInput.trim()]);
      setGearInput("");
    }
  };

  const addLanguage = () => {
    if (languageInput.trim() && !languages.includes(languageInput.trim())) {
      setLanguages([...languages, languageInput.trim()]);
      setLanguageInput("");
    }
  };

  const handleContinue = async () => {
    if (!formData.fullName || !formData.phoneNumber || !formData.city || !formData.experience) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        user_id: "me",
        full_name: formData.fullName,
        phone_number: formData.phoneNumber,
        city: formData.city,
        state: formData.state,
        operating_locations: [formData.city],
        years_experience: parseInt(formData.experience),
        bio: formData.bio,
        gear_list: gear,
        languages: languages,
        travel_available: formData.travelAvailable,
      };

      await detailsService.setup(payload);
      toast.success("Professional details saved!");
      router.push("/creator/onboarding/bank-details");
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to save details");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return (
    <div className="h-screen flex items-center justify-center bg-[#f9fafb]">
      <Loader2 className="animate-spin w-10 h-10" style={{ color: palette.purple }} />
    </div>
  );

  return (
    <div className="min-h-screen py-12 px-6" style={{ background: palette.bgGradient }}>
      <div className="max-w-5xl mx-auto">
        
        {/* Progress Header */}
        <header className="mb-12">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider mb-4" style={{ color: palette.gray600 }}>
            <span className="flex items-center gap-2">
               <Sparkles className="w-4 h-4" style={{ color: palette.pink }} /> Step 3 of 4
            </span>
            <span>Professional Details</span>
          </div>
          <div className="h-2 w-full bg-white rounded-full overflow-hidden border border-gray-100">
             <motion.div 
               initial={{ width: "50%" }} 
               animate={{ width: "75%" }} 
               className="h-full" 
               style={{ background: palette.brandGradient }} 
             />
          </div>
        </header>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Tell Us About <span className="text-transparent bg-clip-text" style={{ backgroundImage: palette.brandGradient }}>Yourself</span>
          </h1>
          <p style={{ color: palette.gray600 }}>Help clients understand your professional journey and toolkit.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Basic Info */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="p-8 bg-white/70 backdrop-blur-xl border-white rounded-4xl shadow-sm">
              <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                <div className="w-1.5 h-6 rounded-full" style={{ backgroundColor: palette.blue }} />
                Basic Information
              </h3>
              
              <div className="space-y-5">
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest mb-2 block" style={{ color: palette.gray600 }}>Full Name *</label>
                  <Input
                    className="h-12 rounded-xl border-gray-100 bg-white/50 focus:ring-2 text-gray-600"
                    placeholder="John Doe"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-widest mb-2 block" style={{ color: palette.gray600 }}>Phone Number *</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: palette.pink }} />
                    <Input
                      type="tel"
                      className="h-12 pl-12 rounded-xl border-gray-100 bg-white/50 text-gray-600"
                      placeholder="+91 98765 43210"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-widest mb-2 block" style={{ color: palette.gray600 }}>Base Location *</label>
                  <CityAutocomplete
                    city={formData.city}
                    state={formData.state}
                    onCityChange={(city) => setFormData(prev => ({ ...prev, city }))}
                    onStateChange={(state) => setFormData(prev => ({ ...prev, state }))}
                    iconColor={palette.blue}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-widest mb-2 block" style={{ color: palette.gray600 }}>Experience (Years) *</label>
                  <div className="relative">
                    <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type="number"
                      className="h-12 pl-12 rounded-xl border-gray-100 bg-white/50 text-gray-600"
                      placeholder="5"
                      value={formData.experience}
                      onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-50">
                       <Globe className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-gray-800">Available for Travel</p>
                      <p className="text-xs" style={{ color: palette.gray600 }}>Willing to shoot outstation</p>
                    </div>
                  </div>
                  <Switch className="border-gray-600"
                    checked={formData.travelAvailable}
                    onCheckedChange={(checked) => setFormData({ ...formData, travelAvailable: checked })}
                  />
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column: Bio & Lists */}
          <div className="lg:col-span-7 space-y-6">
            <Card className="p-8 bg-white/70 backdrop-blur-xl border-white rounded-4xl shadow-sm">
              <h3 className="font-bold text-gray-800 mb-4">Professional Bio</h3>
              <textarea
                placeholder="Share your expertise, creative philosophy, and what makes your work unique..."
                className="w-full h-32 px-4 py-3 rounded-2xl border border-gray-100 bg-white/50 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-all resize-none"
                style={{ "--tw-ring-color": palette.purple } as any}
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              />
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6 bg-white/70 backdrop-blur-xl border-white rounded-4xl shadow-sm">
                <h3 className="font-bold text-sm text-gray-800 mb-4 flex items-center gap-2">
                  <Camera className="w-4 h-4" style={{ color: palette.pink }} /> Gear List
                </h3>
                <div className="flex gap-2 mb-4">
                  <Input
                    className="h-10 rounded-lg border-gray-100 text-sm text-gray-800"
                    placeholder="Sony A7IV..."
                    value={gearInput}
                    onChange={(e) => setGearInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addGear()}
                  />
                  <Button size="sm" variant="outline" onClick={addGear} className="rounded-lg bg-blue-800"><Plus className="w-4 h-4" /></Button>
                </div>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-2">
                  <AnimatePresence>
                    {gear.map((item) => (
                      <motion.span 
                        initial={{ scale: 0.8, opacity: 0 }} 
                        animate={{ scale: 1, opacity: 1 }} 
                        exit={{ scale: 0.8, opacity: 0 }}
                        key={item} 
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white border border-gray-100 text-xs font-medium text-gray-600"
                      >
                        {item}
                        <button onClick={() => setGear(gear.filter(g => g !== item))} className="hover:text-red-500"><X className="w-3 h-3" /></button>
                      </motion.span>
                    ))}
                  </AnimatePresence>
                </div>
              </Card>

              <Card className="p-6 bg-white/70 backdrop-blur-xl border-white rounded-4xl shadow-sm">
                <h3 className="font-bold text-sm text-gray-800 mb-4 flex items-center gap-2">
                  <Languages className="w-4 h-4" style={{ color: palette.blue }} /> Languages
                </h3>
                <div className="flex gap-2 mb-4">
                  <Input
                    className="h-10 rounded-lg border-gray-100 text-sm text-gray-800"
                    placeholder="Hindi..."
                    value={languageInput}
                    onChange={(e) => setLanguageInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addLanguage()}
                  />
                  <Button  size="sm" variant="outline" onClick={addLanguage} className="rounded-lg bg-blue-800"><Plus className="w-4 h-4" /></Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {languages.map((item) => (
                    <span key={item} className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: `${palette.blue}15`, color: palette.blue }}>
                      {item}
                      <button onClick={() => setLanguages(languages.filter(l => l !== item))}><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>

        {/* Footer Navigation */}
        <footer className="mt-12 pt-8 border-t border-gray-100 flex items-center justify-between">
          <Button variant="ghost" onClick={() => router.back()} className="text-gray-400">
            <ArrowLeft className="w-4 h-4 mr-2" /> Previous Step
          </Button>
          <Button 
            onClick={handleContinue} 
            disabled={loading}
            className="h-12 px-10 rounded-xl text-white font-bold transition-all shadow-lg active:scale-95 group"
            style={{ background: palette.brandGradient }}
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
              <>Continue <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" /></>
            )}
          </Button>
        </footer>
      </div>
    </div>
  );
};

export default DetailsOnboarding;