// Enhanced Form Handler with LeadHub Professional API Integration + Multi-Step Functionality
// Version: 2.2 - Fixed for existing HTML structure

console.log('🚀 Form Handler v2.2 - LeadHub API + Multi-Step (Fixed) loaded');

// Konfiguration
const CONFIG = {
    LEADHUB_API_BASE: 'http://3.77.229.60:7860',
    DEBUG_MODE: window.location.search.includes('debug=1' ),
    FALLBACK_ENABLED: true
};

// Multi-step form navigation
let currentStep = 1;
const totalSteps = 3;

// Debug-Logging
function debugLog(message, data = null) {
    if (CONFIG.DEBUG_MODE) {
        console.log(`🔍 DEBUG: ${message}`, data);
    }
}

// Initialize form functionality
document.addEventListener('DOMContentLoaded', function() {
    initFormSteps();
    initCookieBanner();
    calculateSavings();
    
    // Set up form submission
    const leadForm = document.getElementById('leadForm');
    if (leadForm) {
        leadForm.addEventListener('submit', handleFormSubmit);
        debugLog('✅ Form-Handler initialisiert');
    } else {
        console.warn('⚠️ Lead-Formular nicht gefunden');
    }
});

// Multi-step form navigation - FIXED for existing HTML structure
function initFormSteps() {
    // Show first step initially
    showStep(currentStep);
    
    // Update progress indicators if they exist
    updateProgress();
}

function showStep(step) {
    // Hide all steps - FIXED selectors for existing HTML
    document.querySelectorAll('.form-step').forEach(el => {
        el.style.display = 'none';
        el.classList.remove('active');
    });
    
    // Show current step - FIXED to use existing IDs
    const currentStepEl = document.getElementById(`step${step}`);
    if (currentStepEl) {
        currentStepEl.style.display = 'block';
        currentStepEl.classList.add('active');
    }
    
    // Update progress indicators if they exist
    updateProgress();
}

function updateProgress() {
    const progressIndicators = document.querySelectorAll('.progress-step');
    progressIndicators.forEach((indicator, index) => {
        if (index < currentStep) {
            indicator.classList.add('completed');
            indicator.classList.remove('active');
        } else if (index === currentStep - 1) {
            indicator.classList.add('active');
            indicator.classList.remove('completed');
        } else {
            indicator.classList.remove('active', 'completed');
        }
    });
}

// Cookie banner functionality
function initCookieBanner() {
    const banner = document.getElementById('cookieBanner');
    const acceptBtn = document.getElementById('acceptCookies');
    const rejectBtn = document.getElementById('rejectCookies');
    
    // Show banner if no consent given
    if (!localStorage.getItem('cookieConsent')) {
        if (banner) banner.style.display = 'block';
    }
    
    if (acceptBtn) {
        acceptBtn.addEventListener('click', function() {
            localStorage.setItem('cookieConsent', 'accepted');
            if (banner) banner.style.display = 'none';
            
            // Initialize analytics if accepted
            if (typeof gtag !== 'undefined') {
                gtag('consent', 'update', {
                    'analytics_storage': 'granted'
                });
            }
        });
    }
    
    if (rejectBtn) {
        rejectBtn.addEventListener('click', function() {
            localStorage.setItem('cookieConsent', 'rejected');
            if (banner) banner.style.display = 'none';
        });
    }
}

// Calculate savings functionality
function calculateSavings() {
    const verbrauchInput = document.querySelector('input[name="verbrauch"]');
    if (verbrauchInput) {
        verbrauchInput.addEventListener('input', function() {
            const verbrauch = parseInt(this.value) || 3500;
            const currentCost = Math.round(verbrauch * 0.35);
            const optimizedCost = Math.round(verbrauch * 0.25);
            const savings = currentCost - optimizedCost;
            
            // Update savings display
            const currentCostEl = document.querySelector('.current-cost');
            const optimizedCostEl = document.querySelector('.optimized-cost');
            const savingsEl = document.querySelector('.savings-amount');
            
            if (currentCostEl) currentCostEl.textContent = `€${currentCost}`;
            if (optimizedCostEl) optimizedCostEl.textContent = `€${optimizedCost}`;
            if (savingsEl) savingsEl.textContent = `€${savings}`;
        });
    }
}

// Navigation functions
function nextStep() {
    if (validateCurrentStep()) {
        if (currentStep < totalSteps) {
            currentStep++;
            showStep(currentStep);
        }
    }
}

