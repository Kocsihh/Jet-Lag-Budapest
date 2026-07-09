let map;
let seekerMarker;
let radarCircles = [];
let tramLines = [];
let tramsVisible = true;

// Geolokáció változók
let myLocationMarker = null;
let myLocationAccCircle = null;
let myLocationWatchId = null;
let myLocationTracking = false;
let playerMarkers = {}; // Tárolja a többi játékos markerét

// Új változók a megállókhoz
let hiderCirclesMetro = [];
let hiderCirclesTram = [];
let hidersVisible = false;
let activeHighlightPolygon = null;

function clearPlayableAreaHighlight() {
    if (activeHighlightPolygon) {
        activeHighlightPolygon.setMap(null);
        activeHighlightPolygon = null;
    }
}

// Új változók a kerületekhez
let districtPolygons = [];
let districtsVisible = false;
let districtEditing = false;
let districtData = null;
let districtStates = {}; // Kerületnév -> állapot (0: semleges, 1: igen, 2: nem)

const bpCenter = { lat: 47.4979, lng: 19.0402 };

let thermoState = {
    active: false,
    step: 0,
    radius: 0,
    pointA: null,
    pointB: null,
    markerA: null,
    markerB: null,
    guideCircle: null,
    zones: []
};


function initMap() {
    const stationOnlyStyle = [
        { "elementType": "geometry", "stylers": [{ "color": "#1d2c4d" }] },
        { "elementType": "labels.text.fill", "stylers": [{ "color": "#8ec3b9" }] },
        { "elementType": "labels.text.stroke", "stylers": [{ "color": "#1a3646" }] },
        { "featureType": "poi", "stylers": [{ "visibility": "off" }] },
        { "featureType": "transit.line", "stylers": [{ "visibility": "off" }] },
        { "featureType": "transit.station", "stylers": [{ "visibility": "on" }] },
        { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#304a7d" }] },
        { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#0e1626" }] }
    ];

    map = new google.maps.Map(document.getElementById("map"), {
        center: bpCenter,
        zoom: 13,
        styles: stationOnlyStyle,
        disableDefaultUI: true,
        zoomControl: true,
        clickableIcons: false
    });


    // Metrók
    METRO_DATA.forEach(line => {
        new google.maps.Polyline({
            path: line.path, strokeColor: line.color, strokeOpacity: 0.9, strokeWeight: 6, map: map
        });
    });

    // Villamosok
    TRAM_DATA.forEach(line => {
        let common = new google.maps.Polyline({ path: line.commonPath, strokeColor: "#ffeb3b", strokeOpacity: 0.6, strokeWeight: 3, map: map });
        tramLines.push(common);
        if (line.branch4.length) tramLines.push(new google.maps.Polyline({ path: line.commonPath.concat(line.branch4), strokeColor: "#fdd835", strokeOpacity: 0.6, strokeWeight: 3, map: map }));
        if (line.branch6.length) tramLines.push(new google.maps.Polyline({ path: line.commonPath.concat(line.branch6), strokeColor: "#ffeb3b", strokeOpacity: 0.6, strokeWeight: 3, map: map }));
    });

    const myRole = localStorage.getItem('local_role');
    
    if (myRole !== 'hider') {
        seekerMarker = new google.maps.Marker({
            position: bpCenter,
            map: map,
            draggable: true,
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 10, fillColor: "#ff4500", fillOpacity: 1, strokeWeight: 2, strokeColor: "white"
            },
            label: { text: "HUNYÓ", color: "white", fontWeight: "bold", fontSize: "12px" }
        });

        seekerMarker.addListener('dragend', () => {
            saveState();
        });
    }

    map.addListener("click", (e) => {
        if (!thermoState.active) return;
        if (thermoState.step === 1) {
            placePointA(e.latLng);
        } else if (thermoState.step === 2) {
            calculateAndPlacePointB(e.latLng);
        }
    });

    loadDistrictData();
    initLocationListener();
}

async function loadDistrictData() {
    try {
        const response = await fetch('https://raw.githubusercontent.com/mihalyTothUni/budapest_districts/main/keruletek.geojson');
        districtData = await response.json();
    } catch (e) {
        console.error("Hiba a kerület adatok betöltésekor:", e);
    }
}


// --- ÚJ FUNKCIÓ: POSSIBLE HIDER LOCATIONS ---
function togglePossibleHiders() {
    const btn = document.getElementById('hidersBtn');
    if (hidersVisible) {
        clearHiders();
        if (btn) { btn.innerText = "Megállók (500m): KI"; btn.classList.add('off'); }
    } else {
        drawHiders();
        if (btn) { btn.innerText = "Megállók (500m): BE"; btn.classList.remove('off'); }
    }
}

function drawHiders() {
    const radius = 500;
    const style = {
        strokeColor: "#00BCD4",
        strokeOpacity: 0.1, // Szinte láthatatlan körvonal
        strokeWeight: 1,
        fillColor: "#00BCD4",
        fillOpacity: 0.15, // Lágy kitöltés, ami átfedésnél kicsit sötétebb lesz
        clickable: true
    };

    METRO_DATA.forEach(line => {
        // Metró megállók (töréspontok) mind fontosak
        line.path.forEach(pt => {
            const circle = new google.maps.Circle({
                center: pt,
                radius: radius,
                map: map,
                ...style
            });
            circle.addListener('click', () => {
                highlightPlayableArea(pt);
            });
            hiderCirclesMetro.push(circle);
        });
    });

    TRAM_DATA.forEach(line => {
        // Ha vannak névvel jelölt megállók, csak azokat vesszük (pontos megállóhelyek)
        // Ha nincs névvel ellátott pont (pl. 4-6-os), minden pontot veszünk
        const hasNamedStops = line.commonPath.some(pt => pt.name);
        const stopPoints = hasNamedStops
            ? line.commonPath.filter(pt => pt.name)
            : line.commonPath;
            
        let tramPoints = [...stopPoints];
        if (line.branch4) tramPoints.push(...line.branch4);
        if (line.branch6) tramPoints.push(...line.branch6);
        
        tramPoints.forEach(pt => {
            const circle = new google.maps.Circle({
                center: pt,
                radius: radius,
                map: tramsVisible ? map : null,
                ...style
            });
            circle.addListener('click', () => {
                highlightPlayableArea(pt);
            });
            hiderCirclesTram.push(circle);
        });
    });

    // Ha a térképre kattintunk, tűnjön el a kiemelés
    google.maps.event.addListener(map, 'click', clearPlayableAreaHighlight);

    hidersVisible = true;
}

function highlightPlayableArea(clickedPt) {
    clearPlayableAreaHighlight();
    
    if (typeof turf === 'undefined') {
        console.error("Turf.js nincs betöltve!");
        return;
    }
    
    // 1. Összegyűjtjük az aktív megállókat
    const activeStops = [];
    METRO_DATA.forEach(line => {
        line.path.forEach(pt => { activeStops.push({ lat: pt.lat, lng: pt.lng }); });
    });

    if (tramsVisible) {
        TRAM_DATA.forEach(line => {
            const hasNamedStops = line.commonPath.some(pt => pt.name);
            const stopPoints = hasNamedStops ? line.commonPath.filter(pt => pt.name) : line.commonPath;
            let tramPoints = [...stopPoints];
            if (line.branch4) tramPoints.push(...line.branch4);
            if (line.branch6) tramPoints.push(...line.branch6);
            
            tramPoints.forEach(pt => { activeStops.push({ lat: pt.lat, lng: pt.lng }); });
        });
    }

    // 2. Kiszámoljuk a Voronoi-t Turf.js-el
    const points = turf.featureCollection(activeStops.map(s => turf.point([s.lng, s.lat])));
    const bbox = [18.9, 47.3, 19.3, 47.7]; // Budapest bbox
    const voronoiPolygons = turf.voronoi(points, { bbox: bbox });
    
    // 3. Megkeressük a kattintott ponthoz tartozó Voronoi poligont
    const clickedIndex = activeStops.findIndex(s => s.lat === clickedPt.lat && s.lng === clickedPt.lng);
    if (clickedIndex === -1) return;
    
    const voronoiPoly = voronoiPolygons.features[clickedIndex];
    if (!voronoiPoly) return; 
    
    // 4. Létrehozunk egy 500m-es Turf kört
    const circle500m = turf.circle([clickedPt.lng, clickedPt.lat], 0.5, { steps: 64, units: 'kilometers' });
    
    // 5. Vesszük a kettő metszetét
    const intersection = turf.intersect(voronoiPoly, circle500m);
    if (!intersection) return;
    
    // 6. Felrajzoljuk a Google Maps-re
    const geom = intersection.geometry;
    let paths = [];
    if (geom.type === 'Polygon') {
        paths = geom.coordinates[0].map(coord => ({ lat: coord[1], lng: coord[0] }));
    } else if (geom.type === 'MultiPolygon') {
        paths = geom.coordinates.map(polygon => polygon[0].map(coord => ({ lat: coord[1], lng: coord[0] })));
    }
    
    activeHighlightPolygon = new google.maps.Polygon({
        paths: paths,
        strokeColor: "#FF9800",
        strokeOpacity: 0.9,
        strokeWeight: 3,
        fillColor: "#FF9800",
        fillOpacity: 0.4,
        map: map,
        zIndex: 500
    });
}

function clearHiders() {
    clearPlayableAreaHighlight();
    hiderCirclesMetro.forEach(c => c.setMap(null));
    hiderCirclesTram.forEach(c => c.setMap(null));
    hiderCirclesMetro = [];
    hiderCirclesTram = [];
    hidersVisible = false;
}

// --- KERÜLETEK FUNKCIÓK ---
function toggleDistricts() {
    if (districtsVisible) {
        clearDistricts();
    } else {
        drawDistricts();
    }
    saveState();
}

function drawDistricts() {
    console.log("drawDistricts meghívva, adatok állapota:", !!districtData);
    if (!districtData) {
        updateStatus("Kerület adatok betöltése folyamatban... Próbáld újra pár mp múlva.");
        // Próbáljuk meg újra betölteni ha korábban hiba volt
        loadDistrictData();
        return;
    }

    try {
        // Megelőzzük a duplikálást: töröljük a régit, mielőtt újat rajzolunk
        if (districtPolygons.length > 0) {
            districtPolygons.forEach(p => p.setMap(null));
            districtPolygons = [];
        }

        districtData.features.forEach(feature => {
            const geometry = feature.geometry;
            if (!geometry) return;

            const districtName = feature.properties.name || feature.properties.short_name;
            const state = districtStates[districtName] || 0;

            let color = "#ffffff";
            let opacity = 0.05;

            if (state === 1) { color = "#00ff00"; opacity = 0.15; }
            else if (state === 2) { color = "#ff0000"; opacity = 0.15; }

            const polygonData = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;

            polygonData.forEach(poly => {
                if (!poly || !poly.length) return;

                const polygon = new google.maps.Polygon({
                    paths: poly.map(ring => ring.map(coord => ({ lng: coord[0], lat: coord[1] }))),
                    strokeColor: "#ffffff",
                    strokeOpacity: 0.5,
                    strokeWeight: 1,
                    fillColor: color,
                    fillOpacity: opacity,
                    map: map,
                    clickable: districtEditing,
                    zIndex: 1
                });

                polygon.addListener('click', () => {
                    let currentState = districtStates[districtName] || 0;
                    let newState = (currentState + 1) % 3;
                    districtStates[districtName] = newState;

                    // Frissítjük az összes polygont ehhez a kerülethez (MultiPolygon miatt lehet több)
                    const allSameDist = districtPolygons.filter(p => p.get('districtName') === districtName);

                    let nColor = "#ffffff";
                    let nOpacity = 0.05;
                    if (newState === 1) { nColor = "#00ff00"; nOpacity = 0.15; }
                    else if (newState === 2) { nColor = "#ff0000"; nOpacity = 0.15; }

                    allSameDist.forEach(p => {
                        p.setOptions({ fillColor: nColor, fillOpacity: nOpacity });
                    });
                    saveState();
                });

                polygon.set('districtName', districtName);
                districtPolygons.push(polygon);
            });
        });

        districtsVisible = true;
        const btn = document.getElementById('districtBtn');
        if (btn) {
            btn.innerText = "Kerületek: BE";
            btn.classList.remove('off');
        }
        updateStatus(""); // Töröljük a hibaüzenetet ha volt
        console.log(`Sikeresen kirajzolva ${districtPolygons.length} polygon.`);
    } catch (err) {
        console.error("Hiba a kerületek kirajzolásakor:", err);
        updateStatus("Hiba történt a rajzoláskor.");
    }
}

function clearDistricts() {
    districtPolygons.forEach(p => p.setMap(null));
    districtPolygons = [];
    districtsVisible = false;
    document.getElementById('districtBtn').innerText = "Kerületek: KI";
    document.getElementById('districtBtn').classList.add('off');
}

function toggleDistrictEditing() {
    districtEditing = !districtEditing;
    const btn = document.getElementById('editDistBtn');
    btn.innerText = districtEditing ? "Szerkesztés: BE" : "Szerkesztés: KI";
    btn.classList.toggle('off', !districtEditing);

    // Frissítjük a létező polygonokat
    districtPolygons.forEach(p => {
        p.setOptions({ clickable: districtEditing });
    });
    saveState();
}

// --- HŐMÉRŐ FUNKCIÓK ---

function startThermometer(radius) {
    clearThermometer();
    thermoState.active = true;
    thermoState.radius = radius;
    thermoState.step = 1;
    updateStatus(`Kattints az INDULÓ pont (${radius / 1000} km) lerakásához!`);
    map.setOptions({ draggableCursor: 'crosshair' });
}

function placePointA(latLng) {
    thermoState.pointA = latLng;

    thermoState.markerA = new google.maps.Marker({
        position: latLng,
        map: map,
        label: { text: "A", color: "white", fontWeight: "bold" },
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 6, fillColor: "blue", fillOpacity: 1, strokeColor: "white", strokeWeight: 2
        }
    });

    thermoState.guideCircle = new google.maps.Circle({
        strokeColor: "#1976d2",
        strokeOpacity: 0.5,
        strokeWeight: 1,
        fillColor: "#1976d2",
        fillOpacity: 0.05,
        map: map,
        center: latLng,
        radius: thermoState.radius,
        clickable: false
    });

    thermoState.step = 2;
    updateStatus(`Kattints bárhova az IRÁNY megadásához!`);
}

