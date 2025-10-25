// ===== TinyStepsBD Utility Functions =====

/**
 * Format price with Bangladeshi Taka symbol
 * @param {number} price - The price to format
 * @returns {string} Formatted price string
 */
function formatPrice(price) {
    return `৳${parseInt(price).toLocaleString('bn-BD')}`;
}

/**
 * Format number with Bengali digits
 * @param {number} num - The number to format
 * @returns {string} Formatted number string
 */
function formatNumber(num) {
    return parseInt(num).toLocaleString('bn-BD');
}

/**
 * Validate Bangladeshi phone number
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if valid
 */
function validatePhone(phone) {
    const phoneRegex = /^(?:\+88|01)?(?:\d{11}|\d{13})$/;
    return phoneRegex.test(phone.replace(/\s+/g, ''));
}

/**
 * Validate email address
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid
 */
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Debounce function to limit function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle function to limit function calls
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Get URL parameters
 * @param {string} param - Parameter name
 * @returns {string|null} Parameter value
 */
function getUrlParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

/**
 * Set URL parameter without page reload
 * @param {string} param - Parameter name
 * @param {string} value - Parameter value
 */
function setUrlParam(param, value) {
    const url = new URL(window.location);
    url.searchParams.set(param, value);
    window.history.pushState({}, '', url);
}

/**
 * Remove URL parameter
 * @param {string} param - Parameter name to remove
 */
function removeUrlParam(param) {
    const url = new URL(window.location);
    url.searchParams.delete(param);
    window.history.pushState({}, '', url);
}

/**
 * Show loading spinner
 * @param {string} elementId - Element ID to show spinner in
 */
function showLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = '<div class="spinner"></div>';
    }
}

/**
 * Hide loading spinner
 * @param {string} elementId - Element ID to hide spinner from
 */
function hideLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element && element.querySelector('.spinner')) {
        element.querySelector('.spinner').remove();
    }
}

/**
 * Show notification/toast message
 * @param {string} message - Message to show
 * @param {string} type - Type of notification (success, error, warning, info)
 * @param {number} duration - Duration in milliseconds
 */
function showNotification(message, type = 'info', duration = 3000) {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());

    const notification = document.createElement('div');
    notification.className = `notification notification-${type} notification-slide-in`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close">&times;</button>
        </div>
    `;

    // Add styles if not already added
    if (!document.querySelector('#notification-styles')) {
        const styles = document.createElement('style');
        styles.id = 'notification-styles';
        styles.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: white;
                padding: 16px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 10000;
                max-width: 400px;
                border-left: 4px solid #4ECDC4;
            }
            .notification-success { border-left-color: #28A745; }
            .notification-error { border-left-color: #DC3545; }
            .notification-warning { border-left-color: #FFC107; }
            .notification-info { border-left-color: #17A2B8; }
            .notification-content {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
            }
            .notification-close {
                background: none;
                border: none;
                font-size: 18px;
                cursor: pointer;
                padding: 0;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
        `;
        document.head.appendChild(styles);
    }

    document.body.appendChild(notification);

    // Auto remove after duration
    const autoRemove = setTimeout(() => {
        notification.remove();
    }, duration);

    // Manual close
    notification.querySelector('.notification-close').addEventListener('click', () => {
        clearTimeout(autoRemove);
        notification.remove();
    });
}

/**
 * Format product description for display
 * @param {string} description - Raw description
 * @returns {string} Formatted description
 */
function formatDescription(description) {
    if (!description) return '';
    return description.replace(/\n/g, '<br>');
}

/**
 * Get age range from size string
 * @param {string} size - Size string from sheet
 * @returns {string} Formatted age range
 */
function getAgeRange(size) {
    if (!size) return '';
    
    const ageMatch = size.match(/(\d+)\s*[-–—]\s*(\d+)\s*(?:বছর|year)/i);
    if (ageMatch) {
        return `${ageMatch[1]}-${ageMatch[2]} বছর`;
    }
    
    return size;
}

/**
 * Sanitize HTML to prevent XSS
 * @param {string} str - String to sanitize
 * @returns {string} Sanitized string
 */
function sanitizeHTML(str) {
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
}

/**
 * Check if image exists
 * @param {string} url - Image URL
 * @returns {Promise<boolean>} True if image exists
 */
function checkImageExists(url) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = url;
    });
}

/**
 * Lazy load images
 */
function initLazyLoading() {
    const lazyImages = document.querySelectorAll('img[data-src]');
    
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                observer.unobserve(img);
            }
        });
    });

    lazyImages.forEach(img => imageObserver.observe(img));
}

/**
 * Get device type
 * @returns {string} Device type (mobile, tablet, desktop)
 */
function getDeviceType() {
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
}

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} Success status
 */
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (err) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        return true;
    }
}

/**
 * Generate unique ID
 * @param {number} length - Length of ID
 * @returns {string} Unique ID
 */
function generateId(length = 8) {
    return Math.random().toString(36).substr(2, length);
}

/**
 * Format date to Bengali locale
 * @param {Date} date - Date to format
 * @returns {string} Formatted date
 */
function formatDate(date) {
    return date.toLocaleDateString('bn-BD', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

/**
 * Calculate delivery fee based on address
 * @param {string} address - Customer address
 * @returns {number} Delivery fee
 */
function calculateDeliveryFee(address) {
    if (!address) return 150;
    
    const dhakaAreas = ['ঢাকা', 'Dhaka', 'DHAKA', 'মিরপুর', 'উত্তরা', 'গুলশান', 'বনানী', 'ধানমন্ডি', 'মোহাম্মদপুর', 'ফার্মগেট', 'শাহবাগ', 'যাত্রাবাড়ী', 'রামপুরা', 'বাড্ডা'];
    const addressLower = address.toLowerCase();
    
    const isInsideDhaka = dhakaAreas.some(area => 
        addressLower.includes(area.toLowerCase())
    );
    
    return isInsideDhaka ? 80 : 150;
}

/**
 * Get browser language
 * @returns {string} Language code
 */
function getBrowserLanguage() {
    return navigator.language || navigator.userLanguage || 'en';
}

/**
 * Check if user prefers dark mode
 * @returns {boolean} True if dark mode preferred
 */
function prefersDarkMode() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/**
 * Set theme based on user preference
 */
function setTheme() {
    const theme = localStorage.getItem('theme') || (prefersDarkMode() ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
}

/**
 * Toggle between light and dark mode
 */
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
}

// Initialize theme on load
document.addEventListener('DOMContentLoaded', setTheme);

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        formatPrice,
        formatNumber,
        validatePhone,
        validateEmail,
        debounce,
        throttle,
        getUrlParam,
        setUrlParam,
        removeUrlParam,
        showLoading,
        hideLoading,
        showNotification,
        formatDescription,
        getAgeRange,
        sanitizeHTML,
        checkImageExists,
        initLazyLoading,
        getDeviceType,
        copyToClipboard,
        generateId,
        formatDate,
        calculateDeliveryFee,
        getBrowserLanguage,
        prefersDarkMode,
        setTheme,
        toggleTheme
    };
}