function prevStep() {
    if (currentStep > 1) {
        currentStep--;
        showStep(currentStep);
    }
}

function validateCurrentStep() {
    const currentStepEl = document.getElementById(`step${currentStep}`);
    if (!currentStepEl) return true;
    
    const requiredFields = currentStepEl.querySelectorAll('input[required], select[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            field.classList.add('error');
            isValid = false;
        } else {
            field.classList.remove('error');
        }
    });
    
    return isValid;
}

// Lead data collection
function collectLeadData() {
    const formData = new FormData(document.getElementById('leadForm'));
    
    const leadData = {
        name: formData.get('name') || '',
        email: formData.get('email') || '',
        plz: formData.get('plz') || '',
        verbrauch: formData.get('verbrauch') || '',
        haushaltsgroesse: formData.get('haushaltsgroesse') || '1-2 Personen',
        e_auto: formData.get('eauto') === 'on' || false,
        smart_meter: formData.get('smartmeter') === 'on' || false,
        timestamp: new Date().toISOString(),
        source: 'Website',
        utm_source: new URLSearchParams(window.location.search).get('utm_source'),
        utm_medium: new URLSearchParams(window.location.search).get('utm_medium'),
        utm_campaign: new URLSearchParams(window.location.search).get('utm_campaign')
    };
    
    debugLog('Lead-Daten gesammelt:', leadData);
    return leadData;
}

