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
  
  
  
  // Function to toggle sidebar
  function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('active');
  }
  
  // Function to toggle dropdown menu
  function toggleDropdown() {
    const dropdown = document.querySelector('.dropdown-container');
    dropdown.classList.toggle('show');
  }
  
  // Function to show content based on the selected option
  function showContent(id) {
    const content = document.getElementById('content');
    let contentHtml = '';
  
    switch(id) {
      case 'home':
        contentHtml = '<h1>Home</h1><p>Welcome to the Taboche POS Home Page.</p>';
        break;
      case 'add-item':
        contentHtml = `
          <h1>Add Item</h1>
          <form id="add-item-form">
            <label for="new-item-name">Item Name:</label>
            <input type="text" id="new-item-name" required><br>
            <label for="new-item-price">Item Price (Rs):</label>
            <input type="number" id="new-item-price" required><br>
            <label for="new-item-category">Item Category:</label>
            <input type="text" id="new-item-category" required><br>
            <label for="new-item-image">Item Image:</label>
            <input type="file" id="new-item-image" accept="image/*" required><br>
            <button type="button" onclick="addItem()">Add Item</button>
          </form>
        `;
        break;
      case 'remove-item':
        contentHtml = `
          <h1>Remove Item</h1>
          <label for="item-select">Select Item to Remove:</label>
          <select id="item-select"></select><br>
          <button type="button" onclick="removeItem()">Remove Item</button>
        `;
        populateItemOptions();
        break;
      case 'edit-item':
        contentHtml = `
          <h1>Edit Item</h1>
          <label for="edit-item-select">Select Item to Edit:</label>
          <select id="edit-item-select"></select><br>
          <button type="button" onclick="editItem()">Edit Item</button>
          <div id="edit-item-details"></div>
        `;
        populateItemOptions('edit-item-select');
        break;
      case 'sales-reports':
        contentHtml = '<h1>Sales Reports</h1><p>View your sales reports here.</p>';
        break;
      case 'settings':
        contentHtml = `
          <h1>Settings</h1>
          <form id="settings-form">
            <label for="store-name">Store Name:</label>
            <input type="text" id="store-name" required><br>
            <label for="currency">Currency:</label>
            <input type="text" id="currency" required><br>
            <button type="button" onclick="updateSettings()">Update Settings</button>
          </form>
        `;
        break;
      case 'admin-panel':
        contentHtml = '<h1>Admin Panel</h1><p>Manage your admin settings here.</p>';
        break;
      default:
        contentHtml = `<h1>${id}</h1>`;
    }
  
    content.innerHTML = contentHtml;
  }
  
  // Function to show login dialog
  function showLoginDialog() {
    alert('Show login dialog');
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
  
  // Function to add a new item to the menu
  function addItem() {
    const itemName = document.getElementById('new-item-name').value.trim();
    const itemPrice = parseFloat(document.getElementById('new-item-price').value.trim());
    const itemCategory = document.getElementById('new-item-category').value.trim();
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
  
  // Function to remove an item from the menu
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
  
  // Function to edit an item from the menu
  function editItem() {
    const itemSelect = document.getElementById('edit-item-select');
    const selectedItemName = itemSelect.value;
    const items = getItemsFromStorage();
    const item = items.find(item => item.name === selectedItemName);
    
    if (item) {
      const editItemDetails = `
        <h2>Edit Item Details</h2>
        <label for="edit-item-name">Item Name:</label>
        <input type="text" id="edit-item-name" value="${item.name}" required><br>
        <label for="edit-item-price">Item Price (Rs):</label>
        <input type="number" id="edit-item-price" value="${item.price}" required><br>
        <label for="edit-item-category">Item Category:</label>
        <input type="text" id="edit-item-category" value="${item.category}" required><br>
        <label for="edit-item-image">Item Image:</label>
        <input type="file" id="edit-item-image" accept="image/*"><br>
        <button type="button" onclick="saveEditedItem('${item.name}')">Save Changes</button>
      `;
      document.getElementById('edit-item-details').innerHTML = editItemDetails;
    }
  }
  
  // Function to save edited item
  function saveEditedItem(originalName) {
    const items = getItemsFromStorage();
    const itemIndex = items.findIndex(item => item.name === originalName);
    
    if (itemIndex >= 0) {
      const editedName = document.getElementById('edit-item-name').value.trim();
      const editedPrice = parseFloat(document.getElementById('edit-item-price').value.trim());
      const editedCategory = document.getElementById('edit-item-category').value.trim();
      const editedImage = document.getElementById('edit-item-image').files[0];
  
      const editedItem = {
        name: editedName,
        price: editedPrice,
        category: editedCategory,
        image: items[itemIndex].image // Keep the original image if none is uploaded
      };
  
      if (editedImage) {
        const reader = new FileReader();
        reader.onload = function(e) {
          editedItem.image = e.target.result;
          items[itemIndex] = editedItem;
          saveItems(items);
          alert('Item updated successfully');
          showContent('edit-item');
        };
        reader.readAsDataURL(editedImage);
      } else {
        items[itemIndex] = editedItem;
        saveItems(items);
        alert('Item updated successfully');
        showContent('edit-item');
      }
    }
  }
  
  // Function to display sales reports
  function showSalesReports() {
    const salesReportsContent = `
      <h1>Sales Reports</h1>
      <p>View your sales reports here.</p>
      <button type="button" onclick="printSalesReport()">Print Sales Report</button>
    `;
    document.getElementById('content').innerHTML = salesReportsContent;
  }
  
  // Function to print sales report
  function printSalesReport() {
    const printContent = document.getElementById('content').innerHTML;
    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write('<html><head><title>Print Sales Report</title></head><body>');
    printWindow.document.write(printContent);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
  }
  
  // Function to update settings
  function updateSettings() {
    const storeName = document.getElementById('store-name').value;
    const currency = document.getElementById('currency').value;
    alert(`Settings updated: Store Name - ${storeName}, Currency - ${currency}`);
    // Add logic to update settings
  }
  
  // Local storage functions for items
  function getItemsFromStorage() {
    return JSON.parse(localStorage.getItem('items')) || [];
  }
  
  function saveItems(items) {
    localStorage.setItem('items', JSON.stringify(items));
  }
  
  // Function to populate item options
  function populateItemOptions(selectId = 'item-select') {
    const itemSelect = document.getElementById(selectId);
    itemSelect.innerHTML = '';
    const items = getItemsFromStorage();
    items.forEach(item => {
      const option = document.createElement('option');
      option.value = item.name;
      option.textContent = item.name;
      itemSelect.appendChild(option);
    });
  }
  
  // Initial setup
  document.addEventListener('DOMContentLoaded', () => {
    populateItemOptions();
    addMenuItemListeners();
    updateDateTime();
    setInterval(updateDateTime, 1000);
    // Initialize other components if necessary
  });
  
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
  
  
  
  // Function to update settings
  function updateSettings() {
    const storeName = document.getElementById('store-name').value;
    const currency = document.getElementById('currency').value;
    alert(`Settings updated: Store Name - ${storeName}, Currency - ${currency}`);
    // Add logic to update settings
  }
  
  // Function to manage users
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
  
  
  function populateItemOptions() {
    const itemSelect = document.getElementById('item-select');
    if (itemSelect) {
      itemSelect.innerHTML = '';
      const items = getItemsFromStorage();
      items.forEach(item => {
        const option = document.createElement('option');
        option.value = item.name;
        option.textContent = item.name;
        itemSelect.appendChild(option);
      });
    } else {
      console.error('Element with ID "item-select" not found.');
    }
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
  
  