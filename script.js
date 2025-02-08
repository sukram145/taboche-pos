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
const tableNumbers = ['1', '2', '3', '4', '5', '6', '7', '8A', '8B', '9A', '9B', '10A', '10B', '10C', '11', '12'];

tableNumbers.forEach(table => {
  if (!tables[`Table ${table}`]) {
    tables[`Table ${table}`] = { order: {}, totalPrice: 0, status: "available", payments: [], discount: 0, discountedTotal: 0, time: null };
  }
});

// Track whether void button was pressed
let isVoidMode = false;
let selectedTable = null;

// Initialize sales data from localStorage or create default structure
let salesData = JSON.parse(localStorage.getItem('salesData')) || {
  totalSales: 0,
  totalDiscounts: 0,
  totalOrders: 0,
  cashPayments: 0,
  mobilePayments: 0
};

function openAddItemModal() {
  document.getElementById("addItemModal").style.display = "flex";
}

function closeAddItemModal() {
  document.getElementById("addItemModal").style.display = "none";
}

function updateExtrasOptions() {
  let itemSelect = document.getElementById("itemSelect").value;
  let extraOptionsDiv = document.getElementById("extraOptions");
  extraOptionsDiv.innerHTML = ""; // Clear previous options
  
  if (itemSelect === "food") {
      extraOptionsDiv.innerHTML = `
          <label><img src="cheese.jpg" alt="Cheese"> <input type="checkbox" value="75" class="extra"> Cheese (Rs 75)</label><br>
          <label><img src="sausage.jpg" alt="Sausage"> <input type="checkbox" value="40" class="extra"> Sausage (Rs 40)</label><br>
          <label><img src="egg.jpg" alt="Egg"> <input type="checkbox" value="50" class="extra"> Egg (Rs 50)</label><br>
          <label><img src="salad.jpg" alt="Salad"> <input type="checkbox" value="75" class="extra"> Salad (Rs 75)</label><br>
          <label><img src="toast.jpg" alt="Toast"> <input type="checkbox" value="50" class="extra"> Toast (Rs 50)</label>
      `;
  } else if (itemSelect === "drink") {
      extraOptionsDiv.innerHTML = `
          <label><img src="boba.jpg" alt="Boba"> <input type="checkbox" value="50" class="extra"> Boba (Rs 50)</label><br>
          <label><img src="flavour.jpg" alt="Flavour"> <input type="checkbox" value="50" class="extra"> Flavour (Rs 50)</label><br>
          <label><img src="coil.jpg" alt="Extra Coil"> <input type="checkbox" value="50" class="extra"> Extra Coil (Rs 50)</label><br>
          <label><img src="extraflavour.jpg" alt="Extra Flavour"> <input type="checkbox" value="250" class="extra"> Extra Flavour (Rs 250)</label>
      `;
  }
}

function applyExtras() {
  let selectedExtras = [];
  let extraCost = 0;
  document.querySelectorAll('#extraOptions input[type="checkbox"]:checked').forEach(checkbox => {
      selectedExtras.push(`+ extra ${checkbox.parentElement.textContent.trim().split(' ')[0]} Rs ${checkbox.value}`);
      extraCost += parseFloat(checkbox.value);
  });
  
  let itemName = document.getElementById("itemSelect").value;
  if (!itemName) {
      alert("Please select an item");
      return;
  }
  
  let orderItemsList = document.getElementById('order-items');
  let orderItem = document.createElement('li');
  orderItem.textContent = `${itemName} (${selectedExtras.join(", ")}) - Rs ${extraCost}`;
  orderItemsList.appendChild(orderItem);
  
  let totalPriceElem = document.getElementById('total-price');
  let totalPrice = parseFloat(totalPriceElem.textContent) || 0;
  totalPrice += extraCost;
  totalPriceElem.textContent = totalPrice.toFixed(2);
  
  closeAddItemModal();
}


