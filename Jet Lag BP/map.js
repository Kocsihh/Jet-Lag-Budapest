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

// Új változók a megállókhoz
let hiderCircles = [];
let hidersVisible = false;

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

const metroData = [
    { name: "M1", color: "#ffcd00", path: [{ lat: 47.4967, lng: 19.0503 }, { lat: 47.49791, lng: 19.05396 }, { lat: 47.50049, lng: 19.05730 }, { lat: 47.5024, lng: 19.0594 }, { lat: 47.5042, lng: 19.0617 }, { lat: 47.5065, lng: 19.0645 }, { lat: 47.5085, lng: 19.0671 }, { lat: 47.5106, lng: 19.0700 }, { lat: 47.5147, lng: 19.0775 }, { lat: 47.51720, lng: 19.08080 }, { lat: 47.5194, lng: 19.0911 }] },
    { name: "M2", color: "#e41f18", path: [{ lat: 47.5003, lng: 19.0245 }, { lat: 47.5066, lng: 19.0253 }, { lat: 47.506389, lng: 19.038889 }, { lat: 47.50572, lng: 19.04498 }, { lat: 47.49766, lng: 19.05461 }, { lat: 47.4942, lng: 19.0601 }, { lat: 47.49716, lng: 19.07053 }, { lat: 47.50028, lng: 19.08167 }, { lat: 47.5000, lng: 19.1058 }, { lat: 47.501051, lng: 19.118839 }, { lat: 47.5028, lng: 19.1356 }] },
    { name: "M3", color: "#005ca5", path: [{ lat: 47.56033, lng: 19.09065 }, { lat: 47.55913, lng: 19.07981 }, { lat: 47.54871, lng: 19.07323 }, { lat: 47.5393922, lng: 19.0695 }, { lat: 47.53034, lng: 19.06583 }, { lat: 47.5225, lng: 19.0617 }, { lat: 47.51824, lng: 19.06055 }, { lat: 47.51139, lng: 19.05667 }, { lat: 47.50056, lng: 19.05358 }, { lat: 47.49791, lng: 19.05444 }, { lat: 47.493056, lng: 19.056111 }, { lat: 47.48987, lng: 19.06133 }, { lat: 47.48572, lng: 19.06938 }, { lat: 47.48265, lng: 19.07913 }, { lat: 47.47917, lng: 19.08944 }, { lat: 47.475556, lng: 19.098611 }, { lat: 47.47097, lng: 19.11130 }, { lat: 47.468629, lng: 19.117178 }, { lat: 47.46470, lng: 19.12640 }, { lat: 47.46333, lng: 19.14917 }] },
    { name: "M4", color: "#009540", path: [{ lat: 47.46499, lng: 19.022205 }, { lat: 47.46504, lng: 19.03291 }, { lat: 47.4741667, lng: 19.0458333 }, { lat: 47.477158, lng: 19.046778 }, { lat: 47.483934, lng: 19.053125 }, { lat: 47.487107, lng: 19.057481 }, { lat: 47.489644, lng: 19.061687 }, { lat: 47.492778, lng: 19.072222 }, { lat: 47.49580, lng: 19.07750 }, { lat: 47.50030, lng: 19.08172 }] }
];

