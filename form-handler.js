// Enhanced Form Handler - WEITERLEITUNG DEAKTIVIERT für Lead-Diagnose
// Version: 2.3 - NO REDIRECT

console.log('🚀 Form Handler v2.3 - WEITERLEITUNG DEAKTIVIERT loaded');

// Konfiguration
const CONFIG = {
    LEADHUB_API_BASE: 'http://3.77.229.60:7860',
    DEBUG_MODE: true, // PERMANENT AKTIVIERT
    FALLBACK_ENABLED: true,
    REDIRECT_DISABLED: true // WEITERLEITUNG KOMPLETT DEAKTIVIERT
};

// Multi-step form navigation
let currentStep = 1;
const totalSteps = 3;

// Debug-Logging
function debugLog(message, data = null ) {
    console.log(`🔍 DEBUG: ${message}`, data);
}

// Initialize form functionality
document.addEventListener('DOMContentLoaded', function() {
    initFormSteps();
    initCookieBanner();
    calculateSavings();
    
    const leadForm = document.getElementById('leadForm');
    if (leadForm) {
        leadForm.addEventListener('submit', handleFormSubmit);
        debugLog('✅ Form-Handler initialisiert');
    } else {
        console.warn('⚠️ Lead-Formular nicht gefunden');
    }
    
    console.log('📊 LEAD-DIAGNOSE VERFÜGBAR:');
    console.log('- showAllLeads() → Alle lokalen Leads anzeigen');
    console.log('- createLeadAdminPanel() → Statistiken anzeigen');
    console.log('- testLeadHubAPI() → API-Test durchführen');
});

// Multi-step form navigation
function initFormSteps() {
    showStep(currentStep);
    updateProgress();
}

function showStep(step) {
    document.querySelectorAll('.form-step').forEach(el => {
        el.style.display = 'none';
        el.classList.remove('active');
    });
    
    const currentStepEl = document.getElementById(`step${step}`);
    if (currentStepEl) {
        currentStepEl.style.display = 'block';
        currentStepEl.classList.add('active');
    }
    
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
    if (!localStorage.getItem('cookieConsent') && banner) {
        banner.style.display = 'block';
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
        debugLog('✅ LeadHub API Response:', result);
        return result;
        
    } catch (error) {
        console.error('❌ LeadHub API Error:', error);
        
        if (CONFIG.FALLBACK_ENABLED) {
            debugLog('Aktiviere Fallback: Lokale Speicherung');
            saveLeadLocally(leadData);
            
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
        
        console.log('📊 AKTUELLE LEAD-STATISTIKEN:');
        createLeadAdminPanel();
        
    } catch (error) {
        console.error('❌ Lokale Speicherung fehlgeschlagen:', error);
    }
}

// Affiliate routing determination
function determineAffiliateRouting(leadData) {
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

// Form submission handler - WEITERLEITUNG DEAKTIVIERT
async function handleFormSubmit(e ) {
    e.preventDefault();
    debugLog('🚀 Lead-Submission gestartet');
    
    try {
        if (!validateCurrentStep()) {
            return;
        }
        
        const leadData = collectLeadData();
        
        const submitButton = document.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.textContent = 'Wird verarbeitet...';
        
        try {
            const response = await submitLeadToLeadHub(leadData);
            
            debugLog('Lead erfolgreich verarbeitet:', response);
            
            if (typeof gtag !== 'undefined' && localStorage.getItem('cookieConsent') === 'accepted') {
                gtag('event', 'lead_submission', {
                    'event_category': 'Lead',
                    'event_label': response.affiliate,
                    'value': 1
                });
            }
            
            // WEITERLEITUNG DEAKTIVIERT - Nur Erfolgs-Feedback
            alert(`✅ Lead erfolgreich verarbeitet!\n\nLead-ID: ${response.lead_id}\nAffiliate: ${response.affiliate}\n\n🔍 DIAGNOSE:\n- Prüfen Sie die Browser-Console für Details\n- Verwenden Sie showAllLeads() für lokale Leads\n- Prüfen Sie LeadHub: ${CONFIG.LEADHUB_API_BASE}\n\n⚠️ WEITERLEITUNG DEAKTIVIERT für Diagnose`);
            
            // KEINE WEITERLEITUNG
            debugLog('🚫 Weiterleitung deaktiviert für Diagnose-Zwecke');
            
        } catch (error) {
            console.error('❌ Lead-Submission fehlgeschlagen:', error);
            alert(`❌ Lead-Submission fehlgeschlagen!\n\nFehler: ${error.message}\n\n🔍 DIAGNOSE:\n- Prüfen Sie die Browser-Console\n- LeadHub API: ${CONFIG.LEADHUB_API_BASE}\n- Fallback: Lokale Speicherung aktiv`);
            
        } finally {
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
    debugLog('Regional info updated');
}

function updateConsumptionHint() {
    debugLog('Consumption hint updated');
}

function updateAffiliateRouting() {
    debugLog('Affiliate routing updated');
}

function acceptCookies() {
    localStorage.setItem('cookieConsent', 'accepted');
    const banner = document.getElementById('cookieBanner');
    if (banner) banner.style.display = 'none';
    
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
    console.log('📊 ALLE LOKALEN LEADS:');
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
    
    console.log('📊 LEAD-STATISTIKEN:', stats);
    console.table(leads);
    
    return stats;
}

// API-Diagnose-Funktionen
function testLeadHubAPI() {
    console.log('🔍 Teste LeadHub API...');
    fetch(`${CONFIG.LEADHUB_API_BASE}/api/leads/stats`)
        .then(response => {
            if (response.ok) {
                return response.json();
            }
            throw new Error(`HTTP ${response.status}`);
        })
        .then(data => {
            console.log('✅ LeadHub API erreichbar:', data);
        })
        .catch(error => {
            console.error('❌ LeadHub API nicht erreichbar:', error);
        });
}

// Global functions
window.showAllLeads = showAllLeads;
window.createLeadAdminPanel = createLeadAdminPanel;
window.testLeadHubAPI = testLeadHubAPI;
window.nextStep = nextStep;
window.prevStep = prevStep;
window.toggleCheckbox = toggleCheckbox;
window.updateRegionalInfo = updateRegionalInfo;
window.updateConsumptionHint = updateConsumptionHint;
window.updateAffiliateRouting = updateAffiliateRouting;
window.acceptCookies = acceptCookies;
window.rejectCookies = rejectCookies;
window.handleFormSubmit = handleFormSubmit;

debugLog('🎯 Form Handler v2.3 vollständig geladen (WEITERLEITUNG DEAKTIVIERT)');
