"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { MapPin } from "lucide-react";
import {
  searchCities,
  searchStates,
  getStateForCity,
  type CityData,
} from "@/utils/indianCities";

interface CityAutocompleteProps {
  city: string;
  state: string;
  onCityChange: (city: string) => void;
  onStateChange: (state: string) => void;
  iconColor?: string;
  inputClassName?: string;
}

export const CityAutocomplete = ({
  city,
  state,
  onCityChange,
  onStateChange,
  iconColor = "#3b82f6",
  inputClassName = "h-12 pl-12 rounded-xl border-gray-100 bg-white/50 text-gray-600",
}: CityAutocompleteProps) => {
  const [citySuggestions, setCitySuggestions] = useState<CityData[]>([]);
  const [stateSuggestions, setStateSuggestions] = useState<string[]>([]);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [showStateDropdown, setShowStateDropdown] = useState(false);
  const [activeCityIdx, setActiveCityIdx] = useState(-1);
  const [activeStateIdx, setActiveStateIdx] = useState(-1);

  const cityRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<HTMLDivElement>(null);
  const cityInputRef = useRef<HTMLInputElement>(null);
  const stateInputRef = useRef<HTMLInputElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (cityRef.current && !cityRef.current.contains(e.target as Node)) {
        setShowCityDropdown(false);
      }
      if (stateRef.current && !stateRef.current.contains(e.target as Node)) {
        setShowStateDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCityInput = (value: string) => {
    onCityChange(value);
    const results = searchCities(value);
    setCitySuggestions(results);
    setShowCityDropdown(results.length > 0);
    setActiveCityIdx(-1);
  };

  const selectCity = (item: CityData) => {
    onCityChange(item.city);
    onStateChange(item.state);
    setShowCityDropdown(false);
    setCitySuggestions([]);
  };

  const handleStateInput = (value: string) => {
    onStateChange(value);
    const results = searchStates(value);
    setStateSuggestions(results);
    setShowStateDropdown(results.length > 0);
    setActiveStateIdx(-1);
  };

  const selectState = (s: string) => {
    onStateChange(s);
    setShowStateDropdown(false);
    setStateSuggestions([]);
  };

  const handleCityKeyDown = (e: React.KeyboardEvent) => {
    if (!showCityDropdown) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveCityIdx((prev) =>
        prev < citySuggestions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveCityIdx((prev) =>
        prev > 0 ? prev - 1 : citySuggestions.length - 1
      );
    } else if (e.key === "Enter" && activeCityIdx >= 0) {
      e.preventDefault();
      selectCity(citySuggestions[activeCityIdx]);
    } else if (e.key === "Escape") {
      setShowCityDropdown(false);
    }
  };

  const handleStateKeyDown = (e: React.KeyboardEvent) => {
    if (!showStateDropdown) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveStateIdx((prev) =>
        prev < stateSuggestions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveStateIdx((prev) =>
        prev > 0 ? prev - 1 : stateSuggestions.length - 1
      );
    } else if (e.key === "Enter" && activeStateIdx >= 0) {
      e.preventDefault();
      selectState(stateSuggestions[activeStateIdx]);
    } else if (e.key === "Escape") {
      setShowStateDropdown(false);
    }
  };

  // Handle city blur — auto-fill state if city matches exactly
  const handleCityBlur = () => {
    setTimeout(() => {
      const matchedState = getStateForCity(city);
      if (matchedState && !state) {
        onStateChange(matchedState);
      }
      setShowCityDropdown(false);
    }, 150);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* City Field */}
      <div ref={cityRef} className="relative">
        <label className="text-xs font-bold uppercase tracking-widest mb-2 block text-gray-500">
          City *
        </label>
        <div className="relative">
          <MapPin
            className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 z-10"
            style={{ color: iconColor }}
          />
          <Input
            ref={cityInputRef}
            className={inputClassName}
            placeholder="Mumbai"
            value={city}
            onChange={(e) => handleCityInput(e.target.value)}
            onFocus={() => {
              if (city.length > 0) {
                const results = searchCities(city);
                setCitySuggestions(results);
                setShowCityDropdown(results.length > 0);
              }
            }}
            onBlur={handleCityBlur}
            onKeyDown={handleCityKeyDown}
            autoComplete="off"
          />
          {showCityDropdown && citySuggestions.length > 0 && (
            <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-52 overflow-y-auto">
              {citySuggestions.map((item, idx) => (
                <button
                  key={`${item.city}-${item.state}`}
                  type="button"
                  className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between transition-colors ${
                    idx === activeCityIdx
                      ? "bg-pink-50 text-pink-700"
                      : "hover:bg-gray-50 text-gray-700"
                  }`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    selectCity(item);
                  }}
                  onMouseEnter={() => setActiveCityIdx(idx)}
                >
                  <span className="font-medium">{item.city}</span>
                  <span className="text-xs text-gray-400">{item.state}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* State Field */}
      <div ref={stateRef} className="relative">
        <label className="text-xs font-bold uppercase tracking-widest mb-2 block text-gray-500">
          State *
        </label>
        <div className="relative">
          <MapPin
            className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 z-10"
            style={{ color: iconColor }}
          />
          <Input
            ref={stateInputRef}
            className={inputClassName}
            placeholder="Maharashtra"
            value={state}
            onChange={(e) => handleStateInput(e.target.value)}
            onFocus={() => {
              if (state.length > 0) {
                const results = searchStates(state);
                setStateSuggestions(results);
                setShowStateDropdown(results.length > 0);
              }
            }}
            onBlur={() => setTimeout(() => setShowStateDropdown(false), 150)}
            onKeyDown={handleStateKeyDown}
            autoComplete="off"
          />
          {showStateDropdown && stateSuggestions.length > 0 && (
            <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-52 overflow-y-auto">
              {stateSuggestions.map((s, idx) => (
                <button
                  key={s}
                  type="button"
                  className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${
                    idx === activeStateIdx
                      ? "bg-pink-50 text-pink-700"
                      : "hover:bg-gray-50 text-gray-700"
                  }`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    selectState(s);
                  }}
                  onMouseEnter={() => setActiveStateIdx(idx)}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CityAutocomplete;
