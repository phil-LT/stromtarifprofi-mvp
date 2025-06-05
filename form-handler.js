// Enhanced Form Handler with LeadHub Professional API Integration
// Version: 2.0 - Direct API Integration

console.log('🚀 Form Handler v2.0 - LeadHub API Integration loaded');

// Konfiguration
const CONFIG = {
    LEADHUB_API_BASE: 'http://3.77.229.60:7860',
    DEBUG_MODE: window.location.search.includes('debug=1' ),
    FALLBACK_ENABLED: true
};

// Debug-Logging
function debugLog(message, data = null) {
    if (CONFIG.DEBUG_MODE) {
        console.log(`🔍 DEBUG: ${message}`, data);
    }
}

// Lead-Daten sammeln und anreichern
function collectLeadData() {
    const formData = new FormData(document.getElementById('leadForm'));
    
    const leadData = {
        name: formData.get('name') || '',
        email: formData.get('email') || '',
        plz: formData.get('plz') || '',
        verbrauch: formData.get('verbrauch') || '',
        haushaltsgroesse: formData.get('haushaltsgroesse') || '1-2 Personen',
        e_auto: formData.get('e_auto') === 'on' || false,
        smart_meter: formData.get('smart_meter') === 'on' || false,
        timestamp: new Date().toISOString(),
        source: 'Website',
        utm_source: new URLSearchParams(window.location.search).get('utm_source'),
        utm_medium: new URLSearchParams(window.location.search).get('utm_medium'),
        utm_campaign: new URLSearchParams(window.location.search).get('utm_campaign')
    };
    
    debugLog('Lead-Daten gesammelt:', leadData);
    return leadData;
}

// Lead an LeadHub Professional API senden
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

// Lokale Lead-Speicherung (Fallback)
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

// Affiliate-Routing bestimmen (Client-seitig als Fallback)
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

// Hauptfunktion: Lead-Submission
async function submitLead( ) {
    debugLog('🚀 Lead-Submission gestartet');
    
    try {
        // Formular-Validierung
        const form = document.getElementById('leadForm');
        if (!form.checkValidity()) {
            form.reportValidity();
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
            if (typeof gtag !== 'undefined') {
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

// Admin-Funktionen für lokale Lead-Verwaltung
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

// Event-Listener für Formular-Submission
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('leadForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            submitLead();
        });
        
        debugLog('✅ Form-Handler initialisiert');
    } else {
        console.warn('⚠️ Lead-Formular nicht gefunden');
    }
});

// Globale Funktionen für Console-Zugriff
window.showAllLeads = showAllLeads;
window.createLeadAdminPanel = createLeadAdminPanel;
window.submitLead = submitLead;

debugLog('🎯 Form Handler v2.0 vollständig geladen');
