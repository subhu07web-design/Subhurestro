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

// Initialize Firestore with Custom Database ID
export const db = getFirestore(app, databaseId);

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
  await setDoc(doc(db, 'orders', order.id), order);
}

export function subscribeToOrders(userId: string | null, isAdmin: boolean, callback: (orders: Order[]) => void) {
  const ordersColl = collection(db, 'orders');
  let q;
  if (isAdmin) {
    // Admin sees all, sorted by newest
    q = query(ordersColl, orderBy('createdAt', 'desc'));
  } else if (userId) {
    // Customer sees their own orders
    q = query(ordersColl, where('userId', '==', userId), orderBy('createdAt', 'desc'));
  } else {
    // Return empty callback unsubscribed immediately if no state
    callback([]);
    return () => {};
  }

  return onSnapshot(q, (snapshot) => {
    const list: Order[] = [];
    snapshot.forEach((docSnap) => {
      list.push(docSnap.data() as Order);
    });
    callback(list);
  }, (err) => {
    console.error("Error subscribing to orders:", err);
    // In case of any database subscription error, return empty list or fallback gracefully
    callback([]);
  });
}

// --- TABLE RESERVATIONS ---
export async function createReservationInDB(reservation: Reservation): Promise<void> {
  await setDoc(doc(db, 'reservations', reservation.id), reservation);
}

export function subscribeToReservations(callback: (reservations: Reservation[]) => void) {
  const reservationsColl = collection(db, 'reservations');
  const q = query(reservationsColl, orderBy('createdAt', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const list: Reservation[] = [];
    snapshot.forEach((docSnap) => {
      list.push(docSnap.data() as Reservation);
    });
    callback(list);
  }, (err) => {
    console.error("Error subscribing to reservations:", err);
    callback([]);
  });
}

export async function updateReservationStatusInDB(id: string, status: 'pending' | 'approved' | 'rejected'): Promise<void> {
  const docRef = doc(db, 'reservations', id);
  await updateDoc(docRef, { status });
}

export async function updateOrderStatusInDB(id: string, status: Order['status'], estimatedTime?: number): Promise<void> {
  const docRef = doc(db, 'orders', id);
  const updates: Partial<Order> = { status };
  if (estimatedTime !== undefined) {
    updates.estimatedTime = estimatedTime;
  }
  await updateDoc(docRef, updates);
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
