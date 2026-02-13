'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Star, Camera, User, ArrowLeft, Send, CheckCircle,
  Sparkles, Heart, ThumbsUp, Loader, Home, Award,
  Image, Video, Clock, MessageSquare
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Auth } from '@/services/Auth';
import { getRequest } from '@/services/creatorProfile';
import { cn } from '@vision-match/utils-js';
import { toast } from 'react-hot-toast';
import axiosInstance from '@/utils/axiosInstance';
import { palette, themeClasses } from '@/utils/theme';

// Floating background orb - Light theme
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

type BookingDetails = {
  id: string;
  creatorId: string;
  creatorName: string;
  creatorImage?: string;
  creatorRole?: string;
  projectType: string;
  eventDate: string;
};

// Review aspects for photographers/videographers
const reviewAspects = [
  { id: 'quality', label: 'Quality of Work', description: 'Delivered photos/videos quality' },
  { id: 'communication', label: 'Communication', description: 'Responsiveness and clarity' },
  { id: 'professionalism', label: 'Professionalism', description: 'Punctuality and behavior' },
  { id: 'creativity', label: 'Creativity', description: 'Unique shots and artistic vision' },
  { id: 'value', label: 'Value for Money', description: 'Worth the investment' },
];

// Star rating component
const StarRating = ({ 
  rating, 
  setRating, 
  size = 'lg',
  interactive = true 
}: { 
  rating: number;
  setRating?: (rating: number) => void;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
}) => {
  const [hoverRating, setHoverRating] = useState(0);
  
  const sizeClasses = {
    sm: 'h-5 w-5',
    md: 'h-7 w-7',
    lg: 'h-10 w-10',
  };
  
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <motion.button
          key={star}
          whileHover={interactive ? { scale: 1.2 } : {}}
          whileTap={interactive ? { scale: 0.9 } : {}}
          onClick={() => interactive && setRating?.(star)}
          onMouseEnter={() => interactive && setHoverRating(star)}
          onMouseLeave={() => interactive && setHoverRating(0)}
          disabled={!interactive}
          className={cn(
            "transition-colors",
            interactive ? "cursor-pointer" : "cursor-default"
          )}
        >
          <Star 
            className={cn(
              sizeClasses[size],
              "transition-all",
              (hoverRating || rating) >= star 
                ? "fill-amber-400 text-amber-400" 
                : "fill-transparent text-gray-300"
            )} 
          />
        </motion.button>
      ))}
    </div>
  );
};