// Function to update date, time, and day of the week
function updateDateTime() {
  const datetimeElem = document.getElementById('datetime');
  const now = new Date();
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const day = daysOfWeek[now.getDay()];
  const date = now.toLocaleDateString();
  const time = now.toLocaleTimeString();
  if (datetimeElem) {
    datetimeElem.textContent = `${day}, ${date} ${time}`;
  }
}
updateDateTime();
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
    if (table && info && table.startsWith('Table ')) {  // Ensure that table and info are not null or undefined
      const tableCard = document.createElement('div');
      tableCard.className = `table-card ${info.status}`;
      tableCard.textContent = table;
      tableCard.onclick = () => selectTable(table);
      dashboard.appendChild(tableCard);
    }
  }
}

// Select a table and update UI
function selectTable(table) {
  selectedTable = table;
  const selectedTableDisplayElem = document.getElementById('selected-table-display');
  const orderSection = document.getElementById('order-section');
  
  if (!tables[selectedTable].time) {
    tables[selectedTable].time = new Date().toLocaleTimeString(); // Store the initial time for the table
  }

  if (selectedTableDisplayElem) {
    selectedTableDisplayElem.textContent = table;
  }
  if (orderSection) {
    orderSection.style.display = 'block';
  }

  updateOrderSummary();
}

