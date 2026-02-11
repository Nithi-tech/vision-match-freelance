import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from config.env import settings
from typing import Optional

SMTP_HOST = settings.SMTP_HOST
SMTP_PORT = settings.SMTP_PORT
SMTP_USER = settings.SMTP_USER
SMTP_PASSWORD = settings.SMTP_PASSWORD
FROM_EMAIL = settings.FROM_EMAIL



async def send_signup_success_email(email: str):
    subject = "Welcome to VisionMatch 🎉 | Signup Successful"

    body = f"""
Hello,

Welcome to VisionMatch!

Your account has been successfully created, and you're all set to get started.
You can now log in and explore our platform.

If you did not create this account, please contact our support team immediately.

We’re excited to have you with us and look forward to supporting your journey.

Best regards,
VisionMatch Team
support@visionmatch.com
"""

    send_email(email, subject, body)


async def send_booking_email_to_client(
    client_email: str,
    client_name: str,
    creator_name: str,
    service_type: str,
    event_date: Optional[str],
    location: Optional[str],
    package_name: Optional[str],
    package_price: Optional[str],
    booking_id: str
):
    """Send booking confirmation email to client"""
    subject = "📸 Booking Request Sent | VisionMatch"

    body = f"""
Hello {client_name},

Your booking request has been sent successfully!

──────────────────────────────
BOOKING DETAILS
──────────────────────────────

Booking ID: {booking_id}
Creator: {creator_name}
Service: {service_type or 'Photography/Videography'}
Package: {package_name or 'Custom Package'}
Price: {package_price or 'To be discussed'}
Event Date: {event_date or 'To be confirmed'}
Location: {location or 'To be confirmed'}

──────────────────────────────

What's Next?
1. Wait for {creator_name} to review your request
2. You'll be notified once they respond
3. Connect through chat to discuss details

You can track your booking status in your dashboard.

Best regards,
VisionMatch Team
support@visionmatch.com
"""

    send_email(client_email, subject, body)


async def send_booking_email_to_creator(
    creator_email: str,
    creator_name: str,
    client_name: str,
    service_type: str,
    event_date: Optional[str],
    location: Optional[str],
    package_name: Optional[str],
    package_price: Optional[str],
    booking_id: str,
    client_message: Optional[str] = None
):
    """Send new booking notification email to creator"""
    subject = "🎉 New Booking Request | VisionMatch"

    message_section = ""
    if client_message:
        message_section = f"""
Client's Message:
"{client_message}"

"""

    body = f"""
Hello {creator_name},

You have received a new booking request!

──────────────────────────────
BOOKING DETAILS
──────────────────────────────

Booking ID: {booking_id}
Client: {client_name}
Service: {service_type or 'Photography/Videography'}
Package: {package_name or 'Custom Package'}
Price: {package_price or 'To be discussed'}
Event Date: {event_date or 'To be confirmed'}
Location: {location or 'To be confirmed'}

──────────────────────────────
{message_section}
Action Required:
Please log in to your dashboard to review and respond to this booking request.

You can accept, decline, or negotiate the terms with the client.

Best regards,
VisionMatch Team
support@visionmatch.com
"""

    send_email(creator_email, subject, body)


async def send_booking_accepted_email_to_client(
    client_email: str,
    client_name: str,
    creator_name: str,
    service_type: str,
    event_date: Optional[str],
    location: Optional[str],
    final_price: Optional[str],
    booking_id: str
):
    """Send email to client when creator accepts booking"""
    subject = "Booking Accepted | VisionMatch"

    body = f"""
Hello {client_name},

Great news! {creator_name} has accepted your booking request.

──────────────────────────────
BOOKING CONFIRMED
──────────────────────────────

Booking ID: {booking_id}
Creator: {creator_name}
Service: {service_type or 'Photography/Videography'}
Final Price: {final_price or 'As discussed'}
Event Date: {event_date or 'To be confirmed'}
Location: {location or 'To be confirmed'}

──────────────────────────────

Next Steps:
1. Complete the payment to secure your booking
2. Connect with {creator_name} to finalize details
3. Prepare for your event!

Visit your dashboard to proceed with the payment.

Best regards,
VisionMatch Team
support@visionmatch.com
"""

    send_email(client_email, subject, body)


async def send_booking_declined_email_to_client(
    client_email: str,
    client_name: str,
    creator_name: str,
    booking_id: str,
    decline_message: Optional[str] = None
):
    """Send email to client when creator declines booking"""
    subject = "Booking Update | VisionMatch"

    message_section = ""
    if decline_message:
        message_section = f"""
Creator's Message:
"{decline_message}"

"""

    body = f"""
Hello {client_name},

Unfortunately, {creator_name} is unable to accept your booking request at this time.

Booking ID: {booking_id}
{message_section}
Don't worry! There are many talented creators on VisionMatch.
Browse our platform to find another creator who fits your needs.

If you need any assistance, our support team is here to help.

Best regards,
VisionMatch Team
support@visionmatch.com
"""

    send_email(client_email, subject, body)


async def send_payment_success_email_to_client(
    client_email: str,
    client_name: str,
    creator_name: str,
    service_type: str,
    event_date: Optional[str],
    location: Optional[str],
    booking_id: str,
    total_amount: Optional[str] = None,
    platform_fee: Optional[str] = None,
    gst: Optional[str] = None,
    final_amount: Optional[str] = None,
    transaction_id: Optional[str] = None
):
    """Send payment success email to client after escrow payment"""
    subject = "💰 Payment Successful | VisionMatch"

    body = f"""
Hello {client_name},

Your payment has been successfully processed and is now securely held in escrow!

──────────────────────────────
PAYMENT RECEIPT
──────────────────────────────

Booking ID: {booking_id}
Transaction ID: {transaction_id or 'N/A'}
Creator: {creator_name}
Service: {service_type or 'Photography/Videography'}
Event Date: {event_date or 'To be confirmed'}
Location: {location or 'To be confirmed'}

──────────────────────────────
PAYMENT BREAKDOWN
──────────────────────────────

Base Amount: {total_amount or 'N/A'}
Platform Fee (10%): {platform_fee or 'N/A'}
GST (18%): {gst or 'N/A'}
──────────────────────────────
Total Paid: {final_amount or 'N/A'}

──────────────────────────────

Your funds are safely held in escrow and will be released to the creator upon successful project completion.

What's Next?
1. Connect with {creator_name} to finalize event details
2. Review deliverables after the event
3. Confirm completion to release the payment

If you have any questions, contact our support team.

Best regards,
VisionMatch Team
support@visionmatch.com
"""

    send_email(client_email, subject, body)


def send_email(to_email: str, subject: str, body: str):
    if not all([SMTP_HOST, SMTP_USER, SMTP_PASSWORD, FROM_EMAIL]):
        raise Exception("SMTP configuration is incomplete")

    msg = MIMEMultipart()
    msg["From"] = FROM_EMAIL
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.attach(MIMEText(body, "plain"))

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(msg)
    except Exception:
        raise Exception("Email sending failed")
