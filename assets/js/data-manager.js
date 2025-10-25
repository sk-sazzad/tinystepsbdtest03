// ===== TinyStepsBD Data Manager =====

class DataManager {
    constructor() {
        this.API_BASE_URL = 'https://script.google.com/macros/s/AKfycbyW3ZHdsQI2ohP6Fk3CAHhsYp4n_YY3BC9cJDedRqSqMMeL4a4BswE-DHbDuYChJlwM/exec';
        this.products = [];
        this.categories = new Set();
        this.isLoading = false;
        this.cacheDuration = 5 * 60 * 1000; // 5 minutes
        this.init();
    }

    /**
     * Initialize data manager
     */
    init() {
        this.loadCachedData();
        this.setupErrorHandling();
    }

    /**
     * Setup global error handling
     */
    setupErrorHandling() {
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            showNotification('দুঃখিত, কোনো সমস্যা হয়েছে। আবার চেষ্টা করুন।', 'error');
        });

        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            showNotification('দুঃখিত, কোনো সমস্যা হয়েছে। আবার চেষ্টা করুন।', 'error');
        });
    }

    /**
     * Load cached data from localStorage
     */
    loadCachedData() {
        try {
            const cached = localStorage.getItem('tinystepsbd_products_cache');
            if (cached) {
                const { data, timestamp } = JSON.parse(cached);
                if (Date.now() - timestamp < this.cacheDuration) {
                    this.products = data;
                    this.extractCategories();
                    this.dispatchDataLoadedEvent();
                }
            }
        } catch (error) {
            console.warn('Failed to load cached data:', error);
        }
    }

    /**
     * Save data to cache
     */
    saveToCache() {
        try {
            const cacheData = {
                data: this.products,
                timestamp: Date.now()
            };
            localStorage.setItem('tinystepsbd_products_cache', JSON.stringify(cacheData));
        } catch (error) {
            console.warn('Failed to save cache:', error);
        }
    }

    /**
     * Extract categories from products
     */
    extractCategories() {
        this.categories.clear();
        this.products.forEach(product => {
            if (product.Category) {
                this.categories.add(product.Category);
            }
        });
    }

    /**
     * Dispatch data loaded event
     */
    dispatchDataLoadedEvent() {
        window.dispatchEvent(new CustomEvent('productsLoaded', {
            detail: { products: this.products }
        }));
    }

    /**
     * Fetch all products from API
     * @returns {Promise<Array>} Array of products
     */
    async fetchAllProducts() {
        if (this.isLoading) {
            return this.products;
        }

        this.isLoading = true;
        
        try {
            const response = await fetch(`${this.API_BASE_URL}?action=products&t=${Date.now()}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || 'Failed to fetch products');
            }

            this.products = this.processProducts(result.data);
            this.extractCategories();
            this.saveToCache();
            this.dispatchDataLoadedEvent();
            
            return this.products;

        } catch (error) {
            console.error('Error fetching products:', error);
            showNotification('প্রোডাক্ট লোড করতে সমস্যা হচ্ছে। ইন্টারনেট কানেকশন চেক করুন।', 'error');
            return this.products; // Return cached products if available
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Process products data from API
     * @param {Array} products - Raw products data
     * @returns {Array} Processed products
     */
    processProducts(products) {
        return products.map(product => ({
            id: product['Product ID'],
            name: product['Name'],
            description: product['Description'],
            price: parseInt(product['Price (BDT)']) || 0,
            category: product['Category'],
            size: product['Size'],
            color: product['Color'],
            driveLink: product['Drive Link'],
            imageFolder: product['Image Folder'],
            mainImage: product['Main Image'],
            images: [
                product['Main Image'],
                product['Image1'],
                product['Image2'],
                product['Image3'],
                product['Image4'],
                product['Image5'],
                product['Image6']
            ].filter(img => img && img.trim() !== ''),
            inStock: true,
            featured: false,
            badge: this.determineProductBadge(product)
        })).filter(product => 
            product.id && 
            product.name && 
            product.price > 0
        );
    }

    /**
     * Determine product badge based on data
     * @param {Object} product - Product data
     * @returns {string} Badge type
     */
    determineProductBadge(product) {
        // You can add logic here based on product data
        // For now, we'll randomly assign for demo
        const badges = ['new', 'bestseller', 'discount', ''];
        return badges[Math.floor(Math.random() * badges.length)];
    }

    /**
     * Fetch single product by ID
     * @param {string} productId - Product ID
     * @returns {Promise<Object|null>} Product data
     */
    async fetchProductById(productId) {
        if (!productId) return null;

        // Check cached products first
        const cachedProduct = this.products.find(p => p.id === productId);
        if (cachedProduct) {
            return cachedProduct;
        }

        try {
            const response = await fetch(`${this.API_BASE_URL}?action=product&id=${encodeURIComponent(productId)}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || 'Product not found');
            }

            return this.processProducts([result.data])[0] || null;

        } catch (error) {
            console.error('Error fetching product:', error);
            showNotification('প্রোডাক্ট খুঁজে পাওয়া যাচ্ছে না।', 'error');
            return null;
        }
    }

    /**
     * Get all categories
     * @returns {Array} Array of categories
     */
    getCategories() {
        return Array.from(this.categories);
    }

    /**
     * Get products by category
     * @param {string} category - Category name
     * @returns {Array} Filtered products
     */
    getProductsByCategory(category) {
        if (!category) return this.products;
        return this.products.filter(product => 
            product.category && product.category.toLowerCase() === category.toLowerCase()
        );
    }

    /**
     * Search products by query
     * @param {string} query - Search query
     * @returns {Array} Filtered products
     */
    searchProducts(query) {
        if (!query) return this.products;

        const searchTerm = query.toLowerCase();
        return this.products.filter(product =>
            product.name.toLowerCase().includes(searchTerm) ||
            product.description.toLowerCase().includes(searchTerm) ||
            product.category.toLowerCase().includes(searchTerm) ||
            product.color.toLowerCase().includes(searchTerm)
        );
    }

    /**
     * Get featured products
     * @param {number} limit - Number of products to return
     * @returns {Array} Featured products
     */
    getFeaturedProducts(limit = 8) {
        const featured = this.products.filter(product => product.featured);
        return featured.slice(0, limit);
    }

    /**
     * Get new arrivals
     * @param {number} limit - Number of products to return
     * @returns {Array} New arrival products
     */
    getNewArrivals(limit = 8) {
        // For now, return random products as new arrivals
        // In production, you might have a date field to sort by
        return [...this.products]
            .sort(() => Math.random() - 0.5)
            .slice(0, limit);
    }

    /**
     * Submit order to API
     * @param {Object} orderData - Order data
     * @returns {Promise<Object>} Order result
     */
    async submitOrder(orderData) {
        try {
            const response = await fetch(this.API_BASE_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(orderData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || 'Failed to submit order');
            }

            return result;

        } catch (error) {
            console.error('Error submitting order:', error);
            throw new Error('অর্ডার সাবমিট করতে সমস্যা হচ্ছে। আবার চেষ্টা করুন।');
        }
    }

    /**
     * Clear cache
     */
    clearCache() {
        try {
            localStorage.removeItem('tinystepsbd_products_cache');
            this.products = [];
            this.categories.clear();
        } catch (error) {
            console.warn('Failed to clear cache:', error);
        }
    }

    /**
     * Get product by ID from cache
     * @param {string} productId - Product ID
     * @returns {Object|null} Product data
     */
    getProductById(productId) {
        return this.products.find(product => product.id === productId) || null;
    }

    /**
     * Check if products are loaded
     * @returns {boolean} True if products are loaded
     */
    isProductsLoaded() {
        return this.products.length > 0;
    }
}

// Create global data manager instance
const dataManager = new DataManager();