function calculateAndPlacePointB(clickLatLng) {
    const heading = google.maps.geometry.spherical.computeHeading(thermoState.pointA, clickLatLng);
    const exactPointB = google.maps.geometry.spherical.computeOffset(thermoState.pointA, thermoState.radius, heading);
    thermoState.pointB = exactPointB;

    thermoState.markerB = new google.maps.Marker({
        position: exactPointB,
        map: map,
        label: { text: "B", color: "white", fontWeight: "bold" },
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 6, fillColor: "green", fillOpacity: 1, strokeColor: "white", strokeWeight: 2
        }
    });

    map.setOptions({ draggableCursor: null });
    thermoState.guideCircle.setMap(null);
    thermoState.active = false;
    thermoState.step = 0;
    updateStatus("");
    document.getElementById('swapBtn').style.display = 'block';
    drawTemperatureZones();
    saveState();
}

function drawTemperatureZones() {
    const A = thermoState.pointA;
    const B = thermoState.pointB;
    if (!A || !B) return;

    const midPoint = google.maps.geometry.spherical.interpolate(A, B, 0.5);
    const heading = google.maps.geometry.spherical.computeHeading(A, B);
    const headingRight = heading + 90;
    const headingLeft = heading - 90;
    const farDist = 15000; // Optimalizálva 50km-ről 15km-re

    const dividerRight = google.maps.geometry.spherical.computeOffset(midPoint, farDist, headingRight);
    const dividerLeft = google.maps.geometry.spherical.computeOffset(midPoint, farDist, headingLeft);

    const greenCornerRight = google.maps.geometry.spherical.computeOffset(dividerRight, farDist, heading);
    const greenCornerLeft = google.maps.geometry.spherical.computeOffset(dividerLeft, farDist, heading);

    const greenZone = new google.maps.Polygon({
        paths: [dividerLeft, dividerRight, greenCornerRight, greenCornerLeft],
        strokeColor: "#00FF00", strokeOpacity: 0, strokeWeight: 0,
        fillColor: "#00FF00", fillOpacity: 0.15, map: map, clickable: false
    });
    thermoState.zones.push(greenZone);

    const redCornerRight = google.maps.geometry.spherical.computeOffset(dividerRight, farDist, heading + 180);
    const redCornerLeft = google.maps.geometry.spherical.computeOffset(dividerLeft, farDist, heading + 180);

    const redZone = new google.maps.Polygon({
        paths: [dividerLeft, dividerRight, redCornerRight, redCornerLeft],
        strokeColor: "#FF0000", strokeOpacity: 0, strokeWeight: 0,
        fillColor: "#FF0000", fillOpacity: 0.15, map: map, clickable: false
    });
    thermoState.zones.push(redZone);

    const connector = new google.maps.Polyline({
        path: [A, B],
        strokeColor: "white", strokeOpacity: 0.8, strokeWeight: 2,
        icons: [{ icon: { path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW }, offset: '100%' }],
        map: map
    });
    thermoState.zones.push(connector);
}

