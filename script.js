// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDW4CuRkoQtLKz1lF0vwzNG1vHC9P_cRgE",
  authDomain: "taboche-pos.firebaseapp.com",
  databaseURL: "https://taboche-pos.firebaseio.com",
  projectId: "taboche-pos",
  storageBucket: "taboche-pos.appspot.com",
  messagingSenderId: "902721301924",
  appId: "1:902721301924:web:c44ef0ade0ac7200ed6531"
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();

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


// Function to update table status
function updateTableStatus(tableId, status) {
  const tableCard = document.querySelector(`.table-btn-${tableId}`);
  if (tableCard) {
    if (status === 'occupied') {
      tableCard.classList.add('occupied');
      tableCard.classList.remove('available');
    } else {
      tableCard.classList.add('available');
      tableCard.classList.remove('occupied');
    }
  }
}

// Function to listen for order updates and update table status
function listenForOrderUpdates(table) {
  database.ref('orders/' + table).on('value', (snapshot) => {
    const orders = snapshot.val();
    console.log('Updated orders for ' + table + ':', orders);
    
    const tableStatus = orders ? 'occupied' : 'available';
    
    updateTableStatus(table, tableStatus);
    updateOrderSummary(table, orders);
  });
}

// Function to update order summary
function updateOrderSummary(tableId, orders) {
  const orderItems = document.getElementById('order-items');
  const totalPrice = document.getElementById('total-price');
  orderItems.innerHTML = '';
  let total = 0;

  if (orders) {
    Object.keys(orders).forEach(orderId => {
      const order = orders[orderId];
      const li = document.createElement('li');
      li.textContent = `${order.item} x${order.quantity}`;
      orderItems.appendChild(li);
      total += order.quantity; // Assuming each item costs 1 unit for simplicity
    });
  }

  totalPrice.textContent = total;
}

// Listening for updates on multiple tables
listenForOrderUpdates('table1');
listenForOrderUpdates('table2');
listenForOrderUpdates('table3');

// Example function to add an order manually (for testing)
document.querySelector('.table-btn-1').onclick = () => addOrder('table1', 'orderId1', { item: 'Pepperoni Pizza', quantity: 2, status: 'pending' });
document.querySelector('.table-btn-2').onclick = () => addOrder('table2', 'orderId2', { item: 'Margherita Pizza', quantity: 1, status: 'pending' });
document.querySelector('.table-btn-3').onclick = () => addOrder('table3', 'orderId3', { item: 'Cheeseburger', quantity: 3, status: 'pending' });

// Define addOrder function
function addOrder(tableId, orderId, orderDetails) {
  database.ref('orders/' + tableId + '/' + orderId).set(orderDetails)
    .then(() => {
      console.log('Order added successfully');
    })
    .catch((error) => {
      console.error('Error adding order: ', error);
    });
}

// Initial setup
document.addEventListener('DOMContentLoaded', () => {
  updateDateTime(); // Initial call to set the date and time immediately
});





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


// Function to toggle sidebar visibility
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const content = document.getElementById('content');
  sidebar.classList.toggle('active');
  content.classList.toggle('active');
}



// Sidebar navigation functions
function showContent(sectionId) {
  document.getElementById('content').innerHTML = `
    <div class="dialog">
        <div class="dialog-content">
            <span class="close-btn" onclick="closeDialog()">&times;</span>
            <h2>${sectionId.replace('-', ' ').toUpperCase()}</h2>
            ${getSectionContent(sectionId)}
        </div>
    </div>
  `;
  document.querySelector('.dialog').style.display = 'block';
}

function closeDialog() {
  document.querySelector('.dialog').style.display = 'none';
}

function toggleDropdown() {
  const dropdown = document.querySelector(".dropdown-btn");
  dropdown.classList.toggle("active");
  const container = dropdown.nextElementSibling;
  container.style.display = container.style.display === "block" ? "none" : "block";
}

