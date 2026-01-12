import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { RotateCcw, BookOpen, ShoppingCart, Mail, Share2, Check, Copy, Loader2, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useTracking } from "@/hooks/use-tracking";
import { apiRequest } from "@/lib/queryClient";
import { PreOrderPopup } from "@/components/preorder-popup";
import book3D from "@assets/cover-front_1767847594589.png";
import backCover3D from "@assets/cover-back_1767847598711.png";
import spineImage from "@assets/spine_1767923491688.png";
import page1 from "@assets/page-1_1767847790539.png";
import page2 from "@assets/page-2_1767847795728.png";
import page3 from "@assets/page-3_1767847800915.png";
import page4 from "@assets/page-4_1767849661782.png";
import page5 from "@assets/page-5_1767847809535.png";
import page6 from "@assets/page-6_1767847812929.png";

const BOOK_THICKNESS = 30; // px - thickness of the book spine
const COVER_OPEN_ANGLE = 15; // degrees - how much the cover is lifted
const BOOK_TILT_Y = -20; // degrees - Y-axis rotation to show spine
const BOOK_TILT_X = 8; // degrees - X-axis rotation for subtle perspective

interface BookIntroProps {
  onComplete: () => void;
}

const subscribeFormSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  name: z.string().optional(),
  newsletterConsent: z.boolean().refine((val) => val === true, {
    message: "You must agree to receive updates",
  }),
});

type SubscribeFormData = z.infer<typeof subscribeFormSchema>;

