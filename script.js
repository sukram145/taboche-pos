
// Initialize tables from localStorage or create default structure
let tables = JSON.parse(localStorage.getItem('tables')) || {};
for (let i = 1; i <= 20; i++) {
  if (!tables[`Table ${i}`]) {
    tables[`Table ${i}`] = { order: {}, totalPrice: 0, status: "available", payments: [], discount: 0 };
  }
}

let selectedTable = "None";
let salesData = JSON.parse(localStorage.getItem('salesData')) || {
  totalSales: 0,
  totalDiscounts: 0,
  totalOrders: 0
};

// Save data to local storage
function saveData() {
  localStorage.setItem('tables', JSON.stringify(tables));
  localStorage.setItem('salesData', JSON.stringify(salesData));
}

function renderTables() {
  const dashboard = document.getElementById('tables-dashboard');
  if (dashboard) {
    dashboard.innerHTML = '';
    for (const [table, info] of Object.entries(tables)) {
      const tableCard = document.createElement('div');
      tableCard.className = `table-card ${info.status}`;
      tableCard.textContent = table;
      tableCard.onclick = () => selectTable(table);
      dashboard.appendChild(tableCard);
    }
  }
}

function selectTable(table) {
  selectedTable = table;
  const selectedTableDisplayElem = document.getElementById('selected-table-display');
  if (selectedTableDisplayElem) {
    selectedTableDisplayElem.textContent = table;
  }
  const orderSection = document.getElementById('order-section');
  if (orderSection) {
    orderSection.style.display = 'block';
  }
  updateOrderSummary();
}

function addToOrder(name, price) {
  if (selectedTable === "None") {
    alert("Please select a table first!");
    return;
  }

  if (!tables[selectedTable].order[name]) {
    tables[selectedTable].order[name] = { price: price, quantity: 0 };
  }
  tables[selectedTable].order[name].quantity += 1;
  tables[selectedTable].totalPrice += price;
  tables[selectedTable].status = "occupied";

  renderTables();
  updateOrderSummary();
  saveData();
}

function removeFromOrder(name) {
  if (tables[selectedTable].order[name]) {
    tables[selectedTable].totalPrice -= tables[selectedTable].order[name].price;
    tables[selectedTable].order[name].quantity -= 1;
    if (tables[selectedTable].order[name].quantity <= 0) {
      delete tables[selectedTable].order[name];
    }
    if (tables[selectedTable].totalPrice === 0) {
      tables[selectedTable].status = "available";
    }
    renderTables();
    updateOrderSummary();
    saveData();
  }
}

function updateOrderSummary() {
  const orderItems = tables[selectedTable].order;
  displayOrderItems(orderItems);
}

function displayOrderItems(orderItems) {
  const orderItemsList = document.getElementById('order-items');
  orderItemsList.innerHTML = ''; // Clear existing items
  let totalPrice = 0;

  for (const [itemName, itemDetails] of Object.entries(orderItems)) {
    const listItem = document.createElement('li');
    listItem.textContent = `${itemName} - Rs ${itemDetails.price} x ${itemDetails.quantity}`;
    orderItemsList.appendChild(listItem);
    totalPrice += itemDetails.price * itemDetails.quantity;
  }

  document.getElementById('total-price').textContent = totalPrice;
  tables[selectedTable].totalPrice = totalPrice;
  saveData();
}
// Initial setup
document.addEventListener('DOMContentLoaded', renderTables);

function addPayment(method) {
  const amount = prompt(`Enter amount for ${method}:`);

  if (amount && !isNaN(amount)) {
    tables[selectedTable].payments.push({ method: method, amount: parseFloat(amount) });
    updatePaymentSummary();
    saveData();
  }
}

