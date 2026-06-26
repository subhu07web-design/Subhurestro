import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, ShoppingBag, Calendar, Users, DollarSign, 
  Settings, Award, Plus, Trash2, Edit2, Check, X, Phone, 
  MessageSquare, RefreshCw, Layers, Bell, CheckCircle, Gift,
  Eye, FileText, ToggleLeft, ToggleRight, Percent, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  db, 
  getFoodsFromDB, 
  getCouponsFromDB, 
  addOrUpdateFoodInDB, 
  deleteFoodFromDB, 
  getSettingsFromDB, 
  updateSettingsInDB,
  subscribeToOrders,
  subscribeToReservations,
  updateOrderStatusInDB,
  updateReservationStatusInDB,
  addCouponInDB,
  deleteCouponFromDB
} from '../lib/firebase';
import { FoodItem, Order, Reservation, RestaurantSettings, Coupon } from '../types';

interface AdminPanelProps {
  settings: RestaurantSettings;
  onSettingsUpdated: (newSettings: RestaurantSettings) => void;
  onLogEvent: (msg: string, type: 'info' | 'success' | 'warning' | 'error') => void;
}

export default function AdminPanel({ settings, onSettingsUpdated, onLogEvent }: AdminPanelProps) {
  // Panel Screen Selection
  const [activeTab, setActiveTab] = useState<'orders' | 'reservations' | 'menu' | 'offers' | 'customers' | 'settings'>('orders');

  // Real-time Firestore States
  const [orders, setOrders] = useState<Order[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);

  // Sound and alerting triggers
  const [newOrderAlert, setNewOrderAlert] = useState<string | null>(null);

  // Edit / Create States for Food Management
  const [editingFood, setEditingFood] = useState<FoodItem | null>(null);
  const [isAddFoodModalOpen, setIsAddFoodModalOpen] = useState(false);
  
  // Food Form Fields
  const [foodId, setFoodId] = useState('');
  const [foodName, setFoodName] = useState('');
  const [foodDesc, setFoodDesc] = useState('');
  const [foodPrice, setFoodPrice] = useState(250);
  const [foodDiscount, setFoodDiscount] = useState<number | undefined>(undefined);
  const [foodCategory, setFoodCategory] = useState('Fresh Pasta');
  const [foodVeg, setFoodVeg] = useState(true);
  const [foodBestseller, setFoodBestseller] = useState(false);
  const [foodImg, setFoodImg] = useState('');

  // Coupon Form Fields
  const [couponCode, setCouponCode] = useState('');
  const [couponPercent, setCouponPercent] = useState<number | undefined>(undefined);
  const [couponFlat, setCouponFlat] = useState<number | undefined>(undefined);
  const [couponLabel, setCouponLabel] = useState('');
  const [couponMinOrder, setCouponMinOrder] = useState<number | undefined>(undefined);

  // Business settings form
  const [settsName, setSettsName] = useState(settings.name);
  const [settsTag, setSettsTag] = useState(settings.tagline);
  const [settsDesc, setSettsDesc] = useState(settings.description);
  const [settsAddress, setSettsAddress] = useState(settings.address);
  const [settsPhone, setSettsPhone] = useState(settings.phone);
  const [settsWhatsapp, setSettsWhatsapp] = useState(settings.whatsapp);
  const [settsEmail, setSettsEmail] = useState(settings.email);
  const [settsOpen, setSettsOpen] = useState(settings.openingHours);
  const [settsClose, setSettsClose] = useState(settings.closingHours);
  const [settsDelFee, setSettsDelFee] = useState(settings.deliveryCharges);
  const [settsGst, setSettsGst] = useState(settings.gstPercent);
  const [settsUpi, setSettsUpi] = useState(settings.upiId);
  const [settsPin, setSettsPin] = useState(settings.adminPIN || "7809");

  // Load baseline values from Firebase
  useEffect(() => {
    async function loadAdminCatalog() {
      try {
        const [foodsList, couponsList] = await Promise.all([
          getFoodsFromDB(),
          getCouponsFromDB()
        ]);
        setFoods(foodsList);
        setCoupons(couponsList);
      } catch (err) {
        console.error(err);
      }
    }
    loadAdminCatalog();

    // Listen to ORDERS in real-time
    const unsubscribeOrders = subscribeToOrders(null, true, (newOrders) => {
      // Audio chime and alert logic on a new order arrival
      setOrders((prevOrders) => {
        if (prevOrders.length > 0 && newOrders.length > prevOrders.length) {
          const addedOrder = newOrders[0];
          setNewOrderAlert(`New Order Received! #${addedOrder.id.substring(4)} from ${addedOrder.userName} for ₹${addedOrder.total}`);
          onLogEvent(`Incoming Order Alert! #${addedOrder.id.substring(4)} placed. Synced automatically.`, "success");
          
          // Attempt an elegant in-browser chime sound trigger
          try {
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5 chime
            osc.frequency.setValueAtTime(880.00, audioCtx.currentTime + 0.15); // A5 chime
            gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.4);
          } catch (soundErr) {
            // Fallback if browser blocks autoplay audio context
          }
        }
        return newOrders;
      });
    });

    // Listen to TABLE RESERVATIONS in real-time
    const unsubscribeReservations = subscribeToReservations((newRes) => {
      setReservations(newRes);
    });

    return () => {
      unsubscribeOrders();
      unsubscribeReservations();
    };
  }, []);

  // Dashboard Stats
  const stats = useMemo(() => {
    const today = new Date().toDateString();
    const completedOrders = orders.filter(o => o.status === 'completed');
    const revenue = completedOrders.reduce((sum, o) => sum + o.total, 0);
    const pending = orders.filter(o => o.status === 'received' || o.status === 'preparing' || o.status === 'ready').length;

    return {
      revenue,
      totalOrders: orders.length,
      pendingCount: pending,
      reservationCount: reservations.filter(r => r.status === 'pending').length
    };
  }, [orders, reservations]);

  // Handle order state updates
  const handleUpdateOrderStatus = async (orderId: string, status: Order['status'], estimatedTime?: number) => {
    try {
      await updateOrderStatusInDB(orderId, status, estimatedTime);
      onLogEvent(`Updated order #${orderId.substring(4)} status to: ${status.toUpperCase()}`, "info");
    } catch (err) {
      onLogEvent("Failed to save order state change.", "error");
    }
  };

  // Handle reservation approval/rejection
  const handleUpdateResStatus = async (resId: string, status: 'approved' | 'rejected') => {
    try {
      await updateReservationStatusInDB(resId, status);
      onLogEvent(`Reservation request ${resId} mark as: ${status.toUpperCase()}`, "success");
    } catch (err) {
      onLogEvent("Reservation state change failed.", "error");
    }
  };

  // Create / Update Food item handler
  const handleSaveFood = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foodName || !foodPrice) return;

    const id = foodId || "food_" + (foods.length + 1) + "_" + Math.floor(Math.random() * 100);
    const resolvedImg = foodImg || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=400";

    const item: FoodItem = {
      id,
      name: foodName,
      description: foodDesc,
      price: foodPrice,
      discountPrice: foodDiscount || undefined,
      category: foodCategory,
      isVeg: foodVeg,
      isBestseller: foodBestseller,
      imageUrl: resolvedImg,
      isAvailable: true,
      rating: 4.8,
      prepTime: 15,
      createdAt: new Date().toISOString()
    };

    try {
      await addOrUpdateFoodInDB(item);
      onLogEvent(`Dish "${foodName}" saved successfully.`, "success");
      
      // Update local state list
      setFoods(prev => {
        const existingIdx = prev.findIndex(x => x.id === item.id);
        if (existingIdx > -1) {
          const updated = [...prev];
          updated[existingIdx] = item;
          return updated;
        }
        return [...prev, item];
      });

      // Clear fields
      setFoodId('');
      setFoodName('');
      setFoodDesc('');
      setFoodPrice(250);
      setFoodDiscount(undefined);
      setFoodImg('');
      setIsAddFoodModalOpen(false);
      setEditingFood(null);
    } catch (err) {
      onLogEvent("Failed to register food item in Firestore.", "error");
    }
  };

  // Delete Food item handler
  const handleDeleteFood = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete ${name}?`)) {
      try {
        await deleteFoodFromDB(id);
        setFoods(prev => prev.filter(x => x.id !== id));
        onLogEvent(`Deleted dish "${name}" from your catalog.`, "warning");
      } catch (err) {
        onLogEvent("Catalog item deletion failed.", "error");
      }
    }
  };

  // Edit action
  const handleStartEditFood = (food: FoodItem) => {
    setEditingFood(food);
    setFoodId(food.id);
    setFoodName(food.name);
    setFoodDesc(food.description);
    setFoodPrice(food.price);
    setFoodDiscount(food.discountPrice);
    setFoodCategory(food.category);
    setFoodVeg(food.isVeg);
    setFoodBestseller(food.isBestseller);
    setFoodImg(food.imageUrl);
    setIsAddFoodModalOpen(true);
  };

  // Add Coupon Trigger
  const handleAddCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode || (!couponPercent && !couponFlat)) {
      onLogEvent("Complete code and discount parameters.", "warning");
      return;
    }
    const code = couponCode.trim().toUpperCase();
    const item: Coupon = {
      code,
      discountPercent: couponPercent || undefined,
      flatDiscount: couponFlat || undefined,
      label: couponLabel || `Get off using code ${code}`,
      isActive: true,
      minOrderValue: couponMinOrder || undefined
    };

    try {
      await addCouponInDB(item);
      setCoupons(prev => [...prev.filter(x => x.code !== code), item]);
      setCouponCode('');
      setCouponPercent(undefined);
      setCouponFlat(undefined);
      setCouponLabel('');
      setCouponMinOrder(undefined);
      onLogEvent(`New premium Coupon code "${code}" deployed.`, "success");
    } catch (err) {
      onLogEvent("Coupon generation failed in Firestore.", "error");
    }
  };

  // Delete Coupon
  const handleDeleteCoupon = async (code: string) => {
    try {
      await deleteCouponFromDB(code);
      setCoupons(prev => prev.filter(x => x.code !== code));
      onLogEvent(`Coupon code "${code}" purged from checkout database.`, "warning");
    } catch (err) {
      onLogEvent("Coupon removal failed.", "error");
    }
  };

  // Save general settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const updated: RestaurantSettings = {
      name: settsName,
      tagline: settsTag,
      description: settsDesc,
      address: settsAddress,
      googleMapsLink: settings.googleMapsLink,
      phone: settsPhone,
      whatsapp: settsWhatsapp,
      email: settsEmail,
      openingHours: settsOpen,
      closingHours: settsClose,
      deliveryCharges: Number(settsDelFee),
      gstPercent: Number(settsGst),
      upiId: settsUpi,
      logoUrl: settings.logoUrl,
      adminPIN: settsPin
    };

    try {
      await updateSettingsInDB(updated);
      onSettingsUpdated(updated);
      onLogEvent("Restaurant administrative settings updated and synced.", "success");
    } catch (err) {
      onLogEvent("Settings propagation failed.", "error");
    }
  };

  // Customers Directory summary derived from orders list
  const customerDirectory = useMemo(() => {
    const clients: { [email: string]: { name: string, phone: string, count: number, spend: number, lastOrder: string } } = {};
    orders.forEach(o => {
      const email = o.userEmail || o.userId;
      if (!clients[email]) {
        clients[email] = {
          name: o.userName,
          phone: o.userPhone,
          count: 0,
          spend: 0,
          lastOrder: o.createdAt
        };
      }
      clients[email].count += 1;
      clients[email].spend += o.total;
    });

    return Object.entries(clients).map(([email, info]) => ({
      email,
      ...info
    })).sort((a,b) => b.spend - a.spend); // Sort by highest spenders
  }, [orders]);

  return (
    <div className="flex flex-col md:flex-row h-full bg-[#080B11] text-gray-300 font-sans select-none overflow-hidden">
      
      {/* Real-time Order Popup Banner */}
      <AnimatePresence>
        {newOrderAlert && (
          <motion.div 
            initial={{ scale: 0.9, y: 50, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 50, opacity: 0 }}
            className="absolute bottom-6 right-6 z-[9999] bg-[#0E1528] p-4 rounded-xl shadow-2xl border border-amber-500 max-w-sm flex gap-3 text-left"
          >
            <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg shrink-0 self-start">
              <Bell className="w-5 h-5 animate-bounce" />
            </div>
            <div className="flex-1">
              <h4 className="text-xs font-serif font-black text-amber-500 uppercase tracking-widest">🛎️ New Order Received</h4>
              <p className="text-[11px] text-white mt-1 leading-normal">{newOrderAlert}</p>
              <div className="mt-3 flex gap-2">
                <button 
                  onClick={() => { setNewOrderAlert(null); setActiveTab('orders'); }}
                  className="px-3 py-1 bg-amber-500 text-black font-bold text-[9px] rounded-md"
                >
                  Manage Live Order
                </button>
                <button 
                  onClick={() => setNewOrderAlert(null)}
                  className="px-2.5 py-1 bg-gray-800 text-gray-400 font-medium text-[9px] rounded-md"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DASHBOARD LEFTSIDE BAR */}
      <aside className="w-full md:w-52 border-b md:border-b-0 md:border-r border-gray-800 bg-[#0A0D14]/95 flex flex-col md:flex-col justify-between shrink-0 select-none">
        <div className="flex flex-row md:flex-col items-center md:items-stretch justify-between md:justify-start w-full overflow-x-auto md:overflow-x-visible custom-scrollbar">
          <div className="p-3 md:p-4 border-r md:border-r-0 md:border-b border-gray-800 flex items-center gap-2 shrink-0">
            <div className="w-6 h-6 md:w-7 md:h-7 bg-amber-500 text-black font-serif font-bold rounded-md flex items-center justify-center text-xs md:text-sm shadow">Ω</div>
            <div>
              <h2 className="text-[10px] md:text-xs font-serif font-black text-white leading-none">POS Control</h2>
              <p className="text-[7px] md:text-[8px] text-gray-500 mt-0.5 tracking-wider uppercase font-bold">Subhu Restro</p>
            </div>
          </div>

          <nav className="p-1.5 md:p-2.5 flex flex-row md:flex-col gap-1 md:space-y-1 overflow-x-auto md:overflow-x-visible shrink-0 flex-1">
            {[
              { key: 'orders', icon: ShoppingBag, label: 'Live Orders', count: stats.pendingCount },
              { key: 'reservations', icon: Calendar, label: 'Reservations', count: stats.reservationCount },
              { key: 'menu', icon: Layers, label: 'Menu Catalog' },
              { key: 'offers', icon: Percent, label: 'Offers & Coupons' },
              { key: 'customers', icon: Users, label: 'Patrons List' },
              { key: 'settings', icon: Settings, label: 'Bistro Settings' }
            ].map(item => {
              const Icon = item.icon;
              const isSel = activeTab === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => setActiveTab(item.key as any)}
                  className={`p-1.5 md:p-2 rounded-lg text-[9.5px] md:text-[10.5px] font-bold flex items-center justify-between gap-2 transition-all shrink-0 ${isSel ? 'bg-amber-500/10 text-amber-500 border-b-2 md:border-b-0 md:border-l-2 border-amber-500' : 'text-gray-400 hover:text-gray-200'}`}
                >
                  <div className="flex items-center gap-1.5 md:gap-2">
                    <Icon className="w-3.5 h-3.5" />
                    <span className="whitespace-nowrap">{item.label}</span>
                  </div>
                  {item.count !== undefined && item.count > 0 && (
                    <span className="px-1 md:px-1.5 py-0.5 rounded-full bg-amber-500 text-[#0A0D14] text-[7.5px] md:text-[8px] font-black leading-none">{item.count}</span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="hidden md:block p-3 border-t border-gray-800 bg-black/10 text-center">
          <p className="text-[9px] text-gray-600 font-bold uppercase tracking-wider">Secure Cloud POS</p>
          <p className="text-[8px] text-emerald-500 mt-0.5">● Connected Live</p>
        </div>
      </aside>

      {/* ADMIN CENTER PRIMARY SPACE */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        
        {/* HEADER */}
        <header className="px-5 py-3 border-b border-gray-800 bg-[#0A0D14] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 shrink-0">
          <div>
            <h1 className="text-xs sm:text-sm font-serif font-bold text-white tracking-wide capitalize">Bistro Administration: {activeTab} Panel</h1>
            <p className="text-[8px] sm:text-[9px] text-gray-500 mt-0.5">Real-time data synced automatically with Firebase cloud</p>
          </div>

          <div className="flex gap-4 select-none w-full sm:w-auto justify-between sm:justify-end border-t border-gray-800/60 pt-2 sm:pt-0 sm:border-t-0">
            <div className="flex items-center gap-2 border-r border-gray-800 pr-4">
              <DollarSign className="w-4 h-4 text-amber-500 shrink-0" />
              <div>
                <span className="text-[8px] text-gray-500 uppercase font-bold block">Gross Revenue</span>
                <span className="text-xs font-serif font-black text-amber-500">₹{stats.revenue}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-emerald-500 shrink-0" />
              <div>
                <span className="text-[8px] text-gray-500 uppercase font-bold block">Total Tickets</span>
                <span className="text-xs font-serif font-black text-emerald-500">{stats.totalOrders}</span>
              </div>
            </div>
          </div>
        </header>

        {/* WORKSPACE */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar bg-[#06090F]">

          {/* TAB: LIVE ORDERS */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-serif font-bold text-white tracking-widest uppercase">Live Incoming Tickets</h3>
                <div className="text-[9px] text-gray-500">Sorted by Newest First</div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {orders.map(order => (
                  <div 
                    key={order.id} 
                    className="p-4 bg-[#0E1322] border border-gray-800 rounded-xl space-y-3 relative flex flex-col justify-between"
                  >
                    <div>
                      {/* Ticket Header */}
                      <div className="flex justify-between items-start border-b border-gray-800/60 pb-2.5">
                        <div>
                          <span className="text-[9px] font-bold text-amber-500">#{order.id.substring(4)}</span>
                          <h4 className="text-xs font-bold text-white mt-0.5">{order.userName}</h4>
                          <span className="text-[8px] text-gray-500">{new Date(order.createdAt).toLocaleTimeString()} • {order.paymentMethod.toUpperCase()}</span>
                        </div>

                        <div className="flex flex-col items-end gap-1">
                          <span className="text-xs font-serif font-black text-white">₹{order.total}</span>
                          <span className={`text-[8px] px-2 py-0.5 font-black uppercase rounded ${
                            order.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10' :
                            order.status === 'cancelled' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/10' :
                            'bg-amber-500/10 text-amber-500 border border-amber-500/10'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                      </div>

                      {/* Items List */}
                      <div className="py-3 space-y-1.5 border-b border-gray-800/40">
                        {order.items.map((it, idx) => (
                          <div key={idx} className="flex justify-between text-[10px] text-gray-300">
                            <span>{it.name} <span className="text-gray-500">x{it.quantity}</span></span>
                            <span>₹{it.price * it.quantity}</span>
                          </div>
                        ))}
                      </div>

                      {/* Address & Instructions */}
                      <div className="pt-2.5 text-[10px] space-y-1">
                        <p className="text-gray-400 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span className="break-all">Delivery: {order.address}</span>
                        </p>
                        {order.specialInstructions && (
                          <p className="text-amber-500 bg-amber-500/5 px-2 py-1 rounded border border-amber-500/10 italic text-[9px] break-all">
                            "Note: {order.specialInstructions}"
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Dispatch Controllers */}
                    <div className="pt-3 border-t border-gray-800/60 flex flex-wrap gap-1.5 mt-3.5">
                      {order.status === 'received' && (
                        <>
                          <button 
                            onClick={() => handleUpdateOrderStatus(order.id, 'preparing', 25)}
                            className="px-3 py-1 bg-amber-500 text-black text-[9px] font-black rounded-lg hover:bg-amber-400"
                          >
                            Accept & Prep
                          </button>
                          <button 
                            onClick={() => handleUpdateOrderStatus(order.id, 'cancelled')}
                            className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 rounded-lg text-[9px] font-bold"
                          >
                            Reject
                          </button>
                        </>
                      )}

                      {order.status === 'preparing' && (
                        <button 
                          onClick={() => handleUpdateOrderStatus(order.id, 'ready', 5)}
                          className="px-3 py-1 bg-emerald-600 text-white text-[9px] font-black rounded-lg hover:bg-emerald-500"
                        >
                          Mark Ready to Dispatch
                        </button>
                      )}

                      {order.status === 'ready' && (
                        <button 
                          onClick={() => handleUpdateOrderStatus(order.id, 'completed')}
                          className="px-3 py-1 bg-blue-600 text-white text-[9px] font-black rounded-lg hover:bg-blue-500"
                        >
                          Confirm Delivery Completed
                        </button>
                      )}

                      {(order.status === 'completed' || order.status === 'cancelled') && (
                        <div className="text-[9px] text-gray-500 flex items-center gap-1 py-1">
                          <CheckCircle className="w-3.5 h-3.5 text-gray-600" /> Ticket archived securely
                        </div>
                      )}
                    </div>

                  </div>
                ))}

                {orders.length === 0 && (
                  <div className="col-span-1 sm:col-span-2 py-20 text-center space-y-2">
                    <p className="text-xs text-gray-500">No client orders registered inside Firestore yet.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: RESERVATIONS */}
          {activeTab === 'reservations' && (
            <div className="space-y-4">
              <h3 className="text-xs font-serif font-bold text-white tracking-widest uppercase">Table Bookings & VIP Requests</h3>

              <div className="bg-[#0E1322] border border-gray-800 rounded-xl overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse text-xs min-w-[600px]">
                  <thead>
                    <tr className="border-b border-gray-800 text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                      <th className="p-3">Reservation Code</th>
                      <th className="p-3">Guest Profile</th>
                      <th className="p-3">Reservation Slot</th>
                      <th className="p-3">Covers</th>
                      <th className="p-3">Special Instructions</th>
                      <th className="p-3 text-right">Action Gate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/40">
                    {reservations.map(res => (
                      <tr key={res.id} className="hover:bg-gray-900/40">
                        <td className="p-3 font-mono font-bold text-amber-500">#{res.id.substring(4)}</td>
                        <td className="p-3">
                          <p className="font-bold text-white">{res.name}</p>
                          <p className="text-[9px] text-gray-500">{res.phone}</p>
                        </td>
                        <td className="p-3">
                          <p className="font-medium text-white">{res.date}</p>
                          <p className="text-[9px] text-amber-500 font-bold">{res.time}</p>
                        </td>
                        <td className="p-3 font-bold text-white">{res.guests} Patrons</td>
                        <td className="p-3 text-gray-400 max-w-xs truncate italic">{res.specialRequest || "No preference."}</td>
                        <td className="p-3 text-right">
                          {res.status === 'pending' ? (
                            <div className="flex gap-1 justify-end">
                              <button 
                                onClick={() => handleUpdateResStatus(res.id, 'approved')}
                                className="p-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20"
                                title="Approve Reservation"
                              >
                                <Check className="w-3.5 h-3.5 stroke-[3.5]" />
                              </button>
                              <button 
                                onClick={() => handleUpdateResStatus(res.id, 'rejected')}
                                className="p-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20"
                                title="Reject Spot"
                              >
                                <X className="w-3.5 h-3.5 stroke-[3.5]" />
                              </button>
                            </div>
                          ) : (
                            <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${res.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                              {res.status}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}

                    {reservations.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-10 text-center text-gray-500">No bookings requested yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: MENU CATALOG */}
          {activeTab === 'menu' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-serif font-bold text-white tracking-widest uppercase font-black">Food Inventory catalog</h3>
                <button 
                  onClick={() => {
                    setEditingFood(null);
                    setFoodId('');
                    setFoodName('');
                    setFoodDesc('');
                    setFoodPrice(250);
                    setFoodDiscount(undefined);
                    setFoodImg('');
                    setIsAddFoodModalOpen(true);
                  }}
                  className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-[#0A0D14] font-black text-[10px] rounded-lg shadow flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4 stroke-[3]" /> Register Gourmet Dish
                </button>
              </div>

              {/* Food Inventory Table */}
              <div className="bg-[#0E1322] border border-gray-800 rounded-xl overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse text-xs min-w-[600px]">
                  <thead>
                    <tr className="border-b border-gray-800 text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                      <th className="p-3">Dish Spec</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Base Price</th>
                      <th className="p-3">Veg/Non-Veg</th>
                      <th className="p-3">Chef Status</th>
                      <th className="p-3 text-right">Control Gate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/40">
                    {foods.map(food => (
                      <tr key={food.id} className="hover:bg-gray-900/40">
                        <td className="p-3 flex items-center gap-2.5">
                          <img src={food.imageUrl} className="w-8 h-8 rounded-md object-cover border border-gray-800" alt="dish" />
                          <div>
                            <p className="font-bold text-white">{food.name}</p>
                            <p className="text-[9px] text-gray-500 max-w-xs truncate">{food.description}</p>
                          </div>
                        </td>
                        <td className="p-3 text-gray-400">{food.category}</td>
                        <td className="p-3 font-bold text-white">
                          ₹{food.discountPrice || food.price}
                          {food.discountPrice && <span className="text-[9px] text-gray-500 line-through ml-1.5">₹{food.price}</span>}
                        </td>
                        <td className="p-3">
                          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${food.isVeg ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10' : 'bg-rose-500/10 text-rose-400 border border-rose-500/10'}`}>
                            {food.isVeg ? "VEG" : "NON-VEG"}
                          </span>
                        </td>
                        <td className="p-3">
                          {food.isBestseller && (
                            <span className="text-[8px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/10 font-bold uppercase">Bestseller</span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex gap-1 justify-end">
                            <button 
                              onClick={() => handleStartEditFood(food)}
                              className="p-1 rounded bg-gray-800 text-gray-400 hover:text-white"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => handleDeleteFood(food.id, food.name)}
                              className="p-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-500"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: OFFERS & COUPONS */}
          {activeTab === 'offers' && (
            <div className="space-y-4">
              <h3 className="text-xs font-serif font-bold text-white tracking-widest uppercase">Promotions and VIP Coupons</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Coupon Generator */}
                <form onSubmit={handleAddCoupon} className="p-4 bg-[#0E1322] border border-gray-800 rounded-xl space-y-3 text-xs col-span-1">
                  <span className="text-[9px] font-bold text-amber-500 uppercase tracking-wider block">Deploy New Coupon</span>
                  
                  <div className="space-y-1">
                    <label className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">Coupon Code</label>
                    <input 
                      type="text" 
                      required
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="e.g. MONSOON20"
                      className="w-full p-2.5 bg-gray-900 border border-gray-800 rounded-lg text-xs text-white uppercase focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">Discount %</label>
                      <input 
                        type="number" 
                        value={couponPercent || ''}
                        onChange={(e) => setCouponPercent(Number(e.target.value) || undefined)}
                        placeholder="e.g. 15"
                        className="w-full p-2 bg-gray-900 border border-gray-800 rounded-lg text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">Flat Discount (₹)</label>
                      <input 
                        type="number" 
                        value={couponFlat || ''}
                        onChange={(e) => setCouponFlat(Number(e.target.value) || undefined)}
                        placeholder="e.g. 100"
                        className="w-full p-2 bg-gray-900 border border-gray-800 rounded-lg text-xs text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">Promo Tagline</label>
                    <input 
                      type="text" 
                      required
                      value={couponLabel}
                      onChange={(e) => setCouponLabel(e.target.value)}
                      placeholder="e.g. Save ₹100 on weekend orders"
                      className="w-full p-2.5 bg-gray-900 border border-gray-800 rounded-lg text-xs text-white focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">Min Cart Value</label>
                    <input 
                      type="number" 
                      value={couponMinOrder || ''}
                      onChange={(e) => setCouponMinOrder(Number(e.target.value) || undefined)}
                      placeholder="e.g. 400"
                      className="w-full p-2.5 bg-gray-900 border border-gray-800 rounded-lg text-xs text-white focus:outline-none"
                    />
                  </div>

                  <button 
                    type="submit" 
                    className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg mt-2 transition-colors"
                  >
                    Deploy Coupon Code
                  </button>
                </form>

                {/* Coupons Inventory */}
                <div className="col-span-1 md:col-span-2 space-y-3">
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Active Promo Codes</span>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {coupons.map(coupon => (
                      <div key={coupon.code} className="p-3.5 bg-[#0E1322] border border-gray-800 rounded-xl relative overflow-hidden flex justify-between items-center">
                        <div>
                          <span className="text-xs font-mono font-bold text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded border border-amber-500/20">{coupon.code}</span>
                          <p className="text-[10px] text-white mt-2.5 font-bold leading-tight">{coupon.label}</p>
                          <p className="text-[9px] text-gray-500 mt-1">Min Order: ₹{coupon.minOrderValue || 0}</p>
                        </div>
                        <button 
                          onClick={() => handleDeleteCoupon(coupon.code)}
                          className="p-1.5 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: PATRONS LIST */}
          {activeTab === 'customers' && (
            <div className="space-y-4">
              <h3 className="text-xs font-serif font-bold text-white tracking-widest uppercase">Patrons Directory & Spend Stats</h3>

              <div className="bg-[#0E1322] border border-gray-800 rounded-xl overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse text-xs min-w-[500px]">
                  <thead>
                    <tr className="border-b border-gray-800 text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                      <th className="p-3">Client details</th>
                      <th className="p-3">Frequency</th>
                      <th className="p-3">Gross Spendings</th>
                      <th className="p-3">Last Ticket Placed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/40">
                    {customerDirectory.map((client, idx) => (
                      <tr key={idx} className="hover:bg-gray-900/40">
                        <td className="p-3">
                          <p className="font-bold text-white">{client.name}</p>
                          <p className="text-[9px] text-gray-500">{client.email} • {client.phone}</p>
                        </td>
                        <td className="p-3 text-gray-400 font-bold">{client.count} orders</td>
                        <td className="p-3 font-serif font-black text-amber-500">₹{client.spend}</td>
                        <td className="p-3 text-gray-500">{new Date(client.lastOrder).toLocaleDateString()}</td>
                      </tr>
                    ))}

                    {customerDirectory.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-10 text-center text-gray-500">No orders logged in this fiscal term.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: BISTRO SETTINGS */}
          {activeTab === 'settings' && (
            <form onSubmit={handleSaveSettings} className="p-5 bg-[#0E1322] border border-gray-800 rounded-xl space-y-4 text-xs">
              <div className="flex justify-between items-center border-b border-gray-800 pb-3">
                <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Global Administrative Configurations</span>
                <button 
                  type="submit"
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-black text-[10px] rounded-lg shadow"
                >
                  Propagate Configs
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Bistro Brand Name</label>
                  <input 
                    type="text" 
                    value={settsName}
                    onChange={(e) => setSettsName(e.target.value)}
                    className="w-full p-2.5 bg-gray-900 border border-gray-800 rounded-lg text-xs text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Premium Tagline</label>
                  <input 
                    type="text" 
                    value={settsTag}
                    onChange={(e) => setSettsTag(e.target.value)}
                    className="w-full p-2.5 bg-gray-900 border border-gray-800 rounded-lg text-xs text-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Epicurean Description</label>
                <textarea 
                  value={settsDesc}
                  onChange={(e) => setSettsDesc(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 bg-gray-900 border border-gray-800 rounded-lg text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Support Email</label>
                  <input 
                    type="email" 
                    value={settsEmail}
                    onChange={(e) => setSettsEmail(e.target.value)}
                    className="w-full p-2.5 bg-gray-900 border border-gray-800 rounded-lg text-xs text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Order Phone Line</label>
                  <input 
                    type="text" 
                    value={settsPhone}
                    onChange={(e) => setSettsPhone(e.target.value)}
                    className="w-full p-2.5 bg-gray-900 border border-gray-800 rounded-lg text-xs text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">WhatsApp Line</label>
                  <input 
                    type="text" 
                    value={settsWhatsapp}
                    onChange={(e) => setSettsWhatsapp(e.target.value)}
                    className="w-full p-2.5 bg-gray-900 border border-gray-800 rounded-lg text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Address coordinates</label>
                  <input 
                    type="text" 
                    value={settsAddress}
                    onChange={(e) => setSettsAddress(e.target.value)}
                    className="w-full p-2.5 bg-gray-900 border border-gray-800 rounded-lg text-xs text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Accepting UPI ID</label>
                  <input 
                    type="text" 
                    value={settsUpi}
                    onChange={(e) => setSettsUpi(e.target.value)}
                    className="w-full p-2.5 bg-gray-900 border border-gray-800 rounded-lg text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Opening Time</label>
                  <input 
                    type="text" 
                    value={settsOpen}
                    onChange={(e) => setSettsOpen(e.target.value)}
                    className="w-full p-2 bg-gray-900 border border-gray-800 rounded-lg text-xs text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Closing Time</label>
                  <input 
                    type="text" 
                    value={settsClose}
                    onChange={(e) => setSettsClose(e.target.value)}
                    className="w-full p-2 bg-gray-900 border border-gray-800 rounded-lg text-xs text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Standard Del. Fee (₹)</label>
                  <input 
                    type="number" 
                    value={settsDelFee}
                    onChange={(e) => setSettsDelFee(Number(e.target.value))}
                    className="w-full p-2 bg-gray-900 border border-gray-800 rounded-lg text-xs text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">GST Tax Rate (%)</label>
                  <input 
                    type="number" 
                    value={settsGst}
                    onChange={(e) => setSettsGst(Number(e.target.value))}
                    className="w-full p-2 bg-gray-900 border border-gray-800 rounded-lg text-xs text-white"
                  />
                </div>

                <div className="space-y-1 col-span-2 md:col-span-4">
                  <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Secret Owner PIN</label>
                  <input 
                    type="text" 
                    value={settsPin}
                    onChange={(e) => setSettsPin(e.target.value)}
                    maxLength={6}
                    placeholder="7809"
                    className="w-full p-2 bg-gray-900 border border-gray-800 rounded-lg text-xs font-bold text-amber-500 font-mono text-center focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </form>
          )}

        </div>

        {/* INVENTORY FOOD EDIT MODAL */}
        <AnimatePresence>
          {isAddFoodModalOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[100] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
              onClick={() => setIsAddFoodModalOpen(false)}
            >
              <motion.form 
                onSubmit={handleSaveFood}
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.95 }}
                className="w-full max-w-md bg-[#0E1322] border border-gray-800 p-5 rounded-2xl shadow-2xl space-y-3.5 text-xs text-left"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-center">
                  <h3 className="text-sm font-serif font-bold text-white">{editingFood ? 'Revise Food item detail' : 'Register New Gourmet Dish'}</h3>
                  <p className="text-[9px] text-gray-400 mt-1">Populates customer catalog inventory instantly</p>
                </div>

                <div className="space-y-1">
                  <label className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">Dish Name</label>
                  <input 
                    type="text" 
                    required
                    value={foodName}
                    onChange={(e) => setFoodName(e.target.value)}
                    placeholder="e.g. Saffron Tagliatelle"
                    className="w-full p-2.5 bg-gray-900 border border-gray-800 rounded-lg text-xs text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">Culinary Description</label>
                  <textarea 
                    required
                    value={foodDesc}
                    onChange={(e) => setFoodDesc(e.target.value)}
                    placeholder="Detail spices, cheeses, organic pairings..."
                    rows={2.5}
                    className="w-full p-2.5 bg-gray-900 border border-gray-800 rounded-lg text-xs text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">Base Price (₹)</label>
                    <input 
                      type="number" 
                      required
                      value={foodPrice}
                      onChange={(e) => setFoodPrice(Number(e.target.value))}
                      className="w-full p-2.5 bg-gray-900 border border-gray-800 rounded-lg text-xs text-white"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">Discount Price (₹, Optional)</label>
                    <input 
                      type="number" 
                      value={foodDiscount || ''}
                      onChange={(e) => setFoodDiscount(Number(e.target.value) || undefined)}
                      className="w-full p-2.5 bg-gray-900 border border-gray-800 rounded-lg text-xs text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">Category</label>
                    <select 
                      value={foodCategory}
                      onChange={(e) => setFoodCategory(e.target.value)}
                      className="w-full p-2.5 bg-gray-900 border border-gray-800 rounded-lg text-xs text-white"
                    >
                      <option value="Starters">Starters</option>
                      <option value="Artisanal Pizza">Artisanal Pizza</option>
                      <option value="Fresh Pasta">Fresh Pasta</option>
                      <option value="Gourmet Burgers">Gourmet Burgers</option>
                      <option value="Decadent Desserts">Decadent Desserts</option>
                      <option value="Craft Mocktails">Craft Mocktails</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">HD Image Link (Unsplash)</label>
                    <input 
                      type="text" 
                      value={foodImg}
                      onChange={(e) => setFoodImg(e.target.value)}
                      placeholder="https://images.unsplash..."
                      className="w-full p-2.5 bg-gray-900 border border-gray-800 rounded-lg text-xs text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1 border-t border-gray-800">
                  <button 
                    type="button"
                    onClick={() => setFoodVeg(!foodVeg)}
                    className={`p-2 rounded-lg border text-center font-bold ${foodVeg ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : 'border-gray-800 bg-gray-900 text-gray-400'}`}
                  >
                    Vegetarian Option
                  </button>
                  
                  <button 
                    type="button"
                    onClick={() => setFoodBestseller(!foodBestseller)}
                    className={`p-2 rounded-lg border text-center font-bold ${foodBestseller ? 'border-amber-500 bg-amber-500/10 text-amber-500' : 'border-gray-800 bg-gray-900 text-gray-400'}`}
                  >
                    Bestseller status
                  </button>
                </div>

                <div className="pt-2 flex gap-2">
                  <button 
                    type="submit" 
                    className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg text-center"
                  >
                    Propagate Catalog Item
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setIsAddFoodModalOpen(false)}
                    className="px-4 py-2 bg-gray-800 text-gray-400 font-bold rounded-lg text-center"
                  >
                    Cancel
                  </button>
                </div>

              </motion.form>
            </motion.div>
          )}
        </AnimatePresence>

      </main>

    </div>
  );
}
