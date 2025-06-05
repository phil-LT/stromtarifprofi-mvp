# Stromtarifprofi.de MVP

Ein Multi-Affiliate-Stromvergleichsportal mit intelligenter Lead-Qualifizierung und Routing.

## 🚀 Features

- **Multi-Step-Formular** für optimale User Experience
- **Intelligentes Affiliate-Routing** basierend auf Nutzermerkmalen
- **Lead-Scoring-System** für Qualitätsbewertung
- **DSGVO-konformes Cookie-Management**
- **Responsive Design** für alle Geräte
- **Automatisches GitHub Pages Deployment**

## 📋 Projektstruktur

```
stromtarifprofi-mvp/
├── index.html              # Hauptseite mit Lead-Formular
├── styles.css              # Styling für alle Komponenten
├── affiliate-router.js     # Intelligentes Affiliate-Routing
├── form-handler.js         # Formular-Logik und DSGVO-Compliance
├── analytics.js            # Leichtgewichtige Analytics-Komponente
└── .github/
    └── workflows/
        └── deploy.yml      # GitHub Actions Workflow für Deployment
```

## 🔧 Lokale Entwicklung

1. Repository klonen:
```bash
git clone https://github.com/yourusername/stromtarifprofi-mvp.git
cd stromtarifprofi-mvp
```

2. Lokalen Server starten (z.B. mit Python):
```bash
python -m http.server 8000
```

3. Browser öffnen und zu `http://localhost:8000` navigieren

## 🧪 Testing

Für Debug-Modus und Testing:
- Füge `?debug=1` zur URL hinzu (z.B. `http://localhost:8000?debug=1`)
- Routing-Informationen werden angezeigt
- Test-Button erscheint für automatisierte Tests

## 📊 Affiliate-Integration

Aktuelle Affiliate-Partner:
- **CHECK24**: Standard-Routing für die meisten Nutzer
- **RABOT Energy**: Premium-Routing für E-Auto-Besitzer und Smart-Meter-Nutzer
- **VERIVOX**: Fallback und für Niedrigverbraucher

## 🚀 Deployment

Das Projekt wird automatisch auf GitHub Pages deployed, wenn Änderungen zum `main`-Branch gepusht werden.

1. Repository auf GitHub erstellen
2. Lokales Repository mit GitHub verbinden:
```bash
git remote add origin https://github.com/yourusername/stromtarifprofi-mvp.git
```

3. Änderungen pushen:
```bash
git add .
git commit -m "Initial commit"
git push -u origin main
```

4. GitHub Pages in den Repository-Einstellungen aktivieren:
   - Gehe zu "Settings" > "Pages"
   - Source: "gh-pages" Branch
   - Warte auf Deployment (ca. 1-2 Minuten)

## 📝 Anpassungen

### Affiliate-IDs aktualisieren

In `affiliate-router.js` die Partner-IDs aktualisieren:
```javascript
// CHECK24
partnerId: 'YOUR_CHECK24_PARTNER_ID',

// VERIVOX
partner: 'YOUR_VERIVOX_PARTNER_ID',

// RABOT Energy (AWIN)
awinmid: '70752',
awinaffid: 'YOUR_AWIN_AFFILIATE_ID',
```

### Analytics-Integration

In `index.html` die Analytics-Tracking-Codes einfügen:
```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX', { 'anonymize_ip': true });
</script>

<!-- Facebook Pixel -->
<script>
  !function(f,b,e,v,n,t,s){...}(window, document,'script',
  'https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', 'XXXXXXXXXX');
  fbq('track', 'PageView');
</script>
```

## 📈 Nächste Schritte

1. Backend-API für Lead-Verarbeitung implementieren
2. A/B-Testing für Formular-Optimierung einrichten
3. Multi-Domain-Strategie umsetzen
4. E-Mail-Nurturing-Sequenz implementieren
5. Conversion-Tracking mit Affiliate-Partnern verbinden

