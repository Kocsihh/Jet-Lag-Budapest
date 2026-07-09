// =============================================================================
// cards.js – Kártya adatok
// A pakli tartalmát ez a fájl definiálja, a logikától teljesen elválasztva.
// Ha kártyát szeretnél módosítani/hozzáadni/törölni, csak ezt a fájlt kell szerkeszteni.
// =============================================================================

// Kártyatípusok és megjelenésük (CSS osztálynév)
const CARD_TYPES = {
    'Idő': { cssClass: 'type-ido' },
    'Átok': { cssClass: 'type-atok' },
    'Speciális': { cssClass: 'type-specialis' },
};

// =============================================================================
// A pakli
// Mezők: nev (string), tipus (string), cost (int), leiras (string)
// cost: hány kártyát kell eldobni kijátszáshoz (0 = ingyenes)
// =============================================================================
const ORIGINAL_DECK = [

    // --- IDŐ KÁRTYÁK (21 db – passzívak, nem kell kijátszani) ---
    { nev: 'Idő +2p', tipus: 'Idő', cost: 0, leiras: '+2 perc egérút.' },
    { nev: 'Idő +2p', tipus: 'Idő', cost: 0, leiras: '+2 perc egérút.' },
    { nev: 'Idő +2p', tipus: 'Idő', cost: 0, leiras: '+2 perc egérút.' },
    { nev: 'Idő +2p', tipus: 'Idő', cost: 0, leiras: '+2 perc egérút.' },
    { nev: 'Idő +2p', tipus: 'Idő', cost: 0, leiras: '+2 perc egérút.' },
    { nev: 'Idő +3p', tipus: 'Idő', cost: 0, leiras: '+3 perc egérút.' },
    { nev: 'Idő +3p', tipus: 'Idő', cost: 0, leiras: '+3 perc egérút.' },
    { nev: 'Idő +3p', tipus: 'Idő', cost: 0, leiras: '+3 perc egérút.' },
    { nev: 'Idő +3p', tipus: 'Idő', cost: 0, leiras: '+3 perc egérút.' },
    { nev: 'Idő +3p', tipus: 'Idő', cost: 0, leiras: '+3 perc egérút.' },
    { nev: 'Idő +5p', tipus: 'Idő', cost: 0, leiras: '+5 perc egérút.' },
    { nev: 'Idő +5p', tipus: 'Idő', cost: 0, leiras: '+5 perc egérút.' },
    { nev: 'Idő +5p', tipus: 'Idő', cost: 0, leiras: '+5 perc egérút.' },
    { nev: 'Idő +7p', tipus: 'Idő', cost: 0, leiras: '+7 perc egérút.' },
    { nev: 'Idő +7p', tipus: 'Idő', cost: 0, leiras: '+7 perc egérút.' },
    { nev: 'Idő +10p', tipus: 'Idő', cost: 0, leiras: '+10 perc egérút.' },
    { nev: 'Idő +10p', tipus: 'Idő', cost: 0, leiras: '+10 perc egérút.' },
    { nev: 'Idő +15p', tipus: 'Idő', cost: 0, leiras: '+15 perc egérút.' },
    { nev: 'Idő +15p', tipus: 'Idő', cost: 0, leiras: '+15 perc egérút.' },
    { nev: 'Idő +20p', tipus: 'Idő', cost: 0, leiras: 'A Játékmester kegye.' },
    { nev: 'Idő +5%', tipus: 'Idő', cost: 0, leiras: 'Az addigi összes bónusz időt növeli 5%-kal.' },

    // --- ÁTOK KÁRTYÁK (25 db – a bújó játssza ki, a hunyóknak szól) ---
    { nev: 'Beragadt ajtó', tipus: 'Átok', cost: 1, duration: 5, leiras: 'Ajtón áthaladásnál (épület/jármű) 2 kockával 7+ dobás kell. Ha nem sikerül: 5p várakozás és újra amíg nem sikerül.' },
    { nev: 'Kátyú-átok', tipus: 'Átok', cost: 1, leiras: 'Keressetek 3 kátyút (min. 20cm) 3 különböző utcában (fotó!).' },
    { nev: 'Váltságdíj levél', tipus: 'Átok', cost: 2, leiras: 'A következő kérdést nyomtassátok ki egy lapra és fotózzátok be.' },
    { nev: 'Falatozóna', tipus: 'Átok', cost: 1, leiras: 'Menjetek egy Falatozónába, kóstoljatok valami újat és mondjatok véleményt.' },
    { nev: 'Falatozóna', tipus: 'Átok', cost: 1, leiras: 'Menjetek egy Falatozónába, kóstoljatok valami újat és mondjatok véleményt.' },
    { nev: 'Merész tipp', tipus: 'Átok', cost: 2, leiras: 'Hunyók tippelnek: ha eltalálják a pontos megállót, a búvó vall. Ha nem: 27p kényszerpihenő a hunyóknak.' },
    { nev: 'ChatGPT-metró', tipus: 'Átok', cost: 2, leiras: 'A ChatGPT mond egy random metrómegállót, oda el kell utazni (átmehetsz rajta).' },
    { nev: 'Virágzó otthon', tipus: 'Átok', cost: 1, leiras: 'A búvó zónája 50%-kal nő.' },
    { nev: 'Szívecske', tipus: 'Átok', cost: 1, leiras: 'Keressetek egy szívecske szimbólumot a környéken, mielőtt kérdezhetnétek.' },
    { nev: 'Cápa-átok', tipus: 'Átok', cost: 2, duration: 25, leiras: '25 percig tilos megállni (folyamatos gyaloglás).' },
    { nev: 'Metró-zár', tipus: 'Átok', cost: 2, duration: 30, leiras: '30 percig tilos a metró használata.' },
    { nev: 'Páratlan járatok', tipus: 'Átok', cost: 1, duration: 30, leiras: '30 percig csak páratlan számú járattal közlekedhettek.' },
    { nev: 'Páros járatok', tipus: 'Átok', cost: 1, duration: 30, leiras: '30 percig csak páros számú járattal közlekedhettek.' },
    { nev: 'Zászló-vadász', tipus: 'Átok', cost: 1, leiras: 'Találjatok magyar zászlót. Fotóval bizonyítva.' },
    { nev: 'Széchenyi Terv', tipus: 'Átok', cost: 1, leiras: 'Fotózzatok EU-s táblát.' },
    { nev: 'Blokád', tipus: 'Átok', cost: 0, leiras: 'Következő metró megvárása.' },
    { nev: 'Akasztófa', tipus: 'Átok', cost: 1, duration: 10, leiras: 'Győzzetek akasztófában a bújó ellen. Ha nem sikerült: 10p várakozás.' },
    { nev: 'Vágányzár v1', tipus: 'Átok', cost: 0, duration: 15, leiras: 'M3-M1 vonal tiltva 15 percig.' },
    { nev: 'Vágányzár v2', tipus: 'Átok', cost: 0, duration: 15, leiras: 'M2-M4 vonal tiltva 15 percig.' },
    { nev: 'Zebra-fóbia', tipus: 'Átok', cost: 1, duration: 30, leiras: 'Felszínen tilos a zebra 30p-ig.' },
    { nev: 'Duna-zár', tipus: 'Átok', cost: 1, duration: 20, leiras: '20p-ig tilos átkelni a folyón.' },
    { nev: 'Aprópénz', tipus: 'Átok', cost: 1, leiras: 'Keress egy bármilyen aprót, akár a földön akár más módon.  (pl: automata)' },
    { nev: 'Szobor-fotó', tipus: 'Átok', cost: 1, leiras: 'Fotózz egy szobrot bárhol.' },
    { nev: 'BKK Hírek', tipus: 'Átok', cost: 0, leiras: 'Olvass fel egy kijelző-hírt videóban.' },
    { nev: 'Táv-dobás', tipus: 'Átok', cost: 1, leiras: 'Dobj egy 5-ös vagy nagyobb értéket egy kockával úgy, hogy legalább 30 méterre messze dobod.' },
    { nev: 'Kis edzés', tipus: 'Átok', cost: 0, leiras: 'Csináljatok 50-50 guggolást videón és küldjétek be a csoportnak' },
    { nev: 'Kis séta', tipus: 'Átok', cost: 1, leiras: 'Sétáljatok pontosan 1 km-t és mérjétek le valamilyen app-al (nem kötelező de jobb ha van)' },
    { nev: 'Kis túra', tipus: 'Átok', cost: 1, leiras: 'Szálljatok fel a legközelebbi tömegközlekedésre és menjetek vele legalább 2 megállót' },
    { nev: 'Rég volt már', tipus: 'Átok', cost: 1, leiras: 'TÖltsetek el legalább 5 percet egy antikváriumban / szuvenírboltban' },
    { nev: 'Hamis érme', tipus: 'Átok', cost: 1, leiras: 'Dobáljatok fel egy érmét addig, amíg nem lesz fej 5x egymás után vagy írás 5x egymás után. Kitartást :)' },

    // --- SPECIÁLIS KÁRTYÁK (9 db – különleges egyedi hatások) ---
    { nev: 'Vétó', tipus: 'Speciális', cost: 0, leiras: 'Kérdés törlése.' },
    { nev: 'Vétó', tipus: 'Speciális', cost: 0, leiras: 'Kérdés törlése.' },
    { nev: 'Másolás', tipus: 'Speciális', cost: 0, leiras: 'Egy kártya másolása.' },
    { nev: 'Átszállójegy', tipus: 'Speciális', cost: 0, duration: 10, leiras: 'Tilos vonalváltás 10p-ig.' },
    { nev: 'Irányváltó', tipus: 'Speciális', cost: 0, leiras: 'A Hunyók azonnal szálljanak le és menjenek vissza 2 megállót, ha vonalon vannak.' },
    { nev: 'Irányváltó', tipus: 'Speciális', cost: 0, leiras: 'A Hunyók azonnal szálljanak le és menjenek vissza 2 megállót, ha vonalon vannak.' },
    { nev: 'Szuper-Vétó', tipus: 'Speciális', cost: 0, leiras: 'Kérdés + Hunyó kérdés kuka.' },
    { nev: 'Kiürült agy', tipus: 'Speciális', cost: 1, leiras: '3 tiltott kérdés 1-1 kategórián belül.' },
    { nev: 'Húzzunk újra', tipus: 'Speciális', cost: 0, leiras: 'Égesd el ezt a kártyát, hogy húzz 2 lapot, amiből 1-et tarthatsz meg.' },
    { nev: 'Húzzunk újra', tipus: 'Speciális', cost: 0, leiras: 'Égesd el ezt a kártyát, hogy húzz 2 lapot, amiből 1-et tarthatsz meg.' }
];
