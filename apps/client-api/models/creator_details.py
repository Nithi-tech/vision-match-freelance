from pydantic import BaseModel
from typing import List, Optional

class CreatorDetailsRequest(BaseModel):
    # Optional because we get it from the session token
    user_id: Optional[str] = None 
    full_name: str
    phone_number: Optional[str] = None
    city: str
    state: Optional[str] = ""
    operating_locations: List[str] = []
    years_experience: int
    bio: Optional[str] = ""
    gear_list: List[str] = []
    languages: List[str] = ["English"]
    travel_available: bool = True

class CreatorDetailsResponse(BaseModel):
    message: str
    user_id: str
    profile_completeness: int