function swapColors() {
    thermoState.zones.forEach(overlay => {
        if (overlay instanceof google.maps.Polygon) {
            const currentColor = overlay.get('fillColor');
            if (currentColor === "#00FF00") {
                overlay.setOptions({ fillColor: "#FF0000", strokeColor: "#FF0000" });
            } else if (currentColor === "#FF0000") {
                overlay.setOptions({ fillColor: "#00FF00", strokeColor: "#00FF00" });
            }
        }
    });
    saveState();
}

// --- EGYÉB SEGÉDFUNKCIÓK ---

function updateStatus(text) {
    const el = document.getElementById('map-status-bar');
    if (text) {
        el.innerText = text; el.style.display = 'block';
    } else {
        el.style.display = 'none';
    }
}

function toggleTrams() {
    clearPlayableAreaHighlight();
    tramsVisible = !tramsVisible;
    tramLines.forEach(line => line.setMap(tramsVisible ? map : null));
    
    // Frissítjük a megállók körvonalait is
    if (hidersVisible) {
        hiderCirclesTram.forEach(c => c.setMap(tramsVisible ? map : null));
    }
    
    document.getElementById('tramBtn').innerText = tramsVisible ? "Villamosok: BE" : "Villamosok: KI";
    document.getElementById('tramBtn').classList.toggle('off', !tramsVisible);
}

