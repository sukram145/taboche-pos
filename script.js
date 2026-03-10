// ===== GLOBAL VARIABLES =====
let tables = JSON.parse(localStorage.getItem('tables')) || {};
let salesData = JSON.parse(localStorage.getItem('salesData')) || {
    totalSales: 0,
    totalDiscounts: 0,
    totalOrders: 0,
    cashSales: 0,
    mobileSales: 0,
    cardSales: 0,
    items: []
};
let orderHistory = JSON.parse(localStorage.getItem('orderHistory')) || [];
let voidHistory = JSON.parse(localStorage.getItem('voidHistory')) || [];
let removalHistory = JSON.parse(localStorage.getItem('removalHistory')) || [];
let selectedTable = null;
let isVoidMode = false;
let pendingRemoval = null;

// ===== SECURE LOGIN CREDENTIALS =====
const VALID_USERNAME = "taboche";
const VALID_PASSWORD = "123456";

// ===== USER ROLE MANAGEMENT =====
let currentUser = {
    name: 'Guest',
    role: 'guest',
    loggedIn: false
};

// Try to load saved user from localStorage
try {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        const parsed = JSON.parse(savedUser);
        if (parsed && parsed.loggedIn) {
            currentUser = parsed;
        }
    }
} catch (e) {
    console.log('No saved user found');
}

// Permission mappings - Staff has FULL access, Guests have NO access
const permissions = {
    guest: {
        canViewTables: false,
        canViewMenu: false,
        canAddItems: false,
        canRemoveItems: false,
        canVoid: false,
        canChangeTable: false,
        canFinalize: false,
        canCheckout: false,
        canPrint: false,
        canAddExtra: false,
        canViewReports: false,
        canManageTables: false,
        canViewOrderSummary: false
    },
    staff: {
        canViewTables: true,
        canViewMenu: true,
        canAddItems: true,
        canRemoveItems: true,
        canVoid: true,
        canChangeTable: true,
        canFinalize: true,
        canCheckout: true,
        canPrint: true,
        canAddExtra: true,
        canViewReports: true,
        canManageTables: true,
        canViewOrderSummary: true
    }
};