const tramData = [
    { name: "4-6", commonPath: [{ lat: 47.507153, lng: 19.023155 }, { lat: 47.508133, lng: 19.026750 }, { lat: 47.51089, lng: 19.03161 }, { lat: 47.51483, lng: 19.03929 }, { lat: 47.514700, lng: 19.043500 }, { lat: 47.51339, lng: 19.04743 }, { lat: 47.51050, lng: 19.05603 }, { lat: 47.505717, lng: 19.062549 }, { lat: 47.503084, lng: 19.065921 }, { lat: 47.50029, lng: 19.06909 }, { lat: 47.49610, lng: 19.07060 }, { lat: 47.492383, lng: 19.070928 }, { lat: 47.48999, lng: 19.07056 }, { lat: 47.486350, lng: 19.070192 }, { lat: 47.482751, lng: 19.068848 }, { lat: 47.48051, lng: 19.06714 }, { lat: 47.476773, lng: 19.058876 }], branch4: [{ lat: 47.47374783, lng: 19.05296317 }, { lat: 47.47406664, lng: 19.04682207 }], branch6: [{ lat: 47.47606, lng: 19.05378 }, { lat: 47.47756, lng: 19.04752 }] },
    {
        name: "1", commonPath: [
            { "lat": 47.5487668, "lng": 19.0293717, "name": "Bécsi út / Vörösvári út" },
            { "lat": 47.544915, "lng": 19.0347212, "name": "Óbudai rendelőintézet" },
            { "lat": 47.5415559, "lng": 19.0399876, "name": "Flórián tér" },
            { "lat": 47.5396294, "lng": 19.0451951, "name": "Szentlélek tér H" },
            { "lat": 47.5363463, "lng": 19.0589357, "name": "Népfürdő utca / Árpád híd" },
            { "lat": 47.5329813, "lng": 19.0661038, "name": "Göncz Árpád városközpont M" },
            { "lat": 47.5300597, "lng": 19.0706795, "name": "Honvédkórház" },
            { "lat": 47.5257963, "lng": 19.0774973, "name": "Lehel utca / Róbert K K körút" },
            { "lat": 47.5232561, "lng": 19.0814291, "name": "Vágány utca / Róbert K K körút" },
            { "lat": 47.5186671, "lng": 19.0885636, "name": "Kacsóh Pongrác út" },
            { "lat": 47.5164235, "lng": 19.0918791, "name": "Erzsébet királyné útja, aluljáró" },
            { "lat": 47.5135342, "lng": 19.0961055, "name": "Ajtósi Dürer sor" },
            { "lat": 47.5109104, "lng": 19.0995615, "name": "Zugló vasútállomás" },
            { "lat": 47.5067547, "lng": 19.1044403, "name": "Egressy út / Hungária körút" },
            { "lat": 47.500385, "lng": 19.1081247, "name": "Puskás Ferenc Stadion M" },
            { "lat": 47.4958347, "lng": 19.1090382, "name": "Hős utca" },
            { "lat": 47.490764, "lng": 19.1088648, "name": "Hidegkuti Nándor Stadion" },
            { "lat": 47.4857759, "lng": 19.1070467, "name": "Kőbányai út / Könyves Kálmán körút" },
            { "lat": 47.4813983, "lng": 19.1031742, "name": "Vajda Péter utca" },
            { "lat": 47.4758973, "lng": 19.0988621, "name": "Népliget M" },
            { "lat": 47.4725099, "lng": 19.0956319, "name": "Albert Flórián út" },
            { "lat": 47.4702263, "lng": 19.0885575, "name": "Ferencváros vasútállomás - Málenkij Robot emlékhely" },
            { "lat": 47.4696228, "lng": 19.0837741, "name": "Mester utca / Könyves Kálmán körút" },
            { "lat": 47.4687841, "lng": 19.0727767, "name": "Közvágóhíd H" },
            { "lat": 47.4692119, "lng": 19.0597545, "name": "Infopark" },
            { "lat": 47.4698143, "lng": 19.0536716, "name": "Budafoki út / Dombóvári út" },
            { "lat": 47.4665602, "lng": 19.049538, "name": "Hauszmann Alajos utca / Szerémi út" },
            { "lat": 47.4620694, "lng": 19.0482701, "name": "Hengermalom út / Szerémi út" },
            { "lat": 47.4622567, "lng": 19.043347, "name": "Etele út / Fehérvári út" },
            { "lat": 47.4636049, "lng": 19.0333096, "name": "Bikás park M" },
            { "lat": 47.4640913, "lng": 19.0296236, "name": "Bártfai utca" },
            { "lat": 47.4640348, "lng": 19.0231417, "name": "Kelenföld vasútállomás M" }
        ], branch4: [], branch6: []
    }
];


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
    metroData.forEach(line => {
        new google.maps.Polyline({
            path: line.path, strokeColor: line.color, strokeOpacity: 0.9, strokeWeight: 6, map: map
        });
    });

    // Villamosok
    tramData.forEach(line => {
        let common = new google.maps.Polyline({ path: line.commonPath, strokeColor: "#ffeb3b", strokeOpacity: 0.6, strokeWeight: 3, map: map });
        tramLines.push(common);
        if (line.branch4.length) tramLines.push(new google.maps.Polyline({ path: line.commonPath.concat(line.branch4), strokeColor: "#fdd835", strokeOpacity: 0.6, strokeWeight: 3, map: map }));
        if (line.branch6.length) tramLines.push(new google.maps.Polyline({ path: line.commonPath.concat(line.branch6), strokeColor: "#ffeb3b", strokeOpacity: 0.6, strokeWeight: 3, map: map }));
    });

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

    map.addListener("click", (e) => {
        if (!thermoState.active) return;
        if (thermoState.step === 1) {
            placePointA(e.latLng);
        } else if (thermoState.step === 2) {
            calculateAndPlacePointB(e.latLng);
        }
    });

    loadDistrictData();
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
    if (hidersVisible) {
        clearHiders();
    } else {
        drawHiders();
    }
}

