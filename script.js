// Initialize tables from localStorage or create default structure
let tables = JSON.parse(localStorage.getItem('tables')) || {};
const tableNumbers = ['1', '2', '3', '4', '5', '6', '7', '8A', '8B', '9A', '9B', '10A', '10B', '10C', '11', '12'];
tableNumbers.forEach(table => {
  if (!tables[`Table ${table}`]) {
    tables[`Table ${table}`] = { 
      order: {}, 
      totalPrice: 0, 
      status: "available", 
      payments: [], 
      discount: 0, 
      discountedTotal: 0, 
      time: null 
    };
  }
});

// Track whether void button was pressed
let isVoidMode = false;
let selectedTable = null;

// Initialize sales data from localStorage or create default structure with items
let salesData = JSON.parse(localStorage.getItem('salesData')) || {
  totalSales: 0,
  totalDiscounts: 0,
  totalOrders: 0,
  cashSales: 0,
  mobileSales: 0,
  items: []  // New property to track individual item sales details
};

// In case salesData existed without an 'items' property, add it and update localStorage
if (!salesData.items) {
  salesData.items = [];
  localStorage.setItem('salesData', JSON.stringify(salesData));
}



// Function to open the modal
function openAddItemModal() {
  const modal = document.getElementById('addItemModal');
  modal.style.display = 'flex';
  setTimeout(() => modal.style.opacity = '1', 50); // Smooth fade-in
}

// Function to close the modal
function closeAddItemModal() {
  const modal = document.getElementById('addItemModal');
  modal.style.opacity = '0';
  setTimeout(() => modal.style.display = 'none', 300); // Smooth fade-out
}

// Function to handle item selection
function selectItem(itemType) {
  const extraOptions = document.getElementById('extraOptions');
  if (extraOptions) {
    let optionsHTML = '';
    if (itemType === 'food') {
      optionsHTML = `
        <div class="extra-item" onclick="addItem('Cheese', 75)">
          <img src="images/cheese.jpg" alt="Cheese">
          <span>Cheese</span>
          <span>Rs 75</span>
        </div>
        <div class="extra-item" onclick="addItem('Sausage', 40)">
          <img src="images/sausage.jpg" alt="Sausage">
          <span>Sausage</span>
          <span>Rs 40</span>
        </div>
        <div class="extra-item" onclick="addItem('Extra Chicken', 120)">
         <img src="images/extra_chicken.jpg" alt="Extra Chicken">
         <span>Extra Chicken</span>
         <span>Rs 120</span>
        </div>
         <div class="extra-item" onclick="addItem('Extra Buff', 100)">
        <img src="images/extra_buff.jpg" alt="Extra Buff">
        <span>Extra Buff</span>
        <span>Rs 100</span>
        </div>


        <div class="extra-item" onclick="addItem('Egg', 50)">
          <img src="images/egg.jpg" alt="Egg">
          <span>Egg</span>
          <span>Rs 50</span>
        </div>
        <div class="extra-item" onclick="addItem('Salad', 75)">
          <img src="images/salad.jpg" alt="Salad">
          <span>Salad</span>
          <span>Rs 75</span>
        </div>
        <div class="extra-item" onclick="addItem('Toast', 50)">
          <img src="images/toast.jpg" alt="Toast">
          <span>Toast</span>
          <span>Rs 50</span>
        </div>
      `;
    } else if (itemType === 'drink') {
      optionsHTML = `
        <div class="extra-item" onclick="addItem('Boba', 50)">
          <img src="images/boba.jpg" alt="Boba">
          <span>Boba</span>
          <span>Rs 50</span>
        </div>
        <div class="extra-item" onclick="addItem('Flavour', 50)">
          <img src="images/flavour.jpg" alt="Flavour">
          <span>Flavour</span>
          <span>Rs 50</span>
        </div>
        <div class="extra-item" onclick="addItem('Extra Coil', 50)">
          <img src="images/coil.jpg" alt="Extra Coil">
          <span>Extra Coil</span>
          <span>Rs 50</span>
        </div>
        <div class="extra-item" onclick="addItem('Extra Flavour', 250)">
          <img src="images/extraflavour.jpg" alt="Extra Flavour">
          <span>Extra Flavour</span>
          <span>Rs 250</span>
        </div>
      `;
    }
    extraOptions.innerHTML = optionsHTML;
  }
}

// Function to save table data to localStorage
function saveData() {
  localStorage.setItem('tables', JSON.stringify(tables));
}

