import { FoodItem, RestaurantSettings, Coupon } from '../types';

export const INITIAL_CATEGORIES = [
  'All',
  'Starters',
  'Artisanal Pizza',
  'Fresh Pasta',
  'Gourmet Burgers',
  'Decadent Desserts',
  'Craft Mocktails'
];

export const MOCK_RESTAURANT_SETTINGS: RestaurantSettings = {
  name: "Subhu Restro",
  tagline: "Artisanal Fusion & Modern Culinary Craft",
  description: "A luxury culinary haven merging classical French techniques with rich, dramatic Italian flavors. Crafted with fresh organic ingredients, hand-rolled pastas, and 48-hour fermented sourdough woodfired pizzas.",
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
  logoUrl: "https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&q=80&w=120&h=120"
};

export const MOCK_COUPONS: Coupon[] = [
  {
    code: "EPIQUE20",
    discountPercent: 20,
    label: "Save 20% on orders above ₹500",
    isActive: true,
    minOrderValue: 500
  },
  {
    code: "GOLDEN150",
    flatDiscount: 150,
    label: "Flat ₹150 off on premium dishes above ₹700",
    isActive: true,
    minOrderValue: 700
  },
  {
    code: "BISTRO50",
    flatDiscount: 50,
    label: "Get ₹50 off on your first order!",
    isActive: true,
    minOrderValue: 200
  }
];

