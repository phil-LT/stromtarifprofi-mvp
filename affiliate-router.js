// Multi-Affiliate Router for Stromtarifprofi.de MVP
class AffiliateRouter {
    constructor() {
        this.affiliates = {
            RABOT_ENERGY: {
                name: 'RABOT Energy',
                commission_range: '30-80',
                currency: 'EUR',
                type: 'premium',
                specialties: ['eauto', 'smartmeter', 'dynamic_pricing'],
                min_consumption: 2000,
                target_audience: 'tech_savvy',
                color: '#667eea'
            },
            CHECK24: {
                name: 'CHECK24',
                commission_range: '20',
                currency: 'EUR',
                type: 'standard',
                specialties: ['general', 'reliable', 'stornofrei'],
                min_consumption: 1000,
                target_audience: 'mainstream',
                color: '#007bff'
            },
            VERIVOX: {
                name: 'VERIVOX',
                commission_range: '20',
                currency: 'EUR',
                type: 'backup',
                specialties: ['general', 'comparison'],
                min_consumption: 1000,
                target_audience: 'price_conscious',
                color: '#28a745'
            }
        };
        
        this.routingRules = [
            {
                condition: (data) => data.eauto === 'on' || data.smartmeter === 'on',
                affiliate: 'RABOT_ENERGY',
                priority: 1,
                reason: 'Premium customer with E-Auto or Smart Meter',
                bonus_score: 30
            },
            {
                condition: (data) => parseInt(data.verbrauch) >= 4000,
                affiliate: 'CHECK24',
                priority: 2,
                reason: 'High consumption household',
                bonus_score: 20
            },
            {
                condition: (data) => parseInt(data.verbrauch) >= 2000,
                affiliate: 'CHECK24',
                priority: 3,
                reason: 'Standard household',
                bonus_score: 10
            },
            {
                condition: (data) => parseInt(data.verbrauch) < 2000,
                affiliate: 'VERIVOX',
                priority: 4,
                reason: 'Low consumption household',
                bonus_score: 5
            }
        ];
        
        this.analytics = new RoutingAnalytics();
    }
    
    routeLead(leadData) {
        // Sortiere Regeln nach Priorität
        const sortedRules = this.routingRules.sort((a, b) => a.priority - b.priority);
        
        // Finde erste passende Regel
        for (const rule of sortedRules) {
            if (rule.condition(leadData)) {
                const affiliate = this.affiliates[rule.affiliate];
                
                const routing = {
                    primary: rule.affiliate,
                    backup: this.getBackupAffiliate(rule.affiliate),
                    affiliate_info: affiliate,
                    commission: affiliate.commission_range,
                    reason: rule.reason,
                    lead_score: this.calculateLeadScore(leadData, rule.affiliate, rule.bonus_score),
                    routing_timestamp: new Date().toISOString(),
                    session_id: this.generateSessionId()
                };
                
                // Analytics tracking
                this.analytics.trackRouting(routing);
                
                return routing;
            }
        }
        
        // Fallback zu CHECK24
        const fallbackRouting = {
            primary: 'CHECK24',
            backup: 'VERIVOX',
            affiliate_info: this.affiliates.CHECK24,
            commission: this.affiliates.CHECK24.commission_range,
            reason: 'Default fallback routing',
            lead_score: this.calculateLeadScore(leadData, 'CHECK24', 0),
            routing_timestamp: new Date().toISOString(),
            session_id: this.generateSessionId()
        };
        
        this.analytics.trackRouting(fallbackRouting);
        return fallbackRouting;
    }
    
    getBackupAffiliate(primary) {
        const backupMap = {
            'RABOT_ENERGY': 'CHECK24',
            'CHECK24': 'VERIVOX',
            'VERIVOX': 'CHECK24'
        };
        return backupMap[primary] || 'CHECK24';
    }
    
    calculateLeadScore(data, affiliate, bonusScore = 0) {
        let score = 50; // Base score
        
        // Consumption-based scoring
        const consumption = parseInt(data.verbrauch) || 0;
        if (consumption > 5000) score += 25;
        else if (consumption > 3000) score += 15;
        else if (consumption > 2000) score += 10;
        
        // Premium features
        if (data.eauto === 'on') score += 30;
        if (data.smartmeter === 'on') score += 20;
        if (data.oekostrom === 'on') score += 15;
        if (data.preisgarantie === 'on') score += 10;
        
        // Contact quality
        if (data.telefon && data.telefon.length > 5) score += 10;
        if (data.name && data.name.includes(' ')) score += 5;
        
        // Household size
        if (data.haushaltsgroesse === '3-4' || data.haushaltsgroesse === '5+') score += 10;
        
        // Affiliate-specific bonuses
        if (affiliate === 'RABOT_ENERGY' && (data.eauto === 'on' || data.smartmeter === 'on')) {
            score += 20;
        }
        
        // Rule-specific bonus
        score += bonusScore;
        
        return Math.min(score, 100);
    }
    
