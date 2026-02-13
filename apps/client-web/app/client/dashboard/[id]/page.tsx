'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { 
  Clock, 
  CheckCircle, 
  MessageCircle, 
  Calendar, 
  MapPin, 
  Camera, 
  AlertCircle, 
  Loader,
  Send,
  X,
  XCircle,
  ChevronRight,
  Package,
  Star,
  DollarSign,
  FileText,
  Users,
  Sparkles,
  ArrowUpRight,
  Filter,
  Bell,
  Settings,
  Phone,
  Star,
  Eye,
} from 'lucide-react';
import { useRouter } from "next/navigation";
import { getRequestDetails, getPaymentStatusByRequest, getCreator, initiateCall, checkReviewStatus } from '@/services/creatorProfile';
import { Auth } from '@/services/Auth';
import { Header } from '@/components/layout/Header';
import { cn } from '@vision-match/utils-js';
import { palette, themeClasses } from '@/utils/theme';
import { toast } from 'react-hot-toast';

// Floating background orb - LIGHT THEME (reduced opacity)
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

// Status Badge Component - LIGHT THEME
const StatusBadge = ({ status }: { status: string }) => {
  const statusConfig: Record<string, { bg: string; text: string; border: string; icon: React.ElementType; label: string }> = {
    pending_creator: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: Clock, label: 'Pending' },
    responded: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: MessageCircle, label: 'Responded' },
    confirmed: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: CheckCircle, label: 'Confirmed' },
    negotiation_proposed: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', icon: DollarSign, label: 'Negotiating' },
    negotiating: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', icon: MessageCircle, label: 'Negotiating' },
    accepted: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: CheckCircle, label: 'Accepted' },
    declined: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: XCircle, label: 'Declined' },
    paid: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: DollarSign, label: 'Paid' },
    escrowed: { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200', icon: CheckCircle, label: 'Payment Held' },
    completed: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: CheckCircle, label: 'Completed' },
  };

  const config = statusConfig[status] || statusConfig.pending_creator;
  const Icon = config.icon;

  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border",
      config.bg,
      config.text,
      config.border
    )}>
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
};

