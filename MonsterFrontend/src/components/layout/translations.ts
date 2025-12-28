// Translation constants for Header component
export const translations = {
  en: {
    // Header navigation
    hello: "Hello",
    helloSignIn: "Hello, Sign in",
    accountsLists: "Accounts & Lists",
    signIn: "Sign in",
    signOut: "Sign Out",
    yourProfile: "Your Profile",
    yourOrders: "Your Orders",
    yourAccount: "Your Account",
    
    // Mobile menu
    menu: "Menu",
    newCustomer: "New customer?",
    startHere: "Start here",
    yourLists: "Your Lists",
    createList: "Create a List",
    buyAgain: "Buy Again",
    orders: "Orders",
    account: "Account",
    welcomeBack: "Welcome back!",
    signInToAccount: "Sign in to your account",
    
    // Search
    searchByCategory: "Search by category",
    searchProducts: "Search products...",
    search: "Search",
    all: "All",
    men: "Men",
    women: "Women",
    
    // Categories and navigation
    trending: "Trending",
    bestsellers: "Bestsellers",
    newReleases: "New Releases",
    shopByCategory: "Shop by Category",
    mensFashion: "Men's Fashion",
    womensFashion: "Women's Fashion",
    cart: "Cart",
    
    // Secondary navigation
    todaysDeals: "Today's Deals",
    customerService: "Customer Service",
    registry: "Registry",
    giftCards: "Gift Cards",
    home: "Home",
    
    // Language
    en: "EN",
    hi: "HI"
  },
  hi: {
    // Header navigation
    hello: "नमस्ते",
    helloSignIn: "नमस्ते, साइन इन करें",
    accountsLists: "खाते और सूचियां",
    signIn: "साइन इन करें",
    signOut: "साइन आउट",
    yourProfile: "आपकी प्रोफ़ाइल",
    yourOrders: "आपके ऑर्डर",
    yourAccount: "आपका खाता",
    
    // Mobile menu
    menu: "मेन्यू",
    newCustomer: "नए ग्राहक?",
    startHere: "यहाँ से शुरू करें",
    yourLists: "आपकी सूचियां",
    createList: "सूची बनाएं",
    buyAgain: "फिर से खरीदें",
    orders: "ऑर्डर",
    account: "खाता",
    welcomeBack: "वापस स्वागत है!",
    signInToAccount: "अपने खाते में साइन इन करें",
    
    // Search
    searchByCategory: "श्रेणी के अनुसार खोजें",
    searchProducts: "उत्पाद खोजें...",
    search: "खोजें",
    all: "सभी",
    men: "पुरुष",
    women: "महिलाएं",
    
    // Categories and navigation
    trending: "ट्रेंडिंग",
    bestsellers: "बेस्टसेलर",
    newReleases: "नई रिलीज़",
    shopByCategory: "श्रेणी के अनुसार खरीदारी करें",
    mensFashion: "पुरुष फैशन",
    womensFashion: "महिला फैशन",
    cart: "कार्ट",
    
    // Secondary navigation
    todaysDeals: "आज के ऑफर",
    customerService: "ग्राहक सेवा",
    registry: "रजिस्ट्री",
    giftCards: "गिफ्ट कार्ड",
    home: "होम",
    
    // Language
    en: "EN",
    hi: "HI"
  }
} as const;

export type Language = keyof typeof translations;
export type TranslationKey = keyof typeof translations.en | 'home';

// Translation hook
export const useTranslation = (language: Language) => {
  return {
    t: (key: TranslationKey) => translations[language][key],
    language
  };
};