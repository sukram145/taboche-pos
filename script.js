// Firebase configuration and initialization
const firebaseConfig = {
  apiKey: "AIzaSyA74YCQAfmUdu96AKIk41uSdiMS6imJz6E",
  authDomain: "taboche-pos.firebaseapp.com",
  databaseURL: "https://taboche-pos.firebaseio.com",
  projectId: "taboche-pos",
  storageBucket: "taboche-pos.firebasestorage.app",
  messagingSenderId: "902721301924",
  appId: "1:902721301924:web:c44ef0ade0ac7200ed6531",
  measurementId: "G-00TEQG2H1Z"
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();

console.log("Firebase initialized successfully."); 


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

// Function to filter categories
function filterCategory(category) {
const menuItems = document.querySelectorAll('.menu-item');
menuItems.forEach(item => {
  if (item.getAttribute('data-category') === category || category === 'all') {
    item.style.display = 'block';
  } else {
    item.style.display = 'none';
  }
});
}

function addToOrder(name, price) {
console.log(`Adding to order: ${name}, Price: ${price}, Selected Table: ${selectedTable}`);

if (selectedTable === "None") {
  alert("Please select a table first!");
  return;
}

if (!tables[selectedTable].order) {
  tables[selectedTable].order = {};  // Initialize the order object if it doesn't exist
}

if (!tables[selectedTable].order.hasOwnProperty(name)) {
  tables[selectedTable].order[name] = { price: price, quantity: 1 };  // Define item quantity starting at 1
  console.log(`Initializing quantity for ${name} to 1`);
} else {
  console.log(`Current quantity for ${name}: ${tables[selectedTable].order[name].quantity}`);
  tables[selectedTable].order[name].quantity += 1;  // Increment item quantity by 1
  console.log(`Incrementing quantity for ${name} to ${tables[selectedTable].order[name].quantity}`);
}

tables[selectedTable].totalPrice += price;
tables[selectedTable].status = "occupied";

console.log(`Total price for ${selectedTable}: ${tables[selectedTable].totalPrice}`);
console.log(`Order for ${selectedTable}:`, tables[selectedTable].order);

renderTables();
updateOrderSummary();
saveData();
}

// Ensure addToOrder is only called once
document.querySelectorAll('.menu-item').forEach(item => {
item.addEventListener('click', (event) => {
  event.stopImmediatePropagation(); // Prevent multiple event listeners from firing
  const name = item.getAttribute('data-name');
  const price = parseFloat(item.getAttribute('data-price'));
  console.log(`Menu item clicked: ${name}, Price: ${price}`);
  addToOrder(name, price);
});
});




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

  for (const [name, item] of Object.entries(orderItems)) {
    const orderItem = document.createElement('li');
    orderItem.textContent = `${name} - Rs ${item.price} x ${item.quantity} = Rs ${item.price * item.quantity}`;
    orderItemsList.appendChild(orderItem);

    const removeButton = document.createElement('button');
    removeButton.textContent = 'Remove';
    removeButton.onclick = () => removeFromOrder(name);
    orderItem.appendChild(removeButton);

    totalPrice += item.price * item.quantity;
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
  console.log('Resetting sales report and total orders...');
  
  salesData = {
    totalSales: 0,
    totalDiscounts: 0,
    totalOrders: 0
  };

  const salesReportElem = document.getElementById('sales-report');
  const orderItemsElem = document.getElementById('order-items');
  const totalPriceElem = document.getElementById('total-price');

  if (salesReportElem && orderItemsElem && totalPriceElem) {
    salesReportElem.innerHTML = '';
    orderItemsElem.innerHTML = '';
    totalPriceElem.textContent = '0';
  } else {
    console.error('One or more elements not found.');
  }
  
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

// Function to toggle the sidebar
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  if (sidebar) {
    sidebar.classList.toggle('active');
  }
}

// Function to show content based on the clicked link
function showContent(contentId) {
  const content = document.getElementById('content');
  if (content) {
    content.innerHTML = '';  // Clear existing content

    switch (contentId) {
      case 'home':
        content.innerHTML = '<h1>Welcome to Taboche POS</h1>';
        break;
      case 'add-item':
        content.innerHTML = '<h1>Add Item</h1><p>Functionality to add items will be here.</p>';
        break;
      case 'remove-item':
        content.innerHTML = '<h1>Remove Item</h1><p>Functionality to remove items will be here.</p>';
        break;
      case 'edit-item':
        content.innerHTML = '<h1>Edit Item</h1><p>Functionality to edit items will be here.</p>';
        break;
      case 'sales-reports':
        content.innerHTML = '<h1>Sales Reports</h1><p>Functionality to display sales reports will be here.</p>';
        break;
      case 'settings':
        content.innerHTML = '<h1>Settings</h1><p>Settings options will be here.</p>';
        break;
      case 'admin-panel':
        content.innerHTML = '<h1>Admin Panel</h1><p>Admin panel functionalities will be here.</p>';
        break;
      default:
        content.innerHTML = '<h1>Welcome to Taboche POS</h1>';
    }

    toggleSidebar();  // Close sidebar after selecting a content
  }
}

// Function to toggle the dropdown menu
function toggleDropdown() {
  const dropdownContainer = document.querySelector('.dropdown-container');
  if (dropdownContainer) {
    dropdownContainer.classList.toggle('show');
  }
}

// Function to show the login dialog (a simple prompt for now)
function showLoginDialog() {
  const userRoleElem = document.getElementById('user-role');
  if (userRoleElem) {
    const username = prompt('Enter your username:');
    const password = prompt('Enter your password:');
    if (username === 'admin' && password === 'password') {  // Example credentials, update with real authentication logic
      userRoleElem.textContent = 'Admin';
      alert('Login successful!');
    } else {
      alert('Invalid credentials!');
    }
  }
}

// Update date and time every second
function updateDateTime() {
  const datetimeElem = document.getElementById('datetime');
  if (datetimeElem) {
    setInterval(() => {
      const now = new Date();
      datetimeElem.textContent = now.toLocaleString();
    }, 1000);
  }
}

// Initialize date and time update
document.addEventListener('DOMContentLoaded', updateDateTime);
