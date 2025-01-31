// Firebase Configuration
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

// Initialize tables from localStorage or create default structure
let tables = JSON.parse(localStorage.getItem('tables')) || {};
for (let i = 1; i <= 20; i++) {
  if (!tables[`Table ${i}`]) {
    tables[`Table ${i}`] = { order: {}, totalPrice: 0, status: "available", payments: [], discount: 0, discountedTotal: 0 };
  }
}

// Track whether void button was pressed
let isVoidMode = false;

// Initialize sales data from localStorage or create default structure
let salesData = JSON.parse(localStorage.getItem('salesData')) || {
  totalSales: 0,
  totalDiscounts: 0,
  totalOrders: 0,
  cashPayments: 0,
  mobilePayments: 0
};

// Define the editItem function
function editItem() {
  console.log('Edit item function called!');
}

// Function to update date and time
function updateDateTime() {
  const dateTimeElem = document.getElementById('datetime');
  const now = new Date();
  const formattedDate = now.toLocaleDateString();
  const formattedTime = now.toLocaleTimeString();
  dateTimeElem.textContent = `${formattedDate} ${formattedTime}`;
}

// Update date and time every second
setInterval(updateDateTime, 1000);

// Render tables in the dashboard
function renderTables() {
  const dashboard = document.getElementById('tables-dashboard');
  if (!dashboard) {
    console.error('Dashboard element not found');
    return;
  }
  dashboard.innerHTML = '';
  for (const [table, info] of Object.entries(tables)) {
    const tableCard = document.createElement('div');
    tableCard.className = `table-card ${info.status}`;
    tableCard.textContent = table;
    tableCard.onclick = () => selectTable(table);
    dashboard.appendChild(tableCard);
  }
}

// Select a table and update UI
function selectTable(table) {
  selectedTable = table;
  const selectedTableDisplayElem = document.getElementById('selected-table-display');
  const orderSection = document.getElementById('order-section');
  if (selectedTableDisplayElem) {
    selectedTableDisplayElem.textContent = table;
  }
  if (orderSection) {
    orderSection.style.display = 'block';
  }
  updateOrderSummary();
}

// Filter menu items by category
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

// Add item to the order with negative price if in void mode
function addToOrder(name, price) {
  console.log(`Adding to order: ${name}, Price: ${price}, Selected Table: ${selectedTable}`);
  if (selectedTable === "None") {
    alert("Please select a table first!");
    return;
  }
  if (!tables[selectedTable].order) {
    tables[selectedTable].order = {};
  }
  if (isVoidMode) {
    price = -price;
    isVoidMode = false; // Reset void mode after adding the item
  }
  if (!tables[selectedTable].order.hasOwnProperty(name)) {
    tables[selectedTable].order[name] = { price: price, quantity: 1 };
  } else {
    tables[selectedTable].order[name].quantity += 1;
  }
  tables[selectedTable].totalPrice += price;
  tables[selectedTable].discountedTotal = tables[selectedTable].totalPrice * ((100 - tables[selectedTable].discount) / 100);
  tables[selectedTable].status = "occupied";
  renderTables();
  updateOrderSummary();
  saveData();
}

// Ensure addToOrder is only called once
document.querySelectorAll('.menu-item').forEach(item => {
  item.addEventListener('click', (event) => {
    event.stopImmediatePropagation();
    const name = item.getAttribute('data-name');
    const price = parseFloat(item.getAttribute('data-price'));
    addToOrder(name, price);
  });
});

// Remove item from the order
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
    tables[selectedTable].discountedTotal = tables[selectedTable].totalPrice * ((100 - tables[selectedTable].discount) / 100);
    renderTables();
    updateOrderSummary();
    saveData();
  }
}

// Display order items in the order summary
function displayOrderItems(orderItems) {
  const orderItemsList = document.getElementById('order-items');
  orderItemsList.innerHTML = '';
  let totalPrice = 0;
  for (const [name, item] of Object.entries(orderItems)) {
    const orderItem = document.createElement('li');
    orderItem.textContent = `${name} - Rs ${item.price} x ${item.quantity} = Rs ${item.price * item.quantity}`;
    orderItemsList.appendChild(orderItem);
    const removeButton = document.createElement('button');
    removeButton.textContent = 'Remove';
    removeButton.className = 'remove-item';
    removeButton.setAttribute('data-name', name);
    removeButton.onclick = () => removeFromOrder(name);
    orderItem.appendChild(removeButton);
    totalPrice += item.price * item.quantity;
  }
  document.getElementById('total-price').textContent = totalPrice;
  tables[selectedTable].totalPrice = totalPrice;
  tables[selectedTable].discountedTotal = tables[selectedTable].totalPrice * ((100 - tables[selectedTable].discount) / 100);
  saveData();
}

