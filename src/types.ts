export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  role: 'customer' | 'admin';
  createdAt: string;
}

export interface FoodVariant {
  name: string; // e.g. "Size"
  options: {
    name: string; // e.g. "Regular", "Medium", "Large"
    priceAdjustment: number; // e.g. 0, 120, 240
  }[];
}

export interface FoodAddOn {
  name: string; // e.g. "Extra Cheese"
  price: number; // e.g. 45
}

export interface FoodItem {
  id: string;
  name: string;
  description: string;
  price: number;
  discountPrice?: number;
  imageUrl: string;
  isVeg: boolean;
  isBestseller: boolean;
  rating: number;
  prepTime: number; // in minutes
  category: string;
  isAvailable: boolean;
  variants?: FoodVariant[];
  addOns?: FoodAddOn[];
  createdAt: string;
}

export interface CartItem {
  food: FoodItem;
  quantity: number;
  selectedVariant?: {
    variantName: string;
    optionName: string;
    priceAdjustment: number;
  };
  selectedAddOns?: FoodAddOn[];
}

export interface OrderItemSummary {
  foodId: string;
  name: string;
  quantity: number;
  price: number;
  selectedVariant?: {
    variantName: string;
    optionName: string;
    priceAdjustment: number;
  };
  selectedAddOns?: FoodAddOn[];
  isVeg: boolean;
}

export interface Order {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  userEmail: string;
  items: OrderItemSummary[];
  promoCode?: string;
  discount: number;
  tax: number; // GST
  packingCharge: number;
  deliveryCharge: number;
  total: number;
  status: 'received' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  paymentMethod: 'cod' | 'upi' | 'razorpay';
  address: string;
  specialInstructions?: string;
  estimatedTime?: number; // in minutes
  createdAt: string;
}

export interface Reservation {
  id: string;
  userId?: string;
  name: string;
  phone: string;
  date: string;
  time: string;
  guests: number;
  specialRequest?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface Coupon {
  code: string;
  discountPercent?: number;
  flatDiscount?: number;
  label: string;
  isActive: boolean;
  minOrderValue?: number;
}

export interface RestaurantSettings {
  name: string;
  tagline: string;
  description: string;
  address: string;
  googleMapsLink: string;
  phone: string;
  whatsapp: string;
  email: string;
  openingHours: string; // e.g. "11:00 AM"
  closingHours: string; // e.g. "11:00 PM"
  deliveryCharges: number;
  gstPercent: number;
  upiId: string;
  logoUrl: string;
  instagram?: string;
  facebook?: string;
  website?: string;
}
