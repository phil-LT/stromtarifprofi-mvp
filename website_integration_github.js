/**
 * LeadHub Professional - Website Integration
 * Version: 1.0
 * 
 * Diese Datei enthält die Integration der LeadHub Professional API in die Website.
 * Sie kann in die bestehende form-handler.js integriert werden.
 */

// API-Konfiguration
const LEADHUB_API_CONFIG = {
    baseUrl: 'http://3.77.229.60:8000', // Öffentliche IP-Adresse des Servers
    endpoints: {
        submitLead: '/api/submit-lead',
        health: '/api/health'
    },
    timeout: 5000, // Timeout in Millisekunden
    debug: false // Debug-Modus aktivieren/deaktivieren
};

// Debug-Modus prüfen
function isDebugMode() {
    // URL-Parameter prüfen
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.has('debug') || LEADHUB_API_CONFIG.debug;
}

// Debug-Ausgabe
function debugLog(...args) {
    if (isDebugMode()) {
        console.log('[LeadHub API]', ...args);
    }
}

// API-Status prüfen
async function checkApiStatus() {
    try {
        const response = await fetch(`${LEADHUB_API_CONFIG.baseUrl}${LEADHUB_API_CONFIG.endpoints.health}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        debugLog('API-Status:', result);
        
        return {
            online: true,
            status: result.status,
            version: result.version,
            leads_count: result.leads_count
        };
    } catch (error) {
        debugLog('API-Status-Fehler:', error);
        
        return {
            online: false,
            error: error.message
        };
    }
}

// Lead an API senden
async function submitLeadToAPI(leadData) {
    try {
        debugLog('Sende Lead an API:', leadData);
        
        // Timeout-Promise erstellen
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('API-Anfrage Timeout')), LEADHUB_API_CONFIG.timeout);
        });
        
        // API-Anfrage-Promise erstellen
        const fetchPromise = fetch(`${LEADHUB_API_CONFIG.baseUrl}${LEADHUB_API_CONFIG.endpoints.submitLead}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(leadData)
        });
        
        // Race zwischen Timeout und API-Anfrage
        const response = await Promise.race([fetchPromise, timeoutPromise]);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        debugLog('API-Antwort:', result);
        
        return result;
    } catch (error) {
        debugLog('API-Anfrage-Fehler:', error);
        
        return {
            success: false,
            message: `API-Fehler: ${error.message}`,
            error: error
        };
    }
}

// Lead lokal verarbeiten (Fallback)
function handleLeadLocally(leadData) {
    debugLog('Verarbeite Lead lokal (Fallback):', leadData);
    
    // Lead-Score berechnen
    const leadScore = calculateLeadScore(leadData);
    
    // Affiliate bestimmen
    const affiliate = determineAffiliate(leadData, leadScore);
    
    // Affiliate-URL generieren
    const redirectUrl = generateAffiliateUrl(affiliate, leadData);
    
    // Lead lokal speichern
    saveLeadLocally(leadData, affiliate, leadScore);
    
    // Zu Affiliate weiterleiten
    debugLog('Leite weiter zu:', redirectUrl);
    window.location.href = redirectUrl;
}

// Lead-Score berechnen
function calculateLeadScore(leadData) {
    let score = 50; // Basis-Score
    
    // Verbrauch
    const verbrauch = parseInt(leadData.verbrauch) || 0;
    if (verbrauch > 5000) {
        score += 20;
    } else if (verbrauch > 3500) {
        score += 15;
    } else if (verbrauch > 2500) {
        score += 10;
    }
    
    // Personen im Haushalt
    const personen = parseInt(leadData.personen) || 0;
    if (personen >= 4) {
        score += 15;
    } else if (personen >= 2) {
        score += 10;
    }
    
    // E-Auto und Smart Meter
    if (leadData.e_auto) {
        score += 25;
    }
    if (leadData.smart_meter) {
        score += 15;
    }
    
    // Kontaktdaten
    if (leadData.email) {
        score += 5;
    }
    if (leadData.phone) {
        score += 5;
    }
    if (leadData.plz) {
        score += 5;
    }
    
    // Score begrenzen
    return Math.max(1, Math.min(100, score));
}

