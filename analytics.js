// Analytics for Stromtarifprofi.de MVP
// Lightweight analytics implementation that works with common tracking tools

// Initialize analytics when document is ready
document.addEventListener('DOMContentLoaded', function() {
    initAnalytics();
});

function initAnalytics() {
    // Check for cookie consent
    const cookieConsent = getCookie('cookie_consent');
    
    // Set default consent state based on cookie
    if (cookieConsent === 'accepted') {
        enableTracking();
    } else {
        disableTracking();
    }
    
    // Set up event listeners for tracking
    setupEventTracking();
}

function setupEventTracking() {
    // Track form step changes
    document.querySelectorAll('.btn-next, .btn-prev').forEach(button => {
        button.addEventListener('click', function() {
            trackEvent('form_navigation', {
                action: this.classList.contains('btn-next') ? 'next' : 'prev',
                current_step: currentStep
            });
        });
    });
    
    // Track checkbox interactions
    document.querySelectorAll('.checkbox-item').forEach(item => {
        item.addEventListener('click', function() {
            const checkbox = this.querySelector('input[type="checkbox"]');
            if (checkbox) {
                trackEvent('checkbox_toggle', {
                    checkbox_id: checkbox.id,
                    checked: checkbox.checked
                });
            }
        });
    });
    
    // Track form field changes
    document.querySelectorAll('input, select').forEach(field => {
        field.addEventListener('change', function() {
            // Don't track sensitive fields
            if (this.type === 'email' || this.type === 'tel' || this.id === 'name') {
                trackEvent('field_change', {
                    field_id: this.id,
                    field_type: this.type,
                    has_value: !!this.value
                });
            }
        });
    });
}

// Generic event tracking function
function trackEvent(eventName, eventParams = {}) {
    // Only track if consent is given
    if (getCookie('cookie_consent') !== 'accepted') return;
    
    // Add common parameters
    const commonParams = {
        page_url: window.location.href,
        page_title: document.title,
        timestamp: new Date().toISOString()
    };
    
    const params = { ...commonParams, ...eventParams };
    
    // Google Analytics 4
    if (typeof gtag !== 'undefined') {
        gtag('event', eventName, params);
    }
    
    // Facebook Pixel
    if (typeof fbq !== 'undefined') {
        fbq('trackCustom', eventName, params);
    }
    
    // Log events in debug mode
    if (window.location.search.includes('debug=1')) {
        console.log(`📊 Event: ${eventName}`, params);
    }
    
    // Store events in localStorage for debugging
    storeEventInLocalStorage(eventName, params);
}

// Store events in localStorage for debugging
function storeEventInLocalStorage(eventName, params) {
    try {
        const events = JSON.parse(localStorage.getItem('analytics_events') || '[]');
        events.push({
            event: eventName,
            params: params,
            timestamp: new Date().toISOString()
        });
        
        // Keep only the last 50 events to avoid storage issues
        localStorage.setItem('analytics_events', JSON.stringify(events.slice(-50)));
    } catch (error) {
        console.log('Storage error:', error);
    }
}

// Helper function to get cookie value
function getCookie(name) {
    const nameEQ = name + '=';
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

// Enable tracking
function enableTracking() {
    // Google Analytics
    if (typeof gtag !== 'undefined') {
        gtag('consent', 'update', {
            'analytics_storage': 'granted',
            'ad_storage': 'granted'
        });
    }
    
    // Facebook Pixel
    if (typeof fbq !== 'undefined') {
        fbq('consent', 'grant');
    }
}

// Disable tracking
function disableTracking() {
    // Google Analytics
    if (typeof gtag !== 'undefined') {
        gtag('consent', 'update', {
            'analytics_storage': 'denied',
            'ad_storage': 'denied'
        });
    }
    
    // Facebook Pixel
    if (typeof fbq !== 'undefined') {
        fbq('consent', 'revoke');
    }
}

// Analytics Dashboard for debugging
function showAnalyticsDashboard() {
    // Only available in debug mode
    if (!window.location.search.includes('debug=1')) return;
    
    try {
        const events = JSON.parse(localStorage.getItem('analytics_events') || '[]');
        const leads = JSON.parse(localStorage.getItem('submitted_leads') || '[]');
        
        console.log('📊 Analytics Dashboard');
        console.log('=====================');
        console.log(`Total Events: ${events.length}`);
        console.log(`Submitted Leads: ${leads.length}`);
        
        // Event breakdown
        const eventTypes = {};
        events.forEach(event => {
            eventTypes[event.event] = (eventTypes[event.event] || 0) + 1;
        });
        
        console.log('\nEvent Breakdown:');
        Object.entries(eventTypes).forEach(([type, count]) => {
            console.log(`${type}: ${count}`);
        });
        
        // Lead breakdown
        if (leads.length > 0) {
            console.log('\nLead Breakdown:');
            leads.forEach((lead, index) => {
                console.log(`${index + 1}. ${lead.timestamp} - ${lead.affiliate} (Score: ${lead.lead_score})`);
            });
        }
    } catch (error) {
        console.log('Dashboard error:', error);
    }
}

// Make functions available globally
window.trackEvent = trackEvent;
window.showAnalyticsDashboard = showAnalyticsDashboard;

