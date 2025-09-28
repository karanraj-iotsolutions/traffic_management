// --- Data Structures (Updated for new features) ---

const TRAFFIC_METRICS = [
    { title: 'Flow Efficiency', icon: 'fas fa-chart-line', value: 87.2, unit: '%', change: '↑ 1.8%', isUp: true, color: 'var(--warning-color)' },
    { title: 'Avg Speed', icon: 'fas fa-tachometer-alt', value: 34, unit: 'km/h', change: '↑ 8.3%', isUp: true, color: 'var(--success-color)' },
    { title: 'Active Cameras', icon: 'fas fa-video', value: 12, unit: '', change: '+2 since morning', isUp: true, color: 'var(--primary-color)' },
    { title: 'Emergency Priority', icon: 'fas fa-car-crash', value: 1, unit: ' Active', change: 'High Priority', isUp: false, color: 'var(--danger-color)' },
];

const VEHICLE_COUNTS = {
    crossed: { label: 'Vehicles Crossed (Last Hr)', value: 18947, type: 'positive' },
    stalled: { label: 'Stalled / Congested', value: 187, type: 'negative' },
};

// NEW DATA: Predictions
const TRAFFIC_PREDICTIONS = {
    congestionPercent: 78,
    event: {
        title: 'Cricket match at stadium',
        impact: 'expect 25% increase in traffic on side roads',
    }
};

const EMERGENCY_VEHICLES = [
    { id: 'E1', vehicle: 'Ambulance Amb001', priority: 'critical', location: 'General Hospital', status: 'Optimized', routePercent: 92, lat: 40.730610, lng: -73.935242 },
    { id: 'E2', vehicle: 'Fire Fire001', priority: 'high', location: 'City Center Plaza', status: 'En-route', routePercent: 100, lat: 40.758000, lng: -73.985500 },
    { id: 'E3', vehicle: 'Police Pol001', priority: 'medium', location: 'Highway 101 Ramp', status: 'Manual Route', routePercent: 75, lat: 40.701000, lng: -73.999000 },
];

const TRAFFIC_SIGNALS = [
    { id: 'S1', name: 'Main St & 1st Ave', status: 'green', time: '45s', waiting: 8, eta: '8s', recommendation: 'Extend green by 15s for optimal flow', lat: 40.7410, lng: -73.9900 },
    { id: 'S2', name: 'Broadway & 2nd St', status: 'red', time: '30s', waiting: 23, eta: '10s', recommendation: 'Emergency override active', lat: 40.7510, lng: -73.9870 },
    { id: 'S3', name: 'Park Ave & Central', status: 'yellow', time: '05s', waiting: 15, eta: '0s', recommendation: 'Normal cycle timing', lat: 40.7500, lng: -73.9950 },
    { id: 'S4', name: 'Highway 101 Ramp', status: 'green', time: '60s', waiting: 5, eta: '50s', recommendation: 'Increase cycle time for highway flow', lat: 40.7600, lng: -73.9700 },
];

// Global map variable and traffic layer
let map;
let trafficLayer;

// --- GOOGLE MAPS INIT FUNCTION ---
// (Map styles are now a better match for the new light theme)
function initMap() {
    const mapCenter = { lat: 40.740, lng: -73.970 }; 

    map = new google.maps.Map(document.getElementById('trafficMap'), {
        center: mapCenter,
        zoom: 13,
        mapTypeId: 'roadmap', 
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: true,
        // Using Google Maps' default clean look now that we have a light theme
    });

    // Initialize Traffic Layer
    trafficLayer = new google.maps.TrafficLayer();
    trafficLayer.setMap(map);

    window.dashboard.addMapMarkers(); 
}

// --- Dashboard State and Logic ---

