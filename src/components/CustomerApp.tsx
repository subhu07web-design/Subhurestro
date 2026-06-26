import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Search, Heart, ShoppingBag, MapPin, Calendar, Compass, 
  ChevronRight, ArrowLeft, Plus, Minus, Star, Clock, Sparkles, 
  Check, X, Award, Eye, Phone, MessageSquare, ShieldAlert,
  User, Gift, LogOut, Ticket, CreditCard, ChevronDown, Download, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  auth, 
  db, 
  getFoodsFromDB, 
  getSettingsFromDB, 
  getCouponsFromDB, 
  createOrderInDB, 
  createReservationInDB, 
  subscribeToOrders,
  getUserProfile,
  createUserProfile,
  signInWithGoogle
} from '../lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { FoodItem, CartItem, Order, Reservation, RestaurantSettings, Coupon, UserProfile } from '../types';
import { INITIAL_CATEGORIES } from '../data/mockData';

interface CustomerAppProps {
  settings: RestaurantSettings;
  onLogEvent: (msg: string, type: 'info' | 'success' | 'warning' | 'error') => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function CustomerApp({ settings, onLogEvent: parentLogEvent, activeTab, setActiveTab }: CustomerAppProps) {
  // Floating Action Popups state moved to top
  const [activeNotification, setActiveNotification] = useState<string | null>(null);

  // Beautiful interactive client-side toast notifications bridge
  const onLogEvent = (msg: string, type: 'info' | 'success' | 'warning' | 'error') => {
    parentLogEvent(msg, type);
    setActiveNotification(`${type === 'success' ? '🎉' : type === 'warning' ? '⚠️' : type === 'error' ? '❌' : 'ℹ️'} ${msg}`);
  };

  useEffect(() => {
    if (activeNotification) {
      const timer = setTimeout(() => {
        setActiveNotification(null);
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [activeNotification]);

  // Navigation & Screen States
  const [currentScreen, setCurrentScreen] = useState<'home' | 'search' | 'wishlist' | 'cart' | 'reservations' | 'profile' | 'tracking' | 'history'>('home');
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'forgot'>('login');

  // Firebase Data States
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingFoods, setLoadingFoods] = useState(true);

  // Authentication Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Search Screen States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [priceRange, setPriceRange] = useState<number>(1000);
  const [vegOnly, setVegOnly] = useState(false);

  // Detail Modal Customization
  const [detailQuantity, setDetailQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<{ variantName: string, optionName: string, priceAdjustment: number } | null>(null);
  const [selectedAddOns, setSelectedAddOns] = useState<{ [addonName: string]: boolean }>({});

  // Cart & Wishlist Local States
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);

  // Checkout View States
  const [isCheckoutMode, setIsCheckoutMode] = useState(false);
  const [checkoutName, setCheckoutName] = useState('');
  const [checkoutPhone, setCheckoutPhone] = useState('');
  const [checkoutEmail, setCheckoutEmail] = useState('');
  const [checkoutAddress, setCheckoutAddress] = useState('');
  const [checkoutInstructions, setCheckoutInstructions] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'upi' | 'razorpay'>('cod');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  
  // Tracking Screen States
  const [activeTrackingOrderId, setActiveTrackingOrderId] = useState<string | null>(null);
  const [showInvoiceId, setShowInvoiceId] = useState<string | null>(null);

  // Table Reservation Form States
  const [resName, setResName] = useState('');
  const [resPhone, setResPhone] = useState('');
  const [resDate, setResDate] = useState('');
  const [resTime, setResTime] = useState('07:30 PM');
  const [resGuests, setResGuests] = useState(2);
  const [resRequest, setResRequest] = useState('');
  const [resSuccessMsg, setResSuccessMsg] = useState(false);
  const [isSubmittingRes, setIsSubmittingRes] = useState(false);

  // Active categories computed
  const categories = useMemo(() => {
    const list = new Set(foods.map(f => f.category));
    return ['All', ...Array.from(list)];
  }, [foods]);

  // Load Initial Foods & Coupons, Listen to Auth Changes
  useEffect(() => {
    async function loadInitialData() {
      try {
        setLoadingFoods(true);
        const [foodsList, couponsList] = await Promise.all([
          getFoodsFromDB(),
          getCouponsFromDB()
        ]);
        setFoods(foodsList);
        setCoupons(couponsList);
        onLogEvent("Loaded menu catalog and premium promo codes.", "info");
      } catch (err) {
        console.error(err);
        onLogEvent("Failed to download catalog. Displaying rich cache.", "warning");
      } finally {
        setLoadingFoods(false);
      }
    }
    loadInitialData();

    // Listen to Firebase Authentication State
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        onLogEvent(`User authenticated: ${firebaseUser.email}`, "success");
        const p = await getUserProfile(firebaseUser.uid);
        if (p) {
          setProfile(p);
          // Prefill checkout fields
          setCheckoutName(p.name);
          setCheckoutPhone(p.phone);
          setCheckoutEmail(p.email);
          setCheckoutAddress(p.address);
        } else {
          // Create a fallback profile
          const newP = await createUserProfile(firebaseUser.uid, {
            name: firebaseUser.displayName || "Gourmet Patron",
            email: firebaseUser.email || "",
            role: "customer"
          });
          setProfile(newP);
          setCheckoutName(newP.name);
          setCheckoutEmail(newP.email);
        }
      } else {
        setProfile(null);
        onLogEvent("User logged out. Switched to elegant Guest mode.", "info");
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Subscribe to Customer's Orders
  useEffect(() => {
    if (!user) {
      setOrders([]);
      return;
    }
    const unsubscribeOrders = subscribeToOrders(user.uid, false, (fetchedOrders) => {
      // Look for status updates to show notification
      setOrders((prevOrders) => {
        if (prevOrders.length > 0 && fetchedOrders.length > 0) {
          const prevOrder = prevOrders[0];
          const newOrder = fetchedOrders.find(o => o.id === prevOrder.id);
          if (newOrder && newOrder.status !== prevOrder.status) {
            let emoji = '👨‍🍳';
            if (newOrder.status === 'preparing') emoji = '🔥';
            if (newOrder.status === 'ready') emoji = '🔔';
            if (newOrder.status === 'completed') emoji = '✨';
            if (newOrder.status === 'cancelled') emoji = '❌';

            setActiveNotification(`Status Update: Your order #${newOrder.id.substring(0,6)} is now: ${newOrder.status.toUpperCase()} ${emoji}`);
            onLogEvent(`Order #${newOrder.id.substring(0,6)} status changed to ${newOrder.status}`, "info");
            setTimeout(() => setActiveNotification(null), 6000);
          }
        }
        return fetchedOrders;
      });
    });

    return () => unsubscribeOrders();
  }, [user]);

  // Handle Detail Modal Opening
  const handleOpenDetail = (food: FoodItem) => {
    setSelectedFood(food);
    setDetailQuantity(1);
    setSelectedAddOns({});
    if (food.variants && food.variants.length > 0) {
      const v = food.variants[0];
      setSelectedVariant({
        variantName: v.name,
        optionName: v.options[0].name,
        priceAdjustment: v.options[0].priceAdjustment
      });
    } else {
      setSelectedVariant(null);
    }
  };

  // Add Item to Cart
  const handleAddToCart = () => {
    if (!selectedFood) return;

    const addOnsList = selectedFood.addOns
      ? selectedFood.addOns.filter(ao => selectedAddOns[ao.name])
      : [];

    const cartItem: CartItem = {
      food: selectedFood,
      quantity: detailQuantity,
      selectedVariant: selectedVariant || undefined,
      selectedAddOns: addOnsList.length > 0 ? addOnsList : undefined
    };

    setCart(prev => [...prev, cartItem]);
    onLogEvent(`Added "${selectedFood.name}" to your gold collection.`, "success");
    setSelectedFood(null);
  };

  // Toggle Wishlist
  const toggleWishlist = (id: string) => {
    setWishlist(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
    const inWish = wishlist.includes(id);
    onLogEvent(inWish ? "Removed dish from favorites." : "Added dish to your luxury wishlist.", "info");
  };

  // Cart Computations
  const cartSubtotal = useMemo(() => {
    return cart.reduce((total, item) => {
      let basePrice = item.food.discountPrice || item.food.price;
      if (item.selectedVariant) {
        basePrice += item.selectedVariant.priceAdjustment;
      }
      const addOnsTotal = item.selectedAddOns
        ? item.selectedAddOns.reduce((sum, ao) => sum + ao.price, 0)
        : 0;
      return total + (basePrice + addOnsTotal) * item.quantity;
    }, 0);
  }, [cart]);

  const discountAmount = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.minOrderValue && cartSubtotal < appliedCoupon.minOrderValue) {
      return 0; // Does not qualify
    }
    if (appliedCoupon.discountPercent) {
      return Math.round((cartSubtotal * appliedCoupon.discountPercent) / 100);
    }
    if (appliedCoupon.flatDiscount) {
      return appliedCoupon.flatDiscount;
    }
    return 0;
  }, [appliedCoupon, cartSubtotal]);

  // Adjust applied coupon dynamically if price changes
  useEffect(() => {
    if (appliedCoupon && appliedCoupon.minOrderValue && cartSubtotal < appliedCoupon.minOrderValue) {
      setAppliedCoupon(null);
      onLogEvent(`Coupon removed. Sourdough cart value fell below Minimum ₹${appliedCoupon.minOrderValue}`, "warning");
    }
  }, [cartSubtotal, appliedCoupon]);

  const gstCharge = useMemo(() => {
    return Math.round((cartSubtotal - discountAmount) * (settings.gstPercent / 100));
  }, [cartSubtotal, discountAmount, settings.gstPercent]);

  const deliveryCharge = useMemo(() => {
    if (cartSubtotal === 0) return 0;
    return cartSubtotal > 800 ? 0 : settings.deliveryCharges; // Free delivery over 800
  }, [cartSubtotal, settings.deliveryCharges]);

  const packingCharge = cartSubtotal > 0 ? 30 : 0;

  const cartTotal = useMemo(() => {
    if (cartSubtotal === 0) return 0;
    return cartSubtotal - discountAmount + gstCharge + deliveryCharge + packingCharge;
  }, [cartSubtotal, discountAmount, gstCharge, deliveryCharge, packingCharge]);

  // Apply Coupon Code
  const handleApplyCoupon = () => {
    const code = couponCodeInput.trim().toUpperCase();
    const found = coupons.find(c => c.code === code && c.isActive);
    if (!found) {
      onLogEvent("Invalid or expired golden coupon code.", "error");
      return;
    }
    if (found.minOrderValue && cartSubtotal < found.minOrderValue) {
      onLogEvent(`Cart value must exceed ₹${found.minOrderValue} to redeem code.`, "warning");
      return;
    }
    setAppliedCoupon(found);
    onLogEvent(`Coupon "${code}" applied successfully! Saved ₹${discountAmount}.`, "success");
  };

  // Submit Reservation
  const handleBookTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resName || !resPhone || !resDate) {
      onLogEvent("Please complete the reservation form.", "warning");
      return;
    }
    setIsSubmittingRes(true);
    try {
      const newRes: Reservation = {
        id: "RES-" + Math.floor(100000 + Math.random() * 900000),
        userId: user?.uid,
        name: resName,
        phone: resPhone,
        date: resDate,
        time: resTime,
        guests: resGuests,
        specialRequest: resRequest,
        status: 'pending',
        createdAt: new Date().toISOString()
      };
      await createReservationInDB(newRes);
      setResSuccessMsg(true);
      onLogEvent(`Reservation request ${newRes.id} submitted instantly to Subhu Restro.`, "success");
      
      // Reset Form
      setResName('');
      setResPhone('');
      setResRequest('');
    } catch (err) {
      console.error(err);
      onLogEvent("Reservation failed. Please check network connections.", "error");
    } finally {
      setIsSubmittingRes(false);
    }
  };

  // Auth Functions
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      if (authMode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
        setIsAuthModalOpen(false);
      } else if (authMode === 'signup') {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await createUserProfile(cred.user.uid, {
          name: fullName || "Noble Guest",
          email: email,
          phone: phone,
          address: address,
          role: "customer"
        });
        setIsAuthModalOpen(false);
      } else {
        // Mock forgot password
        onLogEvent("Recovery transmission sent to " + email, "info");
        setAuthMode('login');
      }
    } catch (err: any) {
      console.error(err);
      setAuthError(err.message || "Authentication error encountered.");
    } finally {
      setAuthLoading(false);
    }
  };