function updateOrderSummary() {
  const orderList = document.getElementById('order-items');
  const totalPriceElem = document.getElementById('total-price');

  if (orderList && totalPriceElem) {
    orderList.innerHTML = '';
    let totalPrice = tables[selectedTable]?.totalPrice || 0;

    for (const [name, item] of Object.entries(tables[selectedTable]?.order || {})) {
      const orderItem = document.createElement('li');
      orderItem.textContent = `${name} - Rs ${item.price} x ${item.quantity} = Rs ${item.price * item.quantity}`;
      orderList.appendChild(orderItem);

      const removeButton = document.createElement('button');
      removeButton.textContent = 'Remove';
      removeButton.onclick = () => removeFromOrder(name);
      orderItem.appendChild(removeButton);
    }

    totalPriceElem.textContent = applyDiscount(totalPrice, tables[selectedTable]?.discount || 0);
  }
}

function applyDiscount(total, discount) {
  return total - (total * discount / 100);
}

function applyDiscountHandler() {
  const discountElem = document.getElementById('discount');

  if (discountElem) {
    const discount = parseFloat(discountElem.value);

    if (!isNaN(discount) && discount >= 0 && discount <= 100) {
      tables[selectedTable].discount = discount;
      updateOrderSummary();
      saveData();
    } else {
      alert("Discount must be between 0 and 100");
    }
  }
}

function updatePaymentSummary() {
  const paymentSummaryElem = document.getElementById('payment-summary');
  const changeAmountElem = document.getElementById('change-amount');
  const totalPriceElem = document.getElementById('total-price');

  if (paymentSummaryElem && changeAmountElem && totalPriceElem) {
    paymentSummaryElem.innerHTML = '';
    let totalPaid = 0;

    (tables[selectedTable]?.payments || []).forEach(payment => {
      const paymentItem = document.createElement('li');
      paymentItem.textContent = `${payment.method}: Rs ${payment.amount}`;
      paymentSummaryElem.appendChild(paymentItem);
      totalPaid += payment.amount;
    });

    const totalPrice = parseFloat(totalPriceElem.textContent);
    const change = totalPaid - totalPrice;

    changeAmountElem.textContent = change >= 0 ? change : 0;

    const insufficientAmountElem = document.getElementById('insufficient-amount');
    const shortAmountElem = document.getElementById('short-amount');

    if (totalPaid < totalPrice) {
      insufficientAmountElem.style.display = 'block';
      shortAmountElem.textContent = totalPrice - totalPaid;
    } else {
      insufficientAmountElem.style.display = 'none';
    }
  }
}

function showPaymentDialog() {
  const paymentDialog = document.getElementById('payment-dialog');

  if (paymentDialog) {
    paymentDialog.style.display = 'flex';
  }
}

function closePaymentDialog() {
  const paymentDialog = document.getElementById('payment-dialog');

  if (paymentDialog) {
    paymentDialog.style.display = 'none';
  }
}

function completeOrder() {
  const totalPriceElem = document.getElementById('total-price');
  
  if (!totalPriceElem || !totalPriceElem.textContent) {
    alert('Total price element is not found or its content is invalid.');
    return;
  }
  
  const totalPrice = parseFloat(totalPriceElem.textContent);
  const discount = tables[selectedTable]?.discount || 0;
  const totalPaid = tables[selectedTable]?.payments.reduce((sum, payment) => sum + payment.amount, 0) || 0;

  if (totalPaid < totalPrice) {
    const shortAmount = totalPrice - totalPaid;
    alert(`Payment is not enough to settle the order! Short by Rs ${shortAmount}`);
    return;
  }

  printReceipt();
  updateSalesData(totalPrice, discount);

  if (tables[selectedTable]) {
    tables[selectedTable].order = {};
    tables[selectedTable].totalPrice = 0;
    tables[selectedTable].status = "available";
    tables[selectedTable].payments = [];
    tables[selectedTable].discount = 0;
  }

  closePaymentDialog();

  renderTables();
  updateOrderSummary();
  updatePaymentSummary();
  saveData();

  alert("Order completed successfully!");
  displaySalesReport();
}

function showPaymentDialog() {
  const paymentDialog = document.getElementById('payment-dialog');

  if (paymentDialog) {
    paymentDialog.style.display = 'flex';
  }
}