// Lead submission to LeadHub API
async function submitLeadToLeadHub(leadData) {
    debugLog('Sende Lead an LeadHub API...', leadData);
    
    try {
        const response = await fetch(`${CONFIG.LEADHUB_API_BASE}/api/submit-lead`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(leadData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        debugLog('LeadHub API Response:', result);
        
        return result;
        
    } catch (error) {
        console.error('❌ LeadHub API Error:', error);
        
        // Fallback: Lokale Speicherung
        if (CONFIG.FALLBACK_ENABLED) {
            debugLog('Aktiviere Fallback: Lokale Speicherung');
            saveLeadLocally(leadData);
            
            // Simuliere erfolgreiche Response für Affiliate-Routing
            return {
                success: true,
                lead_id: Date.now(),
                message: 'Lead lokal gespeichert (Fallback)',
                redirect_url: determineAffiliateRouting(leadData).redirect_url,
                affiliate: determineAffiliateRouting(leadData).affiliate
            };
        }
        
        throw error;
    }
}

// Local lead storage (fallback)
function saveLeadLocally(leadData) {
    try {
        let leads = JSON.parse(localStorage.getItem('leads') || '[]');
        leads.push({
            ...leadData,
            id: Date.now(),
            fallback: true
        });
        localStorage.setItem('leads', JSON.stringify(leads));
        console.log('💾 Lead lokal gespeichert:', leadData);
    } catch (error) {
        console.error('❌ Lokale Speicherung fehlgeschlagen:', error);
    }
}

// Affiliate routing determination
function determineAffiliateRouting(leadData) {
    // Lead-Score berechnen
    let score = 50;
    
    try {
        const verbrauch = parseInt(leadData.verbrauch.replace(/\D/g, ''));
        if (verbrauch > 4000) score += 20;
        else if (verbrauch > 2500) score += 10;
    } catch (e) {
        debugLog('Verbrauch-Parsing fehlgeschlagen:', leadData.verbrauch);
    }
    
    if (leadData.e_auto) score += 25;
    if (leadData.smart_meter) score += 15;
    
    // Routing-Entscheidung
    if (leadData.e_auto || leadData.smart_meter || score >= 80) {
        return {
            affiliate: 'RABOT Energy',
            redirect_url: 'https://www.rabot-charge.de/stromtarif/',
            commission: '30-80'
        };
    } else if (score >= 60 ) {
        return {
            affiliate: 'CHECK24',
            redirect_url: 'https://www.check24.de/strom/',
            commission: '20'
        };
    } else {
        return {
            affiliate: 'VERIVOX',
            redirect_url: 'https://www.verivox.de/strom/',
            commission: '20'
        };
    }
}

// Form submission handler
async function handleFormSubmit(e ) {
    e.preventDefault();
    debugLog('🚀 Lead-Submission gestartet');
    
    try {
        // Final validation
        if (!validateCurrentStep()) {
            return;
        }
        
        // Lead-Daten sammeln
        const leadData = collectLeadData();
        
        // Submit-Button deaktivieren
        const submitButton = document.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.textContent = 'Wird verarbeitet...';
        
        try {
            // Lead an LeadHub API senden
            const response = await submitLeadToLeadHub(leadData);
            
            debugLog('Lead erfolgreich verarbeitet:', response);
            
            // Analytics-Event senden (falls verfügbar)
            if (typeof gtag !== 'undefined' && localStorage.getItem('cookieConsent') === 'accepted') {
                gtag('event', 'lead_submission', {
                    'event_category': 'Lead',
                    'event_label': response.affiliate,
                    'value': 1
                });
            }
            
            // Erfolgs-Feedback
            if (CONFIG.DEBUG_MODE) {
                alert(`✅ Lead erfolgreich verarbeitet!\n\nLead-ID: ${response.lead_id}\nAffiliate: ${response.affiliate}\nWeiterleitung: ${response.redirect_url}`);
            }
            
            // Weiterleitung nach kurzer Verzögerung
            setTimeout(() => {
                if (response.redirect_url && !CONFIG.DEBUG_MODE) {
                    window.location.href = response.redirect_url;
                } else {
                    debugLog('Weiterleitung deaktiviert (Debug-Modus)');
                }
            }, 1000);
            
        } catch (error) {
            console.error('❌ Lead-Submission fehlgeschlagen:', error);
            
            // Fehler-Feedback
            alert('❌ Es gab ein Problem bei der Übertragung. Bitte versuchen Sie es erneut oder kontaktieren Sie uns direkt.');
            
        } finally {
            // Submit-Button wieder aktivieren
            submitButton.disabled = false;
            submitButton.textContent = originalText;
        }
        
    } catch (error) {
        console.error('❌ Unerwarteter Fehler:', error);
    }
}

// Helper functions for existing HTML
function toggleCheckbox(checkboxId) {
    const checkbox = document.getElementById(checkboxId);
    if (checkbox) {
        checkbox.checked = !checkbox.checked;
        updateAffiliateRouting();
    }
}

function updateRegionalInfo() {
    // Placeholder for regional info updates
    debugLog('Regional info updated');
}

function updateConsumptionHint() {
    // Placeholder for consumption hint updates
    debugLog('Consumption hint updated');
}

function updateAffiliateRouting() {
    // Placeholder for affiliate routing updates
    debugLog('Affiliate routing updated');
}

function acceptCookies() {
    localStorage.setItem('cookieConsent', 'accepted');
    const banner = document.getElementById('cookieBanner');
    if (banner) banner.style.display = 'none';
    
    // Initialize analytics if accepted
    if (typeof gtag !== 'undefined') {
        gtag('consent', 'update', {
            'analytics_storage': 'granted'
        });
    }
}

function rejectCookies() {
    localStorage.setItem('cookieConsent', 'rejected');
    const banner = document.getElementById('cookieBanner');
    if (banner) banner.style.display = 'none';
}

// Admin functions for local lead management
function showAllLeads() {
    const leads = JSON.parse(localStorage.getItem('leads') || '[]');
    console.table(leads);
    return leads;
}

function createLeadAdminPanel() {
    const leads = JSON.parse(localStorage.getItem('leads') || '[]');
    
    const stats = {
        total: leads.length,
        today: leads.filter(l => new Date(l.timestamp).toDateString() === new Date().toDateString()).length,
        thisWeek: leads.filter(l => {
            const leadDate = new Date(l.timestamp);
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return leadDate > weekAgo;
        }).length,
        fallback: leads.filter(l => l.fallback).length
    };
    
    console.log('📊 Lead-Statistiken:', stats);
    console.table(leads);
    
    return stats;
}

// Global functions for console access and existing HTML compatibility
window.showAllLeads = showAllLeads;
window.createLeadAdminPanel = createLeadAdminPanel;
window.nextStep = nextStep;
window.prevStep = prevStep;
window.toggleCheckbox = toggleCheckbox;
window.updateRegionalInfo = updateRegionalInfo;
window.updateConsumptionHint = updateConsumptionHint;
window.updateAffiliateRouting = updateAffiliateRouting;
window.acceptCookies = acceptCookies;
window.rejectCookies = rejectCookies;
window.handleFormSubmit = handleFormSubmit;

debugLog('🎯 Form Handler v2.2 vollständig geladen (Fixed for existing HTML)');