  // Handle Google Login Click
  const handleGoogleLogin = async () => {
    setAuthLoading(true);
    setAuthError('');
    try {
      await signInWithGoogle();
      setIsAuthModalOpen(false);
    } catch (err: any) {
      console.error(err);
      setAuthError(err.message || "Google Authentication canceled.");
    } finally {
      setAuthLoading(false);
    }
  };

  // Sign out user
  const handleSignOut = async () => {
    await signOut(auth);
    setProfile(null);
  };

  // Interactive Sandbox Payments Simulation
  const [isUpiModalOpen, setIsUpiModalOpen] = useState(false);
  const [isRazorpayModalOpen, setIsRazorpayModalOpen] = useState(false);

  // Submit Food Order
  const handlePlaceOrder = async () => {
    if (!user) {
      setAuthMode('login');
      setIsAuthModalOpen(true);
      onLogEvent("Please authorize your profile before ordering.", "warning");
      return;
    }
    if (!checkoutName || !checkoutPhone || !checkoutAddress) {
      onLogEvent("Please complete your delivery credentials.", "warning");
      return;
    }
    setIsSubmittingOrder(true);
    try {
      const orderId = "ORD-" + Math.floor(100000 + Math.random() * 900000);
      const itemsSummary = cart.map(item => ({
        foodId: item.food.id,
        name: item.food.name,
        quantity: item.quantity,
        price: item.food.discountPrice || item.food.price,
        selectedVariant: item.selectedVariant,
        selectedAddOns: item.selectedAddOns,
        isVeg: item.food.isVeg
      }));

      const newOrder: Order = {
        id: orderId,
        userId: user.uid,
        userName: checkoutName,
        userPhone: checkoutPhone,
        userEmail: checkoutEmail,
        items: itemsSummary,
        promoCode: appliedCoupon?.code,
        discount: discountAmount,
        tax: gstCharge,
        packingCharge,
        deliveryCharge,
        total: cartTotal,
        status: 'received',
        paymentMethod,
        address: checkoutAddress,
        specialInstructions: checkoutInstructions,
        estimatedTime: 30, // Default 30 min
        createdAt: new Date().toISOString()
      };

      await createOrderInDB(newOrder);
      
      // Clear Cart
      setCart([]);
      setAppliedCoupon(null);
      setCouponCodeInput('');
      setIsCheckoutMode(false);
      setActiveTrackingOrderId(orderId);
      setCurrentScreen('tracking');
      
      onLogEvent(`Gourmet order #${orderId.substring(4)} placed! Synced instantly with owner dashboard.`, "success");
    } catch (err) {
      console.error(err);
      onLogEvent("Order submission failed. Check your internet connection or Firestore setup.", "error");
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const handleInitiatePayment = () => {
    if (!user) {
      setAuthMode('login');
      setIsAuthModalOpen(true);
      onLogEvent("Please authorize your profile before ordering.", "warning");
      return;
    }
    if (!checkoutName || !checkoutPhone || !checkoutAddress) {
      onLogEvent("Please complete your delivery credentials.", "warning");
      return;
    }

    if (paymentMethod === 'cod') {
      handlePlaceOrder();
    } else if (paymentMethod === 'upi') {
      setIsUpiModalOpen(true);
      onLogEvent("Please scan the secure UPI QR code to complete payment.", "info");
    } else if (paymentMethod === 'razorpay') {
      setIsRazorpayModalOpen(true);
      onLogEvent("Opening Secure Razorpay payment gateway...", "info");
    }
  };

  // Filtered menu logic
  const filteredFoods = useMemo(() => {
    return foods.filter(food => {
      const matchesSearch = food.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            food.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || food.category === selectedCategory;
      const matchesPrice = (food.discountPrice || food.price) <= priceRange;
      const matchesVeg = !vegOnly || food.isVeg;
      return matchesSearch && matchesCategory && matchesPrice && matchesVeg;
    });
  }, [foods, searchQuery, selectedCategory, priceRange, vegOnly]);

  // Find active tracking order details
  const trackingOrder = useMemo(() => {
    return orders.find(o => o.id === activeTrackingOrderId) || orders[0];
  }, [orders, activeTrackingOrderId]);

  return (
    <div className="flex flex-col h-full bg-[#0A0D14] text-gray-200 select-none overflow-hidden relative font-sans">
      
      {/* Dynamic Top Push Notification */}
      <AnimatePresence>
        {activeNotification && (
          <motion.div 
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            className="absolute top-12 left-2 right-2 z-[9999] bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-700 p-3 rounded-xl shadow-xl border border-amber-400/30 text-white flex items-center justify-between text-xs"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-yellow-200 animate-pulse shrink-0" />
              <span>{activeNotification}</span>
            </div>
            <button onClick={() => setActiveNotification(null)} className="p-1 hover:bg-black/20 rounded">
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Header bar of Custom Shell */}
      <header className="px-4 py-3 bg-[#0E131F]/90 border-b border-gray-800/40 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg overflow-hidden border border-amber-500/30 flex items-center justify-center bg-gradient-to-tr from-amber-600 to-yellow-400">
            <span className="font-serif font-black text-white text-base">L</span>
          </div>
          <div>
            <h1 className="text-sm font-bold text-white font-serif tracking-tight leading-none">{settings.name}</h1>
            <p className="text-[10px] text-amber-500/80 mt-0.5 tracking-wide">{settings.tagline}</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button 
            onClick={() => toggleWishlist("test")} 
            className="relative p-1.5 text-gray-400 hover:text-amber-500 transition-colors"
            onClickCapture={() => setCurrentScreen('wishlist')}
          >
            <Heart className={`w-4 h-4 ${wishlist.length > 0 ? 'fill-rose-500 text-rose-500' : ''}`} />
            {wishlist.length > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 text-white rounded-full text-[8px] flex items-center justify-center font-bold">
                {wishlist.length}
              </span>
            )}
          </button>

          {user ? (
            <button 
              onClick={() => setCurrentScreen('profile')} 
              className="flex items-center gap-1.5 p-1 bg-gray-800/60 rounded-full border border-gray-700/30 hover:border-amber-500/40 transition-all"
            >
              <img 
                src={profile?.role === 'admin' ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=40&h=40" : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=40&h=40"} 
                className="w-5.5 h-5.5 rounded-full object-cover border border-amber-500/20"
                alt="user"
                referrerPolicy="no-referrer"
              />
            </button>
          ) : (
            <button 
              onClick={() => { setAuthMode('login'); setIsAuthModalOpen(true); }}
              className="px-2.5 py-1 text-[10px] font-semibold text-amber-500 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition-all rounded-md"
            >
              Sign In
            </button>
          )}
        </div>
      </header>

      {/* Main Screen Container */}
      <main className="flex-1 overflow-y-auto px-4 py-3 space-y-4 pb-20 custom-scrollbar">

        {/* Loading / Empty State Overlay */}
        {loadingFoods && (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
            <p className="text-xs text-gray-400">Loading fine dining catalog...</p>
          </div>
        )}

        {/* SCREEN: HOME */}
        {!loadingFoods && currentScreen === 'home' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* HERO BANNER SLIDER */}
            <div className="relative h-36 rounded-2xl overflow-hidden shadow-lg border border-gray-800/40 group">
              <img 
                src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=800" 
                className="w-full h-full object-cover brightness-[0.4]" 
                alt="Luxury Dining"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent p-4 flex flex-col justify-end">
                <div className="flex items-center gap-1 text-[10px] text-amber-400 font-bold tracking-widest uppercase mb-1">
                  <Sparkles className="w-3 h-3 text-amber-400 fill-amber-400" />
                  <span>Today's Culinary Highlight</span>
                </div>
                <h3 className="text-base font-serif font-bold text-white leading-tight">Artisanal White Truffle Pizza</h3>
                <p className="text-[11px] text-gray-300 line-clamp-1 mt-0.5">Fermented sourdough crust with black truffle zest, burrata & wild porcini.</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400 font-serif">₹590 <span className="text-[9px] line-through text-gray-500 ml-1">₹650</span></span>
                  <button 
                    onClick={() => {
                      const f = foods.find(x => x.id === 'pizza_1');
                      if (f) handleOpenDetail(f);
                    }}
                    className="px-2.5 py-1 text-[9px] font-bold text-[#0A0D14] bg-gradient-to-r from-amber-400 to-yellow-500 rounded-md shadow hover:brightness-110 active:scale-95 transition-all"
                  >
                    Experience Now
                  </button>
                </div>
              </div>
            </div>

            {/* QUICK ACTIONS ROW */}
            <div className="grid grid-cols-3 gap-2 shrink-0">
              <button 
                onClick={() => setCurrentScreen('search')}
                className="p-3 rounded-xl bg-[#0E1322] border border-gray-800/40 hover:border-amber-500/30 flex flex-col items-center text-center space-y-1 group transition-all"
              >
                <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500 group-hover:scale-110 transition-transform">
                  <Compass className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-medium text-gray-300">Explore Menu</span>
              </button>
              <button 
                onClick={() => setCurrentScreen('reservations')}
                className="p-3 rounded-xl bg-[#0E1322] border border-gray-800/40 hover:border-amber-500/30 flex flex-col items-center text-center space-y-1 group transition-all"
              >
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 group-hover:scale-110 transition-transform">
                  <Calendar className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-medium text-gray-300">Book Table</span>
              </button>
              <button 
                onClick={() => {
                  if (orders.length > 0) {
                    setActiveTrackingOrderId(orders[0].id);
                    setCurrentScreen('tracking');
                  } else {
                    onLogEvent("No active orders found. Order some food first!", "warning");
                  }
                }}
                className="p-3 rounded-xl bg-[#0E1322] border border-gray-800/40 hover:border-amber-500/30 flex flex-col items-center text-center space-y-1 group transition-all"
              >
                <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500 group-hover:scale-110 transition-transform">
                  <Clock className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-medium text-gray-300">Track Order</span>
              </button>
            </div>

            {/* HORIZONTAL CATEGORIES BAR */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-serif font-bold text-white tracking-wide">Epicurean Categories</h4>
                <button onClick={() => setCurrentScreen('search')} className="text-[10px] text-amber-500 font-medium flex items-center gap-0.5 hover:underline">
                  View All <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 scroll-none shrink-0">
                {INITIAL_CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => {
                      setSelectedCategory(cat);
                      setCurrentScreen('search');
                    }}
                    className="px-3.5 py-1.5 text-[10px] font-medium whitespace-nowrap rounded-lg bg-[#0E1322] border border-gray-800/60 text-gray-300 hover:border-amber-500/30 transition-all active:scale-95"
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* CHEF'S BESTSELLERS (GRID) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Award className="w-4 h-4 text-amber-500 fill-amber-500/20" />
                  <h4 className="text-xs font-serif font-bold text-white tracking-wide">Chef's Signature Selections</h4>
                </div>
                <span className="text-[9px] text-gray-500">Curated Daily</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {foods.filter(f => f.isBestseller).slice(0, 4).map(food => (
                  <div 
                    key={food.id}
                    className="rounded-xl overflow-hidden bg-[#0E1322] border border-gray-800/40 hover:border-amber-500/20 transition-all flex flex-col relative group"
                  >
                    <div className="h-24 w-full relative overflow-hidden">
                      <img 
                        src={food.imageUrl} 
                        alt={food.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-1.5 left-1.5 flex gap-1 items-center">
                        <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center p-0.5 ${food.isVeg ? 'border-emerald-600 bg-emerald-950/80' : 'border-rose-600 bg-rose-950/80'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${food.isVeg ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        </span>
                        <span className="text-[8px] px-1.5 py-0.5 rounded bg-black/70 border border-amber-500/20 text-amber-400 font-bold flex items-center gap-0.5">
                          <Star className="w-2 h-2 fill-amber-400" />
                          {food.rating}
                        </span>
                      </div>
                      
                      <button 
                        onClick={() => toggleWishlist(food.id)}
                        className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/60 text-gray-300 hover:text-rose-500 transition-colors"
                      >
                        <Heart className={`w-3.5 h-3.5 ${wishlist.includes(food.id) ? 'fill-rose-500 text-rose-500' : ''}`} />
                      </button>
                    </div>

                    <div className="p-2.5 flex-1 flex flex-col justify-between">
                      <div>
                        <h5 className="text-[11px] font-bold text-gray-100 line-clamp-1">{food.name}</h5>
                        <p className="text-[9px] text-gray-400 mt-0.5 line-clamp-2 leading-tight">{food.description}</p>
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-gray-800/50 flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold text-white">₹{food.discountPrice || food.price}</span>
                          {food.discountPrice && (
                            <span className="text-[8px] text-gray-500 line-through ml-1">₹{food.price}</span>
                          )}
                        </div>
                        <button 
                          onClick={() => handleOpenDetail(food)}
                          className="p-1 rounded bg-amber-500 text-[#0A0D14] hover:bg-amber-400 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5 stroke-[3]" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* TRUST & TESTIMONIALS */}
            <div className="p-3.5 rounded-xl bg-gradient-to-tr from-[#0C101B] to-[#12192A] border border-gray-800/50 space-y-3">
              <h4 className="text-xs font-serif font-bold text-white text-center">Patrons of Excellence</h4>
              <div className="space-y-3">
                <div className="p-2.5 rounded-lg bg-black/20 text-[10px] space-y-1">
                  <div className="flex items-center gap-1 text-amber-400">
                    <Star className="w-2.5 h-2.5 fill-amber-400" /><Star className="w-2.5 h-2.5 fill-amber-400" /><Star className="w-2.5 h-2.5 fill-amber-400" /><Star className="w-2.5 h-2.5 fill-amber-400" /><Star className="w-2.5 h-2.5 fill-amber-400" />
                  </div>
                  <p className="text-gray-300 italic leading-relaxed">"The Truffle Burrata at Subhu Restro is a masterclass in balance. Fast home delivery and pristine presentation every time!"</p>
                  <p className="text-[8px] text-amber-500/80 text-right">- Marcus Sterling, Michelin Guide Critic</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* SCREEN: SEARCH */}
        {!loadingFoods && currentScreen === 'search' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {/* SEARCH INPUT BAR */}
            <div className="relative">
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search woodfired sourdough, saffron, truffles..."
                className="w-full py-2.5 pl-9 pr-4 text-xs bg-[#0E1322] border border-gray-800 rounded-xl focus:outline-none focus:border-amber-500/50 text-white placeholder-gray-500 transition-all"
              />
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
            </div>

            {/* ADVANCED FILTER DRAWER */}
            <div className="p-3 bg-[#0E1322] rounded-xl border border-gray-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-amber-500 tracking-wider uppercase">Culinary Filters</span>
                <button 
                  onClick={() => { setSelectedCategory('All'); setSearchQuery(''); setPriceRange(1000); setVegOnly(false); }}
                  className="text-[9px] text-gray-500 hover:text-white"
                >
                  Clear Filters
                </button>
              </div>

              {/* Category Chips Scroll */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 scroll-none">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-lg text-[9px] font-bold transition-all border ${selectedCategory === cat ? 'bg-amber-500 border-amber-500 text-[#0A0D14]' : 'bg-[#12192A] border-gray-800 text-gray-400'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Price Slide and Veg Toggle */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] text-gray-400">
                    <span>Max Price</span>
                    <span className="font-bold text-amber-500">₹{priceRange}</span>
                  </div>
                  <input 
                    type="range" 
                    min="100" 
                    max="1000" 
                    step="50"
                    value={priceRange}
                    onChange={(e) => setPriceRange(Number(e.target.value))}
                    className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                </div>

                <div className="flex items-center justify-between border-l border-gray-800 pl-3">
                  <span className="text-[9px] text-gray-400 font-medium">Vegetarian Only</span>
                  <button 
                    onClick={() => setVegOnly(!vegOnly)}
                    className={`w-7 h-4 rounded-full p-0.5 transition-colors ${vegOnly ? 'bg-emerald-600' : 'bg-gray-800'}`}
                  >
                    <div className={`w-3 h-3 bg-white rounded-full transition-transform ${vegOnly ? 'translate-x-3' : 'translate-x-0'}`} />
                  </button>
                </div>
              </div>
            </div>

            {/* MENU GRID */}
            <div className="space-y-3">
              <p className="text-[10px] text-gray-500">Showing {filteredFoods.length} premium dishes</p>
              
              <div className="space-y-2.5">
                {filteredFoods.map(food => (
                  <div 
                    key={food.id}
                    className="p-2.5 rounded-xl bg-[#0E1322] border border-gray-800/40 hover:border-amber-500/10 flex gap-3 transition-all cursor-pointer"
                    onClick={() => handleOpenDetail(food)}
                  >
                    <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0 relative">
                      <img src={food.imageUrl} alt={food.name} className="w-full h-full object-cover" />
                      {food.isBestseller && (
                        <span className="absolute bottom-1 left-1 bg-amber-500 text-[#0A0D14] font-bold px-1 py-0.5 text-[7px] rounded">BEST</span>
                      )}
                    </div>

                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                            <span className={`w-2.5 h-2.5 rounded-sm border flex items-center justify-center p-0.5 shrink-0 ${food.isVeg ? 'border-emerald-600' : 'border-rose-600'}`}>
                              <span className={`w-1 h-1 rounded-full ${food.isVeg ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                            </span>
                            {food.name}
                          </h4>
                          <span className="text-[9px] px-1 bg-gray-800/80 text-amber-500 rounded font-bold flex items-center gap-0.5">
                            <Star className="w-2 h-2 fill-amber-500" />
                            {food.rating}
                          </span>
                        </div>
                        <p className="text-[9px] text-gray-400 mt-1 line-clamp-2 leading-snug">{food.description}</p>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-xs font-bold text-white">₹{food.discountPrice || food.price}</span>
                          {food.discountPrice && (
                            <span className="text-[8px] text-gray-500 line-through">₹{food.price}</span>
                          )}
                          <span className="text-[8px] text-gray-500 flex items-center gap-0.5 ml-2">
                            <Clock className="w-2 h-2" />
                            {food.prepTime}m
                          </span>
                        </div>
                        <span className="text-[9px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-md hover:bg-amber-500/20">
                          Customize
                        </span>
                      </div>
                    </div>
                  </div>
                ))}

                {filteredFoods.length === 0 && (
                  <div className="py-12 text-center space-y-2">
                    <p className="text-xs text-gray-500">No gourmet dishes match your filters.</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* SCREEN: WISHLIST */}
        {currentScreen === 'wishlist' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-serif font-bold text-white tracking-wider uppercase">My Vault (Saved Favorites)</h3>
              <button onClick={() => setWishlist([])} className="text-[9px] text-gray-500 hover:text-rose-400">Clear All</button>
            </div>

            <div className="space-y-2.5">
              {foods.filter(f => wishlist.includes(f.id)).map(food => (
                <div 
                  key={food.id}
                  className="p-2.5 rounded-xl bg-[#0E1322] border border-gray-800 flex gap-3"
                >
                  <img src={food.imageUrl} alt={food.name} className="w-16 h-16 rounded-lg object-cover" />
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-white">{food.name}</h4>
                      <p className="text-[9px] text-gray-400 mt-0.5 line-clamp-1">{food.description}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-500">₹{food.discountPrice || food.price}</span>
                      <div className="flex items-center gap-1.5">
                        <button 
                          onClick={() => handleOpenDetail(food)}
                          className="px-2.5 py-1 rounded bg-amber-500 text-[#0A0D14] text-[8px] font-bold hover:bg-amber-400"
                        >
                          Order
                        </button>
                        <button 
                          onClick={() => toggleWishlist(food.id)}
                          className="p-1 rounded bg-gray-800 text-rose-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {foods.filter(f => wishlist.includes(f.id)).length === 0 && (
                <div className="py-16 text-center space-y-2">
                  <Heart className="w-8 h-8 text-gray-700 mx-auto" />
                  <p className="text-xs text-gray-500">Your luxury food vault is empty.</p>
                  <button onClick={() => setCurrentScreen('home')} className="px-3 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-lg text-[9px] font-bold">
                    Discover Signature Dishes
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* SCREEN: TABLE RESERVATION */}
        {currentScreen === 'reservations' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <div className="text-center space-y-1">
              <h3 className="text-sm font-serif font-bold text-white">Secure Table Booking</h3>
              <p className="text-[10px] text-amber-500/80">Experience VIP lounge dining with custom curated chef recipes</p>
            </div>

            {resSuccessMsg ? (
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-center space-y-3"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
                  <Check className="w-5 h-5 stroke-[3]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Booking Request Transmitted!</h4>
                  <p className="text-[10px] text-gray-400 mt-1">Our Maître D' will review your request. Approval notifications will sync automatically in real-time inside your Profile tab.</p>
                </div>
                <button 
                  onClick={() => setResSuccessMsg(false)}
                  className="px-4 py-1.5 bg-emerald-600 text-white rounded-lg text-[10px] font-bold hover:bg-emerald-500 transition-colors"
                >
                  Book Another Table
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleBookTable} className="p-4 bg-[#0E1322] border border-gray-800 rounded-xl space-y-3.5">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Patron Name</label>
                  <input 
                    type="text" 
                    required
                    value={resName}
                    onChange={(e) => setResName(e.target.value)}
                    placeholder="e.g. Alexander Mercer"
                    className="w-full p-2.5 bg-gray-900 border border-gray-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500/40"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Contact Phone</label>
                  <input 
                    type="tel" 
                    required
                    value={resPhone}
                    onChange={(e) => setResPhone(e.target.value)}
                    placeholder="e.g. 8822344281"
                    className="w-full p-2.5 bg-gray-900 border border-gray-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500/40"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Date</label>
                    <input 
                      type="date" 
                      required
                      value={resDate}
                      onChange={(e) => setResDate(e.target.value)}
                      className="w-full p-2.5 bg-gray-900 border border-gray-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500/40"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Preferred Time</label>
                    <select 
                      value={resTime}
                      onChange={(e) => setResTime(e.target.value)}
                      className="w-full p-2.5 bg-gray-900 border border-gray-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500/40"
                    >
                      <option value="12:30 PM">12:30 PM (Lunch)</option>
                      <option value="01:30 PM">01:30 PM</option>
                      <option value="07:00 PM">07:00 PM (Dinner)</option>
                      <option value="08:00 PM">08:00 PM</option>
                      <option value="09:30 PM">09:30 PM</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Total Guests ({resGuests} Patrons)</label>
                  <div className="flex items-center gap-3 bg-gray-900 border border-gray-800 rounded-lg p-1">
                    <button 
                      type="button"
                      onClick={() => setResGuests(Math.max(1, resGuests - 1))}
                      className="p-1 bg-gray-800 text-white rounded hover:bg-gray-700"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="flex-1 text-center text-xs text-white font-bold">{resGuests}</span>
                    <button 
                      type="button"
                      onClick={() => setResGuests(Math.min(20, resGuests + 1))}
                      className="p-1 bg-gray-800 text-white rounded hover:bg-gray-700"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Special Request (Optional)</label>
                  <textarea 
                    value={resRequest}
                    onChange={(e) => setResRequest(e.target.value)}
                    placeholder="e.g. Vegetarian table, birthday celebration decoration, quiet spot..."
                    rows={2}
                    className="w-full p-2.5 bg-gray-900 border border-gray-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500/40"
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={isSubmittingRes}
                  className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-[#0A0D14] font-bold text-xs rounded-lg shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
                >
                  {isSubmittingRes ? "Processing Table Vault..." : "Request Reservation Spot"}
                </button>
              </form>
            )}
          </motion.div>
        )}

        {/* SCREEN: CART & CHECKOUT */}
        {currentScreen === 'cart' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {/* Toggle checkout mode header */}
            <div className="flex items-center gap-2">
              {isCheckoutMode && (
                <button onClick={() => setIsCheckoutMode(false)} className="p-1 text-gray-400 hover:text-white">
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}
              <h3 className="text-xs font-serif font-bold text-white tracking-wider uppercase">
                {isCheckoutMode ? "Gold Delivery Credentials" : "My Luxury Basket"}
              </h3>
            </div>

            {!isCheckoutMode ? (
              // BASKET ITEMS FLOW
              <div className="space-y-3">
                {cart.map((item, index) => {
                  let basePrice = item.food.discountPrice || item.food.price;
                  if (item.selectedVariant) {
                    basePrice += item.selectedVariant.priceAdjustment;
                  }
                  const addOnsTotal = item.selectedAddOns
                    ? item.selectedAddOns.reduce((sum, ao) => sum + ao.price, 0)
                    : 0;
                  const itemTotal = (basePrice + addOnsTotal) * item.quantity;

                  return (
                    <div 
                      key={index}
                      className="p-3 rounded-xl bg-[#0E1322] border border-gray-800/60 flex items-center justify-between gap-3"
                    >
                      <img src={item.food.imageUrl} alt={item.food.name} className="w-12 h-12 rounded-lg object-cover shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-white truncate">{item.food.name}</h4>
                        <p className="text-[8px] text-gray-400 truncate">
                          {item.selectedVariant && `${item.selectedVariant.variantName}: ${item.selectedVariant.optionName}`}
                          {item.selectedAddOns && ` + ${item.selectedAddOns.map(ao => ao.name).join(', ')}`}
                        </p>
                        <span className="text-[10px] font-bold text-amber-500">₹{basePrice + addOnsTotal}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 bg-gray-900 border border-gray-800 rounded p-0.5">
                          <button 
                            onClick={() => {
                              if (item.quantity === 1) {
                                setCart(prev => prev.filter((_, i) => i !== index));
                                onLogEvent("Removed dish from basket.", "info");
                              } else {
                                const copy = [...cart];
                                copy[index].quantity -= 1;
                                setCart(copy);
                              }
                            }}
                            className="p-0.5 hover:bg-gray-800 rounded text-gray-400 hover:text-white"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-[10px] font-bold text-white w-4 text-center">{item.quantity}</span>
                          <button 
                            onClick={() => {
                              const copy = [...cart];
                              copy[index].quantity += 1;
                              setCart(copy);
                            }}
                            className="p-0.5 hover:bg-gray-800 rounded text-gray-400 hover:text-white"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <span className="text-[11px] font-bold text-white w-14 text-right">₹{itemTotal}</span>
                      </div>
                    </div>
                  );
                })}

                {cart.length === 0 ? (
                  <div className="py-16 text-center space-y-3">
                    <ShoppingBag className="w-8 h-8 text-gray-700 mx-auto" />
                    <p className="text-xs text-gray-500 font-medium">Your gastronomic cart is pristine.</p>
                    <button onClick={() => setCurrentScreen('home')} className="px-3.5 py-1.5 bg-amber-500 text-[#0A0D14] rounded-lg text-[9px] font-bold">
                      Add Gourmet Dishes
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 pt-2">
                    {/* COUPON INPUT */}
                    <div className="flex gap-2 p-2 bg-gray-900 border border-gray-800 rounded-xl">
                      <Ticket className="w-4 h-4 text-amber-500 shrink-0 self-center ml-1" />
                      <input 
                        type="text" 
                        value={couponCodeInput}
                        onChange={(e) => setCouponCodeInput(e.target.value)}
                        placeholder="ENTER GOLD COUPON CODE"
                        className="flex-1 bg-transparent text-xs text-white uppercase focus:outline-none placeholder-gray-500"
                      />
                      <button 
                        onClick={handleApplyCoupon}
                        className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-[#0A0D14] rounded-lg text-[9px] font-bold"
                      >
                        Apply
                      </button>
                    </div>

                    {appliedCoupon && (
                      <div className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg flex justify-between items-center text-[9px]">
                        <span className="text-amber-500 font-bold flex items-center gap-1">
                          <Check className="w-3 h-3" /> Code "{appliedCoupon.code}" Activated
                        </span>
                        <button onClick={() => setAppliedCoupon(null)} className="text-gray-400 hover:text-rose-500">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    {/* BILL DETAILS */}
                    <div className="p-3 bg-[#0E1322] border border-gray-800 rounded-xl space-y-2 text-xs">
                      <h4 className="text-[10px] font-bold text-gray-400 tracking-wider uppercase mb-1">Billing Breakdown</h4>
                      
                      <div className="flex justify-between text-gray-400 text-[11px]">
                        <span>Subtotal</span>
                        <span>₹{cartSubtotal}</span>
                      </div>
                      
                      {discountAmount > 0 && (
                        <div className="flex justify-between text-emerald-500 text-[11px]">
                          <span>Gold Discount</span>
                          <span>-₹{discountAmount}</span>
                        </div>
                      )}

                      <div className="flex justify-between text-gray-400 text-[11px]">
                        <span>GST ({settings.gstPercent}%)</span>
                        <span>₹{gstCharge}</span>
                      </div>

                      <div className="flex justify-between text-gray-400 text-[11px]">
                        <span>Hotel Packaging Charge</span>
                        <span>₹{packingCharge}</span>
                      </div>

                      <div className="flex justify-between text-gray-400 text-[11px]">
                        <span>Specialist Delivery Charge</span>
                        <span>{deliveryCharge === 0 ? <span className="text-emerald-500">FREE</span> : `₹${deliveryCharge}`}</span>
                      </div>

                      <div className="pt-2 border-t border-gray-800 flex justify-between text-sm font-bold text-white font-serif">
                        <span>Total Payable</span>
                        <span className="text-amber-500">₹{cartTotal}</span>
                      </div>
                    </div>

                    {/* CHECKOUT BUTTON */}
                    <button 
                      onClick={() => {
                        if (!user) {
                          setAuthMode('login');
                          setIsAuthModalOpen(true);
                          onLogEvent("Please authorize your profile before checkout.", "warning");
                        } else {
                          setIsCheckoutMode(true);
                        }
                      }}
                      className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-[#0A0D14] font-bold text-xs rounded-lg text-center shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <span>Proceed to Credentials Checkout</span>
                      <ChevronRight className="w-4 h-4 stroke-[3]" />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              // DELIVERY CHECKOUT DETAILS SCREEN
              <div className="space-y-3.5">
                <div className="p-4 bg-[#0E1322] border border-gray-800 rounded-xl space-y-3 text-xs">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Recipient Name</label>
                    <input 
                      type="text" 
                      value={checkoutName}
                      onChange={(e) => setCheckoutName(e.target.value)}
                      placeholder="e.g. Alexander Mercer"
                      className="w-full p-2.5 bg-gray-900 border border-gray-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500/30"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Recipient Phone</label>
                    <input 
                      type="tel" 
                      value={checkoutPhone}
                      onChange={(e) => setCheckoutPhone(e.target.value)}
                      placeholder="e.g. 8822344281"
                      className="w-full p-2.5 bg-gray-900 border border-gray-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500/30"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Gourmet Delivery Address</label>
                    <textarea 
                      value={checkoutAddress}
                      onChange={(e) => setCheckoutAddress(e.target.value)}
                      placeholder="Enter full flat, suite number, block and community address."
                      rows={2.5}
                      className="w-full p-2.5 bg-gray-900 border border-gray-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500/30"
                    />
                  </div>

                  {/* INTERACTIVE SIMULATED MAP PICKER */}
                  <div className="p-2 bg-gray-900 border border-gray-800 rounded-lg space-y-1.5">
                    <div className="flex justify-between items-center text-[8px] text-gray-500">
                      <span>Google Map Pin Precision</span>
                      <span className="text-amber-500 font-bold">Auto-Aligned</span>
                    </div>
                    <div className="h-16 w-full rounded-md bg-cover bg-center brightness-[0.7] border border-gray-800 flex items-center justify-center text-[9px] text-gray-400" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=400')" }}>
                      <div className="px-2 py-1 bg-black/80 rounded-md flex items-center gap-1 text-white border border-amber-500/30">
                        <MapPin className="w-3 h-3 text-amber-500 animate-bounce" />
                        <span>Luxury District Pin Selected</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Chef Special Instructions (Optional)</label>
                    <input 
                      type="text" 
                      value={checkoutInstructions}
                      onChange={(e) => setCheckoutInstructions(e.target.value)}
                      placeholder="e.g. Please leave at door, ring bell, make it medium hot..."
                      className="w-full p-2.5 bg-gray-900 border border-gray-800 rounded-lg text-xs text-white focus:outline-none"
                    />
                  </div>
                </div>

                {/* PAYMENT OPTION SELECTOR */}
                <div className="p-3 bg-[#0E1322] border border-gray-800 rounded-xl space-y-2">
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Secure Escrow Payment Method</span>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <button 
                      onClick={() => setPaymentMethod('cod')}
                      className={`p-2 rounded-lg border flex flex-col items-center justify-center space-y-1 transition-all ${paymentMethod === 'cod' ? 'border-amber-500 bg-amber-500/10 text-amber-500' : 'border-gray-800 bg-gray-900 text-gray-400'}`}
                    >
                      <CreditCard className="w-4 h-4" />
                      <span className="text-[8px] font-bold">C.O.D</span>
                    </button>

                    <button 
                      onClick={() => setPaymentMethod('upi')}
                      className={`p-2 rounded-lg border flex flex-col items-center justify-center space-y-1 transition-all ${paymentMethod === 'upi' ? 'border-amber-500 bg-amber-500/10 text-amber-500' : 'border-gray-800 bg-gray-900 text-gray-400'}`}
                    >
                      <Sparkles className="w-4 h-4" />
                      <span className="text-[8px] font-bold">UPI / QR</span>
                    </button>

                    <button 
                      onClick={() => setPaymentMethod('razorpay')}
                      className={`p-2 rounded-lg border flex flex-col items-center justify-center space-y-1 transition-all ${paymentMethod === 'razorpay' ? 'border-amber-500 bg-amber-500/10 text-amber-500' : 'border-gray-800 bg-gray-900 text-gray-400'}`}
                    >
                      <Award className="w-4 h-4" />
                      <span className="text-[8px] font-bold">Razorpay</span>
                    </button>
                  </div>
                </div>

                {/* PLACE ORDER FINAL TRIGGER */}
                <button 
                  onClick={handleInitiatePayment}
                  disabled={isSubmittingOrder}
                  className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-[#0A0D14] font-bold text-xs rounded-lg text-center shadow-lg active:scale-95 transition-all flex items-center justify-center gap-1.5"
                >
                  {isSubmittingOrder ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Transmitting Culinary Order...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Authorize Payment & Confirm (₹{cartTotal})</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* SCREEN: REAL TIME ORDER TRACKING */}
        {currentScreen === 'tracking' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {trackingOrder ? (
              <div className="space-y-4">
                {/* Visual Status card */}
                <div className="p-4 bg-gradient-to-tr from-[#0F1423] to-[#151D34] border border-amber-500/20 rounded-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl" />
                  
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[9px] text-amber-500 tracking-widest font-bold uppercase">Real-Time Tracker</span>
                      <h3 className="text-base font-serif font-bold text-white mt-0.5">Order #{trackingOrder.id.substring(4)}</h3>
                      <p className="text-[9px] text-gray-400 mt-1">Placed at: {new Date(trackingOrder.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                    </div>
                    <div className="px-3 py-1 bg-amber-500/15 border border-amber-500/30 text-amber-500 text-[10px] font-black rounded-lg uppercase">
                      {trackingOrder.status}
                    </div>
                  </div>

                  {/* Estimation Dial */}
                  <div className="mt-5 text-center py-2 space-y-1">
                    <span className="text-[10px] text-gray-400">Estimated Delivery Arrival</span>
                    <h2 className="text-3xl font-serif font-black text-amber-500 animate-pulse">{trackingOrder.estimatedTime || 30} <span className="text-sm">mins</span></h2>
                    <p className="text-[9px] text-gray-500">Fresh organic fusion dishes prepared to order</p>
                  </div>

                  {/* Timeline bar */}
                  <div className="mt-5 relative">
                    <div className="absolute left-1.5 top-0 bottom-0 w-0.5 bg-gray-800" />
                    
                    <div className="space-y-4.5 pl-7 relative">
                      {[
                        { key: 'received', label: 'Order Registered', desc: 'Sourdough ticket printed in kitchen' },
                        { key: 'preparing', label: 'Culinary Handcraft', desc: 'Dishes being fired by culinary team' },
                        { key: 'ready', label: 'Plated & Ready', desc: 'Insulated vacuum parcel ready for courier' },
                        { key: 'completed', label: 'Fulfilled', desc: 'Delivered to your gold steps' }
                      ].map((step, idx) => {
                        const states = ['received', 'preparing', 'ready', 'completed'];
                        const currentIdx = states.indexOf(trackingOrder.status);
                        const stepIdx = states.indexOf(step.key);
                        const isDone = stepIdx <= currentIdx;
                        const isCurrent = step.key === trackingOrder.status;

                        return (
                          <div key={step.key} className="relative flex gap-3 text-left">
                            <div className={`absolute -left-[25px] w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center transition-all ${isDone ? 'bg-amber-500 border-amber-500 text-[#0A0D14]' : 'bg-gray-950 border-gray-800 text-transparent'}`}>
                              {isDone && <Check className="w-2.5 h-2.5 stroke-[4.5]" />}
                            </div>
                            <div>
                              <h5 className={`text-[10px] font-bold ${isCurrent ? 'text-amber-500' : isDone ? 'text-white' : 'text-gray-500'}`}>
                                {step.label} {isCurrent && "⚡"}
                              </h5>
                              <p className="text-[9px] text-gray-400 mt-0.5">{step.desc}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* INVOICE & REORDER CONTROLS */}
                <div className="p-3 bg-[#0E1322] border border-gray-800 rounded-xl space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Item breakdown</span>
                    <button 
                      onClick={() => setShowInvoiceId(trackingOrder.id)}
                      className="text-[9px] text-amber-500 font-bold flex items-center gap-1 hover:underline"
                    >
                      <Download className="w-3.5 h-3.5" /> View Premium Invoice
                    </button>
                  </div>

                  <div className="space-y-1.5 text-xs text-gray-300">
                    {trackingOrder.items.map((it, i) => (
                      <div key={i} className="flex justify-between text-[11px]">
                        <span>{it.name} <span className="text-gray-500">x{it.quantity}</span></span>
                        <span className="font-bold">₹{it.price * it.quantity}</span>
                      </div>
                    ))}
                    <div className="pt-2 border-t border-gray-800/60 flex justify-between text-[11px] font-bold text-white font-serif">
                      <span>Total Invoice</span>
                      <span className="text-amber-500">₹{trackingOrder.total}</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => {
                      // Reorder code - prefill cart with these items
                      const newCart: CartItem[] = trackingOrder.items.map(item => {
                        const matchedFood = foods.find(f => f.id === item.foodId);
                        return {
                          food: matchedFood || {
                            id: item.foodId,
                            name: item.name,
                            description: "Culinary fusion dish reordered",
                            price: item.price,
                            imageUrl: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=300",
                            isVeg: item.isVeg,
                            isBestseller: false,
                            rating: 4.8,
                            prepTime: 15,
                            category: "Fresh Pasta",
                            isAvailable: true,
                            createdAt: new Date().toISOString()
                          },
                          quantity: item.quantity,
                          selectedVariant: item.selectedVariant || undefined,
                          selectedAddOns: item.selectedAddOns || undefined
                        };
                      });
                      setCart(newCart);
                      setCurrentScreen('cart');
                      onLogEvent("Restored order blueprint back to checkout basket.", "success");
                    }}
                    className="w-full py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/20 hover:border-amber-500/30 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Reorder Sourdough Feast
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-16 text-center space-y-2">
                <ShieldAlert className="w-8 h-8 text-gray-700 mx-auto" />
                <p className="text-xs text-gray-500">No active tracking records found.</p>
              </div>
            )}
          </motion.div>
        )}

        {/* SCREEN: USER PROFILE & HISTORY */}
        {currentScreen === 'profile' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {/* User details card */}
            <div className="p-4 bg-[#0E1322] border border-gray-800 rounded-xl relative overflow-hidden flex items-center gap-3">
              <img 
                src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=80&h=80" 
                className="w-12 h-12 rounded-full border border-amber-500/30 object-cover" 
                alt="Profile"
              />
              <div className="flex-1">
                <h3 className="text-sm font-bold text-white">{profile?.name || "Premium Patron"}</h3>
                <p className="text-[9px] text-gray-400">{profile?.email}</p>
                <div className="flex gap-1.5 mt-1">
                  <span className="text-[8px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/10 font-bold uppercase tracking-wide">
                    {profile?.role || "Patron"}
                  </span>
                  {profile?.role === 'admin' && (
                    <button 
                      onClick={() => setActiveTab('admin')}
                      className="text-[8px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/10 font-black uppercase hover:bg-emerald-500/20 transition-all"
                    >
                      Enter Admin Center
                    </button>
                  )}
                </div>
              </div>
              <button 
                onClick={handleSignOut}
                className="p-1.5 rounded-lg bg-gray-900 text-gray-500 hover:text-rose-500"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

            {/* Address log card */}
            <div className="p-3.5 bg-[#0E1322] border border-gray-800 rounded-xl space-y-2 text-xs">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Saved coordinates</span>
              <div className="flex gap-2 items-start mt-1 text-gray-300 text-[11px] leading-relaxed">
                <MapPin className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-white">Default Residence</p>
                  <p className="text-gray-400 text-[10px]">{profile?.address || "No delivery address logged yet. Checkout first!"}</p>
                </div>
              </div>
            </div>

            {/* PREVIOUS ORDERS SECTION */}
            <div className="space-y-2.5">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Historical Order logs</span>
              
              <div className="space-y-2.5">
                {orders.map(ord => (
                  <div key={ord.id} className="p-3 rounded-xl bg-[#0C101B] border border-gray-800 space-y-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-[10px] font-bold text-white">#{ord.id.substring(4)}</span>
                        <p className="text-[8px] text-gray-500">{new Date(ord.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[8px] font-bold uppercase px-2 py-0.5 rounded ${ord.status === 'completed' ? 'bg-emerald-500/15 text-emerald-400' : ord.status === 'cancelled' ? 'bg-rose-500/15 text-rose-400' : 'bg-amber-500/15 text-amber-400'}`}>
                          {ord.status}
                        </span>
                        <button 
                          onClick={() => {
                            setActiveTrackingOrderId(ord.id);
                            setCurrentScreen('tracking');
                          }}
                          className="p-1 rounded bg-gray-900 text-gray-400 hover:text-white"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-[10px] text-gray-400 line-clamp-1">
                      {ord.items.map(it => `${it.name} x${it.quantity}`).join(', ')}
                    </p>
                    <div className="flex justify-between items-center pt-1.5 border-t border-gray-800/40 text-[10px]">
                      <span className="font-bold text-amber-500">₹{ord.total}</span>
                      <span className="text-[8px] text-gray-500 capitalize">{ord.paymentMethod} Payment</span>
                    </div>
                  </div>
                ))}

                {orders.length === 0 && (
                  <div className="py-10 text-center space-y-1">
                    <p className="text-xs text-gray-500">Your order vaults are blank.</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

      </main>

      {/* DETAILED CUSTOMIZATION DRAWER */}
      <AnimatePresence>
        {selectedFood && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-end justify-center"
            onClick={() => setSelectedFood(null)}
          >
            <motion.div 
              initial={{ y: 300 }}
              animate={{ y: 0 }}
              exit={{ y: 300 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="w-full bg-[#0E1322] rounded-t-3xl border-t border-gray-800 p-5 space-y-4 max-h-[85%] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Image & Title */}
              <div className="flex gap-4">
                <img src={selectedFood.imageUrl} className="w-20 h-20 rounded-xl object-cover border border-amber-500/20 shadow" alt="Food Detail" />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2.5 h-2.5 rounded border flex items-center justify-center p-0.5 shrink-0 ${selectedFood.isVeg ? 'border-emerald-600' : 'border-rose-600'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${selectedFood.isVeg ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    </span>
                    <h3 className="text-sm font-serif font-bold text-white">{selectedFood.name}</h3>
                  </div>
                  <p className="text-[10px] text-gray-400 line-clamp-3 leading-snug">{selectedFood.description}</p>
                </div>
              </div>

              {/* Variant Selector */}
              {selectedFood.variants && selectedFood.variants.map(variant => (
                <div key={variant.name} className="space-y-1.5 border-t border-gray-800/60 pt-3">
                  <span className="text-[9px] font-bold text-amber-500 uppercase tracking-widest">{variant.name} Customization</span>
                  <div className="grid grid-cols-2 gap-2">
                    {variant.options.map(opt => (
                      <button
                        key={opt.name}
                        onClick={() => setSelectedVariant({ variantName: variant.name, optionName: opt.name, priceAdjustment: opt.priceAdjustment })}
                        className={`p-2.5 rounded-xl border text-center transition-all ${selectedVariant?.optionName === opt.name ? 'border-amber-500 bg-amber-500/10 text-white font-bold' : 'border-gray-800 bg-gray-950 text-gray-400'}`}
                      >
                        <p className="text-[10px]">{opt.name}</p>
                        <p className="text-[8px] text-amber-500 mt-0.5">{opt.priceAdjustment > 0 ? `+₹${opt.priceAdjustment}` : "Included"}</p>
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {/* Gourmet Add-Ons Selector */}
              {selectedFood.addOns && (
                <div className="space-y-1.5 border-t border-gray-800/60 pt-3">
                  <span className="text-[9px] font-bold text-amber-500 uppercase tracking-widest">Select Gourmet Add-ons</span>
                  <div className="space-y-2">
                    {selectedFood.addOns.map(ao => (
                      <button
                        key={ao.name}
                        onClick={() => setSelectedAddOns(prev => ({ ...prev, [ao.name]: !prev[ao.name] }))}
                        className={`w-full p-2.5 rounded-xl border flex justify-between items-center transition-all ${selectedAddOns[ao.name] ? 'border-amber-500 bg-amber-500/5 text-white' : 'border-gray-800 bg-gray-950 text-gray-400'}`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded border flex items-center justify-center ${selectedAddOns[ao.name] ? 'bg-amber-500 border-amber-500 text-black' : 'border-gray-700'}`}>
                            {selectedAddOns[ao.name] && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <span className="text-[10px] font-medium">{ao.name}</span>
                        </div>
                        <span className="text-[9px] text-amber-500 font-bold">+₹{ao.price}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity and Checkout CTA */}
              <div className="pt-4 border-t border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-2 bg-gray-900 border border-gray-800 rounded-lg p-1.5">
                  <button onClick={() => setDetailQuantity(Math.max(1, detailQuantity - 1))} className="p-1 hover:bg-gray-800 rounded">
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-xs font-bold text-white w-6 text-center">{detailQuantity}</span>
                  <button onClick={() => setDetailQuantity(detailQuantity + 1)} className="p-1 hover:bg-gray-800 rounded">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button 
                  onClick={handleAddToCart}
                  className="flex-1 ml-4 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-600 text-[#0A0D14] font-bold text-xs rounded-xl shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                >
                  <ShoppingBag className="w-3.5 h-3.5" /> Add to Basket (₹
                  {((selectedFood.discountPrice || selectedFood.price) + 
                    (selectedVariant?.priceAdjustment || 0) + 
                    (selectedFood.addOns ? selectedFood.addOns.filter(ao => selectedAddOns[ao.name]).reduce((s, ao) => s + ao.price, 0) : 0)) * detailQuantity}
                  )
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PREMIUM PDF INVOICE DRAWER MODAL */}
      <AnimatePresence>
        {showInvoiceId && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[150] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowInvoiceId(null)}
          >
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="w-full max-w-sm bg-white text-gray-900 p-5 rounded-2xl shadow-2xl space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Receipt Design */}
              <div className="text-center border-b border-dashed border-gray-300 pb-3 space-y-1">
                <span className="text-xs font-serif font-black uppercase tracking-wider">{settings.name}</span>
                <p className="text-[9px] text-gray-500">Luxury District, NY • {settings.phone}</p>
                <p className="text-[8px] text-gray-400">Order ID: #{showInvoiceId.substring(4)}</p>
              </div>

              {/* Items in Invoice */}
              <div className="space-y-2 text-[10px]">
                {orders.find(o => o.id === showInvoiceId)?.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>{it.name} x{it.quantity}</span>
                    <span>₹{it.price * it.quantity}</span>
                  </div>
                ))}
              </div>

              {/* Cost Summary */}
              <div className="border-t border-dashed border-gray-300 pt-2.5 space-y-1.5 text-[9px] text-gray-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{orders.find(o => o.id === showInvoiceId)?.total}</span>
                </div>
                <div className="flex justify-between text-gray-900 font-bold text-[10px]">
                  <span>Total Paid (Digital Escrow)</span>
                  <span>₹{orders.find(o => o.id === showInvoiceId)?.total}</span>
                </div>
              </div>

              <div className="text-center text-[8px] text-gray-400 italic">
                Thank you for patronizing culinary mastership.
              </div>

              <button 
                onClick={() => setShowInvoiceId(null)}
                className="w-full py-2 bg-gray-900 text-white rounded-lg text-[10px] font-bold hover:bg-gray-800 transition-colors"
              >
                Close Receipt
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FIREBASE EMAIL AUTHENTICATION MODAL */}
      <AnimatePresence>
        {isAuthModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[200] bg-black/75 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setIsAuthModalOpen(false)}
          >
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="w-full max-w-sm bg-[#0E1322] border border-gray-800 p-5 rounded-2xl shadow-2xl space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <h3 className="text-sm font-serif font-bold text-white tracking-wide">
                  {authMode === 'login' ? 'Patron Authorization' : authMode === 'signup' ? 'Create Luxury Profile' : 'Recover Credential'}
                </h3>
                <p className="text-[10px] text-gray-400 mt-1">Unlock seamless order synchronization, reservations & historic logs.</p>
              </div>

              {authError && (
                <div className="p-2 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-center gap-2 text-[9px] text-rose-400">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span className="line-clamp-2">{authError}</span>
                </div>
              )}

              <form onSubmit={handleEmailAuth} className="space-y-3">
                {authMode === 'signup' && (
                  <div className="space-y-1">
                    <label className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">Full Name</label>
                    <input 
                      type="text" 
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Alexander Mercer"
                      className="w-full p-2.5 bg-gray-900 border border-gray-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500/30"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">Email Coordinates</label>
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. patron@subhurestro.com"
                    className="w-full p-2.5 bg-gray-900 border border-gray-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500/30"
                  />
                </div>

                {authMode !== 'forgot' && (
                  <div className="space-y-1">
                    <label className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">Passphrase</label>
                    <input 
                      type="password" 
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter minimum 6 characters"
                      className="w-full p-2.5 bg-gray-900 border border-gray-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500/30"
                    />
                  </div>
                )}

                {authMode === 'signup' && (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">Phone</label>
                      <input 
                        type="tel" 
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="8822344281..."
                        className="w-full p-2 bg-gray-900 border border-gray-800 rounded-lg text-[10px] text-white focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">Address</label>
                      <input 
                        type="text" 
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Suite, Block..."
                        className="w-full p-2 bg-gray-900 border border-gray-800 rounded-lg text-[10px] text-white focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={authLoading}
                  className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-yellow-600 text-[#0A0D14] font-bold text-xs rounded-lg shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                >
                  {authLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <span>{authMode === 'login' ? 'Authorize Access' : authMode === 'signup' ? 'Create Luxury Profile' : 'Send Recovery'}</span>
                  )}
                </button>
              </form>

              {/* Google popup login auth */}
              {authMode === 'login' && (
                <div className="space-y-3 pt-2">
                  <div className="relative flex py-1 items-center">
                    <div className="flex-grow border-t border-gray-800"></div>
                    <span className="flex-shrink mx-3 text-[8px] text-gray-500 uppercase font-bold tracking-wider">Or secure OAuth</span>
                    <div className="flex-grow border-t border-gray-800"></div>
                  </div>

                  <button 
                    onClick={handleGoogleLogin}
                    type="button"
                    className="w-full py-2 bg-gray-900 border border-gray-800 hover:border-gray-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 hover:bg-gray-800 transition-all active:scale-[0.98]"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span>Connect via Google Auth</span>
                  </button>
                </div>
              )}

              {/* Toggles */}
              <div className="flex justify-between text-[10px] text-gray-400 border-t border-gray-800/60 pt-3">
                {authMode === 'login' ? (
                  <>
                    <button onClick={() => setAuthMode('signup')} className="hover:text-amber-500">Sign Up</button>
                    <button onClick={() => setAuthMode('forgot')} className="hover:text-amber-500">Forgot Code?</button>
                  </>
                ) : (
                  <button onClick={() => setAuthMode('login')} className="hover:text-amber-500 text-center w-full">Already have a luxury profile? Sign In</button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SECURE UPI SCANNER MODAL */}
      <AnimatePresence>
        {isUpiModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[250] bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="w-full max-w-sm bg-[#0E1322] border border-gray-800 p-5 rounded-2xl shadow-2xl text-center space-y-4"
            >
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 mb-2">
                  <Sparkles className="w-5 h-5 animate-spin" style={{ animationDuration: '3s' }} />
                </div>
                <h3 className="text-sm font-serif font-bold text-white tracking-wide">UPI QR Payment Gateway</h3>
                <p className="text-[10px] text-gray-400 mt-1">Scan the secure dynamic QR code to transfer funds instantly.</p>
              </div>

              {/* QR Code Placeholder Graphic */}
              <div className="mx-auto w-44 h-44 bg-white p-3 rounded-xl border-4 border-amber-500/20 flex flex-col items-center justify-center relative overflow-hidden group">
                <div className="w-full h-full border border-gray-200 p-1 flex flex-col justify-between">
                  <div className="flex justify-between">
                    <div className="w-10 h-10 bg-black rounded" />
                    <div className="w-10 h-10 bg-black rounded" />
                  </div>
                  <div className="flex justify-center flex-1 items-center p-1 text-black font-mono font-black text-center text-[8px] tracking-tighter leading-none animate-pulse">
                    <div>
                      SUBHURESTRO<br/>
                      PAYMENT<br/>
                      ₹{cartTotal}
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <div className="w-10 h-10 bg-black rounded" />
                    <div className="w-2 h-2 bg-amber-500 rounded animate-ping" />
                    <div className="w-6 h-6 bg-black rounded-sm" />
                  </div>
                </div>
                
                {/* Scanner laser effect */}
                <div className="absolute top-0 inset-x-0 h-0.5 bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)] animate-bounce" style={{ animationDuration: '2s' }} />
              </div>

              <div className="bg-gray-900/60 border border-gray-800 rounded-lg p-2.5 space-y-1 text-center">
                <span className="text-[9px] text-gray-400 block uppercase tracking-wider font-bold">Payee Merchant UPI ID</span>
                <span className="text-xs font-mono font-bold text-amber-500 selection:bg-amber-500/20">{settings.upiId || "subhurestro@upi"}</span>
                <span className="text-[9px] text-gray-500 block">Total Amount Due: ₹{cartTotal}</span>
              </div>

              <div className="grid grid-cols-2 gap-3.5 pt-1">
                <button 
                  type="button"
                  onClick={() => setIsUpiModalOpen(false)}
                  className="py-2 bg-gray-900 border border-gray-800 text-gray-400 text-[10px] font-bold rounded-lg transition-all active:scale-95"
                >
                  Cancel Order
                </button>
                <button 
                  type="button"
                  onClick={async () => {
                    setIsUpiModalOpen(false);
                    onLogEvent("UPI authorization successful. Submitting gourmet ticket...", "success");
                    await handlePlaceOrder();
                  }}
                  className="py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-[#0A0D14] text-[10px] font-black rounded-lg transition-all active:scale-95 shadow-lg shadow-amber-500/10"
                >
                  I Have Paid & Confirm
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SECURE RAZORPAY GATEWAY MODAL */}
      <AnimatePresence>
        {isRazorpayModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[250] bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="w-full max-w-sm bg-white text-gray-900 rounded-2xl overflow-hidden shadow-2xl border border-gray-200"
            >
              {/* Razorpay Brand Header */}
              <div className="bg-[#1C2541] p-4 text-white flex justify-between items-center">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center font-bold text-[10px]">R</div>
                  <div className="text-left">
                    <h4 className="text-[11px] font-black tracking-tight leading-none">Razorpay</h4>
                    <p className="text-[7.5px] text-blue-200/80 mt-0.5 font-bold uppercase tracking-wider font-sans">Secured Sandbox checkout</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[7.5px] text-gray-400 block uppercase font-bold">Payable Total</span>
                  <span className="text-sm font-black text-white font-sans">₹{cartTotal}</span>
                </div>
              </div>

              {/* Merchant Details */}
              <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100 flex justify-between items-center text-[10px] text-left">
                <span className="text-gray-500 font-medium font-sans">Merchant: <strong>{settings.name}</strong></span>
                <span className="text-[8px] bg-blue-50 border border-blue-100 text-blue-600 px-1.5 py-0.5 rounded font-black font-sans">TEST MODE</span>
              </div>

              {/* Simulation Options */}
              <div className="p-4 space-y-4">
                <div className="space-y-1 text-left">
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block font-sans">Simulator Authorization Control</span>
                  <p className="text-[10px] text-gray-600 font-sans">Select simulated payment outcome for the sandbox environment:</p>
                </div>

                <div className="space-y-2">
                  <button 
                    type="button"
                    onClick={async () => {
                      setIsRazorpayModalOpen(false);
                      onLogEvent("Razorpay authorization verified. Transmitting order blueprint...", "success");
                      await handlePlaceOrder();
                    }}
                    className="w-full p-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-left flex justify-between items-center group transition-all active:scale-[0.98]"
                  >
                    <div>
                      <span className="text-[10.5px] font-bold text-emerald-800 block font-sans">Simulate Success (Visa/Mastercard)</span>
                      <span className="text-[8.5px] text-emerald-600 font-sans">Instantly authorize credit line & place ticket</span>
                    </div>
                    <Check className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform shrink-0" />
                  </button>

                  <button 
                    type="button"
                    onClick={() => {
                      setIsRazorpayModalOpen(false);
                      onLogEvent("Razorpay payment transaction canceled or failed.", "error");
                    }}
                    className="w-full p-3 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl text-left flex justify-between items-center group transition-all active:scale-[0.98]"
                  >
                    <div>
                      <span className="text-[10.5px] font-bold text-rose-800 block font-sans">Simulate Decline / Reject</span>
                      <span className="text-[8.5px] text-rose-600 font-sans">Decline card verification with raw 502 status</span>
                    </div>
                    <X className="w-4 h-4 text-rose-600 group-hover:scale-110 transition-transform shrink-0" />
                  </button>
                </div>
              </div>

              {/* Secure Footer bar */}
              <div className="bg-gray-50 px-4 py-2.5 border-t border-gray-100 flex items-center justify-between text-[8px] text-gray-400">
                <span className="font-sans">🔒 256-bit AES Bank-Grade Encryption</span>
                <span className="font-bold font-sans">razorpay.com</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FLOATING ACTION UTILITY OVERLAYS */}
      <div className="absolute bottom-16 right-3.5 flex flex-col gap-2 z-[90]">
        <a 
          href={`https://wa.me/${settings.whatsapp.replace('+', '')}`} 
          target="_blank" 
          rel="noreferrer"
          className="p-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full shadow-lg transition-transform hover:scale-110 active:scale-95 flex items-center justify-center border border-emerald-400/20"
          title="WhatsApp Concierge Chat"
        >
          <MessageSquare className="w-4 h-4 fill-white/10" />
        </a>
        <a 
          href={`tel:${settings.phone}`}
          className="p-2.5 bg-amber-500 hover:bg-amber-400 text-black rounded-full shadow-lg transition-transform hover:scale-110 active:scale-95 flex items-center justify-center border border-amber-400/20"
          title="Direct Phone Call Line"
        >
          <Phone className="w-4 h-4 fill-black/10" />
        </a>
      </div>

      {/* CUSTOMER TAB NAVIGATION FOOTER */}
      <nav className="absolute bottom-0 left-0 right-0 h-14 bg-[#0E131F]/95 border-t border-gray-800/50 backdrop-blur-md flex items-center justify-around z-40 px-2 select-none shrink-0">
        {[
          { key: 'home', icon: Compass, label: 'Explore' },
          { key: 'search', icon: Search, label: 'Search' },
          { key: 'reservations', icon: Calendar, label: 'Book' },
          { key: 'cart', icon: ShoppingBag, label: 'Basket', badge: cart.length },
          { key: 'profile', icon: User, label: 'Vault' }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = currentScreen === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => {
                setIsCheckoutMode(false);
                setCurrentScreen(tab.key as any);
              }}
              className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all relative ${isActive ? 'text-amber-500' : 'text-gray-500 hover:text-gray-300'}`}
            >
              <Icon className="w-4 h-4 stroke-[2]" />
              <span className="text-[8px] font-bold mt-1 tracking-wider leading-none">{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="absolute top-1 right-2.5 px-1 py-0.5 bg-amber-500 text-[#0A0D14] text-[7px] font-black rounded-full leading-none flex items-center justify-center">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

    </div>
  );
}
