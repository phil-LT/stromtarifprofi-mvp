// Form Handler for Stromtarifprofi.de MVP
document.addEventListener('DOMContentLoaded', function() {
    // Initialize form functionality
    initFormSteps();
    initCookieBanner();
    calculateSavings();
    
    // Set up form submission
    const leadForm = document.getElementById('leadForm');
    if (leadForm) {
        leadForm.addEventListener('submit', handleFormSubmit);
    }
});

// Multi-step form navigation
let currentStep = 1;
const totalSteps = 3;

function initFormSteps() {
    // Show first step initially
    showStep(currentStep);
    
    // Update progress indicators if they exist
    updateProgress();
}

function showStep(step) {
    // Hide all steps
    document.querySelectorAll('.form-step').forEach(el => {
        el.classList.remove('active');
        el.classList.remove('slide-in-right');
        el.classList.remove('slide-in-left');
    });
    
    // Show current step
    const currentStepElement = document.getElementById(`step${step}`);
    if (currentStepElement) {
        currentStepElement.classList.add('active');
        
        // Add animation based on direction
        if (step > currentStep) {
            currentStepElement.classList.add('slide-in-right');
        } else if (step < currentStep) {
            currentStepElement.classList.add('slide-in-left');
        }
    }
    
    // Update current step tracker
    currentStep = step;
    
    // Update progress indicators
    updateProgress();
}

function updateProgress() {
    // Update progress bar if it exists
    const progressBar = document.getElementById('formProgress');
    if (progressBar) {
        const progressPercentage = ((currentStep - 1) / (totalSteps - 1)) * 100;
        progressBar.style.width = `${progressPercentage}%`;
    }
    
    // Update step indicators if they exist
    document.querySelectorAll('.step-indicator').forEach((indicator, index) => {
        if (index + 1 < currentStep) {
            indicator.classList.add('completed');
            indicator.classList.remove('active');
        } else if (index + 1 === currentStep) {
            indicator.classList.add('active');
            indicator.classList.remove('completed');
        } else {
            indicator.classList.remove('active');
            indicator.classList.remove('completed');
        }
    });
}

function nextStep() {
    if (currentStep < totalSteps) {
        // Validate current step before proceeding
        if (validateStep(currentStep)) {
            showStep(currentStep + 1);
            
            // Scroll to top of form
            const formContainer = document.querySelector('.form-container');
            if (formContainer) {
                formContainer.scrollIntoView({ behavior: 'smooth' });
            }
        }
    }
}

function prevStep() {
    if (currentStep > 1) {
        showStep(currentStep - 1);
        
        // Scroll to top of form
        const formContainer = document.querySelector('.form-container');
        if (formContainer) {
            formContainer.scrollIntoView({ behavior: 'smooth' });
        }
    }
}

function validateStep(step) {
    let isValid = true;
    
    // Get all required fields in current step
    const currentStepElement = document.getElementById(`step${step}`);
    if (!currentStepElement) return true;
    
    const requiredFields = currentStepElement.querySelectorAll('[required]');
    
    requiredFields.forEach(field => {
        if (!field.value) {
            isValid = false;
            highlightInvalidField(field);
        } else {
            removeInvalidHighlight(field);
        }
    });
    
    // Special validation for specific fields
    if (step === 1) {
        // Validate PLZ
        const plzField = document.getElementById('plz');
        if (plzField && plzField.value && !/^\d{5}$/.test(plzField.value)) {
            isValid = false;
            highlightInvalidField(plzField, 'Bitte geben Sie eine gültige 5-stellige PLZ ein');
        }
        
        // Validate consumption
        const verbrauchField = document.getElementById('verbrauch');
        if (verbrauchField && verbrauchField.value) {
            const verbrauch = parseInt(verbrauchField.value);
            if (isNaN(verbrauch) || verbrauch < 500 || verbrauch > 100000) {
                isValid = false;
                highlightInvalidField(verbrauchField, 'Bitte geben Sie einen realistischen Verbrauch ein (500-100.000 kWh)');
            }
        }
    }
    
    if (step === 3) {
        // Validate email
        const emailField = document.getElementById('email');
        if (emailField && emailField.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailField.value)) {
            isValid = false;
            highlightInvalidField(emailField, 'Bitte geben Sie eine gültige E-Mail-Adresse ein');
        }
        
        // Validate DSGVO consent
        const dsgvoField = document.getElementById('dsgvo_consent');
        if (dsgvoField && !dsgvoField.checked) {
            isValid = false;
            highlightInvalidField(dsgvoField, 'Bitte stimmen Sie der Datenschutzerklärung zu');
        }
    }
    
    return isValid;
}