// ===== MENU ITEMS DATABASE =====
const menuItems = [
// Retail Items
{ name: "Butterfly Pea Packet", price: 350, category: "Retail", image: "butterfly_peaPKT.jpg", hasImage: true },
{ name: "Calming Tea Packet", price: 400, category: "Retail", image: "calming_teaPKT.jpg", hasImage: true },
{ name: "Chamomile Packet", price: 350, category: "Retail", image: "chamomilePKT.jpg", hasImage: true },
{ name: "Coffee Packet (500gm)", price: 1350, category: "Retail", image: "coffee_bagPKT.jpg", hasImage: true },
{ name: "Coffee Packet (250gm)", price: 950, category: "Retail", image: "coffee_bagPKT.jpg", hasImage: true },
{ name: "Coffee Packet (100gm)", price: 500, category: "Retail", image: "coffee_bagPKT.jpg", hasImage: true },
{ name: "Herbal Tea Packet", price: 300, category: "Retail", image: "herbal_teaPKT.jpg", hasImage: true },
{ name: "Hibiscus Packet", price: 450, category: "Retail", image: "hibiscusPKT.jpg", hasImage: true },
{ name: "Lavender Packet", price: 300, category: "Retail", image: "lavenderPKT.jpg", hasImage: true },
{ name: "Peppermint Packet", price: 300, category: "Retail", image: "peppermintPKT.jpg", hasImage: true },
{ name: "Spearmint Packet", price: 300, category: "Retail", image: "spearmintPKT.jpg", hasImage: true },
{ name: "Floral Delight Packet", price: 450, category: "Retail", image: "floral_delightPKT.jpg", hasImage: true },
{ name: "Himalayan Tea Packet", price: 300, category: "Retail", image: "himalayan_teaPKT.jpg", hasImage: true },
{ name: "Strainer 1", price: 250, category: "Retail", image: "strainer1.jpg", hasImage: true },
{ name: "Strainer 2", price: 300, category: "Retail", image: "strainer2.jpg", hasImage: true },
{ name: "Strainer 3", price: 450, category: "Retail", image: "strainer3.jpg", hasImage: true },
    // Bakery Items
    { name: "Chocolate Muffin", price: 150, category: "Bakery", image: "chocolate_muffin.jpg", hasImage: true },
    { name: "Banana Muffin", price: 150, category: "Bakery", image: "banana_muffin.jpg", hasImage: true },
    { name: "Brownie Walnut", price: 200, category: "Bakery", image: "brownie_walnut.jpg", hasImage: true },
    { name: "chicken patties", price: 100, category: "Bakery", image: "chicken_patties.jpg", hasImage: true },
    
    // Misc Items
    { name: "Shikar Ice", price: 25, category: "misc", image: "shikar_ICE.jpg", hasImage: true },
    { name: "Surya Red", price: 30, category: "misc", image: "surya_red.jpg", hasImage: true },
    { name: "Artice Brust", price: 30, category: "misc", image: "artice_brust.jpg", hasImage: true },
    { name: "Surya Light", price: 30, category: "misc", image: "surya_light.jpg", hasImage: true },
    { name: "Water", price: 50, category: "misc", image: "water.jpg", hasImage: true },
    { name: "Hukka", price: 550, category: "misc", image: "hukka.jpg", hasImage: true },
    { name: "Juju Dhau", price: 85, category: "misc", image: "juju_dhau.jpg", hasImage: true },

    // Breakfast Items
    { name: "Boiled Egg", price: 120, category: "Breakfast", image: "boiled_egg.jpg", hasImage: true },
    { name: "Chicken Burger", price: 370, category: "Breakfast", image: "chicken_burger.jpg", hasImage: true },
    { name: "Chicken Sandwich", price: 350, category: "Breakfast", image: "chicken_sandwich.jpg", hasImage: true },
    { name: "Masala Omelet", price: 120, category: "Breakfast", image: "masala_omelet.jpg", hasImage: true },
    { name: "Omelet Plain", price: 120, category: "Breakfast", image: "omelet_plain.jpg", hasImage: true },
    { name: "Sausage Boiled", price: 120, category: "Breakfast", image: "sausage_boiled.jpg", hasImage: true },
    { name: "Toast", price: 100, category: "Breakfast", image: "toast.jpg", hasImage: true },
    { name: "Veg Burger", price: 280, category: "Breakfast", image: "veg_burger.jpg", hasImage: true },
    { name: "Veg Sandwich", price: 300, category: "Breakfast", image: "veg_sandwich.jpg", hasImage: true },
    { name: "Buff Burger", price: 350, category: "Breakfast", image: "buff_burger.jpg", hasImage: true },
    // Fast Food Items
    { name: "Chips Chilly", price: 360, category: "Fast Food", image: "chips_chilly.jpg", hasImage: true },
    { name: "Chi Sausage", price: 300, category: "Fast Food", image: "chi_sausage.jpg", hasImage: true },
    { name: "Buff Sausage", price: 300, category: "Fast Food", image: "buff_sausage.jpg", hasImage: true },
    { name: "Buff Chilly Momo", price: 280, category: "Fast Food", image: "buff_chilly_momo.jpg", hasImage: true },
    { name: "Buff Fried Rice", price: 320, category: "Fast Food", image: "buff_fried_rice.jpg", hasImage: true },
    { name: "Buff Jhol Momo", price: 250, category: "Fast Food", image: "buff_jhol_momo.jpg", hasImage: true },
    { name: "Buff Momo", price: 200, category: "Fast Food", image: "buff_momo.jpg", hasImage: true },
    { name: "Buff Wraps", price: 280, category: "Fast Food", image: "wraps_buff.jpg", hasImage: true },
    { name: "Chicken Chilly Momo", price: 300, category: "Fast Food", image: "chicken_chilly_momo.jpg", hasImage: true },
    { name: "Chicken Fried Rice", price: 340, category: "Fast Food", image: "chicken_fried_rice.jpg", hasImage: true },
    { name: "Chicken Jhol Momo", price: 250, category: "Fast Food", image: "chicken_jhol_momo.jpg", hasImage: true },
    { name: "Chicken Momo", price: 220, category: "Fast Food", image: "chicken_momo.jpg", hasImage: true },
    { name: "Chicken Wraps", price: 300, category: "Fast Food", image: "wraps_chicken.jpg", hasImage: true },
    { name: "Crispy Corn", price: 250, category: "Fast Food", image: "crispy_corn.jpg", hasImage: true },
    { name: "Egg Fried Rice", price: 280, category: "Fast Food", image: "egg_fried_rice.jpg", hasImage: true },
    { name: "Fries", price: 350, category: "Fast Food", image: "fries.jpg", hasImage: true },
    { name: "Spicy Wings", price: 480, category: "Fast Food", image: "spicy_wings.jpg", hasImage: true },
    { name: "Veg Burger", price: 280, category: "Fast Food", image: "burger_veg.jpg", hasImage: true },
    { name: "Veg Chilly", price: 280, category: "Fast Food", image: "veg_chilly.jpg", hasImage: true },
    { name: "Veg Fried Rice", price: 200, category: "Fast Food", image: "veg_fried_rice.jpg", hasImage: true },
    { name: "Veg Jhol Momo", price: 220, category: "Fast Food", image: "veg_jhol_momo.jpg", hasImage: true },
    { name: "Veg Momo", price: 180, category: "Fast Food", image: "veg_momo.jpg", hasImage: true },
    { name: "Veg Wraps", price: 250, category: "Fast Food", image: "wraps_veg.jpg", hasImage: true },
    { name: "Buff Chili", price: 340, category: "Fast Food", image: "buff_chili.jpg", hasImage: true },
    { name: "Chicken Chili", price: 360, category: "Fast Food", image: "chicken_chili.jpg", hasImage: true },
    { name: "Mushroom Chili", price: 320, category: "Fast Food", image: "mushroom_chili.jpg", hasImage: true },
    { name: "Sausage Chili", price: 330, category: "Fast Food", image: "sausage_chili.jpg", hasImage: true },
    { name: "Veg Kothey Momo", price: 220, category: "Fast Food", image: "kothey_momo_veg.jpg", hasImage: true },
    { name: "Chicken Kothey Momo", price: 250, category: "Fast Food", image: "kothey_momo_chicken.jpg", hasImage: true },
    { name: "Buff Kothey Momo", price: 260, category: "Fast Food", image: "kothey_momo_buff.jpg", hasImage: true },
   
    // Noodles/Pizza Items
    { name: "Buff Chowmein", price: 240, category: "Noodles/Pizza", image: "buff_chowmein.jpg", hasImage: true },
    { name: "Buff Keema Noodles", price: 240, category: "Noodles/Pizza", image: "buff_keema_noodles.jpg", hasImage: true },
    { name: "Buff Thukpa", price: 220, category: "Noodles/Pizza", image: "buff_thukpa.jpg", hasImage: true },
    { name: "Cheese Pizza", price: 470, category: "Noodles/Pizza", image: "cheese_pizza.jpg", hasImage: true },
    { name: "Chicken Chowmein", price: 260, category: "Noodles/Pizza", image: "chicken_chowmein.jpg", hasImage: true },
    { name: "Chicken Keema Noodles", price: 260, category: "Noodles/Pizza", image: "chicken_keema_noodles.jpg", hasImage: true },
    { name: "Chicken Pizza", price: 520, category: "Noodles/Pizza", image: "chicken_pizza.jpg", hasImage: true },
    { name: "Chicken Thukpa", price: 250, category: "Noodles/Pizza", image: "chicken_thukpa.jpg", hasImage: true },
    { name: "Egg Keema Noodles", price: 220, category: "Noodles/Pizza", image: "egg_keema_noodles.jpg", hasImage: true },
    { name: "Egg Thukpa", price: 200, category: "Noodles/Pizza", image: "egg_thukpa.jpg", hasImage: true },
    { name: "Mushroom Keema Noodles", price: 230, category: "Noodles/Pizza", image: "mushroom_keema_noodles.jpg", hasImage: true },
    { name: "Laping (Chips)", price: 95, category: "Noodles/Pizza", image: "laping_chips.jpg", hasImage: true },
    { name: "Laping (Mix)", price: 110, category: "Noodles/Pizza", image: "laping_mix.jpg", hasImage: true },
    { name: "Laping (Noodles)", price: 85, category: "Noodles/Pizza", image: "laping_noodles.jpg", hasImage: true },
    { name: "Mix Pizza", price: 580, category: "Noodles/Pizza", image: "mix_pizza.jpg", hasImage: true },
    { name: "Mix Thukpa", price: 300, category: "Noodles/Pizza", image: "mix_thukpa.jpg", hasImage: true },
    { name: "Mushroom Pizza", price: 490, category: "Noodles/Pizza", image: "mushroom_pizza.jpg", hasImage: true },
    { name: "Veg Chowmein", price: 200, category: "Noodles/Pizza", image: "veg_chowmein.jpg", hasImage: true },
    { name: "Veg Thukpa", price: 180, category: "Noodles/Pizza", image: "veg_thukpa.jpg", hasImage: true },

    // Hot Coffee Items
    { name: "Americano", price: 150, category: "Hot Coffee", image: "americano.jpg", hasImage: true },
    { name: "Cappuccino", price: 170, category: "Hot Coffee", image: "cappuccino.jpg", hasImage: true },
    { name: "Caramel Latte", price: 240, category: "Hot Coffee", image: "latte_caramel.jpg", hasImage: true },
    { name: "Coconut Latte", price: 250, category: "Hot Coffee", image: "coconut_latte.jpg", hasImage: true },
    { name: "Espresso", price: 130, category: "Hot Coffee", image: "espresso.jpg", hasImage: true },
    { name: "Espresso Con Pan", price: 150, category: "Hot Coffee", image: "espresso_con_pan.jpg", hasImage: true },
    { name: "Filter Coffee Hot", price: 280, category: "Hot Coffee", image: "filter_coffee_hot.jpg", hasImage: true },
    { name: "Flat White", price: 150, category: "Hot Coffee", image: "flat_white.jpg", hasImage: true },
    { name: "Hazelnut Latte", price: 240, category: "Hot Coffee", image: "flavored_latte_hazelnut.jpg", hasImage: true },
    { name: "Hot Chocolate", price: 230, category: "Hot Coffee", image: "hot_chocolate.jpg", hasImage: true },
    { name: "Hot Vanilla", price: 230, category: "Hot Coffee", image: "hot_vanilla.jpg", hasImage: true },
    { name: "Latte", price: 170, category: "Hot Coffee", image: "latte.jpg", hasImage: true },
    { name: "lungo", price: 150, category: "Hot Coffee", image: "lungo.jpg", hasImage: true },
    { name: "Mocha Latte", price: 240, category: "Hot Coffee", image: "mocha_latte.jpg", hasImage: true },
    { name: "Rose Latte", price: 250, category: "Hot Coffee", image: "roselatte.jpg", hasImage: true },
    { name: "Spanish Latte", price: 250, category: "Hot Coffee", image: "spanish_latte.jpg", hasImage: true },
    { name: "Vanilla Latte", price: 240, category: "Hot Coffee", image: "latte_vanilla.jpg", hasImage: true },

    // Cold Coffee Items
    { name: "Caramel Milkshake", price: 230, category: "Cold Coffee", image: "milk_shake_caramel.jpg", hasImage: true },
    { name: "Chocolate Milkshake", price: 230, category: "Cold Coffee", image: "milk_shake_chocolate.jpg", hasImage: true },
    { name: "Filter Coffee Cold", price: 300, category: "Cold Coffee", image: "filter_coffee_cold.jpg", hasImage: true },
    { name: "Hazelnut Milkshake", price: 230, category: "Cold Coffee", image: "milk_shake_hazelnut.jpg", hasImage: true },
    { name: "Iced Americano", price: 190, category: "Cold Coffee", image: "iced_americano.jpg", hasImage: true },
    { name: "Iced Caramel Latte", price: 240, category: "Cold Coffee", image: "iced_caramel_latte.jpg", hasImage: true },
    { name: "Iced Hazelnut Latte", price: 240, category: "Cold Coffee", image: "iced_hazelnut_latte.jpg", hasImage: true },
    { name: "Iced Latte", price: 200, category: "Cold Coffee", image: "iced_latte.jpg", hasImage: true },
    { name: "Iced Vanilla Latte", price: 240, category: "Cold Coffee", image: "iced_vanilla_latte.jpg", hasImage: true },
    { name: "Vanilla Milkshake", price: 230, category: "Cold Coffee", image: "milk_shake_vanilla.jpg", hasImage: true },
    
    // Blended Items
    { name: "Caramel Frappe", price: 300, category: "Blended", image: "frappe_crushed_caramel.jpg", hasImage: true },
    { name: "Crunchy Mocha", price: 350, category: "Blended", image: "crunchy_mocha.jpg", hasImage: true },
    { name: "Hazelnut Frappe", price: 300, category: "Blended", image: "frappe_crushed_hazelnut.jpg", hasImage: true },
    { name: "KitKat Blended", price: 320, category: "Blended", image: "alternate_kitkat.jpg", hasImage: true },
    { name: "Mocha Frappe", price: 300, category: "Blended", image: "frappe_crushed_mocha.jpg", hasImage: true },
    { name: "Oreo Blended", price: 320, category: "Blended", image: "alternate_oreo.jpg", hasImage: true },
    { name: "Strawberry Blended", price: 320, category: "Blended", image: "alternate_strawberry.jpg", hasImage: true },
    { name: "Vanilla Frappe", price: 300, category: "Blended", image: "frappe_crushed_vanilla.jpg", hasImage: true },

    // Mojito/Ice Tea Items 
    { name: "Apple Iced Tea", price: 300, category: "Mojito/Ice Tea", image: "iced_tea_apple.jpg", hasImage: true },
    { name: "Banana Lassi", price: 200, category: "Mojito/Ice Tea", image: "lassi_banana.jpg", hasImage: true },
    { name: "Blueberry Mojito", price: 280, category: "Mojito/Ice Tea", image: "blueberry_mojito.jpg", hasImage: true },
    { name: "Flavoured Soda", price: 250, category: "Mojito/Ice Tea", image: "flavoured_soda.jpg", hasImage: true },
    { name: "Hibiscus Iced Tea", price: 250, category: "Mojito/Ice Tea", image: "iced_tea_hibiscus.jpg", hasImage: true },
    { name: "Lemon Iced Tea", price: 220, category: "Mojito/Ice Tea", image: "iced_tea_lemon.jpg", hasImage: true },
    { name: "Lemon Lemonade", price: 210, category: "Mojito/Ice Tea", image: "lemonade_lemon.jpg", hasImage: true },
    { name: "Mango Lassi", price: 200, category: "Mojito/Ice Tea", image: "lassi_mango.jpg", hasImage: true },
    { name: "Mango Lemonade", price: 260, category: "Mojito/Ice Tea", image: "lemonade_mango.jpg", hasImage: true },
    { name: "Mango Mojito", price: 280, category: "Mojito/Ice Tea", image: "mango_mojito.jpg", hasImage: true },
    { name: "Matcha Flavours", price: 350, category: "Mojito/Ice Tea", image: "matcha_flavours.jpg", hasImage: true },
    { name: "Matcha Iced Tea", price: 300, category: "Mojito/Ice Tea", image: "iced_tea_matcha.jpg", hasImage: true },
    { name: "Mint Lemonade", price: 220, category: "Mojito/Ice Tea", image: "mint_lemonade.jpg", hasImage: true },
    { name: "Passion Fruit Mojito", price: 280, category: "Mojito/Ice Tea", image: "passion_fruit_mojito.jpg", hasImage: true },
    { name: "Peach Iced Tea", price: 220, category: "Mojito/Ice Tea", image: "iced_tea_peach.jpg", hasImage: true },
    { name: "Peach Lemonade", price: 250, category: "Mojito/Ice Tea", image: "lemonade_peach.jpg", hasImage: true },
    { name: "Strawberry Lemonade", price: 260, category: "Mojito/Ice Tea", image: "lemonade_strawberry.jpg", hasImage: true },
    { name: "Strawberry Mojito", price: 270, category: "Mojito/Ice Tea", image: "strawberry_mojito.jpg", hasImage: true },
    { name: "Sweet Lassi", price: 180, category: "Mojito/Ice Tea", image: "lassi_sweet.jpg", hasImage: true },
    { name: "Virgin Mojito", price: 210, category: "Mojito/Ice Tea", image: "virgin_mojito.jpg", hasImage: true },
    
    // Soft Drink Items
    { name: "Apple Juice", price: 300, category: "Soft Drink", image: "apple_juice.jpg", hasImage: true },
    { name: "Bubble Tea", price: 250, category: "Soft Drink", image: "bubble-tea.jpg", hasImage: true },
    { name: "Coke", price: 95, category: "Soft Drink", image: "coke.jpg", hasImage: true },
    { name: "Fanta", price: 95, category: "Soft Drink", image: "fanta.jpg", hasImage: true },
    { name: "Orange Juice", price: 300, category: "Soft Drink", image: "orange_juice.jpg", hasImage: true },
    { name: "Sprite", price: 95, category: "Soft Drink", image: "sprite.jpg", hasImage: true },
    { name: "T/A Bubble Tea", price: 300, category: "Soft Drink", image: "ta-bubble-tea.jpg", hasImage: true },
    
    // Tea Items
    { name: "Black Rosella", price: 150, category: "Tea", image: "black_rosella.jpg", hasImage: true },
    { name: "Butterfly Tea", price: 180, category: "Tea", image: "butterfly.jpg", hasImage: true },
    { name: "Calming Tea", price: 200, category: "Tea", image: "calming_tea.jpg", hasImage: true },
    { name: "Chamomile Tea", price: 150, category: "Tea", image: "chamomile.jpg", hasImage: true },
    { name: "Earl Grey", price: 150, category: "Tea", image: "earl_grey.jpg", hasImage: true },
    { name: "Floral Delight", price: 200, category: "Tea", image: "floral_delight.jpg", hasImage: true },
    { name: "Ginger Honey Lemon", price: 130, category: "Tea", image: "ginger_honey_hot_lemon.jpg", hasImage: true },
    { name: "Green Tea", price: 120, category: "Tea", image: "green_tea.jpg", hasImage: true },
    { name: "Hibiscus Tea", price: 180, category: "Tea", image: "hibiscus.jpg", hasImage: true },
    { name: "Himalayan Green Tea", price: 150, category: "Tea", image: "himalayan_green_tea.jpg", hasImage: true },
    { name: "Himalayan Herbal", price: 150, category: "Tea", image: "himalayan_herbal.jpg", hasImage: true },
    { name: "Himalayan Pearl Tea", price: 120, category: "Tea", image: "himalayan_pearl_black_tea.jpg", hasImage: true },
    { name: "Honey Hot Lemon", price: 125, category: "Tea", image: "honey_hot_lemon.jpg", hasImage: true },
    { name: "Hot Lemon", price: 75, category: "Tea", image: "hot_lemon.jpg", hasImage: true },
    { name: "Illam Lemon Grass", price: 150, category: "Tea", image: "illam_with_lemon_grass.jpg", hasImage: true },
    { name: "Jasmine Tea", price: 150, category: "Tea", image: "jasmine.jpg", hasImage: true },
    { name: "Lavender Rose", price: 220, category: "Tea", image: "flower_tea.jpg", hasImage: true },
    { name: "Lemon Tea", price: 150, category: "Tea", image: "lemon_tea.jpg", hasImage: true },
    { name: "Midnight Red Rose", price: 200, category: "Tea", image: "midnight_red_rose.jpg", hasImage: true },
    { name: "Organic Black Tea", price: 100, category: "Tea", image: "organic_black_tea.jpg", hasImage: true },
    { name: "Pearl Green Tea", price: 150, category: "Tea", image: "pearl_green_tea.jpg", hasImage: true },
    { name: "Peppermint Tea", price: 150, category: "Tea", image: "peppermint.jpg", hasImage: true },
    { name: "Spearmint Tea", price: 150, category: "Tea", image: "spearmint.jpg", hasImage: true }
];

