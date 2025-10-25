// ===== TinyStepsBD Cart Management =====

class CartManager {
    constructor() {
        this.cart = [];
        this.storageKey = 'tinystepsbd_cart';
        this.init();
    }

    /**
     * Initialize cart manager
     */
    init() {
        this.loadCart();
        this.bindEvents();
        this.updateCartDisplay();
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Update cart when products are loaded
        window.addEventListener('productsLoaded', () => {
            this.validateCartItems();
        });

        // Listen for storage changes (other tabs)
        window.addEventListener('storage', (e) => {
            if (e.key === this.storageKey) {
                this.loadCart();
                this.updateCartDisplay();
            }
        });
    }

    /**
     * Load cart from localStorage
     */
    loadCart() {
        try {
            const savedCart = localStorage.getItem(this.storageKey);
            if (savedCart) {
                this.cart = JSON.parse(savedCart);
            }
        } catch (error) {
            console.error('Error loading cart:', error);
            this.cart = [];
        }
    }

    /**
     * Save cart to localStorage
     */
    saveCart() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.cart));
        } catch (error) {
            console.error('Error saving cart:', error);
        }
    }

    /**
     * Add item to cart
     * @param {Object} item - Item to add
     */
    addToCart(item) {
        if (!item || !item.id) {
            console.error('Invalid item:', item);
            return;
        }

        const existingItem = this.cart.find(cartItem => 
            cartItem.id === item.id && 
            cartItem.color === item.color && 
            cartItem.size === item.size
        );

        if (existingItem) {
            existingItem.quantity += item.quantity || 1;
        } else {
            this.cart.push({
                id: item.id,
                name: item.name,
                price: item.price,
                image: item.image,
                quantity: item.quantity || 1,
                color: item.color || null,
                size: item.size || null,
                addedAt: new Date().toISOString()
            });
        }

        this.saveCart();
        this.updateCartDisplay();
        this.dispatchCartUpdate();
    }

    /**
     * Remove item from cart
     * @param {number} index - Item index in cart
     */
    removeFromCart(index) {
        if (index >= 0 && index < this.cart.length) {
            this.cart.splice(index, 1);
            this.saveCart();
            this.updateCartDisplay();
            this.dispatchCartUpdate();
        }
    }

    /**
     * Update item quantity
     * @param {number} index - Item index
     * @param {number} quantity - New quantity
     */
    updateQuantity(index, quantity) {
        if (index >= 0 && index < this.cart.length && quantity > 0) {
            this.cart[index].quantity = quantity;
            this.saveCart();
            this.updateCartDisplay();
            this.dispatchCartUpdate();
        }
    }

    /**
     * Clear entire cart
     */
    clearCart() {
        this.cart = [];
        this.saveCart();
        this.updateCartDisplay();
        this.dispatchCartUpdate();
    }

    /**
     * Get cart item count
     * @returns {number} Total item count
     */
    getItemCount() {
        return this.cart.reduce((total, item) => total + item.quantity, 0);
    }

    /**
     * Get cart subtotal
     * @returns {number} Subtotal amount
     */
    getSubtotal() {
        return this.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    }

    /**
     * Get cart total with delivery fee
     * @param {number} deliveryFee - Delivery fee
     * @returns {number} Total amount
     */
    getTotal(deliveryFee = 0) {
        return this.getSubtotal() + deliveryFee;
    }

    /**
     * Update cart display in UI
     */
    updateCartDisplay() {
        this.updateCartIcon();
        this.updateCartPage();
        this.updateCartPreview();
    }

    /**
     * Update cart icon badge
     */
    updateCartIcon() {
        const cartCountElements = document.querySelectorAll('.cart-count');
        const itemCount = this.getItemCount();

        cartCountElements.forEach(element => {
            element.textContent = itemCount;
            element.style.display = itemCount > 0 ? 'flex' : 'none';
        });
    }

    /**
     * Update cart page if open
     */
    updateCartPage() {
        if (!document.getElementById('cart-items')) return;

        const cartItems = document.getElementById('cart-items');
        const subtotalElement = document.getElementById('cart-subtotal');
        const totalElement = document.getElementById('cart-total');
        const deliveryFee = calculateDeliveryFee(''); // Default fee

        if (this.cart.length === 0) {
            cartItems.innerHTML = `
                <div class="empty-cart">
                    <i class="fas fa-shopping-cart"></i>
                    <h3>আপনার কার্ট খালি</h3>
                    <p>কিছু প্রোডাক্ট কার্টে যোগ করুন</p>
                    <a href="shop.html" class="btn-primary">প্রোডাক্ট ব্রাউজ করুন</a>
                </div>
            `;
            
            if (subtotalElement) subtotalElement.textContent = formatPrice(0);
            if (totalElement) totalElement.textContent = formatPrice(0);
            
            return;
        }

        // Render cart items
        cartItems.innerHTML = this.cart.map((item, index) => `
            <div class="cart-item" data-item-index="${index}">
                <div class="item-image">
                    <img src="${item.image}" alt="${item.name}" 
                         onerror="this.src='assets/images/placeholder.jpg'">
                </div>
                <div class="item-details">
                    <h4 class="item-name">${item.name}</h4>
                    ${item.color ? `<div class="item-variant">রং: ${item.color}</div>` : ''}
                    ${item.size ? `<div class="item-variant">সাইজ: ${item.size}</div>` : ''}
                    <div class="item-price">${formatPrice(item.price)}</div>
                </div>
                <div class="item-controls">
                    <div class="quantity-controls">
                        <button type="button" class="quantity-btn quantity-minus" 
                                onclick="cartManager.decreaseQuantity(${index})">-</button>
                        <input type="number" class="quantity-input" value="${item.quantity}" 
                               min="1" max="10" readonly>
                        <button type="button" class="quantity-btn quantity-plus" 
                                onclick="cartManager.increaseQuantity(${index})">+</button>
                    </div>
                    <button type="button" class="remove-btn" 
                            onclick="cartManager.removeItem(${index})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <div class="item-total">
                    ${formatPrice(item.price * item.quantity)}
                </div>
            </div>
        `).join('');

        // Update totals
        if (subtotalElement) {
            subtotalElement.textContent = formatPrice(this.getSubtotal());
        }
        
        if (totalElement) {
            totalElement.textContent = formatPrice(this.getTotal(deliveryFee));
        }
    }

    /**
     * Update cart preview dropdown
     */
    updateCartPreview() {
        const previewItems = document.querySelector('.cart-preview-items');
        const previewTotal = document.querySelector('.cart-preview .total-amount');
        
        if (!previewItems) return;

        if (this.cart.length === 0) {
            previewItems.innerHTML = `
                <div class="empty-cart-message">
                    আপনার কার্টে কোনো প্রোডাক্ট নেই
                </div>
            `;
        } else {
            previewItems.innerHTML = this.cart.slice(0, 3).map(item => `
                <div class="preview-item">
                    <img src="${item.image}" alt="${item.name}" 
                         onerror="this.src='assets/images/placeholder.jpg'">
                    <div class="preview-item-details">
                        <div class="preview-item-name">${item.name}</div>
                        <div class="preview-item-price">
                            ${formatPrice(item.price)} × ${item.quantity}
                        </div>
                    </div>
                </div>
            `).join('');

            // Show "and X more" if there are more items
            if (this.cart.length > 3) {
                previewItems.innerHTML += `
                    <div class="preview-more-items">
                        এবং ${this.cart.length - 3} টি আরও প্রোডাক্ট
                    </div>
                `;
            }
        }

        if (previewTotal) {
            previewTotal.textContent = formatPrice(this.getSubtotal());
        }
    }

    /**
     * Dispatch cart update event
     */
    dispatchCartUpdate() {
        window.dispatchEvent(new CustomEvent('cartUpdated', {
            detail: { cart: this.cart }
        }));
    }

    /**
     * Validate cart items against current products
     */
    validateCartItems() {
        if (!dataManager.isProductsLoaded()) return;

        let hasChanges = false;
        const validCart = [];

        this.cart.forEach(item => {
            const product = dataManager.getProductById(item.id);
            if (product) {
                // Update item with current product data
                validCart.push({
                    ...item,
                    name: product.name,
                    price: product.price,
                    image: product.mainImage
                });
            } else {
                hasChanges = true;
            }
        });

        if (hasChanges) {
            this.cart = validCart;
            this.saveCart();
            this.updateCartDisplay();
            
            if (validCart.length !== this.cart.length) {
                showNotification('কিছু প্রোডাক্ট আপনার কার্ট থেকে সরানো হয়েছে।', 'warning');
            }
        }
    }

    /**
     * Decrease item quantity
     * @param {number} index - Item index
     */
    decreaseQuantity(index) {
        const item = this.cart[index];
        if (item.quantity > 1) {
            this.updateQuantity(index, item.quantity - 1);
        } else {
            this.removeFromCart(index);
        }
    }

    /**
     * Increase item quantity
     * @param {number} index - Item index
     */
    increaseQuantity(index) {
        const item = this.cart[index];
        if (item.quantity < 10) {
            this.updateQuantity(index, item.quantity + 1);
        } else {
            showNotification('সর্বোচ্চ ১০ টি প্রোডাক্ট অর্ডার করা যাবে।', 'warning');
        }
    }

    /**
     * Remove item from cart (public alias for removeFromCart)
     * @param {number} index - Item index
     */
    removeItem(index) {
        this.removeFromCart(index);
    }

    /**
     * Get cart data for checkout
     * @returns {Object} Checkout data
     */
    getCheckoutData() {
        return {
            items: this.cart,
            subtotal: this.getSubtotal(),
            itemCount: this.getItemCount(),
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Check if cart is empty
     * @returns {boolean} True if cart is empty
     */
    isEmpty() {
        return this.cart.length === 0;
    }

    /**
     * Get cart summary for order
     * @returns {Array} Order items
     */
    getOrderItems() {
        return this.cart.map(item => ({
            product_id: item.id,
            product_name: item.name,
            quantity: item.quantity,
            price: item.price,
            color: item.color,
            size: item.size,
            main_image: item.image
        }));
    }
}

// Create global cart manager instance
const cartManager = new CartManager();

// Global functions for HTML onclick attributes
function addToCart(item) {
    cartManager.addToCart(item);
}

function removeFromCart(index) {
    cartManager.removeFromCart(index);
}

function updateQuantity(index, quantity) {
    cartManager.updateQuantity(index, quantity);
}

function clearCart() {
    cartManager.clearCart();
}