export const MOCK_FOOD_ITEMS: FoodItem[] = [
  {
    id: "star_1",
    name: "Truffle Burrata Carpaccio",
    description: "Creamy hand-tied Italian burrata served over paper-thin heirloom tomatoes, dressed with fresh black truffle shavings, aged balsamic glaze, and micro-basil.",
    price: 380,
    discountPrice: 340,
    imageUrl: "https://images.unsplash.com/photo-1592417817098-8f3d6eb19675?auto=format&fit=crop&q=80&w=600",
    isVeg: true,
    isBestseller: true,
    rating: 4.9,
    prepTime: 12,
    category: "Starters",
    isAvailable: true,
    variants: [
      {
        name: "Size",
        options: [
          { name: "Single Burrata", priceAdjustment: 0 },
          { name: "Double Burrata Sharing", priceAdjustment: 220 }
        ]
      }
    ],
    addOns: [
      { name: "Extra Aged Balsamic Drizzle", price: 40 },
      { name: "Prosciutto Crudo Slices", price: 120 }
    ],
    createdAt: new Date().toISOString()
  },
  {
    id: "star_2",
    name: "Crispy Saffron Arancini",
    description: "Crispy golden risotto balls infused with premium Iranian saffron, filled with gooey smoked scamorza cheese, served with wild mushroom-truffle aioli.",
    price: 290,
    imageUrl: "https://images.unsplash.com/photo-1541532713592-79a0317b6b77?auto=format&fit=crop&q=80&w=600",
    isVeg: true,
    isBestseller: false,
    rating: 4.7,
    prepTime: 15,
    category: "Starters",
    isAvailable: true,
    addOns: [
      { name: "Extra Shaved Parmesan", price: 50 }
    ],
    createdAt: new Date().toISOString()
  },
  {
    id: "pizza_1",
    name: "Tartufo Bianco Sourdough Pizza",
    description: "48-hour slow fermented sourdough crust topped with white truffle cream, wild porcini mushrooms, fresh mozzarella, finished with extra virgin olive oil and fresh arugula.",
    price: 650,
    discountPrice: 590,
    imageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=600",
    isVeg: true,
    isBestseller: true,
    rating: 4.9,
    prepTime: 18,
    category: "Artisanal Pizza",
    isAvailable: true,
    variants: [
      {
        name: "Crust Option",
        options: [
          { name: "Classic Neapolitan Sourdough", priceAdjustment: 0 },
          { name: "Double Cheese Burst Crust", priceAdjustment: 110 }
        ]
      },
      {
        name: "Size",
        options: [
          { name: "Medium 10\"", priceAdjustment: 0 },
          { name: "Large 12\"", priceAdjustment: 180 }
        ]
      }
    ],
    addOns: [
      { name: "Extra Black Truffle Oil", price: 90 },
      { name: "Smoked Scamorza Cheese", price: 70 }
    ],
    createdAt: new Date().toISOString()
  },
  {
    id: "pizza_2",
    name: "Spicy Calabrian Salami Sourdough",
    description: "Crushed San Marzano tomatoes, fresh fior di latte mozzarella, fiery Calabrian nduja, pepperoni slices, hot honey drizzle, and garden-picked oregano.",
    price: 590,
    imageUrl: "https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?auto=format&fit=crop&q=80&w=600",
    isVeg: false,
    isBestseller: true,
    rating: 4.8,
    prepTime: 15,
    category: "Artisanal Pizza",
    isAvailable: true,
    variants: [
      {
        name: "Size",
        options: [
          { name: "Medium 10\"", priceAdjustment: 0 },
          { name: "Large 12\"", priceAdjustment: 160 }
        ]
      }
    ],
    addOns: [
      { name: "Jalapeño Slices", price: 30 },
      { name: "Burrata Topping", price: 150 }
    ],
    createdAt: new Date().toISOString()
  },
  {
    id: "pasta_1",
    name: "Saffron Lobster Tagliatelle",
    description: "House-made fresh ribbon egg pasta cooked in a rich butter sauce infused with saffron, butter-poached Maine lobster tail chunks, and cherry tomatoes.",
    price: 780,
    imageUrl: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&q=80&w=600",
    isVeg: false,
    isBestseller: true,
    rating: 4.9,
    prepTime: 20,
    category: "Fresh Pasta",
    isAvailable: true,
    addOns: [
      { name: "Shaved Autumn Truffle", price: 180 },
      { name: "Extra Lobster Slices", price: 250 }
    ],
    createdAt: new Date().toISOString()
  },
  {
    id: "pasta_2",
    name: "Wild Mushroom Gnocchi",
    description: "Light and pillowy potato gnocchi tossed with a medley of wild chanterelle and cremini mushrooms, sautéed spinach, white wine garlic sauce, and aged pecorino.",
    price: 490,
    discountPrice: 450,
    imageUrl: "https://images.unsplash.com/photo-1621996346565-e3bb64d88904?auto=format&fit=crop&q=80&w=600",
    isVeg: true,
    isBestseller: false,
    rating: 4.6,
    prepTime: 14,
    category: "Fresh Pasta",
    isAvailable: true,
    variants: [
      {
        name: "Pasta Base",
        options: [
          { name: "Classic Potato Gnocchi", priceAdjustment: 0 },
          { name: "Gluten-Free Gnocchi", priceAdjustment: 50 }
        ]
      }
    ],
    createdAt: new Date().toISOString()
  },
  {
    id: "burger_1",
    name: "The Imperial Wagyu Burger",
    description: "A prime melt-in-your-mouth Wagyu beef patty, layered with caramelized onion jam, melted French gruyère, black garlic paste, and custom artisan brioche bun. Served with truffle fries.",
    price: 680,
    imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=600",
    isVeg: false,
    isBestseller: true,
    rating: 4.9,
    prepTime: 22,
    category: "Gourmet Burgers",
    isAvailable: true,
    variants: [
      {
        name: "Doneness",
        options: [
          { name: "Medium Rare (Recommended)", priceAdjustment: 0 },
          { name: "Medium Well Done", priceAdjustment: 0 }
        ]
      }
    ],
    addOns: [
      { name: "Smoked Applewood Bacon", price: 90 },
      { name: "Melted Gorgonzola Blue Cheese", price: 100 }
    ],
    createdAt: new Date().toISOString()
  },
  {
    id: "burger_2",
    name: "Crispy Portobello Truffle Burger",
    description: "Panko-crusted fresh giant Portobello mushroom cap filled with melted cheddar, topped with wild rocket leaf, heirloom tomato, and truffle basil spread.",
    price: 450,
    imageUrl: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&q=80&w=600",
    isVeg: true,
    isBestseller: false,
    rating: 4.7,
    prepTime: 16,
    category: "Gourmet Burgers",
    isAvailable: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "dessert_1",
    name: "Golden Leaf Espresso Tiramisu",
    description: "Layers of house-baked ladyfingers soaked in dark premium espresso and dark rum, whipped mascarpone cream, dusted with organic cocoa powder and edible gold foil flakes.",
    price: 350,
    imageUrl: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&q=80&w=600",
    isVeg: true,
    isBestseller: true,
    rating: 4.9,
    prepTime: 10,
    category: "Decadent Desserts",
    isAvailable: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "dessert_2",
    name: "Molten Valrhona Lava Soufflé",
    description: "A decadent warm dark French Valrhona chocolate cake with an irresistible warm molten liquid core, served with gourmet tahitian vanilla bean gelato.",
    price: 390,
    imageUrl: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&q=80&w=600",
    isVeg: true,
    isBestseller: true,
    rating: 4.8,
    prepTime: 15,
    category: "Decadent Desserts",
    isAvailable: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "mock_1",
    name: "Rosemary Elderflower Spritz",
    description: "Artisanal sparkling spritz featuring wild elderflower cordial, fresh rosewater infusion, cold-pressed lime juice, garnished with organic rosemary sprig & pink sea salt.",
    price: 240,
    imageUrl: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=600",
    isVeg: true,
    isBestseller: false,
    rating: 4.7,
    prepTime: 8,
    category: "Craft Mocktails",
    isAvailable: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "mock_2",
    name: "Smoked Hibiscus Lavender Elixir",
    description: "A cold-pressed herbal hibiscus infusion mixed with lavender honey, carbonated tonic, smoked oak infusion mist, served over clear artisan ice sphere.",
    price: 260,
    imageUrl: "https://images.unsplash.com/photo-1536935338788-846bb9981813?auto=format&fit=crop&q=80&w=600",
    isVeg: true,
    isBestseller: true,
    rating: 4.8,
    prepTime: 7,
    category: "Craft Mocktails",
    isAvailable: true,
    createdAt: new Date().toISOString()
  }
];

export const MOCK_REVIEWS = [
  {
    name: "Alexander Mercer",
    rating: 5,
    comment: "The Tartufo Bianco pizza is an absolute masterpiece. Sourdough crust is bubbly, light, and perfectly crispy. Reminds me of the best pizzerias in Naples, but elevated.",
    date: "2 days ago",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&h=80"
  },
  {
    name: "Isabella Cavalli",
    rating: 5,
    comment: "Amazing attention to detail. The truffle burrata starter melt in my mouth. Seamless reservation process and beautiful, elite ambiance inside the app. Ordering was incredibly fast!",
    date: "1 week ago",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&h=80"
  },
  {
    name: "Marcus Sterling",
    rating: 4.8,
    comment: "The Imperial Wagyu Burger is succulent and bursting with umami notes. Very rare to find such real gourmet food online. Quick checkout and the live tracking works beautifully.",
    date: "3 weeks ago",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=80&h=80"
  }
];