// Categories with icons
const categories = [
    { name: "All", icon: "fa-solid fa-utensils", filter: "all" },
    { name: "Misc", icon: "fa-solid fa-box", filter: "misc" },
    { name: "Breakfast", icon: "fa-solid fa-egg", filter: "Breakfast" },
    { name: "Fast Food", icon: "fa-solid fa-burger", filter: "Fast Food" },
    { name: "Noodles/Pizza", icon: "fa-solid fa-pizza-slice", filter: "Noodles/Pizza" },
    { name: "Hot Coffee", icon: "fa-solid fa-mug-hot", filter: "Hot Coffee" },
    { name: "Cold Coffee", icon: "fa-solid fa-mug-saucer", filter: "Cold Coffee" },
    { name: "Blended", icon: "fa-solid fa-blender", filter: "Blended" },
    { name: "Mojito/Ice Tea", icon: "fa-solid fa-glass-water", filter: "Mojito/Ice Tea" },
    { name: "Soft Drink", icon: "fa-solid fa-bottle-water", filter: "Soft Drink" },
    { name: "Tea", icon: "fa-solid fa-leaf", filter: "Tea" },
    { name: "Bakery", icon: "fa-solid fa-cake-candles", filter: "Bakery" },
    { name: "Retail", icon: "fa-solid fa-store", filter: "Retail" }
];

// Non-discountable items
const nonDiscountableItems = [
    "Shikar Ice", "Surya Red", "Artice Brust", "Surya Light", 
    "Water", "Hukka", "Juju Dhau"
];

// ===== SECURITY FUNCTIONS =====
function checkLoginAndExecute(permission, showMessage = true) {
    if (!currentUser.loggedIn) {
        if (showMessage) {
            showLoginRequiredMessage(permission.replace('can', '').toLowerCase());
        }
        return false;
    }
    
    const perm = permissions[currentUser.role] || permissions.guest;
    
    if (!perm[permission]) {
        if (showMessage) {
            showPermissionError(permission.replace('can', '').toLowerCase());
        }
        return false;
    }
    
    return true;
}

function showLoginRequiredMessage(action) {
    const message = document.createElement('div');
    message.className = 'permission-toast';
    message.style.background = '#dc3545';
    message.innerHTML = `
        <i class="fas fa-lock"></i> 
        Please login as staff to ${action}
        <br>
        <small>Click Login button to continue</small>
    `;
    document.body.appendChild(message);
    
    setTimeout(() => {
        message.remove();
        showLoginDialog();
    }, 1500);
    
    setTimeout(() => {
        message.remove();
    }, 3000);
}