function closePaymentDialog() {
  const paymentDialog = document.getElementById('payment-dialog');

  if (paymentDialog) {
    paymentDialog.style.display = 'none';
  }
}

function finalizeOrder() {
  if (selectedTable === "None") {
    alert("Please select a table first!");
    return;
  }

  const kitchenOrders = [];
  const barOrders = [];

  for (const [name, item] of Object.entries(tables[selectedTable].order)) {
    const sectionElem = document.querySelector(`.menu-item[data-name="${name}"]`);
    if (sectionElem) {
      const section = sectionElem.getAttribute('data-section');
      if (section === 'Kitchen') {
        kitchenOrders.push(`${name} - Rs ${item.price} x ${item.quantity}`);
      } else if (section === 'Bar') {
        barOrders.push(`${name} - Rs ${item.price} x ${item.quantity}`);
      }
    }
  }

  if (kitchenOrders.length > 0) {
    console.log(`Sending to Kitchen: Table ${selectedTable}, Orders: ${kitchenOrders.join(', ')}`);
  }
  if (barOrders.length > 0) {
    console.log(`Sending to Bar: Table ${selectedTable}, Orders: ${barOrders.join(', ')}`);
  }

  alert('Order finalized and sent to Kitchen and Bar!');
}
function completeOrder() {
  const totalPriceElem = document.getElementById('total-price');
  
  if (!totalPriceElem || !totalPriceElem.textContent) {
    alert('Total price element is not found or its content is invalid.');
    return;
  }
  
  const totalPrice = parseFloat(totalPriceElem.textContent);
  const discount = tables[selectedTable]?.discount || 0; // Handle undefined selectedTable
  const totalPaid = tables[selectedTable]?.payments.reduce((sum, payment) => sum + payment.amount, 0) || 0; // Handle undefined selectedTable

  if (totalPaid < totalPrice) {
    const shortAmount = totalPrice - totalPaid;
    alert(`Payment is not enough to settle the order! Short by Rs ${shortAmount}`);
    return;
  }

  printReceipt();

  updateSalesData(totalPrice, discount); // Update sales data with the total price and discount
  
  // Clear order, price, and status information for the selected table
  if (tables[selectedTable]) {
    tables[selectedTable].order = {};
    tables[selectedTable].totalPrice = 0;
    tables[selectedTable].status = "available";
    tables[selectedTable].payments = [];
    tables[selectedTable].discount = 0;
  }

  closePaymentDialog(); // Close payment dialog after completing the order

  // Update the UI and save data
  renderTables();
  updateOrderSummary();
  updatePaymentSummary();
  saveData();

  alert("Order completed successfully!");
  displaySalesReport(); // Display updated sales report
}
function printReceipt() {
  let receiptWindow = window.open('', 'PRINT', 'height=600,width=800');

  receiptWindow.document.write('<html><head><title>Receipt</title>');
  receiptWindow.document.write('</head><body style="font-family: Arial, sans-serif; margin: 20px;">');
  receiptWindow.document.write('<div style="text-align: center;">');
  receiptWindow.document.write('<h1>Taboche Restaurant</h1>');
  receiptWindow.document.write('<p>Address: 1234 Culinary Street, Kathmandu, Nepal</p>');
  receiptWindow.document.write('<p>Phone: +977-1-1234567</p>');
  receiptWindow.document.write('<p>Email: info@taboche-restaurant.com</p>');
  receiptWindow.document.write('<p>Website: www.taboche-restaurant.com</p>');
  receiptWindow.document.write('<hr>');
  receiptWindow.document.write('</div>');
  
  receiptWindow.document.write('<p><strong>Table:</strong> ' + selectedTable + '</p>');
  receiptWindow.document.write('<p><strong>Date:</strong> ' + new Date().toLocaleString() + '</p>');
  receiptWindow.document.write('<h2>Order Details</h2>');
  receiptWindow.document.write('<ul>');

  for (const [name, item] of Object.entries(tables[selectedTable].order)) {
    receiptWindow.document.write('<li>' + name + ' - Rs ' + item.price + ' x ' + item.quantity + ' = Rs ' + (item.price * item.quantity) + '</li>');
  }

  receiptWindow.document.write('</ul>');
  receiptWindow.document.write('<hr>');
  receiptWindow.document.write('<p><strong>Total:</strong> Rs ' + tables[selectedTable].totalPrice + '</p>');
  receiptWindow.document.write('<p><strong>Discount:</strong> ' + tables[selectedTable].discount + '%</p>');
  receiptWindow.document.write('<h3>Payments</h3>');
  receiptWindow.document.write('<ul>');

  tables[selectedTable].payments.forEach(payment => {
    receiptWindow.document.write('<li>' + payment.method + ': Rs ' + payment.amount + '</li>');
  });

  receiptWindow.document.write('</ul>');
  receiptWindow.document.write('<p><strong>Change:</strong> Rs ' + document.getElementById('change-amount').textContent + '</p>');
  receiptWindow.document.write('<hr>');
  receiptWindow.document.write('<div style="text-align: center;">');
  receiptWindow.document.write('<p>We hope you enjoyed your meal!</p>');
  receiptWindow.document.write('<p>Thank you for dining with us. Please come again!</p>');
  receiptWindow.document.write('</div>');
  receiptWindow.document.write('</body></html>');

  receiptWindow.document.close();
  receiptWindow.focus();
  receiptWindow.print();
  receiptWindow.close();
}



