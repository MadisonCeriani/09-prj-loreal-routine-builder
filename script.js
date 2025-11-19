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

/* Load product data from JSON file */
async function loadProducts() {
  const response = await fetch("products.json");
  const data = await response.json();
  return data.products;
}

/* Enable product selection */

// Track selected products
let selectedProducts = [];

// Function to update the "Selected Products" section
function updateSelectedProducts() {
  const selectedProductsContainer = document.getElementById("selectedProducts");
  selectedProductsContainer.innerHTML = selectedProducts
    .map(
      (product) => `
        <div class="selected-product">
          <span>${product.name}</span>
          <button class="remove-product" data-name="${product.name}">Remove</button>
        </div>
      `
    )
    .join("");

  // Add event listeners to remove buttons
  selectedProductsContainer
    .querySelectorAll(".remove-product")
    .forEach((button) => {
      button.addEventListener("click", (e) => {
        const productName = e.target.getAttribute("data-name");
        selectedProducts = selectedProducts.filter(
          (p) => p.name !== productName
        );
        updateSelectedProducts();
        updateProductCards();
      });
    });
}

// Function to update product card styles based on selection
function updateProductCards() {
  document.querySelectorAll(".product-card").forEach((card) => {
    const productName = card.querySelector("h3").textContent;
    if (selectedProducts.some((p) => p.name === productName)) {
      card.classList.add("selected");
    } else {
      card.classList.remove("selected");
    }
  });
}

// Create HTML for displaying product cards
function displayProducts(products) {
  productsContainer.innerHTML = products
    .map(
      (product) => `
        <div class="product-card">
          <img src="${product.image}" alt="${product.name}">
          <div class="product-info">
            <h3>${product.name}</h3>
            <p>${product.brand}</p>
            <button class="toggle-description">Show Description</button>
            <div class="product-description hidden">${product.description}</div>
          </div>
        </div>
      `
    )
    .join("");

  // Add click event listeners to product cards
  document.querySelectorAll(".product-card").forEach((card) => {
    card.addEventListener("click", () => {
      const productName = card.querySelector("h3").textContent;
      const product = products.find((p) => p.name === productName);

      if (selectedProducts.some((p) => p.name === productName)) {
        selectedProducts = selectedProducts.filter(
          (p) => p.name !== productName
        );
      } else {
        selectedProducts.push(product);
      }

      updateSelectedProducts();
      updateProductCards();
    });
  });

  // Add event listeners to toggle description visibility
  document.querySelectorAll(".toggle-description").forEach((button) => {
    button.addEventListener("click", (e) => {
      const descriptionDiv = e.target.nextElementSibling;
      if (descriptionDiv.classList.contains("hidden")) {
        descriptionDiv.classList.remove("hidden");
        e.target.textContent = "Hide Description";
      } else {
        descriptionDiv.classList.add("hidden");
        e.target.textContent = "Show Description";
      }
    });
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

/* Chat form submission handler - placeholder for OpenAI integration */
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();

  chatWindow.innerHTML = "Connect to the OpenAI API for a response!";
});

/* Initial setup for "Selected Products" section */
document.body.insertAdjacentHTML(
  "beforeend",
  `<div id="selectedProducts" class="selected-products-section"></div>`
);