// Function to search menu items
function searchMenu() {
  const query = document.getElementById('search').value.toLowerCase();
  const menuItems = document.getElementsByClassName('menu-item');
  for (let i = 0; i < menuItems.length; i++) {
    const itemName = menuItems[i].getAttribute('data-name').toLowerCase();
    if (itemName.includes(query)) {
      menuItems[i].style.display = '';
    } else {
      menuItems[i].style.display = 'none';
    }
  }
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
// Mark void mode
function voidSelectedItem() {
  isVoidMode = true;
  alert("Void mode activated. Select the item to void.");
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
    removeFromOrder(name); // Directly call removeFromOrder function when void mode is active
    isVoidMode = false; // Disable void mode after removing the item
  } else {
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
}
// Mark void mode
function voidSelectedItem() {
  isVoidMode = true;
  alert("Void mode activated. Select the item to void.");
}

// Remove item from the order and record void details
function removeFromOrder(name) {
  if (tables[selectedTable].order[name]) {
    const item = tables[selectedTable].order[name];
    const voidEntry = {
      name: name,
      amount: item.price,
      time: new Date().toLocaleTimeString()
    };
    voidHistory.push(voidEntry);
    localStorage.setItem('voidHistory', JSON.stringify(voidHistory)); // Save void history to localStorage

    tables[selectedTable].totalPrice -= item.price;
    item.quantity -= 1;
    if (item.quantity <= 0) {
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

  // Disable remove buttons for finalized items
  disableRemoveButtonForFinalizedItems();
}

// Update order summary
function updateOrderSummary() {
  const order = tables[selectedTable];
  displayOrderItems(order.order);
  const selectedTableElem = document.getElementById('selected-table');
  const selectedTimeElem = document.getElementById('selected-time');
  if (selectedTableElem) {
    selectedTableElem.textContent = selectedTable;
  }
  if (selectedTimeElem) {
    selectedTimeElem.textContent = `Time: ${tables[selectedTable].time}`;
  }
  const orderSummary = document.getElementById('orderSummary');
  if (orderSummary) {
    orderSummary.innerHTML = `
      Total Price: Rs ${order.totalPrice.toFixed(2)}<br>
      Discount: ${order.discount}%<br>
      Discounted Total: Rs ${order.discountedTotal.toFixed(2)}
    `;
  }
}

// Reset order summary
function resetOrderSummary() {
  selectedTable = null;
  document.getElementById('selected-table-display').textContent = 'None';
  document.getElementById('selected-time').textContent = 'Time: --:--';
  document.getElementById('order-items').innerHTML = '';
  document.getElementById('total-price').textContent = '0';
}

// Disable the remove button for finalized items
function disableRemoveButtonForFinalizedItems() {
  for (const [name, item] of Object.entries(tables[selectedTable].order)) {
    if (item.finalized) {
      const removeButton = document.querySelector(`.remove-item[data-name="${name}"]`);
      if (removeButton) {
        removeButton.disabled = true;
      }
    }
  }
}

// Menu item click event to add items to the order
document.querySelectorAll('.menu-item').forEach(item => {
  item.addEventListener('click', (event) => {
    event.stopImmediatePropagation();
    const name = item.getAttribute('data-name');
    const price = parseFloat(item.getAttribute('data-price'));
    addToOrder(name, price);
  });
});

// Finalize the order and send to Kitchen and Bar
function finalizeOrder() {
  if (selectedTable === "None") {
    alert("Please select a table first!");
    return;
  }

  const kitchenOrders = [];
  const barOrders = [];

  for (const [name, item] of Object.entries(tables[selectedTable].order)) {
    item.finalized = true;  // Mark the item as finalized
    const sectionElem = document.querySelector(`.menu-item[data-name="${name}"]`);
    if (sectionElem) {
      const section = sectionElem.getAttribute('data-section');
      if (section === 'Kitchen') {
        kitchenOrders.push(`${name} - Rs ${item.price} x ${item.quantity}`);
      } else if ( section === 'Bar') {
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

let orderHistory = JSON.parse(localStorage.getItem('orderHistory')) || [];

function saveOrderHistory() {
  localStorage.setItem('orderHistory', JSON.stringify(orderHistory));
}

// Function to display the QR code dialog
function displayQRCode() {
  const qrCodeElement = document.getElementById('qr-code-dialog');
  qrCodeElement.style.display = 'block';
  document.getElementById('qr-code-image').src = 'https://raw.githubusercontent.com/sukram145/fonepay_qr.png/main/qr.png'; // Replace with the correct path to your QR code image
}

// Function to close the QR code dialog
function closeQRCodeDialog() {
  const qrCodeDialog = document.getElementById('qr-code-dialog');
  if (qrCodeDialog) {
    qrCodeDialog.style.display = 'none';
  }
}
// Function to display the QR code dialog
function displayQRCode() {
  const qrCodeElement = document.getElementById('qr-code-dialog');
  qrCodeElement.style.display = 'block';
  document.getElementById('qr-code-image').src = 'https://raw.githubusercontent.com/sukram145/fonepay_qr.png/main/qr.png'; // Replace with the correct path to your QR code image
}

// Function to close the QR code dialog
function closeQRCodeDialog() {
  const qrCodeDialog = document.getElementById('qr-code-dialog');
  if (qrCodeDialog) {
    qrCodeDialog.style.display = 'none';
  }
}

// Function to update the total amount to be paid from the order summary
function updateTotalAmount() {
  const totalAmountElem = document.getElementById('total-amount');
  const totalPrice = tables[selectedTable]?.totalPrice || 0;
  totalAmountElem.textContent = totalPrice;
}

function addPayment(paymentMethod) {
  const numericInput = document.getElementById('numeric-input');
  const amount = parseFloat(numericInput.value);
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

  // Show QR code for mobile payment
  if (paymentMethod === 'Mobile Payment') {
    displayQRCode();
  } else {
    closeQRCodeDialog();
  }

  updatePaymentSummary();
  saveData();
  numericInput.value = ''; // Clear the numeric input after adding payment
}

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
    updateTotalAmount(); // Update the total amount when showing the dialog
  }
}

function closePaymentDialog() {
  const paymentDialog = document.getElementById('payment-dialog');
  if (paymentDialog) {
    paymentDialog.style.display = 'none';

    // Reset payment summary
    const paymentSummaryElem = document.getElementById('payment-summary');
    const changeAmountElem = document.getElementById('change-amount');
    const insufficientAmountElem = document.getElementById('insufficient-amount');
    const shortAmountElem = document.getElementById('short-amount');

    if (paymentSummaryElem) paymentSummaryElem.innerHTML = ''; // Clear payment list
    if (changeAmountElem) changeAmountElem.textContent = '0'; // Reset change amount
    if (shortAmountElem) shortAmountElem.textContent = '0'; // Reset short amount
    if (insufficientAmountElem) insufficientAmountElem.style.display = 'none'; // Hide insufficient amount message

    // Reset the payments array for the selected table
    if (tables[selectedTable]) {
      tables[selectedTable].payments = [];
    }
  }
}

function resetPaymentDialog() {
  // Reset payment summary display
  const paymentSummaryElem = document.getElementById('payment-summary');
  const changeAmountElem = document.getElementById('change-amount');
  const insufficientAmountElem = document.getElementById('insufficient-amount');
  const shortAmountElem = document.getElementById('short-amount');

  if (paymentSummaryElem) paymentSummaryElem.innerHTML = ''; // Clear payment list
  if (changeAmountElem) changeAmountElem.textContent = '0'; // Reset change amount
  if (shortAmountElem) shortAmountElem.textContent = '0'; // Reset short amount
  if (insufficientAmountElem) insufficientAmountElem.style.display = 'none'; // Hide insufficient amount message

  // Reset the payments array for the selected table
  if (tables[selectedTable]) {
    tables[selectedTable].payments = [];
  }

  // Clear the input field
  const numericInput = document.getElementById('numeric-input');
  if (numericInput) numericInput.value = '';

  updatePaymentSummary(); // Refresh payment summary
}


function completeOrder() {
  const totalPriceElem = document.getElementById('total-price');

  if (!totalPriceElem || !totalPriceElem.textContent) {
    alert('Total price element is not found or its content is invalid.');
    return;
  }

  const totalPrice = parseFloat(totalPriceElem.textContent);
  const discount = tables[selectedTable]?.discount || 0;
  const discountedTotal = tables[selectedTable]?.discountedTotal || 0;
  const totalPaid = tables[selectedTable]?.payments.reduce((sum, payment) => sum + payment.amount, 0) || 0;

  if (totalPaid < discountedTotal) {
    const shortAmount = discountedTotal - totalPaid;
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
        cashSalesAmount += Math.min(discountedTotal - mobileSalesAmount, payment.amount);
        change = payment.amount - cashSalesAmount;
        break;
      case 'mobile_payment':
        mobileSalesAmount += Math.min(discountedTotal - cashSalesAmount, payment.amount);
        break;
      default:
        console.error(`Invalid payment method: ${finalMethod}`);
        return;
    }
  });

  salesData.cashSales = (salesData.cashSales || 0) + cashSalesAmount;
  salesData.mobileSales = (salesData.mobileSales || 0) + mobileSalesAmount;
  salesData.totalSales = (salesData.totalSales || 0) + discountedTotal;
  salesData.totalDiscounts = (salesData.totalDiscounts || 0) + discount;
  salesData.totalOrders = (salesData.totalOrders || 0) + 1;

  console.log('Updated Sales Data:', salesData);
  saveData();
  printReceipt();

  if (change > 0) {
    alert(`Customer change: Rs ${change}`);
  }

  orderHistory.push({
    table: selectedTable,
    order: tables[selectedTable].order,
    totalPrice: totalPrice,
    discountedTotal: discountedTotal.toFixed(2),
    discount: discount,
    payments: tables[selectedTable].payments,
    timestamp: new Date()
  });

  saveOrderHistory();

  if (tables[selectedTable]) {
    tables[selectedTable].order = {};
    tables[selectedTable].totalPrice = 0;
    tables[selectedTable].status = "available";
    tables[selectedTable].payments = [];
    tables[selectedTable].discount = 0;
    tables[selectedTable].time = null; // Reset the time for the table
  }

  closePaymentDialog();
  closeQRCodeDialog(); // Close the QR code dialog when the order is complete
  renderTables();
  updateOrderSummary();
  updatePaymentSummary();

  alert("Order completed successfully!");

  generateSalesReport();
}

// Numeric pad functions
function addNumber(num) {
  const numericInput = document.getElementById('numeric-input');
  numericInput.value += num;
}

function clearInput() {
  const numericInput = document.getElementById('numeric-input');
  numericInput.value = '';
}

function backspaceInput() {
  const numericInput = document.getElementById('numeric-input');
  numericInput.value = numericInput.value.slice(0, -1);
}

function addQuickAmount(amount) {
  const numericInput = document.getElementById('numeric-input');
  numericInput.value = amount;
}

function applyDiscountHandler() {
  const discountInput = document.getElementById('discount');
  const discount = parseFloat(discountInput.value);
  if (isNaN(discount) || discount < 0 || discount > 100) {
    alert('Invalid discount. Please enter a percentage between 0 and 100.');
    return;
  }
  tables[selectedTable].discount = discount;
  const totalPrice = tables[selectedTable]?.totalPrice || 0;
  tables[selectedTable].discountedTotal = totalPrice * (1 - discount / 100);
  updatePaymentSummary();
}

// Initially update the total amount to be paid
updateTotalAmount();

function printReceipt() {
  const logoUrl = 'http://localhost/images/RestaurantLogo.png'; // Update with your logo URL
  const printWindow = window.open('', 'PRINT', 'height=600,width=800');
  printWindow.document.write('<html><head><title>Receipt</title><style>body { font-family: Arial, sans-serif; } .header { text-align: center; } .details, .summary { margin-top: 20px; } .summary { border-top: 1px solid #000; padding-top: 10px; } </style></head><body>');
  printWindow.document.write('<div class="header">');
  printWindow.document.write('<h1>Taboche Bhaktapur </h1>');
  printWindow.document.write(`<img src="${logoUrl}" alt="Restaurant Logo" style="width:100px;height:auto;">`);
  printWindow.document.write('<p>Siddha Pokhar, Bhaktapur, Nepal</p>');
  printWindow.document.write('<p>Phone: +977 981-0208828</p>');
  printWindow.document.write(`<p>Date: ${new Date().toLocaleDateString()}</p>`);
  printWindow.document.write(`<p>Time: ${new Date().toLocaleTimeString()}</p>`);
  printWindow.document.write(`<p>Table: ${selectedTable}</p>`);
  printWindow.document.write('</div>');
  printWindow.document.write('<div class="details">');
  printWindow.document.write('<ul>');
  Object.entries(tables[selectedTable].order).forEach(([name, item]) => {
    printWindow.document.write(`<li>${name} - Rs ${item.price} x ${item.quantity} = Rs ${item.price * item.quantity}</li>`);
  });
  printWindow.document.write('</ul>');
  printWindow.document.write('</div>');
  printWindow.document.write('<div class="summary">');
  printWindow.document.write(`<p>Total Price: Rs ${tables[selectedTable].totalPrice.toFixed(2)}</p>`);
  printWindow.document.write(`<p>Discount: ${tables[selectedTable].discount}%</p>`);
  printWindow.document.write(`<p>Discounted Total: Rs ${tables[selectedTable].discountedTotal.toFixed(2)}</p>`);
  printWindow.document.write('<h2>Payments</h2>');
  printWindow.document.write('<ul>');
  tables[selectedTable].payments.forEach(payment => {
    printWindow.document.write(`<li>${payment.method}: Rs ${payment.amount}</li>`);
  });
  printWindow.document.write('</ul>');
  printWindow.document.write('</div>');
  printWindow.document.write('<p>Thank you for dining with us!</p>');
  printWindow.document.write('</body></html>');
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
  printWindow.close();
}
// Track void history
let voidHistory = JSON.parse(localStorage.getItem('voidHistory')) || [];

document.addEventListener('DOMContentLoaded', function () {
  generateSalesReport();
});

function generateSalesReport() {
  console.log('Generating sales report...');
  console.log('Sales Data:', salesData);

  const salesReportElement = document.getElementById('salesReportOutput');
  if (!salesReportElement) {
    console.error('Element with ID "salesReportOutput" not found.');
    return;
  }

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
  salesReportElement.innerHTML = report;

  // Display void history
  displayVoidHistory();
}

function displayVoidHistory() {
  const voidHistoryElem = document.getElementById('voidHistoryOutput');
  if (!voidHistoryElem) {
    console.error('Element with ID "voidHistoryOutput" not found.');
    return;
  }

  let voidHistoryHTML = '<h3>Void History</h3>';
  voidHistory.forEach(entry => {
    voidHistoryHTML += `<p>${entry.time}: ${entry.name} - Rs ${entry.amount}</p>`;
  });
  voidHistoryElem.innerHTML = voidHistoryHTML;
}

function openOrderHistoryDialog() {
  const orderHistoryDialog = document.getElementById('order-history-dialog');
  if (orderHistoryDialog) {
    orderHistoryDialog.style.display = 'block';
  }
}

function closeOrderHistoryDialog() {
  const orderHistoryDialog = document.getElementById('order-history-dialog');
  if (orderHistoryDialog) {
    orderHistoryDialog.style.display = 'none';
  }
}

function editItem() {
  // Your logic for editing an item
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

// Function to print and reset the sales report
function printAndResetSalesReport() {
  console.log('Sales Report:', salesData);
  alert('Sales Report printed successfully!');

  // Reset the sales data
  salesData = {
    cashSales: 0,
    mobileSales: 0,
    totalSales: 0,
    totalDiscounts: 0,
    totalOrders: 0
  };

  // Reset the order history
  orderHistory = [];
  localStorage.removeItem('orderHistory');

  // Clear sales data from local storage
  localStorage.removeItem('salesData');

  // Clear void history
  voidHistory = [];
  localStorage.removeItem('voidHistory');

  alert('Sales report, order history, and void history have been reset.');

  // Re-render the order history and sales report
  renderOrderHistory();
  generateSalesReport();
}

// Function to reset sales report, total orders, and order history
function resetSalesReport() {
  console.log('Resetting sales report, total orders, and order history...');

  // Reset the sales data
  salesData = {
    cashSales: 0,
    mobileSales: 0,
    totalSales: 0,
    totalDiscounts: 0,
    totalOrders: 0
  };

  // Reset the order history
  orderHistory = [];
  localStorage.removeItem('orderHistory');

  // Clear sales data from local storage
  localStorage.removeItem('salesData');

  // Clear void history
  voidHistory = [];
  localStorage.removeItem('voidHistory');

  alert('Sales report, total orders, order history, and void history have been reset.');

  // Re-render the order history and sales report
  renderOrderHistory();
  generateSalesReport();
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

// Order History Functions
function openOrderHistoryDialog() {
  document.getElementById('order-history-dialog').style.display = 'block';
  renderOrderHistory(); // Render the order history inside the dialog
}

function closeOrderHistoryDialog() {
  document.getElementById('order-history-dialog').style.display = 'none';
}
function renderOrderHistory() {
  const orderHistoryContainer = document.getElementById('order-history-container');

  if (!orderHistoryContainer) {
    console.error('Order history container element not found.');
    return;
  }

  orderHistoryContainer.innerHTML = ''; // Clear existing order history

  orderHistory.forEach((order, index) => {
    const orderElem = document.createElement('div');
    orderElem.classList.add('order-history-item');

    // Format the timestamp
    const timestamp = new Date(order.timestamp);
    const formattedTimestamp = `${timestamp.toLocaleDateString()} ${timestamp.toLocaleTimeString()}`;

    // Create items list
    const itemsList = Object.entries(order.order).map(([name, item]) => `
      <tr>
        <td>${name}</td>
        <td>Rs ${item.price}</td>
        <td>${item.quantity}</td>
        <td>Rs ${item.price * item.quantity}</td>
      </tr>`).join('');

    orderElem.innerHTML = `
      <div class="order-header">
        <h3>Order #${index + 1}</h3>
        <p><strong>Table:</strong> ${order.table}</p>
        <p><strong>Date:</strong> ${formattedTimestamp}</p>
      </div>
      <div class="order-details">
        <p><strong>Total Price:</strong> Rs ${order.totalPrice}</p>
        <p><strong>Discount:</strong> ${order.discount}%</p>
        <p><strong>Discounted Total:</strong> Rs ${order.discountedTotal}</p>
      </div>
      <div class="order-items">
        <p><strong>Items:</strong></p>
        <table class="items-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Price</th>
              <th>Quantity</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsList}
          </tbody>
        </table>
      </div>
      <div class="order-payments">
        <p><strong>Payments:</strong> ${order.payments.map(payment => `${payment.method}: Rs ${payment.amount}`).join(', ')}</p>
      </div>
    `;
    orderHistoryContainer.appendChild(orderElem);
  });

  // Check order history length
  checkOrderHistoryLength();
}


function checkOrderHistoryLength() {
  const historyLength = orderHistory.length;
  console.log(`Order history length: ${historyLength}`);

  if (historyLength === 100) {
    alert('There are exactly 100 orders in the order history.');
  } else {
    alert(`There are ${historyLength} orders in the order history.`);
  }
}

// Call this function to check the length of order history
checkOrderHistoryLength();