window.dashboard = {
    currentMode: 'Autonomous AI',
    mapMarkers: [],

    // 1. Map Interaction
    addMapMarkers() {
        if (!map) return;
        
        // Clear old markers
        this.mapMarkers.forEach(marker => marker.setMap(null));
        this.mapMarkers = [];

        // Combine all point data
        const allPoints = [...EMERGENCY_VEHICLES, ...TRAFFIC_SIGNALS];

        allPoints.forEach(p => {
            const isSignal = p.id.startsWith('S');
            
            let iconUrl, title, scaledSize;

            if (isSignal) {
                // Traffic Signal Icons
                const iconColor = {
                    'green': 'var(--success-color)',
                    'red': 'var(--danger-color)',
                    'yellow': 'var(--warning-color)'
                }[p.status];
                iconUrl = `data:image/svg+xml;charset=UTF-8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="${iconColor.replace('var(--','').replace(')','')}" stroke="#000" stroke-width="1"/></svg>`;
                title = `${p.name} - ${p.status.toUpperCase()}`;
                scaledSize = new google.maps.Size(16, 16);
            } else {
                // Emergency Vehicle Icons
                iconUrl = `data:image/svg+xml;charset=UTF-8,<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24"><path fill="var(--danger-color)" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>`.replace('var(--danger-color)', '#dc3545'); // Need to replace CSS variable for inline SVG
                title = p.vehicle;
                scaledSize = new google.maps.Size(30, 30);
            }

            const marker = new google.maps.Marker({
                position: { lat: p.lat, lng: p.lng },
                map: map,
                title: title,
                icon: {
                    url: iconUrl,
                    scaledSize: scaledSize
                }
            });
            
            this.mapMarkers.push(marker);
        });
    },

    // 2. Component Rendering Functions 
    renderMetrics() {
        const container = document.getElementById('metricRow');
        if (!container) return;
        
        container.innerHTML = TRAFFIC_METRICS.map(m => {
            const changeClass = m.isUp ? 'up' : 'down';
            const valueDisplay = m.value.toLocaleString() + (m.unit || '');
            
            // Note: The extraClass for emergency is removed as border color is handled by CSS vars now
            
            return `
                <div class="metric-card">
                    <div class="metric-header">
                        <span class="title">${m.title}</span>
                        <i class="${m.icon}" style="color: ${m.color}; font-size: 1.2em;"></i>
                    </div>
                    <div class="value">${valueDisplay}</div>
                    <p class="change ${changeClass}">${m.change}</p>
                </div>
            `;
        }).join('');
    },

    renderVehicleCounts() {
        const container = document.getElementById('countMetrics');
        if (!container) return;

        container.innerHTML = Object.values(VEHICLE_COUNTS).map(c => `
            <div class="count-box ${c.type}">
                <div class="value">${c.value.toLocaleString()}</div>
                <div class="label">${c.label}</div>
            </div>
        `).join('');
    },
    
    // NEW: Render Predictions
    renderPredictions() {
        const container = document.getElementById('predictionMetrics');
        if (!container) return;
        
        const { congestionPercent, event } = TRAFFIC_PREDICTIONS;
        
        container.innerHTML = `
            <div class="prediction-value">
                <p>Next Hour Congestion: <strong>${congestionPercent}%</strong></p>
                <div class="prediction-bar-container">
                    <div class="prediction-bar" style="width: ${congestionPercent}%;"></div>
                </div>
            </div>
            <div class="prediction-event">
                <p><strong>Event Impact:</strong></p>
                <p class="impact-text">${event.title} - ${event.impact}</p>
            </div>
        `;
    },
    
    // UPDATED: Render Smart Signals
    renderSmartSignals() {
        const container = document.getElementById('smartSignalList');
        if (!container) return;

        const isManual = this.currentMode === 'Manual Override';
        const disabledAttr = isManual ? '' : 'disabled';
        const clickAction = isManual ? `onclick="alert('Forcing control at ' + name)"` : '';

        container.innerHTML = TRAFFIC_SIGNALS.map(s => {
            return `
                <div class="signal-entry">
                    <div class="signal-header">
                        <span class="name">${s.name}</span>
                        <span class="signal-status-time ${s.status}">${s.status.toUpperCase()} ${s.time}</span>
                    </div>
                    <p class="signal-recommendation"><i class="fas fa-lightbulb"></i> AI Recommendation: ${s.recommendation}</p>
                    <p class="info">Waiting Vehicles: ${s.waiting} | Next Change ETA: ${s.eta}</p>
                    <div class="signal-controls">
                        <button class="force-green" ${disabledAttr} ${clickAction}>Force Green</button>
                        <button class="force-red" ${disabledAttr} ${clickAction}>Force Red</button>
                        <button class="ai-auto" ${disabledAttr} ${clickAction}>AI Auto</button>
                    </div>
                </div>
            `;
        }).join('');
    },

    // NEW: Render Emergency Tracking Details
    renderEmergencyTracking() {
        const container = document.getElementById('emergencyTrackingDetail');
        if (!container) return;

        container.innerHTML = EMERGENCY_VEHICLES.map(e => `
            <div class="emergency-entry">
                <div class="emergency-header">
                    <span class="name"><i class="fas fa-ambulance"></i> ${e.vehicle}</span>
                    <span class="priority ${e.priority}">${e.priority.toUpperCase()}</span>
                </div>
                <p class="emergency-status">Route Status: ${e.status} | Location: ${e.location}</p>
                <div class="progress-bar">
                    <div class="progress" style="width: ${e.routePercent}%; background-color: var(--danger-color);"></div>
                    <span style="float: right;">${e.routePercent}% Route Complete</span>
                </div>
                <div class="emergency-controls">
                    <button class="track-live">Track Live</button>
                </div>
            </div>
        `).join('');
    },


    // 3. Core Interaction Logic
    handleModeChange(newMode) {
        this.currentMode = newMode;

        const body = document.body;
        const recPanel = document.getElementById('recommendationsPanel');
        const overrideBtn = document.getElementById('manualOverrideBtn');
        const modeSelect = document.getElementById('aiMode');

        body.setAttribute('data-mode', newMode);
        modeSelect.value = newMode;
        
        // Handle UI component visibility
        recPanel.classList.toggle('hidden', newMode !== 'AI Assisted');
        overrideBtn.classList.toggle('hidden', newMode !== 'Manual Override');
        
        this.renderSmartSignals(); // Re-render signals to update button states

        if (newMode === 'Manual Override') {
            console.warn("MANUAL OVERRIDE ACTIVATED! System is under direct operator control.");
        }
    },

    // 4. Initialization Function
    init() {
        this.renderMetrics();
        this.renderVehicleCounts();
        this.renderPredictions();
        this.renderSmartSignals();
        this.renderEmergencyTracking();
        this.handleModeChange(this.currentMode); // Initialize UI state
    }
};

// Execute dashboard init when the DOM is fully loaded (map init is async)
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard.init();
    
    // Simulate real-time updates for key metrics every 3 seconds
    setInterval(() => {
        // Randomly update jam count and speed
        VEHICLE_COUNTS.stalled.value = Math.floor(Math.random() * 50) + 150;
        TRAFFIC_METRICS[1].value = Math.floor(Math.random() * (45 - 25) + 25);
        
        window.dashboard.renderMetrics();
        window.dashboard.renderVehicleCounts();
        window.dashboard.renderPredictions(); 
        
        // Optionally update map markers to simulate movement
        window.dashboard.addMapMarkers();
    }, 3000);
});