function drawHiders() {
    const radius = 500;
    const style = {
        strokeColor: "#00BCD4",
        strokeOpacity: 0.6,
        strokeWeight: 1,
        fillColor: "#00BCD4",
        fillOpacity: 0.15,
        map: map,
        clickable: false
    };

    let points = [];
    metroData.forEach(line => {
        // Metró megállók (töréspontok) mind fontosak
        points.push(...line.path);
    });

    tramData.forEach(line => {
        // Ha vannak névvel jelölt megállók, csak azokat vesszük (pontos megállóhelyek)
        // Ha nincs névvel ellátott pont (pl. 4-6-os), minden pontot veszünk
        const hasNamedStops = line.commonPath.some(pt => pt.name);
        const stopPoints = hasNamedStops
            ? line.commonPath.filter(pt => pt.name)
            : line.commonPath;
        points.push(...stopPoints);
        if (line.branch4) points.push(...line.branch4);
        if (line.branch6) points.push(...line.branch6);
    });

    points.forEach(pt => {
        const circle = new google.maps.Circle({
            center: pt,
            radius: radius,
            ...style
        });
        hiderCircles.push(circle);
    });

    hidersVisible = true;
}

function clearHiders() {
    hiderCircles.forEach(c => c.setMap(null));
    hiderCircles = [];
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
    const el = document.getElementById('status-bar');
    if (text) {
        el.innerText = text; el.style.display = 'block';
    } else {
        el.style.display = 'none';
    }
}

function toggleTrams() {
    tramsVisible = !tramsVisible;
    tramLines.forEach(line => line.setMap(tramsVisible ? map : null));
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
    localStorage.removeItem('jetLagState');
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
}

function placeMyLocationMarker(pos) {
    const latLng = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    const accuracy = pos.coords.accuracy;

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

// --- PERSISTENCE ---

function saveState() {
    const state = {
        seekerPos: { lat: seekerMarker.getPosition().lat(), lng: seekerMarker.getPosition().lng() },
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
    localStorage.setItem('jetLagState', JSON.stringify(state));
}

function loadState() {
    const saved = localStorage.getItem('jetLagState');
    if (!saved) return;
    const state = JSON.parse(saved);

    if (state.seekerPos) {
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
        document.getElementById('districtBtn').classList.add('off');
    }
}

window.onload = () => {
    initMap();
    setTimeout(loadState, 500); // Biztosítsuk, hogy a térkép betöltött
};