function promptCustomRadar() {
    const value = prompt("Add meg a radar sugarát (méterben):", "750");
    if (value && !isNaN(value)) {
        drawRadar(parseInt(value));
    }
}

function drawRadar(radius, center = null, color = "#ff4500") {
    const radarCenter = center || seekerMarker.getPosition();
    const circle = new google.maps.Circle({
        strokeColor: color, strokeOpacity: 0.8, strokeWeight: 2,
        fillColor: color, fillOpacity: 0.35,
        map: map, center: radarCenter, radius: radius, clickable: true,
        zIndex: 1000
    });

    circle.addListener('click', () => {
        const currentColor = circle.get('fillColor');
        const newColor = currentColor === "#ff4500" ? "#00ff00" : "#ff4500";
        circle.setOptions({
            fillColor: newColor,
            strokeColor: newColor
        });
        saveState();
    });

    radarCircles.push(circle);
    map.panTo(radarCenter);
    saveState();
}

function clearRadar() {
    radarCircles.forEach(c => c.setMap(null));
    radarCircles = [];
    saveState();
}

function clearThermometer() {
    if (thermoState.markerA) thermoState.markerA.setMap(null);
    if (thermoState.markerB) thermoState.markerB.setMap(null);
    if (thermoState.guideCircle) thermoState.guideCircle.setMap(null);
    thermoState.zones.forEach(p => p.setMap(null));
    thermoState.zones = [];
    thermoState.active = false;
    thermoState.step = 0;
    thermoState.pointA = null;
    thermoState.pointB = null;
    updateStatus("");
    map.setOptions({ draggableCursor: null });
    document.getElementById('swapBtn').style.display = 'none';
    saveState();
}

