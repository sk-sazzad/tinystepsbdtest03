// ===== TinyStepsBD Checkout Management =====

class CheckoutManager {
    constructor() {
        this.currentStep = 1;
        this.totalSteps = 3;
        this.orderData = {};
        this.init();
    }

    /**
     * Initialize checkout manager
     */
    init() {
        this.bindEvents();
        this.loadCheckoutPage();
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        document.addEventListener('DOMContentLoaded', () => {
            if (this.isCheckoutPage()) {
                this.setupCheckoutForm();
            }
        });

        // Form submission
        document.addEventListener('submit', (e) => {
            if (e.target.id === 'checkout-form') {
                e.preventDefault();
                this.handleCheckoutSubmit(e.target);
            }
        });

        // Address change for delivery fee calculation
        document.addEventListener('input', debounce((e) => {
            if (e.target.id === 'address') {
                this.updateDeliveryFee();
            }
        }, 500));
    }

    /**
     * Check if current page is checkout page
     * @returns {boolean} True if checkout page
     */
    isCheckoutPage() {
        return window.location.pathname.includes('checkout.html');
    }

    /**
     * Load checkout page data
     */
    loadCheckoutPage() {
        if (!this.isCheckoutPage()) return;

        if (cartManager.isEmpty()) {
            showNotification('কার্ট খালি। প্রথমে কিছু প্রোডাক্ট যোগ করুন।', 'warning');
            window.location.href = 'shop.html';
            return;
        }

        this.renderOrderSummary();
        this.updateDeliveryFee();
        this.setupProgressSteps();
    }

    /**
     * Setup checkout form validation
     */
    setupCheckoutForm() {
        const form = document.getElementById('checkout-form');
        if (!form) return;

        // Real-time validation
        const inputs = form.querySelectorAll('input[required]');
        inputs.forEach(input => {
            input.addEventListener('blur', () => {
                this.validateField(input);
            });
        });

        // Phone number formatting
        const phoneInput = document.getElementById('phone');
        if (phoneInput) {
            phoneInput.addEventListener('input', (e) => {
                e.target.value = e.target.value.replace(/[^\d+]/g, '');
            });
        }
    }

    /**
     * Validate form field
     * @param {HTMLInputElement} input - Input field
     * @returns {boolean} True if valid
     */
    validateField(input) {
        const value = input.value.trim();
        const fieldName = input.getAttribute('data-field') || input.name;
        
        let isValid = true;
        let errorMessage = '';

        switch (fieldName) {
            case 'customer_name':
                isValid = value.length >= 2;
                errorMessage = 'নাম অন্তত ২ অক্ষরের হতে হবে';
                break;
                
            case 'phone':
                isValid = validatePhone(value);
                errorMessage = 'সঠিক মোবাইল নম্বর লিখুন';
                break;
                
            case 'address':
                isValid = value.length >= 10;
                errorMessage = 'বিস্তারিত ঠিকানা লিখুন (অন্তত ১০ অক্ষর)';
                break;
                
            case 'email':
                if (value) {
                    isValid = validateEmail(value);
                    errorMessage = 'সঠিক ইমেইল ঠিকানা লিখুন';
                }
                break;
        }

        this.showFieldError(input, isValid, errorMessage);
        return isValid;
    }

    /**
     * Show field error message
     * @param {HTMLInputElement} input - Input field
     * @param {boolean} isValid - Validation status
     * @param {string} message - Error message
     */
    showFieldError(input, isValid, message) {
        // Remove existing error
        const existingError = input.parentNode.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }

        input.classList.remove('error', 'success');

