# ✈️ Jet Lag: Budapest

Ez egy webes segédalkalmazás (Companion App) a népszerű **Jet Lag: The Game** YouTube sorozat szabályaira épülő, élő "bújócska" játékhoz Budapesten.

Inspirációt merítettem szintén ZeneszerzőGeo csatornáján lévő megvalósításából.

Az alkalmazás segít a Hunyóknak (Chasers) és a Bújónak (Hider) a játék mechanikáinak követésében, a térkép kezelésében és a kártyák húzásában.

## 📂 Fájlok és Funkciók

A projekt négy fő modulból áll:

### 1. 🏠 Főmenü (`index.html`)
Ez a nyitóoldal. Innen érhető el a játék három fő komponense. Egyszerű navigációt biztosít a telefonos böngészőkben.

### 2. 🗺️ Térkép és Radar (`map.html`)
A játék "agya". Egy Google Maps alapú térkép, amely speciális rétegeket tartalmaz:
*   **Budapest Határai:** A játékterület vizuális megjelenítése.
*   **Tömegközlekedés:** Metróvonalak (M1, M2, M3, M4) és főbb villamosvonalak (4-6, 1) berajzolva.
*   **Radar:** Gombnyomásra rajzol 500m / 1km sugarú köröket a Hunyó pozíciója köré (a bújó távolságának jelölésére).
*   **Hőmérő (Hot/Cold):** Egyedi fejlesztésű eszköz, amely megmutatja, hogy a Bújó egy adott irányhoz képest "merre" van, és két zónára (zöld/piros) osztja a várost.
*   **Megállók:** Opcionálisan bekapcsolható réteg a lehetséges búvóhelyek (megállók) vizualizálásához.

> **Figyelem:** A térkép használatához érvényes Google Maps API kulcs szükséges!

### 3. 🎴 Pakli és Tarsoly (`deck.html`)
A Hunyók digitális kártyapaklija.
*   **Húzás:** Véletlenszerűen generál lapokat (Idő, Átok, Speciális) a 60 lapos pakliból.
*   **Inventory (Tarsoly):** A húzott kártyákat itt lehet tárolni.
*   **Költségrendszer:** A kártyák kijátszásához ("Cost") más kártyákat kell eldobni. A rendszer automatikusan kezeli a kijelölést és eldobást.

### 4. 🕵️ Hunyó Dashboard (`hunyo.html`)
Adminisztrációs felület a Hunyók számára.
*   **Időzítő:** Visszaszámláló a büntetésekhez (pl. 5 perc várakozás kérdés után).
*   **Napló (Log):** Rögzíti a feltett kérdéseket és a kapott válaszokat, hogy ne vesszen el információ a játék hevében.
*   **Átok követő:** Külön gombok a Bújó által kijátszott átkok (pl. 5/10 perc megállás) mérésére.
