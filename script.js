// ===== GLOBAL VARIABLES =====
let tables = JSON.parse(localStorage.getItem('tables')) || {};
let salesData = JSON.parse(localStorage.getItem('salesData')) || {
    totalSales: 0,
    totalDiscounts: 0,
    totalOrders: 0,
    cashSales: 0,
    mobileSales: 0,
    items: []
};
let orderHistory = JSON.parse(localStorage.getItem('orderHistory')) || [];
let voidHistory = JSON.parse(localStorage.getItem('voidHistory')) || [];
let removalHistory = JSON.parse(localStorage.getItem('removalHistory')) || [];
let selectedTable = null;
let isVoidMode = false;

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

// ===== REMOVE REASON VARIABLES =====
let pendingRemoval = null;

// ===== MENU ITEMS DATABASE =====
const menuItems = [
    // Retail Items
    { name: "Butterfly Pea Packet", price: 350, category: "Retail", image: "butterfly_pea PKT.jpg", hasImage: true },
    { name: "Calming Tea Packet", price: 400, category: "Retail", image: "calming_teaPKT.jpg", hasImage: true },
    { name: "Chamomile Packet", price: 350, category: "Retail", image: "chamomilePKT.jpg", hasImage: true },
    { name: "Coffee Bag Packet", price: 1350, category: "Retail", image: "coffee_bagPKT.jpg", hasImage: true },
    { name: "Herbal Tea Packet", price: 300, category: "Retail", image: "herbal_teaPKT.jpg", hasImage: true },
    { name: "Hibiscus Packet", price: 400, category: "Retail", image: "hibiscusPKT.jpg", hasImage: true },
    { name: "Lavender Packet", price: 300, category: "Retail", image: "lavenderPKT.jpg", hasImage: true },
    { name: "Peppermint Packet", price: 250, category: "Retail", image: "peppermintPKT.jpg", hasImage: true },
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
    { name: "Masala Omelet", price: 120, category: "Breakfast", image: "masala_omelet.jpg", hasImage: true },
    { name: "Omelet Plain", price: 120, category: "Breakfast", image: "omelet_plain.jpg", hasImage: true },
    { name: "Sausage Boiled", price: 120, category: "Breakfast", image: "sausage_boiled.jpg", hasImage: true },
    { name: "Toast", price: 100, category: "Breakfast", image: "Toast.jpg", hasImage: true },
    
    // Fast Food Items
    { name: "Buff Burger", price: 300, category: "Fast Food", image: "burger_buff.jpg", hasImage: true },
    { name: "Chips Chilly", price: 360, category: "Fast Food", image: "chips_chilly.jpg", hasImage: true },
    { name: "Chi Sausage", price: 300, category: "Fast Food", image: "chi_sausage.jpg", hasImage: true },
    { name: "Yamari", price: 250, category: "Fast Food", image: "yamari.jpg", hasImage: true },
    { name: "Buff Sausage", price: 300, category: "Fast Food", image: "buff_sausage.jpg", hasImage: true },
    { name: "Buff Chilly Momo", price: 280, category: "Fast Food", image: "buff_chilly_momo.jpg", hasImage: true },
    { name: "Buff Fried Rice", price: 320, category: "Fast Food", image: "buff_fried_rice.jpg", hasImage: true },
    { name: "Buff Jhol Momo", price: 250, category: "Fast Food", image: "buff_jhol_momo.jpg", hasImage: true },
    { name: "Buff Momo", price: 200, category: "Fast Food", image: "buff_momo.jpg", hasImage: true },
    { name: "Buff Wraps", price: 280, category: "Fast Food", image: "wraps_buff.jpg", hasImage: true },
    { name: "Chicken Burger", price: 370, category: "Fast Food", image: "burger_chicken.jpg", hasImage: true },
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
    { name: "Chi Sizzler", price: 490, category: "Noodles/Pizza", image: "chi_sizzler.jpg", hasImage: true },
    { name: "Egg Keema Noodles", price: 220, category: "Noodles/Pizza", image: "egg_keema_noodles.jpg", hasImage: true },
    { name: "Egg Thukpa", price: 200, category: "Noodles/Pizza", image: "egg_thukpa.jpg", hasImage: true },
    { name: "Mushroom Keema Noodles", price: 230, category: "Noodles/Pizza", image: "mushroom_keema_noodles.jpg", hasImage: true },
    { name: "Laping (Chips)", price: 95, category: "Noodles/Pizza", image: "laping_chips.jpg", hasImage: true },
    { name: "Laping (Mix)", price: 110, category: "Noodles/Pizza", image: "laping_mix.jpg", hasImage: true },
    { name: "Laping (Noodles)", price: 85, category: "Noodles/Pizza", image: "laping_noodles.jpg", hasImage: true },
    { name: "Mix Pizza", price: 580, category: "Noodles/Pizza", image: "mix_pizza.jpg", hasImage: true },
    { name: "Mix Thukpa", price: 300, category: "Noodles/Pizza", image: "mix_thukpa.jpg", hasImage: true },
    { name: "Mushroom Pizza", price: 490, category: "Noodles/Pizza", image: "mushroom_pizza.jpg", hasImage: true },
    { name: "Pesto (Penne)", price: 450, category: "Noodles/Pizza", image: "pesto_penne.jpg", hasImage: true },
    { name: "Veg Chowmein", price: 200, category: "Noodles/Pizza", image: "veg_chowmein.jpg", hasImage: true },
    { name: "Veg Sizzler", price: 450, category: "Noodles/Pizza", image: "veg_sizzler.jpg", hasImage: true },
    { name: "Veg Thukpa", price: 180, category: "Noodles/Pizza", image: "veg_thukpa.jpg", hasImage: true },

    // Hot Coffee Items
    { name: "Americano", price: 150, category: "Hot Coffee", image: "americano.jpg", hasImage: true },
    { name: "Cappuccino", price: 170, category: "Hot Coffee", image: "cappuccino.jpg", hasImage: true },
    { name: "Coconut Latte", price: 250, category: "Hot Coffee", image: "coconut_latte.jpg", hasImage: true },
    { name: "Espresso", price: 130, category: "Hot Coffee", image: "espresso.jpg", hasImage: true },
    { name: "Flat White", price: 150, category: "Hot Coffee", image: "flat_white.jpg", hasImage: true },
    { name: "Espresso Con Pan", price: 150, category: "Hot Coffee", image: "espresso_con_pan.jpg", hasImage: true },
    { name: "Caramel Latte", price: 240, category: "Hot Coffee", image: "latte_caramel.jpg", hasImage: true },
    { name: "Hazelnut Latte", price: 240, category: "Hot Coffee", image: "flavored_latte_hazelnut.jpg", hasImage: true },
    { name: "Vanilla Latte", price: 240, category: "Hot Coffee", image: "latte_vanilla.jpg", hasImage: true },
    { name: "Hot Chocolate", price: 230, category: "Hot Coffee", image: "hot_chocolate.jpg", hasImage: true },
    { name: "Hot Vanilla", price: 230, category: "Hot Coffee", image: "hot_vanilla.jpg", hasImage: true },
    { name: "Latte", price: 170, category: "Hot Coffee", image: "latte.jpg", hasImage: true },
    { name: "Mocha Latte", price: 240, category: "Hot Coffee", image: "mocha_latte.jpg", hasImage: true },
    { name: "Rose Latte", price: 250, category: "Hot Coffee", image: "roselatte.jpg", hasImage: true },
    { name: "Spanish Latte", price: 250, category: "Hot Coffee", image: "spanish_latte.jpg", hasImage: true },
    { name: "Filter Coffee Hot", price: 280, category: "Hot Coffee", image: "filter_coffee_hot.jpg", hasImage: true },

    // Cold Coffee Items
    { name: "Iced Latte", price: 200, category: "Cold Coffee", image: "iced_latte.jpg", hasImage: true },
    { name: "Iced Americano", price: 190, category: "Cold Coffee", image: "iced_americano.jpg", hasImage: true },
    { name: "Iced Vanilla Latte", price: 240, category: "Cold Coffee", image: "iced_vanilla_latte.jpg", hasImage: true },
    { name: "Iced Caramel Latte", price: 240, category: "Cold Coffee", image: "iced_caramel_latte.jpg", hasImage: true },
    { name: "Iced Hazelnut Latte", price: 240, category: "Cold Coffee", image: "iced_hazelnut_latte.jpg", hasImage: true },
    { name: "Filter Coffee Cold", price: 300, category: "Cold Coffee", image: "filter_coffee_cold.jpg", hasImage: true },
    { name: "Caramel Milkshake", price: 230, category: "Cold Coffee", image: "milk_shake_caramel.jpg", hasImage: true },
    { name: "Chocolate Milkshake", price: 230, category: "Cold Coffee", image: "milk_shake_chocolate.jpg", hasImage: true },
    { name: "Hazelnut Milkshake", price: 230, category: "Cold Coffee", image: "milk_shake_hazelnut.jpg", hasImage: true },
    { name: "Vanilla Milkshake", price: 230, category: "Cold Coffee", image: "milk_shake_vanilla.jpg", hasImage: true },

    // Blended Items
    { name: "Caramel Frappe", price: 300, category: "Blended", image: "frappe_crushed_caramel.jpg", hasImage: true },
    { name: "Vanilla Frappe", price: 300, category: "Blended", image: "frappe_crushed_vanilla.jpg", hasImage: true },
    { name: "Hazelnut Frappe", price: 300, category: "Blended", image: "frappe_crushed_hazelnut.jpg", hasImage: true },
    { name: "Mocha Frappe", price: 300, category: "Blended", image: "frappe_crushed_mocha.jpg", hasImage: true },
    { name: "Oreo Blended", price: 320, category: "Blended", image: "alternate_oreo.jpg", hasImage: true },
    { name: "KitKat Blended", price: 320, category: "Blended", image: "alternate_kitkat.jpg", hasImage: true },
    { name: "Strawberry Blended", price: 320, category: "Blended", image: "alternate_strawberry.jpg", hasImage: true },
    { name: "Crunchy Mocha", price: 350, category: "Blended", image: "crunchy_mocha.jpg", hasImage: true },

    // Mojito/Ice Tea Items
    { name: "Peach Iced Tea", price: 220, category: "Mojito/Ice Tea", image: "iced_tea_peach.jpg", hasImage: true },
    { name: "Lemon Iced Tea", price: 220, category: "Mojito/Ice Tea", image: "iced_tea_lemon.jpg", hasImage: true },
    { name: "Hibiscus Iced Tea", price: 250, category: "Mojito/Ice Tea", image: "iced_tea_hibiscus.jpg", hasImage: true },
    { name: "Matcha Iced Tea", price: 300, category: "Mojito/Ice Tea", image: "iced_tea_matcha.jpg", hasImage: true },
    { name: "Matcha Flavours", price: 350, category: "Mojito/Ice Tea", image: "matcha_flavours.jpg", hasImage: true },
    { name: "Apple Iced Tea", price: 300, category: "Mojito/Ice Tea", image: "iced_tea_apple.jpg", hasImage: true },
    { name: "Lemon Lemonade", price: 210, category: "Mojito/Ice Tea", image: "lemonade_lemon.jpg", hasImage: true },
    { name: "Mint Lemonade", price: 220, category: "Mojito/Ice Tea", image: "mint_lemonade.jpg", hasImage: true },
    { name: "Peach Lemonade", price: 250, category: "Mojito/Ice Tea", image: "lemonade_peach.jpg", hasImage: true },
    { name: "Strawberry Lemonade", price: 260, category: "Mojito/Ice Tea", image: "lemonade_strawberry.jpg", hasImage: true },
    { name: "Mango Lemonade", price: 260, category: "Mojito/Ice Tea", image: "lemonade_mango.jpg", hasImage: true },
    { name: "Sweet Lassi", price: 180, category: "Mojito/Ice Tea", image: "lassi_sweet.jpg", hasImage: true },
    { name: "Banana Lassi", price: 200, category: "Mojito/Ice Tea", image: "lassi_banana.jpg", hasImage: true },
    { name: "Mango Lassi", price: 200, category: "Mojito/Ice Tea", image: "lassi_mango.jpg", hasImage: true },
    { name: "Virgin Mojito", price: 210, category: "Mojito/Ice Tea", image: "virgin_mojito.jpg", hasImage: true },
    { name: "Blueberry Mojito", price: 280, category: "Mojito/Ice Tea", image: "blueberry_mojito.jpg", hasImage: true },
    { name: "Passion Fruit Mojito", price: 280, category: "Mojito/Ice Tea", image: "passion_fruit_mojito.jpg", hasImage: true },
    { name: "Strawberry Mojito", price: 270, category: "Mojito/Ice Tea", image: "strawberry_mojito.jpg", hasImage: true },
    { name: "Mango Mojito", price: 280, category: "Mojito/Ice Tea", image: "mango_mojito.jpg", hasImage: true },
    { name: "Flavoured Soda", price: 250, category: "Mojito/Ice Tea", image: "flavoured_soda.jpg", hasImage: true },
 
    // Soft Drink Items
    { name: "Fanta", price: 95, category: "Soft Drink", image: "fanta.jpg", hasImage: true },
    { name: "Coke", price: 95, category: "Soft Drink", image: "coke.jpg", hasImage: true },
    { name: "Sprite", price: 95, category: "Soft Drink", image: "sprite.jpg", hasImage: true },
    { name: "Bubble Tea", price: 250, category: "Soft Drink", image: "bubble-tea.jpg", hasImage: true },
    { name: "T/A Bubble Tea", price: 300, category: "Soft Drink", image: "ta-bubble-tea.jpg", hasImage: true },
    { name: "Apple Juice", price: 300, category: "Soft Drink", image: "apple_juice.jpg", hasImage: true },
    { name: "Orange Juice", price: 300, category: "Soft Drink", image: "orange_juice.jpg", hasImage: true },
  
    // Tea Items
    { name: "Chamomile Tea", price: 150, category: "Tea", image: "chamomile.jpg", hasImage: true },
    { name: "Calming Tea", price: 200, category: "Tea", image: "calming_tea.jpg", hasImage: true },
    { name: "Midnight Red Rose", price: 200, category: "Tea", image: "midnight_red_rose.jpg", hasImage: true },
    { name: "Floral Delight", price: 200, category: "Tea", image: "floral_delight.jpg", hasImage: true },
    { name: "Himalayan Herbal", price: 150, category: "Tea", image: "himalayan_herbal.jpg", hasImage: true },
    { name: "Peppermint Tea", price: 150, category: "Tea", image: "peppermint.jpg", hasImage: true },
    { name: "Spearmint Tea", price: 150, category: "Tea", image: "spearmint.jpg", hasImage: true },
    { name: "Black Rosella", price: 150, category: "Tea", image: "black_rosella.jpg", hasImage: true },
    { name: "Lemon Tea", price: 150, category: "Tea", image: "lemon_tea.jpg", hasImage: true },
    { name: "Hibiscus Tea", price: 180, category: "Tea", image: "hibiscus.jpg", hasImage: true },
    { name: "Butterfly Tea", price: 180, category: "Tea", image: "butterfly.jpg", hasImage: true },
    { name: "Jasmine Tea", price: 150, category: "Tea", image: "jasmine.jpg", hasImage: true },
    { name: "Organic Black Tea", price: 100, category: "Tea", image: "organic_black_tea.jpg", hasImage: true },
    { name: "Himalayan Pearl Tea", price: 120, category: "Tea", image: "himalayan_pearl_black_tea.jpg", hasImage: true },
    { name: "Illam Lemon Grass", price: 150, category: "Tea", image: "illam_with_lemon_grass.jpg", hasImage: true },
    { name: "Earl Grey", price: 150, category: "Tea", image: "earl_grey.jpg", hasImage: true },
    { name: "Green Tea", price: 120, category: "Tea", image: "green_tea.jpg", hasImage: true },
    { name: "Lavender Rose", price: 220, category: "Tea", image: "flower_tea.jpg", hasImage: true },
    { name: "Organic Green Tea", price: 150, category: "Tea", image: "pearl_green_tea.jpg", hasImage: true },
    { name: "Himalayan Green Tea", price: 150, category: "Tea", image: "himalayan_green_tea.jpg", hasImage: true },
    { name: "Hot Lemon", price: 75, category: "Tea", image: "hot_lemon.jpg", hasImage: true },
    { name: "Honey Hot Lemon", price: 125, category: "Tea", image: "honey_hot_lemon.jpg", hasImage: true },
    { name: "Ginger Honey Lemon", price: 130, category: "Tea", image: "ginger_honey_hot_lemon.jpg", hasImage: true }
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
    
    // Also show login dialog after 1 second
    setTimeout(() => {
        message.remove();
        showLoginDialog();
    }, 1500);
    
    // Auto remove after 3 seconds if no action
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
        
        // Successful login
        currentUser = {
            name: 'Taboche Staff',
            role: 'staff',
            loggedIn: true
        };
        
        // Save to localStorage
        saveData();
        
        // Update UI
        updateUIBasedOnRole();
        closeLoginDialog();
        
        // Now render tables and menu
        renderTables();
        renderMenu();
        
        // Show success message
        showSuccessMessage('Login Successful', 'Welcome Taboche Staff');
    } else {
        console.log("Login failed");
        // Show error
        document.getElementById('login-error').style.display = 'block';
    }
}