export function BookIntro({ onComplete }: BookIntroProps) {
  const { toast } = useToast();
  const { trackInteraction } = useTracking();
  
  const [bookState, setBookState] = useState<"front" | "back" | "opening">("front");
  const [showHint, setShowHint] = useState(false);
  const [currentPage, setCurrentPage] = useState(0); // 0 = cover, 1-6 = pages, 7 = done
  
  // Popup states
  const [preorderOpen, setPreorderOpen] = useState(false);
  const [preorderPopupOpen, setPreorderPopupOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const form = useForm<SubscribeFormData>({
    resolver: zodResolver(subscribeFormSchema),
    defaultValues: {
      email: "",
      name: "",
      newsletterConsent: false,
    },
  });

  const subscribeMutation = useMutation({
    mutationFn: async (data: SubscribeFormData) => {
      const response = await apiRequest("POST", "/api/subscribe", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "You're on the list!",
        description: "We'll let you know when the book is ready.",
      });
      form.reset();
      setEmailOpen(false);
      trackInteraction("email_subscribe", "book_intro");
    },
    onError: () => {
      toast({
        title: "Something went wrong",
        description: "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const handlePreorderClick = () => {
    trackInteraction("preorder_cta", "book_intro");
    setPreorderOpen(false);
    setPreorderPopupOpen(true);
  };

  const handleShare = async () => {
    const shareData = {
      title: "Camila's Adventure: A Trip Across America",
      text: "Check out this amazing children's book about exploring all 50 US states!",
      url: window.location.href,
    };

    const canUseNativeShare = "share" in navigator && 
      (!("canShare" in navigator) || navigator.canShare(shareData));

    if (canUseNativeShare) {
      try {
        await navigator.share(shareData);
        trackInteraction("share_native", "book_intro");
        setShareOpen(false);
        return;
      } catch (err) {
        if ((err as Error).name === "AbortError") {
          return;
        }
      }
    }
    
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      trackInteraction("share_copy_link", "book_intro");
      toast({
        title: "Link copied!",
        description: "Share it with friends and family.",
      });
      setTimeout(() => {
        setCopied(false);
        setShareOpen(false);
      }, 1500);
    } catch (err) {
      toast({
        title: "Couldn't copy link",
        description: "Please copy the URL from your browser.",
        variant: "destructive",
      });
    }
  };

  const onSubmit = (data: SubscribeFormData) => {
    subscribeMutation.mutate(data);
  };

  useEffect(() => {
    const timer = setTimeout(() => setShowHint(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  // Auto-flip timer
  useEffect(() => {
    if (bookState !== "opening") return;
    
    const flipInterval = setInterval(() => {
      setCurrentPage(prev => {
        if (prev >= 7) {
          clearInterval(flipInterval);
          return prev;
        }
        return prev + 1;
      });
    }, 6000);

    return () => clearInterval(flipInterval);
  }, [bookState]);

  // Complete when all pages flipped
  useEffect(() => {
    if (currentPage >= 7) {
      const timer = setTimeout(onComplete, 500);
      return () => clearTimeout(timer);
    }
  }, [currentPage, onComplete]);

  const flipToBack = () => {
    setBookState("back");
  };

  const flipToFront = () => {
    setBookState("front");
  };

  const openBook = () => {
    setBookState("opening");
    setCurrentPage(1); // Start with first flip
  };

  const handleTapToFlip = () => {
    if (currentPage < 7) {
      setCurrentPage(prev => prev + 1);
    }
  };

  return (
    <AnimatePresence>
      {bookState !== "opening" ? (
        <motion.div
          key="intro"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-gradient-to-b from-[#6bafd4] via-[#9dcae3] to-[#dfc9b5]"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Decorative Background Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div 
              className="absolute top-20 left-[10%] w-20 h-20 bg-white rounded-full opacity-60"
              animate={{ y: [0, -20, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            />
            <motion.div 
              className="absolute top-40 right-[15%] w-16 h-16 bg-white rounded-full opacity-50"
              animate={{ y: [0, -15, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut", delay: 0.5 }}
            />
            <motion.div 
              className="absolute bottom-32 left-[20%] w-24 h-24 bg-white rounded-full opacity-40"
              animate={{ y: [0, -25, 0] }}
              transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
            />
          </div>

          {/* Book Container */}
          <div className="relative flex flex-col items-center mt-8 sm:mt-12 md:mt-16">
            {/* Book Shadow */}
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-[70%] h-8 bg-black/20 rounded-full blur-xl" />
            
            {/* 3D Book */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="relative cursor-pointer"
              style={{ perspective: "2000px" }}
              onClick={openBook}
            >
              {/* Outer tilt wrapper - rotates whole book to show spine */}
              <motion.div
                className="relative"
                style={{ 
                  transformStyle: "preserve-3d",
                  transform: `rotateX(${BOOK_TILT_X}deg) rotateY(${BOOK_TILT_Y}deg)`,
                }}
              >
                {/* Inner flip wrapper - handles front/back flip */}
                <motion.div 
                  className="relative"
                  animate={{ rotateY: bookState === "back" ? 180 : 0 }}
                  transition={{ duration: 0.8, ease: [0.645, 0.045, 0.355, 1] }}
                  style={{ transformStyle: "preserve-3d" }}
                >
                  {/* Book body (pages + back cover + spine) */}
                  <div 
                    className="relative w-[300px] h-[300px] sm:w-[380px] sm:h-[380px] md:w-[450px] md:h-[450px] lg:w-[520px] lg:h-[520px]"
                    style={{ transformStyle: "preserve-3d" }}
                  >
                    {/* Back Cover - rotated 180deg so it faces outward when book is flipped */}
                    <div 
                      className="absolute inset-0 rounded-r-lg overflow-hidden shadow-lg"
                      style={{ 
                        backfaceVisibility: "hidden", 
                        WebkitBackfaceVisibility: "hidden",
                        transform: `rotateY(180deg) translateZ(${BOOK_THICKNESS / 2}px)`,
                      }}
                    >
                      <img 
                        src={backCover3D} 
                        alt="Camila's Adventure - Back Cover" 
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Inner pages - white page block with vertical lines for multi-page illusion */}
                    <div
                      className="absolute inset-0 rounded-r-lg overflow-hidden"
                      style={{
                        transformStyle: "preserve-3d",
                        transformOrigin: "left center",
                        transform: `translateZ(${BOOK_THICKNESS / 4}px)`,
                        backfaceVisibility: "hidden",
                        WebkitBackfaceVisibility: "hidden",
                        background: "#faf9f7",
                      }}
                    >
                      {/* Vertical lines to simulate page edges */}
                      <div 
                        className="absolute right-0 top-0 bottom-0 flex items-stretch"
                        style={{ width: "40px" }}
                      >
                        {[0, 1, 2, 3].map((lineIndex) => (
                          <div
                            key={lineIndex}
                            style={{
                              width: "2px",
                              height: "100%",
                              backgroundColor: "#1a1a1a",
                              marginLeft: lineIndex === 0 ? "auto" : "8px",
                            }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Front Cover - slightly opened */}
                    <div 
                      className="absolute inset-0 rounded-r-lg overflow-hidden shadow-2xl"
                      style={{ 
                        transformStyle: "preserve-3d",
                        transformOrigin: "left center",
                        backfaceVisibility: "hidden", 
                        WebkitBackfaceVisibility: "hidden",
                        transform: `translateZ(${BOOK_THICKNESS / 2}px) rotateY(${-COVER_OPEN_ANGLE}deg)`,
                      }}
                    >
                      <img 
                        src={book3D} 
                        alt="Camila's Adventure - Front Cover" 
                        className="w-full h-full object-cover"
                      />
                      {/* Inside of front cover (visible when opened) */}
                      <div 
                        className="absolute inset-0 bg-amber-50"
                        style={{
                          transform: "rotateY(180deg)",
                          backfaceVisibility: "hidden",
                          WebkitBackfaceVisibility: "hidden",
                        }}
                      />
                    </div>

                    {/* Spine */}
                    <div 
                      className="absolute top-0 left-0 h-full overflow-hidden shadow-lg"
                      style={{ 
                        width: `${BOOK_THICKNESS}px`,
                        transform: `rotateY(-90deg) translateX(-${BOOK_THICKNESS / 2}px)`,
                        transformOrigin: "left center",
                        backfaceVisibility: "hidden",
                        WebkitBackfaceVisibility: "hidden",
                      }}
                    >
                      <img 
                        src={spineImage} 
                        alt="Book Spine" 
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Top Edge - subtle depth, shortened to not overlap white pages */}
                    <div 
                      className="absolute top-0 left-0 bg-gradient-to-b from-amber-100 to-amber-200"
                      style={{ 
                        height: `${BOOK_THICKNESS}px`,
                        width: "calc(100% - 45px)",
                        transform: `rotateX(90deg) translateY(-${BOOK_THICKNESS / 2}px)`,
                        transformOrigin: "top center",
                        backfaceVisibility: "hidden",
                        WebkitBackfaceVisibility: "hidden",
                      }}
                    />

                    {/* Bottom Edge - subtle depth, shortened to not overlap white pages */}
                    <div 
                      className="absolute bottom-0 left-0 bg-gradient-to-t from-amber-100 to-amber-200"
                      style={{ 
                        height: `${BOOK_THICKNESS}px`,
                        width: "calc(100% - 45px)",
                        transform: `rotateX(-90deg) translateY(${BOOK_THICKNESS / 2}px)`,
                        transformOrigin: "bottom center",
                        backfaceVisibility: "hidden",
                        WebkitBackfaceVisibility: "hidden",
                      }}
                    />

                    {/* Right Edge (page edges) - only visible on main book body */}
                    <div 
                      className="absolute top-0 right-0 h-full bg-gradient-to-l from-amber-50 to-amber-100"
                      style={{ 
                        width: `${BOOK_THICKNESS}px`,
                        transform: `rotateY(90deg) translateX(${BOOK_THICKNESS / 2}px)`,
                        transformOrigin: "right center",
                        backfaceVisibility: "hidden",
                        WebkitBackfaceVisibility: "hidden",
                        backgroundImage: "repeating-linear-gradient(to bottom, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 3px)",
                      }}
                    />
                  </div>
                </motion.div>
              </motion.div>

              {/* Pulsing Glow Effect */}
              <motion.div
                className="absolute -inset-6 bg-gradient-to-r from-orange-400 via-pink-400 to-yellow-400 rounded-2xl blur-2xl -z-10"
                animate={{ opacity: [0.2, 0.4, 0.2] }}
                transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
              />
            </motion.div>

            {/* Controls */}
            <div className="mt-6 mb-20 md:mb-8 flex flex-col items-center gap-4">
              {/* Flip Button */}
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                onClick={(e) => {
                  e.stopPropagation();
                  bookState === "front" ? flipToBack() : flipToFront();
                }}
                className="flex items-center gap-2 px-5 py-2.5 bg-white/80 hover:bg-white rounded-full shadow-lg text-stone-700 font-heading font-medium transition-all hover:scale-105 active:scale-95"
              >
                <RotateCcw className="w-4 h-4" />
                {bookState === "front" ? "Flip to read synopsis" : "Flip to front"}
              </motion.button>

              {/* Open Book Hint */}
              <AnimatePresence>
                {showHint && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-center"
                  >
                    <motion.div
                      className="flex items-center gap-2 text-stone-600 font-heading"
                      animate={{ y: [0, -4, 0] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                    >
                      <BookOpen className="w-5 h-5" />
                      <span>Tap the book to open!</span>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* CTA Bar - Mobile (bottom) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2, duration: 0.5 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[110] md:hidden"
          >
            <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-full px-2 py-2 shadow-xl border border-white/50">
              <button
                onClick={(e) => { e.stopPropagation(); setPreorderOpen(true); }}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-full font-heading font-bold text-sm hover:bg-primary/90 transition-colors"
                data-testid="button-intro-preorder"
              >
                <ShoppingCart className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setEmailOpen(true); }}
                className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-full font-heading font-bold text-sm hover:bg-sky-700 transition-colors"
                data-testid="button-intro-email"
              >
                <Mail className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setShareOpen(true); }}
                className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-full font-heading font-bold text-sm hover:bg-amber-600 transition-colors"
                data-testid="button-intro-share"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </motion.div>

          {/* CTA Bar - Desktop (right sidebar) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 2, duration: 0.5 }}
            className="fixed right-6 top-1/2 -translate-y-1/2 z-[110] hidden md:block"
          >
            <div className="flex flex-col items-center gap-3 bg-white/90 backdrop-blur-sm rounded-full px-3 py-4 shadow-xl border border-white/50">
              <button
                onClick={(e) => { e.stopPropagation(); setPreorderPopupOpen(true); }}
                className="flex flex-col items-center gap-1 p-3 bg-primary text-white rounded-full font-heading font-bold text-xs hover:bg-primary/90 transition-colors hover:scale-105"
                data-testid="button-intro-preorder-desktop"
              >
                <ShoppingCart className="w-5 h-5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setEmailOpen(true); }}
                className="flex flex-col items-center gap-1 p-3 bg-sky-600 text-white rounded-full font-heading font-bold text-xs hover:bg-sky-700 transition-colors hover:scale-105"
                data-testid="button-intro-email-desktop"
              >
                <Mail className="w-5 h-5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setShareOpen(true); }}
                className="flex flex-col items-center gap-1 p-3 bg-amber-500 text-white rounded-full font-heading font-bold text-xs hover:bg-amber-600 transition-colors hover:scale-105"
                data-testid="button-intro-share-desktop"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </motion.div>

          {/* Pre-order Dialog */}
          <Dialog open={preorderOpen} onOpenChange={setPreorderOpen}>
            <DialogContent className="sm:max-w-md" onClick={(e) => e.stopPropagation()}>
              <DialogHeader>
                <DialogTitle className="font-heading text-xl">Pre-order Camila's Adventure</DialogTitle>
                <DialogDescription className="font-serif">
                  Be among the first to get this beautiful picture book!
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <p className="font-serif text-sm text-stone-600">
                  Join Camila on an exciting road trip across all 50 states. Perfect for curious kids ages 4-8!
                </p>
                <Button
                  onClick={handlePreorderClick}
                  className="w-full rounded-full font-heading font-bold bg-primary hover:bg-primary/90"
                  data-testid="button-preorder-confirm"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Go to Pre-order Page
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Email Signup Dialog */}
          <Dialog open={emailOpen} onOpenChange={setEmailOpen}>
            <DialogContent className="sm:max-w-md" onClick={(e) => e.stopPropagation()}>
              <DialogHeader>
                <DialogTitle className="font-heading text-xl">Stay Updated</DialogTitle>
                <DialogDescription className="font-serif">
                  Get notified when the book launches and receive exclusive updates.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                <Input
                  {...form.register("name")}
                  placeholder="Name (optional)"
                  className="rounded-full"
                  data-testid="input-intro-name"
                />
                <Input
                  {...form.register("email")}
                  type="email"
                  placeholder="Email address"
                  className="rounded-full"
                  data-testid="input-intro-email"
                />
                {form.formState.errors.email && (
                  <p className="text-xs text-red-500 px-3">{form.formState.errors.email.message}</p>
                )}
                <div className="flex items-start gap-2 px-1">
                  <Checkbox
                    id="intro-newsletterConsent"
                    checked={form.watch("newsletterConsent")}
                    onCheckedChange={(checked) => form.setValue("newsletterConsent", checked as boolean)}
                    data-testid="checkbox-intro-consent"
                  />
                  <label htmlFor="intro-newsletterConsent" className="text-xs text-stone-600 leading-tight cursor-pointer">
                    I agree to receive updates about the book launch and news.
                  </label>
                </div>
                {form.formState.errors.newsletterConsent && (
                  <p className="text-xs text-red-500 px-3">{form.formState.errors.newsletterConsent.message}</p>
                )}
                <Button
                  type="submit"
                  disabled={subscribeMutation.isPending}
                  className="w-full rounded-full font-heading font-bold bg-sky-600 hover:bg-sky-700"
                  data-testid="button-intro-subscribe"
                >
                  {subscribeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign Up"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          {/* Share Dialog */}
          <Dialog open={shareOpen} onOpenChange={setShareOpen}>
            <DialogContent className="sm:max-w-md" onClick={(e) => e.stopPropagation()}>
              <DialogHeader>
                <DialogTitle className="font-heading text-xl">Share the Adventure</DialogTitle>
                <DialogDescription className="font-serif">
                  Know someone who'd love this book? Spread the word!
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Button
                  onClick={handleShare}
                  className="w-full rounded-full font-heading font-bold bg-amber-500 hover:bg-amber-600"
                  data-testid="button-intro-share-confirm"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      {"share" in navigator ? (
                        <>
                          <Share2 className="w-4 h-4 mr-2" />
                          Share
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2" />
                          Copy Link
                        </>
                      )}
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </motion.div>
      ) : (
        <motion.div
          key="opening"
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gradient-to-b from-[#6bafd4] via-[#9dcae3] to-[#dfc9b5] overflow-hidden cursor-pointer"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleTapToFlip}
        >
          {/* Book Page Flip Animation - Full Page View */}
          <div 
            className="relative flex items-center justify-center"
            style={{ perspective: "2000px" }}
          >
            {/* 3D Book Shell */}
            <div 
              className="relative"
              style={{ transformStyle: "preserve-3d", transform: "rotateY(-5deg)" }}
            >
              {/* Spine - always visible on left edge */}
              <div 
                className="absolute top-0 left-0 h-[300px] sm:h-[380px] md:h-[450px] lg:h-[500px] overflow-hidden shadow-lg"
                style={{ 
                  width: `${BOOK_THICKNESS}px`,
                  transform: `rotateY(-90deg) translateX(-${BOOK_THICKNESS / 2}px)`,
                  transformOrigin: "left center",
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                  zIndex: 20,
                }}
              >
                <img 
                  src={spineImage} 
                  alt="Book Spine" 
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Back Cover - static background */}
              <div 
                className="absolute inset-0 w-[300px] h-[300px] sm:w-[380px] sm:h-[380px] md:w-[450px] md:h-[450px] lg:w-[500px] lg:h-[500px] rounded-r-lg overflow-hidden shadow-lg"
                style={{ 
                  transform: `translateZ(-${BOOK_THICKNESS / 2}px)`,
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                  zIndex: 0,
                }}
              >
                <img src={backCover3D} alt="Back Cover" className="w-full h-full object-cover" />
              </div>

              {/* Book Container - Full page view */}
              <div 
                className="relative w-[300px] h-[300px] sm:w-[380px] sm:h-[380px] md:w-[450px] md:h-[450px] lg:w-[500px] lg:h-[500px]"
                style={{ transformStyle: "preserve-3d", transform: `translateZ(${BOOK_THICKNESS / 2}px)` }}
              >
                {/* Page 6 - Final page (bottom of stack, visible when page 5 starts flipping) */}
              <motion.div 
                className="absolute inset-0 rounded-lg shadow-lg overflow-hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: currentPage >= 6 ? 1 : 0 }}
                transition={{ duration: 0.1 }}
              >
                <img src={page6} alt="Page 6" className="w-full h-full object-cover" style={{ WebkitBackfaceVisibility: "hidden", backfaceVisibility: "hidden" }} />
              </motion.div>

              {/* Page 5 - flips when currentPage >= 6, visible when page 4 starts flipping */}
              <motion.div
                className="absolute inset-0 origin-left rounded-lg shadow-lg"
                initial={{ rotateY: 0, opacity: 0 }}
                animate={{ 
                  rotateY: currentPage >= 6 ? -180 : 0,
                  opacity: currentPage >= 5 ? 1 : 0
                }}
                transition={{ duration: 0.8, ease: [0.645, 0.045, 0.355, 1] }}
                style={{ transformStyle: "preserve-3d", zIndex: 5, WebkitBackfaceVisibility: "hidden" }}
              >
                <div className="absolute inset-0 rounded-lg overflow-hidden" style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}>
                  <img src={page5} alt="Page 5" className="w-full h-full object-cover" />
                </div>
                <div className="absolute inset-0 rounded-lg bg-amber-100" style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", transform: "rotateY(180deg)" }} />
              </motion.div>

              {/* Page 4 - flips when currentPage >= 5, visible when page 3 starts flipping */}
              <motion.div
                className="absolute inset-0 origin-left rounded-lg shadow-lg"
                initial={{ rotateY: 0, opacity: 0 }}
                animate={{ 
                  rotateY: currentPage >= 5 ? -180 : 0,
                  opacity: currentPage >= 4 ? 1 : 0
                }}
                transition={{ duration: 0.8, ease: [0.645, 0.045, 0.355, 1] }}
                style={{ transformStyle: "preserve-3d", zIndex: 6, WebkitBackfaceVisibility: "hidden" }}
              >
                <div className="absolute inset-0 rounded-lg overflow-hidden" style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}>
                  <img src={page4} alt="Page 4" className="w-full h-full object-cover" />
                </div>
                <div className="absolute inset-0 rounded-lg bg-amber-100" style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", transform: "rotateY(180deg)" }} />
              </motion.div>

              {/* Page 3 - flips when currentPage >= 4, visible when page 2 starts flipping */}
              <motion.div
                className="absolute inset-0 origin-left rounded-lg shadow-lg"
                initial={{ rotateY: 0, opacity: 0 }}
                animate={{ 
                  rotateY: currentPage >= 4 ? -180 : 0,
                  opacity: currentPage >= 3 ? 1 : 0
                }}
                transition={{ duration: 0.8, ease: [0.645, 0.045, 0.355, 1] }}
                style={{ transformStyle: "preserve-3d", zIndex: 7, WebkitBackfaceVisibility: "hidden" }}
              >
                <div className="absolute inset-0 rounded-lg overflow-hidden" style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}>
                  <img src={page3} alt="Page 3" className="w-full h-full object-cover" />
                </div>
                <div className="absolute inset-0 rounded-lg bg-amber-100" style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", transform: "rotateY(180deg)" }} />
              </motion.div>

              {/* Page 2 - flips when currentPage >= 3, visible when page 1 starts flipping */}
              <motion.div
                className="absolute inset-0 origin-left rounded-lg shadow-lg"
                initial={{ rotateY: 0, opacity: 0 }}
                animate={{ 
                  rotateY: currentPage >= 3 ? -180 : 0,
                  opacity: currentPage >= 2 ? 1 : 0
                }}
                transition={{ duration: 0.8, ease: [0.645, 0.045, 0.355, 1] }}
                style={{ transformStyle: "preserve-3d", zIndex: 8, WebkitBackfaceVisibility: "hidden" }}
              >
                <div className="absolute inset-0 rounded-lg overflow-hidden" style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}>
                  <img src={page2} alt="Page 2" className="w-full h-full object-cover" />
                </div>
                <div className="absolute inset-0 rounded-lg bg-amber-100" style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", transform: "rotateY(180deg)" }} />
              </motion.div>

              {/* Page 1 - flips when currentPage >= 2, visible when cover starts flipping */}
              <motion.div
                className="absolute inset-0 origin-left rounded-lg shadow-lg"
                initial={{ rotateY: 0, opacity: 0 }}
                animate={{ 
                  rotateY: currentPage >= 2 ? -180 : 0,
                  opacity: currentPage >= 1 ? 1 : 0
                }}
                transition={{ duration: 0.8, ease: [0.645, 0.045, 0.355, 1] }}
                style={{ transformStyle: "preserve-3d", zIndex: 9, WebkitBackfaceVisibility: "hidden" }}
              >
                <div className="absolute inset-0 rounded-lg overflow-hidden" style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}>
                  <img src={page1} alt="Page 1" className="w-full h-full object-cover" />
                </div>
                <div className="absolute inset-0 rounded-lg bg-amber-100" style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", transform: "rotateY(180deg)" }} />
              </motion.div>

              {/* Front Cover - flips when currentPage >= 1, always visible */}
              <motion.div
                className="absolute inset-0 origin-left rounded-lg shadow-2xl"
                initial={{ rotateY: 0 }}
                animate={{ rotateY: currentPage >= 1 ? -180 : 0 }}
                transition={{ duration: 0.8, ease: [0.645, 0.045, 0.355, 1] }}
                style={{ transformStyle: "preserve-3d", zIndex: 10, WebkitBackfaceVisibility: "hidden" }}
              >
                <div className="absolute inset-0 rounded-lg overflow-hidden" style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}>
                  <img src={book3D} alt="Front Cover" className="w-full h-full object-cover" />
                </div>
                <div className="absolute inset-0 rounded-lg bg-amber-100" style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", transform: "rotateY(180deg)" }} />
              </motion.div>
              </div>
            </div>
          </div>

          {/* Tap hint */}
          <motion.div
            className="mt-6 text-white/80 font-heading text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            Tap anywhere to flip pages
          </motion.div>

          {/* CTA Bar - also shown during page flip */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.5 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[110]"
          >
            <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-full px-2 py-2 shadow-xl border border-white/50">
              <button
                onClick={(e) => { e.stopPropagation(); setPreorderOpen(true); }}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-full font-heading font-bold text-sm hover:bg-primary/90 transition-colors"
                data-testid="button-flip-preorder"
              >
                <ShoppingCart className="w-4 h-4" />
                <span className="hidden sm:inline">Get Notified</span>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setEmailOpen(true); }}
                className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-full font-heading font-bold text-sm hover:bg-sky-700 transition-colors"
                data-testid="button-flip-email"
              >
                <Mail className="w-4 h-4" />
                <span className="hidden sm:inline">Updates</span>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setShareOpen(true); }}
                className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-full font-heading font-bold text-sm hover:bg-amber-600 transition-colors"
                data-testid="button-flip-share"
              >
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">Share</span>
              </button>
            </div>
          </motion.div>

          {/* Dialogs - also available during page flip */}
          <Dialog open={preorderOpen} onOpenChange={setPreorderOpen}>
            <DialogContent className="sm:max-w-md" onClick={(e) => e.stopPropagation()}>
              <DialogHeader>
                <DialogTitle className="font-heading text-xl">Pre-order Camila's Adventure</DialogTitle>
                <DialogDescription className="font-serif">
                  Be among the first to get this beautiful picture book!
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <p className="font-serif text-sm text-stone-600">
                  Join Camila on an exciting road trip across all 50 states. Perfect for curious kids ages 4-8!
                </p>
                <Button
                  onClick={handlePreorderClick}
                  className="w-full rounded-full font-heading font-bold bg-primary hover:bg-primary/90"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Go to Pre-order Page
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={emailOpen} onOpenChange={setEmailOpen}>
            <DialogContent className="sm:max-w-md" onClick={(e) => e.stopPropagation()}>
              <DialogHeader>
                <DialogTitle className="font-heading text-xl">Stay Updated</DialogTitle>
                <DialogDescription className="font-serif">
                  Get notified when the book launches and receive exclusive updates.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                <Input
                  {...form.register("name")}
                  placeholder="Name (optional)"
                  className="rounded-full"
                />
                <Input
                  {...form.register("email")}
                  type="email"
                  placeholder="Email address"
                  className="rounded-full"
                />
                {form.formState.errors.email && (
                  <p className="text-xs text-red-500 px-3">{form.formState.errors.email.message}</p>
                )}
                <div className="flex items-start gap-2 px-1">
                  <Checkbox
                    id="flip-newsletterConsent"
                    checked={form.watch("newsletterConsent")}
                    onCheckedChange={(checked) => form.setValue("newsletterConsent", checked as boolean)}
                  />
                  <label htmlFor="flip-newsletterConsent" className="text-xs text-stone-600 leading-tight cursor-pointer">
                    I agree to receive updates about the book launch and news.
                  </label>
                </div>
                {form.formState.errors.newsletterConsent && (
                  <p className="text-xs text-red-500 px-3">{form.formState.errors.newsletterConsent.message}</p>
                )}
                <Button
                  type="submit"
                  disabled={subscribeMutation.isPending}
                  className="w-full rounded-full font-heading font-bold bg-sky-600 hover:bg-sky-700"
                >
                  {subscribeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign Up"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={shareOpen} onOpenChange={setShareOpen}>
            <DialogContent className="sm:max-w-md" onClick={(e) => e.stopPropagation()}>
              <DialogHeader>
                <DialogTitle className="font-heading text-xl">Share the Adventure</DialogTitle>
                <DialogDescription className="font-serif">
                  Know someone who'd love this book? Spread the word!
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Button
                  onClick={handleShare}
                  className="w-full rounded-full font-heading font-bold bg-amber-500 hover:bg-amber-600"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      {"share" in navigator ? (
                        <>
                          <Share2 className="w-4 h-4 mr-2" />
                          Share
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2" />
                          Copy Link
                        </>
                      )}
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Fade to white overlay when complete */}
          <AnimatePresence>
            {currentPage >= 7 && (
              <motion.div
                className="absolute inset-0 bg-white"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
              />
            )}
          </AnimatePresence>

          <PreOrderPopup open={preorderPopupOpen} onOpenChange={setPreorderPopupOpen} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