        if (!isValid && input.value.trim() !== '') {
            input.classList.add('error');
            const errorElement = document.createElement('div');
            errorElement.className = 'field-error';
            errorElement.textContent = message;
            input.parentNode.appendChild(errorElement);
        } else if (input.value.trim() !== '') {
            input.classList.add('success');
        }
    }

    /**
     * Validate entire form
     * @param {HTMLFormElement} form - Form element
     * @returns {boolean} True if form is valid
     */
    validateForm(form) {
        const requiredFields = form.querySelectorAll('input[required]');
        let isValid = true;

        requiredFields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });

        return isValid;
    }

    /**
     * Handle checkout form submission
     * @param {HTMLFormElement} form - Form element
     */
    async handleCheckoutSubmit(form) {
        if (!this.validateForm(form)) {
            showNotification('দয়া করে সকল প্রয়োজনীয় তথ্য সঠিকভাবে পূরণ করুন।', 'error');
            return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        
        // Show loading state
        submitBtn.innerHTML = '<div class="spinner"></div> অর্ডার দেওয়া হচ্ছে...';
        submitBtn.disabled = true;

        try {
            const formData = new FormData(form);
            const orderData = this.prepareOrderData(formData);
            
            const result = await this.submitOrder(orderData);
            
            if (result.success) {
                this.handleOrderSuccess(result, orderData);
            } else {
                throw new Error(result.error || 'অর্ডার জমা দিতে সমস্যা হয়েছে');
            }

        } catch (error) {
            console.error('Order submission error:', error);
            showNotification(error.message || 'অর্ডার জমা দিতে সমস্যা হয়েছে। আবার চেষ্টা করুন।', 'error');
        } finally {
            // Restore button state
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    /**
     * Prepare order data for submission
     * @param {FormData} formData - Form data
     * @returns {Object} Order data
     */
    prepareOrderData(formData) {
        const deliveryFee = this.calculateDeliveryFee(formData.get('address'));
        
        return {
            customer_name: formData.get('customer_name'),
            phone: formData.get('phone'),
            email: formData.get('email') || '',
            address: formData.get('address'),
            delivery_area: this.getDeliveryArea(formData.get('address')),
            payment_method: 'Cash on Delivery',
            special_notes: formData.get('special_notes') || '',
            delivery_fee: deliveryFee,
            products: cartManager.getOrderItems()
        };
    }

    /**
     * Submit order to API
     * @param {Object} orderData - Order data
     * @returns {Promise<Object>} API response
     */
    async submitOrder(orderData) {
        return await dataManager.submitOrder(orderData);
    }

    /**
     * Handle successful order submission
     * @param {Object} result - API response
     * @param {Object} orderData - Order data
     */
    handleOrderSuccess(result, orderData) {
        // Save order confirmation data
        const orderConfirmation = {
            orderId: result.data.order_id,
            customerName: orderData.customer_name,
            phone: orderData.phone,
            address: orderData.address,
            totalAmount: result.data.total_amount,
            deliveryFee: result.data.delivery_fee,
            items: orderData.products,
            orderDate: new Date().toISOString()
        };

        // Save to localStorage for success page
        localStorage.setItem('last_order', JSON.stringify(orderConfirmation));
        
        // Clear cart
        cartManager.clearCart();
        
        // Redirect to success page
        window.location.href = `success.html?order_id=${result.data.order_id}`;
    }

    /**
     * Render order summary
     */
    renderOrderSummary() {
        const summaryElement = document.getElementById('order-summary');
        if (!summaryElement) return;

        const cartData = cartManager.getCheckoutData();
        const deliveryFee = this.calculateDeliveryFee('');

        summaryElement.innerHTML = `
            <div class="order-summary-header">
                <h3>আপনার অর্ডার</h3>
                <span>${cartData.itemCount} টি প্রোডাক্ট</span>
            </div>
            
            <div class="order-items">
                ${cartData.items.map(item => `
                    <div class="order-item">
                        <div class="item-image">
                            <img src="${item.image}" alt="${item.name}" 
                                 onerror="this.src='assets/images/placeholder.jpg'">
                        </div>
                        <div class="item-details">
                            <h4>${item.name}</h4>
                            ${item.color ? `<div class="item-meta">রং: ${item.color}</div>` : ''}
                            ${item.size ? `<div class="item-meta">সাইজ: ${item.size}</div>` : ''}
                            <div class="item-quantity">পরিমাণ: ${item.quantity}</div>
                        </div>
                        <div class="item-price">
                            ${formatPrice(item.price * item.quantity)}
                        </div>
                    </div>
                `).join('')}
            </div>
            
            <div class="order-totals">
                <div class="total-row">
                    <span>সাবটোটাল:</span>
                    <span>${formatPrice(cartData.subtotal)}</span>
                </div>
                <div class="total-row">
                    <span>ডেলিভারি চার্জ:</span>
                    <span id="delivery-fee-amount">${formatPrice(deliveryFee)}</span>
                </div>
                <div class="total-row grand-total">
                    <span>মোট:</span>
                    <span id="order-total-amount">${formatPrice(cartData.subtotal + deliveryFee)}</span>
                </div>
            </div>
            
            <div class="payment-method">
                <div class="payment-method-header">
                    <i class="fas fa-money-bill-wave"></i>
                    <span>পেমেন্ট মেথড</span>
                </div>
                <div class="payment-method-details">
                    ক্যাশ অন ডেলিভারি (Cash on Delivery)
                </div>
            </div>
        `;
    }

    /**
     * Calculate delivery fee based on address
     * @param {string} address - Customer address
     * @returns {number} Delivery fee
     */
    calculateDeliveryFee(address) {
        return calculateDeliveryFee(address);
    }

    /**
     * Get delivery area from address
     * @param {string} address - Customer address
     * @returns {string} Delivery area
     */
    getDeliveryArea(address) {
        if (!address) return 'outside';
        
        const dhakaAreas = ['ঢাকা', 'Dhaka', 'DHAKA', 'মিরপুর', 'উত্তরা', 'গুলশান', 'বনানী', 'ধানমন্ডি', 'মোহাম্মদপুর', 'ফার্মগেট', 'শাহবাগ', 'যাত্রাবাড়ী', 'রামপুরা', 'বাড্ডা'];
        const addressLower = address.toLowerCase();
        
        const isInsideDhaka = dhakaAreas.some(area => 
            addressLower.includes(area.toLowerCase())
        );
        
        return isInsideDhaka ? 'inside_dhaka' : 'outside_dhaka';
    }

    /**
     * Update delivery fee based on address input
     */
    updateDeliveryFee() {
        const addressInput = document.getElementById('address');
        const deliveryFeeElement = document.getElementById('delivery-fee-amount');
        const totalElement = document.getElementById('order-total-amount');
        
        if (!addressInput || !deliveryFeeElement || !totalElement) return;

        const address = addressInput.value;
        const deliveryFee = this.calculateDeliveryFee(address);
        const subtotal = cartManager.getSubtotal();
        const total = subtotal + deliveryFee;

        deliveryFeeElement.textContent = formatPrice(deliveryFee);
        totalElement.textContent = formatPrice(total);
    }

    /**
     * Setup progress steps
     */
    setupProgressSteps() {
        const progressElement = document.getElementById('checkout-progress');
        if (!progressElement) return;

        progressElement.innerHTML = `
            <div class="progress-steps">
                <div class="progress-step ${this.currentStep >= 1 ? 'active' : ''}">
                    <div class="step-number">1</div>
                    <div class="step-label">তথ্য</div>
                </div>
                <div class="progress-step ${this.currentStep >= 2 ? 'active' : ''}">
                    <div class="step-number">2</div>
                    <div class="step-label">রিভিউ</div>
                </div>
                <div class="progress-step ${this.currentStep >= 3 ? 'active' : ''}">
                    <div class="step-number">3</div>
                    <div class="step-label">কনফার্ম</div>
                </div>
            </div>
        `;
    }

    /**
     * Go to next step
     */
    nextStep() {
        if (this.currentStep < this.totalSteps) {
            this.currentStep++;
            this.setupProgressSteps();
        }
    }

    /**
     * Go to previous step
     */
    previousStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.setupProgressSteps();
        }
    }

    /**
     * Generate order confirmation HTML
     * @param {Object} orderData - Order data
     * @returns {string} HTML string
     */
    generateOrderConfirmation(orderData) {
        return `
            <div class="order-confirmation">
                <div class="confirmation-header">
                    <i class="fas fa-check-circle"></i>
                    <h2>অর্ডার সফল!</h2>
                </div>
                
                <div class="confirmation-details">
                    <div class="detail-row">
                        <strong>অর্ডার নম্বর:</strong>
                        <span>${orderData.orderId}</span>
                    </div>
                    <div class="detail-row">
                        <strong>গ্রাহকের নাম:</strong>
                        <span>${orderData.customerName}</span>
                    </div>
                    <div class="detail-row">
                        <strong>ফোন নম্বর:</strong>
                        <span>${orderData.phone}</span>
                    </div>
                    <div class="detail-row">
                        <strong>ঠিকানা:</strong>
                        <span>${orderData.address}</span>
                    </div>
                    <div class="detail-row">
                        <strong>মোট Amount:</strong>
                        <span>${formatPrice(orderData.totalAmount)}</span>
                    </div>
                </div>
                
                <div class="confirmation-actions">
                    <button onclick="window.print()" class="btn-secondary">
                        <i class="fas fa-print"></i>
                        প্রিন্ট করুন
                    </button>
                    <a href="shop.html" class="btn-primary">
                        <i class="fas fa-shopping-bag"></i>
                        আরও শপিং করুন
                    </a>
                </div>
            </div>
        `;
    }
}

// Create global checkout manager instance
const checkoutManager = new CheckoutManager();