// Update order summary
function updateOrderSummary() {
  const order = tables[selectedTable];
  displayOrderItems(order.order, selectedTable);
  const selectedTableElem = document.getElementById('selected-table');
  if (selectedTableElem) {
    selectedTableElem.textContent = selectedTable;
  }
  const orderSummary = document.getElementById('orderSummary');
  if (orderSummary) {
    orderSummary.innerHTML = `
      Total Price: ${order.totalPrice.toFixed(2)}<br>
      Discount: ${order.discount}%<br>
      Discounted Total: ${order.discountedTotal.toFixed(2)}
    `;
  }
}

// Disable the remove button for finalized items
function disableRemoveButtonForFinalizedItems() {
  for (const [name, item] of Object.entries(tables[selectedTable].order)) {
    const removeButton = document.querySelector(`.remove-item[data-name="${name}"]`);
    if (removeButton) {
      removeButton.disabled = true;
    }
  }
}

// Mark void mode
function voidSelectedItem() {
  isVoidMode = true;
  alert("Void mode activated. Select the item to void.");
}

// Add payment
function addPayment(paymentMethod) {
  const amount = parseFloat(prompt(`Enter amount for ${paymentMethod}:`));
  if (isNaN(amount) || amount <= 0) {
    alert('Invalid amount. Please enter a valid number.');
    return;
  }
  if (!tables[selectedTable]) {
    tables[selectedTable] = {
      payments: [],
      totalSales: 0,
      totalDiscounts: 0,
      totalOrders: 0,
      cashPayments: 0,
      mobilePayments: 0,
      status: 'occupied'
    };
  }
  tables[selectedTable].payments.push({ method: paymentMethod, amount });
  updatePaymentSummary();
  saveData();
}

// Function to update payment summary
function updatePaymentSummary() {
  const paymentSummaryElem = document.getElementById('payment-summary');
  const changeAmountElem = document.getElementById('change-amount');
  const insufficientAmountElem = document.getElementById('insufficient-amount');
  const shortAmountElem = document.getElementById('short-amount');
  let totalPaid = 0;
  if (tables[selectedTable]?.payments) {
    paymentSummaryElem.innerHTML = '';
    tables[selectedTable].payments.forEach(payment => {
      const listItem = document.createElement('li');
      listItem.textContent = `${payment.method}: Rs ${payment.amount}`;
      paymentSummaryElem.appendChild(listItem);
      totalPaid += payment.amount;
    });
  }
  const totalPrice = tables[selectedTable]?.discountedTotal || 0;
  const changeAmount = totalPaid - totalPrice;
  if (changeAmount >= 0) {
    changeAmountElem.textContent = changeAmount;
    insufficientAmountElem.style.display = 'none';
  } else {
    shortAmountElem.textContent = Math.abs(changeAmount);
    insufficientAmountElem.style.display = 'block';
    changeAmountElem.textContent = 0;
  }
}

// Show and close payment dialog
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

// Finalize the order and send to Kitchen and Bar
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
    } else {
      console.error(`Menu item element not found for ${name}`);
    }
  }

  if (kitchenOrders.length > 0) {
    console.log(`Sending to Kitchen: Table ${selectedTable}, Orders: ${kitchenOrders.join(', ')}`);
  }
  if (barOrders.length > 0) {
    console.log(`Sending to Bar: Table ${selectedTable}, Orders: ${barOrders.join(', ')}`);
  }

  alert('Order finalized and sent to Kitchen and Bar!');

  // Disable the remove button for finalized items
  disableRemoveButtonForFinalizedItems();
}