// Alias for compatibility
window.handleLogin = loginWithCredentials;

function logout() {
    currentUser = {
        name: 'Guest',
        role: 'guest',
        loggedIn: false
    };
    
    // Clear any selected table
    selectedTable = null;
    
    // Save and update
    saveData();
    updateUIBasedOnRole();
    updateOrderSummary();
    
    // Clear tables and menu displays
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
    
    // Update user display
    if (userSpan) {
        userSpan.textContent = currentUser.name;
    }
    
    // Update role badge
    if (roleBadge) {
        if (currentUser.loggedIn) {
            roleBadge.style.display = 'inline-flex';
            roleBadge.className = `role-badge ${role}`;
            roleBadge.innerHTML = `<i class="fas fa-user-tie"></i> Staff`;
        } else {
            roleBadge.style.display = 'none';
        }
    }
    
    // Update login/logout buttons
    if (loginBtnText) {
        loginBtnText.textContent = currentUser.loggedIn ? 'Switch User' : 'Login';
    }
    
    if (logoutBtn) {
        logoutBtn.style.display = currentUser.loggedIn ? 'flex' : 'none';
    }
    
    // Show/hide login overlay
    if (overlay) {
        overlay.style.display = currentUser.loggedIn ? 'none' : 'flex';
    }
    
    // Show/hide FAB button
    if (fabButton) {
        fabButton.style.display = (currentUser.loggedIn && window.innerWidth <= 768) ? 'flex' : 'none';
    }
    
    // Add role class to body
    body.classList.remove('guest-mode', 'staff-mode');
    body.classList.add(`${currentUser.role}-mode`);
    
    // Show/hide POS container
    if (posContainer) {
        posContainer.style.display = currentUser.loggedIn ? 'flex' : 'none';
    }
    
    // Update order summary
    updateOrderSummary();
}