function highlightInvalidField(field, message = null) {
    field.classList.add('invalid');
    
    // Add error message if provided
    if (message) {
        // Remove any existing error message
        const existingError = field.parentNode.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
        
        // Create and add new error message
        const errorMessage = document.createElement('div');
        errorMessage.className = 'error-message';
        errorMessage.textContent = message;
        field.parentNode.appendChild(errorMessage);
    }
    
    // Add event listener to remove highlight on input
    field.addEventListener('input', function() {
        removeInvalidHighlight(field);
    }, { once: true });
}

function removeInvalidHighlight(field) {
    field.classList.remove('invalid');
    
    // Remove error message if exists
    const errorMessage = field.parentNode.querySelector('.error-message');
    if (errorMessage) {
        errorMessage.remove();
    }
}

// Form submission handler
function handleFormSubmit(event) {
    event.preventDefault();
    
    // Validate all steps before submission
    let isValid = true;
    for (let i = 1; i <= totalSteps; i++) {
        if (!validateStep(i)) {
            isValid = false;
            showStep(i); // Show the first invalid step
            break;
        }
    }
    
    if (!isValid) {
        return;
    }
    
    // Show loading state
    const submitButton = document.getElementById('submitButton');
    if (submitButton) {
        submitButton.disabled = true;
        submitButton.classList.add('loading');
        submitButton.textContent = 'Wird verarbeitet...';
    }
    
    // Collect form data
    const formData = new FormData(event.target);
    const leadData = Object.fromEntries(formData.entries());
    
    // Enrich lead data
    const enrichedLead = enrichLead(leadData);
    
    // Send to backend
    submitLeadToBackend(enrichedLead)
        .then(response => {
            if (response.success) {
                // Track successful submission
                trackLeadSubmission(enrichedLead, response);
                
                // Redirect to affiliate or thank you page
                setTimeout(() => {
                    window.location.href = response.redirect_url || '/danke';
                }, 500);
            } else {
                handleSubmissionError(response.error || 'Ein unbekannter Fehler ist aufgetreten');
            }
        })
        .catch(error => {
            console.error('Submission error:', error);
            handleSubmissionError('Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.');
        })
        .finally(() => {
            // Reset loading state
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.classList.remove('loading');
                submitButton.textContent = '🚀 Jetzt kostenlos vergleichen und sparen';
            }
        });
}

function enrichLead(leadData) {
    // Get affiliate routing
    const routing = affiliateRouter.routeLead(leadData);
    
    // Calculate estimated savings
    const savings = calculateEstimatedSavings(leadData.verbrauch);
    
    // Enrich with additional data
    return {
        ...leadData,
        timestamp: new Date().toISOString(),
        source: window.location.hostname,
        page_url: window.location.href,
        user_agent: navigator.userAgent,
        screen_resolution: `${window.screen.width}x${window.screen.height}`,
        estimated_savings: savings,
        affiliate_routing: routing,
        lead_score: routing.lead_score,
        session_id: routing.session_id || generateSessionId(),
        utm_source: getUrlParameter('utm_source'),
        utm_medium: getUrlParameter('utm_medium'),
        utm_campaign: getUrlParameter('utm_campaign'),
        referrer: document.referrer
    };
}

function submitLeadToBackend(leadData) {
    // For MVP, we'll simulate a successful submission
    // In production, this would be a real API call
    
    // Simulate API call with a promise
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            // Log the lead data to console in debug mode
            if (window.location.search.includes('debug=1')) {
                console.log('📨 Lead Data Submission:', leadData);
            }
            
            // Generate affiliate URL
            const affiliateUrl = affiliateRouter.generateAffiliateUrl(
                leadData, 
                leadData.affiliate_routing
            );
            
            // Simulate successful response
            resolve({
                success: true,
                lead_id: leadData.session_id,
                redirect_url: affiliateUrl,
                affiliate: leadData.affiliate_routing.primary,
                commission: leadData.affiliate_routing.commission
            });
            
            // For testing error handling, uncomment:
            // reject(new Error('Test error'));
        }, 1500); // Simulate network delay
    });
    
    /* 
    // Real API implementation would look like this:
    return fetch('/api/submit-lead', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(leadData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    });
    */
}

