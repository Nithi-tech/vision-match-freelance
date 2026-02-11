// Indian cities mapped to their states — used for autocomplete in onboarding forms

export interface CityData {
  city: string;
  state: string;
}

export const indianCities: CityData[] = [
  // Andhra Pradesh
  { city: "Visakhapatnam", state: "Andhra Pradesh" },
  { city: "Vijayawada", state: "Andhra Pradesh" },
  { city: "Guntur", state: "Andhra Pradesh" },
  { city: "Nellore", state: "Andhra Pradesh" },
  { city: "Kurnool", state: "Andhra Pradesh" },
  { city: "Tirupati", state: "Andhra Pradesh" },
  { city: "Rajahmundry", state: "Andhra Pradesh" },
  { city: "Kakinada", state: "Andhra Pradesh" },
  { city: "Anantapur", state: "Andhra Pradesh" },
  { city: "Eluru", state: "Andhra Pradesh" },
  { city: "Ongole", state: "Andhra Pradesh" },
  { city: "Kadapa", state: "Andhra Pradesh" },
  { city: "Amaravati", state: "Andhra Pradesh" },

  // Arunachal Pradesh
  { city: "Itanagar", state: "Arunachal Pradesh" },
  { city: "Naharlagun", state: "Arunachal Pradesh" },
  { city: "Tawang", state: "Arunachal Pradesh" },

  // Assam
  { city: "Guwahati", state: "Assam" },
  { city: "Silchar", state: "Assam" },
  { city: "Dibrugarh", state: "Assam" },
  { city: "Jorhat", state: "Assam" },
  { city: "Nagaon", state: "Assam" },
  { city: "Tinsukia", state: "Assam" },
  { city: "Tezpur", state: "Assam" },

  // Bihar
  { city: "Patna", state: "Bihar" },
  { city: "Gaya", state: "Bihar" },
  { city: "Bhagalpur", state: "Bihar" },
  { city: "Muzaffarpur", state: "Bihar" },
  { city: "Purnia", state: "Bihar" },
  { city: "Darbhanga", state: "Bihar" },
  { city: "Arrah", state: "Bihar" },
  { city: "Begusarai", state: "Bihar" },

  // Chhattisgarh
  { city: "Raipur", state: "Chhattisgarh" },
  { city: "Bhilai", state: "Chhattisgarh" },
  { city: "Bilaspur", state: "Chhattisgarh" },
  { city: "Korba", state: "Chhattisgarh" },
  { city: "Durg", state: "Chhattisgarh" },
  { city: "Rajnandgaon", state: "Chhattisgarh" },
  { city: "Jagdalpur", state: "Chhattisgarh" },

  // Delhi
  { city: "New Delhi", state: "Delhi" },
  { city: "Delhi", state: "Delhi" },

  // Goa
  { city: "Panaji", state: "Goa" },
  { city: "Margao", state: "Goa" },
  { city: "Vasco da Gama", state: "Goa" },
  { city: "Mapusa", state: "Goa" },
  { city: "Ponda", state: "Goa" },

  // Gujarat
  { city: "Ahmedabad", state: "Gujarat" },
  { city: "Surat", state: "Gujarat" },
  { city: "Vadodara", state: "Gujarat" },
  { city: "Rajkot", state: "Gujarat" },
  { city: "Bhavnagar", state: "Gujarat" },
  { city: "Jamnagar", state: "Gujarat" },
  { city: "Junagadh", state: "Gujarat" },
  { city: "Gandhinagar", state: "Gujarat" },
  { city: "Anand", state: "Gujarat" },
  { city: "Navsari", state: "Gujarat" },
  { city: "Morbi", state: "Gujarat" },
  { city: "Nadiad", state: "Gujarat" },
  { city: "Bharuch", state: "Gujarat" },
  { city: "Porbandar", state: "Gujarat" },

  // Haryana
  { city: "Gurugram", state: "Haryana" },
  { city: "Faridabad", state: "Haryana" },
  { city: "Panipat", state: "Haryana" },
  { city: "Ambala", state: "Haryana" },
  { city: "Hisar", state: "Haryana" },
  { city: "Karnal", state: "Haryana" },
  { city: "Rohtak", state: "Haryana" },
  { city: "Sonipat", state: "Haryana" },
  { city: "Panchkula", state: "Haryana" },
  { city: "Yamunanagar", state: "Haryana" },

  // Himachal Pradesh
  { city: "Shimla", state: "Himachal Pradesh" },
  { city: "Manali", state: "Himachal Pradesh" },
  { city: "Dharamshala", state: "Himachal Pradesh" },
  { city: "Solan", state: "Himachal Pradesh" },
  { city: "Mandi", state: "Himachal Pradesh" },
  { city: "Kullu", state: "Himachal Pradesh" },

  // Jharkhand
  { city: "Ranchi", state: "Jharkhand" },
  { city: "Jamshedpur", state: "Jharkhand" },
  { city: "Dhanbad", state: "Jharkhand" },
  { city: "Bokaro", state: "Jharkhand" },
  { city: "Deoghar", state: "Jharkhand" },
  { city: "Hazaribagh", state: "Jharkhand" },

  // Karnataka
  { city: "Bengaluru", state: "Karnataka" },
  { city: "Mysuru", state: "Karnataka" },
  { city: "Mangaluru", state: "Karnataka" },
  { city: "Hubli", state: "Karnataka" },
  { city: "Dharwad", state: "Karnataka" },
  { city: "Belgaum", state: "Karnataka" },
  { city: "Gulbarga", state: "Karnataka" },
  { city: "Davangere", state: "Karnataka" },
  { city: "Shimoga", state: "Karnataka" },
  { city: "Tumkur", state: "Karnataka" },
  { city: "Udupi", state: "Karnataka" },
  { city: "Bellary", state: "Karnataka" },

  // Kerala
  { city: "Thiruvananthapuram", state: "Kerala" },
  { city: "Kochi", state: "Kerala" },
  { city: "Kozhikode", state: "Kerala" },
  { city: "Thrissur", state: "Kerala" },
  { city: "Kollam", state: "Kerala" },
  { city: "Kannur", state: "Kerala" },
  { city: "Alappuzha", state: "Kerala" },
  { city: "Palakkad", state: "Kerala" },
  { city: "Kottayam", state: "Kerala" },
  { city: "Malappuram", state: "Kerala" },

  // Madhya Pradesh
  { city: "Bhopal", state: "Madhya Pradesh" },
  { city: "Indore", state: "Madhya Pradesh" },
  { city: "Jabalpur", state: "Madhya Pradesh" },
  { city: "Gwalior", state: "Madhya Pradesh" },
  { city: "Ujjain", state: "Madhya Pradesh" },
  { city: "Sagar", state: "Madhya Pradesh" },
  { city: "Dewas", state: "Madhya Pradesh" },
  { city: "Satna", state: "Madhya Pradesh" },
  { city: "Ratlam", state: "Madhya Pradesh" },
  { city: "Rewa", state: "Madhya Pradesh" },

  // Maharashtra
  { city: "Mumbai", state: "Maharashtra" },
  { city: "Pune", state: "Maharashtra" },
  { city: "Nagpur", state: "Maharashtra" },
  { city: "Thane", state: "Maharashtra" },
  { city: "Nashik", state: "Maharashtra" },
  { city: "Aurangabad", state: "Maharashtra" },
  { city: "Solapur", state: "Maharashtra" },
  { city: "Kolhapur", state: "Maharashtra" },
  { city: "Navi Mumbai", state: "Maharashtra" },
  { city: "Amravati", state: "Maharashtra" },
  { city: "Sangli", state: "Maharashtra" },
  { city: "Latur", state: "Maharashtra" },
  { city: "Dhule", state: "Maharashtra" },
  { city: "Ahmednagar", state: "Maharashtra" },
  { city: "Akola", state: "Maharashtra" },
  { city: "Jalgaon", state: "Maharashtra" },
  { city: "Chandrapur", state: "Maharashtra" },
  { city: "Palghar", state: "Maharashtra" },

  // Manipur
  { city: "Imphal", state: "Manipur" },
  { city: "Thoubal", state: "Manipur" },
  { city: "Bishnupur", state: "Manipur" },

  // Meghalaya
  { city: "Shillong", state: "Meghalaya" },
  { city: "Tura", state: "Meghalaya" },
  { city: "Jowai", state: "Meghalaya" },

  // Mizoram
  { city: "Aizawl", state: "Mizoram" },
  { city: "Lunglei", state: "Mizoram" },

  // Nagaland
  { city: "Kohima", state: "Nagaland" },
  { city: "Dimapur", state: "Nagaland" },
  { city: "Mokokchung", state: "Nagaland" },

  // Odisha
  { city: "Bhubaneswar", state: "Odisha" },
  { city: "Cuttack", state: "Odisha" },
  { city: "Rourkela", state: "Odisha" },
  { city: "Berhampur", state: "Odisha" },
  { city: "Sambalpur", state: "Odisha" },
  { city: "Puri", state: "Odisha" },
  { city: "Balasore", state: "Odisha" },

  // Punjab
  { city: "Ludhiana", state: "Punjab" },
  { city: "Amritsar", state: "Punjab" },
  { city: "Jalandhar", state: "Punjab" },
  { city: "Patiala", state: "Punjab" },
  { city: "Bathinda", state: "Punjab" },
  { city: "Mohali", state: "Punjab" },
  { city: "Hoshiarpur", state: "Punjab" },
  { city: "Pathankot", state: "Punjab" },

  // Rajasthan
  { city: "Jaipur", state: "Rajasthan" },
  { city: "Jodhpur", state: "Rajasthan" },
  { city: "Udaipur", state: "Rajasthan" },
  { city: "Kota", state: "Rajasthan" },
  { city: "Ajmer", state: "Rajasthan" },
  { city: "Bikaner", state: "Rajasthan" },
  { city: "Alwar", state: "Rajasthan" },
  { city: "Bhilwara", state: "Rajasthan" },
  { city: "Sikar", state: "Rajasthan" },
  { city: "Jaisalmer", state: "Rajasthan" },
  { city: "Pushkar", state: "Rajasthan" },

  // Sikkim
  { city: "Gangtok", state: "Sikkim" },
  { city: "Namchi", state: "Sikkim" },

  // Tamil Nadu
  { city: "Chennai", state: "Tamil Nadu" },
  { city: "Coimbatore", state: "Tamil Nadu" },
  { city: "Madurai", state: "Tamil Nadu" },
  { city: "Tiruchirappalli", state: "Tamil Nadu" },
  { city: "Salem", state: "Tamil Nadu" },
  { city: "Tirunelveli", state: "Tamil Nadu" },
  { city: "Erode", state: "Tamil Nadu" },
  { city: "Vellore", state: "Tamil Nadu" },
  { city: "Thoothukudi", state: "Tamil Nadu" },
  { city: "Thanjavur", state: "Tamil Nadu" },
  { city: "Dindigul", state: "Tamil Nadu" },
  { city: "Tiruppur", state: "Tamil Nadu" },
  { city: "Ooty", state: "Tamil Nadu" },
  { city: "Pondicherry", state: "Puducherry" },

  // Telangana
  { city: "Hyderabad", state: "Telangana" },
  { city: "Warangal", state: "Telangana" },
  { city: "Nizamabad", state: "Telangana" },
  { city: "Karimnagar", state: "Telangana" },
  { city: "Khammam", state: "Telangana" },
  { city: "Mahbubnagar", state: "Telangana" },
  { city: "Secunderabad", state: "Telangana" },

  // Tripura
  { city: "Agartala", state: "Tripura" },
  { city: "Udaipur", state: "Tripura" },

  // Uttar Pradesh
  { city: "Lucknow", state: "Uttar Pradesh" },
  { city: "Kanpur", state: "Uttar Pradesh" },
  { city: "Agra", state: "Uttar Pradesh" },
  { city: "Varanasi", state: "Uttar Pradesh" },
  { city: "Noida", state: "Uttar Pradesh" },
  { city: "Ghaziabad", state: "Uttar Pradesh" },
  { city: "Prayagraj", state: "Uttar Pradesh" },
  { city: "Meerut", state: "Uttar Pradesh" },
  { city: "Bareilly", state: "Uttar Pradesh" },
  { city: "Aligarh", state: "Uttar Pradesh" },
  { city: "Moradabad", state: "Uttar Pradesh" },
  { city: "Gorakhpur", state: "Uttar Pradesh" },
  { city: "Saharanpur", state: "Uttar Pradesh" },
  { city: "Jhansi", state: "Uttar Pradesh" },
  { city: "Mathura", state: "Uttar Pradesh" },
  { city: "Firozabad", state: "Uttar Pradesh" },
  { city: "Greater Noida", state: "Uttar Pradesh" },

  // Uttarakhand
  { city: "Dehradun", state: "Uttarakhand" },
  { city: "Haridwar", state: "Uttarakhand" },
  { city: "Rishikesh", state: "Uttarakhand" },
  { city: "Haldwani", state: "Uttarakhand" },
  { city: "Roorkee", state: "Uttarakhand" },
  { city: "Nainital", state: "Uttarakhand" },
  { city: "Mussoorie", state: "Uttarakhand" },

  // West Bengal
  { city: "Kolkata", state: "West Bengal" },
  { city: "Howrah", state: "West Bengal" },
  { city: "Durgapur", state: "West Bengal" },
  { city: "Asansol", state: "West Bengal" },
  { city: "Siliguri", state: "West Bengal" },
  { city: "Darjeeling", state: "West Bengal" },
  { city: "Bardhaman", state: "West Bengal" },
  { city: "Malda", state: "West Bengal" },
  { city: "Kharagpur", state: "West Bengal" },

  // Union Territories
  { city: "Chandigarh", state: "Chandigarh" },
  { city: "Puducherry", state: "Puducherry" },
  { city: "Port Blair", state: "Andaman and Nicobar Islands" },
  { city: "Silvassa", state: "Dadra and Nagar Haveli" },
  { city: "Daman", state: "Daman and Diu" },
  { city: "Diu", state: "Daman and Diu" },
  { city: "Kavaratti", state: "Lakshadweep" },
  { city: "Srinagar", state: "Jammu and Kashmir" },
  { city: "Jammu", state: "Jammu and Kashmir" },
  { city: "Leh", state: "Ladakh" },
];