// ===== REMOVE REASON FUNCTIONS =====
function removeFromOrder(name) {
    if (!checkLoginAndExecute('canRemoveItems')) return;
    
    if (!selectedTable) {
        alert("Please select a table first!");
        return;
    }
    
    // Store the item name for removal
    pendingRemoval = name;
    
    // Show reason dialog
    showRemoveReasonDialog();
}

function showRemoveReasonDialog() {
    const dialog = document.getElementById('remove-reason-dialog');
    if (!dialog) return;
    
    // Clear previous input
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
    
    // Record removal (whole item/line)
    const removalRecord = {
        id: Date.now(),
        itemName: pendingRemoval,
        quantity: item.quantity,           // the remaining quantity being removed
        price: item.price,
        totalAmount: item.price * item.quantity,
        table: selectedTable,
        reason: reason,
        removedBy: currentUser.name || 'Staff',
        removedAt: new Date().toISOString(),
        timestamp: new Date().toLocaleString()
    };
    
    removalHistory.push(removalRecord);
    
    // Actually remove the item
    delete table.order[pendingRemoval];
    
    // Recalculate total
    let total = 0;
    Object.values(table.order).forEach(i => {
        total += i.price * i.quantity;
    });
    
    table.totalPrice = parseFloat(total.toFixed(2));
    table.discountedTotal = parseFloat((table.totalPrice * (1 - (table.discount || 0) / 100)).toFixed(2));
    
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
            // Ensure existing tables have all required properties
            if (!tables[tableName].order) tables[tableName].order = {};
            if (!tables[tableName].payments) tables[tableName].payments = [];
            if (tables[tableName].discount === undefined) tables[tableName].discount = 0;
            if (tables[tableName].discountedTotal === undefined) tables[tableName].discountedTotal = 0;
            
            // Fix status if table has items but marked available
            if (tables[tableName].status === "available" && Object.keys(tables[tableName].order || {}).length > 0) {
                tables[tableName].status = "occupied";
            }
            // Fix status if table has no items but marked occupied
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
    
    saveData();
}

