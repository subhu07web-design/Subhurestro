import { FoodItem, RestaurantSettings, Coupon } from '../types';

export const INITIAL_CATEGORIES = [
  'All',
  'Starters',
  'Pizza',
  'Pasta',
  'Burgers',
  'Indian Special',
  'Desserts',
  'Drinks'
];

export const MOCK_RESTAURANT_SETTINGS: RestaurantSettings = {
  name: "Subhu Restro",
  tagline: "Delicious Food & Fast Delivery",
  description: "We serve fresh, hot, and tasty food including wood-fired pizzas, fresh pasta, juicy burgers, and authentic Indian special dishes. Made with fresh ingredients every day.",
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
  logoUrl: "https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&q=80&w=120&h=120",
  adminPIN: "7809"
};

export const MOCK_COUPONS: Coupon[] = [
  {
    code: "SAVE20",
    discountPercent: 20,
    label: "Get 20% off on orders above ₹500",
    isActive: true,
    minOrderValue: 500
  },
  {
    code: "FLAT150",
    flatDiscount: 150,
    label: "Flat ₹150 off on orders above ₹700",
    isActive: true,
    minOrderValue: 700
  },
  {
    code: "FIRST50",
    flatDiscount: 50,
    label: "Get ₹50 off on your first order!",
    isActive: true,
    minOrderValue: 200
  }
];