// Function to update sales data
function updateSalesData(totalPrice, discount) {
  salesData.totalSales += totalPrice;
  salesData.totalDiscounts += (totalPrice * discount / 100);
  salesData.totalOrders += 1;
  saveData();
}

// Function to display sales report
function displaySalesReport() {
  const report = `
    <h3>Sales Report</h3>
    <p>Total Sales: Rs ${salesData.totalSales}</p>
    <p>Total Discounts: Rs ${salesData.totalDiscounts}</p>
    <p>Total Orders: ${salesData.totalOrders}</p>
  `;
  document.getElementById('sales-report').innerHTML = report;
}

// Function to reset sales report and total orders
function resetSalesReport() {
  salesData = {
    totalSales: 0,
    totalDiscounts: 0,
    totalOrders: 0
  };
  document.getElementById('sales-report').innerHTML = '';
  document.getElementById('order-items').innerHTML = '';
  document.getElementById('total-price').textContent = '0';
  alert('Sales report and total orders have been reset.');
  saveData();
}

// Function to print sales report
function printSalesReport() {
  const salesReport = document.getElementById('sales-report').innerHTML;
  console.log('Sales Report:', salesReport);
  // Additional logic to send the report to a printer or save it as a file can be added here.
}

// Function to print and reset sales report and total orders
function printAndResetSalesReport() {
  printSalesReport();
  resetSalesReport();
}

// Function to schedule a reset at midnight
function scheduleMidnightReset() {
  const now = new Date();
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0); // Set to next midnight
  const timeToMidnight = midnight.getTime() - now.getTime();

  setTimeout(() => {
    printAndResetSalesReport();
    setInterval(printAndResetSalesReport, 24 * 60 * 60 * 1000); // Repeat every 24 hours
  }, timeToMidnight);
}

// Sidebar navigation functions
function goToHome() {
  window.location.href = 'home.html';
}

function getCategories() {
  window.location.href = '.category.html';
}

function getSalesReports() {
  window.location.href = 'salesreports.html';
}

function  gosettings   () {
  window.location.href = 'settings.html';
}

// Function to update datetime display
function updateDateTime() {
  const datetimeElem = document.getElementById('datetime');
  if (datetimeElem) {
    const now = new Date();
    const formattedDate = now.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
    datetimeElem.textContent = formattedDate;
  }
}
setInterval(updateDateTime, 1000);

// JavaScript for sidebar toggle
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  sidebar.classList.toggle('active');
}