function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  sidebar.classList.toggle("active");
}
// Function to get section content based on the sectionId
function getSectionContent(sectionId) {
  switch (sectionId) {
    case 'menu-management':
      return `
        <h3>Menu Management</h3>
        <button onclick="showAddCategoryDialog()">Add Category</button>
        <button onclick="showRemoveCategoryDialog()">Remove Category</button>
        <button onclick="showAddItemDialog()">Add Item</button>
        <button onclick="showRemoveItemDialog()">Remove Item</button>
        <div id="menu-management-content"></div>
      `;
    case 'add-item':
      return `
        <h3>Add Item</h3>
        <input type="text" id="new-item-name" placeholder="Item Name" required>
        <input type="number" id="new-item-price" placeholder="Price" required>
        <select id="new-item-category"></select>
        <input type="file" id="new-item-image" required>
        <button onclick="addItem()">Add Item</button>
      `;
    case 'remove-item':
      return `
        <h3>Remove Item</h3>
        <select id="item-select"></select>
        <button onclick="removeItem()">Remove Item</button>
      `;
    case 'sales-reports':
      return displaySalesReports();
    case 'settings':
      return displaySettings();
    case 'admin-panel':
      return displayAdminPanel();
    default:
      return `<p>Home content...</p>`;
  }
}

// Dialog Management
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

// Additional functions for advanced features
function displaySalesReports() {
  return `
    <h3>Sales Reports</h3>
    <button onclick="generateSalesReport()">Generate Report</button>
    <div id="sales-report-content"></div>
  `;
}

function displaySettings() {
  return `
    <h3>Settings</h3>
    <form id="settings-form">
      <label for="store-name">Store Name:</label>
      <input type="text" id="store-name" required>
      <label for="currency">Currency:</label>
      <input type="text" id="currency" required>
      <label for="tax-rate">Tax Rate (%):</label>
      <input type="number" id="tax-rate" step="0.01" required>
      <label for="contact-email">Contact Email:</label>
      <input type="email" id="contact-email" required>
      <button type="button" onclick="updateSettings()">Update Settings</button>
    </form>
    <div id="settings-feedback"></div>
  `;
}

function displayAdminPanel() {
  return `
    <h3>Admin Panel</h3>
    <button onclick="manageUsers()">Manage Users</button>
    <div id="user-management-content"></div>
  `;
}

// Advanced Settings Update
function updateSettings() {
  const storeName = document.getElementById('store-name').value.trim();
  const currency = document.getElementById('currency').value.trim();
  const taxRate = parseFloat(document.getElementById('tax-rate').value.trim());
  const contactEmail = document.getElementById('contact-email').value.trim();

  // Validate input fields
  if (!storeName || !currency || isNaN(taxRate) || !contactEmail) {
    showFeedback('Please fill in all fields correctly.', 'error');
    return;
  }

  // Save settings to local storage
  const settings = { storeName, currency, taxRate, contactEmail };
  localStorage.setItem('settings', JSON.stringify(settings));

  // Show feedback to the user
  showFeedback('Settings updated successfully!', 'success');
  displayUpdatedSettings(settings);
}

// Function to display feedback
function showFeedback(message, type) {
  const feedbackElem = document.getElementById('settings-feedback');
  feedbackElem.textContent = message;
  feedbackElem.className = type; // Use CSS classes for styling based on type (success/error)
  setTimeout(() => feedbackElem.textContent = '', 3000); // Clear message after 3 seconds
}

// Function to display updated settings
function displayUpdatedSettings(settings) {
  // Display the updated settings in a user-friendly way
  const content = `
    <h4>Updated Settings</h4>
    <p><strong>Store Name:</strong> ${settings.storeName}</p>
    <p><strong>Currency:</strong> ${settings.currency}</p>
    <p><strong>Tax Rate:</strong> ${settings.taxRate}%</p>
    <p><strong>Contact Email:</strong> ${settings.contactEmail}</p>
  `;
  document.getElementById('settings-feedback').innerHTML = content;
}

// Function to load settings on page load
function loadSettings() {
  const settings = JSON.parse(localStorage.getItem('settings')) || {};
  if (settings.storeName) {
    document.getElementById('store-name').value = settings.storeName;
    document.getElementById('currency').value = settings.currency;
    document.getElementById('tax-rate').value = settings.taxRate;
    document.getElementById('contact-email').value = settings.contactEmail;
  }
}

// Call loadSettings when the page loads
document.addEventListener('DOMContentLoaded', loadSettings);