// Affiliate bestimmen
function determineAffiliate(leadData, leadScore) {
    // E-Auto-Leads zu RABOT
    if (leadData.e_auto) {
        return 'RABOT';
    }
    
    // Hoher Verbrauch zu CHECK24
    const verbrauch = parseInt(leadData.verbrauch) || 0;
    if (verbrauch > 4000) {
        return 'CHECK24';
    }
    
    // Standard zu CHECK24
    return 'CHECK24';
}

// Affiliate-URL generieren
function generateAffiliateUrl(affiliate, leadData) {
    // Affiliate-URLs
    const affiliateUrls = {
        CHECK24: 'https://www.check24.de/strom/',
        VERIVOX: 'https://www.verivox.de/stromvergleich/',
        RABOT: 'https://www.rabot-charge.de/'
    };
    
    // Basis-URL abrufen
    let url = affiliateUrls[affiliate] || affiliateUrls.CHECK24;
    
    // Parameter für die URL vorbereiten
    const params = {};
    
    // Lead-Daten als Parameter hinzufügen
    if (leadData.plz) {
        params.plz = leadData.plz;
    }
    if (leadData.verbrauch) {
        params.verbrauch = leadData.verbrauch;
    }
    if (leadData.personen) {
        params.personen = leadData.personen;
    }
    
    // UTM-Parameter hinzufügen
    params.utm_source = 'leadhub';
    params.utm_medium = 'affiliate';
    params.utm_campaign = `leadhub_${affiliate.toLowerCase()}`;
    params.utm_content = 'lead_form';
    
    // Parameter zur URL hinzufügen
    const separator = url.includes('?') ? '&' : '?';
    url += separator + Object.entries(params)
        .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
        .join('&');
    
    return url;
}

// Lead lokal speichern
function saveLeadLocally(leadData, affiliate, leadScore) {
    // Lead-Tracking-Daten
    const trackingData = {
        ...leadData,
        affiliate: affiliate,
        lead_score: leadScore,
        timestamp: new Date().toISOString(),
        source: getLeadSource(),
        session_id: getSessionId()
    };
    
    // Lead-Tracking-Daten speichern
    let leadTracking = JSON.parse(localStorage.getItem('lead_tracking') || '[]');
    leadTracking.push(trackingData);
    localStorage.setItem('lead_tracking', JSON.stringify(leadTracking));
    
    // Lead-Statistiken aktualisieren
    updateLeadStatistics(affiliate);
}

// Lead-Quelle ermitteln
function getLeadSource() {
    // URL-Parameter prüfen
    const urlParams = new URLSearchParams(window.location.search);
    const utmSource = urlParams.get('utm_source');
    const utmMedium = urlParams.get('utm_medium');
    const utmCampaign = urlParams.get('utm_campaign');
    
    if (utmSource) {
        return `${utmSource}${utmMedium ? '_' + utmMedium : ''}${utmCampaign ? '_' + utmCampaign : ''}`;
    }
    
    // Referrer prüfen
    const referrer = document.referrer;
    if (referrer) {
        try {
            const referrerUrl = new URL(referrer);
            return referrerUrl.hostname;
        } catch (error) {
            // Ungültige URL
        }
    }
    
    // Fallback
    return 'direct';
}

// Session-ID generieren oder abrufen
function getSessionId() {
    let sessionId = sessionStorage.getItem('session_id');
    
    if (!sessionId) {
        sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
        sessionStorage.setItem('session_id', sessionId);
    }
    
    return sessionId;
}

// Lead-Statistiken aktualisieren
function updateLeadStatistics(affiliate) {
    // Lead-Statistiken abrufen
    let leadStats = JSON.parse(localStorage.getItem('lead_statistics') || '{}');
    
    // Aktuelles Datum
    const today = new Date().toISOString().split('T')[0];
    
    // Statistiken initialisieren, falls nicht vorhanden
    if (!leadStats.total) leadStats.total = 0;
    if (!leadStats.by_affiliate) leadStats.by_affiliate = {};
    if (!leadStats.by_date) leadStats.by_date = {};
    if (!leadStats.by_source) leadStats.by_source = {};
    
    // Statistiken aktualisieren
    leadStats.total++;
    leadStats.by_affiliate[affiliate] = (leadStats.by_affiliate[affiliate] || 0) + 1;
    leadStats.by_date[today] = (leadStats.by_date[today] || 0) + 1;
    
    const source = getLeadSource();
    leadStats.by_source[source] = (leadStats.by_source[source] || 0) + 1;
    
    // Statistiken speichern
    localStorage.setItem('lead_statistics', JSON.stringify(leadStats));
}