    generateAffiliateUrl(leadData, routing) {
        const affiliate = routing.primary;
        const sessionId = routing.session_id;
        
        const urls = {
            RABOT_ENERGY: this.generateRabotEnergyUrl(leadData, sessionId),
            CHECK24: this.generateCheck24Url(leadData, sessionId),
            VERIVOX: this.generateVerivoxUrl(leadData, sessionId)
        };
        
        return urls[affiliate] || urls.CHECK24;
    }
    
    generateRabotEnergyUrl(leadData, sessionId) {
        const baseUrl = 'https://www.awin1.com/cread.php';
        const params = new URLSearchParams({
            awinmid: '70752', // RABOT Energy Merchant ID
            awinaffid: 'YOUR_AWIN_AFFILIATE_ID',
            clickref: sessionId,
            p: `https://www.rabot.energy/tarif?utm_source=stromtarifprofi&utm_campaign=mvp_launch&utm_medium=affiliate&plz=${leadData.plz}&verbrauch=${leadData.verbrauch}&ref=${sessionId}`
        });
        
        return `${baseUrl}?${params.toString()}`;
    }
    
    generateCheck24Url(leadData, sessionId) {
        const baseUrl = 'https://www.check24.de/strom/';
        const params = new URLSearchParams({
            partnerId: 'YOUR_CHECK24_PARTNER_ID',
            leadId: sessionId,
            plz: leadData.plz,
            verbrauch: leadData.verbrauch,
            utm_source: 'stromtarifprofi',
            utm_campaign: 'mvp_launch',
            utm_medium: 'affiliate'
        });
        
        return `${baseUrl}?${params.toString()}`;
    }
    
    generateVerivoxUrl(leadData, sessionId) {
        const baseUrl = 'https://www.verivox.de/stromvergleich/';
        const params = new URLSearchParams({
            partner: 'YOUR_VERIVOX_PARTNER_ID',
            ref: sessionId,
            plz: leadData.plz,
            verbrauch: leadData.verbrauch,
            utm_source: 'stromtarifprofi',
            utm_campaign: 'mvp_launch',
            utm_medium: 'affiliate'
        });
        
        return `${baseUrl}?${params.toString()}`;
    }
    
    generateSessionId() {
        return 'lead_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    }
    
    // Test-Funktionen für Debugging
    testRouting(testData) {
        console.log('Testing Affiliate Routing...');
        console.log('Input:', testData);
        
        const routing = this.routeLead(testData);
        console.log('Routing Result:', routing);
        
        const url = this.generateAffiliateUrl(testData, routing);
        console.log('Generated URL:', url);
        
        return { routing, url };
    }
}

// Routing Analytics Class
class RoutingAnalytics {
    constructor() {
        this.metrics = {
            total_routes: 0,
            affiliate_distribution: {},
            average_lead_score: 0,
            score_distribution: {
                high: 0,    // 80-100
                medium: 0,  // 60-79
                low: 0      // 0-59
            },
            routing_reasons: {}
        };
        
        this.loadMetricsFromStorage();
    }
    
    trackRouting(routing_result) {
        this.metrics.total_routes++;
        
        const affiliate = routing_result.primary;
        this.metrics.affiliate_distribution[affiliate] = 
            (this.metrics.affiliate_distribution[affiliate] || 0) + 1;
        
        // Lead Score Tracking
        this.updateAverageLeadScore(routing_result.lead_score);
        this.updateScoreDistribution(routing_result.lead_score);
        
        // Routing Reason Tracking
        const reason = routing_result.reason;
        this.metrics.routing_reasons[reason] = 
            (this.metrics.routing_reasons[reason] || 0) + 1;
        
        // Save to localStorage
        this.saveMetricsToStorage();
        
        // Send to external analytics
        this.sendToAnalytics(routing_result);
    }
    
    updateAverageLeadScore(score) {
        const total = this.metrics.total_routes;
        this.metrics.average_lead_score = 
            ((this.metrics.average_lead_score * (total - 1)) + score) / total;
    }
    
    updateScoreDistribution(score) {
        if (score >= 80) this.metrics.score_distribution.high++;
        else if (score >= 60) this.metrics.score_distribution.medium++;
        else this.metrics.score_distribution.low++;
    }
    
    sendToAnalytics(routing_result) {
        // Google Analytics 4
        if (typeof gtag !== 'undefined') {
            gtag('event', 'affiliate_routing', {
                'event_category': 'conversion',
                'event_label': routing_result.primary,
                'affiliate': routing_result.primary,
                'lead_score': routing_result.lead_score,
                'routing_reason': routing_result.reason,
                'value': parseInt(routing_result.commission.replace(/[^0-9]/g, '')) || 20
            });
        }
        
        // Facebook Pixel
        if (typeof fbq !== 'undefined') {
            fbq('trackCustom', 'LeadRouted', {
                affiliate: routing_result.primary,
                lead_score: routing_result.lead_score,
                commission: routing_result.commission
            });
        }
        
        // Custom Analytics Endpoint
        this.sendToCustomAnalytics(routing_result);
    }
    