function clearAll() {
    clearRadar();
    clearThermometer();
    clearHiders();
    Storage.remove('jetLagState');
    showToast('Térkép sikeresen letisztítva!', 'success');
    // Kerületek nem kerülnek törlésre a felhasználó kérésére
}

// --- GEOLOKÁCIÓ ---

function toggleMyLocation() {
    if (myLocationTracking) {
        stopMyLocation();
    } else {
        startMyLocation();
    }
}

function startMyLocation() {
    if (!navigator.geolocation) {
        showToast('A böngésző nem támogatja a geolokációt.', 'error');
        updateStatus('A böngésző nem támogatja a geolokációt.');
        return;
    }

    updateStatus('Helyzet meghatározása...');

    // Azonnali helyzet
    navigator.geolocation.getCurrentPosition(
        (pos) => {
            placeMyLocationMarker(pos);
            updateStatus('');
        },
        (err) => {
            showToast('Hiba a helyzet meghatározásakor!', 'error');
            updateStatus('Hiba a helyzet meghatározásakor: ' + err.message);
        },
        { enableHighAccuracy: true, timeout: 10000 }
    );

    // Folyamatos követés
    myLocationWatchId = navigator.geolocation.watchPosition(
        (pos) => {
            placeMyLocationMarker(pos);
        },
        (err) => {
            console.warn('Geolokáció hiba:', err);
        },
        { enableHighAccuracy: true, maximumAge: 5000 }
    );

    myLocationTracking = true;
    const btn = document.getElementById('myLocationBtn');
    if (btn) { btn.innerText = '📍 Követés: BE'; btn.classList.remove('off'); }
}