// Change table
function changeTable() {
  const newTable = prompt("Enter new table number:");
  if (newTable && tables[`Table ${newTable}`]) {
    tables[`Table ${newTable}`].order = { ...tables[selectedTable].order };
    tables[`Table ${newTable}`].totalPrice = tables[selectedTable].totalPrice;
    tables[`Table ${newTable}`].status = "occupied";
    tables[selectedTable].order = {};
    tables[selectedTable].totalPrice = 0;
    tables[selectedTable].status = "available";
    selectedTable = `Table ${newTable}`;
    renderTables();
    updateOrderSummary();
    saveData();
  } else {
    alert("Invalid table number or table does not exist.");
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

  let cashSalesAmount = 0;
  let mobileSalesAmount = 0;
  let change = 0;

  tables[selectedTable]?.payments.forEach(payment => {
    const standardizedMethod = payment.method.toLowerCase().trim();

    const standardizedMethodsMapping = {
      'mobile payment': 'mobile_payment',
      'cash': 'cash'
    };

    const finalMethod = standardizedMethodsMapping[standardizedMethod] || standardizedMethod;

    switch (finalMethod) {
      case 'cash':
        cashSalesAmount += Math.min(totalPrice - mobileSalesAmount, payment.amount); // Reflect actual sales amount from cash
        change = payment.amount - cashSalesAmount; // Calculate change
        break;
      case 'mobile_payment':
        mobileSalesAmount += Math.min(totalPrice - cashSalesAmount, payment.amount); // Reflect actual sales amount from mobile payment
        break;
      default:
        console.error(`Invalid payment method: ${finalMethod}`);
        return;
    }
  });

  // Update sales data with the correct total amount for each payment method
  salesData.cashSales = (salesData.cashSales || 0) + cashSalesAmount;
  salesData.mobileSales = (salesData.mobileSales || 0) + mobileSalesAmount;
  salesData.totalSales = (salesData.totalSales || 0) + totalPrice;
  salesData.totalDiscounts = (salesData.totalDiscounts || 0) + discount;
  salesData.totalOrders = (salesData.totalOrders || 0) + 1;

  console.log('Updated Sales Data:', salesData);
  saveData();
  printReceipt();

  if (change > 0) {
    alert(`Customer change: Rs ${change}`);
  }

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

  alert("Order completed successfully!");

  generateSalesReport(); // Ensure the sales report gets updated and displayed
}

// Function to update sales data with the correct total amount for each payment method
function updateSalesData(totalPrice, discount, cashAmount, mobileAmount) {
  // Initialize salesData if it doesn't exist
  let salesData = JSON.parse(localStorage.getItem('salesData')) || {
    totalSales: 0,
    totalDiscounts: 0,
    totalOrders: 0,
    cashPayments: 0,
    mobilePayments: 0
  };

  console.log("Before update:", salesData);

  // Update sales data
  salesData.totalSales += totalPrice;
  salesData.totalDiscounts += discount;
  salesData.totalOrders += 1;
  salesData.cashPayments += cashAmount;
  salesData.mobilePayments += mobileAmount;

  console.log("After update:", salesData);

  // Store updated sales data
  localStorage.setItem('salesData', JSON.stringify(salesData));
}



// Function to print receipt
function printReceipt() {
  const printWindow = window.open('', 'PRINT', 'height=600,width=800');
  printWindow.document.write('<html><head><title>Receipt</title></head><body>');
  printWindow.document.write('<h1>Taboche POS Receipt</h1>');
  printWindow.document.write(`<p>Table: ${selectedTable}</p>`);
  printWindow.document.write('<ul>');
  Object.entries(tables[selectedTable].order).forEach(([name, item]) => {
    printWindow.document.write(`<li>${name} - Rs ${item.price} x ${item.quantity} = Rs ${item.price * item.quantity}</li>`);
  });
  printWindow.document.write('</ul>');
  printWindow.document.write(`<p>Total Price: Rs ${tables[selectedTable].totalPrice.toFixed(2)}</p>`);
  printWindow.document.write(`<p>Discount: ${tables[selectedTable].discount}%</p>`);
  printWindow.document.write(`<p>Discounted Total: Rs ${tables[selectedTable].discountedTotal.toFixed(2)}</p>`);
  printWindow.document.write('<h2>Payments</h2>');
  printWindow.document.write('<ul>');
  tables[selectedTable].payments.forEach(payment => {
    printWindow.document.write(`<li>${payment.method}: Rs ${payment.amount}</li>`);
  });
  printWindow.document.write('</ul>');
  printWindow.document.write('</body></html>');
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
  printWindow.close();
}

// Function to display sales report
function displaySalesReport() {
  console.log("Displaying sales report...");
  const salesReportElem = document.getElementById('salesReportOutput');
  if (!salesReportElem) {
    console.error('Sales report element not found.');
    return;
  }

  const totalDiscounts = salesData.totalDiscounts || 0;
  const totalOrders = salesData.totalOrders || 0;
  const cashSales = salesData.cashPayments || 0;
  const mobileSales = salesData.mobilePayments || 0;
  const totalSales = salesData.totalSales || 0;

  const report = `
    <h3>Sales Report</h3>
    <p>Total Discounts: Rs ${totalDiscounts}</p>
    <p>Total Cash Sales: Rs ${cashSales}</p>
    <p>Total Mobile Payment Sales: Rs ${mobileSales}</p>
    <p>Total Orders: ${totalOrders}</p>
    <p>Total Sales (Cash + Mobile Payment): Rs ${totalSales}</p>
    <button onclick="printElement('salesReportOutput')">Print Report</button>
  `;
  salesReportElem.innerHTML = report;
  console.log("Sales report displayed.");
}

function generateSalesReport() {
  console.log('Generating sales report...');
  console.log('Sales Data:', salesData);

  const totalDiscounts = salesData.totalDiscounts || 0;
  const totalOrders = salesData.totalOrders || 0;
  const cashSales = salesData.cashSales || 0;
  const mobileSales = salesData.mobileSales || 0;
  const totalSales = salesData.totalSales || 0;

  const report = `
    <h3>Sales Report</h3>
    <p>Total Discounts: Rs ${totalDiscounts}</p>
    <p>Total Cash Sales: Rs ${cashSales}</p>
    <p>Total Mobile Payment Sales: Rs ${mobileSales}</p>
    <p>Total Orders: ${totalOrders}</p>
    <p>Total Sales (Cash + Mobile Payment): Rs ${totalSales}</p>
    <button onclick="printElement('salesReportOutput')">Print Report</button>
  `;
  document.getElementById('salesReportOutput').innerHTML = report;
}




// Function to print a specific element
function printElement(elementId) {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error('Element not found to print');
    return;
  }

  const printWindow = window.open('', 'PRINT', 'height=600,width=800');
  printWindow.document.write('<html><head><title>Print Report</title>');
  printWindow.document.write('</head><body>');
  printWindow.document.write(element.innerHTML);
  printWindow.document.write('</body></html>');
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
  printWindow.close();
}