function handleSubmissionError(errorMessage) {
    // Show error message to user
    alert(errorMessage);
    
    // Log error
    console.error('Form submission error:', errorMessage);
}

function trackLeadSubmission(leadData, response) {
    // Google Analytics 4
    if (typeof gtag !== 'undefined') {
        gtag('event', 'generate_lead', {
            'event_category': 'conversion',
            'event_label': leadData.affiliate_routing.primary,
            'value': parseInt(leadData.affiliate_routing.commission.replace(/[^0-9]/g, '')) || 20,
            'lead_score': leadData.lead_score,
            'estimated_savings': leadData.estimated_savings
        });
    }
    
    // Facebook Pixel
    if (typeof fbq !== 'undefined') {
        fbq('track', 'Lead', {
            value: leadData.estimated_savings,
            currency: 'EUR',
            content_name: 'Stromtarif Lead'
        });
    }
    
    // Store lead in localStorage for debugging
    try {
        const leads = JSON.parse(localStorage.getItem('submitted_leads') || '[]');
        leads.push({
            timestamp: new Date().toISOString(),
            lead_id: response.lead_id,
            affiliate: response.affiliate,
            lead_score: leadData.lead_score
        });
        localStorage.setItem('submitted_leads', JSON.stringify(leads.slice(-10))); // Keep last 10
    } catch (error) {
        console.log('Storage error:', error);
    }
}

// Helper functions
function calculateSavings() {
    const verbrauchField = document.getElementById('verbrauch');
    const savingsAmount = document.getElementById('savingsAmount');
    const currentCost = document.getElementById('currentCost');
    const optimizedCost = document.getElementById('optimizedCost');
    
    if (verbrauchField && savingsAmount) {
        const verbrauch = parseInt(verbrauchField.value) || 3500;
        const savings = calculateEstimatedSavings(verbrauch);
        
        savingsAmount.textContent = `${savings}€`;
        
        if (currentCost && optimizedCost) {
            const current = Math.round(verbrauch * 0.35);
            const optimized = Math.round(verbrauch * 0.25);
            
            currentCost.textContent = `€${current}`;
            optimizedCost.textContent = `€${optimized}`;
        }
    }
}

function calculateEstimatedSavings(verbrauch) {
    const consumption = parseInt(verbrauch) || 3500;
    const currentPrice = 0.35; // €/kWh
    const optimizedPrice = 0.25; // €/kWh
    return Math.round((currentPrice - optimizedPrice) * consumption);
}

function updateConsumptionHint() {
    const haushaltsgroesse = document.getElementById('haushaltsgroesse').value;
    const verbrauchField = document.getElementById('verbrauch');
    
    if (!verbrauchField || verbrauchField.value) return;
    
    const hints = {
        '1': 2000,
        '2': 3500,
        '3-4': 4500,
        '5+': 6000
    };
    
    if (hints[haushaltsgroesse]) {
        verbrauchField.value = hints[haushaltsgroesse];
        calculateSavings();
    }
}

function toggleCheckbox(id) {
    const checkbox = document.getElementById(id);
    if (checkbox) {
        checkbox.checked = !checkbox.checked;
        
        // Update affiliate routing if needed
        if (id === 'eauto' || id === 'smartmeter') {
            updateAffiliateRouting();
        }
    }
}