function stopMyLocation() {
    if (myLocationWatchId !== null) {
        navigator.geolocation.clearWatch(myLocationWatchId);
        myLocationWatchId = null;
    }
    if (myLocationMarker) { myLocationMarker.setMap(null); myLocationMarker = null; }
    if (myLocationAccCircle) { myLocationAccCircle.setMap(null); myLocationAccCircle = null; }
    myLocationTracking = false;
    const btn = document.getElementById('myLocationBtn');
    if (btn) { btn.innerText = '📍 Helyzetem'; btn.classList.add('off'); }
    
    // Törlés Firebase-ből
    const roomId = localStorage.getItem('local_roomId');
    const myUserId = localStorage.getItem('local_userId');
    if (roomId && myUserId && typeof db !== 'undefined') {
        db.ref(`rooms/${roomId}/locations/${myUserId}`).remove();
    }
}

function placeMyLocationMarker(pos) {
    const latLng = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    const accuracy = pos.coords.accuracy;
    
    // Firebase küldés
    const roomId = localStorage.getItem('local_roomId');
    const myUserId = localStorage.getItem('local_userId');
    const myName = localStorage.getItem('local_playerName');
    const myRole = localStorage.getItem('local_role');
    
    if (roomId && myUserId && typeof db !== 'undefined') {
        const locRef = db.ref(`rooms/${roomId}/locations/${myUserId}`);
        locRef.onDisconnect().remove();
        locRef.set({
            lat: latLng.lat,
            lng: latLng.lng,
            accuracy: accuracy,
            name: myName,
            role: myRole,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        });
    }

    if (!myLocationMarker) {
        myLocationMarker = new google.maps.Marker({
            position: latLng,
            map: map,
            zIndex: 2000,
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 10,
                fillColor: '#4285F4',
                fillOpacity: 1,
                strokeColor: 'white',
                strokeWeight: 3
            },
            title: 'Az én helyzetem'
        });
    } else {
        myLocationMarker.setPosition(latLng);
    }

    if (!myLocationAccCircle) {
        myLocationAccCircle = new google.maps.Circle({
            center: latLng,
            radius: accuracy,
            map: map,
            strokeColor: '#4285F4',
            strokeOpacity: 0.4,
            strokeWeight: 1,
            fillColor: '#4285F4',
            fillOpacity: 0.1,
            clickable: false,
            zIndex: 1999
        });
    } else {
        myLocationAccCircle.setCenter(latLng);
        myLocationAccCircle.setRadius(accuracy);
    }

    map.panTo(latLng);
}