export const MOCK_FOOD_ITEMS: FoodItem[] = [
  {
    id: "star_1",
    name: "Tomato Mozzarella Salad",
    description: "Fresh tomato slices and soft mozzarella cheese with olive oil, herbs, and sweet balsamic glaze.",
    price: 320,
    discountPrice: 280,
    imageUrl: "https://images.unsplash.com/photo-1592417817098-8f3d6eb19675?auto=format&fit=crop&q=80&w=600",
    isVeg: true,
    isBestseller: true,
    rating: 4.8,
    prepTime: 10,
    category: "Starters",
    isAvailable: true,
    variants: [
      {
        name: "Serving Size",
        options: [
          { name: "Single Portion", priceAdjustment: 0 },
          { name: "Double Sharing", priceAdjustment: 180 }
        ]
      }
    ],
    addOns: [
      { name: "Extra Balsamic Sauce", price: 30 }
    ],
    createdAt: new Date().toISOString()
  },
  {
    id: "star_2",
    name: "Crispy Cheese Risotto Balls",
    description: "Crispy golden fried rice balls filled with gooey melting cheese, served with a tasty dipping sauce.",
    price: 250,
    imageUrl: "https://images.unsplash.com/photo-1541532713592-79a0317b6b77?auto=format&fit=crop&q=80&w=600",
    isVeg: true,
    isBestseller: false,
    rating: 4.6,
    prepTime: 12,
    category: "Starters",
    isAvailable: true,
    addOns: [
      { name: "Extra Cheese on Top", price: 40 }
    ],
    createdAt: new Date().toISOString()
  },
  {
    id: "pizza_1",
    name: "White Mushroom Pizza",
    description: "Freshly baked pizza topped with a creamy white mushroom sauce, fresh cheese, olive oil, and green leaves.",
    price: 550,
    discountPrice: 490,
    imageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=600",
    isVeg: true,
    isBestseller: true,
    rating: 4.9,
    prepTime: 15,
    category: "Pizza",
    isAvailable: true,
    variants: [
      {
        name: "Crust Type",
        options: [
          { name: "Classic Thin Crust", priceAdjustment: 0 },
          { name: "Double Cheese Burst", priceAdjustment: 100 }
        ]
      },
      {
        name: "Size",
        options: [
          { name: "Medium 10 inch", priceAdjustment: 0 },
          { name: "Large 12 inch", priceAdjustment: 150 }
        ]
      }
    ],
    addOns: [
      { name: "Extra Mushroom", price: 50 },
      { name: "Extra Cheese", price: 60 }
    ],
    createdAt: new Date().toISOString()
  },
  {
    id: "pizza_2",
    name: "Spicy Pepperoni Pizza",
    description: "Tomato sauce, melted cheese, spicy pepperoni slices, and a sweet honey drizzle.",
    price: 590,
    imageUrl: "https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?auto=format&fit=crop&q=80&w=600",
    isVeg: false,
    isBestseller: true,
    rating: 4.8,
    prepTime: 14,
    category: "Pizza",
    isAvailable: true,
    variants: [
      {
        name: "Size",
        options: [
          { name: "Medium 10 inch", priceAdjustment: 0 },
          { name: "Large 12 inch", priceAdjustment: 140 }
        ]
      }
    ],
    addOns: [
      { name: "Jalapeno Peppers", price: 30 },
      { name: "Extra Pepperoni", price: 80 }
    ],
    createdAt: new Date().toISOString()
  },
  {
    id: "pasta_1",
    name: "Creamy Lobster Pasta",
    description: "Fresh egg pasta cooked in a rich butter sauce with tasty lobster chunks and sweet tomatoes.",
    price: 750,
    imageUrl: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&q=80&w=600",
    isVeg: false,
    isBestseller: true,
    rating: 4.9,
    prepTime: 18,
    category: "Pasta",
    isAvailable: true,
    addOns: [
      { name: "Extra Cheese", price: 60 },
      { name: "Extra Lobster Chunks", price: 200 }
    ],
    createdAt: new Date().toISOString()
  },
  {
    id: "pasta_2",
    name: "Garlic Mushroom Gnocchi",
    description: "Soft potato pasta balls cooked in a creamy garlic sauce with fresh mushrooms and green spinach.",
    price: 450,
    discountPrice: 390,
    imageUrl: "https://images.unsplash.com/photo-1621996346565-e3bb64d88904?auto=format&fit=crop&q=80&w=600",
    isVeg: true,
    isBestseller: false,
    rating: 4.7,
    prepTime: 12,
    category: "Pasta",
    isAvailable: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "burger_1",
    name: "Classic Cheese Beef Burger",
    description: "Juicy beef patty with sweet onions, melted cheese, and fresh lettuce in a soft bun. Served with golden fries.",
    price: 490,
    imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=600",
    isVeg: false,
    isBestseller: true,
    rating: 4.9,
    prepTime: 15,
    category: "Burgers",
    isAvailable: true,
    variants: [
      {
        name: "Egg Option",
        options: [
          { name: "Without Egg", priceAdjustment: 0 },
          { name: "Add Fried Egg", priceAdjustment: 30 }
        ]
      }
    ],
    addOns: [
      { name: "Extra Cheese Slice", price: 30 },
      { name: "Extra Beef Patty", price: 120 }
    ],
    createdAt: new Date().toISOString()
  },
  {
    id: "ind_1",
    name: "Butter Chicken with Garlic Naan",
    description: "Tender chicken cooked in a rich, creamy tomato butter gravy, served with fresh garlic naan bread.",
    price: 420,
    discountPrice: 380,
    imageUrl: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&q=80&w=600",
    isVeg: false,
    isBestseller: true,
    rating: 4.9,
    prepTime: 18,
    category: "Indian Special",
    isAvailable: true,
    variants: [
      {
        name: "Naan Option",
        options: [
          { name: "Garlic Naan", priceAdjustment: 0 },
          { name: "Butter Naan", priceAdjustment: 0 },
          { name: "Tandoori Roti", priceAdjustment: -10 }
        ]
      }
    ],
    addOns: [
      { name: "Extra Naan", price: 40 },
      { name: "Extra Gravy", price: 50 }
    ],
    createdAt: new Date().toISOString()
  },
  {
    id: "ind_2",
    name: "Paneer Butter Masala Combo",
    description: "Soft cottage cheese paneer cubes cooked in a spiced tomato butter gravy, served with hot naan bread.",
    price: 360,
    imageUrl: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&q=80&w=600",
    isVeg: true,
    isBestseller: true,
    rating: 4.8,
    prepTime: 15,
    category: "Indian Special",
    isAvailable: true,
    variants: [
      {
        name: "Bread Option",
        options: [
          { name: "Butter Naan", priceAdjustment: 0 },
          { name: "Garlic Naan", priceAdjustment: 10 },
          { name: "Plain Roti", priceAdjustment: -10 }
        ]
      }
    ],
    addOns: [
      { name: "Extra Paneer Cubes", price: 60 }
    ],
    createdAt: new Date().toISOString()
  },
  {
    id: "ind_3",
    name: "Hyderabadi Chicken Biryani",
    description: "Fragrant long-grain basmati rice cooked with spiced chicken and exotic spices, served with fresh raita.",
    price: 390,
    imageUrl: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&q=80&w=600",
    isVeg: false,
    isBestseller: true,
    rating: 4.9,
    prepTime: 15,
    category: "Indian Special",
    isAvailable: true,
    addOns: [
      { name: "Extra Raita", price: 20 },
      { name: "Extra Egg", price: 15 }
    ],
    createdAt: new Date().toISOString()
  },
  {
    id: "ind_4",
    name: "Dal Makhani with Paratha",
    description: "Slow-cooked black lentils in rich cream and butter, paired with hot crispy paratha bread.",
    price: 320,
    imageUrl: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&q=80&w=600",
    isVeg: true,
    isBestseller: false,
    rating: 4.7,
    prepTime: 14,
    category: "Indian Special",
    isAvailable: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "dessert_1",
    name: "Classic Coffee Tiramisu",
    description: "Layers of sweet biscuits soaked in fresh coffee, whipped cream, and cocoa powder.",
    price: 290,
    imageUrl: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&q=80&w=600",
    isVeg: true,
    isBestseller: true,
    rating: 4.8,
    prepTime: 8,
    category: "Desserts",
    isAvailable: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "dessert_2",
    name: "Warm Chocolate Cake",
    description: "Hot chocolate cake with a melting chocolate liquid center, served with vanilla ice cream.",
    price: 320,
    imageUrl: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&q=80&w=600",
    isVeg: true,
    isBestseller: true,
    rating: 4.8,
    prepTime: 10,
    category: "Desserts",
    isAvailable: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "mock_1",
    name: "Fresh Flower Lemonade",
    description: "Sweet sparkling lemonade made with herbal flower syrup and fresh rosemary leaves.",
    price: 180,
    imageUrl: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=600",
    isVeg: true,
    isBestseller: false,
    rating: 4.6,
    prepTime: 5,
    category: "Drinks",
    isAvailable: true,
    createdAt: new Date().toISOString()
  }
];

export const MOCK_REVIEWS = [
  {
    name: "Alexander Mercer",
    rating: 5,
    comment: "The Butter Chicken is absolutely delicious. Extremely creamy and perfect naan. Highly recommend!",
    date: "2 days ago",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&h=80"
  },
  {
    name: "Isabella Cavalli",
    rating: 5,
    comment: "Amazing and quick service! Ordering was simple and my food arrived hot.",
    date: "1 week ago",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&h=80"
  },
  {
    name: "Marcus Sterling",
    rating: 4.8,
    comment: "Excellent paneer and garlic naan combo. Delivery was very fast too.",
    date: "3 weeks ago",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=80&h=80"
  }
];