// All unique states for state autocomplete
export const indianStates: string[] = [
  ...new Set(indianCities.map((c) => c.state)),
].sort();

// Search cities by query (case-insensitive, prefix match first then substring)
export function searchCities(query: string, limit = 8): CityData[] {
  if (!query || query.trim().length === 0) return [];
  const q = query.toLowerCase().trim();

  const prefixMatches: CityData[] = [];
  const substringMatches: CityData[] = [];

  for (const item of indianCities) {
    const cityLower = item.city.toLowerCase();
    if (cityLower.startsWith(q)) {
      prefixMatches.push(item);
    } else if (cityLower.includes(q)) {
      substringMatches.push(item);
    }
  }

  return [...prefixMatches, ...substringMatches].slice(0, limit);
}

// Search states by query
export function searchStates(query: string, limit = 8): string[] {
  if (!query || query.trim().length === 0) return [];
  const q = query.toLowerCase().trim();

  const prefixMatches: string[] = [];
  const substringMatches: string[] = [];

  for (const state of indianStates) {
    const stateLower = state.toLowerCase();
    if (stateLower.startsWith(q)) {
      prefixMatches.push(state);
    } else if (stateLower.includes(q)) {
      substringMatches.push(state);
    }
  }

  return [...prefixMatches, ...substringMatches].slice(0, limit);
}

// Get state for a city name
export function getStateForCity(cityName: string): string | null {
  const match = indianCities.find(
    (c) => c.city.toLowerCase() === cityName.toLowerCase()
  );
  return match?.state ?? null;
}
