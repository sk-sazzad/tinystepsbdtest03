// ===== TinyStepsBD Product Management =====

class ProductManager {
    constructor() {
        this.currentProduct = null;
        this.selectedColor = null;
        this.selectedSize = null;
        this.quantity = 1;
        this.init();
    }

    /**
     * Initialize product manager
     */
    init() {
        this.bindEvents();
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Product page events
        document.addEventListener('DOMContentLoaded', () => {
            if (this.isProductPage()) {
                this.loadProductPage();
            }
            
            if (this.isShopPage()) {
                this.loadShopPage();
            }
        });

        // Color selection
        document.addEventListener('click', (e) => {
            if (e.target.closest('.color-option')) {
                this.handleColorSelect(e.target.closest('.color-option'));
            }
        });

        // Size selection
        document.addEventListener('click', (e) => {
            if (e.target.closest('.size-option')) {
                this.handleSizeSelect(e.target.closest('.size-option'));
            }
        });

        // Quantity changes
        document.addEventListener('click', (e) => {
            if (e.target.closest('.quantity-minus')) {
                this.decreaseQuantity();
            } else if (e.target.closest('.quantity-plus')) {
                this.increaseQuantity();
            }
        });

        // Add to cart from product page
        document.addEventListener('click', (e) => {
            if (e.target.closest('.add-to-cart-btn') && this.isProductPage()) {
                this.addToCartFromProductPage();
            }
        });
    }

    /**
     * Check if current page is product detail page
     * @returns {boolean} True if product page
     */
    isProductPage() {
        return window.location.pathname.includes('product.html');
    }

    /**
     * Check if current page is shop page
     * @returns {boolean} True if shop page
     */
    isShopPage() {
        return window.location.pathname.includes('shop.html');
    }

    /**
     * Load product detail page
     */
    async loadProductPage() {
        const productId = getUrlParam('id');
        
        if (!productId) {
            showNotification('প্রোডাক্ট খুঁজে পাওয়া যাচ্ছে না।', 'error');
            window.location.href = 'shop.html';
            return;
        }

        showLoading('product-container');
        
        try {
            const product = await dataManager.fetchProductById(productId);
            
            if (!product) {
                throw new Error('Product not found');
            }

            this.currentProduct = product;
            this.renderProductPage(product);
            
        } catch (error) {
            console.error('Error loading product:', error);
            showNotification('প্রোডাক্ট লোড করতে সমস্যা হচ্ছে।', 'error');
        } finally {
            hideLoading('product-container');
        }
    }

    /**
     * Render product detail page
     * @param {Object} product - Product data
     */
    renderProductPage(product) {
        const container = document.getElementById('product-container');
        if (!container) return;

        container.innerHTML = this.generateProductHTML(product);
        this.initImageGallery();
        this.initZoom();
    }