function updateAffiliateRouting() {
    // Only if we're in a form context
    const leadForm = document.getElementById('leadForm');
    if (!leadForm) return;
    
    // Get form data
    const formData = new FormData(leadForm);
    const leadData = Object.fromEntries(formData.entries());
    
    // Get routing
    const routing = affiliateRouter.routeLead(leadData);
    
    // Update UI if debug elements exist
    if (document.getElementById('routingInfo')) {
        document.getElementById('recommendedAffiliate').textContent = routing.affiliate_info.name;
        document.getElementById('expectedCommission').textContent = `€${routing.commission}`;
        document.getElementById('routingReason').textContent = routing.reason;
        document.getElementById('leadScore').textContent = routing.lead_score;
        
        // Update button style based on lead score
        const submitButton = document.getElementById('submitButton');
        if (submitButton) {
            if (routing.lead_score >= 80) {
                submitButton.style.background = routing.affiliate_info.color || 'linear-gradient(135deg, #28a745 0%, #20c997 100%)';
                submitButton.innerHTML = '🌟 Premium-Tarife finden';
            } else if (routing.lead_score >= 60) {
                submitButton.style.background = routing.affiliate_info.color || 'linear-gradient(135deg, #007bff 0%, #6610f2 100%)';
                submitButton.innerHTML = '⚡ Beste Tarife finden';
            } else {
                submitButton.style.background = 'linear-gradient(135deg, #28a745 0%, #20c997 100%)';
                submitButton.innerHTML = '🚀 Jetzt kostenlos vergleichen und sparen';
            }
        }
    }
}

function updateRegionalInfo() {
    const plzField = document.getElementById('plz');
    if (!plzField || !plzField.value || plzField.value.length !== 5) return;
    
    // In a real implementation, this would fetch regional data
    // For MVP, we'll just simulate it
    const plz = plzField.value;
    
    // Get first digit to determine region
    const regionCode = plz.charAt(0);
    const regions = {
        '0': 'Ostdeutschland',
        '1': 'Berlin/Brandenburg',
        '2': 'Hamburg/Schleswig-Holstein',
        '3': 'Niedersachsen',
        '4': 'Nordrhein-Westfalen (Nord)',
        '5': 'Nordrhein-Westfalen (Süd)',
        '6': 'Hessen',
        '7': 'Baden-Württemberg',
        '8': 'Bayern',
        '9': 'Bayern (Süd)'
    };
    
    const region = regions[regionCode] || 'Deutschland';
    
    // Update regional info if element exists
    const regionalInfo = document.getElementById('regionalInfo');
    if (regionalInfo) {
        regionalInfo.textContent = `Region: ${region}`;
        regionalInfo.style.display = 'block';
    }
}

function generateSessionId() {
    return 'lead_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
}

function getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name) || '';
}

// Cookie Consent Banner
function initCookieBanner() {
    const cookieBanner = document.getElementById('cookieBanner');
    if (!cookieBanner) return;
    
    // Check if user has already made a choice
    const cookieConsent = getCookie('cookie_consent');
    
    if (!cookieConsent) {
        // Show banner with animation after a short delay
        setTimeout(() => {
            cookieBanner.classList.add('show');
        }, 1000);
    }
}

function acceptCookies() {
    setCookie('cookie_consent', 'accepted', 365);
    hideCookieBanner();
    
    // Enable tracking cookies
    enableTracking();
}

function rejectCookies() {
    setCookie('cookie_consent', 'rejected', 365);
    hideCookieBanner();
    
    // Disable tracking cookies
    disableTracking();
}

function hideCookieBanner() {
    const cookieBanner = document.getElementById('cookieBanner');
    if (cookieBanner) {
        cookieBanner.classList.remove('show');
    }
}

function enableTracking() {
    // Enable Google Analytics
    if (typeof gtag !== 'undefined') {
        gtag('consent', 'update', {
            'analytics_storage': 'granted',
            'ad_storage': 'granted'
        });
    }
    
    // Enable Facebook Pixel
    if (typeof fbq !== 'undefined') {
        fbq('consent', 'grant');
    }
}

function disableTracking() {
    // Disable Google Analytics
    if (typeof gtag !== 'undefined') {
        gtag('consent', 'update', {
            'analytics_storage': 'denied',
            'ad_storage': 'denied'
        });
    }
    
    // Disable Facebook Pixel
    if (typeof fbq !== 'undefined') {
        fbq('consent', 'revoke');
    }
}

function setCookie(name, value, days) {
    let expires = '';
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = '; expires=' + date.toUTCString();
    }
    document.cookie = name + '=' + value + expires + '; path=/; SameSite=Lax';
}

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

