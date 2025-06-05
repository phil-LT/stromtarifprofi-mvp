// Enhanced Form Handler with LeadHub Professional API Integration
// Version: 2.0 - Direct API Integration

console.log('🚀 Form Handler v2.0 - LeadHub API Integration loaded');

// Konfiguration
const CONFIG = {
    LEADHUB_API_BASE: 'http://3.77.229.60:7860',
    DEBUG_MODE: window.location.search.includes('debug=1' ),
    FALLBACK_ENABLED: true
};

// Lead an LeadHub Professional API senden
async function submitLeadToLeadHub(leadData) {
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
        
        return await response.json();
        
    } catch (error) {
        console.error('❌ LeadHub API Error:', error);
        // Fallback: Lokale Speicherung
        saveLeadLocally(leadData);
        return {
            success: true,
            lead_id: Date.now(),
            message: 'Lead lokal gespeichert (Fallback)',
            redirect_url: 'https://www.check24.de/strom/',
            affiliate: 'CHECK24'
        };
    }
}

// Rest des Codes...
