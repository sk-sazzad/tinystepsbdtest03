// ===== TinyStepsBD Main Application =====

class TinyStepsBDApp {
    constructor() {
        this.isInitialized = false;
        this.currentPage = '';
        this.init();
    }

    /**
     * Initialize the application
     */
    async init() {
        if (this.isInitialized) return;

        try {
            await this.setupApp();
            this.bindGlobalEvents();
            this.initializeComponents();
            this.isInitialized = true;
            
            console.log('TinyStepsBD App initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize app:', error);
            showNotification('অ্যাপ্লিকেশন লোড করতে সমস্যা হচ্ছে।', 'error');
        }
    }

    /**
     * Setup application
     */
    async setupApp() {
        // Set current page
        this.currentPage = this.getCurrentPage();
        
        // Load essential data
        await this.loadEssentialData();
        
        // Apply theme
        setTheme();
        
        // Initialize lazy loading
        initLazyLoading();
    }

    /**
     * Bind global event listeners
     */
    bindGlobalEvents() {
        // Page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.handlePageVisible();
            }
        });

        // Online/offline status
        window.addEventListener('online', () => {
            showNotification('ইন্টারনেট কানেকশন পুনরুদ্ধার হয়েছে।', 'success');
            this.syncData();
        });

        window.addEventListener('offline', () => {
            showNotification('ইন্টারনেট কানেকশন নেই। অফলাইন মোডে কাজ চলছে।', 'warning');
        });

        // Cart updates
        window.addEventListener('cartUpdated', (event) => {
            this.handleCartUpdate(event.detail);
        });

        // Products loaded
        window.addEventListener('productsLoaded', (event) => {
            this.handleProductsLoaded(event.detail);
        });

        // Error handling
        window.addEventListener('error', this.handleGlobalError.bind(this));
        window.addEventListener('unhandledrejection', this.handlePromiseRejection.bind(this));

        // Resize events with debounce
        window.addEventListener('resize', debounce(() => {
            this.handleResize();
        }, 250));

        // Scroll events for sticky header
        window.addEventListener('scroll', throttle(() => {
            this.handleScroll();
        }, 100));
    }

    /**
     * Initialize UI components
     */
    initializeComponents() {
        this.initializeHeader();
        this.initializeFooter();
        this.initializeMobileMenu();
        this.initializeSearch();
        this.initializeThemeToggle();
    }

    /**
     * Get current page name
     * @returns {string} Page name
     */
    getCurrentPage() {
        const path = window.location.pathname;
        if (path.includes('product.html')) return 'product';
        if (path.includes('shop.html')) return 'shop';
        if (path.includes('cart.html')) return 'cart';
        if (path.includes('checkout.html')) return 'checkout';
        if (path.includes('success.html')) return 'success';
        if (path.includes('about.html')) return 'about';
        if (path.includes('contact.html')) return 'contact';
        return 'home';
    }

    /**
     * Load essential data for current page
     */
    async loadEssentialData() {
        switch (this.currentPage) {
            case 'home':
            case 'shop':
            case 'product':
                await dataManager.fetchAllProducts();
                break;
                
            case 'cart':
            case 'checkout':
                // Ensure cart is validated
                cartManager.validateCartItems();
                break;
        }
    }

    /**
     * Handle page becomes visible
     */
    handlePageVisible() {
        // Refresh data if page was hidden for a while
        if (document.hidden) {
            const hiddenTime = parseInt(sessionStorage.getItem('pageHiddenTime') || '0');
            if (Date.now() - hiddenTime > 5 * 60 * 1000) { // 5 minutes
                this.syncData();
            }
        }
    }

    /**
     * Handle cart updates
     * @param {Object} cartData - Cart data
     */
    handleCartUpdate(cartData) {
        // Update any cart-related UI elements
        this.updateCartUI(cartData);
    }

    /**
     * Handle products loaded
     * @param {Object} data - Products data
     */
    handleProductsLoaded(data) {
        // Initialize product-related features
        if (this.currentPage === 'home') {
            this.initializeHomePage();
        }
    }

    /**
     * Handle global errors
     * @param {ErrorEvent} event - Error event
     */
    handleGlobalError(event) {
        console.error('Global error:', event.error);
        
        // Don't show notification for minor errors
        if (event.error && event.error.message && 
            !event.error.message.includes('Loading') &&
            !event.error.message.includes('timeout')) {
            showNotification('দুঃখিত, কোনো সমস্যা হয়েছে। পৃষ্ঠাটি রিফ্রেশ করুন।', 'error');
        }
    }

    /**
     * Handle promise rejections
     * @param {PromiseRejectionEvent} event - Rejection event
     */
    handlePromiseRejection(event) {
        console.error('Unhandled promise rejection:', event.reason);
        // You can add specific handling for different types of rejections
    }

    /**
     * Handle window resize
     */
    handleResize() {
        // Update any responsive elements
        this.updateResponsiveElements();
    }

    /**
     * Handle window scroll
     */
    handleScroll() {
        this.updateStickyHeader();
        this.handleScrollAnimations();
    }

    /**
     * Initialize header functionality
     */
    initializeHeader() {
        // Header already has basic functionality from CSS
        // Add any additional JS functionality here
    }

    /**
     * Initialize footer functionality
     */
    initializeFooter() {
        this.initializeNewsletterSubscription();
        this.initializeSocialLinks();
    }

    /**
     * Initialize mobile menu
     */
    initializeMobileMenu() {
        const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
        const mobileMenu = document.querySelector('.mobile-menu');
        const mobileMenuClose = document.querySelector('.mobile-menu-close');

        if (mobileMenuBtn && mobileMenu) {
            mobileMenuBtn.addEventListener('click', () => {
                mobileMenu.classList.add('active');
                document.body.style.overflow = 'hidden';
            });

            mobileMenuClose.addEventListener('click', () => {
                mobileMenu.classList.remove('active');
                document.body.style.overflow = '';
            });

            // Close menu when clicking on links
            const mobileLinks = mobileMenu.querySelectorAll('a');
            mobileLinks.forEach(link => {
                link.addEventListener('click', () => {
                    mobileMenu.classList.remove('active');
                    document.body.style.overflow = '';
                });
            });
        }
    }

    /**
     * Initialize search functionality
     */
    initializeSearch() {
        const searchInput = document.querySelector('.search-input');
        const searchResults = document.querySelector('.search-results');

        if (searchInput && searchResults) {
            searchInput.addEventListener('input', debounce((e) => {
                const query = e.target.value.trim();
                
                if (query.length < 2) {
                    searchResults.style.display = 'none';
                    return;
                }

                const results = dataManager.searchProducts(query);
                this.displaySearchResults(results, searchResults);
                
            }, 300));

            // Hide results when clicking outside
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.search-container')) {
                    searchResults.style.display = 'none';
                }
            });
        }
    }

    /**
     * Display search results
     * @param {Array} results - Search results
     * @param {Element} container - Results container
     */
    displaySearchResults(results, container) {
        if (results.length === 0) {
            container.innerHTML = '<div class="no-results">কোনো প্রোডাক্ট পাওয়া যায়নি</div>';
        } else {
            container.innerHTML = results.slice(0, 5).map(product => `
                <a href="product.html?id=${product.id}" class="search-result-item">
                    <img src="${product.mainImage}" alt="${product.name}" 
                         onerror="this.src='assets/images/placeholder.jpg'">
                    <div class="search-result-info">
                        <div class="search-result-name">${product.name}</div>
                        <div class="search-result-price">${formatPrice(product.price)}</div>
                    </div>
                </a>
            `).join('');
        }
        
        container.style.display = 'block';
    }

    /**
     * Initialize theme toggle
     */
    initializeThemeToggle() {
        const themeToggle = document.querySelector('.theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', toggleTheme);
        }
    }

    /**
     * Initialize newsletter subscription
     */
    initializeNewsletterSubscription() {
        const subscribeForms = document.querySelectorAll('.subscribe-form');
        
        subscribeForms.forEach(form => {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const phoneInput = form.querySelector('.phone-input');
                const phone = phoneInput.value.trim();
                
                if (!validatePhone(phone)) {
                    showNotification('সঠিক মোবাইল নম্বর লিখুন।', 'error');
                    return;
                }

                // Here you would typically send to your backend
                // For now, we'll simulate success
                showNotification('হোয়াটসঅ্যাপ নোটিফিকেশন সাবস্ক্রাইব করা হয়েছে!', 'success');
                phoneInput.value = '';
            });
        });
    }

    /**
     * Initialize social links
     */
    initializeSocialLinks() {
        // Add any social link functionality here
        // For example, tracking clicks
        const socialLinks = document.querySelectorAll('.social-link');
        socialLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                // You can add analytics tracking here
                console.log('Social link clicked:', e.target.href);
            });
        });
    }

    /**
     * Initialize home page specific features
     */
    initializeHomePage() {
        this.initializeHeroSlider();
        this.initializeCategoryFilters();
        this.initializeTestimonialSlider();
    }

    /**
     * Initialize hero slider
     */
    initializeHeroSlider() {
        const slider = document.querySelector('.hero-slider');
        if (!slider) return;

        // Simple slider implementation
        let currentSlide = 0;
        const slides = slider.querySelectorAll('.slide');
        const totalSlides = slides.length;

        if (totalSlides <= 1) return;

        function showSlide(index) {
            slides.forEach((slide, i) => {
                slide.style.opacity = i === index ? '1' : '0';
            });
        }

        function nextSlide() {
            currentSlide = (currentSlide + 1) % totalSlides;
            showSlide(currentSlide);
        }

        // Auto-advance slides
        setInterval(nextSlide, 5000);
        showSlide(currentSlide);
    }

    /**
     * Initialize category filters
     */
    initializeCategoryFilters() {
        const filterButtons = document.querySelectorAll('.category-filter');
        
        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                const category = button.dataset.category;
                
                // Update active state
                filterButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                // Filter products
                this.filterProductsByCategory(category);
            });
        });
    }

    /**
     * Filter products by category
     * @param {string} category - Category to filter by
     */
    filterProductsByCategory(category) {
        const productsGrid = document.querySelector('.products-grid');
        if (!productsGrid) return;

        const products = category ? 
            dataManager.getProductsByCategory(category) : 
            dataManager.products;

        productsGrid.innerHTML = products.map(product => 
            productManager.generateProductCard(product)
        ).join('');
        
        initLazyLoading();
    }

    /**
     * Initialize testimonial slider
     */
    initializeTestimonialSlider() {
        // Similar to hero slider but for testimonials
    }

    /**
     * Update cart UI elements
     * @param {Object} cartData - Cart data
     */
    updateCartUI(cartData) {
        // Cart updates are handled by CartManager
        // This is for any additional UI updates
    }

    /**
     * Update sticky header on scroll
     */
    updateStickyHeader() {
        const header = document.querySelector('.main-header');
        if (!header) return;

        const scrollY = window.scrollY;
        
        if (scrollY > 100) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    }

    /**
     * Handle scroll animations
     */
    handleScrollAnimations() {
        const animatedElements = document.querySelectorAll('.stagger-item, .fade-in-up, .fade-in');
        
        animatedElements.forEach(element => {
            const elementTop = element.getBoundingClientRect().top;
            const elementVisible = 150;
            
            if (elementTop < window.innerHeight - elementVisible) {
                element.classList.add('animate-in');
            }
        });
    }

    /**
     * Update responsive elements
     */
    updateResponsiveElements() {
        // Update any elements that need to change on resize
        const deviceType = getDeviceType();
        document.body.setAttribute('data-device', deviceType);
    }

    /**
     * Sync data with server
     */
    async syncData() {
        try {
            // Refresh products data
            await dataManager.fetchAllProducts();
            
            // Validate cart items
            cartManager.validateCartItems();
            
        } catch (error) {
            console.warn('Data sync failed:', error);
        }
    }

    /**
     * Get app version and info
     * @returns {Object} App information
     */
    getAppInfo() {
        return {
            version: '1.0.0',
            name: 'TinyStepsBD',
            environment: window.location.hostname === 'localhost' ? 'development' : 'production',
            features: {
                cart: true,
                checkout: true,
                darkMode: true,
                offline: true,
                responsive: true
            }
        };
    }

    /**
     * Debug method for development
     */
    debug() {
        return {
            app: this.getAppInfo(),
            cart: cartManager.cart,
            products: dataManager.products.length,
            categories: dataManager.getCategories(),
            currentPage: this.currentPage
        };
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.tinyStepsBDApp = new TinyStepsBDApp();
});

// Global error handler for better debugging
if (window.location.hostname === 'localhost') {
    window.addEventListener('error', (event) => {
        console.group('💥 Application Error');
        console.error('Message:', event.error?.message);
        console.error('Stack:', event.error?.stack);
        console.error('File:', event.filename);
        console.error('Line:', event.lineno);
        console.error('Column:', event.colno);
        console.groupEnd();
    });
}