import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy,
  getDocFromServer
} from 'firebase/firestore';
import { FoodItem, Order, Reservation, RestaurantSettings, Coupon, UserProfile } from '../types';
import { MOCK_FOOD_ITEMS, MOCK_RESTAURANT_SETTINGS, MOCK_COUPONS } from '../data/mockData';

// Firebase Configuration from firebase-applet-config.json
const firebaseConfig = {
  apiKey: "AIzaSyCWAQOeO7dz_uo1t9adBTpip5kwBFdmVco",
  authDomain: "subhurestro.firebaseapp.com",
  projectId: "subhurestro",
  storageBucket: "subhurestro.firebasestorage.app",
  messagingSenderId: "295709617282",
  appId: "1:295709617282:web:f2d19a405a097c1e64589b"
};

const databaseId = "(default)";

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Firestore with Custom Database ID safely
export const db = databaseId && databaseId !== "(default)" ? getFirestore(app, databaseId) : getFirestore(app);

// --- SEED DATABASE ON RUN ---
export async function seedDatabaseIfNeeded() {
  try {
    // 1. Seed Restaurant Settings
    const settingsDocRef = doc(db, 'settings', 'restaurant');
    const settingsSnap = await getDoc(settingsDocRef);
    if (!settingsSnap.exists()) {
      await setDoc(settingsDocRef, MOCK_RESTAURANT_SETTINGS);
      console.log("Seeded restaurant settings successfully.");
    } else {
      const currentData = settingsSnap.data() as RestaurantSettings;
      if (currentData.name === "L'Épice Dorée" || currentData.phone === "+1 (555) 837-7721") {
        await setDoc(settingsDocRef, MOCK_RESTAURANT_SETTINGS);
        console.log("Migrated restaurant settings to Subhu Restro in Firestore.");
      }
    }

    // 2. Seed Coupons
    const couponsColl = collection(db, 'coupons');
    const couponsSnap = await getDocs(couponsColl);
    if (couponsSnap.empty) {
      for (const coupon of MOCK_COUPONS) {
        await setDoc(doc(db, 'coupons', coupon.code), coupon);
      }
      console.log("Seeded default coupons successfully.");
    }

    // 3. Seed Food Items
    const foodsColl = collection(db, 'foods');
    const foodsSnap = await getDocs(foodsColl);
    if (foodsSnap.empty) {
      for (const food of MOCK_FOOD_ITEMS) {
        await setDoc(doc(db, 'foods', food.id), food);
      }
      console.log("Seeded default food items successfully.");
    }
    return true;
  } catch (err) {
    console.warn("Error seeding Firebase Firestore database (could be offline or permissions not yet configured in Firebase console):", err);
    return false;
  }
}

// --- AUTH HELPERS ---
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const userDocRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
      return userDoc.data() as UserProfile;
    }
    return null;
  } catch (err) {
    console.error("Error fetching user profile:", err);
    return null;
  }
}

export async function createUserProfile(uid: string, profile: Partial<UserProfile>): Promise<UserProfile> {
  const userDocRef = doc(db, 'users', uid);
  const userProfile: UserProfile = {
    id: uid,
    name: profile.name || "Guest Patron",
    email: profile.email || "",
    phone: profile.phone || "",
    address: profile.address || "",
    role: profile.role || "customer",
    createdAt: new Date().toISOString()
  };
  await setDoc(userDocRef, userProfile);
  return userProfile;
}

// Google Sign-In helper (handles popups safely in AI Studio context)
export async function signInWithGoogle(): Promise<UserProfile | null> {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    let profile = await getUserProfile(user.uid);
    if (!profile) {
      profile = await createUserProfile(user.uid, {
        name: user.displayName || "Google User",
        email: user.email || "",
        role: "customer"
      });
    }
    return profile;
  } catch (err) {
    console.error("Google Sign-In failed:", err);
    throw err;
  }
}