function initLocationListener() {
    const roomId = localStorage.getItem('local_roomId');
    const myUserId = localStorage.getItem('local_userId');
    if (!roomId || typeof db === 'undefined') return;
    
    db.ref(`rooms/${roomId}/locations`).on('value', (snapshot) => {
        const locations = snapshot.val() || {};
        
        // Remove markers for players no longer in locations
        for (let uid in playerMarkers) {
            if (!locations[uid]) {
                playerMarkers[uid].marker.setMap(null);
                playerMarkers[uid].circle.setMap(null);
                delete playerMarkers[uid];
            }
        }
        
        // Add/Update markers
        const myRole = localStorage.getItem('local_role');
        for (let uid in locations) {
            if (uid === myUserId) continue; // Saját magunkat a kék pötty mutatja
            
            const data = locations[uid];
            const latLng = { lat: data.lat, lng: data.lng };
            const isHider = data.role === 'hider';

            // Ha én Hunyó vagyok, a Bújókat NEM látom
            if (myRole === 'seeker' && isHider) {
                // Ha volt korábban markere, töröljük
                if (playerMarkers[uid]) {
                    playerMarkers[uid].marker.setMap(null);
                    playerMarkers[uid].circle.setMap(null);
                    delete playerMarkers[uid];
                }
                continue;
            }
            
            const color = isHider ? '#4CAF50' : '#ff4500';
            
            if (!playerMarkers[uid]) {
                const marker = new google.maps.Marker({
                    position: latLng,
                    map: map,
                    zIndex: 1990,
                    icon: {
                        path: google.maps.SymbolPath.CIRCLE,
                        scale: 8,
                        fillColor: color,
                        fillOpacity: 1,
                        strokeColor: 'white',
                        strokeWeight: 2
                    },
                    label: { text: data.name, color: 'white', fontSize: '14px', fontWeight: 'bold' }
                });
                
                const circle = new google.maps.Circle({
                    center: latLng,
                    radius: data.accuracy || 50,
                    map: map,
                    strokeColor: color,
                    strokeOpacity: 0.4,
                    strokeWeight: 1,
                    fillColor: color,
                    fillOpacity: 0.1,
                    clickable: false,
                    zIndex: 1989
                });
                
                playerMarkers[uid] = { marker, circle };
            } else {
                playerMarkers[uid].marker.setPosition(latLng);
                playerMarkers[uid].circle.setCenter(latLng);
                playerMarkers[uid].circle.setRadius(data.accuracy || 50);
                playerMarkers[uid].marker.setLabel({ text: data.name, color: 'white', fontSize: '14px', fontWeight: 'bold' });
            }
        }
    });
}