    /**
     * Generate product page HTML
     * @param {Object} product - Product data
     * @returns {string} HTML string
     */
    generateProductHTML(product) {
        const ageRange = getAgeRange(product.size);
        
        return `
            <div class="product-detail">
                <div class="product-gallery">
                    <div class="main-image">
                        <img src="${product.mainImage}" alt="${product.name}" 
                             onerror="this.src='assets/images/placeholder.jpg'">
                    </div>
                    <div class="image-thumbnails">
                        ${product.images.map((img, index) => `
                            <div class="thumbnail ${index === 0 ? 'active' : ''}">
                                <img src="${img}" alt="${product.name} - Image ${index + 1}"
                                     onerror="this.src='assets/images/placeholder.jpg'">
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="product-info">
                    <div class="product-header">
                        <h1 class="product-title">${product.name}</h1>
                        <div class="product-price">${formatPrice(product.price)}</div>
                    </div>
                    
                    <div class="product-meta">
                        <div class="product-category">
                            <strong>ক্যাটাগরি:</strong>
                            <span>${product.category || 'N/A'}</span>
                        </div>
                        <div class="product-age">
                            <strong>বয়স রেঞ্জ:</strong>
                            <span>${ageRange}</span>
                        </div>
                        <div class="product-colors">
                            <strong>রং:</strong>
                            <span>${product.color || 'N/A'}</span>
                        </div>
                    </div>
                    
                    <div class="product-description">
                        <h3>প্রোডাক্ট বিবরণ</h3>
                        <p>${formatDescription(product.description)}</p>
                    </div>
                    
                    <div class="product-actions">
                        <div class="quantity-selector">
                            <label for="quantity">পরিমাণ:</label>
                            <div class="quantity-controls">
                                <button type="button" class="quantity-minus">-</button>
                                <input type="number" id="quantity" name="quantity" value="1" min="1" max="10">
                                <button type="button" class="quantity-plus">+</button>
                            </div>
                        </div>
                        
                        <button class="add-to-cart-btn btn-primary">
                            <i class="fas fa-shopping-cart"></i>
                            কার্টে যোগ করুন
                        </button>
                        
                        <button class="buy-now-btn btn-secondary">
                            <i class="fas fa-bolt"></i>
                            এখনই কিনুন
                        </button>
                    </div>
                    
                    <div class="product-features">
                        <div class="feature">
                            <i class="fas fa-shipping-fast"></i>
                            <span>দ্রুত ডেলিভারি</span>
                        </div>
                        <div class="feature">
                            <i class="fas fa-undo"></i>
                            <span>৭ দিন রিটার্ন</span>
                        </div>
                        <div class="feature">
                            <i class="fas fa-shield-alt"></i>
                            <span>অরিজিনাল প্রোডাক্ট</span>
                        </div>
                        <div class="feature">
                            <i class="fas fa-headset"></i>
                            <span>২৪/৭ সাপোর্ট</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Initialize image gallery
     */
    initImageGallery() {
        const thumbnails = document.querySelectorAll('.thumbnail');
        const mainImage = document.querySelector('.main-image img');

        thumbnails.forEach(thumb => {
            thumb.addEventListener('click', () => {
                // Remove active class from all thumbnails
                thumbnails.forEach(t => t.classList.remove('active'));
                // Add active class to clicked thumbnail
                thumb.classList.add('active');
                // Update main image
                const imgSrc = thumb.querySelector('img').src;
                mainImage.src = imgSrc;
            });
        });
    }

    /**
     * Initialize image zoom
     */
    initZoom() {
        const mainImage = document.querySelector('.main-image img');
        if (!mainImage) return;

        mainImage.addEventListener('mousemove', (e) => {
            if (!window.matchMedia('(hover: hover)').matches) return;

            const { left, top, width, height } = mainImage.getBoundingClientRect();
            const x = ((e.clientX - left) / width) * 100;
            const y = ((e.clientY - top) / height) * 100;

            mainImage.style.transformOrigin = `${x}% ${y}%`;
            mainImage.style.transform = 'scale(1.5)';
        });

        mainImage.addEventListener('mouseleave', () => {
            mainImage.style.transform = 'scale(1)';
        });
    }

    /**
     * Load shop page products
     */
    async loadShopPage() {
        showLoading('products-grid');
        
        try {
            await dataManager.fetchAllProducts();
            this.renderShopPage();
            
        } catch (error) {
            console.error('Error loading shop page:', error);
            showNotification('প্রোডাক্ট লোড করতে সমস্যা হচ্ছে।', 'error');
        } finally {
            hideLoading('products-grid');
        }
    }

    /**
     * Render shop page with products
     */
    renderShopPage() {
        const grid = document.getElementById('products-grid');
        if (!grid) return;

        const category = getUrlParam('category');
        const searchQuery = getUrlParam('search');
        
        let products = dataManager.products;
        
        if (category) {
            products = dataManager.getProductsByCategory(category);
        }
        
        if (searchQuery) {
            products = dataManager.searchProducts(searchQuery);
        }

        if (products.length === 0) {
            grid.innerHTML = `
                <div class="no-products">
                    <i class="fas fa-search"></i>
                    <h3>কোনো প্রোডাক্ট পাওয়া যায়নি</h3>
                    <p>অনুগ্রহ করে অন্য ক্যাটাগরি বা সার্চ ট্রাই করুন</p>
                    <a href="shop.html" class="btn-primary">সকল প্রোডাক্ট দেখুন</a>
                </div>
            `;
            return;
        }

        grid.innerHTML = products.map(product => this.generateProductCard(product)).join('');
        initLazyLoading();
    }

    /**
     * Generate product card HTML
     * @param {Object} product - Product data
     * @returns {string} HTML string
     */
    generateProductCard(product) {
        const ageRange = getAgeRange(product.size);
        
        return `
            <div class="product-card stagger-item" data-product-id="${product.id}">
                <div class="product-image-container">
                    <a href="product.html?id=${product.id}" class="product-image-link">
                        <img 
                            src="${product.mainImage}" 
                            alt="${product.name}" 
                            class="product-image"
                            loading="lazy"
                            onerror="this.src='assets/images/placeholder.jpg'"
                        >
                    </a>
                    
                    <div class="product-badges">
                        ${product.badge ? `<span class="badge ${product.badge}-badge">${this.getBadgeText(product.badge)}</span>` : ''}
                    </div>

                    <div class="product-actions">
                        <button class="action-btn wishlist-btn" aria-label="Add to Wishlist">
                            <i class="far fa-heart"></i>
                        </button>
                        <button class="action-btn quick-view-btn" aria-label="Quick View" 
                                onclick="productManager.quickView('${product.id}')">
                            <i class="far fa-eye"></i>
                        </button>
                    </div>

                    <button class="add-to-cart-btn" onclick="productManager.addToCart('${product.id}')">
                        <i class="fas fa-shopping-cart"></i>
                        কার্টে যোগ করুন
                    </button>
                </div>

                <div class="product-info">
                    <div class="product-category">
                        <span class="category-badge">${product.category}</span>
                    </div>

                    <h3 class="product-name">
                        <a href="product.html?id=${product.id}" class="product-name-link">${product.name}</a>
                    </h3>

                    <p class="product-short-description">${this.getShortDescription(product.description)}</p>

                    <div class="product-variants">
                        <div class="size-variant">
                            <span class="variant-label">বয়স:</span>
                            <span class="size-range">${ageRange}</span>
                        </div>
                        <div class="color-variant">
                            <span class="variant-label">রং:</span>
                            <span class="color-names">${product.color}</span>
                        </div>
                    </div>

                    <div class="product-pricing">
                        <div class="current-price">${formatPrice(product.price)}</div>
                    </div>

                    <div class="product-rating">
                        <div class="stars">
                            <i class="fas fa-star"></i>
                            <i class="fas fa-star"></i>
                            <i class="fas fa-star"></i>
                            <i class="fas fa-star"></i>
                            <i class="fas fa-star-half-alt"></i>
                        </div>
                        <span class="rating-count">(${Math.floor(Math.random() * 50)} Reviews)</span>
                    </div>

                    <div class="stock-status">
                        <span class="in-stock">
                            <i class="fas fa-check-circle"></i>
                            স্টক আছে
                        </span>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Get badge text
     * @param {string} badge - Badge type
     * @returns {string} Badge text
     */
    getBadgeText(badge) {
        const badgeTexts = {
            'new': 'নতুন',
            'bestseller': 'বেস্টসেলার',
            'discount': 'অফার'
        };
        return badgeTexts[badge] || badge;
    }

    /**
     * Get short description
     * @param {string} description - Full description
     * @returns {string} Short description
     */
    getShortDescription(description) {
        if (!description) return '';
        return description.length > 100 ? 
            description.substring(0, 100) + '...' : 
            description;
    }

    /**
     * Handle color selection
     * @param {Element} colorOption - Selected color element
     */
    handleColorSelect(colorOption) {
        document.querySelectorAll('.color-option').forEach(option => {
            option.classList.remove('selected');
        });
        
        colorOption.classList.add('selected');
        this.selectedColor = colorOption.dataset.color;
    }

    /**
     * Handle size selection
     * @param {Element} sizeOption - Selected size element
     */
    handleSizeSelect(sizeOption) {
        document.querySelectorAll('.size-option').forEach(option => {
            option.classList.remove('selected');
        });
        
        sizeOption.classList.add('selected');
        this.selectedSize = sizeOption.dataset.size;
    }

    /**
     * Decrease quantity
     */
    decreaseQuantity() {
        const quantityInput = document.getElementById('quantity');
        if (quantityInput) {
            const currentValue = parseInt(quantityInput.value);
            if (currentValue > 1) {
                quantityInput.value = currentValue - 1;
                this.quantity = currentValue - 1;
            }
        }
    }

    /**
     * Increase quantity
     */
    increaseQuantity() {
        const quantityInput = document.getElementById('quantity');
        if (quantityInput) {
            const currentValue = parseInt(quantityInput.value);
            if (currentValue < 10) {
                quantityInput.value = currentValue + 1;
                this.quantity = currentValue + 1;
            }
        }
    }

    /**
     * Add to cart from product page
     */
    addToCartFromProductPage() {
        if (!this.currentProduct) return;

        const quantity = parseInt(document.getElementById('quantity')?.value) || 1;
        
        const cartItem = {
            id: this.currentProduct.id,
            name: this.currentProduct.name,
            price: this.currentProduct.price,
            image: this.currentProduct.mainImage,
            quantity: quantity,
            color: this.selectedColor,
            size: this.selectedSize
        };

        // You'll need to implement addToCart function in cart.js
        if (typeof addToCart === 'function') {
            addToCart(cartItem);
            showNotification('প্রোডাক্ট কার্টে যোগ করা হয়েছে!', 'success');
        } else {
            console.warn('addToCart function not available');
        }
    }

    /**
     * Add to cart from product card
     * @param {string} productId - Product ID
     */
    addToCart(productId) {
        const product = dataManager.getProductById(productId);
        if (!product) return;

        const cartItem = {
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.mainImage,
            quantity: 1
        };

        if (typeof addToCart === 'function') {
            addToCart(cartItem);
            showNotification('প্রোডাক্ট কার্টে যোগ করা হয়েছে!', 'success');
        } else {
            console.warn('addToCart function not available');
        }
    }

    /**
     * Quick view product
     * @param {string} productId - Product ID
     */
    async quickView(productId) {
        // Implement quick view modal
        console.log('Quick view for product:', productId);
        // You can implement a modal here to show product details quickly
    }
}

// Create global product manager instance
const productManager = new ProductManager();