// --- FOOD / MENU SERVICES ---
export async function getFoodsFromDB(): Promise<FoodItem[]> {
  try {
    const foodsColl = collection(db, 'foods');
    const snap = await getDocs(foodsColl);
    if (snap.empty) {
      return MOCK_FOOD_ITEMS;
    }
    const items: FoodItem[] = [];
    snap.forEach(d => {
      items.push(d.data() as FoodItem);
    });
    return items;
  } catch (err) {
    console.warn("Falling back to local mock foods due to permission or offline status:", err);
    return MOCK_FOOD_ITEMS;
  }
}

export async function addOrUpdateFoodInDB(food: FoodItem): Promise<void> {
  await setDoc(doc(db, 'foods', food.id), food);
}

export async function deleteFoodFromDB(id: string): Promise<void> {
  await deleteDoc(doc(db, 'foods', id));
}

// --- RESTAURANT SETTINGS SERVICES ---
export async function getSettingsFromDB(): Promise<RestaurantSettings> {
  try {
    const settingsDoc = await getDoc(doc(db, 'settings', 'restaurant'));
    if (settingsDoc.exists()) {
      return settingsDoc.data() as RestaurantSettings;
    }
    return MOCK_RESTAURANT_SETTINGS;
  } catch (err) {
    console.warn("Falling back to local mock settings:", err);
    return MOCK_RESTAURANT_SETTINGS;
  }
}

export async function updateSettingsInDB(settings: RestaurantSettings): Promise<void> {
  await setDoc(doc(db, 'settings', 'restaurant'), settings);
}

// --- ORDER SERVICES ---
export async function createOrderInDB(order: Order): Promise<void> {
  // Always save to localStorage as a robust fallback
  try {
    const localOrders = JSON.parse(localStorage.getItem('fallback_orders') || '[]');
    if (!localOrders.find((o: Order) => o.id === order.id)) {
      localOrders.push(order);
      localStorage.setItem('fallback_orders', JSON.stringify(localOrders));
    }
  } catch (localErr) {
    console.warn("Failed to write order to local cache:", localErr);
  }

  // Write to Firebase - catch errors gracefully so user is not blocked if Firestore setup is incomplete
  try {
    await setDoc(doc(db, 'orders', order.id), order);
  } catch (err) {
    console.error("Firestore order write failed. Seamlessly proceeding with secure client-side storage:", err);
  }
}

export function subscribeToOrders(userId: string | null, isAdmin: boolean, callback: (orders: Order[]) => void) {
  const getLocalOrders = (): Order[] => {
    try {
      const local = JSON.parse(localStorage.getItem('fallback_orders') || '[]');
      if (isAdmin) return local;
      return local.filter((o: Order) => o.userId === userId);
    } catch {
      return [];
    }
  };

  const ordersColl = collection(db, 'orders');
  let q;
  if (isAdmin) {
    q = query(ordersColl);
  } else if (userId) {
    q = query(ordersColl, where('userId', '==', userId));
  } else {
    // Return local orders fallback immediately
    callback(getLocalOrders());
    return () => {};
  }

  return onSnapshot(q, (snapshot) => {
    const list: Order[] = [];
    const seenIds = new Set<string>();

    snapshot.forEach((docSnap) => {
      const order = docSnap.data() as Order;
      list.push(order);
      seenIds.add(order.id);
    });

    // Merge in any local fallback orders not already present in remote
    const locals = getLocalOrders();
    locals.forEach((localOrder) => {
      if (!seenIds.has(localOrder.id)) {
        list.push(localOrder);
      }
    });

    // Sort client-side by newest first
    list.sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeB - timeA;
    });

    callback(list);
  }, (err) => {
    console.error("Error subscribing to Firestore orders, using local fallback cache:", err);
    // On subscription error, return fallback list
    callback(getLocalOrders());
  });
}

