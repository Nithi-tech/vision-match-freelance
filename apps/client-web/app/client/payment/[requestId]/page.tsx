'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import {
  ArrowLeft, Shield, Lock, Check, CheckCircle,
  Loader, Calendar, MapPin, User, AlertCircle,
  Package, Smartphone
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Auth } from '@/services/Auth';
import { getRequest, getCreator } from '@/services/creatorProfile';
import { Email } from '@/services/email';
import { cn } from '@vision-match/utils-js';
import { toast } from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';


// Helper to extract error message from API errors (handles Pydantic validation errors)
const getErrorMessage = (error: any): string => {
  if (!error) return 'An unknown error occurred';

  // Handle axios error response
  const detail = error.response?.data?.detail;

  if (!detail) {
    return error.message || 'An unknown error occurred';
  }

  // If detail is a string, return it directly
  if (typeof detail === 'string') {
    return detail;
  }

  // If detail is an array (Pydantic validation errors)
  if (Array.isArray(detail)) {
    return detail.map((err: any) => {
      if (typeof err === 'string') return err;
      // Pydantic error format: { type, loc, msg, input }
      return err.msg || JSON.stringify(err);
    }).join(', ');
  }

  // If detail is an object with msg property
  if (detail.msg) {
    return detail.msg;
  }

  // Fallback: stringify the object
  return JSON.stringify(detail);
};

// Floating background orb - LIGHT THEME
const FloatingOrb = ({ className, delay = 0 }: { className?: string; delay?: number }) => (
  <motion.div
    className={cn("absolute rounded-full blur-3xl opacity-10 pointer-events-none", className)}
    animate={{
      y: [0, -30, 0],
      scale: [1, 1.1, 1],
    }}
    transition={{
      duration: 8,
      repeat: Infinity,
      delay,
      ease: "easeInOut",
    }}
  />
);

// Progress Step Component
const ProgressStep = ({ number, title, isActive, isCompleted }: {
  number: number;
  title: string;
  isActive: boolean;
  isCompleted: boolean;
}) => (
  <div className={cn("flex-1 text-center", isActive || isCompleted ? "text-pink-600" : "text-gray-400")}>
    <div className={cn(
      "w-10 h-10 mx-auto rounded-full flex items-center justify-center transition-all",
      isCompleted ? "bg-gradient-to-br from-pink-500 to-purple-600 text-white" :
        isActive ? "bg-gradient-to-br from-pink-500 to-purple-600 text-white" :
          "bg-gray-200 text-gray-500"
    )}>
      {isCompleted ? <Check className="h-5 w-5" /> : number}
    </div>
    <p className="mt-2 text-xs font-medium">{title}</p>
  </div>
);

// Load Razorpay Script
const loadRazorpay = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      resolve(false);
    };
    document.body.appendChild(script);
  });
};

type OrderDetails = {
  id: string;
  creatorId: string;
  creatorName: string;
  creatorImage?: string;
  projectType: string;
  eventDate: string;
  location: string;
  totalAmount: number;
  platformFee: number;
  gst: number;
  finalAmount: number;
  deliverables: string;
};