// JavaScript for filtering categories
function filterCategory(category) {
  const menuItems = document.querySelectorAll('.menu-item');
  menuItems.forEach(item => {
    if (item.dataset.category === category || category === 'All') {
      item.style.display = 'block';
    } else {
      item.style.display = 'none';
    }
  });
}

// Category and Item Management

function showAddCategoryDialog() {
  document.getElementById('add-category-dialog').style.display = 'block';
}

function closeAddCategoryDialog() {
  document.getElementById('add-category-dialog').style.display = 'none';
}

function showRemoveCategoryDialog() {
  populateCategoryOptions();
  document.getElementById('remove-category-dialog').style.display = 'block';
}

function closeRemoveCategoryDialog() {
  document.getElementById('remove-category-dialog').style.display = 'none';
}

function showAddItemDialog() {
  populateCategorySelect();
  document.getElementById('add-item-dialog').style.display = 'block';
}

function closeAddItemDialog() {
  document.getElementById('add-item-dialog').style.display = 'none';
}

function showRemoveItemDialog() {
  populateItemOptions();
  document.getElementById('remove-item-dialog').style.display = 'block';
}

function closeRemoveItemDialog() {
  document.getElementById('remove-item-dialog').style.display = 'none';
}

function addCategory() {
  const newCategory = document.getElementById('new-category').value.trim();
  if (newCategory) {
    const categories = getCategories();
    categories.push(newCategory);
    saveCategories(categories);
    
    const categoryButton = document.createElement('button');
    categoryButton.textContent = newCategory;
    categoryButton.onclick = () => filterCategory(newCategory);
    document.querySelector('.categories').appendChild(categoryButton);
    
    alert('Category added successfully');
    closeAddCategoryDialog();
  }
}

function removeCategory() {
  const categorySelect = document.getElementById('category-select');
  const selectedCategory = categorySelect.value;
  let categories = getCategories();
  categories = categories.filter(category => category !== selectedCategory);
  saveCategories(categories);
  
  const buttons = document.querySelectorAll('.categories button');
  buttons.forEach(button => {
    if (button.textContent === selectedCategory) {
      button.remove();
    }
  });
  
  alert('Category removed successfully');
  closeRemoveCategoryDialog();
}

function addItem() {
  const itemName = document.getElementById('new-item-name').value.trim();
  const itemPrice = parseFloat(document.getElementById('new-item-price').value.trim());
  const itemCategory = document.getElementById('new-item-category').value;
  const itemImage = document.getElementById('new-item-image').files[0];
  
  if (itemName && itemPrice && itemCategory && itemImage) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const newItem = {
        name: itemName,
        price: itemPrice,
        category: itemCategory,
        image: e.target.result
      };
      const items = getItems();
      items.push(newItem);
      saveItems(items);
      
      const itemElement = document.createElement('div');
      itemElement.className = 'menu-item';
      itemElement.dataset.name = itemName;
      itemElement.dataset.price = itemPrice;
      itemElement.dataset.category = itemCategory;
      itemElement.innerHTML = `
        <img src="${e.target.result}" alt="${itemName}">
        <p>${itemName} - Rs ${itemPrice}</p>
      `;
      document.getElementById('menu').appendChild(itemElement);
      addMenuItemListener(itemElement);
      
      alert('Item added successfully');
      closeAddItemDialog();
    };
    reader.readAsDataURL(itemImage);
  }
}

function removeItem() {
  const itemSelect = document.getElementById('item-select');
  const selectedItemName = itemSelect.value;
  let items = getItems();
  items = items.filter(item => item.name !== selectedItemName);
  saveItems(items);
  
  const menuItems = document.querySelectorAll('.menu-item');
  menuItems.forEach(item => {
    if (item.dataset.name === selectedItemName) {
      item.remove();
    }
  });
  
  alert('Item removed successfully');
  closeRemoveItemDialog();
}

