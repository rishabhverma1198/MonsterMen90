import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

// Translation data
const translations = {
  en: {
    // Common
    'loading': 'Loading...',
    'error': 'Error',
    'success': 'Success',
    'cancel': 'Cancel',
    'save': 'Save',
    'delete': 'Delete',
    'edit': 'Edit',
    'back': 'Back',
    'next': 'Next',
    'previous': 'Previous',
    'search': 'Search',
    'filter': 'Filter',
    'clear': 'Clear',
    'apply': 'Apply',
    'close': 'Close',
    'open': 'Open',
    'yes': 'Yes',
    'no': 'No',
    
    // Header
    'hello': 'Hello',
    'sign_in': 'Sign in',
    'sign_out': 'Sign Out',
    'accounts': 'Accounts',
    'accounts_lists': 'Accounts & Lists',
    'hello_sign_in': 'Hello, Sign in',
    'cart': 'Cart',
    'search_products': 'Search products...',
    'all': 'All',
    'men': 'Men',
    'women': 'Women',
    'trending': 'Trending',
    'bestsellers': 'Bestsellers',
    'new_releases': 'New Releases',
    'shop_by_category': 'Shop by Category',
    'mens_fashion': 'Men\'s Fashion',
    'womens_fashion': 'Women\'s Fashion',
    'account_info': 'Account Info',
    'dashboard': 'Dashboard',
    
    // Hero/Landing
    'welcome_to_monstermen90': 'Welcome to MonsterMen90',
    'choose_how_shop': 'Choose how you want to shop',
    'shop_as_buyer': 'Shop as Buyer',
    'shop_as_wholeseller': 'Shop as Wholeseller',
    
    // Buyer Home
    'welcome_buyer': 'Welcome to MonsterMen90',
    'discover_clothing': 'Discover premium clothing for modern men and women',
    'my_orders': 'My Orders',
    'featured_products': 'Featured Products',
    'view_all': 'View All',
    'shop_by_category_buyer': 'Shop by Category',
    'no_products_available': 'No products available yet',
    'admin_team_adding': 'Our admin team is adding new products. Check back soon!',
    'admin_login': 'Admin Login',
    'men_collection': 'Men Collection',
    'men_collection_desc': 'Shirts, Jeans, T-Shirts, Jackets & more premium clothing for men',
    'shop_now': 'Shop Now',
    'women_collection': 'Women Collection',
    'women_collection_desc': 'Tops, Dresses, Ethnic wear, Bottoms & more for women',
    
    // Cart
    'shopping_cart': 'Shopping Cart',
    'your_cart_empty': 'Your cart is empty 🛒',
    'remove': 'Remove',
    'proceed_to_checkout': 'Proceed to Checkout',
    'total': 'Total',
    
    // Checkout
    'shipping_details': 'Shipping Details',
    'full_name': 'Full Name',
    'phone_number': 'Phone Number',
    'full_address': 'Full Address',
    'city': 'City',
    'pincode': 'Pincode',
    'order_summary': 'Order Summary',
    'place_order': 'Place Order',
    'fill_all_details': 'Please fill all details',
    'go_to_buyer_dashboard': 'Go to Buyer Dashboard',
    
    // Orders
    'my_orders_page': 'My Orders',
    'no_orders_yet': 'No orders yet',
    
    // Collections
    'men_collection_page': 'Men Collection',
    'discover_men_fashion': 'Discover our premium collection of men\'s fashion - {count} products',
    'women_collection_page': 'Women Collection',
    'discover_women_fashion': 'Discover our elegant collection of women\'s fashion - {count} products',
    'product_type': 'Product Type',
    'all_types': 'All Types',
    'sort_by': 'Sort By',
    'newest_first': 'Newest First',
    'price_low_high': 'Price: Low to High',
    'price_high_low': 'Price: High to Low',
    'name_a_z': 'Name: A to Z',
    'clear_filters': 'Clear Filters',
    'error_loading_products': 'Error Loading Products',
    'try_again': 'Try Again',
    'no_products_found': 'No products found',
    'try_adjusting_search': 'Try adjusting your search or filter criteria',
    'no_mens_products': 'No men\'s products available at the moment',
    'no_womens_products': 'No women\'s products available at the moment',
    
    // Product Card
    'featured': 'Featured',
    'wholesale': 'Wholesale',
    'retail_price': 'Retail Price:',
    'wholesale_price': 'Wholesale Price (20% off):',
    'min_order': 'Min. Order:',
    'pieces': 'pieces',
    'view': 'View',
    'add_to_cart': 'Add to Cart',
    'view_details': 'View Details',
    'add_to_bulk_cart': 'Add to Bulk Cart',
    'bulk_savings': 'Bulk savings:',
    'per_piece': 'per piece',
    'no_image': 'No Image',
    
    // Order Success
    'order_placed_successfully': '🎉 Order Placed Successfully',
    'thank_you_shopping': 'Thank you for shopping with MonsterMen90',
    'continue_shopping': 'Continue Shopping',
    
    // Wholesaler
    'wholesaler_dashboard': 'Wholesaler Dashboard',
    'bulk_purchase_desc': 'Bulk purchase – minimum order 20 pieces per product • {count} products available',
    'all_genders': 'All Genders',
    'unisex': 'Unisex',
    'no_wholesale_products': 'No wholesale products available at the moment',
  },
  hi: {
    // Common
    'loading': 'लोड हो रहा है...',
    'error': 'त्रुटि',
    'success': 'सफल',
    'cancel': 'रद्द करें',
    'save': 'सहेजें',
    'delete': 'हटाएं',
    'edit': 'संपादित करें',
    'back': 'वापस',
    'next': 'अगला',
    'previous': 'पिछला',
    'search': 'खोजें',
    'filter': 'फ़िल्टर',
    'clear': 'साफ़ करें',
    'apply': 'लागू करें',
    'close': 'बंद करें',
    'open': 'खोलें',
    'yes': 'हाँ',
    'no': 'नहीं',
    
    // Header
    'hello': 'नमस्ते',
    'sign_in': 'साइन इन करें',
    'sign_out': 'साइन आउट',
    'accounts': 'खाते',
    'accounts_lists': 'खाते और सूचियां',
    'hello_sign_in': 'नमस्ते, साइन इन करें',
    'cart': 'कार्ट',
    'search_products': 'उत्पाद खोजें...',
    'all': 'सभी',
    'men': 'पुरुष',
    'women': 'महिलाएं',
    'trending': 'ट्रेंडिंग',
    'bestsellers': 'बेस्टसेलर',
    'new_releases': 'नई रिलीज़',
    'shop_by_category': 'श्रेणी के अनुसार खरीदारी करें',
    'mens_fashion': 'पुरुष फैशन',
    'womens_fashion': 'महिला फैशन',
    'account_info': 'खाता जानकारी',
    'dashboard': 'डैशबोर्ड',
    
    // Hero/Landing
    'welcome_to_monstermen90': 'MonsterMen90 में आपका स्वागत है',
    'choose_how_shop': 'चुनें कि आप कैसे खरीदारी करना चाहते हैं',
    'shop_as_buyer': 'खरीदार के रूप में खरीदें',
    'shop_as_wholeseller': 'थोक विक्रेता के रूप में खरीदें',
    
    // Buyer Home
    'welcome_buyer': 'MonsterMen90 में आपका स्वागत है',
    'discover_clothing': 'आधुनिक पुरुषों और महिलाओं के लिए प्रीमियम कपड़े खोजें',
    'my_orders': 'मेरे ऑर्डर',
    'featured_products': 'फ़ीचर्ड प्रोडक्ट्स',
    'view_all': 'सभी देखें',
    'shop_by_category_buyer': 'श्रेणी के अनुसार खरीदारी करें',
    'no_products_available': 'अभी तक कोई प्रोडक्ट उपलब्ध नहीं है',
    'admin_team_adding': 'हमारी एडमिन टीम नए प्रोडक्ट्स जोड़ रही है। जल्द ही वापस आएं!',
    'admin_login': 'एडमिन लॉगिन',
    'men_collection': 'पुरुष संग्रह',
    'men_collection_desc': 'पुरुषों के लिए शर्ट, जीन्स, टी-शर्ट, जैकेट और अन्य प्रीमियम कपड़े',
    'shop_now': 'अभी खरीदें',
    'women_collection': 'महिला संग्रह',
    'women_collection_desc': 'महिलाओं के लिए टॉप्स, ड्रेसेस, एथनिक वियर, बॉटम्स और अन्य',
    
    // Cart
    'shopping_cart': 'शॉपिंग कार्ट',
    'your_cart_empty': 'आपका कार्ट खाली है 🛒',
    'remove': 'हटाएं',
    'proceed_to_checkout': 'चेकआउट पर जाएं',
    'total': 'कुल',
    
    // Checkout
    'shipping_details': 'शिपिंग विवरण',
    'full_name': 'पूरा नाम',
    'phone_number': 'फोन नंबर',
    'full_address': 'पूरा पता',
    'city': 'शहर',
    'pincode': 'पिनकोड',
    'order_summary': 'ऑर्डर सारांश',
    'place_order': 'ऑर्डर करें',
    'fill_all_details': 'कृपया सभी विवरण भरें',
    'go_to_buyer_dashboard': 'खरीदार डैशबोर्ड पर जाएं',
    
    // Orders
    'my_orders_page': 'मेरे ऑर्डर',
    'no_orders_yet': 'अभी तक कोई ऑर्डर नहीं',
    
    // Collections
    'men_collection_page': 'पुरुष संग्रह',
    'discover_men_fashion': 'हमारे प्रीमियम पुरुष फैशन संग्रह को खोजें - {count} प्रोडक्ट्स',
    'women_collection_page': 'महिला संग्रह',
    'discover_women_fashion': 'हमारे स्टाइलिश महिला फैशन संग्रह को खोजें - {count} प्रोडक्ट्स',
    'product_type': 'प्रोडक्ट प्रकार',
    'all_types': 'सभी प्रकार',
    'sort_by': 'इसके अनुसार क्रमबद्ध करें',
    'newest_first': 'नवीनतम पहले',
    'price_low_high': 'कीमत: कम से अधिक',
    'price_high_low': 'कीमत: अधिक से कम',
    'name_a_z': 'नाम: A से Z',
    'clear_filters': 'फ़िल्टर साफ़ करें',
    'error_loading_products': 'प्रोडक्ट्स लोड करने में त्रुटि',
    'try_again': 'पुनः प्रयास करें',
    'no_products_found': 'कोई प्रोडक्ट नहीं मिला',
    'try_adjusting_search': 'अपनी खोज या फ़िल्टर मानदंड समायोजित करने का प्रयास करें',
    'no_mens_products': 'इस समय कोई पुरुष प्रोडक्ट्स उपलब्ध नहीं हैं',
    'no_womens_products': 'इस समय कोई महिला प्रोडक्ट्स उपलब्ध नहीं हैं',
    
    // Product Card
    'featured': 'फ़ीचर्ड',
    'wholesale': 'थोक',
    'retail_price': 'रिटेल कीमत:',
    'wholesale_price': 'थोक कीमत (20% छूट):',
    'min_order': 'न्यूनतम ऑर्डर:',
    'pieces': 'टुकड़े',
    'view': 'देखें',
    'add_to_cart': 'कार्ट में जोड़ें',
    'view_details': 'विवरण देखें',
    'add_to_bulk_cart': 'बल्क कार्ट में जोड़ें',
    'bulk_savings': 'बल्क बचत:',
    'per_piece': 'प्रति टुकड़ा',
    'no_image': 'कोई छवि नहीं',
    
    // Order Success
    'order_placed_successfully': '🎉 ऑर्डर सफलतापूर्वक रखा गया',
    'thank_you_shopping': 'MonsterMen90 के साथ खरीदारी करने के लिए धन्यवाद',
    'continue_shopping': 'खरीदारी जारी रखें',
    
    // Wholesaler
    'wholesaler_dashboard': 'थोक विक्रेता डैशबोर्ड',
    'bulk_purchase_desc': 'बल्क खरीदारी - प्रति प्रोडक्ट न्यूनतम 20 टुकड़े का ऑर्डर • {count} प्रोडक्ट्स उपलब्ध',
    'all_genders': 'सभी लिंग',
    'unisex': 'यूनिसेक्स',
    'no_wholesale_products': 'इस समय कोई थोक प्रोडक्ट्स उपलब्ध नहीं हैं',
  }
};

interface LanguageContextType {
  language: 'en' | 'hi';
  setLanguage: (lang: 'en' | 'hi') => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<'en' | 'hi'>('en');

  const t = (key: string, params?: Record<string, string | number>): string => {
    let translation = translations[language][key as keyof typeof translations['en']] || key;
    
    // Replace parameters in translation
    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        translation = translation.replace(`{${param}}`, String(value));
      });
    }
    
    return translation;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}