// Aspect rating card - Light theme
const AspectRatingCard = ({
  aspect,
  rating,
  setRating,
  interactive = true,
}: {
  aspect: typeof reviewAspects[0];
  rating: number;
  setRating: (rating: number) => void;
  interactive?: boolean;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-gray-300 transition-all"
  >
    <div className="flex items-center justify-between mb-2">
      <div>
        <h4 className="font-medium text-gray-900">{aspect.label}</h4>
        <p className="text-xs text-gray-500">{aspect.description}</p>
      </div>
      <StarRating rating={rating} setRating={interactive ? setRating : undefined} size="sm" interactive={interactive} />
    </div>
  </motion.div>
);

// Quick feedback tags
const feedbackTags = [
  { id: 'exceeded', label: 'Exceeded expectations', emoji: '🌟' },
  { id: 'friendly', label: 'Very friendly', emoji: '😊' },
  { id: 'punctual', label: 'Always on time', emoji: '⏰' },
  { id: 'creative', label: 'Super creative', emoji: '🎨' },
  { id: 'recommend', label: 'Would recommend', emoji: '👍' },
  { id: 'fast', label: 'Quick delivery', emoji: '⚡' },
  { id: 'patient', label: 'Very patient', emoji: '🙏' },
  { id: 'fun', label: 'Made it fun', emoji: '🎉' },
];

export default function ReviewPage() {
  const router = useRouter();
  const params = useParams<{ bookingId: string }>();
  const bookingId = params.bookingId;
  
  // States
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [clientId, setClientId] = useState<string | null>(null);
  const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(null);
  const [existingReview, setExistingReview] = useState<any | null>(null);
  const [isViewMode, setIsViewMode] = useState(false);
  
  // Review states
  const [overallRating, setOverallRating] = useState(0);
  const [aspectRatings, setAspectRatings] = useState<Record<string, number>>({});
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [reviewText, setReviewText] = useState('');
  const [sharePublicly, setSharePublicly] = useState(true);

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
      } catch (err) {
        console.error('Auth check failed:', err);
        router.push('/login');
      } finally {
        setIsAuthChecking(false);
      }
    };
    checkAuth();
  }, [router]);

  // Fetch booking details and check for existing review
  const fetchBookingDetails = useCallback(async () => {
    if (!bookingId) return;
    
    try {
      setLoading(true);
      const data = await getRequest(bookingId);
      
      if (data) {
        setBookingDetails({
          id: data.id || data._id,
          creatorId: data.creator_id || data.creatorId,
          creatorName: data.creator_name || data.creatorName || 'Creator',
          creatorImage: data.creator_image || data.creatorImage,
          creatorRole: data.creator_role || data.creatorRole || 'Photographer',
          projectType: data.project_type || data.projectType || data.category || 'Photography',
          eventDate: data.event_date || data.eventDate || 'TBD',
        });
      }
      
      // Check if review already exists
      try {
        const reviewStatus = await axiosInstance.get(`/api/reviews/check/${bookingId}`);
        if (reviewStatus.data.hasReview && reviewStatus.data.review) {
          const review = reviewStatus.data.review;
          setExistingReview(review);
          setIsViewMode(true);
          // Pre-fill the form with existing review data
          setOverallRating(review.overallRating || 0);
          setAspectRatings(review.aspects || {});
          setSelectedTags(review.selectedTags || []);
          setReviewText(review.review || '');
          setSharePublicly(review.sharePublicly ?? true);
        }
      } catch (reviewErr) {
        // No existing review, that's fine
        console.log('No existing review found');
      }
    } catch (err) {
      console.error('Failed to fetch booking:', err);
      toast.error('Failed to load booking details');
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    if (clientId && bookingId) {
      fetchBookingDetails();
    }
  }, [clientId, bookingId, fetchBookingDetails]);

  // Toggle feedback tag
  const toggleTag = (tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(t => t !== tagId)
        : [...prev, tagId]
    );
  };

  // Set aspect rating
  const setAspectRating = (aspectId: string, rating: number) => {
    setAspectRatings(prev => ({ ...prev, [aspectId]: rating }));
  };

  // Submit review
  const handleSubmitReview = async () => {
    if (overallRating === 0) {
      toast.error('Please provide an overall rating');
      return;
    }
    
    if (reviewText.trim().length < 10) {
      toast.error('Please write at least a few words about your experience');
      return;
    }
    
    setSubmitting(true);
    
    try {
      await axiosInstance.post('/api/reviews/create', {
        bookingId,
        clientId,
        creatorId: bookingDetails?.creatorId,
        overallRating,
        aspects: aspectRatings,
        selectedTags,
        review: reviewText.trim(),
        sharePublicly,
      });
      
      setSubmitted(true);
      toast.success('Thank you for your review!');
      
      // Redirect after animation
      setTimeout(() => {
        router.push(`/client/dashboard/${clientId}`);
      }, 3000);
    } catch (err) {
      console.error('Failed to submit review:', err);
      toast.error('Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Loading state
  if (isAuthChecking || loading) {
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
          <p className="text-gray-600 font-medium text-lg">Loading...</p>
        </motion.div>
      </div>
    );
  }

  // Success state
  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-pink-50/30 to-blue-50/30 flex items-center justify-center relative overflow-hidden">
        <FloatingOrb className="w-[400px] h-[400px] bg-emerald-400 -top-32 -left-32" delay={0} />
        <FloatingOrb className="w-[300px] h-[300px] bg-pink-400 bottom-0 right-0" delay={2} />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center px-4 relative z-10"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="relative inline-block mb-6"
          >
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-2xl shadow-emerald-500/30">
              <CheckCircle className="h-12 w-12 text-white" />
            </div>
          </motion.div>
          
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Thank You! 🎉
          </h1>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">
            Your review helps other clients find great creators and helps {bookingDetails?.creatorName} grow their business.
          </p>
          
          <div className="flex items-center justify-center gap-2">
            <Loader className="h-5 w-5 text-pink-500 animate-spin" />
            <span className="text-gray-500">Redirecting to dashboard...</span>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-pink-50/30 to-blue-50/30 relative overflow-hidden">
      {/* Animated Background - Light Theme */}
      <FloatingOrb className="w-[500px] h-[500px] bg-amber-400 -top-32 -left-32" delay={0} />
      <FloatingOrb className="w-[400px] h-[400px] bg-pink-400 top-1/3 -right-32" delay={2} />
      <FloatingOrb className="w-[350px] h-[350px] bg-purple-400 bottom-0 left-1/4" delay={4} />
      
      {/* Grid pattern - Light */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
      
      <Header />

      <main className="relative z-10 pt-24 pb-16 px-4">
        <div className="max-w-2xl mx-auto">
          
          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-6"
          >
            <Link href={`/client/dashboard/${clientId}`}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Dashboard</span>
              </motion.button>
            </Link>
          </motion.div>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 border border-amber-200 mb-4"
            >
              <Star className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-semibold text-amber-700">
                {isViewMode ? 'Your Review' : 'Leave a Review'}
              </span>
            </motion.div>
            
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
              {isViewMode ? 'Your Review' : 'How was your experience?'}
            </h1>
            <p className="text-gray-500">
              {isViewMode 
                ? `You reviewed ${bookingDetails?.creatorName} on ${existingReview?.createdAt ? new Date(existingReview.createdAt).toLocaleDateString() : 'this project'}.`
                : `Your feedback helps ${bookingDetails?.creatorName} improve and helps others find great creators.`
              }
            </p>
          </motion.div>

          {/* Creator Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 p-6 mb-6 shadow-sm"
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center overflow-hidden">
                {bookingDetails?.creatorImage ? (
                  <img 
                    src={bookingDetails.creatorImage}
                    alt={bookingDetails.creatorName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="h-8 w-8 text-white" />
                )}
              </div>
              <div>
                <p className="font-bold text-lg text-gray-900">{bookingDetails?.creatorName}</p>
                <p className="text-gray-500">{bookingDetails?.creatorRole}</p>
                <p className="text-sm text-gray-400">{bookingDetails?.projectType} • {bookingDetails?.eventDate}</p>
              </div>
            </div>
          </motion.div>

          {/* Overall Rating */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 p-6 mb-6 shadow-sm"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">Overall Rating</h3>
            <div className="flex flex-col items-center gap-3">
              <StarRating 
                rating={overallRating} 
                setRating={isViewMode ? undefined : setOverallRating} 
                size="lg" 
                interactive={!isViewMode}
              />
              <p className="text-gray-500 text-sm">
                {overallRating === 0 && (isViewMode ? 'No rating' : 'Tap to rate')}
                {overallRating === 1 && 'Poor'}
                {overallRating === 2 && 'Fair'}
                {overallRating === 3 && 'Good'}
                {overallRating === 4 && 'Great'}
                {overallRating === 5 && 'Excellent!'}
              </p>
            </div>
          </motion.div>

          {/* Aspect Ratings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 p-6 mb-6 shadow-sm"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Rate Specific Aspects</h3>
            <div className="space-y-3">
              {reviewAspects.map((aspect, index) => (
                <AspectRatingCard
                  key={aspect.id}
                  aspect={aspect}
                  rating={aspectRatings[aspect.id] || 0}
                  setRating={(rating) => setAspectRating(aspect.id, rating)}
                  interactive={!isViewMode}
                />
              ))}
            </div>
          </motion.div>

          {/* Quick Feedback Tags */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 p-6 mb-6 shadow-sm"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Feedback</h3>
            <div className="flex flex-wrap gap-2">
              {feedbackTags.map((tag) => (
                <motion.button
                  key={tag.id}
                  whileHover={isViewMode ? {} : { scale: 1.05 }}
                  whileTap={isViewMode ? {} : { scale: 0.95 }}
                  onClick={() => !isViewMode && toggleTag(tag.id)}
                  disabled={isViewMode}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium transition-all",
                    selectedTags.includes(tag.id)
                      ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg shadow-pink-500/30"
                      : "bg-gray-100 text-gray-600 border border-gray-200 hover:border-gray-300",
                    isViewMode && "cursor-default"
                  )}
                >
                  {tag.emoji} {tag.label}
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Written Review */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 p-6 mb-6 shadow-sm"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {isViewMode ? 'Your Review' : 'Write Your Review'}
            </h3>
            <textarea
              value={reviewText}
              onChange={(e) => !isViewMode && setReviewText(e.target.value)}
              placeholder={isViewMode ? '' : "Tell others about your experience working with this creator..."}
              rows={5}
              readOnly={isViewMode}
              className={cn(
                "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 transition-all resize-none",
                isViewMode 
                  ? "cursor-default" 
                  : "focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20"
              )}
            />
            {!isViewMode && (
              <p className="text-xs text-gray-400 mt-2">
                {reviewText.length}/500 characters
              </p>
            )}
          </motion.div>

          {/* Privacy Toggle */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 mb-8"
          >
            <div>
              <p className="font-medium text-gray-900">
                {isViewMode ? 'Visibility' : 'Share publicly'}
              </p>
              <p className="text-sm text-gray-500">
                {isViewMode 
                  ? (sharePublicly ? 'This review is visible on the creator\'s profile' : 'This review is private')
                  : 'Your review will be visible on the creator\'s profile'
                }
              </p>
            </div>
            <button
              onClick={() => !isViewMode && setSharePublicly(!sharePublicly)}
              disabled={isViewMode}
              className={cn(
                "relative w-14 h-8 rounded-full transition-colors",
                sharePublicly ? "bg-pink-500" : "bg-gray-300",
                isViewMode && "cursor-default opacity-80"
              )}
            >
              <div className={cn(
                "absolute top-1 w-6 h-6 rounded-full bg-white transition-all shadow-lg",
                sharePublicly ? "left-7" : "left-1"
              )} />
            </button>
          </motion.div>

          {/* Submit Button - only show in write mode */}
          {!isViewMode && (
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSubmitReview}
              disabled={submitting || overallRating === 0}
              className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-pink-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader className="h-5 w-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-5 w-5" />
                  Submit Review
                </>
              )}
            </motion.button>
          )}

          {/* Back to Dashboard button - show in view mode */}
          {isViewMode && (
            <Link href={`/client/dashboard/${clientId}`} className="w-full">
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-4 bg-gradient-to-r from-gray-600 to-gray-700 text-white font-semibold rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <Home className="h-5 w-5" />
                Back to Dashboard
              </motion.button>
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}
