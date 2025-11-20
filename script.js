/* Get references to DOM elements */
const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");

/* Show initial placeholder until user selects a category */
productsContainer.innerHTML = `
  <div class="placeholder-message">
    Select a category to view products
  </div>
`;

/* Update Selected Products header */
document.querySelector(".selected-products h2").textContent =
  "Selected Products ✨";

/* Load product data from JSON file */
async function loadProducts() {
  const response = await fetch("products.json");
  const data = await response.json();
  return data.products;
}

/* Function to create and display the modal */
function createModal(product) {
  const modalOverlay = document.createElement("div");
  modalOverlay.classList.add("modal-overlay");

  const modal = document.createElement("div");
  modal.classList.add("modal");

  modal.innerHTML = `
    <button class="close-modal">&times;</button>
    <img src="${product.image}" alt="${product.name}" class="modal-image">
    <h2>${product.name}</h2>
    <h3>${product.brand}</h3>
    <p>${product.description}</p>
  `;

  modalOverlay.appendChild(modal);
  document.body.appendChild(modalOverlay);

  // Close modal on overlay or button click
  modalOverlay.addEventListener("click", (e) => {
    if (
      e.target === modalOverlay ||
      e.target.classList.contains("close-modal")
    ) {
      modalOverlay.remove();
    }
  });
}

/* Create HTML for displaying product cards */
function displayProducts(products) {
  productsContainer.innerHTML = products
    .map(
      (product) => `
    <div class="product-card">
      <img src="${product.image}" alt="${product.name}">
      <div class="product-info">
        <h3>${product.name}</h3>
        <p>${product.brand}</p>
        <button class="view-details-btn" data-name="${product.name}">View Details</button>
      </div>
    </div>
  `
    )
    .join("");

  // Add event listeners to "View Details" buttons
  const viewDetailsButtons = document.querySelectorAll(".view-details-btn");
  viewDetailsButtons.forEach((button) => {
    button.addEventListener("click", async (e) => {
      e.stopPropagation(); // Prevent triggering product-card click event

      const productName = e.target.dataset.name;
      const products = await loadProducts();
      const product = products.find((p) => p.name === productName);

      if (product) {
        createModal(product);
      }
    });
  });

  // Add click event listener to product cards
  productsContainer.addEventListener("click", (e) => {
    const cardElement = e.target.closest(".product-card");
    if (!cardElement) return;

    const productName = cardElement.querySelector("h3").textContent;
    const product = products.find((p) => p.name === productName);

    if (product) {
      toggleProductSelection(product, cardElement);
    }
  });
}

/* Filter and display products when category changes */
categoryFilter.addEventListener("change", async (e) => {
  const products = await loadProducts();
  const selectedCategory = e.target.value;

  /* filter() creates a new array containing only products 
     where the category matches what the user selected */
  const filteredProducts = products.filter(
    (product) => product.category === selectedCategory
  );

  displayProducts(filteredProducts);
});

/* Chat history to maintain context */
const chatHistory = [
  {
    role: "system",
    content:
      "You are a skincare and beauty expert. Answer questions about routines, skincare, haircare, makeup, fragrance, ingredients, and beauty-related topics. Do not answer questions outside these areas. If a question is unrelated, respond with: 'I'm here to help with skincare, beauty routines, haircare, makeup, and fragrance questions. Try asking me something in those areas!'",
  },
];

/* Function to check if the assistant's response is on-topic */
function isResponseOnTopic(response) {
  const allowedTopics = [
    "skincare",
    "beauty routines",
    "haircare",
    "makeup",
    "fragrance",
    "ingredients",
  ];

  // Check if the response contains any of the allowed topics
  return allowedTopics.some((topic) => response.toLowerCase().includes(topic));
}

