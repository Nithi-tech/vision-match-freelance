import axiosInstance from '@/utils/axiosInstance';

export const Email = {
  sendVerificationEmail: async (data: { email: string }) => {
    const response = await axiosInstance.post('/api/email/signUp', data);
    return response.data;
  },

  // Send booking notification to both client and creator when a new booking is created
  sendBookingEmail: async (data: {
    client_email: string;
    client_name: string;
    creator_email: string;
    creator_name: string;
    service_type?: string;
    event_date?: string;
    location?: string;
    package_name?: string;
    package_price?: string;
    booking_id: string;
    client_message?: string;
  }) => {
    const response = await axiosInstance.post('/api/email/booking/new', data);
    return response.data;
  },

  // Send email to client when creator accepts booking
  sendBookingAcceptedEmail: async (data: {
    client_email: string;
    client_name: string;
    creator_name: string;
    service_type?: string;
    event_date?: string;
    location?: string;
    final_price?: string;
    booking_id: string;
  }) => {
    const response = await axiosInstance.post('/api/email/booking/accepted', data);
    return response.data;
  },

  // Send email to client when creator declines booking
  sendBookingDeclinedEmail: async (data: {
    client_email: string;
    client_name: string;
    creator_name: string;
    booking_id: string;
    decline_message?: string;
  }) => {
    const response = await axiosInstance.post('/api/email/booking/declined', data);
    return response.data;
  },

  // Send payment receipt email to client after successful escrow payment
  sendPaymentSuccessEmail: async (data: {
    client_email: string;
    client_name: string;
    creator_name: string;
    service_type?: string;
    event_date?: string;
    location?: string;
    booking_id: string;
    total_amount?: string;
    platform_fee?: string;
    gst?: string;
    final_amount?: string;
    transaction_id?: string;
  }) => {
    const response = await axiosInstance.post('/api/email/payment/success', data);
    return response.data;
  }
}