function showPermissionError(action) {
    const toast = document.createElement('div');
    toast.className = 'permission-toast';
    toast.style.background = '#dc3545';
    toast.innerHTML = `<i class="fas fa-ban"></i> You don't have permission to ${action}`;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// ===== UTILITY FUNCTIONS =====
function saveData() {
    localStorage.setItem('tables', JSON.stringify(tables));
    localStorage.setItem('salesData', JSON.stringify(salesData));
    localStorage.setItem('orderHistory', JSON.stringify(orderHistory));
    localStorage.setItem('voidHistory', JSON.stringify(voidHistory));
    localStorage.setItem('removalHistory', JSON.stringify(removalHistory));
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
}

function updateDateTime() {
    const datetimeElem = document.getElementById('datetime');
    if (!datetimeElem) return;
    
    const now = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const day = days[now.getDay()];
    const date = now.toLocaleDateString();
    const time = now.toLocaleTimeString();
    datetimeElem.textContent = `${day}, ${date} ${time}`;
}

// ===== LOGIN FUNCTIONS =====
function showLoginDialog() {
    const dialog = document.getElementById('login-dialog');
    if (dialog) {
        document.getElementById('login-username').value = "taboche";
        document.getElementById('login-password').value = "";
        document.getElementById('login-error').style.display = 'none';
        dialog.classList.add('visible');
    }
}

function closeLoginDialog() {
    const dialog = document.getElementById('login-dialog');
    if (dialog) {
        dialog.classList.remove('visible');
    }
}

function loginWithCredentials() {
    console.log("Login function called");
    const username = document.getElementById('login-username')?.value || '';
    const password = document.getElementById('login-password')?.value || '';
    
    if (username === VALID_USERNAME && password === VALID_PASSWORD) {
        console.log("Login successful");
        
        currentUser = {
            name: 'Taboche Staff',
            role: 'staff',
            loggedIn: true
        };
        
        saveData();
        updateUIBasedOnRole();
        closeLoginDialog();
        renderTables();
        renderMenu();
        
        showSuccessMessage('Login Successful', 'Welcome Taboche Staff');
    } else {
        console.log("Login failed");
        document.getElementById('login-error').style.display = 'block';
    }
}

window.handleLogin = loginWithCredentials;

function logout() {
    currentUser = {
        name: 'Guest',
        role: 'guest',
        loggedIn: false
    };
    
    selectedTable = null;
    
    saveData();
    updateUIBasedOnRole();
    updateOrderSummary();
    
    const tablesDashboard = document.getElementById('tables-dashboard');
    if (tablesDashboard) tablesDashboard.innerHTML = '';
    
    const menuContainer = document.getElementById('menu');
    if (menuContainer) menuContainer.innerHTML = '';
    
    showSuccessMessage('Logged out', 'You are now in guest mode');
}

function showSuccessMessage(title, message) {
    const toast = document.createElement('div');
    toast.className = 'permission-toast';
    toast.style.background = '#28a745';
    toast.innerHTML = `
        <i class="fas fa-check-circle"></i> 
        ${title}<br>
        <small>${message}</small>
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// ===== UI VISIBILITY BASED ON LOGIN =====
function updateUIBasedOnRole() {
    const role = currentUser.role;
    const body = document.body;
    const userSpan = document.getElementById('current-user');
    const roleBadge = document.getElementById('role-badge');
    const loginBtnText = document.getElementById('login-btn-text');
    const logoutBtn = document.getElementById('logout-btn');
    const posContainer = document.querySelector('.pos-container');
    const overlay = document.getElementById('login-overlay');
    const fabButton = document.getElementById('fab-button');
    
    if (userSpan) {
        userSpan.textContent = currentUser.name;
    }
    
    if (roleBadge) {
        if (currentUser.loggedIn) {
            roleBadge.style.display = 'inline-flex';
            roleBadge.className = `role-badge ${role}`;
            roleBadge.innerHTML = `<i class="fas fa-user-tie"></i> Staff`;
        } else {
            roleBadge.style.display = 'none';
        }
    }
    
    if (loginBtnText) {
        loginBtnText.textContent = currentUser.loggedIn ? 'Switch User' : 'Login';
    }
    
    if (logoutBtn) {
        logoutBtn.style.display = currentUser.loggedIn ? 'flex' : 'none';
    }
    
    if (overlay) {
        overlay.style.display = currentUser.loggedIn ? 'none' : 'flex';
    }
    
    if (fabButton) {
        fabButton.style.display = (currentUser.loggedIn && window.innerWidth <= 768) ? 'flex' : 'none';
    }
    
    body.classList.remove('guest-mode', 'staff-mode');
    body.classList.add(`${currentUser.role}-mode`);
    
    if (posContainer) {
        posContainer.style.display = currentUser.loggedIn ? 'flex' : 'none';
    }
    
    updateOrderSummary();
}

// ===== REMOVE REASON FUNCTIONS =====
function removeFromOrder(name) {
    if (!checkLoginAndExecute('canRemoveItems')) return;
    
    if (!selectedTable) {
        alert("Please select a table first!");
        return;
    }
    
    pendingRemoval = name;
    showRemoveReasonDialog();
}

function showRemoveReasonDialog() {
    const dialog = document.getElementById('remove-reason-dialog');
    if (!dialog) return;
    
    document.getElementById('removal-reason').value = '';
    dialog.classList.add('visible');
}

function closeRemoveReasonDialog() {
    const dialog = document.getElementById('remove-reason-dialog');
    if (!dialog) return;
    
    dialog.classList.remove('visible');
    pendingRemoval = null;
}

function setReason(reason) {
    document.getElementById('removal-reason').value = reason;
}

function submitRemoveWithReason() {
    if (!checkLoginAndExecute('canRemoveItems')) return;
    
    if (!pendingRemoval || !selectedTable) {
        closeRemoveReasonDialog();
        return;
    }
    
    const reason = document.getElementById('removal-reason').value.trim();
    
    if (!reason) {
        alert("Please enter a reason for removal");
        return;
    }
    
    const table = tables[selectedTable];
    const item = table.order[pendingRemoval];
    
    if (!item) {
        closeRemoveReasonDialog();
        return;
    }
    
    const removalRecord = {
        id: Date.now(),
        itemName: pendingRemoval,
        quantity: item.quantity,
        price: item.price,
        totalAmount: item.price * item.quantity,
        table: selectedTable,
        reason: reason,
        removedBy: currentUser.name || 'Staff',
        removedAt: new Date().toISOString(),
        timestamp: new Date().toLocaleString()
    };
    
    removalHistory.push(removalRecord);
    
    delete table.order[pendingRemoval];
    
    recalculateTableTotal(table);
    
    if (Object.keys(table.order).length === 0) {
        table.status = "available";
        table.time = null;
        table.discount = 0;
        table.discountedTotal = 0;
        table.payments = [];
    }
    
    saveData();
    updateOrderSummary();
    renderTables();
    
    showRemovalToast(`Item removed: ${pendingRemoval} (×${item.quantity})`, reason);
    
    closeRemoveReasonDialog();
}

function recalculateTableTotal(table) {
    let total = 0;
    Object.values(table.order).forEach(i => {
        total += i.price * i.quantity;
    });
    
    table.totalPrice = parseFloat(total.toFixed(2));
    
    let discountedTotal = 0;
    Object.entries(table.order).forEach(([name, item]) => {
        if (nonDiscountableItems.includes(name)) {
            discountedTotal += item.price * item.quantity;
        } else {
            const discountedPrice = item.price * (1 - (table.discount || 0) / 100);
            discountedTotal += discountedPrice * item.quantity;
            item.discountedPrice = discountedPrice;
        }
    });
    
    table.discountedTotal = parseFloat(discountedTotal.toFixed(2));
}

function showRemovalToast(message, reason) {
    const toast = document.createElement('div');
    toast.className = 'permission-toast';
    toast.style.background = '#dc3545';
    toast.innerHTML = `
        <i class="fas fa-trash-alt"></i> 
        ${message}<br>
        <small>Reason: ${reason}</small>
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function showRemovalHistory() {
    if (!checkLoginAndExecute('canViewReports')) return;
    
    const dialog = document.getElementById('removal-history-dialog');
    const container = document.getElementById('removal-history-container');
    
    if (!dialog || !container) return;
    
    if (removalHistory.length === 0) {
        container.innerHTML = '<p class="empty-history">No removal history available</p>';
    } else {
        container.innerHTML = removalHistory.slice().reverse().map(record => `
            <div class="removal-history-item">
                <div style="display: flex; justify-content: space-between;">
                    <strong>${record.itemName}</strong>
                    <span style="color: #666;">x${record.quantity}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-top: 5px;">
                    <span>Amount: Rs ${record.totalAmount.toFixed(2)}</span>
                    <span>Table: ${record.table}</span>
                </div>
                <div class="removal-reason">
                    <i class="fas fa-comment"></i> Reason: ${record.reason}
                </div>
                <div class="removed-by">
                    <i class="fas fa-user"></i> Removed by: ${record.removedBy} at ${record.timestamp}
                </div>
            </div>
        `).join('');
    }
    
    dialog.classList.add('visible');
}

function closeRemovalHistoryDialog() {
    const dialog = document.getElementById('removal-history-dialog');
    if (dialog) {
        dialog.classList.remove('visible');
    }
}

// ===== INITIALIZE TABLES =====
function initializeTables() {
    const defaultTables = ['1', '2', '3', '4', '5', '6', '7', '8A', '8B', '9A', '9B', '10A', '10B', '10C', '11', '12'];
    
    defaultTables.forEach(table => {
        const tableName = `Table ${table}`;
        if (!tables[tableName]) {
            tables[tableName] = { 
                order: {}, 
                totalPrice: 0, 
                status: "available", 
                payments: [], 
                discount: 0, 
                discountedTotal: 0, 
                time: null,
                newItemsAdded: false
            };
        } else {
            if (!tables[tableName].order) tables[tableName].order = {};
            if (!tables[tableName].payments) tables[tableName].payments = [];
            if (tables[tableName].discount === undefined) tables[tableName].discount = 0;
            if (tables[tableName].discountedTotal === undefined) tables[tableName].discountedTotal = 0;
            
            if (tables[tableName].status === "available" && Object.keys(tables[tableName].order || {}).length > 0) {
                tables[tableName].status = "occupied";
            }
            if (tables[tableName].status === "occupied" && Object.keys(tables[tableName].order || {}).length === 0) {
                tables[tableName].status = "available";
                tables[tableName].totalPrice = 0;
                tables[tableName].discountedTotal = 0;
                tables[tableName].time = null;
            }
        }
    });
    
    if (!salesData.items) {
        salesData.items = [];
    }
    if (!salesData.cardSales) {
        salesData.cardSales = 0;
    }
    
    saveData();
}

// ===== RENDER FUNCTIONS =====
function renderTables() {
    if (!checkLoginAndExecute('canViewTables', false)) return;
    
    const dashboard = document.getElementById('tables-dashboard');
    if (!dashboard) return;
    
    dashboard.innerHTML = '';
    
    Object.keys(tables).sort((a, b) => {
        const numA = parseInt(a.replace('Table ', ''));
        const numB = parseInt(b.replace('Table ', ''));
        return numA - numB;
    }).forEach(table => {
        const info = tables[table];
        const tableBtn = document.createElement('button');
        
        if (info.status === "occupied") {
            tableBtn.className = 'table-btn occupied';
        } else {
            tableBtn.className = 'table-btn available';
        }
        
        const itemCount = Object.keys(info.order || {}).length;
        if (itemCount > 0) {
            tableBtn.innerHTML = `${table}<br><small>${itemCount} ${itemCount === 1 ? 'item' : 'items'}</small>`;
        } else {
            tableBtn.textContent = table;
        }
        
        tableBtn.onclick = () => selectTable(table);
        dashboard.appendChild(tableBtn);
    });
}

function renderCategories() {
    const categoriesContainer = document.getElementById('categories');
    if (!categoriesContainer) return;
    
    categoriesContainer.innerHTML = '';
    
    categories.forEach(cat => {
        const button = document.createElement('button');
        button.innerHTML = `<i class="fas ${cat.icon}"></i> ${cat.name}`;
        button.onclick = () => {
            if (checkLoginAndExecute('canViewMenu')) {
                filterCategory(cat.filter);
            }
        };
        categoriesContainer.appendChild(button);
    });
}

function renderMenu() {
    if (!checkLoginAndExecute('canViewMenu', false)) return;
    
    const menuContainer = document.getElementById('menu');
    if (!menuContainer) return;
    
    menuContainer.innerHTML = '';
    
    const categoryColors = {
        'Retail': '#4A90E2',
        'Bakery': '#F5A623',
        'misc': '#7ED321',
        'Breakfast': '#F8E71C',
        'Fast Food': '#D0021B',
        'Noodles/Pizza': '#9013FE',
        'Hot Coffee': '#8B572A',
        'Cold Coffee': '#417505',
        'Blended': '#BD10E0',
        'Mojito/Ice Tea': '#50E3C2',
        'Soft Drink': '#F5A623',
        'Tea': '#7ED321'
    };
    
    menuItems.forEach(item => {
        const menuItem = document.createElement('div');
        menuItem.className = 'menu-item';
        menuItem.setAttribute('data-name', item.name);
        menuItem.setAttribute('data-price', item.price);
        menuItem.setAttribute('data-category', item.category);
        
        const bgColor = categoryColors[item.category] || '#4A90E2';
        const firstLetter = item.name.charAt(0).toUpperCase();
        
        menuItem.innerHTML = `
            <div class="menu-item-image-container">
                <img src="images/${item.image}" 
                     alt="${item.name}" 
                     class="menu-item-image"
                     onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
                     onload="this.style.display='block'; this.nextElementSibling.style.display='none';">
                <div class="menu-item-icon" style="background-color: ${bgColor}; display: none;">
                    <span class="menu-item-initial">${firstLetter}</span>
                </div>
            </div>
            <p>${item.name}</p>
            <div class="price">Rs ${item.price}</div>
        `;
        
        menuItem.onclick = () => addToOrder(item.name, item.price);
        
        menuContainer.appendChild(menuItem);
    });
}

// ===== TABLE FUNCTIONS =====
function selectTable(table) {
    if (!checkLoginAndExecute('canViewTables')) return;
    
    if (selectedTable && selectedTable !== table && tables[selectedTable]?.newItemsAdded) {
        finalizeOrder(false);
    }
    
    selectedTable = table;
    
    const tableData = tables[selectedTable];
    if (Object.keys(tableData.order || {}).length > 0 && !tableData.time) {
        tableData.time = new Date().toLocaleTimeString();
    } else if (Object.keys(tableData.order || {}).length === 0) {
        tableData.time = null;
        tableData.status = "available";
    }
    
    document.getElementById('selected-table').textContent = table;
    updateOrderSummary();
    renderTables();
    saveData();
}

// ===== ORDER FUNCTIONS =====
function addToOrder(name, price) {
    if (!checkLoginAndExecute('canAddItems')) return;
    
    if (!selectedTable) {
        alert("Please select a table first!");
        return;
    }
    
    if (isVoidMode) {
        voidItem(name);
        isVoidMode = false;
        return;
    }
    
    const table = tables[selectedTable];
    
    if (!table.order) {
        table.order = {};
    }
    
    if (!table.order[name]) {
        table.order[name] = { 
            price: price, 
            quantity: 1, 
            finalized: false,
            timeAdded: Date.now(),
            originalPrice: price,
            discountedPrice: price
        };
    } else {
        table.order[name].quantity += 1;
    }
    
    recalculateTableTotal(table);
    
    table.status = "occupied";
    if (!table.time) {
        table.time = new Date().toLocaleTimeString();
    }
    table.newItemsAdded = true;
    
    const menuItem = document.querySelector(`.menu-item[data-name="${name}"]`);
    if (menuItem) {
        menuItem.classList.add('item-added');
        setTimeout(() => menuItem.classList.remove('item-added'), 300);
    }
    
    updateOrderSummary();
    renderTables();
    saveData();
}

function adjustQuantity(name, delta) {
    if (!checkLoginAndExecute('canRemoveItems')) return;
    
    if (!selectedTable) return;
    
    const table = tables[selectedTable];
    const item = table.order[name];
    
    if (!item || item.finalized) return;
    
    let newQuantity = item.quantity + delta;
    
    if (newQuantity <= 0) {
        pendingRemoval = name;
        showRemoveReasonDialog();
        return;
    }
    
    item.quantity = newQuantity;
    
    recalculateTableTotal(table);
    
    if (Object.keys(table.order).length === 0) {
        table.status = "available";
        table.time = null;
        table.discount = 0;
        table.discountedTotal = 0;
        table.payments = [];
    }
    
    updateOrderSummary();
    renderTables();
    saveData();
}

function voidItem(itemName) {
    if (!checkLoginAndExecute('canVoid')) return;
    
    if (!selectedTable) return;
    
    const reason = prompt("Enter void reason:", "");
    if (!reason) return;
    
    const table = tables[selectedTable];
    const item = table.order[itemName];
    
    if (!item) return;
    
    voidHistory.push({
        id: Date.now(),
        name: itemName,
        quantity: item.quantity,
        price: item.price,
        totalAmount: item.price * item.quantity,
        table: selectedTable,
        reason: reason,
        voidedBy: currentUser.name,
        timestamp: new Date().toISOString(),
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString()
    });
    
    delete table.order[itemName];
    
    recalculateTableTotal(table);
    
    if (Object.keys(table.order).length === 0) {
        table.status = "available";
        table.time = null;
        table.discount = 0;
        table.discountedTotal = 0;
        table.payments = [];
    }
    
    saveData();
    updateOrderSummary();
    renderTables();
    
    alert(`Item ${itemName} voided successfully`);
}

// ===== COMMENT FUNCTIONS =====
function promptAndAddComment(itemName) {
    if (!checkLoginAndExecute('canAddItems')) return;
    
    if (!selectedTable) {
        alert("Please select a table first!");
        return;
    }
    
    const comment = prompt("Enter your comment for " + itemName + ":", "");
    if (comment !== null && comment.trim() !== "") {
        addCommentToOrderItem(itemName, comment.trim());
    }
}

function addCommentToOrderItem(itemName, comment) {
    if (!checkLoginAndExecute('canAddItems')) return;
    
    const table = tables[selectedTable];
    if (table && table.order[itemName]) {
        table.order[itemName].comments = comment;
        updateOrderSummary();
        saveData();
        alert("Comment added successfully!");
    }
}

function updateOrderSummary() {
    const selectedTableElem = document.getElementById('selected-table');
    const selectedTimeElem = document.getElementById('selected-time');
    const orderItemsElem = document.getElementById('order-items');
    const totalPriceElem = document.getElementById('total-price');
    
    if (!currentUser.loggedIn) {
        if (selectedTableElem) selectedTableElem.textContent = 'Login Required';
        if (selectedTimeElem) selectedTimeElem.textContent = 'Time: --:--';
        if (orderItemsElem) orderItemsElem.innerHTML = '<li class="empty-order">Please login to view orders</li>';
        if (totalPriceElem) totalPriceElem.textContent = '0';
        return;
    }
    
    if (!selectedTable || !tables[selectedTable]) {
        if (selectedTableElem) selectedTableElem.textContent = 'None';
        if (selectedTimeElem) selectedTimeElem.textContent = 'Time: --:--';
        if (orderItemsElem) orderItemsElem.innerHTML = '<li class="empty-order">Select a table to view order</li>';
        if (totalPriceElem) totalPriceElem.textContent = '0';
        return;
    }
    
    const table = tables[selectedTable];
    
    if (selectedTableElem) selectedTableElem.textContent = selectedTable;
    if (selectedTimeElem) selectedTimeElem.textContent = `Time: ${table.time || '--:--'}`;
    
    displayOrderItems(table.order);
    
    const displayTotal = table.discountedTotal || table.totalPrice || 0;
    if (totalPriceElem) totalPriceElem.textContent = displayTotal.toFixed(2);
}

function displayOrderItems(orderItems) {
    const container = document.getElementById('order-items');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (Object.keys(orderItems).length === 0) {
        container.innerHTML = '<li class="empty-order">No items in order</li>';
        return;
    }
    
    const perm = permissions[currentUser.role] || permissions.guest;
    
    Object.entries(orderItems).forEach(([name, item]) => {
        const li = document.createElement('li');
        li.className = 'order-item';
        if (item.finalized) {
            li.classList.add('finalized');
        }
        
        const displayPrice = item.discountedPrice || item.price;
        const itemTotal = (displayPrice * item.quantity).toFixed(2);
        const originalTotal = (item.price * item.quantity).toFixed(2);
        
        li.innerHTML = `
            <div class="item-info">
                <span class="item-name clickable" onclick="promptAndAddComment('${name}')" title="Click to add comment">
                    ${name} ${item.comments ? ' <i class="fas fa-comment" style="color: #4A90E2;"></i>' : ''}
                </span>
                ${item.comments ? `<span class="item-comments">📝 ${item.comments}</span>` : ''}
                ${displayPrice !== item.price ? `<span class="item-discount">(-${tables[selectedTable]?.discount || 0}%)</span>` : ''}
            </div>
            <div class="item-quantity">
                <button onclick="adjustQuantity('${name}', -1)" ${item.finalized || !perm.canRemoveItems ? 'disabled' : ''}>-</button>
                <span>${item.quantity}</span>
                <button onclick="adjustQuantity('${name}', 1)" ${item.finalized || !perm.canAddItems ? 'disabled' : ''}>+</button>
            </div>
            <span class="item-total">
                ${displayPrice !== item.price ? `<span style="text-decoration: line-through; color: #999; margin-right: 5px;">Rs ${originalTotal}</span>` : ''}
                Rs ${itemTotal}
            </span>
            ${perm.canRemoveItems ? 
                `<button class="remove-item" onclick="removeFromOrder('${name}')" ${item.finalized ? 'disabled' : ''}>
                    <i class="fas fa-trash"></i>
                </button>` : 
                ''}
        `;
        
        container.appendChild(li);
    });
    
    if (window.innerWidth <= 768) {
        enableSwipeToRemove();
    }
}

function finalizeOrder(isManual = true) {
    if (!checkLoginAndExecute('canFinalize')) return false;
    
    if (!selectedTable) {
        if (isManual) alert("Please select a table first!");
        return false;
    }
    
    const table = tables[selectedTable];
    let hasNewItems = false;
    
    Object.values(table.order).forEach(item => {
        if (!item.finalized) {
            item.finalized = true;
            item.finalizedTime = new Date();
            hasNewItems = true;
        }
    });
    
    if (!hasNewItems) {
        if (isManual) alert("No new items to finalize!");
        return false;
    }
    
    table.newItemsAdded = false;
    
    updateOrderSummary();
    saveData();
    
    if (isManual) alert(`Order finalized for ${selectedTable}`);
    return true;
}

// ===== SEARCH AND FILTER =====
function searchMenu() {
    if (!checkLoginAndExecute('canViewMenu', false)) return;
    
    const query = document.getElementById('search').value.toLowerCase();
    const menuItems = document.querySelectorAll('.menu-item');
    
    menuItems.forEach(item => {
        const name = item.getAttribute('data-name').toLowerCase();
        if (name.includes(query)) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

function filterCategory(category) {
    if (!checkLoginAndExecute('canViewMenu', false)) return;
    
    const menuItems = document.querySelectorAll('.menu-item');
    
    menuItems.forEach(item => {
        if (category === 'all' || item.getAttribute('data-category') === category) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
    
    document.querySelectorAll('.categories button').forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent.includes(category === 'all' ? 'All' : category)) {
            btn.classList.add('active');
        }
    });
}

// ===== PAYMENT FUNCTIONS =====
function showPaymentDialog() {
    if (!checkLoginAndExecute('canCheckout')) return;
    
    const dialog = document.getElementById('payment-dialog');
    if (!dialog) return;
    
    updateTotalAmount();
    dialog.classList.add('visible');
    
    if (window.innerWidth <= 768) {
        setTimeout(() => {
            document.getElementById('numeric-input').focus();
        }, 300);
    }
}

function closePaymentDialog() {
    const dialog = document.getElementById('payment-dialog');
    if (!dialog) return;
    
    dialog.classList.remove('visible');
    
    document.getElementById('payment-summary').innerHTML = '';
    document.getElementById('change-amount').textContent = '0';
    document.getElementById('insufficient-amount').classList.add('hidden');
    document.getElementById('numeric-input').value = '';
    
    if (selectedTable && tables[selectedTable]) {
        tables[selectedTable].payments = [];
        tables[selectedTable].discount = 0;
        recalculateTableTotal(tables[selectedTable]);
        saveData();
    }
}

function updateTotalAmount() {
    if (!selectedTable || !tables[selectedTable]) return;
    
    const totalAmountElem = document.getElementById('total-amount');
    if (!totalAmountElem) return;
    
    const total = tables[selectedTable].discountedTotal || tables[selectedTable].totalPrice || 0;
    totalAmountElem.textContent = total.toFixed(2);
}

function addNumber(num) {
    if (!checkLoginAndExecute('canCheckout', false)) return;
    
    const input = document.getElementById('numeric-input');
    input.value += num;
}

function clearInput() {
    if (!checkLoginAndExecute('canCheckout', false)) return;
    
    document.getElementById('numeric-input').value = '';
}

function backspaceInput() {
    if (!checkLoginAndExecute('canCheckout', false)) return;
    
    const input = document.getElementById('numeric-input');
    input.value = input.value.slice(0, -1);
}

function addQuickAmount(amount) {
    if (!checkLoginAndExecute('canCheckout', false)) return;
    
    document.getElementById('numeric-input').value = amount;
}

function addExactAmount() {
    if (!checkLoginAndExecute('canCheckout', false)) return;
    
    if (!selectedTable || !tables[selectedTable]) return;
    const total = tables[selectedTable].discountedTotal || tables[selectedTable].totalPrice || 0;
    document.getElementById('numeric-input').value = total.toFixed(2);
}

function applyDiscount(percentage) {
    if (!checkLoginAndExecute('canCheckout')) return;
    
    if (!selectedTable) {
        alert("Please select a table first!");
        return;
    }
    
    const table = tables[selectedTable];
    table.discount = Math.min(Math.max(percentage, 0), 100);
    
    recalculateTableTotal(table);
    
    updateTotalAmount();
    updateOrderSummary();
    saveData();
}

function addPayment(method) {
    if (!checkLoginAndExecute('canCheckout')) return;
    
    if (!selectedTable) return;
    
    const input = document.getElementById('numeric-input');
    const amount = parseFloat(input.value) || 0;
    const table = tables[selectedTable];
    const totalPaid = table.payments.reduce((sum, p) => sum + p.amount, 0);
    const totalDue = (table.discountedTotal || table.totalPrice);
    const remaining = totalDue - totalPaid;
    
    if (amount <= 0) {
        alert("Please enter a valid amount.");
        return;
    }
    
    if (method === 'Mobile Payment') {
        if (amount > remaining) {
            alert(`Mobile payment cannot exceed remaining balance. Max allowed: Rs ${remaining.toFixed(2)}`);
            return;
        }
        showQRCodeDialog();
    }
    
    table.payments.push({ method, amount });
    updatePaymentSummary();
    input.value = '';
    saveData();
}

function updatePaymentSummary() {
    const summaryElem = document.getElementById('payment-summary');
    const changeElem = document.getElementById('change-amount');
    const insufficientElem = document.getElementById('insufficient-amount');
    const shortElem = document.getElementById('short-amount');
    
    if (!selectedTable || !tables[selectedTable]) return;
    
    const table = tables[selectedTable];
    const totalPaid = table.payments.reduce((sum, p) => sum + p.amount, 0);
    const totalDue = table.discountedTotal || table.totalPrice;
    const difference = totalPaid - totalDue;
    
    summaryElem.innerHTML = '';
    table.payments.forEach(payment => {
        const li = document.createElement('li');
        li.textContent = `${payment.method}: Rs ${payment.amount.toFixed(2)}`;
        summaryElem.appendChild(li);
    });
    
    if (difference >= 0) {
        changeElem.textContent = difference.toFixed(2);
        insufficientElem.classList.add('hidden');
    } else {
        shortElem.textContent = Math.abs(difference).toFixed(2);
        insufficientElem.classList.remove('hidden');
        changeElem.textContent = '0';
    }
}

function resetPaymentDialog() {
    if (!checkLoginAndExecute('canCheckout')) return;
    
    if (!selectedTable || !tables[selectedTable]) return;
    
    tables[selectedTable].payments = [];
    tables[selectedTable].discount = 0;
    recalculateTableTotal(tables[selectedTable]);
    
    document.getElementById('payment-summary').innerHTML = '';
    document.getElementById('change-amount').textContent = '0';
    document.getElementById('insufficient-amount').classList.add('hidden');
    document.getElementById('numeric-input').value = '';
    
    updateTotalAmount();
    saveData();
}

function completeOrder() {
    if (!checkLoginAndExecute('canCheckout')) return;
    
    if (!selectedTable) return;
    
    const table = tables[selectedTable];
    const totalPaid = table.payments.reduce((sum, p) => sum + p.amount, 0);
    const totalDue = table.discountedTotal || table.totalPrice;
    
    if (totalPaid < totalDue) {
        const short = (totalDue - totalPaid).toFixed(2);
        alert(`Payment insufficient! Short by Rs ${short}`);
        return;
    }
    
    const change = (totalPaid - totalDue).toFixed(2);
    
    const detailedOrder = {};
    Object.entries(table.order).forEach(([name, item]) => {
        detailedOrder[name] = {
            ...item,
            originalPrice: item.price,
            discountedPrice: item.discountedPrice || item.price,
            discountApplied: (item.price - (item.discountedPrice || item.price))
        };
    });
    
    orderHistory.push({
        table: selectedTable,
        order: detailedOrder,
        originalTotal: table.totalPrice,
        discountedTotal: totalDue,
        discount: table.discount,
        discountAmount: table.totalPrice - totalDue,
        payments: [...table.payments],
        timestamp: new Date().toISOString(),
        completedBy: currentUser.name,
        change: parseFloat(change)
    });
    
    salesData.totalSales = (salesData.totalSales || 0) + totalDue;
    salesData.totalDiscounts = (salesData.totalDiscounts || 0) + (table.totalPrice - totalDue);
    salesData.totalOrders = (salesData.totalOrders || 0) + 1;
    
    let remainingDue = totalDue;
    
    table.payments.forEach(payment => {
        if (remainingDue <= 0) return;
        
        const amountTowardBill = Math.min(payment.amount, remainingDue);
        remainingDue -= amountTowardBill;
        
        if (payment.method === 'Cash') {
            salesData.cashSales = (salesData.cashSales || 0) + amountTowardBill;
        } else if (payment.method === 'Mobile Payment') {
            salesData.mobileSales = (salesData.mobileSales || 0) + amountTowardBill;
        } else if (payment.method === 'Card') {
            salesData.cardSales = (salesData.cardSales || 0) + amountTowardBill;
        }
    });
    
    table.order = {};
    table.totalPrice = 0;
    table.discountedTotal = 0;
    table.status = "available";
    table.payments = [];
    table.discount = 0;
    table.time = null;
    table.newItemsAdded = false;
    
    // Show thank you message for staff to read to customer
    const messageBox = document.createElement('div');
    messageBox.className = 'customer-message';
    messageBox.innerHTML = `
        <div class="message-content">
            <div class="message-icon">
                <i class="fas fa-smile"></i>
            </div>
            <h3>🎉 Thank You! 🎉</h3>
            <div class="message-text">
                <p><strong>SAY TO CUSTOMER:</strong></p>
                <p class="customer-line">"Thank you for dining with us at Taboche!"</p>
                <p class="customer-line">"We hope you enjoyed your meal."</p>
                <p class="customer-line">"Please visit us again soon!"</p>
                ${parseFloat(change) > 0 ? `<p class="customer-line change-line">"Your change is Rs ${change}. Thank you!"</p>` : ''}
            </div>
            <div class="message-footer">
                <p>🙏 धन्यवाद! फेरि भेटौंला! 🙏</p>
                <button onclick="this.closest('.customer-message').remove()" class="btn btn-primary">
                    <i class="fas fa-check"></i> Got it!
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(messageBox);
    
    setTimeout(() => {
        if (messageBox.parentNode) {
            messageBox.remove();
        }
    }, 10000);
    
    closePaymentDialog();
    closeQRCodeDialog();
    renderTables();
    updateOrderSummary();
    saveData();
}

// ===== QR CODE DIALOG =====
function showQRCodeDialog() {
    const dialog = document.getElementById('qr-code-dialog');
    if (!dialog) return;
    
    dialog.classList.add('visible');
}

function closeQRCodeDialog() {
    const dialog = document.getElementById('qr-code-dialog');
    if (!dialog) return;
    
    dialog.classList.remove('visible');
}

// ===== VOID FUNCTIONS =====
function voidSelectedItem() {
    if (!checkLoginAndExecute('canVoid')) return;
    
    isVoidMode = true;
    alert("Void mode activated. Click on an item to void it.");
}

// ===== EXTRA ITEMS MODAL =====
function openAddItemModal() {
    if (!checkLoginAndExecute('canAddExtra')) return;
    
    const modal = document.getElementById('addItemModal');
    if (!modal) return;
    
    modal.style.display = 'flex';
}

function closeAddItemModal() {
    const modal = document.getElementById('addItemModal');
    if (!modal) return;
    
    modal.style.display = 'none';
    document.getElementById('extraOptions').innerHTML = '';
}

function selectItem(type) {
    if (!checkLoginAndExecute('canAddExtra', false)) return;
    
    const extraOptions = document.getElementById('extraOptions');
    if (!extraOptions) return;
    
    let optionsHTML = '';
    
    if (type === 'food') {
        optionsHTML = `
            <div class="extra-item" onclick="addExtraItem('Cheese', 75, 'food')">
                <div class="extra-item-icon" style="background-color: #FFD700">🧀</div>
                <span>Cheese</span>
                <span class="extra-price">Rs 75</span>
            </div>
            <div class="extra-item" onclick="addExtraItem('Sausage', 40, 'food')">
                <div class="extra-item-icon" style="background-color: #CD5C5C">🌭</div>
                <span>Sausage</span>
                <span class="extra-price">Rs 40</span>
            </div>
            <div class="extra-item" onclick="addExtraItem('Extra Chicken', 120, 'food')">
                <div class="extra-item-icon" style="background-color: #F4A460">🍗</div>
                <span>Extra Chicken</span>
                <span class="extra-price">Rs 120</span>
            </div>
            <div class="extra-item" onclick="addExtraItem('Extra Buff', 100, 'food')">
                <div class="extra-item-icon" style="background-color: #8B4513">🥩</div>
                <span>Extra Buff</span>
                <span class="extra-price">Rs 100</span>
            </div>
            <div class="extra-item" onclick="addExtraItem('Egg', 50, 'food')">
                <div class="extra-item-icon" style="background-color: #F0E68C">🥚</div>
                <span>Egg</span>
                <span class="extra-price">Rs 50</span>
            </div>
            <div class="extra-item" onclick="addExtraItem('Salad', 75, 'food')">
                <div class="extra-item-icon" style="background-color: #90EE90">🥗</div>
                <span>Salad</span>
                <span class="extra-price">Rs 75</span>
            </div>
            <div class="extra-item" onclick="addExtraItem('Toast', 50, 'food')">
                <div class="extra-item-icon" style="background-color: #D2691E">🍞</div>
                <span>Toast</span>
                <span class="extra-price">Rs 50</span>
            </div>
        `;
    } else {
        optionsHTML = `
            <div class="extra-item" onclick="addExtraItem('Boba', 50, 'drink')">
                <div class="extra-item-icon" style="background-color: #DEB887">🧋</div>
                <span>Boba</span>
                <span class="extra-price">Rs 50</span>
            </div>
            <div class="extra-item" onclick="addExtraItem('Flavour', 50, 'drink')">
                <div class="extra-item-icon" style="background-color: #DDA0DD">🍯</div>
                <span>Flavour</span>
                <span class="extra-price">Rs 50</span>
            </div>
            <div class="extra-item" onclick="addExtraItem('Extra Coil', 50, 'drink')">
                <div class="extra-item-icon" style="background-color: #C0C0C0">🌀</div>
                <span>Extra Coil</span>
                <span class="extra-price">Rs 50</span>
            </div>
            <div class="extra-item" onclick="addExtraItem('Extra Flavour', 250, 'drink')">
                <div class="extra-item-icon" style="background-color: #DA70D6">✨</div>
                <span>Extra Flavour</span>
                <span class="extra-price">Rs 250</span>
            </div>
            <div class="extra-item" onclick="addExtraItem('Extra Ice', 10, 'drink')">
                <div class="extra-item-icon" style="background-color: #ADD8E6">🧊</div>
                <span>Extra Ice</span>
                <span class="extra-price">Rs 10</span>
            </div>
            <div class="extra-item" onclick="addExtraItem('Extra Coffee', 50, 'drink')">
                <div class="extra-item-icon" style="background-color: #8B4513">☕</div>
                <span>Extra Coffee</span>
                <span class="extra-price">Rs 50</span>
            </div>
        `;
    }
    
    extraOptions.innerHTML = optionsHTML;
}

function addExtraItem(name, price, type) {
    if (!checkLoginAndExecute('canAddExtra')) return;
    
    if (!selectedTable) {
        alert("Please select a table first!");
        return;
    }
    
    const itemName = `${name} (Extra ${type})`;
    addToOrder(itemName, price);
    closeAddItemModal();
}

// ===== IMPROVED SALES REPORT FUNCTION =====
function generateSalesReport(timePeriod = 'all') {
    let filteredOrders = [...orderHistory];
    const now = new Date();
    
    if (timePeriod === 'today') {
        const today = now.toDateString();
        filteredOrders = orderHistory.filter(order => 
            new Date(order.timestamp).toDateString() === today
        );
    } else if (timePeriod === 'week') {
        const weekAgo = new Date(now.setDate(now.getDate() - 7));
        filteredOrders = orderHistory.filter(order => 
            new Date(order.timestamp) >= weekAgo
        );
    } else if (timePeriod === 'month') {
        const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
        filteredOrders = orderHistory.filter(order => 
            new Date(order.timestamp) >= monthAgo
        );
    }
    
    let totalSales = 0;
    let totalDiscounts = 0;
    let totalOrders = filteredOrders.length;
    let cashSales = 0;
    let mobileSales = 0;
    let cardSales = 0;
    
    const itemSales = {};
    const categorySales = {};
    
    filteredOrders.forEach(order => {
        totalSales += order.discountedTotal || order.originalTotal;
        totalDiscounts += (order.originalTotal - (order.discountedTotal || order.originalTotal));
        
        let remainingDue = order.discountedTotal || order.originalTotal;
        
        order.payments.forEach(payment => {
            if (remainingDue <= 0) return;
            
            const amountTowardBill = Math.min(payment.amount, remainingDue);
            remainingDue -= amountTowardBill;
            
            if (payment.method === 'Cash') {
                cashSales += amountTowardBill;
            } else if (payment.method === 'Mobile Payment') {
                mobileSales += amountTowardBill;
            } else if (payment.method === 'Card') {
                cardSales += amountTowardBill;
            }
        });
        
        Object.entries(order.order).forEach(([name, item]) => {
            const menuItem = menuItems.find(m => m.name === name);
            const category = menuItem ? menuItem.category : 'Other';
            
            const itemOriginalTotal = item.originalPrice * item.quantity;
            const itemDiscountedTotal = (item.discountedPrice || item.originalPrice) * item.quantity;
            
            if (!itemSales[name]) {
                itemSales[name] = {
                    name: name,
                    category: category,
                    quantity: 0,
                    originalTotal: 0,
                    discountedTotal: 0,
                    discountAmount: 0,
                    avgPrice: item.originalPrice
                };
            }
            
            itemSales[name].quantity += item.quantity;
            itemSales[name].originalTotal += itemOriginalTotal;
            itemSales[name].discountedTotal += itemDiscountedTotal;
            itemSales[name].discountAmount += (itemOriginalTotal - itemDiscountedTotal);
            
            if (!categorySales[category]) {
                categorySales[category] = {
                    category: category,
                    quantity: 0,
                    originalTotal: 0,
                    discountedTotal: 0,
                    discountAmount: 0
                };
            }
            
            categorySales[category].quantity += item.quantity;
            categorySales[category].originalTotal += itemOriginalTotal;
            categorySales[category].discountedTotal += itemDiscountedTotal;
            categorySales[category].discountAmount += (itemOriginalTotal - itemDiscountedTotal);
        });
    });
    
    const sortedItems = Object.values(itemSales).sort((a, b) => 
        b.discountedTotal - a.discountedTotal
    );
    
    const sortedCategories = Object.values(categorySales).sort((a, b) => 
        b.discountedTotal - a.discountedTotal
    );
    
    const itemRows = sortedItems.map(item => `
        <tr>
            <td>${item.name}</td>
            <td>${item.category}</td>
            <td>${item.quantity}</td>
            <td>Rs ${item.originalTotal.toFixed(2)}</td>
            <td>Rs ${item.discountAmount.toFixed(2)}</td>
            <td>Rs ${item.discountedTotal.toFixed(2)}</td>
        </tr>
    `).join('');
    
    const categoryRows = sortedCategories.map(cat => `
        <tr>
            <td><strong>${cat.category}</strong></td>
            <td>${cat.quantity}</td>
            <td>Rs ${cat.originalTotal.toFixed(2)}</td>
            <td>Rs ${cat.discountAmount.toFixed(2)}</td>
            <td>Rs ${cat.discountedTotal.toFixed(2)}</td>
        </tr>
    `).join('');
    
    const averageOrderValue = totalOrders > 0 ? (totalSales / totalOrders).toFixed(2) : 0;
    const discountPercentage = totalSales > 0 ? ((totalDiscounts / (totalSales + totalDiscounts)) * 100).toFixed(1) : 0;
    
    return `
        <div class="report-filters" style="margin-bottom: 20px; display: flex; gap: 10px; flex-wrap: wrap;">
            <button onclick="generateAndShowReport('today')" class="btn btn-sm">Today</button>
            <button onclick="generateAndShowReport('week')" class="btn btn-sm">This Week</button>
            <button onclick="generateAndShowReport('month')" class="btn btn-sm">This Month</button>
            <button onclick="generateAndShowReport('all')" class="btn btn-sm">All Time</button>
        </div>
    
        <div class="report-summary">
            <h3>Sales Summary</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                <div class="summary-card">
                    <i class="fas fa-rupee-sign"></i>
                    <div>
                        <strong>Total Sales</strong>
                        <span>Rs ${totalSales.toFixed(2)}</span>
                    </div>
                </div>
                <div class="summary-card">
                    <i class="fas fa-percent"></i>
                    <div>
                        <strong>Total Discounts</strong>
                        <span>Rs ${totalDiscounts.toFixed(2)} (${discountPercentage}%)</span>
                    </div>
                </div>
                <div class="summary-card">
                    <i class="fas fa-shopping-cart"></i>
                    <div>
                        <strong>Total Orders</strong>
                        <span>${totalOrders}</span>
                    </div>
                </div>
                <div class="summary-card">
                    <i class="fas fa-chart-line"></i>
                    <div>
                        <strong>Avg Order Value</strong>
                        <span>Rs ${averageOrderValue}</span>
                    </div>
                </div>
            </div>
            
            <h4 style="margin-top: 20px;">Payment Breakdown</h4>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px;">
                <div><strong>Cash:</strong> Rs ${cashSales.toFixed(2)}</div>
                <div><strong>Mobile:</strong> Rs ${mobileSales.toFixed(2)}</div>
                ${cardSales ? `<div><strong>Card:</strong> Rs ${cardSales.toFixed(2)}</div>` : ''}
            </div>
        </div>
        
        <h3>Category-wise Sales</h3>
        <table class="items-table">
            <thead>
                <tr>
                    <th>Category</th>
                    <th>Qty</th>
                    <th>Original</th>
                    <th>Discount</th>
                    <th>Net Sales</th>
                </tr>
            </thead>
            <tbody>
                ${categoryRows || '<tr><td colspan="5">No sales data</td></tr>'}
            </tbody>
        </table>
        
        <h3>Item-wise Sales Details</h3>
        <table class="items-table">
            <thead>
                <tr>
                    <th>Item Name</th>
                    <th>Category</th>
                    <th>Qty</th>
                    <th>Original</th>
                    <th>Discount</th>
                    <th>Net Sales</th>
                </tr>
            </thead>
            <tbody>
                ${itemRows || '<tr><td colspan="6">No items sold yet</td></tr>'}
            </tbody>
            <tfoot>
                <tr style="font-weight: bold; background: #f0f0f0;">
                    <td colspan="3">Totals</td>
                    <td>Rs ${Object.values(itemSales).reduce((sum, i) => sum + i.originalTotal, 0).toFixed(2)}</td>
                    <td>Rs ${Object.values(itemSales).reduce((sum, i) => sum + i.discountAmount, 0).toFixed(2)}</td>
                    <td>Rs ${totalSales.toFixed(2)}</td>
                </tr>
            </tfoot>
        </table>
        
        <div style="margin-top: 20px; font-style: italic; color: #666;">
            Report generated: ${new Date().toLocaleString()}
        </div>
    `;
}

function generateAndShowReport(timePeriod = 'all') {
    if (!checkLoginAndExecute('canViewReports')) return;
    
    const modal = document.getElementById('salesReportModal');
    const content = document.getElementById('modalContent');
    
    if (!modal || !content) return;
    
    content.innerHTML = generateSalesReport(timePeriod);
    modal.style.display = 'flex';
    
    if (!document.getElementById('report-summary-css')) {
        const style = document.createElement('style');
        style.id = 'report-summary-css';
        style.textContent = `
            .summary-card {
                background: #f8f9fa;
                padding: 15px;
                border-radius: 8px;
                display: flex;
                align-items: center;
                gap: 10px;
                border-left: 4px solid #3498db;
            }
            .summary-card i {
                font-size: 24px;
                color: #3498db;
            }
            .summary-card div {
                display: flex;
                flex-direction: column;
            }
            .summary-card span {
                font-size: 20px;
                font-weight: bold;
            }
            .btn-sm {
                padding: 5px 10px;
                font-size: 12px;
                background: #3498db;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
            }
            .btn-sm:hover {
                background: #2980b9;
            }
            .customer-message {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 9999;
                animation: fadeIn 0.3s ease;
            }
            .message-content {
                background: white;
                border-radius: 20px;
                padding: 30px;
                max-width: 500px;
                width: 90%;
                text-align: center;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
                animation: slideUp 0.3s ease;
            }
            .message-icon {
                font-size: 60px;
                color: #4CAF50;
                margin-bottom: 20px;
            }
            .message-content h3 {
                color: #333;
                font-size: 28px;
                margin-bottom: 20px;
                font-weight: bold;
            }
            .message-text {
                background: #f8f9fa;
                padding: 20px;
                border-radius: 15px;
                margin: 20px 0;
            }
            .message-text p:first-child {
                color: #666;
                font-size: 14px;
                margin-bottom: 15px;
            }
            .customer-line {
                font-size: 18px;
                color: #2c3e50;
                margin: 10px 0;
                font-weight: 500;
                line-height: 1.6;
            }
            .change-line {
                color: #27ae60;
                font-weight: bold;
                font-size: 20px;
                margin-top: 15px;
                padding-top: 15px;
                border-top: 2px dashed #ddd;
            }
            .message-footer {
                margin-top: 20px;
            }
            .message-footer p {
                font-size: 20px;
                color: #e67e22;
                margin-bottom: 20px;
                font-weight: bold;
            }
            .message-footer button {
                padding: 12px 30px;
                font-size: 16px;
                border: none;
                border-radius: 50px;
                background: #3498db;
                color: white;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            .message-footer button:hover {
                background: #2980b9;
                transform: scale(1.05);
            }
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes slideUp {
                from {
                    transform: translateY(50px);
                    opacity: 0;
                }
                to {
                    transform: translateY(0);
                    opacity: 1;
                }
            }
            @media (max-width: 768px) {
                .message-content {
                    padding: 20px;
                    width: 95%;
                }
                .message-icon {
                    font-size: 50px;
                }
                .message-content h3 {
                    font-size: 24px;
                }
                .customer-line {
                    font-size: 16px;
                }
                .change-line {
                    font-size: 18px;
                }
                .message-footer p {
                    font-size: 18px;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    toggleSidebar();
}

function showSalesReportsContent() {
    if (!checkLoginAndExecute('canViewReports')) return;
    generateAndShowReport('all');
}

function closeModal() {
    const modal = document.getElementById('salesReportModal');
    if (!modal) return;
    
    modal.style.display = 'none';
}

function resetSalesReport() {
    if (!checkLoginAndExecute('canManageTables')) return;
    
    if (!confirm("This will RESET ALL data including sales, orders, voids, AND ITEM REMOVAL HISTORY. Cannot be undone! Continue?")) {
        return;
    }
    
    salesData = {
        totalSales: 0,
        totalDiscounts: 0,
        totalOrders: 0,
        cashSales: 0,
        mobileSales: 0,
        cardSales: 0,
        items: []
    };
    
    orderHistory = [];
    voidHistory = [];
    removalHistory = [];
    
    saveData();
    showSalesReportsContent();
    alert("All reports and history have been reset.");
}

function printReport() {
    if (!checkLoginAndExecute('canPrint')) return;
    
    const reportContent = generateSalesReport('all');
    const restaurantName = "Taboche Restaurant";
    const now = new Date();
    const date = now.toLocaleDateString();
    const time = now.toLocaleTimeString();
    const day = now.toLocaleDateString('en-US', { weekday: 'long' });
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head>
                <title>Sales Report - ${restaurantName}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    h1 { color: #2c3e50; }
                    .header { text-align: center; margin-bottom: 20px; }
                    table { border-collapse: collapse; width: 100%; margin-top: 20px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #3498db; color: white; }
                    .summary { background: #ecf0f1; padding: 15px; border-radius: 5px; }
                    .summary-card { background: #f8f9fa; padding: 15px; border-radius: 8px; display: inline-block; margin: 5px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>${restaurantName}</h1>
                    <p>Sales Report</p>
                    <p>${day}, ${date} ${time}</p>
                </div>
                ${reportContent}
                <hr>
                <p style="text-align: center; font-style: italic;">Generated by Taboche POS System</p>
            </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

// ===== HISTORY FUNCTIONS =====
function openOrderHistoryDialog() {
    if (!checkLoginAndExecute('canViewReports')) return;
    
    const dialog = document.getElementById('order-history-dialog');
    if (!dialog) return;
    
    renderOrderHistory();
    dialog.classList.add('visible');
}

function closeOrderHistoryDialog() {
    const dialog = document.getElementById('order-history-dialog');
    if (!dialog) return;
    
    dialog.classList.remove('visible');
}

function renderOrderHistory() {
    const container = document.getElementById('order-history-container');
    if (!container) return;
    
    if (orderHistory.length === 0) {
        container.innerHTML = '<p class="empty-history">No order history available</p>';
        return;
    }
    
    container.innerHTML = '';
    
    orderHistory.slice().reverse().forEach((order, index) => {
        const orderElem = document.createElement('div');
        orderElem.className = 'order-history-item';
        
        const date = new Date(order.timestamp);
        const formattedDate = date.toLocaleDateString();
        const formattedTime = date.toLocaleTimeString();
        
        const itemsList = Object.entries(order.order).map(([name, item]) => {
            const displayPrice = item.discountedPrice || item.originalPrice;
            return `
            <tr>
                <td>${name}</td>
                <td>Rs ${item.originalPrice}</td>
                <td>${item.quantity}</td>
                <td>Rs ${(item.originalPrice * item.quantity).toFixed(2)}</td>
                <td>${item.discountApplied ? 'Yes' : 'No'}</td>
                <td>Rs ${(displayPrice * item.quantity).toFixed(2)}</td>
            </tr>
        `}).join('');
        
        const paymentsList = order.payments.map(p => 
            `${p.method}: Rs ${p.amount.toFixed(2)}`
        ).join(', ');
        
        orderElem.innerHTML = `
            <div class="order-header">
                <h4>Order #${orderHistory.length - index}</h4>
                <span>${formattedDate} ${formattedTime}</span>
            </div>
            <p><strong>Table:</strong> ${order.table}</p>
            <p><strong>Original Total:</strong> Rs ${order.originalTotal.toFixed(2)}</p>
            <p><strong>Discount:</strong> ${order.discount}% (Rs ${order.discountAmount.toFixed(2)})</p>
            <p><strong>Final Total:</strong> Rs ${order.discountedTotal.toFixed(2)}</p>
            <p><strong>Payments:</strong> ${paymentsList}</p>
            <p><strong>Change Given:</strong> Rs ${order.change ? order.change.toFixed(2) : '0.00'}</p>
            <p><strong>Completed By:</strong> ${order.completedBy || 'Staff'}</p>
            <details>
                <summary>View Items (${Object.keys(order.order).length} items)</summary>
                <table class="items-table">
                    <thead>
                        <tr>
                            <th>Item</th>
                            <th>Price</th>
                            <th>Qty</th>
                            <th>Original</th>
                            <th>Discounted</th>
                            <th>Final</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsList}
                    </tbody>
                </table>
            </details>
        `;
        
        container.appendChild(orderElem);
    });
}

function openVoidHistoryDialog() {
    if (!checkLoginAndExecute('canViewReports')) return;
    
    const dialog = document.getElementById('void-history-dialog');
    const output = document.getElementById('voidHistoryOutput');
    
    if (!dialog || !output) return;
    
    if (voidHistory.length === 0) {
        output.innerHTML = '<p class="empty-history">No void history available</p>';
    } else {
        output.innerHTML = voidHistory.slice().reverse().map(entry => `
            <div class="void-entry">
                <p><strong>${entry.date} ${entry.time}</strong></p>
                <p>Item: ${entry.name} x${entry.quantity}</p>
                <p>Amount: Rs ${entry.totalAmount.toFixed(2)}</p>
                <p>Table: ${entry.table}</p>
                <p>Reason: ${entry.reason}</p>
                <p>Voided By: ${entry.voidedBy}</p>
                <hr>
            </div>
        `).join('');
    }
    
    dialog.classList.add('visible');
}

function closeVoidHistoryDialog() {
    const dialog = document.getElementById('void-history-dialog');
    if (!dialog) return;
    
    dialog.classList.remove('visible');
}

// ===== TABLE MANAGEMENT =====
function showSettingsContent() {
    if (!checkLoginAndExecute('canManageTables')) return;
    
    const modal = document.getElementById('settingsModal');
    if (!modal) return;
    
    modal.style.display = 'flex';
    toggleSidebar();
}

function closeSettingsModal() {
    const modal = document.getElementById('settingsModal');
    if (!modal) return;
    
    modal.style.display = 'none';
}

function addTable() {
    if (!checkLoginAndExecute('canManageTables')) return;
    
    const input = document.getElementById('add-table-input');
    const tableNumber = input.value.trim();
    
    if (!tableNumber) {
        alert("Please enter a table number");
        return;
    }
    
    const tableName = `Table ${tableNumber}`;
    
    if (tables[tableName]) {
        alert("Table already exists!");
        return;
    }
    
    tables[tableName] = {
        order: {},
        totalPrice: 0,
        status: "available",
        payments: [],
        discount: 0,
        discountedTotal: 0,
        time: null,
        newItemsAdded: false
    };
    
    renderTables();
    saveData();
    input.value = '';
    alert(`Table ${tableNumber} added successfully!`);
}

function removeTable() {
    if (!checkLoginAndExecute('canManageTables')) return;
    
    const input = document.getElementById('remove-table-input');
    const tableNumber = input.value.trim();
    
    if (!tableNumber) {
        alert("Please enter a table number");
        return;
    }
    
    const tableName = `Table ${tableNumber}`;
    
    if (!tables[tableName]) {
        alert("Table not found!");
        return;
    }
    
    if (tables[tableName].status === "occupied") {
        if (!confirm("This table is occupied. Are you sure you want to remove it?")) {
            return;
        }
    }
    
    delete tables[tableName];
    renderTables();
    saveData();
    input.value = '';
    alert(`Table ${tableNumber} removed successfully!`);
}

// ===== SIDEBAR FUNCTIONS =====
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;
    
    sidebar.classList.toggle('active');
}

function showHomeContent() {
    toggleSidebar();
}

function showMenuManagementContent() {
    if (!checkLoginAndExecute('canManageTables')) return;
    
    const content = document.getElementById('menuManagementContent');
    if (!content) return;
    
    content.classList.remove('hidden');
    toggleSidebar();
}

function showAdminPanelContent() {
    showPermissionError('admin panel');
    toggleSidebar();
}

// ===== UTILITY FUNCTIONS =====
function changeTable() {
    if (!checkLoginAndExecute('canChangeTable')) return;
    
    if (!selectedTable) {
        alert("Please select a table first!");
        return;
    }
    
    const newTableNumber = prompt("Enter new table number:");
    if (!newTableNumber) return;
    
    const newTableName = `Table ${newTableNumber}`;
    
    if (!tables[newTableName]) {
        alert("Table does not exist!");
        return;
    }
    
    tables[newTableName].order = { ...tables[selectedTable].order };
    tables[newTableName].totalPrice = tables[selectedTable].totalPrice;
    tables[newTableName].discountedTotal = tables[selectedTable].discountedTotal;
    tables[newTableName].discount = tables[selectedTable].discount;
    tables[newTableName].payments = [...tables[selectedTable].payments];
    tables[newTableName].status = "occupied";
    tables[newTableName].time = tables[selectedTable].time || new Date().toLocaleTimeString();
    tables[newTableName].newItemsAdded = tables[selectedTable].newItemsAdded;
    
    tables[selectedTable] = {
        order: {},
        totalPrice: 0,
        status: "available",
        payments: [],
        discount: 0,
        discountedTotal: 0,
        time: null,
        newItemsAdded: false
    };
    
    selectedTable = newTableName;
    
    renderTables();
    updateOrderSummary();
    saveData();
    alert(`Order moved to ${newTableName}`);
}

function printReceipt() {
    if (!checkLoginAndExecute('canPrint')) return;
    
    if (!selectedTable || !tables[selectedTable]) {
        alert("Please select a table first!");
        return;
    }
    
    const table = tables[selectedTable];
    const restaurantName = "Taboche Restaurant";
    const address = "Siddha Pokhari, Bhaktapur, Nepal";
    const phone = "+977 981-0208828";
    const now = new Date();
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head>
                <title>Receipt - ${restaurantName}</title>
                <style>
                    body { font-family: 'Courier New', monospace; margin: 20px; font-size: 14px; }
                    .header { text-align: center; margin-bottom: 20px; }
                    .items { margin: 20px 0; }
                    .item { display: flex; justify-content: space-between; margin: 5px 0; }
                    .total { border-top: 2px dashed #000; padding-top: 10px; margin-top: 10px; }
                    .footer { text-align: center; margin-top: 30px; font-style: italic; }
                    .discount-note { color: #666; font-size: 12px; }
                    .thankyou { text-align: center; margin-top: 20px; font-size: 16px; color: #27ae60; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h2>${restaurantName}</h2>
                    <p>${address}</p>
                    <p>${phone}</p>
                    <p>${now.toLocaleDateString()} ${now.toLocaleTimeString()}</p>
                    <p>Table: ${selectedTable}</p>
                </div>
                
                <div class="items">
                    ${Object.entries(table.order).map(([name, item]) => {
                        const displayPrice = item.discountedPrice || item.price;
                        const itemTotal = displayPrice * item.quantity;
                        return `
                            <div class="item">
                                <span>${name} x${item.quantity}</span>
                                <span>Rs ${itemTotal.toFixed(2)}</span>
                            </div>
                            ${item.comments ? `<div style="font-size: 12px; color: #666; margin-left: 20px;">Note: ${item.comments}</div>` : ''}
                        `;
                    }).join('')}
                </div>
                
                <div class="total">
                    <div class="item"><strong>Subtotal:</strong> <span>Rs ${table.totalPrice.toFixed(2)}</span></div>
                    ${table.discount > 0 ? `
                        <div class="item"><strong>Discount (${table.discount}%):</strong> <span>-Rs ${(table.totalPrice - table.discountedTotal).toFixed(2)}</span></div>
                    ` : ''}
                    <div class="item"><strong>Total:</strong> <span>Rs ${(table.discountedTotal || table.totalPrice).toFixed(2)}</span></div>
                </div>
                
                <div class="thankyou">
                    <p>🙏 Thank you! Please visit again! 🙏</p>
                    <p>धन्यवाद! फेरि भेटौंला!</p>
                </div>
                
                <div class="footer">
                    <p>Thank you for dining with us at Taboche!</p>
                </div>
            </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

function toggleFullScreen() {
    if (!document.fullscreenElement) {
        enterFullscreen();
    } else {
        exitFullscreen();
    }
}

function enterFullscreen() {
    const element = document.documentElement;
    
    if (element.requestFullscreen) {
        element.requestFullscreen();
    } else if (element.webkitRequestFullscreen) {
        element.webkitRequestFullscreen();
    } else if (element.msRequestFullscreen) {
        element.msRequestFullscreen();
    }
}

function exitFullscreen() {
    if (document.exitFullscreen) {
        document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
    }
}

// ===== MOBILE-SPECIFIC FEATURES =====
function enableSwipeToRemove() {
    const orderItems = document.querySelectorAll('.order-item');
    
    orderItems.forEach(item => {
        let touchStartX = 0;
        let touchEndX = 0;
        
        item.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });
        
        item.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe(item, touchStartX, touchEndX);
        });
    });
}

function handleSwipe(element, startX, endX) {
    const swipeThreshold = 100;
    const diff = startX - endX;
    
    if (Math.abs(diff) > swipeThreshold) {
        if (diff > 0) {
            const itemName = element.querySelector('.item-name').textContent.split(' ')[0];
            if (confirm(`Remove ${itemName} from order?`)) {
                removeFromOrder(itemName);
            }
        }
    }
}

function setupLongPressForQuantity() {
    document.querySelectorAll('.item-quantity button').forEach(btn => {
        let pressTimer;
        
        btn.addEventListener('touchstart', (e) => {
            pressTimer = setTimeout(() => {
                const action = btn.textContent === '+' ? 'increment' : 'decrement';
                const itemName = btn.closest('.order-item').querySelector('.item-name').textContent;
                
                for (let i = 0; i < 5; i++) {
                    setTimeout(() => {
                        adjustQuantity(itemName, action === 'increment' ? 1 : -1);
                    }, i * 100);
                }
            }, 500);
        });
        
        btn.addEventListener('touchend', () => {
            clearTimeout(pressTimer);
        });
        
        btn.addEventListener('touchcancel', () => {
            clearTimeout(pressTimer);
        });
    });
}

function showMobileBottomSheet() {
    if (window.innerWidth > 768 || !currentUser.loggedIn) return;
    
    const existingSheet = document.querySelector('.bottom-sheet');
    if (existingSheet) {
        existingSheet.remove();
    }
    
    const bottomSheet = document.createElement('div');
    bottomSheet.className = 'bottom-sheet';
    bottomSheet.innerHTML = `
        <div class="bottom-sheet-handle"></div>
        <div class="bottom-sheet-content">
            <h3>Quick Actions</h3>
            <button onclick="showPaymentDialog(); this.closest('.bottom-sheet').remove()">
                <i class="fas fa-credit-card"></i> Checkout
            </button>
            <button onclick="openAddItemModal(); this.closest('.bottom-sheet').remove()">
                <i class="fas fa-plus"></i> Add Extras
            </button>
            <button onclick="printReceipt(); this.closest('.bottom-sheet').remove()">
                <i class="fas fa-print"></i> Print
            </button>
            <button onclick="changeTable(); this.closest('.bottom-sheet').remove()">
                <i class="fas fa-exchange-alt"></i> Change Table
            </button>
            <button onclick="this.closest('.bottom-sheet').remove()">
                <i class="fas fa-times"></i> Close
            </button>
        </div>
    `;
    
    document.body.appendChild(bottomSheet);
    
    setTimeout(() => {
        bottomSheet.classList.add('active');
    }, 100);
    
    let touchStart = 0;
    bottomSheet.addEventListener('touchstart', (e) => {
        touchStart = e.touches[0].clientY;
    });
    
    bottomSheet.addEventListener('touchmove', (e) => {
        const touch = e.touches[0].clientY;
        if (touch - touchStart > 50) {
            bottomSheet.classList.remove('active');
            setTimeout(() => bottomSheet.remove(), 300);
        }
    });
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM loaded, initializing...");
    
    initializeTables();
    renderCategories();
    updateDateTime();
    setInterval(updateDateTime, 1000);
    
    removalHistory = JSON.parse(localStorage.getItem('removalHistory')) || [];
    voidHistory = JSON.parse(localStorage.getItem('voidHistory')) || [];
    
    updateUIBasedOnRole();
    
    if (currentUser.loggedIn) {
        renderTables();
        renderMenu();
    }
    
    window.onclick = function(event) {
        const modals = document.querySelectorAll('.modal, .dialog.visible');
        modals.forEach(modal => {
            if (event.target === modal) {
                if (modal.classList.contains('modal')) {
                    modal.style.display = 'none';
                } else {
                    modal.classList.remove('visible');
                }
            }
        });
    };
    
    document.addEventListener('fullscreenchange', () => {
        const btn = document.querySelector('.fullscreen-btn i');
        if (btn) {
            btn.className = document.fullscreenElement ? 'fas fa-compress' : 'fas fa-expand';
        }
    });
    
    document.addEventListener('webkitfullscreenchange', () => {
        const btn = document.querySelector('.fullscreen-btn i');
        if (btn) {
            btn.className = document.webkitFullscreenElement ? 'fas fa-compress' : 'fas fa-expand';
        }
    });
    
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (isMobile) {
        document.body.classList.add('is-mobile');
        
        document.addEventListener('touchstart', (e) => {
            if (e.touches.length > 1) {
                e.preventDefault();
            }
        }, { passive: false });
        
        const setVH = () => {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        };
        
        window.addEventListener('resize', setVH);
        window.addEventListener('orientationchange', setVH);
        setVH();
    }
    
    console.log("Initialization complete");
});

// Make all functions globally available
window.selectTable = selectTable;
window.addToOrder = addToOrder;
window.removeFromOrder = removeFromOrder;
window.finalizeOrder = finalizeOrder;
window.searchMenu = searchMenu;
window.filterCategory = filterCategory;
window.showPaymentDialog = showPaymentDialog;
window.closePaymentDialog = closePaymentDialog;
window.addNumber = addNumber;
window.clearInput = clearInput;
window.backspaceInput = backspaceInput;
window.addQuickAmount = addQuickAmount;
window.addExactAmount = addExactAmount;
window.applyDiscount = applyDiscount;
window.addPayment = addPayment;
window.resetPaymentDialog = resetPaymentDialog;
window.completeOrder = completeOrder;
window.showQRCodeDialog = showQRCodeDialog;
window.closeQRCodeDialog = closeQRCodeDialog;
window.voidSelectedItem = voidSelectedItem;
window.voidItem = voidItem;
window.openAddItemModal = openAddItemModal;
window.closeAddItemModal = closeAddItemModal;
window.selectItem = selectItem;
window.addExtraItem = addExtraItem;
window.toggleSidebar = toggleSidebar;
window.showHomeContent = showHomeContent;
window.showMenuManagementContent = showMenuManagementContent;
window.showSalesReportsContent = showSalesReportsContent;
window.showSettingsContent = showSettingsContent;
window.showAdminPanelContent = showAdminPanelContent;
window.closeSettingsModal = closeSettingsModal;
window.addTable = addTable;
window.removeTable = removeTable;
window.printReceipt = printReceipt;
window.changeTable = changeTable;
window.toggleFullScreen = toggleFullScreen;
window.showLoginDialog = showLoginDialog;
window.closeLoginDialog = closeLoginDialog;
window.loginWithCredentials = loginWithCredentials;
window.handleLogin = loginWithCredentials;
window.logout = logout;
window.openOrderHistoryDialog = openOrderHistoryDialog;
window.closeOrderHistoryDialog = closeOrderHistoryDialog;
window.openVoidHistoryDialog = openVoidHistoryDialog;
window.closeVoidHistoryDialog = closeVoidHistoryDialog;
window.closeModal = closeModal;
window.resetSalesReport = resetSalesReport;
window.printReport = printReport;
window.adjustQuantity = adjustQuantity;
window.promptAndAddComment = promptAndAddComment;
window.setReason = setReason;
window.submitRemoveWithReason = submitRemoveWithReason;
window.closeRemoveReasonDialog = closeRemoveReasonDialog;
window.showRemovalHistory = showRemovalHistory;
window.closeRemovalHistoryDialog = closeRemovalHistoryDialog;
window.showMobileBottomSheet = showMobileBottomSheet;
window.generateAndShowReport = generateAndShowReport;
window.recalculateTableTotal = recalculateTableTotal;