    sendToCustomAnalytics(routing_result) {
        fetch('/api/analytics/routing', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                event: 'affiliate_routing',
                data: routing_result,
                timestamp: new Date().toISOString(),
                user_agent: navigator.userAgent,
                page_url: window.location.href
            })
        }).catch(error => {
            console.log('Analytics error:', error);
        });
    }
    
    saveMetricsToStorage() {
        try {
            localStorage.setItem('routing_metrics', JSON.stringify(this.metrics));
        } catch (error) {
            console.log('Storage error:', error);
        }
    }
    
    loadMetricsFromStorage() {
        try {
            const stored = localStorage.getItem('routing_metrics');
            if (stored) {
                this.metrics = { ...this.metrics, ...JSON.parse(stored) };
            }
        } catch (error) {
            console.log('Storage load error:', error);
        }
    }
    
    getMetrics() {
        return this.metrics;
    }
    
    getAffiliateDistributionPercentages() {
        const total = this.metrics.total_routes;
        const percentages = {};
        
        for (const [affiliate, count] of Object.entries(this.metrics.affiliate_distribution)) {
            percentages[affiliate] = ((count / total) * 100).toFixed(1);
        }
        
        return percentages;
    }
    
    getPerformanceReport() {
        return {
            total_leads: this.metrics.total_routes,
            average_score: this.metrics.average_lead_score.toFixed(1),
            affiliate_distribution: this.getAffiliateDistributionPercentages(),
            score_quality: {
                high_quality: ((this.metrics.score_distribution.high / this.metrics.total_routes) * 100).toFixed(1),
                medium_quality: ((this.metrics.score_distribution.medium / this.metrics.total_routes) * 100).toFixed(1),
                low_quality: ((this.metrics.score_distribution.low / this.metrics.total_routes) * 100).toFixed(1)
            },
            top_routing_reasons: this.getTopRoutingReasons()
        };
    }
    
    getTopRoutingReasons() {
        const sorted = Object.entries(this.metrics.routing_reasons)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5);
        
        return Object.fromEntries(sorted);
    }
}

// Global Router Instance
const affiliateRouter = new AffiliateRouter();

// Test Scenarios for Development
const testScenarios = [
    {
        name: 'E-Auto Premium Customer',
        data: {
            plz: '10115',
            verbrauch: '4500',
            eauto: 'on',
            email: 'test@example.com',
            name: 'Max Mustermann',
            telefon: '030 12345678'
        },
        expected_affiliate: 'RABOT_ENERGY'
    },
    {
        name: 'High Consumption Standard',
        data: {
            plz: '80331',
            verbrauch: '5000',
            haushaltsgroesse: '3-4',
            email: 'test@example.com',
            name: 'Anna Schmidt'
        },
        expected_affiliate: 'CHECK24'
    },
    {
        name: 'Smart Meter Tech User',
        data: {
            plz: '20095',
            verbrauch: '3200',
            smartmeter: 'on',
            oekostrom: 'on',
            email: 'tech@example.com',
            name: 'Tom Weber'
        },
        expected_affiliate: 'RABOT_ENERGY'
    },
    {
        name: 'Low Consumption Single',
        data: {
            plz: '50667',
            verbrauch: '1800',
            haushaltsgroesse: '1',
            email: 'single@example.com',
            name: 'Lisa Klein'
        },
        expected_affiliate: 'VERIVOX'
    }
];

// Automated Testing Function
function runRoutingTests() {
    console.log('🧪 Running Affiliate Routing Tests...');
    console.log('=====================================');
    
    let passed = 0;
    let failed = 0;
    
    testScenarios.forEach((scenario, index) => {
        console.log(`\n📋 Test ${index + 1}: ${scenario.name}`);
        console.log('Input:', scenario.data);
        
        const routing = affiliateRouter.routeLead(scenario.data);
        const url = affiliateRouter.generateAffiliateUrl(scenario.data, routing);
        
        console.log(`Expected: ${scenario.expected_affiliate}`);
        console.log(`Got: ${routing.primary}`);
        console.log(`Lead Score: ${routing.lead_score}/100`);
        console.log(`Reason: ${routing.reason}`);
        console.log(`URL: ${url.substring(0, 100)}...`);
        
        const testPassed = routing.primary === scenario.expected_affiliate;
        
        if (testPassed) {
            console.log('✅ PASSED');
            passed++;
        } else {
            console.log('❌ FAILED');
            failed++;
        }
    });
    
    console.log('\n📊 Test Summary:');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
    
    // Show analytics
    const analytics = affiliateRouter.analytics.getPerformanceReport();
    console.log('\n📈 Routing Analytics:', analytics);
}

// Debug Mode Activation
if (window.location.search.includes('debug=1')) {
    console.log('🔧 Debug Mode Activated');
    
    // Add test button to page
    document.addEventListener('DOMContentLoaded', function() {
        const testButton = document.createElement('button');
        testButton.textContent = '🧪 Run Routing Tests';
        testButton.onclick = runRoutingTests;
        testButton.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            z-index: 9999;
            padding: 10px 15px;
            background: #007bff;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-weight: bold;
        `;
        document.body.appendChild(testButton);
        
        // Show routing info
        const routingInfo = document.getElementById('routingInfo');
        if (routingInfo) {
            routingInfo.style.display = 'block';
        }
    });
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AffiliateRouter, RoutingAnalytics };
}

