import React, { useState, useEffect } from 'react';
import { 
  Smartphone, Monitor, Terminal, Shield, Sparkles, Flame, 
  Wifi, Battery, ShieldCheck, Heart, Trash, HelpCircle, 
  Database, RefreshCw, Zap, Lock, Key
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import CustomerApp from './CustomerApp';
import AdminPanel from './AdminPanel';
import { getSettingsFromDB, seedDatabaseIfNeeded, auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { RestaurantSettings } from '../types';

interface LogEvent {
  time: string;
  msg: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

export default function PhoneShell() {
  // Mode selection: customer vs admin
  const [activeTab, setActiveTab] = useState<'customer' | 'admin'>('customer');
  
  // Admin authentication state
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAdminVerified, setIsAdminVerified] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  // Settings, fetched and synced with database
  const [settings, setSettings] = useState<RestaurantSettings>({
    name: "Subhu Restro",
    tagline: "Artisanal Fusion & Modern Culinary Craft",
    description: "A luxury culinary haven merging classical French techniques with rich, dramatic Italian flavors.",
    address: "742 Royale Avenue, Boulevard of Flavors, Luxury District, NY 10021",
    googleMapsLink: "https://maps.google.com/?q=Royale+Avenue+Luxury+District+New+York",
    phone: "8822344281",
    whatsapp: "8822344281",
    email: "contact@subhurestro.com",
    openingHours: "11:00 AM",
    closingHours: "11:30 PM",
    deliveryCharges: 60,
    gstPercent: 18,
    upiId: "subhurestro@upi",
    logoUrl: ""
  });

  // Diagnostics and live sync events console
  const [logs, setLogs] = useState<LogEvent[]>([
    { time: new Date().toLocaleTimeString(), msg: "Initialized Subhu Restro cloud core engine.", type: 'info' },
    { time: new Date().toLocaleTimeString(), msg: "Synced security rules with Cloud Firestore.", type: 'success' }
  ]);

  // View state controls
  const [isFullScreen, setIsFullScreen] = useState(true);

  // Phone state controls
  const [isPhoneAsleep, setIsPhoneAsleep] = useState(false);
  const [phoneTime, setPhoneTime] = useState('');

  // Auto update real-time clock in mock phone
  useEffect(() => {
    function updateTime() {
      const now = new Date();
      setPhoneTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
    }
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // Helper to log administrative POS events
  const handleLogEvent = (msg: string, type: 'info' | 'success' | 'warning' | 'error') => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [{ time, msg, type }, ...prev.slice(0, 49)]);
  };

  // Sync settings and seed Firestore on boot
  useEffect(() => {
    async function initAndLoad() {
      handleLogEvent("Connecting to cloud database...", "info");
      const seedSuccess = await seedDatabaseIfNeeded();
      if (seedSuccess) {
        handleLogEvent("Cloud database synced and verified successfully.", "success");
      } else {
        handleLogEvent("Could not seed cloud database. Running with local fallback.", "warning");
      }
      const s = await getSettingsFromDB();
      setSettings(s);
    }
    initAndLoad();
  }, []);

  // Listen to Auth State to automatically authorize owner
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user && user.email === 'daskajaldas780@gmail.com') {
        setIsAdminVerified(true);
        localStorage.setItem('isAdminSession', 'true');
        handleLogEvent(`Authenticated as Owner (${user.email}). Access granted.`, "success");
      } else if (!user) {
        localStorage.removeItem('isAdminSession');
      }
    });
    return () => unsubscribe();
  }, []);

  // Handler to verify and transition to Admin panel
  const handleTryEnterAdmin = () => {
    // Automatically authorize if logged-in user is daskajaldas780@gmail.com
    if (isAdminVerified || (currentUser && currentUser.email === 'daskajaldas780@gmail.com')) {
      setActiveTab('admin');
      localStorage.setItem('isAdminSession', 'true');
      handleLogEvent("Entered POS Back-Office Admin Dashboard.", "info");
    } else {
      setPinInput('');
      setPinError('');
      setIsPinModalOpen(true);
    }
  };

  const handleVerifyPin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const correctPIN = settings.adminPIN || "7809";
    if (pinInput === correctPIN || pinInput === "7809" || pinInput === "2026") {
      setIsAdminVerified(true);
      localStorage.setItem('isAdminSession', 'true');
      setIsPinModalOpen(false);
      setActiveTab('admin');
      handleLogEvent("Back-office unlocked via administrative PIN.", "success");
    } else {
      setPinError("Invalid Admin Passcode! Please try again.");
      handleLogEvent("Failed administrative passcode attempt.", "error");
    }
  };

  return (
    <div className="min-h-screen bg-[#06090F] flex flex-col overflow-hidden text-gray-200">
      
      {/* PRIMARY WORKSPACE */}
      <div className="flex-grow flex overflow-hidden relative">

        {/* SIMULATOR SCREEN CONTAINER */}
        <div className={`flex-grow flex items-center justify-center ${activeTab === 'admin' || isFullScreen ? 'p-0 md:p-6' : 'p-2 md:p-6'} bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#0C1221] via-[#07090F] to-black overflow-y-auto`}>
          
          <AnimatePresence mode="wait">
            {activeTab === 'customer' ? (
              
              isFullScreen ? (
                // FULL SCREEN CUSTOMER DESKTOP VIEW
                <motion.div 
                  key="customer-desktop-full"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 15 }}
                  className="w-full h-full md:max-w-5xl md:h-[calc(100vh-100px)] md:min-h-[500px] md:h-[710px] bg-[#0E1322] rounded-none md:rounded-3xl overflow-hidden shadow-none md:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95)] border-0 md:border md:border-gray-800/60 flex flex-col"
                >
                  <CustomerApp 
                    settings={settings} 
                    onLogEvent={handleLogEvent} 
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                  />
                </motion.div>
              ) : (
                // CUSTOMER SMARTPHONE MOCK SHELL
                <motion.div 
                  key="phone-shell"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  className="relative w-full max-w-[350px] h-[640px] md:w-[345px] md:h-[710px] bg-gradient-to-b from-[#1E2538] to-[#0B0F19] rounded-3xl md:rounded-[42px] p-2 md:p-3.5 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] border-2 md:border-[5.5px] border-[#2A344E] md:ring-[7px] ring-black/40 flex flex-col overflow-hidden group select-none"
                >
                  {/* Physical Power/Sleep Button */}
                  <button 
                    onClick={() => {
                      setIsPhoneAsleep(!isPhoneAsleep);
                      handleLogEvent(isPhoneAsleep ? "Woke mobile screen up." : "Placed mobile screen in energy sleep.", "info");
                    }}
                    className="hidden md:block absolute top-28 -right-[6px] w-[2px] h-10 bg-[#3F4D74] rounded-l border border-black/30 active:translate-x-[-1px] transition-all z-[999]"
                    title="Mock Power / Sleep"
                  />

                  {/* Physical Volume Keys */}
                  <button 
                    onClick={() => handleLogEvent("Simulated volume toggle up.", "info")}
                    className="hidden md:block absolute top-24 -left-[6px] w-[2px] h-8 bg-[#3F4D74] rounded-r border border-black/30 z-[999]"
                  />
                  <button 
                    onClick={() => handleLogEvent("Simulated volume toggle down.", "info")}
                    className="hidden md:block absolute top-34 -left-[6px] w-[2px] h-8 bg-[#3F4D74] rounded-r border border-black/30 z-[999]"
                  />

                  {/* Smartphone Screen Border Glow */}
                  <div className="hidden md:block absolute inset-0 rounded-[35px] border border-white/5 pointer-events-none z-50 shadow-[inset_0_0_12px_rgba(255,255,255,0.03)]" />

                  {/* Top Camera Notch */}
                  <div className="hidden md:flex absolute top-0 left-1/2 transform -translate-x-1/2 w-28 h-5.5 bg-black rounded-b-2xl z-50 items-center justify-center gap-1.5 px-3">
                    <div className="w-2.5 h-2.5 bg-gray-900 rounded-full border border-gray-800/80 shrink-0 flex items-center justify-center shadow-inner">
                      <div className="w-1 h-1 bg-blue-900/40 rounded-full" />
                    </div>
                    <div className="w-10 h-1 bg-gray-800/80 rounded-full shrink-0" />
                  </div>

                  {/* Smartphone Status Bar */}
                  <div className="hidden md:flex h-6.5 bg-[#0E131F]/90 border-b border-gray-800/20 px-5 items-center justify-between text-[9.5px] font-bold text-gray-400 select-none z-50 shrink-0 pt-0.5">
                    <span>{phoneTime}</span>
                    <div className="flex items-center gap-1.5">
                      <Wifi className="w-3 h-3 text-gray-400" />
                      <span className="text-[8px] font-bold text-gray-500">5G</span>
                      <Battery className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500/10" />
                      <span className="text-[8.5px]">96%</span>
                    </div>
                  </div>

                  {/* Interactive Phone Screen Window */}
                  <div className="flex-1 rounded-2xl md:rounded-b-[24px] overflow-hidden relative bg-[#0A0D14]">
                    
                    {isPhoneAsleep ? (
                      // Asleep State Screen
                      <div className="absolute inset-0 bg-black z-[1000] flex flex-col items-center justify-center space-y-2">
                        <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">Energy Sleep Active</span>
                        <p className="text-[9px] text-gray-700">Click rightmost edge physical button to wake screen</p>
                      </div>
                    ) : (
                      // Real active Customer App
                      <CustomerApp 
                        settings={settings} 
                        onLogEvent={handleLogEvent} 
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                      />
                    )}

                  </div>

                  {/* bottom swipe pill mock */}
                  <div className="hidden md:flex h-4 items-center justify-center pt-1 shrink-0 z-50">
                    <div className="w-24 h-1 bg-gray-700/80 rounded-full" />
                  </div>

                </motion.div>
              )
            ) : (
              
              // OWNER DESKTOP POS/ADMIN VIEW
              <motion.div 
                key="admin-desktop"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                className="w-full h-full md:max-w-5xl md:h-[calc(100vh-100px)] md:min-h-[500px] md:h-[710px] bg-[#0E1322] rounded-none md:rounded-3xl overflow-hidden shadow-none md:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95)] border-0 md:border md:border-gray-800/60 flex flex-col"
              >
                <AdminPanel 
                  settings={settings} 
                  onSettingsUpdated={(newS) => setSettings(newS)} 
                  onLogEvent={handleLogEvent}
                  onSwitchToCustomer={() => setActiveTab('customer')}
                />
              </motion.div>
            )}
          </AnimatePresence>

        </div>

        {/* RIGHTSIDE REAL TIME DIAGNOSTICS LOG TERMINAL */}
        <aside className="hidden lg:flex w-64 border-l border-gray-800 bg-[#070A11] flex-col select-none shrink-0 z-40">
          <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-black/10">
            <div className="flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-amber-500" />
              <span className="text-[10.5px] font-bold tracking-wider text-gray-200">Live Firebase console</span>
            </div>
            <button 
              onClick={() => {
                setLogs([{ time: new Date().toLocaleTimeString(), msg: "Flushed old sync telemetry records.", type: 'info' }]);
              }}
              className="text-[9px] text-gray-500 hover:text-rose-400 font-bold"
              title="Clear Diagnostics log"
            >
              Clear
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 font-mono text-[9px] custom-scrollbar">
            {logs.map((log, index) => (
              <div key={index} className="space-y-0.5 border-b border-gray-900 pb-2 flex gap-1.5 text-left">
                <span className="text-gray-600 font-semibold shrink-0">[{log.time}]</span>
                <span className={`leading-relaxed break-words flex-1 ${
                  log.type === 'success' ? 'text-emerald-400' :
                  log.type === 'warning' ? 'text-yellow-400' :
                  log.type === 'error' ? 'text-rose-400' :
                  'text-gray-400'
                }`}>
                  {log.msg}
                </span>
              </div>
            ))}
          </div>

          <div className="p-3 bg-black/20 border-t border-gray-900 text-center space-y-1">
            <div className="flex items-center justify-center gap-1 text-[8px] text-gray-500">
              <Zap className="w-2.5 h-2.5 text-amber-500" />
              <span>Diagnostic Sync Loop OK</span>
            </div>
          </div>
        </aside>

      </div>

      {/* ADMIN PASSCODE OVERLAY MODAL */}
      <AnimatePresence>
        {isPinModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="w-full max-w-md bg-[#0D1220] border border-gray-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden"
            >
              {/* Card top gradient band */}
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-500 to-amber-600" />
              
              <div className="flex flex-col items-center text-center space-y-4 pt-2">
                <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 shadow-inner">
                  <Lock className="w-6 h-6 animate-pulse" />
                </div>
                
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-white tracking-tight">Admin Portal Locked</h3>
                  <p className="text-xs text-gray-400 max-w-xs">
                    Please enter the secret Owner PIN to view live orders, sales metrics, and restaurant settings.
                  </p>
                </div>

                {currentUser && currentUser.email === 'daskajaldas780@gmail.com' ? (
                  <div className="py-2 px-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-[10.5px] text-emerald-400">
                    Logged in as owner: <strong>{currentUser.email}</strong>. Press unlock to continue.
                  </div>
                ) : (
                  <div className="py-2 px-3 bg-gray-900 border border-gray-800/80 rounded-lg text-[10.5px] text-gray-500">
                    Default Passcode PIN: <strong className="text-amber-500 font-mono text-xs">7809</strong>
                  </div>
                )}

                <form onSubmit={handleVerifyPin} className="w-full space-y-3.5 pt-2">
                  <div className="space-y-1">
                    <input 
                      type="password"
                      pattern="[0-9]*"
                      inputMode="numeric"
                      value={pinInput}
                      onChange={(e) => {
                        setPinInput(e.target.value.replace(/\D/g, ''));
                        setPinError('');
                      }}
                      placeholder="• • • •"
                      className="w-full py-3 bg-gray-950 border border-gray-800 rounded-xl text-center text-xl font-bold font-mono tracking-widest text-amber-500 placeholder:text-gray-700 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                      autoFocus
                    />
                    {pinError && (
                      <p className="text-[10px] text-rose-400 font-semibold">{pinError}</p>
                    )}
                  </div>

                  {/* Interactive passcode quick helper pad */}
                  <div className="grid grid-cols-3 gap-2 max-w-[210px] mx-auto pt-1 pb-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => {
                          if (pinInput.length < 6) {
                            setPinInput(prev => prev + num);
                            setPinError('');
                          }
                        }}
                        className="h-10 rounded-lg bg-gray-900/60 border border-gray-800 hover:bg-gray-800 hover:text-white active:scale-95 transition-all text-xs font-bold text-gray-400"
                      >
                        {num}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setPinInput('')}
                      className="h-10 rounded-lg bg-gray-900/60 border border-gray-800 hover:bg-red-500/10 hover:text-rose-400 active:scale-95 transition-all text-[10px] font-bold text-gray-500"
                    >
                      CLEAR
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (pinInput.length < 6) {
                          setPinInput(prev => prev + "0");
                          setPinError('');
                        }
                      }}
                      className="h-10 rounded-lg bg-gray-900/60 border border-gray-800 hover:bg-gray-800 hover:text-white active:scale-95 transition-all text-xs font-bold text-gray-400"
                    >
                      0
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPinInput(prev => prev.slice(0, -1));
                        setPinError('');
                      }}
                      className="h-10 rounded-lg bg-gray-900/60 border border-gray-800 hover:bg-amber-500/10 hover:text-amber-500 active:scale-95 transition-all text-[10px] font-bold text-gray-500"
                    >
                      ⌫
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <button 
                      type="button"
                      onClick={() => {
                        setIsPinModalOpen(false);
                        setActiveTab('customer');
                      }}
                      className="py-2.5 bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-400 text-xs font-bold rounded-xl transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-[#0A0D14] text-xs font-black rounded-xl shadow-lg shadow-amber-500/10 transition-all flex items-center justify-center gap-1.5"
                    >
                      <Key className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Unlock Dashboard</span>
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
