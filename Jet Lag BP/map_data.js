// =============================================================================
// map_data.js – Térkép vonalak és koordináták
// Ez a fájl tartalmazza a metrók és villamosok útvonaladatait.
// =============================================================================

const METRO_DATA = [
    { name: "M1", color: "#ffcd00", path: [{ lat: 47.4967, lng: 19.0503 }, { lat: 47.49791, lng: 19.05396 }, { lat: 47.50049, lng: 19.05730 }, { lat: 47.5024, lng: 19.0594 }, { lat: 47.5042, lng: 19.0617 }, { lat: 47.5065, lng: 19.0645 }, { lat: 47.5085, lng: 19.0671 }, { lat: 47.5106, lng: 19.0700 }, { lat: 47.5147, lng: 19.0775 }, { lat: 47.51720, lng: 19.08080 }, { lat: 47.5194, lng: 19.0911 }] },
    { name: "M2", color: "#e41f18", path: [{ lat: 47.5003, lng: 19.0245 }, { lat: 47.5066, lng: 19.0253 }, { lat: 47.506389, lng: 19.038889 }, { lat: 47.50572, lng: 19.04498 }, { lat: 47.49766, lng: 19.05461 }, { lat: 47.4942, lng: 19.0601 }, { lat: 47.49716, lng: 19.07053 }, { lat: 47.50028, lng: 19.08167 }, { lat: 47.5000, lng: 19.1058 }, { lat: 47.501051, lng: 19.118839 }, { lat: 47.5028, lng: 19.1356 }] },
    { name: "M3", color: "#005ca5", path: [{ lat: 47.56033, lng: 19.09065 }, { lat: 47.55913, lng: 19.07981 }, { lat: 47.54871, lng: 19.07323 }, { lat: 47.5393922, lng: 19.0695 }, { lat: 47.53034, lng: 19.06583 }, { lat: 47.5225, lng: 19.0617 }, { lat: 47.51824, lng: 19.06055 }, { lat: 47.51139, lng: 19.05667 }, { lat: 47.50056, lng: 19.05358 }, { lat: 47.49791, lng: 19.05444 }, { lat: 47.493056, lng: 19.056111 }, { lat: 47.48987, lng: 19.06133 }, { lat: 47.48572, lng: 19.06938 }, { lat: 47.48265, lng: 19.07913 }, { lat: 47.47917, lng: 19.08944 }, { lat: 47.475556, lng: 19.098611 }, { lat: 47.47097, lng: 19.11130 }, { lat: 47.468629, lng: 19.117178 }, { lat: 47.46470, lng: 19.12640 }, { lat: 47.46333, lng: 19.14917 }] },
    { name: "M4", color: "#009540", path: [{ lat: 47.46499, lng: 19.022205 }, { lat: 47.46504, lng: 19.03291 }, { lat: 47.4741667, lng: 19.0458333 }, { lat: 47.477158, lng: 19.046778 }, { lat: 47.483934, lng: 19.053125 }, { lat: 47.487107, lng: 19.057481 }, { lat: 47.489644, lng: 19.061687 }, { lat: 47.492778, lng: 19.072222 }, { lat: 47.49580, lng: 19.07750 }, { lat: 47.50030, lng: 19.08172 }] }
];

const TRAM_DATA = [
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