/* Generate Routine Button */
async function generateRoutine() {
  if (selectedProducts.length === 0) {
    chatWindow.innerHTML +=
      "<p>Please select some products to generate a routine.</p>";
    return;
  }

  const apiUrl = "https://autumn-math-a526.maddi-ceriani.workers.dev/";

  const messages = [
    {
      role: "system",
      content:
        "You are a skincare and beauty expert. Create a personalized routine based on the provided products. Do not include unrelated topics.",
    },
    {
      role: "user",
      content: JSON.stringify(selectedProducts),
    },
  ];

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json", // NO Authorization header!
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: messages,
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      throw new Error(`Worker error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.reply) {
      throw new Error("Invalid response from Worker.");
    }

    let routine = data.reply;

    // Check if the response is on-topic
    if (!isResponseOnTopic(routine)) {
      routine =
        "I'm here to help with skincare, beauty routines, haircare, makeup, and fragrance questions. Try asking me something in those areas!";
    }

    chatWindow.innerHTML += `<div class=\"bubble ai\"><strong>Routine:</strong> ${routine}</div>`;
    chatWindow.scrollTop = chatWindow.scrollHeight;
  } catch (error) {
    console.error("Error generating routine:", error);
    chatWindow.innerHTML += `<p>There was an error generating your routine: ${error.message}</p>`;
  }
}

