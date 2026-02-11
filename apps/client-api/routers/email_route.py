from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr
from typing import Optional

from services.email_service import (
    send_signup_success_email,
    send_booking_email_to_client,
    send_booking_email_to_creator,
    send_booking_accepted_email_to_client,
    send_booking_declined_email_to_client,
    send_payment_success_email_to_client
)

router = APIRouter(prefix="/api/email", tags=["Email"])


# =========================
# REQUEST MODELS
# =========================
class SignupSuccessEmailRequest(BaseModel):
    email: EmailStr


class BookingEmailRequest(BaseModel):
    client_email: EmailStr
    client_name: str
    creator_email: EmailStr
    creator_name: str
    service_type: Optional[str] = None
    event_date: Optional[str] = None
    location: Optional[str] = None
    package_name: Optional[str] = None
    package_price: Optional[str] = None
    booking_id: str
    client_message: Optional[str] = None


class BookingAcceptedEmailRequest(BaseModel):
    client_email: EmailStr
    client_name: str
    creator_name: str
    service_type: Optional[str] = None
    event_date: Optional[str] = None
    location: Optional[str] = None
    final_price: Optional[str] = None
    booking_id: str


class BookingDeclinedEmailRequest(BaseModel):
    client_email: EmailStr
    client_name: str
    creator_name: str
    booking_id: str
    decline_message: Optional[str] = None


class PaymentSuccessEmailRequest(BaseModel):
    client_email: EmailStr
    client_name: str
    creator_name: str
    service_type: Optional[str] = None
    event_date: Optional[str] = None
    location: Optional[str] = None
    booking_id: str
    total_amount: Optional[str] = None
    platform_fee: Optional[str] = None
    gst: Optional[str] = None
    final_amount: Optional[str] = None
    transaction_id: Optional[str] = None


# =========================
# RESPONSE MODELS
# =========================
class EmailResponse(BaseModel):
    message: str


# =========================
# ENDPOINTS
# =========================
@router.post("/signUp", response_model=EmailResponse, status_code=status.HTTP_200_OK)
async def send_signup_success(payload: SignupSuccessEmailRequest):
    try:
        await send_signup_success_email(payload.email)
        return {"message": "Signup success email sent"}
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send signup success email"
        )


@router.post("/booking/new", response_model=EmailResponse, status_code=status.HTTP_200_OK)
async def send_booking_emails(payload: BookingEmailRequest):
    """Send booking notification emails to both client and creator"""
    try:
        # Send email to client
        await send_booking_email_to_client(
            client_email=payload.client_email,
            client_name=payload.client_name,
            creator_name=payload.creator_name,
            service_type=payload.service_type,
            event_date=payload.event_date,
            location=payload.location,
            package_name=payload.package_name,
            package_price=payload.package_price,
            booking_id=payload.booking_id
        )
        
        # Send email to creator
        await send_booking_email_to_creator(
            creator_email=payload.creator_email,
            creator_name=payload.creator_name,
            client_name=payload.client_name,
            service_type=payload.service_type,
            event_date=payload.event_date,
            location=payload.location,
            package_name=payload.package_name,
            package_price=payload.package_price,
            booking_id=payload.booking_id,
            client_message=payload.client_message
        )
        
        return {"message": "Booking emails sent to client and creator"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send booking emails: {str(e)}"
        )


@router.post("/booking/accepted", response_model=EmailResponse, status_code=status.HTTP_200_OK)
async def send_booking_accepted_email(payload: BookingAcceptedEmailRequest):
    """Send email to client when creator accepts the booking"""
    try:
        await send_booking_accepted_email_to_client(
            client_email=payload.client_email,
            client_name=payload.client_name,
            creator_name=payload.creator_name,
            service_type=payload.service_type,
            event_date=payload.event_date,
            location=payload.location,
            final_price=payload.final_price,
            booking_id=payload.booking_id
        )
        return {"message": "Booking accepted email sent to client"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send booking accepted email: {str(e)}"
        )


@router.post("/booking/declined", response_model=EmailResponse, status_code=status.HTTP_200_OK)
async def send_booking_declined_email(payload: BookingDeclinedEmailRequest):
    """Send email to client when creator declines the booking"""
    try:
        await send_booking_declined_email_to_client(
            client_email=payload.client_email,
            client_name=payload.client_name,
            creator_name=payload.creator_name,
            booking_id=payload.booking_id,
            decline_message=payload.decline_message
        )
        return {"message": "Booking declined email sent to client"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send booking declined email: {str(e)}"
        )


@router.post("/payment/success", response_model=EmailResponse, status_code=status.HTTP_200_OK)
async def send_payment_success_email(payload: PaymentSuccessEmailRequest):
    """Send payment receipt email to client after successful escrow payment"""
    try:
        await send_payment_success_email_to_client(
            client_email=payload.client_email,
            client_name=payload.client_name,
            creator_name=payload.creator_name,
            service_type=payload.service_type,
            event_date=payload.event_date,
            location=payload.location,
            booking_id=payload.booking_id,
            total_amount=payload.total_amount,
            platform_fee=payload.platform_fee,
            gst=payload.gst,
            final_amount=payload.final_amount,
            transaction_id=payload.transaction_id
        )
        return {"message": "Payment success email sent to client"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send payment success email: {str(e)}"
        )