// Function to print and reset sales report and total orders
function printAndResetSalesReport() {
  printElement('salesReportOutput');
  resetSalesReport();
}

// Function to reset sales report and total orders
function resetSalesReport() {
  console.log('Resetting sales report and total orders...');
  salesData = {
    totalSales: 0,
    totalDiscounts: 0,
    totalOrders: 0,
    cashPayments: 0,
    mobilePayments: 0
  };

  localStorage.setItem('salesData', JSON.stringify(salesData));
  displaySalesReport();
  alert('Sales report and total orders have been reset.');
}

// Function to show home content
function showHomeContent() {
  const content = document.getElementById('content');
  if (!content) {
    console.error('Content element not found');
    return;
  }
  content.innerHTML = '<h1>Welcome to Taboche POS</h1><p>Your one-stop solution for managing sales and inventory.</p>';
  toggleSidebar();
}

// Function to show menu management content
function showMenuManagementContent() {
  const content = document.getElementById('content');
  if (!content) {
    console.error('Content element not found');
    return;
  }
  content.innerHTML = `
    <h1>Menu Management</h1>
    <div>
      <h2>Edit Category</h2>
      <form id="editCategoryForm">
        <label for="categoryName">Category Name:</label>
        <input type="text" id="categoryName" name="categoryName"><br>
        <button type="button" onclick="editCategory()">Edit Category</button>
      </form>
    </div>
    <div>
      <h2>Edit Item</h2>
      <form id="editItemForm">
        <label for="editItemId">Item ID:</label>
        <input type="text" id="editItemId" name="editItemId"><br>
        <label for="newItemName">New Item Name:</label>
        <input type="text" id="newItemName" name="newItemName"><br>
        <label for="newItemPrice">New Item Price:</label>
        <input type="text" id="newItemPrice" name="newItemPrice"><br>
        <label for="newItemPicture">New Item Picture:</label>
        <input type="file" id="newItemPicture" name="newItemPicture"><br>
        <button type="button" onclick="editItem()">Edit Item</button>
      </form>
    </div>
  `;
  toggleSidebar();
}