// Function to populate category options
function populateCategoryOptions() {
  const categorySelect = document.getElementById('category-select');
  categorySelect.innerHTML = '';
  const categories = getCategories();
  categories.forEach(category => {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = category;
    categorySelect.appendChild(option);
  });
}

// Function to populate category select
function populateCategorySelect() {
  const categorySelect = document.getElementById('new-item-category');
  categorySelect.innerHTML = '';
  const categories = getCategories();
  categories.forEach(category => {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = category;
    categorySelect.appendChild(option);
  });
}

// Function to populate item options
function populateItemOptions() {
  const itemSelect = document.getElementById('item-select');
  itemSelect.innerHTML = '';
  const items = getItems();
  items.forEach(item => {
    const option = document.createElement('option');
    option.value = item.name;
    option.textContent = item.name;
    itemSelect.appendChild(option);
  });
}

// Function to add menu item listeners
function addMenuItemListeners() {
  const menuItems = document.querySelectorAll('.menu-item');
  menuItems.forEach(item => {
    addMenuItemListener(item);
  });
}

// Function to add menu item listener
function addMenuItemListener(item) {
  item.addEventListener('click', () => {
    const name = item.getAttribute('data-name');
    const price = parseFloat(item.getAttribute('data-price'));
    addToOrder(name, price);
  });
}

// Functions to get and save categories to localStorage
function getCategories() {
  return JSON.parse(localStorage.getItem('categories')) || [];
}

function saveCategories(categories) {
  localStorage.setItem('categories', JSON.stringify(categories));
}

// Functions to get and save items to localStorage
function getItems() {
  return JSON.parse(localStorage.getItem('items')) || [];
}

function saveItems(items) {
  localStorage.setItem('items', JSON.stringify(items));
}

// Functions to get and save sales reports to localStorage
function getSalesReports() {
  return JSON.parse(localStorage.getItem('salesReports')) || [];
}

function saveSalesReports(reports) {
  localStorage.setItem('salesReports', JSON.stringify(reports));
}

// Initial setup
document.addEventListener('DOMContentLoaded', () => {
  // Load categories and items from localStorage
  const categories = getCategories();
  categories.forEach(category => {
    const categoryButton = document.createElement('button');
    categoryButton.textContent = category;
    categoryButton.onclick = () => filterCategory(category);
    document.querySelector('.categories').appendChild(categoryButton);
  });
  
  const items = getItems();
  items.forEach(item => {
    const itemElement = document.createElement('div');
    itemElement.className = 'menu-item';
    itemElement.dataset.name = item.name;
    itemElement.dataset.price = item.price;
    itemElement.dataset.category = item.category;
    itemElement.innerHTML = `
      <img src="${item.image}" alt="${item.name}">
      <p>${item.name} - Rs ${item.price}</p>
    `;
    document.getElementById('menu').appendChild(itemElement);
    addMenuItemListener(itemElement);
  });

  addMenuItemListeners();
  renderTables();
  displaySalesReport(); // Display initial sales report
  updateDateTime(); // Initial call to set the date and time immediately
});



// Initialize Firebase
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-app.firebaseapp.com",
  databaseURL: "https://your-app.firebaseio.com",
  projectId: "your-project-id",
  storageBucket: "your-app.appspot.com",
  messagingSenderId: "your-messaging-sender-id",
  appId: "your-app-id",
  measurementId: "your-measurement-id"
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Function to add an order
function addOrder(table, orderId, orderDetails) {
  database.ref('orders/' + table + '/' + orderId).set(orderDetails);
}

// Function to update an order
function updateOrder(table, orderId, updates) {
  database.ref('orders/' + table + '/' + orderId).update(updates);
}

// Function to remove an order
function removeOrder(table, orderId) {
  database.ref('orders/' + table + '/' + orderId).remove();
}

// Function to listen for order updates
function listenForOrderUpdates(table) {
  database.ref('orders/' + table).on('value', (snapshot) => {
    const orders = snapshot.val();
    console.log('Updated orders for ' + table + ':', orders);
    // Update the UI accordingly
  });
}