// Formular-Handler
async function handleFormSubmit(event) {
    event.preventDefault();
    
    // Formular-Daten sammeln
    const form = event.target;
    const formData = new FormData(form);
    
    // Lead-Daten erstellen
    const leadData = {
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        plz: formData.get('plz'),
        verbrauch: formData.get('verbrauch'),
        personen: formData.get('personen'),
        e_auto: formData.get('e_auto') === 'on',
        smart_meter: formData.get('smart_meter') === 'on',
        source: 'Website Form',
        notes: formData.get('notes') || 'Lead über Website-Formular erstellt'
    };
    
    // API-Status prüfen
    const apiStatus = await checkApiStatus();
    
    if (apiStatus.online) {
        // Lead an API senden
        const result = await submitLeadToAPI(leadData);
        
        if (result.success) {
            // Lead erfolgreich eingereicht
            debugLog('Lead erfolgreich eingereicht:', result);
            
            // Zu Affiliate weiterleiten
            window.location.href = result.redirect_url;
        } else {
            // Fehler beim Einreichen des Leads
            debugLog('Fehler beim Einreichen des Leads:', result.message);
            
            // Fallback: Lokale Verarbeitung
            handleLeadLocally(leadData);
        }
    } else {
        // API nicht erreichbar
        debugLog('API nicht erreichbar:', apiStatus.error);
        
        // Fallback: Lokale Verarbeitung
        handleLeadLocally(leadData);
    }
}

// Debug-Dashboard anzeigen
function showDebugDashboard() {
    if (!isDebugMode()) {
        return;
    }
    
    // Debug-Button erstellen
    const debugButton = document.createElement('button');
    debugButton.textContent = 'Debug-Dashboard anzeigen';
    debugButton.style.position = 'fixed';
    debugButton.style.bottom = '10px';
    debugButton.style.right = '10px';
    debugButton.style.zIndex = '9999';
    debugButton.style.padding = '10px';
    debugButton.style.backgroundColor = '#007bff';
    debugButton.style.color = 'white';
    debugButton.style.border = 'none';
    debugButton.style.borderRadius = '5px';
    debugButton.style.cursor = 'pointer';
    
    // Event-Listener hinzufügen
    debugButton.addEventListener('click', async function() {
        // API-Status prüfen
        const apiStatus = await checkApiStatus();
        
        // Lead-Statistiken abrufen
        const leadStats = JSON.parse(localStorage.getItem('lead_statistics') || '{}');
        
        // Lead-Tracking abrufen
        const leadTracking = JSON.parse(localStorage.getItem('lead_tracking') || '[]');
        
        // Debug-Info erstellen
        const debugInfo = {
            api_status: apiStatus,
            lead_statistics: leadStats,
            lead_tracking: leadTracking.slice(-5), // Nur die letzten 5 Leads anzeigen
            session_id: getSessionId(),
            source: getLeadSource(),
            debug_mode: isDebugMode(),
            timestamp: new Date().toISOString()
        };
        
        // Debug-Info anzeigen
        alert(JSON.stringify(debugInfo, null, 2));
    });
    
    // Button zum DOM hinzufügen
    document.body.appendChild(debugButton);
}

// Event-Listener für Formular-Absenden hinzufügen
document.addEventListener('DOMContentLoaded', function() {
    // Formular suchen
    const form = document.querySelector('form');
    
    if (form) {
        // Event-Listener hinzufügen
        form.addEventListener('submit', handleFormSubmit);
    }
    
    // Debug-Dashboard anzeigen
    showDebugDashboard();
});

// LeadHub API exportieren
window.LeadHubAPI = {
    submitLeadToAPI,
    handleLeadLocally,
    checkApiStatus,
    isDebugMode
};