// Stats Card Component - LIGHT THEME
const StatsCard = ({ 
  icon: Icon, 
  label, 
  value, 
  gradient 
}: { 
  icon: React.ElementType; 
  label: string; 
  value: string | number;
  gradient: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="p-5 bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 group hover:border-pink-300 hover:shadow-lg hover:shadow-pink-100/50 transition-all"
  >
    <div className={cn(
      "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center mb-3 group-hover:scale-110 transition-transform",
      gradient
    )}>
      <Icon className="h-6 w-6 text-white" />
    </div>
    <p className="text-sm text-gray-500">{label}</p>
    <p className="text-2xl font-bold text-gray-900">{value}</p>
  </motion.div>
);

export default function DashboardPage() {
  const router = useRouter();
  
  // UI States
  const [activeTab, setActiveTab] = useState<'requests' | 'bookings'>('requests');
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  
  // Data States
  const [clientId, setClientId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Modal & Request Details States
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [requestDetails, setRequestDetails] = useState<any[]>([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  
  // Payment status map: requestId -> payment status (escrowed/completed)
  const [paymentStatuses, setPaymentStatuses] = useState<Record<string, { status: string; creatorPhone?: string }>>({});

  // Review status map: requestId -> { hasReview, bookingId, reviewId }
  const [reviewStatuses, setReviewStatuses] = useState<Record<string, { hasReview: boolean; bookingId: string | null; reviewId: string | null }>>({});

  // Chat / Negotiation States
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ id: string; sender: 'client' | 'creator'; text: string; timestamp: Date }>>([]);
  const [messageInput, setMessageInput] = useState('');
  const [negotiatedPrice, setNegotiatedPrice] = useState<number | null>(null);
  const [negotiatedDeliverables, setNegotiatedDeliverables] = useState('');
  const [offerFinalized, setOfferFinalized] = useState(false);

  // Call States
  const [callModalOpen, setCallModalOpen] = useState(false);
  const [callRequestId, setCallRequestId] = useState<string | null>(null);
  const [callCreatorId, setCallCreatorId] = useState<string | null>(null);
  const [clientPhone, setClientPhone] = useState('');
  const [isCallingInProgress, setIsCallingInProgress] = useState(false);

  // Auth Check
  useEffect(() => {
    const checkUserSession = async () => {
      try {
        const user = await Auth.me();
        
        if (!user) {
          router.push("/login");
          return;
        }

        // Use email as the user identifier since that's what the auth system returns
        const userId = user.user.email;
        console.log("User verified:", userId);
        setClientId(userId);
      } catch (err: unknown) {
        console.error("Session verification failed:", err);
        router.push("/login");
      } finally {
        setIsAuthLoading(false);
      }
    };

    checkUserSession();
  }, [router]);

  // Fetch Data
  const fetchRequestDetails = async () => {
    if (!clientId) return;

    setLoading(true);
    setError(null);

    try {
      console.log("Fetching requests for Client ID:", clientId);
      const response = await getRequestDetails(clientId);
      console.log("API Raw Response:", response);

      let requests: any[] = [];
      if (Array.isArray(response)) {
        requests = response;
      } else if (response && Array.isArray(response.data)) {
        requests = response.data;
      } else if (response && Array.isArray(response.requests)) {
        requests = response.requests;
      } else {
        console.warn("API response is not an array:", response);
        requests = []; 
      }
      
      setRequestDetails(requests);
      
      // Fetch payment status for requests that are paid/accepted/escrowed/completed
      const paidRequests = requests.filter(r => 
        r.status === 'paid' || r.status === 'accepted' || r.status === 'escrowed' || r.status === 'completed'
      );
      
      if (paidRequests.length > 0) {
        const statusPromises = paidRequests.map(async (req) => {
          const payment = await getPaymentStatusByRequest(req.id);
          
          // Fetch creator details to get phone number
          let creatorPhone = null;
          if (req.creatorId) {
            const creator = await getCreator(req.creatorId);
            creatorPhone = creator?.phone_number || null;
          }
          
          if (payment) {
            return { 
              requestId: req.id, 
              status: payment.status,
              creatorPhone: creatorPhone || payment.creator_phone || req.creatorPhone || null
            };
          }
          return null;
        });
        
        const statuses = await Promise.all(statusPromises);
        const statusMap: Record<string, { status: string; creatorPhone?: string }> = {};
        statuses.forEach(s => {
          if (s) {
            statusMap[s.requestId] = { status: s.status, creatorPhone: s.creatorPhone };
          }
        });
        setPaymentStatuses(statusMap);
        
        // Fetch review status for completed payments
        const completedRequests = paidRequests.filter(req => {
          const paymentStatus = statusMap[req.id]?.status;
          return paymentStatus === 'completed' || req.status === 'completed';
        });
        
        if (completedRequests.length > 0) {
          const reviewPromises = completedRequests.map(async (req) => {
            const reviewStatus = await checkReviewStatus(req.id);
            return {
              requestId: req.id,
              ...reviewStatus
            };
          });
          
          const reviewResults = await Promise.all(reviewPromises);
          const reviewMap: Record<string, { hasReview: boolean; bookingId: string | null; reviewId: string | null }> = {};
          reviewResults.forEach(r => {
            reviewMap[r.requestId] = {
              hasReview: r.hasReview,
              bookingId: r.bookingId,
              reviewId: r.reviewId
            };
          });
          setReviewStatuses(reviewMap);
        }
      }

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load request details");
      console.error("Error fetching request details:", err);
      setRequestDetails([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (clientId) {
      fetchRequestDetails();
    }
  }, [clientId]);

  // Helper Functions
  const validateMessageContent = (text: string): { valid: boolean; error?: string } => {
    const phoneRegex = /\b\d{10}\b|\+\d{1,3}\d{9,14}/g;
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const linkRegex = /(https?:\/\/|www\.)[^\s]+/gi;

    if (phoneRegex.test(text)) return { valid: false, error: 'Phone numbers are not allowed.' };
    if (emailRegex.test(text)) return { valid: false, error: 'Emails are not allowed.' };
    if (linkRegex.test(text)) return { valid: false, error: 'Links are not allowed.' };

    return { valid: true };
  };

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;

    const validation = validateMessageContent(messageInput);
    if (!validation.valid) {
      setError(validation.error || 'Invalid message content');
      setTimeout(() => setError(null), 3000);
      return;
    }

    const newMessage = {
      id: Date.now().toString(),
      sender: 'client' as const,
      text: messageInput,
      timestamp: new Date(),
    };

    setMessages([...messages, newMessage]);
    setMessageInput('');
  };

  // Loading State
  if (isAuthLoading) {
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
          <p className="text-gray-600 font-medium text-lg">Verifying session...</p>
        </motion.div>
      </div>
    );
  }

  const pendingCount = requestDetails.filter(r => r.status === 'pending_creator').length;
  const respondedCount = requestDetails.filter(r => r.status === 'responded' || r.status === 'negotiation_proposed').length;

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-pink-50/30 to-blue-50/30 relative overflow-hidden">
      {/* Animated Background - Light Theme */}
      <FloatingOrb className="w-[500px] h-[500px] bg-pink-400 -top-32 -left-32" delay={0} />
      <FloatingOrb className="w-[400px] h-[400px] bg-purple-400 top-1/3 -right-32" delay={2} />
      <FloatingOrb className="w-[350px] h-[350px] bg-blue-400 bottom-0 left-1/4" delay={4} />
      
      {/* Grid pattern - Light */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
      
      <Header />

      <main className="relative pt-24 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                  My Dashboard
                </h1>
                <p className="text-gray-500">
                  Track your project requests and manage your bookings
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-3 bg-white/80 rounded-xl border border-gray-200 text-gray-500 hover:text-gray-700 hover:border-pink-300 transition-all shadow-sm"
                >
                  <Bell className="h-5 w-5" />
                </motion.button>
                <Link href="/client/wizard">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-5 py-3 bg-linear-to-r from-pink-500 to-purple-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-pink-500/30 transition-all flex items-center gap-2"
                  >
                    <Sparkles className="h-5 w-5" />
                    New Project
                  </motion.button>
                </Link>
              </div>
            </div>
          </motion.div>

          {/* Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8"
          >
            <StatsCard 
              icon={FileText} 
              label="Total Requests" 
              value={requestDetails.length}
              gradient="from-pink-500 to-rose-500"
            />
            <StatsCard 
              icon={Clock} 
              label="Pending" 
              value={pendingCount}
              gradient="from-amber-500 to-orange-500"
            />
            <StatsCard 
              icon={MessageCircle} 
              label="Responded" 
              value={respondedCount}
              gradient="from-blue-500 to-cyan-500"
            />
            <StatsCard 
              icon={CheckCircle} 
              label="Confirmed" 
              value={requestDetails.filter(r => r.status === 'accepted' || r.status === 'paid' || r.status === 'escrowed' || r.status === 'completed').length}
              gradient="from-emerald-500 to-green-500"
            />
          </motion.div>

          {/* Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex gap-2 mb-8 p-1.5 bg-white/60 backdrop-blur-sm rounded-2xl border border-gray-200 w-fit shadow-sm"
          >
            {[
              { id: 'requests', label: 'Project Requests', count: requestDetails.filter(r => r.status !== 'accepted' && r.status !== 'paid' && r.status !== 'escrowed' && r.status !== 'completed').length },
              { id: 'bookings', label: 'Confirmed Bookings', count: requestDetails.filter(r => r.status === 'accepted' || r.status === 'paid' || r.status === 'escrowed' || r.status === 'completed').length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'requests' | 'bookings')}
                className={cn(
                  "px-5 py-3 rounded-xl font-medium transition-all flex items-center gap-2",
                  activeTab === tab.id
                    ? "bg-linear-to-r from-pink-500 to-purple-500 text-white shadow-lg"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                )}
              >
                {tab.label}
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-xs",
                  activeTab === tab.id
                    ? "bg-white/20"
                    : "bg-gray-200 text-gray-600"
                )}>
                  {tab.count}
                </span>
              </button>
            ))}
          </motion.div>

          {/* Error Alert */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6 p-4 bg-red-50 backdrop-blur-sm border border-red-200 rounded-2xl"
              >
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                  <p className="text-red-700">{error}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Requests Tab */}
          {activeTab === 'requests' && (
            <div className="space-y-4">
              {loading ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-12 bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-200 text-center shadow-sm"
                >
                  <Loader className="h-8 w-8 text-pink-500 animate-spin mx-auto mb-4" />
                  <p className="text-gray-500">Loading requests...</p>
                </motion.div>
              ) : (!requestDetails || requestDetails.filter(r => r.status !== 'accepted' && r.status !== 'paid' && r.status !== 'escrowed' && r.status !== 'completed').length === 0) ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-12 bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-200 text-center shadow-sm"
                >
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <FileText className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No project requests yet</h3>
                  <p className="text-gray-500 mb-6">Start by creating a project brief and finding the perfect creator</p>
                  <Link href="/client/wizard">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-pink-500/30 transition-all"
                    >
                      Find Creators
                    </motion.button>
                  </Link>
                </motion.div>
              ) : (
                requestDetails.filter(r => r.status !== 'accepted' && r.status !== 'paid' && r.status !== 'escrowed' && r.status !== 'completed').map((request, index) => (
                  <motion.div
                    key={request.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-6 bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-200 hover:border-pink-300 hover:shadow-lg hover:shadow-pink-100/50 transition-all group"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h3 className="text-xl font-bold text-gray-900">{request.creatorName}</h3>
                          <StatusBadge status={request.status} />
                          {/* Show payment status badge if escrowed/completed */}
                          {paymentStatuses[request.id] && (
                            <StatusBadge status={paymentStatuses[request.id].status} />
                          )}
                        </div>
                        <p className="text-gray-500">{request.creatorSpecialisation}</p>
                        <p className="text-sm text-gray-400 mt-1">
                          Sent {new Date(request.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                          {request.package?.price}
                        </p>
                        <p className="text-sm text-gray-400">{request.package?.name} Package</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
                      {[
                        { icon: Camera, value: request.serviceType, label: 'Service' },
                        { icon: MapPin, value: request.location, label: 'Location' },
                        { icon: Calendar, value: new Date(request.eventDate).toLocaleDateString(), label: 'Date' },
                      ].map((item) => (
                        <div key={item.label} className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
                          <item.icon className="h-4 w-4 text-pink-500" />
                          <span className="text-sm text-gray-700 capitalize truncate">{item.value}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedRequestId(request.id)}
                        disabled={detailsLoading && selectedRequestId === request.id}
                        className="flex-1 py-3 px-5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl border border-gray-200 transition-all flex items-center justify-center gap-2"
                      >
                        View Details
                        <ChevronRight className="h-4 w-4" />
                      </motion.button>
                      
                      {/* Chat button for negotiation statuses */}
                      {(request.status === 'responded' || request.status === 'negotiation_proposed' || request.status === 'negotiating') && (
                        <Link href={`/client/chat/${request.id}`} className="flex-1">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full py-3 px-5 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-pink-500/30 transition-all flex items-center justify-center gap-2"
                          >
                            <MessageCircle className="h-4 w-4" />
                            Open Chat
                          </motion.button>
                        </Link>
                      )}
                      
                      {/* Payment button for accepted status - hide if payment already escrowed or completed */}
                      {request.status === 'accepted' && 
                       !(paymentStatuses[request.id] && 
                         (paymentStatuses[request.id].status === 'escrowed' || paymentStatuses[request.id].status === 'completed')) && (
                        <Link href={`/client/payment/${request.id}`} className="flex-1">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full py-3 px-5 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-emerald-500/30 transition-all flex items-center justify-center gap-2"
                          >
                            <DollarSign className="h-4 w-4" />
                            Proceed to Payment
                          </motion.button>
                        </Link>
                      )}
                      
                      {/* Booking link for paid status */}
                      {request.status === 'paid' && (
                        <Link href={`/client/booking/${request.id}/confirmation`} className="flex-1">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full py-3 px-5 bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition-all flex items-center justify-center gap-2"
                          >
                            <Package className="h-4 w-4" />
                            View Booking
                          </motion.button>
                        </Link>
                      )}
                      
                      {/* Call Creator button - show when payment is escrowed (not after completion) */}
                      {paymentStatuses[request.id] && 
                       paymentStatuses[request.id].status === 'escrowed' && (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            // Open call modal to get client's phone number
                            setCallRequestId(request.id);
                            setCallCreatorId(request.creatorId);
                            setCallModalOpen(true);
                          }}
                          className="flex-1 py-3 px-5 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-green-500/30 transition-all flex items-center justify-center gap-2"
                        >
                          <Phone className="h-4 w-4" />
                          Call Creator
                        </motion.button>
                      )}
                      
                      {/* Write Review button - show when payment is completed and no review yet */}
                      {paymentStatuses[request.id]?.status === 'completed' && 
                       !reviewStatuses[request.id]?.hasReview && (
                        <Link href={`/client/review/${request.id}`} className="flex-1">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full py-3 px-5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-amber-500/30 transition-all flex items-center justify-center gap-2"
                          >
                            <Star className="h-4 w-4" />
                            Write Review
                          </motion.button>
                        </Link>
                      )}
                      
                      {/* View Review button - show when review already submitted */}
                      {paymentStatuses[request.id]?.status === 'completed' && 
                       reviewStatuses[request.id]?.hasReview && (
                        <Link href={`/client/review/${request.id}`} className="flex-1">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full py-3 px-5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl border border-gray-200 transition-all flex items-center justify-center gap-2"
                          >
                            <Eye className="h-4 w-4" />
                            View Review
                          </motion.button>
                        </Link>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          )}

          {/* Bookings Tab - Shows accepted requests with same card format */}
          {activeTab === 'bookings' && (
            <div className="space-y-4">
              {loading ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-12 bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-200 text-center shadow-sm"
                >
                  <Loader className="h-8 w-8 text-emerald-500 animate-spin mx-auto mb-4" />
                  <p className="text-gray-500">Loading confirmed bookings...</p>
                </motion.div>
              ) : requestDetails.filter(r => r.status === 'accepted' || r.status === 'paid' || r.status === 'escrowed' || r.status === 'completed').length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-12 bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-200 text-center shadow-sm"
                >
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No confirmed bookings yet</h3>
                  <p className="text-gray-500 mb-6">Once a creator accepts your request, it will appear here</p>
                  <Link href="/client/discover">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-pink-500/30 transition-all"
                    >
                      Find Creators
                    </motion.button>
                  </Link>
                </motion.div>
              ) : (
                requestDetails
                  .filter(r => r.status === 'accepted' || r.status === 'paid' || r.status === 'escrowed' || r.status === 'completed')
                  .map((request, index) => (
                  <motion.div
                    key={request.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-6 bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-200 hover:border-pink-300 hover:shadow-lg hover:shadow-pink-100/50 transition-all group"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h3 className="text-xl font-bold text-gray-900">{request.creatorName}</h3>
                          <StatusBadge status={request.status} />
                          {/* Show payment status badge if escrowed/completed */}
                          {paymentStatuses[request.id] && (
                            <StatusBadge status={paymentStatuses[request.id].status} />
                          )}
                        </div>
                        <p className="text-gray-500">{request.creatorSpecialisation}</p>
                        <p className="text-sm text-gray-400 mt-1">
                          Sent {new Date(request.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                          {request.package?.price}
                        </p>
                        <p className="text-sm text-gray-400">{request.package?.name} Package</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
                      {[
                        { icon: Camera, value: request.serviceType, label: 'Service' },
                        { icon: MapPin, value: request.location, label: 'Location' },
                        { icon: Calendar, value: new Date(request.eventDate).toLocaleDateString(), label: 'Date' },
                      ].map((item) => (
                        <div key={item.label} className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
                          <item.icon className="h-4 w-4 text-pink-500" />
                          <span className="text-sm text-gray-700 capitalize truncate">{item.value}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedRequestId(request.id)}
                        disabled={detailsLoading && selectedRequestId === request.id}
                        className="flex-1 py-3 px-5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl border border-gray-200 transition-all flex items-center justify-center gap-2"
                      >
                        View Details
                        <ChevronRight className="h-4 w-4" />
                      </motion.button>
                      
                      {/* Chat button for negotiation statuses */}
                      {(request.status === 'responded' || request.status === 'negotiation_proposed' || request.status === 'negotiating') && (
                        <Link href={`/client/chat/${request.id}`} className="flex-1">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full py-3 px-5 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-pink-500/30 transition-all flex items-center justify-center gap-2"
                          >
                            <MessageCircle className="h-4 w-4" />
                            Open Chat
                          </motion.button>
                        </Link>
                      )}
                      
                      {/* Payment button for accepted status - hide if payment already escrowed or completed */}
                      {request.status === 'accepted' && 
                       !(paymentStatuses[request.id] && 
                         (paymentStatuses[request.id].status === 'escrowed' || paymentStatuses[request.id].status === 'completed')) && (
                        <Link href={`/client/payment/${request.id}`} className="flex-1">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full py-3 px-5 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-emerald-500/30 transition-all flex items-center justify-center gap-2"
                          >
                            <DollarSign className="h-4 w-4" />
                            Proceed to Payment
                          </motion.button>
                        </Link>
                      )}
                      
                      {/* Booking link for paid status */}
                      {request.status === 'paid' && (
                        <Link href={`/client/booking/${request.id}/confirmation`} className="flex-1">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full py-3 px-5 bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition-all flex items-center justify-center gap-2"
                          >
                            <Package className="h-4 w-4" />
                            View Booking
                          </motion.button>
                        </Link>
                      )}
                      
                      {/* Call Creator button - show when payment is escrowed (not after completion) */}
                      {paymentStatuses[request.id] && 
                       paymentStatuses[request.id].status === 'escrowed' && (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            // Open call modal to get client's phone number
                            setCallRequestId(request.id);
                            setCallCreatorId(request.creatorId);
                            setCallModalOpen(true);
                          }}
                          className="flex-1 py-3 px-5 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-green-500/30 transition-all flex items-center justify-center gap-2"
                        >
                          <Phone className="h-4 w-4" />
                          Call Creator
                        </motion.button>
                      )}
                      
                      {/* Write Review button - show when payment is completed and no review yet */}
                      {paymentStatuses[request.id]?.status === 'completed' && 
                       !reviewStatuses[request.id]?.hasReview && (
                        <Link href={`/client/review/${request.id}`} className="flex-1">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full py-3 px-5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-amber-500/30 transition-all flex items-center justify-center gap-2"
                          >
                            <Star className="h-4 w-4" />
                            Write Review
                          </motion.button>
                        </Link>
                      )}
                      
                      {/* View Review button - show when review already submitted */}
                      {paymentStatuses[request.id]?.status === 'completed' && 
                       reviewStatuses[request.id]?.hasReview && (
                        <Link href={`/client/review/${request.id}`} className="flex-1">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full py-3 px-5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl border border-gray-200 transition-all flex items-center justify-center gap-2"
                          >
                            <Eye className="h-4 w-4" />
                            View Review
                          </motion.button>
                        </Link>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          )}

          {/* Request Details Modal */}
          <AnimatePresence>
            {selectedRequestId && requestDetails && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                onClick={() => setSelectedRequestId(null)}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl border border-gray-200 shadow-2xl"
                >
                  <div className="p-6 sm:p-8">
                    {/* Close Button */}
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold text-gray-900">Request Details</h2>
                      <button
                        onClick={() => setSelectedRequestId(null)}
                        className="p-2 bg-gray-100 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-200 transition-colors"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    {(() => {
                      const selectedRequest = requestDetails.find((req: any) => req.id === selectedRequestId);
                      if (!selectedRequest) return null;

                      return (
                        <>
                          {/* Creator Info */}
                          <div className="mb-6 pb-6 border-b border-gray-200">
                            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">Creator Information</h3>
                            <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="text-gray-500">Name</span>
                                <span className="text-gray-900 font-medium">{selectedRequest.creatorName}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-gray-500">Specialisation</span>
                                <span className="text-gray-900 font-medium">{selectedRequest.creatorSpecialisation}</span>
                              </div>
                            </div>
                          </div>

                          {/* Package Info */}
                          <div className="mb-6 pb-6 border-b border-gray-200">
                            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">Package Details</h3>
                            <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="text-gray-500">Package Name</span>
                                <span className="text-gray-900 font-medium">{selectedRequest.package?.name}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-gray-500">Price</span>
                                <span className="text-xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                                  {selectedRequest.package?.price}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Project Info */}
                          <div className="mb-6 pb-6 border-b border-gray-200">
                            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">Project Details</h3>
                            <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="text-gray-500">Service Type</span>
                                <span className="text-gray-900 font-medium capitalize">{selectedRequest.serviceType}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-gray-500">Location</span>
                                <span className="text-gray-900 font-medium capitalize">{selectedRequest.location}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-gray-500">Event Date</span>
                                <span className="text-gray-900 font-medium">{new Date(selectedRequest.eventDate).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>

                          {/* Chat/Negotiation Interface */}
                          {!chatOpen ? (
                            <div className="flex flex-col sm:flex-row gap-3">
                              <button
                                onClick={() => setSelectedRequestId(null)}
                                className="flex-1 py-3 px-5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-all"
                              >
                                Close
                              </button>
                              {selectedRequest.status === 'negotiation_proposed' ? (
                                <button
                                  onClick={() => {
                                    setChatOpen(true);
                                    setNegotiatedPrice(selectedRequest.package?.price);
                                  }}
                                  className="flex-1 py-3 px-5 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-medium rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2"
                                >
                                  <MessageCircle className="h-4 w-4" />
                                  Open Chat
                                </button>
                              ) : (
                                <button className="flex-1 py-3 px-5 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-medium rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2">
                                  <MessageCircle className="h-4 w-4" />
                                  Message Creator
                                </button>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {/* Messages Area */}
                              <div className="border border-gray-200 rounded-2xl p-4 max-h-48 overflow-y-auto bg-gray-50">
                                {messages.length === 0 ? (
                                  <p className="text-gray-400 text-center py-8">No messages yet. Start negotiation!</p>
                                ) : (
                                  <div className="space-y-3">
                                    {messages.map((msg) => (
                                      <div key={msg.id} className={`flex ${msg.sender === 'client' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={cn(
                                          "max-w-xs px-4 py-2 rounded-2xl text-sm",
                                          msg.sender === 'client' 
                                            ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white' 
                                            : 'bg-white border border-gray-200 text-gray-900'
                                        )}>
                                          {msg.text}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* Pricing Inputs */}
                              <div className="border border-gray-200 rounded-2xl p-4 bg-gray-50">
                                <h4 className="text-sm font-medium text-gray-500 mb-3">Negotiated Price</h4>
                                <input
                                  type="number"
                                  value={negotiatedPrice || ''}
                                  onChange={(e) => setNegotiatedPrice(Number(e.target.value))}
                                  placeholder="Enter price"
                                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/20 transition-all"
                                />
                              </div>

                              {/* Final Summary Check */}
                              {offerFinalized && (
                                <div className="border border-emerald-200 rounded-2xl p-4 bg-emerald-50">
                                  <h4 className="text-sm font-medium text-emerald-700 mb-3">Final Offer</h4>
                                  <p className="text-emerald-700 font-bold text-xl mb-4">₹{negotiatedPrice}</p>
                                  <div className="flex gap-2">
                                    <button 
                                      onClick={() => setOfferFinalized(false)} 
                                      className="flex-1 py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-xl transition-all"
                                    >
                                      Modify
                                    </button>
                                    <button className="flex-1 py-2 px-4 bg-emerald-500 hover:bg-emerald-600 text-white text-sm rounded-xl transition-all">
                                      Accept
                                    </button>
                                  </div>
                                </div>
                              )}

                              {/* Message Input */}
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={messageInput}
                                  onChange={(e) => setMessageInput(e.target.value)}
                                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                  placeholder="Type message..."
                                  className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/20 transition-all"
                                />
                                <button 
                                  onClick={handleSendMessage} 
                                  disabled={!messageInput.trim()}
                                  className="px-4 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl hover:shadow-lg disabled:opacity-50 transition-all"
                                >
                                  <Send className="h-4 w-4" />
                                </button>
                              </div>

                              <div className="flex gap-3">
                                <button 
                                  onClick={() => setChatOpen(false)}
                                  className="flex-1 py-3 px-5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-all"
                                >
                                  Back
                                </button>
                                {!offerFinalized && (
                                  <button 
                                    onClick={() => setOfferFinalized(true)} 
                                    disabled={!negotiatedPrice}
                                    className="flex-1 py-3 px-5 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-medium rounded-xl hover:shadow-lg disabled:opacity-50 transition-all"
                                  >
                                    Finalize Offer
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Call Creator Modal */}
          <AnimatePresence>
            {callModalOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={() => {
                  if (!isCallingInProgress) {
                    setCallModalOpen(false);
                    setClientPhone('');
                  }
                }}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Phone className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Call Creator</h3>
                    <p className="text-gray-500 text-sm mt-1">
                      Enter your phone number to connect with the creator securely
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Your Phone Number
                      </label>
                      <input
                        type="tel"
                        value={clientPhone}
                        onChange={(e) => setClientPhone(e.target.value.replace(/[^0-9+]/g, ''))}
                        placeholder="Enter your 10-digit phone number"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                        disabled={isCallingInProgress}
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        We&apos;ll call you first, then connect you to the creator
                      </p>
                    </div>

                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <CheckCircle className="h-4 w-4 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-emerald-800">Secure Call Masking</p>
                          <p className="text-xs text-emerald-600 mt-0.5">
                            Your phone number is kept private. Neither party sees the other&apos;s real number.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={() => {
                          setCallModalOpen(false);
                          setClientPhone('');
                        }}
                        disabled={isCallingInProgress}
                        className="flex-1 py-3 px-5 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-all disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={async () => {
                          if (!clientPhone || clientPhone.length < 10) {
                            toast.error('Please enter a valid 10-digit phone number');
                            return;
                          }
                          if (!callRequestId || !clientId) {
                            toast.error('Missing call details');
                            return;
                          }

                          setIsCallingInProgress(true);
                          try {
                            const result = await initiateCall(
                              callRequestId,
                              clientId,
                              clientPhone,
                              'client'
                            );

                            if (result.success) {
                              toast.success(result.message || 'Call initiated! You will receive a call shortly.');
                              setCallModalOpen(false);
                              setClientPhone('');
                            } else {
                              toast.error(result.message || 'Failed to initiate call');
                            }
                          } catch (err: unknown) {
                            toast.error(err instanceof Error ? err.message : 'Failed to initiate call');
                          } finally {
                            setIsCallingInProgress(false);
                          }
                        }}
                        disabled={isCallingInProgress || !clientPhone || clientPhone.length < 10}
                        className="flex-1 py-3 px-5 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-green-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isCallingInProgress ? (
                          <>
                            <Loader className="h-4 w-4 animate-spin" />
                            Connecting...
                          </>
                        ) : (
                          <>
                            <Phone className="h-4 w-4" />
                            Call Now
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8 bg-white/60">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
          © 2025 VisionMatch. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