function addItem(itemName, itemPrice) {
  if (!selectedTable) {
    alert("Please select a table first!");
    return;
  }
  const table = tables[selectedTable];
  
// In addItem() and addToOrder() functions:
if (!table.order[itemName]) {
  table.order[itemName] = { 
    price: itemPrice, 
    quantity: 1,
    finalized: false,
    timeAdded: Date.now() // Add timestamp
  };
} else {
  table.order[itemName].quantity += 1;
}
  
  table.totalPrice = parseFloat((table.totalPrice + itemPrice).toFixed(2));
  table.discountedTotal = parseFloat((table.totalPrice * (1 - table.discount / 100)).toFixed(2));
  table.status = "occupied";
  table.newItemsAdded = true; // Flag for new items
  
  updateOrderSummary(); // Unified UI update
  saveData();
}

function removeItem(itemName) {
  if (!selectedTable) {
    alert("Please select a table first!");
    return;
  }
  
  const table = tables[selectedTable];
  const item = table.order[itemName];
  
  if (!item) return;
  
  if (item.finalized) {
    alert("Cannot remove finalized items. Use Void Mode.");
    return;
  }
  
  table.totalPrice = parseFloat((table.totalPrice - item.price * item.quantity).toFixed(2));
  delete table.order[itemName];
  
  if (Object.keys(table.order).length === 0) {
    table.status = "available";
    table.time = null;
  }
  
  updateOrderSummary();
  saveData();
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

function selectTable(table) {
  // Automatically finalize the current table's order before switching if new items were added
  if (selectedTable && selectedTable !== "None" && tables[selectedTable].newItemsAdded) {
    finalizeOrder();  // Finalize the current table's order
  }

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

  // Disable remove buttons for items from the previously selected table
  const removeButtons = document.querySelectorAll('.remove-item');
  removeButtons.forEach(button => {
    if (button.getAttribute('data-table') !== selectedTable) {
      button.disabled = true;
    } else {
      button.disabled = false;
    }
  });

  // Disable remove buttons for finalized items
  disableRemoveButtonForFinalizedItems();
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

function voidSelectedItem() {
  isVoidMode = true;
  const confirmVoid = confirm("Void mode activated. Select the item to void. Press 'Cancel' to exit void mode.");
  if (!confirmVoid) {
    isVoidMode = false;
    alert("Void mode canceled.");
  }
}

// Remove item from the order and record void details with reason/comment if void mode is active
function removeFromOrder(name) {
  if (tables[selectedTable].order[name]) {
    const item = tables[selectedTable].order[name];

    // Check if void mode is active before recording void details
    if (isVoidMode) {
      let comment;
      while (!comment) {
        comment = prompt("Please enter the reason for voiding this item:");
        if (!comment) {
          alert("Reason for voiding is required.");
        }
      }
      const voidEntry = {
        name: name,
        amount: item.price,
        time: new Date().toLocaleTimeString(),
        comment: comment // Include the void reason/comment
      };
      voidHistory.push(voidEntry);
      localStorage.setItem('voidHistory', JSON.stringify(voidHistory)); // Save void history to localStorage

      // Reset void mode after recording void details
      isVoidMode = false;
      alert("Item voided and recorded.");
    }

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


function addToOrder(name, price) {
  if (selectedTable === "None") {
    alert("Please select a table first!");
    return;
  }

  if (!tables[selectedTable].order) {
    tables[selectedTable].order = {};
  }

  if (isVoidMode) {
    removeFromOrder(name);
    isVoidMode = false;
    return;
  }

  // Add or update item with timestamp
  if (!tables[selectedTable].order[name]) {
    tables[selectedTable].order[name] = { 
      price: price, 
      quantity: 1, 
      finalized: false,
      timeAdded: Date.now() // Add timestamp here
    };
  } else {
    tables[selectedTable].order[name].quantity += 1;
  }

  // Update totals and status
  tables[selectedTable].totalPrice += price;
  tables[selectedTable].discountedTotal = 
    tables[selectedTable].totalPrice * (1 - tables[selectedTable].discount / 100);
  tables[selectedTable].status = "occupied";
  tables[selectedTable].newItemsAdded = true;

  // Update UI and storage
  renderTables();
  updateOrderSummary();
  saveData();
}

function displayOrderItems(orderItems) {
  const orderItemsList = document.getElementById('order-items');
  orderItemsList.innerHTML = '';
  let totalPrice = 0;

  for (const [name, item] of Object.entries(orderItems)) {
    const comments = item.comments || '';
    const orderItem = document.createElement('li');
    orderItem.innerHTML = `
      <div class="item-container">
        <div class="item-header" onclick="promptAndAddComment('${name}')">
          <span class="item-name">${name}</span>
          <span class="item-quantity">x${item.quantity}</span>
          <span class="item-price">Rs${item.price}</span>
          <span class="item-total">= Rs${item.price * item.quantity}</span>
          <button class="remove-item" onclick="removeFromOrder('${name}')">Remove</button>
        </div>
        <div class="item-comments">${comments}</div>
        <div class="item-timer" data-time-added="${item.timeAdded}"></div> <!-- Timer -->
      </div>
    `;
    orderItemsList.appendChild(orderItem);
    totalPrice += item.price * item.quantity;
  }

  document.getElementById('total-price').textContent = `Total: Rs${totalPrice}`;
  updatePaymentSummary();
  
  // Start timer update interval
  if (!window.timerInterval) {
    window.timerInterval = setInterval(updateTimers, 1000);
  }
}

function updateTimers() {
  const timers = document.querySelectorAll('.item-timer');
  timers.forEach(timer => {
    const timeAdded = parseInt(timer.dataset.timeAdded);
    if (isNaN(timeAdded)) return;
    
    const elapsedTime = Date.now() - timeAdded;
    const minutes = Math.floor(elapsedTime / 60000);
    const seconds = Math.floor((elapsedTime % 60000) / 1000);
    timer.textContent = `Added ${minutes}m ${seconds}s ago`;
  });
}


/**
 * Updates the order summary and displays it on the UI.
 */
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
}

/**
 * Disables the remove buttons for finalized items.
 */
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



// Reset order summary
function resetOrderSummary() {
  selectedTable = null;
  document.getElementById('selected-table-display').textContent = 'None';
  document.getElementById('selected-time').textContent = 'Time: --:--';
  document.getElementById('order-items').innerHTML = '';
  document.getElementById('total-price').textContent = '0';
}

/**
 * Displays the order items on the UI.
 * @param {object} orderItems - The items in the order to display.
 */
function displayOrderItems(orderItems) {
  const orderItemsList = document.getElementById('order-items');
  orderItemsList.innerHTML = '';
  let totalPrice = 0;
  for (const [name, item] of Object.entries(orderItems)) {
    const orderItem = document.createElement('li');
    orderItem.classList.add('order-item'); // Add a class for styling
    orderItem.innerHTML = `
      <div class="item-header" onclick="promptAndAddComment('${name}')">
        <span class="item-name">${name}</span>
        <span class="item-quantity">x ${item.quantity}</span>
        <span class="item-price">Rs ${item.price}</span>
        <span class="item-total">= Rs ${item.price * item.quantity}</span>
        <button class="remove-item" data-name="${name}" data-table="${selectedTable}" onclick="removeFromOrder('${name}')">Remove</button>
      </div>
      <div class="item-comments">${item.comments || ''}</div>
    `;
    orderItemsList.appendChild(orderItem);

    totalPrice += item.price * item.quantity;
  }
  document.getElementById('total-price').textContent = `Total: Rs ${totalPrice}`;
  tables[selectedTable].totalPrice = totalPrice;
  tables[selectedTable].discountedTotal = tables[selectedTable].totalPrice * ((100 - tables[selectedTable].discount) / 100);
  saveData();

  // Disable remove buttons for finalized items
  disableRemoveButtonForFinalizedItems();
}

/**
 * Prompts the user for a comment and adds it to the specified order item.
 * @param {string} name - The name of the item to comment on.
 */
function promptAndAddComment(name) {
  const comment = prompt('Enter your comment:');
  if (comment !== null) {
    addCommentToOrderItem(name, comment);
  }
}

/**
 * Adds a comment to an order item.
 * @param {string} name - The name of the item to comment on.
 * @param {string} comment - The comment to add.
 */
function addCommentToOrderItem(name, comment) {
  if (tables[selectedTable].order[name]) {
    tables[selectedTable].order[name].comments = comment;
    updateOrderSummary();
    saveData();
  } else {
    alert('Item not found in order.');
  }
}



/**
 * Disables the remove buttons for finalized items.
 */
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


// Replace the existing menu item event listeners with this
document.addEventListener('click', (e) => {
  const menuItem = e.target.closest('.menu-item');
  if (menuItem) {
    const name = menuItem.getAttribute('data-name');
    const price = parseFloat(menuItem.getAttribute('data-price'));
    addToOrder(name, price);
  }
});

function finalizeOrder() {
  if (!selectedTable) {
    alert("Please select a table first!");
    return;
  }

  const table = tables[selectedTable];
  const newItems = {};
  const now = new Date();

  // Find new items that haven't been finalized yet
  for (const [name, item] of Object.entries(table.order)) {
    if (!item.finalized) {
      newItems[name] = item;
      item.finalized = true;
      item.finalizedTime = now;
    }
  }

  if (Object.keys(newItems).length === 0) {
    alert("No new items to finalize!");
    return;
  }

  // Generate KOTs
  const kot = {
    table: selectedTable,
    timestamp: now.toISOString(),
    items: newItems,
    kotNumber: generateKOTNumber()
  };

  // Group items by section
  const kotGroups = {
    Bar: [],
    Kitchen: []
  };

  for (const [name, item] of Object.entries(newItems)) {
    const menuItem = document.querySelector(`.menu-item[data-name="${name}"]`);
    const section = menuItem?.getAttribute('data-section') || 'Kitchen';
    kotGroups[section].push({
      name,
      quantity: item.quantity,
      price: item.price,
      comments: item.comments || ''
    });
  }

  // Send KOTs to appropriate sections
  for (const [section, items] of Object.entries(kotGroups)) {
    if (items.length > 0) {
      printKOT(section, items, kot.kotNumber);
    }
  }

  updateOrderSummary();
  saveData();
  alert(`New KOT (#${kot.kotNumber}) generated for ${selectedTable}`);
}

let kotCounter = 1;
function generateKOTNumber() {
  return kotCounter++;
}

function printKOT(section, items, kotNumber) {
  const kotContent = `
    <div class="kot">
      <h3>${section} KOT #${kotNumber}</h3>
      <p>Table: ${selectedTable}</p>
      <p>Time: ${new Date().toLocaleTimeString()}</p>
      <ul>
        ${items.map(item => `
          <li>${item.name} x${item.quantity}${item.comments ? ` (${item.comments})` : ''}</li>
        `).join('')}
      </ul>
    </div>
  `;
  
  // For actual implementation, you'd want to send this to a printer
  // Here we'll just log it and show an alert
  console.log(kotContent);
  alert(`Sent to ${section}:\n${items.map(i => `${i.name} x${i.quantity}`).join('\n')}`);
}


// Function to change table
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
    disableRemoveButtons(); // Disable remove buttons after changing table
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
  const qrCodeImage = document.getElementById('qr-code-image');
  const qrCodeDialog = document.getElementById('qr-code-dialog');

  if (!qrCodeImage) {
    console.error('QR code element not found');
    return;
  }

  qrCodeImage.src = 'https://raw.githubusercontent.com/sukram145/fonepay_qr.png/main/qr.png';
  if (qrCodeDialog) {
    qrCodeDialog.style.display = 'flex'; // Change to 'flex' to match the CSS layout
  } else {
    console.error('QR code dialog element not found');
  }
}

// Function to close the QR code dialog
function closeQRCodeDialog() {
  const qrCodeDialog = document.getElementById('qr-code-dialog');

  if (qrCodeDialog) {
    qrCodeDialog.style.display = 'none';
  } else {
    console.error('QR code dialog element not found');
  }
}


function addPayment(paymentMethod) {
  const validMethods = ['Cash', 'Mobile Payment'];
  if (!validMethods.includes(paymentMethod)) {
    alert('Invalid payment method.');
    return;
  }

  const numericInput = document.getElementById('numeric-input');
  const amount = parseFloat(numericInput?.value) || 0;
  const discountedTotal = tables[selectedTable]?.discountedTotal || 0;
  const totalPaid = tables[selectedTable]?.payments.reduce((sum, p) => sum + p.amount, 0) || 0;

  if (amount <= 0) {
    alert('Please enter a valid amount.');
    return;
  }

  if (paymentMethod === 'Mobile Payment' && (totalPaid + amount) > discountedTotal) {
    alert(`Amount exceeds remaining balance. Max allowed: Rs${discountedTotal - totalPaid}`);
    return;
  }

  if (paymentMethod === 'Mobile Payment') {
    displayQRCode(); // Show QR code before processing the payment
  }

  tables[selectedTable].payments.push({ method: paymentMethod, amount });
  updatePaymentSummary();
  numericInput.value = '';
  saveData();
}


function updateOrderSummary() {
  const order = tables[selectedTable];
  if (!order) return;

  // Display order items
  displayOrderItems(order.order);

  // Update selected table
  const selectedTableElem = document.getElementById('selected-table');
  if (selectedTableElem) {
    selectedTableElem.textContent = selectedTable;
  }

  // Update selected time
  const selectedTimeElem = document.getElementById('selected-time');
  if (selectedTimeElem) {
    selectedTimeElem.textContent = `Time: ${tables[selectedTable].time}`;
  }

  // Display discounted total instead of regular total
  const totalPriceElem = document.getElementById('total-price');
  if (totalPriceElem) {
    totalPriceElem.textContent = order.discountedTotal.toFixed(2);
  }
}

function applyDiscount(percentage) {
  if (!selectedTable) {
    alert("Please select a table first!");
    return;
  }
  const table = tables[selectedTable];
  table.discount = Math.min(Math.max(percentage, 0), 100); // Clamp between 0-100
  table.discountedTotal = table.totalPrice * (1 - table.discount / 100);

  // Update all necessary summaries and save the data
  updatePaymentSummary();
  updateOrderSummary();
  updateTotalAmount();
  saveData();
}


/**
 * Updates the payment summary and calculates change or shortfall.
 */
function updatePaymentSummary() {
  const paymentSummaryElement = document.getElementById('payment-summary');
  const changeAmountElement = document.getElementById('change-amount');
  const insufficientAmountElement = document.getElementById('insufficient-amount');
  const shortAmountElement = document.getElementById('short-amount');

  let totalPaid = 0;

  // Clear and update the payment summary
  if (tables[selectedTable]?.payments) {
    paymentSummaryElement.innerHTML = '';
    tables[selectedTable].payments.forEach(payment => {
      const paymentItem = document.createElement('li');
      paymentItem.textContent = `${payment.method}: Rs ${payment.amount}`;
      paymentSummaryElement.appendChild(paymentItem);
      totalPaid += payment.amount;
    });
  }

  const selectedTableDetails = tables[selectedTable];
  if (selectedTableDetails) {
    const discount = selectedTableDetails.discount || 0;
    const discountedTotal = selectedTableDetails.totalPrice * ((100 - discount) / 100);
    const changeAmount = totalPaid - discountedTotal;

    if (changeAmount >= 0) {
      // Display change amount
      changeAmountElement.textContent = `Change: Rs ${changeAmount.toFixed(2)}`;
      insufficientAmountElement.style.display = 'none';
      shortAmountElement.style.display = 'none';
    } else {
      // Display insufficient payment details
      insufficientAmountElement.style.display = 'block';
      shortAmountElement.style.display = 'block';
      shortAmountElement.textContent = `Short by: Rs ${Math.abs(changeAmount).toFixed(2)}`;
      changeAmountElement.textContent = '';
    }
  }
}

/**
 * Updates the total amount displayed.
 */
function updateTotalAmount() {
  // Get the HTML element where the total amount is displayed
  const totalAmountElement = document.getElementById('total-amount');

  // Fetch the discounted total price for the currently selected table
  const discountedTotalPrice = tables[selectedTable]?.discountedTotal || 0;

  // If the element exists, update its text content with the discounted total, formatted to 2 decimal places
  if (totalAmountElement) {
    totalAmountElement.textContent = discountedTotalPrice.toFixed(2);
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

    // Reset the payments array and discount for the selected table
    if (tables[selectedTable]) {
      tables[selectedTable].payments = [];
      tables[selectedTable].discount = 0;
      tables[selectedTable].discountedTotal = tables[selectedTable].totalPrice;
    }
  }
}

// Close the dialog when the user clicks outside of it
window.onclick = function(event) {
  const dialog = document.getElementById('payment-dialog');
  if (event.target == dialog) {
    dialog.style.display = 'none';
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

  // Reset the payments array and discount for the selected table
  if (tables[selectedTable]) {
    tables[selectedTable].payments = [];
    tables[selectedTable].discount = 0;
    tables[selectedTable].discountedTotal = tables[selectedTable].totalPrice;
  }

  // Clear the input field
  const numericInput = document.getElementById('numeric-input');
  if (numericInput) numericInput.value = '';

  updatePaymentSummary(); // Refresh payment summary
  updateTotalAmount(); // Refresh total amount with no discount
}
function completeOrder() {
  const totalPriceElem = document.getElementById('total-price');

  if (!totalPriceElem || !totalPriceElem.textContent) {
    alert('Total price element is not found or its content is invalid.');
    return;
  }

  const table = tables[selectedTable];
  const originalTotal = table?.totalPrice || 0;
  const discountPercentage = table?.discount || 0;
  const discountedTotal = table?.discountedTotal || 0;
  const totalPaid = table?.payments.reduce((sum, payment) => sum + payment.amount, 0) || 0;

  if (totalPaid < discountedTotal) {
    const shortAmount = discountedTotal - totalPaid;
    alert(`Payment is not enough to settle the order! Short by Rs ${shortAmount}`);
    return;
  }

  // Calculate actual discount amount
  const discountAmount = originalTotal * (discountPercentage / 100);

  // Track remaining balance for payment allocation
  let remainingBalance = discountedTotal;
  let cashSalesAmount = 0;
  let mobileSalesAmount = 0;

  table.payments.forEach(payment => {
    const method = payment.method.toLowerCase().trim();
    const amount = payment.amount;

    if (method === 'cash') {
      const allocated = Math.min(remainingBalance, amount);
      cashSalesAmount += allocated;
      remainingBalance -= allocated;
    } else if (method === 'mobile payment') {
      const allocated = Math.min(remainingBalance, amount);
      mobileSalesAmount += allocated;
      remainingBalance -= allocated;
    }
  });

  // Update global sales data
  salesData.cashSales = (salesData.cashSales || 0) + cashSalesAmount;
  salesData.mobileSales = (salesData.mobileSales || 0) + mobileSalesAmount;
  salesData.totalSales = (salesData.totalSales || 0) + discountedTotal;
  salesData.totalDiscounts = (salesData.totalDiscounts || 0) + discountAmount;
  salesData.totalOrders = (salesData.totalOrders || 0) + 1;

  // Handle order completion
  printReceipt();
  const change = totalPaid - discountedTotal;
  if (change > 0) alert(`Customer change: Rs ${change.toFixed(2)}`);

  // Update order history
  orderHistory.push({
    table: selectedTable,
    order: { ...table.order },
    totalPrice: originalTotal,
    discountedTotal: discountedTotal.toFixed(2),
    discount: discountPercentage,
    payments: [...table.payments],
    timestamp: new Date()
  });

  // Track individual items
  for (const [itemName, itemDetails] of Object.entries(table.order)) {
    const existingItem = salesData.items.find(i => i.name === itemName);
    if (existingItem) {
      existingItem.qty += itemDetails.quantity;
      existingItem.totalSold += itemDetails.price * itemDetails.quantity;
    } else {
      salesData.items.push({
        name: itemName,
        qty: itemDetails.quantity,
        totalSold: itemDetails.price * itemDetails.quantity
      });
    }
  }

  // Reset table state
  table.order = {};
  table.totalPrice = 0;
  table.discountedTotal = 0;
  table.status = "available";
  table.payments = [];
  table.discount = 0;
  table.time = null;

  // Update UI and storage
  saveData();
  saveOrderHistory();
  closePaymentDialog();
  closeQRCodeDialog();
  renderTables();
  updateOrderSummary();
  updatePaymentSummary();
  generateSalesReport();

  alert("Order completed successfully!");
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

// Event listener for keyboard input
document.addEventListener('keydown', function(event) {
  const key = event.key;

  // Check if the key is a digit (0-9)
  if (!isNaN(key) && key !== ' ') {
    addNumber(key);
  } else if (key === 'Backspace') {
    backspaceInput();
  } else if (key === 'Delete') {
    clearInput();
  } else if (key === 'Enter') {
    // You can customize this to add a quick amount if needed
    // Example: addQuickAmount(100); // Adds 100 to the input
  }
});


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
  const logoUrl = 'images/RestaurantLogo.png'; // Ensure the logo URL is correct and accessible
  const printWindow = window.open('', 'PRINT', 'height=600,width=800');

  printWindow.document.write('<html><head><title>Receipt</title><style>');
  printWindow.document.write(`
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 20px;
    }
    .header {
      text-align: center;
      margin-bottom: 20px;
    }
    .details, .summary {
      margin-top: 20px;
    }
    .summary {
      border-top: 1px solid #000;
      padding-top: 10px;
    }
    ul {
      list-style-type: none;
      padding: 0;
    }
    li {
      margin: 5px 0;
    }
    .footer {
      margin-top: 20px;
      text-align: center;
      font-size: 0.9em;
      font-style: italic;
    }
  `);
  printWindow.document.write('</style></head><body>');

  // Header Section
  printWindow.document.write('<div class="header">');
  printWindow.document.write('<h1>Taboche Bhaktapur</h1>');
  printWindow.document.write(`<img src="${logoUrl}" alt="Restaurant Logo" style="width:100px;height:auto;">`);
  printWindow.document.write('<p>Siddha Pokhar, Bhaktapur, Nepal</p>');
  printWindow.document.write('<p>Phone: +977 981-0208828</p>');
  printWindow.document.write(`<p>Date: ${new Date().toLocaleDateString()}</p>`);
  printWindow.document.write(`<p>Time: ${new Date().toLocaleTimeString()}</p>`);
  printWindow.document.write(`<p>Table: ${selectedTable}</p>`);
  printWindow.document.write('</div>');

  // Order Details Section
  printWindow.document.write('<div class="details">');
  printWindow.document.write('<h2>Order Details</h2>');
  printWindow.document.write('<ul>');
  Object.entries(tables[selectedTable].order).forEach(([name, item]) => {
    printWindow.document.write(`<li>${name}: Rs ${item.price} x ${item.quantity} = Rs ${(item.price * item.quantity).toFixed(2)}</li>`);
  });
  printWindow.document.write('</ul>');
  printWindow.document.write('</div>');

  // Summary Section
  printWindow.document.write('<div class="summary">');
  printWindow.document.write(`<p>Total Price: Rs ${tables[selectedTable].totalPrice.toFixed(2)}</p>`);
  printWindow.document.write(`<p>Discount: ${tables[selectedTable].discount}%</p>`);
  printWindow.document.write(`<p>Discounted Total: Rs ${tables[selectedTable].discountedTotal.toFixed(2)}</p>`);
  printWindow.document.write('<h2>Payment Details</h2>');
  printWindow.document.write('<ul>');
  tables[selectedTable].payments.forEach(payment => {
    printWindow.document.write(`<li>${payment.method}: Rs ${payment.amount.toFixed(2)}</li>`);
  });
  printWindow.document.write('</ul>');
  printWindow.document.write('</div>');

  // Footer Section
  printWindow.document.write('<div class="footer">');
  printWindow.document.write('<p>Thank you for dining with us!</p>');
  printWindow.document.write('<p>We look forward to serving you again.</p>');
  printWindow.document.write('</div>');

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

function displayVoidHistory() {
  const voidHistoryElem = document.getElementById('voidHistoryOutput');
  if (!voidHistoryElem) {
    console.error('Element with ID "voidHistoryOutput" not found.');
    return;
  }

  let voidHistoryHTML = '';
  voidHistory.forEach(entry => {
    voidHistoryHTML += `<p>${entry.time}: ${entry.name} - Rs ${entry.amount}<br>Reason: ${entry.comment}</p>`;
  });
  voidHistoryElem.innerHTML = voidHistoryHTML;
}

function openVoidHistoryDialog() {
  const voidHistoryDialog = document.getElementById('void-history-dialog');
  if (voidHistoryDialog) {
    displayVoidHistory(); // Populate the void history content
    voidHistoryDialog.style.display = 'block';
  }
}

function closeVoidHistoryDialog() {
  const voidHistoryDialog = document.getElementById('void-history-dialog');
  if (voidHistoryDialog) {
    voidHistoryDialog.style.display = 'none';
  }
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


function printReport() {
  // Generate the sales report HTML
  const reportContent = generateSalesReport();
  
  // Add restaurant name, date, and time
  const restaurantName = "taboche Restaurent"; // Replace with your restaurant's name
  const currentDate = new Date().toLocaleDateString();
  const currentTime = new Date().toLocaleTimeString();
  const currentDay = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date());

  // Create a new window for printing
  const printWindow = window.open('', '_blank');
  
  // Write the report content to the new window
  printWindow.document.open();
  printWindow.document.write(`
    <html>
      <head>
        <title>Sales Report</title>
        <style>
          /* Add basic styles for the report */
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
          }
          table {
            border-collapse: collapse;
            width: 100%;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
          }
          th {
            background-color: #f4f4f4;
          }
          header {
            text-align: center;
            margin-bottom: 20px;
          }
          footer {
            margin-top: 20px;
            text-align: center;
            font-style: italic;
            font-size: 0.9em;
          }
        </style>
      </head>
      <body>
        <header>
          <h1>${restaurantName}</h1>
          <p>Sales Report</p>
          <p>Date: ${currentDate} | Day: ${currentDay} | Time: ${currentTime}</p>
        </header>
        ${reportContent}
        <footer>
          <p>Generated by Restaurant Sales Management System</p>
        </footer>
      </body>
    </html>
  `);
  printWindow.document.close();

  // Trigger the print dialog
  printWindow.print();
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
    totalOrders: 0,
    items: [] // Clear the items array
  };

  // Reset the order history
  orderHistory = [];
  localStorage.removeItem('orderHistory');

  // Clear sales data from local storage
  localStorage.removeItem('salesData');

  // Clear void history
  voidHistory = [];
  localStorage.removeItem('voidHistory');

  // Reset the items sales table
  const itemsTable = document.querySelector('#items-sales-details tbody');
  if (itemsTable) {
    itemsTable.innerHTML = ''; // Clear all table rows
  }

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

function generateSalesReport() {
  const totalDiscounts = salesData.totalDiscounts || 0;
  const totalOrders = salesData.totalOrders || 0;
  const cashSales = salesData.cashSales || 0;
  const mobileSales = salesData.mobileSales || 0;
  const totalSales = salesData.totalSales || 0;
  const items = salesData.items || [];

  // Create rows for each item in the items array
  const itemRows = items.map(item => `
    <tr>
      <td>${item.name}</td>
      <td>${item.qty}</td>
      <td>Rs ${item.totalSold}</td>
    </tr>
  `).join("");

  // Build the complete HTML report
  const report = `
    <p>Total Discounts: Rs ${totalDiscounts}</p>
    <p>Total Cash Sales: Rs ${cashSales}</p>
    <p>Total Mobile Payment Sales: Rs ${mobileSales}</p>
    <p>Total Orders: ${totalOrders}</p>
    <p>Total Sales (Cash + Mobile Payment): Rs ${totalSales}</p>
    
    <h4>Items Sales Details</h4>
    <table border="1" cellspacing="0" cellpadding="5">
      <thead>
        <tr>
          <th>Item Name</th>
          <th>Quantity Sold</th>
          <th>Total Sold (Rs)</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows}
      </tbody>
    </table>
  `;
  
  return report;
}


function displaySalesReport(report) {
  const modalContent = document.getElementById('modalContent');
  if (!modalContent) {
    console.error('Element with ID "modalContent" not found.');
    return;
  }
  modalContent.innerHTML = report;
  openModal();
}

function openModal() {
  const modal = document.getElementById('salesReportModal');
  modal.style.display = 'block';

  const span = document.getElementsByClassName('close')[0];
  span.onclick = function() {
    modal.style.display = 'none';
  };

  window.onclick = function(event) {
    if (event.target === modal) {
      modal.style.display = 'none';
    }
  };
}

function closeModal() {
  const modal = document.getElementById('salesReportModal');
  modal.style.display = 'none';
}

function showSalesReportsContent() {
  const report = generateSalesReport();
  displaySalesReport(report);
}

// Show Settings Content for Table Management
function showSettingsContent() {
  const content = document.getElementById('content');
  if (!content) {
    console.error('Content element not found');
    return;
  }

  content.innerHTML = `
    <div id="manage-tables">
      <input type="text" id="add-table-input" placeholder="Enter new table number">
      <button onclick="addTable()">Add Table</button>
      <input type="text" id="remove-table-input" placeholder="Enter table number to remove">
      <button onclick="removeTable()">Remove Table</button>
    </div>
  `;
}

// Function to Add Table
function addTable() {
  const newTableNumber = document.getElementById('add-table-input').value;
  if (newTableNumber && !tables[`Table ${newTableNumber}`]) {
    tables[`Table ${newTableNumber}`] = { order: {}, totalPrice: 0, status: "available", payments: [], discount: 0, discountedTotal: 0, time: null };
    renderTables();
    saveData();
    document.getElementById('add-table-input').value = ''; // Clear input field after adding
  } else {
    alert('Table number already exists or invalid input!');
  }
}

// Function to Remove Table
function removeTable() {
  const tableNumber = document.getElementById('remove-table-input').value;
  if (tableNumber && tables[`Table ${tableNumber}`]) {
    delete tables[`Table ${tableNumber}`];
    renderTables();
    saveData();
    document.getElementById('remove-table-input').value = ''; // Clear input field after removing
  } else {
    alert('Table number not found or invalid input!');
  }
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


function openOrderHistoryDialog() {
  const dialog = document.getElementById('order-history-dialog');
  if (dialog) {
      dialog.style.display = 'block';
      renderOrderHistory(); // Render the order history inside the dialog
  } else {
      console.error('Element with ID "order-history-dialog" not found.');
  }
}

function closeOrderHistoryDialog() {
  const dialog = document.getElementById('order-history-dialog');
  if (dialog) {
      dialog.style.display = 'none';
  } else {
      console.error('Element with ID "order-history-dialog" not found.');
  }
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

  const message = historyLength === 100 
    ? 'There are exactly 100 orders in the order history.' 
    : `There are ${historyLength} orders in the order history.`;

  alert(message);
}

// Call this function to check the length of order history
checkOrderHistoryLength();


const ITEMS_PER_PAGE = 20; // Adjust as needed
let currentPage = 1;



function nextPage() {
  if (currentPage < Math.ceil(salesData.items.length / ITEMS_PER_PAGE)) currentPage++;
  updateReport();
}

function prevPage() {
  if (currentPage > 1) currentPage--;
  updateReport();
}

function updateReport() {
  const itemRows = filterAndPaginateItems();
  document.getElementById('itemsTableBody').innerHTML = itemRows;
}