// --- TABLE RESERVATIONS ---
export async function createReservationInDB(reservation: Reservation): Promise<void> {
  try {
    const local = JSON.parse(localStorage.getItem('fallback_reservations') || '[]');
    if (!local.find((r: any) => r.id === reservation.id)) {
      local.push(reservation);
      localStorage.setItem('fallback_reservations', JSON.stringify(local));
    }
  } catch (localErr) {
    console.warn("Failed to save reservation to local cache:", localErr);
  }

  // Write to Firebase - catch errors gracefully
  try {
    await setDoc(doc(db, 'reservations', reservation.id), reservation);
  } catch (err) {
    console.error("Firestore reservation write failed. Proceeding with secure client-side storage:", err);
  }
}

export function subscribeToReservations(callback: (reservations: Reservation[]) => void) {
  const getLocalReservations = (): Reservation[] => {
    try {
      return JSON.parse(localStorage.getItem('fallback_reservations') || '[]');
    } catch {
      return [];
    }
  };

  const reservationsColl = collection(db, 'reservations');
  const q = query(reservationsColl);

  return onSnapshot(q, (snapshot) => {
    const list: Reservation[] = [];
    const seenIds = new Set<string>();

    snapshot.forEach((docSnap) => {
      const res = docSnap.data() as Reservation;
      list.push(res);
      seenIds.add(res.id);
    });

    // Merge local ones
    const locals = getLocalReservations();
    locals.forEach((localRes) => {
      if (!seenIds.has(localRes.id)) {
        list.push(localRes);
      }
    });

    // Sort client-side by newest first
    list.sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeB - timeA;
    });

    callback(list);
  }, (err) => {
    console.error("Error subscribing to Firestore reservations, using local fallback cache:", err);
    callback(getLocalReservations());
  });
}

export async function updateReservationStatusInDB(id: string, status: 'pending' | 'approved' | 'rejected'): Promise<void> {
  try {
    const local = JSON.parse(localStorage.getItem('fallback_reservations') || '[]');
    const index = local.findIndex((r: any) => r.id === id);
    if (index !== -1) {
      local[index].status = status;
      localStorage.setItem('fallback_reservations', JSON.stringify(local));
    }
  } catch (localErr) {
    console.warn("Failed to update reservation in local cache:", localErr);
  }

  // Write to Firebase - catch errors gracefully
  try {
    const docRef = doc(db, 'reservations', id);
    await updateDoc(docRef, { status });
  } catch (err) {
    console.error("Firestore reservation update failed:", err);
  }
}

export async function updateOrderStatusInDB(id: string, status: Order['status'], estimatedTime?: number): Promise<void> {
  try {
    const local = JSON.parse(localStorage.getItem('fallback_orders') || '[]');
    const index = local.findIndex((o: any) => o.id === id);
    if (index !== -1) {
      local[index].status = status;
      if (estimatedTime !== undefined) {
        local[index].estimatedTime = estimatedTime;
      }
      localStorage.setItem('fallback_orders', JSON.stringify(local));
    }
  } catch (localErr) {
    console.warn("Failed to update order status in local cache:", localErr);
  }

  // Write to Firebase - catch errors gracefully
  try {
    const docRef = doc(db, 'orders', id);
    const updates: Partial<Order> = { status };
    if (estimatedTime !== undefined) {
      updates.estimatedTime = estimatedTime;
    }
    await updateDoc(docRef, updates);
  } catch (err) {
    console.error("Firestore order update failed:", err);
  }
}

// --- COUPON SERVICES ---
export async function getCouponsFromDB(): Promise<Coupon[]> {
  try {
    const snap = await getDocs(collection(db, 'coupons'));
    if (snap.empty) {
      return MOCK_COUPONS;
    }
    const list: Coupon[] = [];
    snap.forEach((d) => {
      list.push(d.data() as Coupon);
    });
    return list;
  } catch (err) {
    console.warn("Falling back to local coupons:", err);
    return MOCK_COUPONS;
  }
}

export async function addCouponInDB(coupon: Coupon): Promise<void> {
  await setDoc(doc(db, 'coupons', coupon.code), coupon);
}

export async function deleteCouponFromDB(code: string): Promise<void> {
  await deleteDoc(doc(db, 'coupons', code));
}