/* Chat Question Handler */
async function handleUserQuestion(question) {
  chatHistory.push({ role: "user", content: question });

  const apiUrl = "https://autumn-math-a526.maddi-ceriani.workers.dev/";

  // Add user message to chat window
  chatWindow.innerHTML += `
    <div class=\"bubble user\">${question}</div>
  `;

  // Add loading message to chat window
  const loadingMessage = document.createElement("div");
  loadingMessage.className = "bubble ai";
  loadingMessage.textContent = "Generating response...";
  chatWindow.appendChild(loadingMessage);
  chatWindow.scrollTop = chatWindow.scrollHeight;

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: chatHistory,
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      throw new Error(`Worker error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.reply) {
      throw new Error("Invalid response from Worker.");
    }

    let reply = data.reply;

    // Check if the response is on-topic
    if (!isResponseOnTopic(reply)) {
      reply =
        "I'm here to help with skincare, beauty routines, haircare, makeup, and fragrance questions. Try asking me something in those areas!";
    }

    chatHistory.push({ role: "assistant", content: reply });

    // Remove loading message
    loadingMessage.remove();

    // Add AI response to chat window
    chatWindow.innerHTML += `
      <div class=\"bubble ai\">${reply}</div>
    `;

    chatWindow.scrollTop = chatWindow.scrollHeight;
  } catch (error) {
    console.error("Error handling user question:", error);
    loadingMessage.textContent = `There was an error processing your question: ${error.message}`;
  }
}

/* Selected products array */
const selectedProducts = [];

/* Save selected products to localStorage */
function saveSelectedProducts() {
  localStorage.setItem("selectedProducts", JSON.stringify(selectedProducts));
}

/* Load selected products from localStorage */
function loadSelectedProducts() {
  const savedProducts = localStorage.getItem("selectedProducts");
  if (savedProducts) {
    const parsedProducts = JSON.parse(savedProducts);
    parsedProducts.forEach((product) => {
      selectedProducts.push(product);
      const cardElement = Array.from(
        document.querySelectorAll(".product-card")
      ).find((card) => card.querySelector("h3").textContent === product.name);
      if (cardElement) {
        cardElement.classList.add("highlight");
      }
    });
    updateSelectedProductsList();
  }
}

/* Show or hide Clear All button based on selections */
function toggleClearAllButton() {
  if (selectedProducts.length > 0) {
    clearAllButton.style.display = "block";
  } else {
    clearAllButton.style.display = "none";
  }
}

/* Update product selection logic to toggle Clear All button */
function toggleProductSelection(product, cardElement) {
  const productIndex = selectedProducts.findIndex(
    (item) => item.name === product.name
  );

  if (productIndex === -1) {
    // Add full product object to selectedProducts
    selectedProducts.push(product);
    cardElement.classList.add("highlight");
  } else {
    // Remove product from selectedProducts
    selectedProducts.splice(productIndex, 1);
    cardElement.classList.remove("highlight");
  }

  updateSelectedProductsList();
  saveSelectedProducts();
  toggleClearAllButton();
}

/* Clear all functionality */
function clearAllSelections() {
  selectedProducts.length = 0; // Clear the array
  saveSelectedProducts();
  updateSelectedProductsList();

  // Remove highlights from all product cards
  const productCards = document.querySelectorAll(".product-card");
  productCards.forEach((card) => card.classList.remove("highlight"));

  toggleClearAllButton();
}

/* Update the Selected Products section to use X icon for remove button */
function updateSelectedProductsList() {
  const selectedProductsList = document.getElementById("selectedProductsList");
  selectedProductsList.innerHTML = selectedProducts
    .map(
      (product) => `
      <div class="selected-product-item">
        <span>${product.name}</span>
        <button class="remove-btn" data-name="${product.name}">✕</button>
      </div>
    `
    )
    .join("");

  // Add event listeners to remove buttons
  const removeButtons = document.querySelectorAll(".remove-btn");
  removeButtons.forEach((button) => {
    button.addEventListener("click", (e) => {
      const productName = e.target.dataset.name;
      removeProductByName(productName);
    });
  });
}

/* Function to remove a product by name */
function removeProductByName(productName) {
  const productIndex = selectedProducts.findIndex(
    (item) => item.name === productName
  );

  if (productIndex !== -1) {
    selectedProducts.splice(productIndex, 1);
    updateSelectedProductsList();

    // Remove highlight from product card
    const productCards = document.querySelectorAll(".product-card");
    productCards.forEach((card) => {
      if (card.querySelector("h3").textContent === productName) {
        card.classList.remove("highlight");
      }
    });
  }

  toggleClearAllButton();
}

/* Add event listener to Generate Routine button */
const generateRoutineButton = document.getElementById("generateRoutine");
generateRoutineButton.addEventListener("click", generateRoutine);

/* Chat form submission handler */
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const userInput = document.getElementById("userInput").value.trim();
  if (userInput) {
    handleUserQuestion(userInput);
    document.getElementById("userInput").value = ""; // Clear input field
  }
});

/* Add Clear All button functionality */
const clearAllButton = document.createElement("button");
clearAllButton.textContent = "Clear All Selections";
clearAllButton.classList.add("clear-all-btn");
clearAllButton.style.display = "none"; // Initially hidden
clearAllButton.addEventListener("click", clearAllSelections);

document.querySelector(".selected-products").appendChild(clearAllButton);

/* Add a label for the category filter */
const categoryFilterLabel = document.createElement("label");
categoryFilterLabel.setAttribute("for", "categoryFilter");
categoryFilterLabel.textContent = "Choose a Category:";
categoryFilterLabel.classList.add("visually-hidden"); // Keeps it accessible but hidden visually

const searchSection = document.querySelector(".search-section");
searchSection.insertBefore(categoryFilterLabel, searchSection.firstChild);

/* Load saved products on page load */
window.addEventListener("load", () => {
  loadSelectedProducts();
  toggleClearAllButton();
});

/* Add aria-labels and improve accessibility */
const generateRoutineBtn = document.getElementById("generateRoutine");
generateRoutineBtn.setAttribute(
  "aria-label",
  "Generate a personalized routine based on selected products"
);

const viewDetailsBtns = document.querySelectorAll(".view-details-btn");
viewDetailsBtns.forEach((button) => {
  button.setAttribute("aria-label", `View details for ${button.dataset.name}`);
});

const clearAllBtn = document.querySelector(".clear-all-btn");
clearAllBtn.setAttribute("aria-label", "Clear all selected products");

/* Add event listener for product search */
const productSearch = document.getElementById("productSearch");

productSearch.addEventListener("input", async (e) => {
  const searchTerm = e.target.value.toLowerCase();
  const products = await loadProducts();
  const selectedCategory = categoryFilter.value;

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm) ||
      product.brand.toLowerCase().includes(searchTerm) ||
      product.description.toLowerCase().includes(searchTerm);

    const matchesCategory =
      !selectedCategory || product.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  displayProducts(filteredProducts);
});

/* Add event listener for RTL toggle */
const rtlSwitch = document.getElementById("rtlSwitch");

rtlSwitch.addEventListener("change", (event) => {
  if (event.target.checked) {
    document.body.setAttribute("dir", "rtl");
  } else {
    document.body.removeAttribute("dir");
  }
});
