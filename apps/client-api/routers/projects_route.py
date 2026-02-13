# routes/project_requests.py
from fastapi import APIRouter, HTTPException
from config.clients import db  # Use Firestore from clients.py
from uuid import uuid4
import time
from models.projectRequest import (
    ProjectRequest,
    ProjectRequestCreate,
    ProjectRequestResponse
)
from pydantic import BaseModel
from typing import Optional, List

router = APIRouter()

# Collection names
PROJECT_REQUESTS_COLLECTION = "ProjectRequests"
PROJECT_MESSAGES_COLLECTION = "ProjectMessages"
BOOKINGS_COLLECTION = "Bookings"
REVIEWS_COLLECTION = "Reviews"


# =========================
# PYDANTIC MODELS
# =========================
class NegotiationMessage(BaseModel):
    sender: str  # 'client' or 'creator'
    senderId: str
    message: str
    price: Optional[float] = None
    deliverables: Optional[str] = None
    type: str = "text"  # 'text', 'offer', 'counter', 'accepted'

class ReviewCreate(BaseModel):
    bookingId: str
    clientId: str
    creatorId: str
    overallRating: int
    aspects: Optional[dict] = {}  # {quality: 5, communication: 4, ...}
    review: str
    recommend: bool = True
    selectedTags: Optional[List[str]] = []
    sharePublicly: bool = True