export default function PaymentPage() {
  const router = useRouter();
  const params = useParams<{ requestId: string }>();
  const requestId = params.requestId;

  // Core States
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [clientId, setClientId] = useState<string | null>(null);
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);

  // Payment Flow States
  const [step, setStep] = useState(1);
  const [paymentId, setPaymentId] = useState('');
  const [escrowTransactionId, setEscrowTransactionId] = useState('');
  const [message, setMessage] = useState('');
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [simulationMode, setSimulationMode] = useState(false);
  const [checkingExistingPayment, setCheckingExistingPayment] = useState(true); // NEW: track if we're checking for existing payment

  // Auth check
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await Auth.me();
        if (!user) {
          router.push('/login');
          return;
        }
        setClientId(user.user.email);
      } catch (err: unknown) {
        console.error('Auth check failed:', err);
        router.push('/login');
      } finally {
        setIsAuthChecking(false);
      }
    };
    checkAuth();
  }, [router]);

  // Check for stored payment on mount - MUST run after auth check
  useEffect(() => {
    const checkStoredPayment = async () => {
      if (!requestId || isAuthChecking) return;

      setCheckingExistingPayment(true);
      
      // 1. Try to find a stored payment locally
      console.log('🔍 Checking localStorage for request:', requestId);
      let foundPaymentId = '';

      const storedPaymentKey = Object.keys(localStorage).find(key => {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '{}');
          return data.request_id === requestId;
        } catch {
          return false;
        }
      });

      if (storedPaymentKey) {
        const storedData = JSON.parse(localStorage.getItem(storedPaymentKey) || '{}');
        console.log('Found stored payment locally:', storedData);
        foundPaymentId = storedData.id;
      }

      // 2. If not found locally, check backend (Cross-Device Persistence)
      if (!foundPaymentId) {
        try {
          console.log('Checking backend for existing payment...');
          const serverRes = await axios.get(`${API_URL}/api/escrow/${requestId}/status`);
          if (serverRes.data.success && serverRes.data.payment) {
            console.log('Found payment on server:', serverRes.data.payment);
            foundPaymentId = serverRes.data.payment.id;
            // Cache it locally
            localStorage.setItem(foundPaymentId, JSON.stringify(serverRes.data.payment));
          }
        } catch (e) {
          console.log('ℹ️ No existing payment on server');
        }
      }

      if (foundPaymentId) {
        setPaymentId(foundPaymentId);
        // Sync status...
        try {
          const response = await axios.post(`${API_URL}/api/escrow/check-status/${foundPaymentId}`);
          if (response.data.success) {
            const payment = response.data.payment;

            // Update local storage with fresh data
            localStorage.setItem(payment.id, JSON.stringify(payment));
            setPaymentId(payment.id);
            setEscrowTransactionId(payment.razorpay_payment_id || payment.transaction_id);

            // Set Step based on Status
            if (payment.status === 'completed') {
              setStep(4);
              setMessage('Payment released to creator');
            } else if (payment.status === 'escrowed') {
              setStep(3);
              setMessage('Payment held in escrow');
            } else if (payment.status === 'pending') {
              setStep(2); // Waiting for verification
            }
          }
        } catch (e: any) {
          console.error('Failed to sync payment status:', e);
          // If payment not found in backend (404), clear it from local storage
          if (e.response && e.response.status === 404) {
            console.warn('Payment not found in backend, clearing local storage');
            localStorage.removeItem(storedPaymentKey || foundPaymentId);
            setPaymentId('');
            setStep(1); // Reset to start
          }
        }
      }
      
      setCheckingExistingPayment(false);
    };

    if (requestId && !isAuthChecking) {
      checkStoredPayment();
    }
  }, [requestId, isAuthChecking]);

  // Fetch order details
  const fetchOrderDetails = useCallback(async () => {
    if (!requestId) return;

    try {
      setLoading(true);
      const data = await getRequest(requestId);
      console.log('📦 Request data:', data);

      if (data) {
        // Use finalOffer (accepted price) first, then currentOffer, then package price, budget, or starting_price
        // Parse package.price if it's a string like "₹50,000" or "50000"
        const parsePrice = (priceStr: string | number | undefined): number | null => {
          if (typeof priceStr === 'number') return priceStr > 0 ? priceStr : null;
          if (typeof priceStr === 'string') {
            const cleaned = priceStr.replace(/[₹,\s]/g, '').match(/\d+/);
            return cleaned ? parseInt(cleaned[0], 10) : null;
          }
          return null;
        };
        
        const packagePrice = parsePrice(data.package?.price);
        const budgetPrice = parsePrice(data.budget);
        let startingPrice = data.creator_starting_price || data.creatorStartingPrice;
        
        // If no starting_price in request, fetch from creator profile
        const creatorId = data.creator_id || data.creatorId;
        if (!startingPrice && creatorId) {
          try {
            console.log('🔍 Fetching creator starting_price for:', creatorId);
            const creatorData = await getCreator(creatorId);
            if (creatorData?.starting_price) {
              startingPrice = creatorData.starting_price;
              console.log('✅ Got creator starting_price:', startingPrice);
            }
          } catch (e) {
            console.warn('Failed to fetch creator starting_price:', e);
          }
        }
        
        console.log('💰 Price sources:', { 
          finalOffer: data.final_offer?.price || data.finalOffer?.price,
          currentOffer: data.current_offer?.price || data.currentOffer?.price,
          packagePrice, 
          budgetPrice, 
          startingPrice 
        });
        
        const baseAmount = data.final_offer?.price || data.finalOffer?.price || 
                          data.current_offer?.price || data.currentOffer?.price ||
                          packagePrice || budgetPrice || startingPrice || 25000;
        
        console.log('✅ Using baseAmount:', baseAmount);
        
        const platformFee = Math.round(baseAmount * 0.10);
        const gst = Math.round((baseAmount + platformFee) * 0.18);
        const finalAmount = baseAmount + platformFee + gst;

        setOrderDetails({
          id: data.id || data._id,
          creatorId: data.creator_id || data.creatorId,
          creatorName: data.creator_name || data.creatorName || 'Creator',
          creatorImage: data.creator_image || data.creatorImage,
          projectType: data.project_type || data.projectType || data.category || 'Photography',
          eventDate: data.event_date || data.eventDate || 'TBD',
          location: data.location || 'TBD',
          totalAmount: baseAmount,
          platformFee,
          gst,
          finalAmount,
          deliverables: data.final_offer?.deliverables || data.finalOffer?.deliverables ||
                       data.current_offer?.deliverables || data.currentOffer?.deliverables || 'As discussed',
        });
      }
    } catch (err: unknown) {
      console.error('Failed to fetch order:', err);
      toast.error('Failed to load order details');
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  useEffect(() => {
    if (clientId && requestId) {
      fetchOrderDetails();
    }
  }, [clientId, requestId, fetchOrderDetails]);

  // Create payment and redirect to PhonePe
  const handlePayment = async () => {
    if (!orderDetails || !clientId) {
      toast.error('Missing order details or client ID');
      return;
    }

    // Validate required fields
    if (!orderDetails.creatorId) {
      toast.error('Creator ID is missing');
      return;
    }

    if (!orderDetails.finalAmount || orderDetails.finalAmount <= 0) {
      toast.error('Invalid payment amount');
      return;
    }

    setProcessing(true);
    setMessage('');

    try {
      // Load Razorpay SDK
      const res = await loadRazorpay();
      if (!res) {
        toast.error('Razorpay SDK failed to load');
        setProcessing(false);
        return;
      }

      // Create Order
      const requestBody = {
        client_id: clientId,
        creator_id: orderDetails.creatorId,
        request_id: requestId,
        amount: orderDetails.finalAmount,
        description: `Booking for ${orderDetails.projectType} with ${orderDetails.creatorName}`
      };

      console.log('Creating Razorpay order:', requestBody);
      const response = await axios.post(`${API_URL}/api/escrow/create-order`, requestBody);

      if (response.data.success) {
        const { order_id, amount_paise, key_id, currency, payment_id } = response.data;

        // Save initial payment info
        setPaymentId(payment_id);
        const paymentData = {
          id: payment_id,
          razorpay_order_id: order_id,
          request_id: requestId,
          amount: orderDetails.finalAmount,
          status: 'pending'
        };
        localStorage.setItem(payment_id, JSON.stringify(paymentData));

        // Open Razorpay Checkout
        const options = {
          key: key_id,
          amount: amount_paise,
          currency: currency,
          name: "Vision Match",
          description: `Booking for ${orderDetails.projectType}`,
          order_id: order_id,
          handler: async function (response: any) {
            setProcessing(true);
            try {
              // Verify Payment
              const verifyRes = await axios.post(`${API_URL}/api/escrow/verify-payment`, {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              });

              if (verifyRes.data.success) {
                toast.success('Payment successful!');
                setStep(3);
                setMessage('✅ Payment verified and held in escrow!');

                // Update local storage
                const updatedData = { ...paymentData, status: 'escrowed' };
                localStorage.setItem(payment_id, JSON.stringify(updatedData));

                // Send payment success email to client
                try {
                  await Email.sendPaymentSuccessEmail({
                    client_email: clientId!,
                    client_name: clientId?.split('@')[0] || 'Client',
                    creator_name: orderDetails.creatorName,
                    service_type: orderDetails.projectType,
                    event_date: orderDetails.eventDate,
                    location: orderDetails.location,
                    booking_id: requestId,
                    total_amount: `₹${orderDetails.totalAmount.toLocaleString()}`,
                    platform_fee: `₹${orderDetails.platformFee.toLocaleString()}`,
                    gst: `₹${orderDetails.gst.toLocaleString()}`,
                    final_amount: `₹${orderDetails.finalAmount.toLocaleString()}`,
                    transaction_id: response.razorpay_payment_id
                  });
                } catch (emailErr) {
                  console.error('Failed to send payment email:', emailErr);
                }
              }
            } catch (err: unknown) {
              console.error('Verification failed', err);
              toast.error('Payment verification failed');
              setMessage('❌ Payment verification failed. Please contact support.');
            } finally {
              setProcessing(false);
            }
          },
          prefill: {
            email: clientId,
          },
          theme: {
            color: "#db2777" // Pink-600
          }
        };

        const razorpay = new (window as any).Razorpay(options);
        razorpay.open();
        razorpay.on('payment.failed', function (response: any) {
          toast.error(response.error.description);
          setProcessing(false);
        });
      }
    } catch (error: any) {
      const errorMsg = getErrorMessage(error);
      setMessage(errorMsg);
      toast.error(errorMsg);
      setProcessing(false);
    }
  };

  // Check payment status
  const checkPaymentStatus = async (txnId: string) => {
    setCheckingStatus(true);
    setMessage('🔍 Checking payment status...');

    try {
      const response = await axios.post(`${API_URL}/api/escrow/check-status/${txnId}`);

      if (response.data.success) {
        const paymentData = JSON.parse(localStorage.getItem(paymentId || txnId) || '{}');
        paymentData.status = 'escrowed';
        localStorage.setItem(paymentId || txnId, JSON.stringify(paymentData));

        if (response.data.simulation) {
          setMessage('✅ SIMULATION: ' + response.data.message);
        } else {
          setMessage('✅ ' + response.data.message);
        }
        toast.success('Payment verified successfully!');
        setStep(3);
      } else {
        setMessage('❌ ' + (response.data.message || 'Payment not completed'));
        toast.error('Payment not completed');
      }
    } catch (error: any) {
      const errorMsg = getErrorMessage(error);
      setMessage(errorMsg);
      toast.error(errorMsg);
    } finally {
      setCheckingStatus(false);
    }
  };

  // Verify payment (step 2)
  const depositToEscrow = async () => {
    if (!escrowTransactionId && !paymentId) {
      setMessage('No payment ID found');
      return;
    }
    await checkPaymentStatus(escrowTransactionId || paymentId);
  };

  // Confirm and release payment to creator (step 3)
  const confirmPayment = async () => {
    setProcessing(true);
    setMessage('');

    try {
      const response = await axios.post(`${API_URL}/api/escrow/confirm`, {
        payment_id: paymentId
      });

      if (response.data.success) {
        const paymentData = JSON.parse(localStorage.getItem(paymentId) || '{}');
        paymentData.status = 'completed';
        paymentData.completed_at = new Date().toISOString();
        localStorage.setItem(paymentId, JSON.stringify(paymentData));

        if (response.data.simulation) {
          setMessage(`✅ SIMULATION: ${response.data.message}`);
        } else {
          setMessage(`✅ Payment of ₹${orderDetails?.finalAmount.toLocaleString()} released to creator successfully!`);
        }
        toast.success('Payment released successfully!');
        setStep(4);
      }
    } catch (error: any) {
      const errorMsg = getErrorMessage(error);
      setMessage(errorMsg);
      toast.error(errorMsg);
    } finally {
      setProcessing(false);
    }
  };

  // Check for return from PhonePe
  useEffect(() => {
    const justRedirected = sessionStorage.getItem('phonepe_redirect');

    if (justRedirected) {
      const currentPaymentId = sessionStorage.getItem('current_payment_id');
      const currentEscrowTxnId = sessionStorage.getItem('current_escrow_txn_id');

      sessionStorage.removeItem('phonepe_redirect');
      sessionStorage.removeItem('current_payment_id');
      sessionStorage.removeItem('current_escrow_txn_id');

      if (currentPaymentId && localStorage.getItem(currentPaymentId)) {
        const paymentData = JSON.parse(localStorage.getItem(currentPaymentId) || '{}');

        setPaymentId(paymentData.id);
        setEscrowTransactionId(paymentData.escrow_transaction_id);
        setSimulationMode(paymentData.simulation || false);

        if (paymentData.status === 'escrowed') {
          setStep(3);
          setMessage('✅ Payment already deposited to escrow. You can confirm and release it.');
        } else if (paymentData.status === 'completed') {
          setStep(4);
          setMessage('✅ Payment already completed and released to creator.');
        } else {
          setStep(2);
          setMessage('Returned from PhonePe. Verifying payment status...');

          const autoVerify = async () => {
            setCheckingStatus(true);
            try {
              const response = await axios.post(`${API_URL}/api/escrow/check-status/${currentEscrowTxnId || paymentData.escrow_transaction_id}`);

              if (response.data.success) {
                const returnedPayment = response.data.payment;
                if (returnedPayment) {
                  setPaymentId(returnedPayment.id);
                  localStorage.setItem(returnedPayment.id, JSON.stringify(returnedPayment));
                  if (returnedPayment.id !== paymentData.id) {
                    localStorage.removeItem(paymentData.id);
                  }
                }
                setMessage('✅ Payment successful and deposited to escrow!');
                toast.success('Payment verified!');
                setStep(3);
              } else {
                setMessage('❌ ' + (response.data.message || 'Payment verification failed.'));
              }
            } catch (error: any) {
              console.error('Payment verification error:', error);
              setMessage('⚠️ Could not verify payment status. Please click "Verify Payment" to try again.');
            } finally {
              setCheckingStatus(false);
            }
          };

          setTimeout(autoVerify, 1000);
        }
      }
    }
  }, []);

  // Loading state - wait for auth, order details, AND existing payment check
  if (isAuthChecking || loading || checkingExistingPayment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-pink-50/30 to-blue-50/30 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-purple-500 blur-3xl opacity-20 rounded-full" />
            <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-pink-500/30">
              <Loader className="h-10 w-10 text-white animate-spin" />
            </div>
          </div>
          <p className="text-gray-600 font-medium text-lg">
            {checkingExistingPayment ? 'Checking payment status...' : 'Loading payment details...'}
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-pink-50/30 to-blue-50/30 relative overflow-hidden">
      {/* Animated Background */}
      <FloatingOrb className="w-[500px] h-[500px] bg-pink-400 -top-32 -left-32" delay={0} />
      <FloatingOrb className="w-[400px] h-[400px] bg-purple-400 top-1/3 -right-32" delay={2} />
      <FloatingOrb className="w-[350px] h-[350px] bg-blue-400 bottom-0 left-1/4" delay={4} />

      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />

      <Header />

      <main className="relative z-10 pt-24 pb-16 px-4">
        <div className="max-w-xl mx-auto">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pink-50 border border-pink-200 mb-4"
            >
              <Lock className="h-4 w-4 text-pink-600" />
              <span className="text-sm font-semibold text-pink-700">Secure Escrow Payment</span>
            </motion.div>

            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
              {step === 4 ? 'Payment Complete!' : 'Complete Your Booking'}
            </h1>
            <p className="text-gray-500 max-w-xl mx-auto">
              {step === 4
                ? 'Your payment has been successfully released to the creator.'
                : 'Your payment is protected with escrow. Funds are only released when you approve.'}
            </p>
          </motion.div>

          {/* Progress Steps */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <div className="flex items-center">
              <ProgressStep number={1} title="Pay" isActive={step === 1} isCompleted={step > 1} />
              <div className={cn("flex-1 h-1 mx-2 rounded", step >= 2 ? "bg-gradient-to-r from-pink-500 to-purple-500" : "bg-gray-200")} />
              <ProgressStep number={2} title="Verify" isActive={step === 2} isCompleted={step > 2} />
              <div className={cn("flex-1 h-1 mx-2 rounded", step >= 3 ? "bg-gradient-to-r from-pink-500 to-purple-500" : "bg-gray-200")} />
              <ProgressStep number={3} title="Release" isActive={step === 3} isCompleted={step > 3} />
            </div>
          </motion.div>

          {/* Message Display */}
          <AnimatePresence mode="wait">
            {message && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={cn(
                  "mb-6 p-4 rounded-xl border",
                  message.includes('Error') || message.includes('❌') || message.includes('not')
                    ? "bg-red-50 border-red-200 text-red-700"
                    : message.includes('⚠️')
                      ? "bg-amber-50 border-amber-200 text-amber-700"
                      : "bg-emerald-50 border-emerald-200 text-emerald-700"
                )}
              >
                <div className="flex items-start gap-2">
                  {message.includes('Error') || message.includes('❌') ? (
                    <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  ) : message.includes('⚠️') ? (
                    <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  )}
                  <p className="text-sm">{message}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Order Summary Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 p-6 shadow-sm"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>

            {/* Creator Info */}
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl mb-6 border border-gray-100">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center overflow-hidden">
                {orderDetails?.creatorImage ? (
                  <img
                    src={orderDetails.creatorImage}
                    alt={orderDetails.creatorName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="h-7 w-7 text-white" />
                )}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{orderDetails?.creatorName}</p>
                <p className="text-sm text-gray-500">{orderDetails?.projectType}</p>
              </div>
            </div>

            {/* Project Details */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-pink-500" />
                <span className="text-gray-500">Date:</span>
                <span className="text-gray-900 ml-auto">{orderDetails?.eventDate}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="h-4 w-4 text-purple-500" />
                <span className="text-gray-500">Location:</span>
                <span className="text-gray-900 ml-auto">{orderDetails?.location}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Package className="h-4 w-4 text-blue-500" />
                <span className="text-gray-500">Deliverables:</span>
                <span className="text-gray-900 ml-auto text-right max-w-[200px] truncate">{orderDetails?.deliverables}</span>
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="border-t border-gray-200 pt-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="text-gray-900">₹{orderDetails?.totalAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Platform Fee (10%)</span>
                <span className="text-gray-900">₹{orderDetails?.platformFee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">GST (18%)</span>
                <span className="text-gray-900">₹{orderDetails?.gst.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-3 border-t border-gray-200">
                <span className="text-gray-900">Total</span>
                <span className="bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                  ₹{orderDetails?.finalAmount.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Step-specific Actions */}
            <div className="mt-6">
              {/* Step 1: Pay via PhonePe */}
              {step === 1 && (
                <>
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4 text-blue-600" />
                      <p className="text-xs text-blue-700">
                        You will be redirected to PhonePe for secure payment
                      </p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handlePayment}
                    disabled={processing}
                    className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-pink-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {processing ? (
                      <>
                        <Loader className="h-5 w-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Lock className="h-5 w-5" />
                        Pay ₹{orderDetails?.finalAmount.toLocaleString()} via Razorpay
                      </>
                    )}
                  </motion.button>
                </>
              )}

              {/* Step 2: Verify Payment */}
              {step === 2 && (
                <>
                  <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                      <p className="text-xs text-amber-700">
                        If you've completed the payment on PhonePe, click below to verify and deposit to escrow.
                      </p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={depositToEscrow}
                    disabled={checkingStatus}
                    className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-pink-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {checkingStatus ? (
                      <>
                        <Loader className="h-5 w-5 animate-spin" />
                        Verifying Payment...
                      </>
                    ) : (
                      <>
                        <Check className="h-5 w-5" />
                        Verify Payment Status
                      </>
                    )}
                  </motion.button>
                </>
              )}

              {/* Step 3: Confirm & Release */}
              {step === 3 && (
                <>
                  <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                      <p className="text-xs text-amber-700">
                        <strong>Warning:</strong> Once you confirm, the payment will be released to the creator. Only confirm if you're satisfied with the delivery.
                      </p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={confirmPayment}
                    disabled={processing}
                    className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-emerald-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {processing ? (
                      <>
                        <Loader className="h-5 w-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-5 w-5" />
                        Confirm & Release Payment
                      </>
                    )}
                  </motion.button>
                </>
              )}

              {/* Step 4: Completed */}
              {step === 4 && (
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                    <CheckCircle className="h-10 w-10 text-white" />
                  </div>
                  <p className="text-gray-600 mb-6">
                    The payment has been successfully released to {orderDetails?.creatorName}.
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => router.push(`/client/dashboard/${clientId}`)}
                    className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-pink-500/30 transition-all flex items-center justify-center gap-2"
                  >
                    View Booking Details
                  </motion.button>
                </div>
              )}
            </div>

            {/* Escrow Notice */}
            {step < 4 && (
              <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <div className="flex items-start gap-2">
                  <Shield className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-emerald-700">
                    Payment held in escrow. Released to creator only after you approve final deliverables.
                  </p>
                </div>
              </div>
            )}
          </motion.div>

          {/* Security Badges */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-6 py-6"
          >
            <div className="flex items-center gap-2 text-gray-500">
              <Shield className="h-5 w-5 text-emerald-500" />
              <span className="text-sm">256-bit SSL</span>
            </div>
            <div className="flex items-center gap-2 text-gray-500">
              <Lock className="h-5 w-5 text-blue-500" />
              <span className="text-sm">PCI DSS Compliant</span>
            </div>
            <div className="flex items-center gap-2 text-gray-500">
              <Check className="h-5 w-5 text-pink-500" />
              <span className="text-sm">Escrow Protected</span>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