// ===== RENDER FUNCTIONS =====
function renderTables() {
    if (!checkLoginAndExecute('canViewTables', false)) return;
    
    const dashboard = document.getElementById('tables-dashboard');
    if (!dashboard) return;
    
    dashboard.innerHTML = '';
    
    // Sort tables
    Object.keys(tables).sort((a, b) => {
        const numA = parseInt(a.replace('Table ', ''));
        const numB = parseInt(b.replace('Table ', ''));
        return numA - numB;
    }).forEach(table => {
        const info = tables[table];
        const tableBtn = document.createElement('button');
        
        // Set class based on status
        if (info.status === "occupied") {
            tableBtn.className = 'table-btn occupied';
        } else {
            tableBtn.className = 'table-btn available';
        }
        
        // Add item count badge if occupied
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
    
    // Predefined colors for icons
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
        
        // Get color for this category
        const bgColor = categoryColors[item.category] || '#4A90E2';
        const firstLetter = item.name.charAt(0).toUpperCase();
        
        // Create hybrid content
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
    
    // Only set time if there are items
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
        removeFromOrder(name);
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
            timeAdded: Date.now()
        };
    } else {
        table.order[name].quantity += 1;
    }
    
    // Update totals
    let total = 0;
    Object.values(table.order).forEach(item => {
        total += item.price * item.quantity;
    });
    
    table.totalPrice = parseFloat(total.toFixed(2));
    table.discountedTotal = parseFloat((table.totalPrice * (1 - (table.discount || 0) / 100)).toFixed(2));
    
    // Set status to occupied
    table.status = "occupied";
    if (!table.time) {
        table.time = new Date().toLocaleTimeString();
    }
    table.newItemsAdded = true;
    
    // Add animation feedback
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
    
    // Calculate new quantity
    let newQuantity = item.quantity + delta;
    
    if (newQuantity <= 0) {
        // Going to zero or below → treat as full removal → ask reason
        pendingRemoval = name;
        showRemoveReasonDialog();
        // Do NOT delete here yet – wait for reason confirmation
        return;
    }
    
    // Normal decrease (quantity stays ≥ 1) – no reason needed
    item.quantity = newQuantity;
    
    // Recalculate totals
    let total = 0;
    Object.values(table.order).forEach(i => {
        total += i.price * i.quantity;
    });
    
    table.totalPrice = parseFloat(total.toFixed(2));
    table.discountedTotal = parseFloat((table.totalPrice * (1 - (table.discount || 0) / 100)).toFixed(2));
    
    // If somehow empty (shouldn't happen here)
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
        
        const itemTotal = (item.price * item.quantity).toFixed(2);
        
        li.innerHTML = `
            <div class="item-info">
                <span class="item-name clickable" onclick="promptAndAddComment('${name}')" title="Click to add comment">
                    ${name} ${item.comments ? ' <i class="fas fa-comment" style="color: #4A90E2;"></i>' : ''}
                </span>
                ${item.comments ? `<span class="item-comments">📝 ${item.comments}</span>` : ''}
            </div>
            <div class="item-quantity">
                <button onclick="adjustQuantity('${name}', -1)" ${item.finalized || !perm.canRemoveItems ? 'disabled' : ''}>-</button>
                <span>${item.quantity}</span>
                <button onclick="adjustQuantity('${name}', 1)" ${item.finalized || !perm.canAddItems ? 'disabled' : ''}>+</button>
            </div>
            <span class="item-total">Rs ${itemTotal}</span>
            ${perm.canRemoveItems ? 
                `<button class="remove-item" onclick="removeFromOrder('${name}')" ${item.finalized ? 'disabled' : ''}>
                    <i class="fas fa-trash"></i>
                </button>` : 
                ''}
        `;
        
        container.appendChild(li);
    });
    
    // Enable mobile swipe features
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
    
    // Update active category button
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
    
    // Auto-focus on mobile
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
    
    // Reset payment summary
    document.getElementById('payment-summary').innerHTML = '';
    document.getElementById('change-amount').textContent = '0';
    document.getElementById('insufficient-amount').classList.add('hidden');
    document.getElementById('numeric-input').value = '';
    
    if (selectedTable && tables[selectedTable]) {
        tables[selectedTable].payments = [];
        tables[selectedTable].discount = 0;
        tables[selectedTable].discountedTotal = tables[selectedTable].totalPrice;
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
    
    // Calculate discountable and non-discountable totals
    let discountableTotal = 0;
    let nonDiscountableTotal = 0;
    
    Object.entries(table.order).forEach(([name, item]) => {
        const itemTotal = item.price * item.quantity;
        if (nonDiscountableItems.includes(name)) {
            nonDiscountableTotal += itemTotal;
        } else {
            discountableTotal += itemTotal;
        }
    });
    
    const discountedAmount = discountableTotal * (1 - table.discount / 100);
    table.discountedTotal = parseFloat((discountedAmount + nonDiscountableTotal).toFixed(2));
    
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
    const remaining = (table.discountedTotal || table.totalPrice) - totalPaid;
    
    if (amount <= 0) {
        alert("Please enter a valid amount.");
        return;
    }
    
    if (method === 'Mobile Payment' && (totalPaid + amount) > remaining) {
        alert(`Amount exceeds remaining balance. Max allowed: Rs ${remaining.toFixed(2)}`);
        return;
    }
    
    if (method === 'Mobile Payment') {
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
    
    // Update payment summary list
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
    tables[selectedTable].discountedTotal = tables[selectedTable].totalPrice;
    
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
    
    // Calculate discount amount
    let discountableTotal = 0;
    Object.entries(table.order).forEach(([name, item]) => {
        if (!nonDiscountableItems.includes(name)) {
            discountableTotal += item.price * item.quantity;
        }
    });
    const discountAmount = discountableTotal * (table.discount / 100);
    
    // Update sales data
    salesData.totalSales = (salesData.totalSales || 0) + totalDue;
    salesData.totalDiscounts = (salesData.totalDiscounts || 0) + discountAmount;
    salesData.totalOrders = (salesData.totalOrders || 0) + 1;
    
    table.payments.forEach(payment => {
        if (payment.method === 'Cash') {
            salesData.cashSales = (salesData.cashSales || 0) + payment.amount;
        } else {
            salesData.mobileSales = (salesData.mobileSales || 0) + payment.amount;
        }
    });
    
    // Update item sales
    Object.entries(table.order).forEach(([name, item]) => {
        const existingItem = salesData.items.find(i => i.name === name);
        if (existingItem) {
            existingItem.qty = (existingItem.qty || 0) + item.quantity;
            existingItem.totalSold = (existingItem.totalSold || 0) + (item.price * item.quantity);
        } else {
            salesData.items.push({
                name: name,
                qty: item.quantity,
                totalSold: item.price * item.quantity
            });
        }
    });
    
    // Save to order history
    orderHistory.push({
        table: selectedTable,
        order: { ...table.order },
        totalPrice: table.totalPrice,
        discountedTotal: totalDue,
        discount: table.discount,
        payments: [...table.payments],
        timestamp: new Date().toISOString()
    });
    
    // Reset table
    table.order = {};
    table.totalPrice = 0;
    table.discountedTotal = 0;
    table.status = "available";
    table.payments = [];
    table.discount = 0;
    table.time = null;
    table.newItemsAdded = false;
    
    const change = (totalPaid - totalDue).toFixed(2);
    if (parseFloat(change) > 0) {
        alert(`Order completed! Customer change: Rs ${change}`);
    } else {
        alert("Order completed successfully!");
    }
    
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

// ===== REPORT FUNCTIONS =====
function generateSalesReport() {
    const totalDiscounts = salesData.totalDiscounts || 0;
    const totalOrders = salesData.totalOrders || 0;
    const cashSales = salesData.cashSales || 0;
    const mobileSales = salesData.mobileSales || 0;
    const totalSales = salesData.totalSales || 0;
    const items = salesData.items || [];
    
    const itemRows = items.map(item => `
        <tr>
            <td>${item.name}</td>
            <td>${item.qty || 0}</td>
            <td>Rs ${(item.totalSold || 0).toFixed(2)}</td>
        </tr>
    `).join('');
    
    return `
        <div class="report-summary">
            <h3>Summary</h3>
            <p><strong>Total Sales:</strong> Rs ${totalSales.toFixed(2)}</p>
            <p><strong>Total Discounts:</strong> Rs ${totalDiscounts.toFixed(2)}</p>
            <p><strong>Total Orders:</strong> ${totalOrders}</p>
            <p><strong>Cash Sales:</strong> Rs ${cashSales.toFixed(2)}</p>
            <p><strong>Mobile Payments:</strong> Rs ${mobileSales.toFixed(2)}</p>
        </div>
        
        <h3>Item Sales Details</h3>
        <table class="items-table">
            <thead>
                <tr>
                    <th>Item Name</th>
                    <th>Quantity</th>
                    <th>Total</th>
                </tr>
            </thead>
            <tbody>
                ${itemRows || '<tr><td colspan="3">No items sold yet</td></tr>'}
            </tbody>
        </table>
    `;
}

function showSalesReportsContent() {
    if (!checkLoginAndExecute('canViewReports')) return;
    
    const modal = document.getElementById('salesReportModal');
    const content = document.getElementById('modalContent');
    
    if (!modal || !content) return;
    
    content.innerHTML = generateSalesReport();
    modal.style.display = 'flex';
    
    // Add removal history button to reports modal
    enhanceReportsModal();
    
    toggleSidebar();
}

function enhanceReportsModal() {
    const buttonContainer = document.querySelector('#salesReportModal .button-container');
    if (buttonContainer) {
        // Check if button already exists
        if (!document.querySelector('#removal-history-btn')) {
            const removalHistoryBtn = document.createElement('button');
            removalHistoryBtn.id = 'removal-history-btn';
            removalHistoryBtn.className = 'btn btn-danger';
            removalHistoryBtn.innerHTML = '<i class="fas fa-trash-alt"></i> Removal History';
            removalHistoryBtn.onclick = showRemovalHistory;
            buttonContainer.appendChild(removalHistoryBtn);
        }
    }
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
    
    // Reset all major histories
    salesData = {
        totalSales: 0,
        totalDiscounts: 0,
        totalOrders: 0,
        cashSales: 0,
        mobileSales: 0,
        items: []
    };
    
    orderHistory = [];
    voidHistory = [];
    removalHistory = [];               // ← Add this line
    
    // Optional: also clear all table orders if you want full reset
    // Object.keys(tables).forEach(table => {
    //     tables[table] = {
    //         order: {},
    //         totalPrice: 0,
    //         status: "available",
    //         payments: [],
    //         discount: 0,
    //         discountedTotal: 0,
    //         time: null,
    //         newItemsAdded: false
    //     };
    // });
    
    saveData();
    showSalesReportsContent();
    alert("All reports and history (including Item Removal History) have been reset.");
}

function printReport() {
    if (!checkLoginAndExecute('canPrint')) return;
    
    const reportContent = generateSalesReport();
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
        
        const itemsList = Object.entries(order.order).map(([name, item]) => `
            <tr>
                <td>${name}</td>
                <td>Rs ${item.price}</td>
                <td>${item.quantity}</td>
                <td>Rs ${(item.price * item.quantity).toFixed(2)}</td>
            </tr>
        `).join('');
        
        const paymentsList = order.payments.map(p => 
            `${p.method}: Rs ${p.amount.toFixed(2)}`
        ).join(', ');
        
        orderElem.innerHTML = `
            <div class="order-header">
                <h4>Order #${orderHistory.length - index}</h4>
                <span>${formattedDate} ${formattedTime}</span>
            </div>
            <p><strong>Table:</strong> ${order.table}</p>
            <p><strong>Total:</strong> Rs ${order.totalPrice.toFixed(2)}</p>
            <p><strong>Discount:</strong> ${order.discount}%</p>
            <p><strong>Discounted Total:</strong> Rs ${order.discountedTotal}</p>
            <p><strong>Payments:</strong> ${paymentsList}</p>
            <details>
                <summary>View Items</summary>
                <table class="items-table">
                    <thead>
                        <tr>
                            <th>Item</th>
                            <th>Price</th>
                            <th>Qty</th>
                            <th>Total</th>
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
        output.innerHTML = voidHistory.map(entry => `
            <div class="void-entry">
                <p><strong>${entry.date} ${entry.time}</strong></p>
                <p>Item: ${entry.name}</p>
                <p>Amount: Rs ${entry.amount.toFixed(2)}</p>
                <p>Table: ${entry.table}</p>
                <p>Reason: ${entry.comment}</p>
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
    // Home is already visible, just close sidebar
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
    
    // Transfer order
    tables[newTableName].order = { ...tables[selectedTable].order };
    tables[newTableName].totalPrice = tables[selectedTable].totalPrice;
    tables[newTableName].discountedTotal = tables[selectedTable].discountedTotal;
    tables[newTableName].discount = tables[selectedTable].discount;
    tables[newTableName].payments = [...tables[selectedTable].payments];
    tables[newTableName].status = "occupied";
    tables[newTableName].time = tables[selectedTable].time || new Date().toLocaleTimeString();
    tables[newTableName].newItemsAdded = tables[selectedTable].newItemsAdded;
    
    // Clear old table
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
                    body { font-family: 'Courier New', monospace; margin: 20px; }
                    .header { text-align: center; margin-bottom: 20px; }
                    .items { margin: 20px 0; }
                    .item { display: flex; justify-content: space-between; margin: 5px 0; }
                    .total { border-top: 2px dashed #000; padding-top: 10px; margin-top: 10px; }
                    .footer { text-align: center; margin-top: 30px; font-style: italic; }
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
                    ${Object.entries(table.order).map(([name, item]) => `
                        <div class="item">
                            <span>${name} x${item.quantity}</span>
                            <span>Rs ${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                    `).join('')}
                </div>
                
                <div class="total">
                    <div class="item"><strong>Subtotal:</strong> <span>Rs ${table.totalPrice.toFixed(2)}</span></div>
                    <div class="item"><strong>Discount (${table.discount}%):</strong> <span>-Rs ${(table.totalPrice - table.discountedTotal).toFixed(2)}</span></div>
                    <div class="item"><strong>Total:</strong> <span>Rs ${(table.discountedTotal || table.totalPrice).toFixed(2)}</span></div>
                </div>
                
                <div class="footer">
                    <p>Thank you for dining with us!</p>
                    <p>Please visit again</p>
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
            // Swipe left - show remove option
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
                // Rapid increment/decrement
                const action = btn.textContent === '+' ? 'increment' : 'decrement';
                const itemName = btn.closest('.order-item').querySelector('.item-name').textContent;
                
                // Trigger multiple times
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
    
    // Remove existing bottom sheet if any
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
    
    // Show bottom sheet
    setTimeout(() => {
        bottomSheet.classList.add('active');
    }, 100);
    
    // Hide on swipe down
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
    
    // Initialize tables
    initializeTables();
    
    // Render categories (always visible but filtered by login)
    renderCategories();
    
    // Update date/time
    updateDateTime();
    setInterval(updateDateTime, 1000);
    
    // Load removal history
    removalHistory = JSON.parse(localStorage.getItem('removalHistory')) || [];
    
    // Initialize user interface based on login state
    updateUIBasedOnRole();
    
    // If logged in, render tables and menu
    if (currentUser.loggedIn) {
        renderTables();
        renderMenu();
    }
    
    // Add click outside to close modals
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
    
    // Handle fullscreen change
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
    
    // Add mobile detection
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (isMobile) {
        document.body.classList.add('is-mobile');
        
        // Add double-tap to zoom prevention
        document.addEventListener('touchstart', (e) => {
            if (e.touches.length > 1) {
                e.preventDefault();
            }
        }, { passive: false });
        
        // Add viewport height fix for iOS
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