# =========================
# CREATE PROJECT REQUEST
# =========================
@router.post("/api/projects/request")
def create_project_request(payload: ProjectRequestCreate):
    try:
        request_id = f"req_{uuid4().hex[:8]}"

        # Use Firestore collection
        doc_ref = db.collection(PROJECT_REQUESTS_COLLECTION).document(request_id)
        
        # Fetch creator's starting_price to store with the request
        creator_starting_price = None
        try:
            creator_doc = db.collection("Users").document(payload.creatorId).get()
            if creator_doc.exists:
                creator_data = creator_doc.to_dict()
                creator_starting_price = creator_data.get("starting_price")
        except:
            pass

        data = {
            "id": request_id,
            "clientId": payload.clientId,

            "creatorId": payload.creatorId,
            "package": {
                "id": payload.packageId,
                "name": payload.packageName or "Custom Inquiry",
                "price": payload.packagePrice or "To be discussed"
            },
            
            "isInquiry": payload.isInquiry or False,

            "serviceType": payload.serviceType,
            "category": payload.category,
            "eventDate": payload.eventDate,
            "duration": payload.duration,
            "location": payload.location,
            "budget": payload.budget,
            
            # Store creator's starting_price for payment calculation
            "creator_starting_price": creator_starting_price,
            
            "selectedStyles": payload.selectedStyles or [],
            "styleNotes": payload.styleNotes,
            "pinterestLink": payload.pinterestLink,
            "referenceImages": payload.referenceImages or [],

            "message": payload.message,

            "creatorName": payload.creatorName,
            "creatorSpecialisation": payload.creatorSpecialisation,

            "status": "pending_creator",
            "createdAt": int(time.time() * 1000),
            "updatedAt": int(time.time() * 1000)
        }

        doc_ref.set(data)

        return {
            "success": True,
            "requestId": request_id
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# =========================
# GET SINGLE REQUEST BY ID
# =========================
@router.get("/api/projects/request/{request_id}")
def get_request_by_id(request_id: str):
    """Get a single project request by ID"""
    doc_ref = db.collection(PROJECT_REQUESTS_COLLECTION).document(request_id)
    doc = doc_ref.get()

    if not doc.exists:
        raise HTTPException(status_code=404, detail="Request not found")

    return {
        "success": True,
        "data": doc.to_dict()
    }


# =========================
# RESPOND TO REQUEST
# =========================
@router.post("/api/project-request/{request_id}/respond")
def respond_to_request(request_id: str, payload: ProjectRequestResponse):
    doc_ref = db.collection(PROJECT_REQUESTS_COLLECTION).document(request_id)
    doc = doc_ref.get()

    if not doc.exists:
        raise HTTPException(status_code=404, detail="Request not found")

    if payload.action not in ["accept", "decline", "negotiate"]:
        raise HTTPException(status_code=400, detail="Invalid action")

    request_data = doc.to_dict()
    
    update = {
        "status": (
            "accepted" if payload.action == "accept" else
            "declined" if payload.action == "decline" else
            "negotiation_proposed"
        ),
        "creator_message": payload.message,
        "updatedAt": int(time.time() * 1000)
    }
    
    # When accepting, set finalOffer with the agreed price
    if payload.action == "accept":
        # Determine price: use currentOffer if negotiated, otherwise use package price or creator's starting price
        current_offer = request_data.get("currentOffer")
        if current_offer and current_offer.get("price"):
            # Use the negotiated price
            update["finalOffer"] = {
                "price": current_offer.get("price"),
                "deliverables": current_offer.get("deliverables", "As discussed")
            }
        else:
            # Get price from package or fetch creator's starting_price
            package = request_data.get("package", {})
            package_price = package.get("price")
            
            # Parse package price if it's a string
            final_price = None
            if isinstance(package_price, (int, float)) and package_price > 0:
                final_price = package_price
            elif isinstance(package_price, str):
                import re
                match = re.search(r'[\d,]+', package_price.replace(',', ''))
                if match:
                    try:
                        final_price = float(match.group().replace(',', ''))
                    except:
                        pass
            
            # If no valid package price, try to get creator's starting_price
            if not final_price or final_price <= 0:
                creator_id = request_data.get("creatorId")
                if creator_id:
                    try:
                        creator_doc = db.collection("Users").document(creator_id).get()
                        if creator_doc.exists:
                            creator_data = creator_doc.to_dict()
                            final_price = creator_data.get("starting_price", 0)
                    except:
                        pass
            
            if final_price and final_price > 0:
                update["finalOffer"] = {
                    "price": final_price,
                    "deliverables": "As discussed"
                }

    doc_ref.update(update)
    return {"success": True}


# =========================
# GET REQUESTS BY CLIENT
# =========================
@router.get("/api/projects/requests/{clientId}")
def get_requests_by_client(clientId: str):
    # Query Firestore for requests by this client
    docs = db.collection(PROJECT_REQUESTS_COLLECTION).where("clientId", "==", clientId).stream()

    client_requests = []
    for doc in docs:
        client_requests.append(doc.to_dict())

    return {
        "success": True,
        "count": len(client_requests),
        "data": client_requests
    }


# =========================
# GET REQUESTS BY CREATOR
# =========================
@router.get("/api/projects/creator-requests/{creatorId}")
def get_requests_by_creator(creatorId: str):
    """Get all project requests sent to a specific creator"""
    # Query Firestore for requests by this creator
    docs = db.collection(PROJECT_REQUESTS_COLLECTION).where("creatorId", "==", creatorId).stream()

    creator_requests = []
    for doc in docs:
        creator_requests.append(doc.to_dict())

    # Sort by createdAt descending (newest first)
    creator_requests.sort(key=lambda x: x.get("createdAt", 0), reverse=True)

    return {
        "success": True,
        "count": len(creator_requests),
        "data": creator_requests
    }


# =========================
# NEGOTIATION / CHAT ENDPOINTS
# =========================
@router.post("/api/projects/{request_id}/messages")
def send_negotiation_message(request_id: str, payload: NegotiationMessage):
    """Send a message in the negotiation chat"""
    try:
        # Verify request exists
        request_ref = db.collection(PROJECT_REQUESTS_COLLECTION).document(request_id)
        request_doc = request_ref.get()
        if not request_doc.exists:
            raise HTTPException(status_code=404, detail="Request not found")
        
        request_data = request_doc.to_dict()

        # Create message
        message_id = f"msg_{uuid4().hex[:8]}"
        message_ref = db.collection(PROJECT_MESSAGES_COLLECTION).document(request_id).collection("messages").document(message_id)
        
        message_data = {
            "id": message_id,
            "sender": payload.sender,
            "senderId": payload.senderId,
            "message": payload.message,
            "type": payload.type,
            "timestamp": int(time.time() * 1000),
            "status": "sent"
        }
        
        # Add price/deliverables for offer messages
        if payload.price is not None:
            message_data["price"] = payload.price
        if payload.deliverables:
            message_data["deliverables"] = payload.deliverables
            
        message_ref.set(message_data)

        # Update request status if it's an offer/counter
        if payload.type in ["offer", "counter"]:
            request_ref.update({
                "currentOffer": {
                    "price": payload.price,
                    "deliverables": payload.deliverables,
                    "from": payload.sender
                },
                "status": "negotiating",
                "updatedAt": int(time.time() * 1000)
            })
        elif payload.type == "accepted":
            request_ref.update({
                "status": "accepted",
                "finalOffer": {
                    "price": payload.price,
                    "deliverables": payload.deliverables
                },
                "updatedAt": int(time.time() * 1000)
            })

        return {"success": True, "messageId": message_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/projects/{request_id}/messages")
def get_negotiation_messages(request_id: str):
    """Get all messages for a negotiation"""
    try:
        messages_ref = db.collection(PROJECT_MESSAGES_COLLECTION).document(request_id).collection("messages")
        docs = messages_ref.stream()
        
        message_list = []
        for doc in docs:
            message_list.append(doc.to_dict())
        
        # Sort by timestamp
        message_list.sort(key=lambda x: x.get("timestamp", 0))
        
        return {
            "success": True,
            "messages": message_list
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# =========================
# BOOKING ENDPOINTS
# =========================
@router.get("/api/bookings/{booking_id}")
def get_booking(booking_id: str):
    """Get booking details"""
    doc_ref = db.collection(BOOKINGS_COLLECTION).document(booking_id)
    doc = doc_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Booking not found")
    return {"success": True, "data": doc.to_dict()}


@router.get("/api/bookings/client/{client_id}")
def get_client_bookings(client_id: str):
    """Get all bookings for a client"""
    docs = db.collection(BOOKINGS_COLLECTION).where("clientId", "==", client_id).stream()
    
    client_bookings = []
    for doc in docs:
        client_bookings.append(doc.to_dict())
    
    return {
        "success": True,
        "count": len(client_bookings),
        "data": client_bookings
    }


@router.post("/api/bookings/{booking_id}/confirm-event")
def confirm_event_completion(booking_id: str, payload: dict):
    """Client confirms event happened successfully"""
    try:
        doc_ref = db.collection(BOOKINGS_COLLECTION).document(booking_id)
        doc = doc_ref.get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        confirmed = payload.get("confirmed", True)
        
        if confirmed:
            # Release escrow to creator
            doc_ref.update({
                "status": "completed",
                "escrowStatus": "released",
                "eventConfirmedAt": int(time.time() * 1000),
                "updatedAt": int(time.time() * 1000)
            })
        else:
            # Start dispute process
            doc_ref.update({
                "status": "disputed",
                "escrowStatus": "held",
                "disputeReason": payload.get("reason", ""),
                "disputedAt": int(time.time() * 1000),
                "updatedAt": int(time.time() * 1000)
            })
        
        return {"success": True, "status": "completed" if confirmed else "disputed"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# =========================
# REVIEW ENDPOINTS
# =========================
@router.post("/api/reviews/create")
def create_review(payload: ReviewCreate):
    """Submit a review for a booking"""
    try:
        # Verify booking exists and is completed
        booking_ref = db.collection(BOOKINGS_COLLECTION).document(payload.bookingId)
        booking_doc = booking_ref.get()
        if not booking_doc.exists:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        # Create review
        review_id = f"rev_{uuid4().hex[:8]}"
        review_ref = db.collection(REVIEWS_COLLECTION).document(review_id)
        
        review_data = {
            "id": review_id,
            "bookingId": payload.bookingId,
            "clientId": payload.clientId,
            "creatorId": payload.creatorId,
            "overallRating": payload.overallRating,
            "aspects": payload.aspects or {},
            "review": payload.review,
            "recommend": payload.recommend,
            "selectedTags": payload.selectedTags or [],
            "sharePublicly": payload.sharePublicly,
            "createdAt": int(time.time() * 1000)
        }
        review_ref.set(review_data)

        # Update booking with review
        booking_ref.update({
            "reviewId": review_id,
            "reviewed": True,
            "updatedAt": int(time.time() * 1000)
        })

        # Update creator's average rating
        _update_creator_rating(payload.creatorId)

        return {"success": True, "reviewId": review_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def _update_creator_rating(creator_id: str):
    """Helper to update creator's average rating"""
    try:
        # Get all reviews for this creator
        docs = db.collection(REVIEWS_COLLECTION).where("creatorId", "==", creator_id).stream()
        
        creator_reviews = []
        for doc in docs:
            creator_reviews.append(doc.to_dict())
        
        if creator_reviews:
            avg_rating = sum(r.get("overallRating", 0) for r in creator_reviews) / len(creator_reviews)
            
            # Update in creators collection
            creator_ref = db.collection("creators").document(creator_id)
            creator_ref.update({
                "rating": round(avg_rating, 1),
                "reviewCount": len(creator_reviews)
            })
    except Exception as e:
        print(f"Failed to update creator rating: {e}")


@router.get("/api/reviews/creator/{creator_id}")
def get_creator_reviews(creator_id: str):
    """Get all reviews for a creator"""
    docs = db.collection(REVIEWS_COLLECTION).where("creatorId", "==", creator_id).stream()
    
    creator_reviews = []
    for doc in docs:
        creator_reviews.append(doc.to_dict())
    
    # Sort by date descending
    creator_reviews.sort(key=lambda x: x.get("createdAt", 0), reverse=True)
    
    return {
        "success": True,
        "count": len(creator_reviews),
        "data": creator_reviews
    }


@router.get("/api/reviews/check/{request_id}")
def check_review_status(request_id: str):
    """
    Check if a review exists for a given request ID.
    Used to determine if "Write Review" or "View Review" button should be shown.
    """
    try:
        # First, find the booking by requestId
        booking_query = db.collection(BOOKINGS_COLLECTION).where("requestId", "==", request_id).limit(1)
        booking_docs = list(booking_query.stream())
        
        if not booking_docs:
            # Also try with the request_id as booking_id directly
            booking_doc = db.collection(BOOKINGS_COLLECTION).document(request_id).get()
            if not booking_doc.exists:
                return {
                    "success": True,
                    "hasReview": False,
                    "bookingId": None,
                    "reviewId": None,
                    "message": "No booking found for this request"
                }
            booking_data = booking_doc.to_dict()
            booking_id = request_id
        else:
            booking_data = booking_docs[0].to_dict()
            booking_id = booking_data.get("id") or booking_docs[0].id
        
        # Check if booking has been reviewed
        reviewed = booking_data.get("reviewed", False)
        review_id = booking_data.get("reviewId")
        
        # If reviewed, fetch the review details
        review_data = None
        if reviewed and review_id:
            review_doc = db.collection(REVIEWS_COLLECTION).document(review_id).get()
            if review_doc.exists:
                review_data = review_doc.to_dict()
        
        return {
            "success": True,
            "hasReview": reviewed,
            "bookingId": booking_id,
            "reviewId": review_id,
            "review": review_data
        }
        
    except Exception as e:
        print(f"Error checking review status: {e}")
        return {
            "success": False,
            "hasReview": False,
            "bookingId": None,
            "reviewId": None,
            "message": str(e)
        }


@router.get("/api/reviews/{review_id}")
def get_review_by_id(review_id: str):
    """Get a specific review by ID"""
    try:
        review_doc = db.collection(REVIEWS_COLLECTION).document(review_id).get()
        
        if not review_doc.exists:
            raise HTTPException(status_code=404, detail="Review not found")
        
        return {
            "success": True,
            "data": review_doc.to_dict()
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))