// Implement the functions to handle these actions
function generateSalesReport() {
  const salesReportContent = document.getElementById('sales-report-content');
  salesReportContent.innerHTML = '<p>Generating sales report...</p>';

  // Simulating report generation with a timeout
  setTimeout(() => {
    const totalSales = salesData.totalSales;
    const totalDiscounts = salesData.totalDiscounts;
    const totalOrders = salesData.totalOrders;

    // Calculate sales by category
    const categorySales = calculateCategorySales();

    // Generate report content
    const report = `
      <h3>Sales Report</h3>
      <p><strong>Total Sales:</strong> Rs ${totalSales.toFixed(2)}</p>
      <p><strong>Total Discounts:</strong> Rs ${totalDiscounts.toFixed(2)}</p>
      <p><strong>Total Orders:</strong> ${totalOrders}</p>
      <h4>Sales by Category</h4>
      <ul>
        ${Object.entries(categorySales).map(([category, amount]) => `<li>${category}: Rs ${amount.toFixed(2)}</li>`).join('')}
      </ul>
      <button onclick="printSalesReport()">Print Report</button>
    `;

    salesReportContent.innerHTML = report;
  }, 2000);
}

// Function to calculate sales by category
function calculateCategorySales() {
  const items = getItemsFromStorage();
  const categorySales = {};

  for (const table of Object.values(tables)) {
    for (const [itemName, itemDetails] of Object.entries(table.order)) {
      const item = items.find(i => i.name === itemName);
      if (item) {
        const category = item.category;
        if (!categorySales[category]) {
          categorySales[category] = 0;
        }
        categorySales[category] += itemDetails.price * itemDetails.quantity;
      }
    }
  }

  return categorySales;
}

// Function to print the sales report
function printSalesReport() {
  const salesReportContent = document.getElementById('sales-report-content').innerHTML;
  const printWindow = window.open('', '', 'height=600,width=800');
  printWindow.document.write('<html><head><title>Sales Report</title></head><body>');
  printWindow.document.write(salesReportContent);
  printWindow.document.write('</body></html>');
  printWindow.document.close();
  printWindow.print();
}


function updateSettings() {
  const storeName = document.getElementById('store-name').value;
  const currency = document.getElementById('currency').value;
  alert(`Settings updated: Store Name - ${storeName}, Currency - ${currency}`);
  // Add logic to update settings
}

function manageUsers() {
  const userManagementContent = document.getElementById('user-management-content');
  userManagementContent.innerHTML = '<p>Managing users...</p>';
  // Add logic to manage users
  setTimeout(() => {
    userManagementContent.innerHTML = '<p>User management actions completed.</p>';
  }, 2000);
}

// Category and Item Management
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
      const items = getItemsFromStorage();
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
    };
    reader.readAsDataURL(itemImage);
  }
}

function removeItem() {
  const itemSelect = document.getElementById('item-select');
  const selectedItemName = itemSelect.value;
  let items = getItemsFromStorage();
  items = items.filter(item => item.name !== selectedItemName);
  saveItems(items);
  
  const menuItems = document.querySelectorAll('.menu-item');
  menuItems.forEach(item => {
    if (item.dataset.name === selectedItemName) {
      item.remove();
    }
  });
  
  alert('Item removed successfully');
}

// Local storage functions for items
function getItemsFromStorage() {
  return JSON.parse(localStorage.getItem('items')) || [];
}

function saveItems(items) {
  localStorage.setItem('items', JSON.stringify(items));
}

// Function to populate item options
function populateItemOptions() {
  const itemSelect = document.getElementById('item-select');
  itemSelect.innerHTML = '';
  const items = getItemsFromStorage();
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
function getCategoriesFromStorage() {
  return JSON.parse(localStorage.getItem('categories')) || [];
}

function saveCategories(categories) {
  localStorage.setItem('categories', JSON.stringify(categories));
}

// Initial setup
document.addEventListener('DOMContentLoaded', () => {
  // Load categories and items from localStorage
  const categories = getCategoriesFromStorage();
  categories.forEach(category => {
    const categoryButton = document.createElement('button');
    categoryButton.textContent = category;
    categoryButton.onclick = () => filterCategory(category);
    document.querySelector('.categories').appendChild(categoryButton);
  });
  
  const items = getItemsFromStorage();
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
  });

  addMenuItemListeners();
});