// Function to show sales reports content
function showSalesReportsContent() {
  const content = document.getElementById('content');
  if (!content) {
    console.error('Content element not found');
    return;
  }
  content.innerHTML = `
    <h1>Sales Reports</h1>
    <button type="button" onclick="generateSalesReport()">Generate Sales Report</button>
    <div id="salesReportOutput"></div>
  `;
  toggleSidebar();
}

// Function to show settings content
function showSettingsContent() {
  const content = document.getElementById('content');
  if (!content) {
    console.error('Content element not found');
    return;
  }
  content.innerHTML = `
    <h1>Settings</h1>
    <form id="settingsForm">
      <label for="currency">Currency:</label>
      <input type="text" id="currency" name="currency"><br>
      <label for="taxRate">Tax Rate:</label>
      <input type="text" id="taxRate" name="taxRate"><br>
      <label for="layoutColor">Layout Color:</label>
      <input type="color" id="layoutColor" name="layoutColor"><br>
      <button type="button" onclick="saveSettings()">Save Settings</button>
    </form>
  `;
  toggleSidebar();
}

// Function to show admin panel content
function showAdminPanelContent() {
  const content = document.getElementById('content');
  if (!content) {
    console.error('Content element not found');
    return;
  }
  content.innerHTML = `
    <h1>Admin Panel</h1>
    <p>Admin panel functionalities will be here.</p>
    <button type="button" onclick="manageUsers()">Manage Users</button>
  `;
  toggleSidebar();
}

// Function to toggle the sidebar
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) {
    console.error('Sidebar element not found');
    return;
  }
  sidebar.classList.toggle('active');
}

// Customize layout settings
function saveSettings() {
  const currency = document.getElementById('currency').value.trim();
  const taxRate = parseFloat(document.getElementById('taxRate').value);
  const layoutColor = document.getElementById('layoutColor').value;

  if (!currency || isNaN(taxRate) || taxRate < 0 || !layoutColor) {
    alert('Please enter valid settings');
    return;
  }

  alert(`Settings Saved: Currency ${currency}, Tax Rate: ${taxRate}, Layout Color: ${layoutColor}`);
  document.documentElement.style.setProperty('--layout-color', layoutColor);
}

// Manage users (example placeholder)
function manageUsers() {
  alert('User management functionality will be here.');
}

document.addEventListener('DOMContentLoaded', () => {
  renderTables();

  const homeBtn = document.getElementById('homeBtn');
  if (homeBtn) homeBtn.addEventListener('click', showHomeContent);

  const menuManagementBtn = document.getElementById('menuManagementBtn');
  if (menuManagementBtn) menuManagementBtn.addEventListener('click', showMenuManagementContent);

  const salesReportsBtn = document.getElementById('salesReportsBtn');
  if (salesReportsBtn) salesReportsBtn.addEventListener('click', showSalesReportsContent);

  const settingsBtn = document.getElementById('settingsBtn');
  if (settingsBtn) settingsBtn.addEventListener('click', showSettingsContent);

  const adminPanelBtn = document.getElementById('adminPanelBtn');
  if (adminPanelBtn) adminPanelBtn.addEventListener('click', showAdminPanelContent);

  const toggleSidebarBtn = document.getElementById('toggleSidebarBtn');
  if (toggleSidebarBtn) toggleSidebarBtn.addEventListener('click', toggleSidebar);

  scheduleMidnightReset(); // Schedule the daily reset
});

// Function to schedule a reset at midnight
function scheduleMidnightReset() {
  const now = new Date();
  const msUntilMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() - now.getTime();
  setTimeout(() => {
    resetSalesReport();
    scheduleMidnightReset(); // Schedule the next reset
  }, msUntilMidnight);
}

// Function to save data to localStorage
function saveData() {
  localStorage.setItem('tables', JSON.stringify(tables));
  localStorage.setItem('salesData', JSON.stringify(salesData));
}