// --- PERSISTENCE ---

function saveState() {
    const state = {
        seekerPos: (typeof seekerMarker !== 'undefined' && seekerMarker) ? { lat: seekerMarker.getPosition().lat(), lng: seekerMarker.getPosition().lng() } : null,
        radars: radarCircles.map(c => ({
            radius: c.getRadius(),
            center: { lat: c.getCenter().lat(), lng: c.getCenter().lng() },
            color: c.get('fillColor')
        })),
        thermo: {
            pointA: thermoState.pointA ? { lat: thermoState.pointA.lat(), lng: thermoState.pointA.lng() } : null,
            pointB: thermoState.pointB ? { lat: thermoState.pointB.lat(), lng: thermoState.pointB.lng() } : null,
            isSwapped: thermoState.zones.length > 0 && thermoState.zones[0].get('fillColor') === "#FF0000" // Egyszerű csekk
        },
        districtsVisible: districtsVisible,
        districtEditing: districtEditing,
        districtStates: districtStates
    };
    Storage.set('jetLagState', state);
}

function loadState() {
    const state = Storage.get('jetLagState');
    if (!state) return;

    if (state.seekerPos && typeof seekerMarker !== 'undefined' && seekerMarker) {
        seekerMarker.setPosition(state.seekerPos);
    }

    if (state.radars && Array.isArray(state.radars)) {
        state.radars.forEach(r => {
            drawRadar(r.radius, new google.maps.LatLng(r.center.lat, r.center.lng), r.color);
        });
    }

    if (state.thermo && state.thermo.pointA && state.thermo.pointB) {
        thermoState.pointA = new google.maps.LatLng(state.thermo.pointA.lat, state.thermo.pointA.lng);
        thermoState.pointB = new google.maps.LatLng(state.thermo.pointB.lat, state.thermo.pointB.lng);

        // Re-render markers for A and B
        thermoState.markerA = new google.maps.Marker({
            position: thermoState.pointA, map: map, label: { text: "A", color: "white" },
            icon: { path: google.maps.SymbolPath.CIRCLE, scale: 6, fillColor: "blue", fillOpacity: 1, strokeColor: "white", strokeWeight: 2 }
        });
        thermoState.markerB = new google.maps.Marker({
            position: thermoState.pointB, map: map, label: { text: "B", color: "white" },
            icon: { path: google.maps.SymbolPath.CIRCLE, scale: 6, fillColor: "green", fillOpacity: 1, strokeColor: "white", strokeWeight: 2 }
        });

        drawTemperatureZones();
        if (state.thermo.isSwapped) swapColors();
        document.getElementById('swapBtn').style.display = 'block';
    }

    if (state.districtStates) {
        districtStates = state.districtStates;
    }

    if (state.districtEditing !== undefined) {
        districtEditing = state.districtEditing;
        const btn = document.getElementById('editDistBtn');
        btn.innerText = districtEditing ? "Szerkesztés: BE" : "Szerkesztés: KI";
        btn.classList.toggle('off', !districtEditing);
    }

    if (state.districtsVisible) {
        // Várunk kicsit, hogy az adatok biztosan betöltődjenek
        setTimeout(() => {
            if (districtData) drawDistricts();
            else {
                // Ha még nincs kész, újra megpróbáljuk
                let checkInt = setInterval(() => {
                    if (districtData) {
                        drawDistricts();
                        clearInterval(checkInt);
                    }
                }, 500);
            }
        }, 500);
    } else {
        const dBtn = document.getElementById('districtBtn');
        if (dBtn) dBtn.classList.add('off');
    }
}

// initMap is called by hunyo_tabs.js
const originalInitMap = initMap;
initMap = () => {
    originalInitMap();
    setTimeout(loadState, 500);
};
