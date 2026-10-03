# KuKirin Wheelie Run

Przeglądarkowa gra 2.5D: jedziesz na tylnym kole hulajnogi KuKirin po synthwave'owej promenadzie. Napisana w vanilla HTML/CSS/JS z Canvas 2D i Web Audio, bez bundlera i zależności.

**Zagraj online:** https://kukirin-five.vercel.app

## Uruchomienie

- **Najprościej:** otwórz `index.html` dwuklikiem. Gra działa z `file://`, bo nie używa modułów ES.
- **Przez serwer** (zalecane na telefonie w sieci lokalnej):
  ```bash
  python -m http.server 8000
  ```
  potem otwórz `http://localhost:8000`.
- Czcionki (Russo One, Orbitron) ładują się z Google Fonts. Offline gra użyje fontu zastępczego.
- Dźwięk startuje po pierwszym kliknięciu lub klawiszu (wymóg przeglądarek).

## Sterowanie

| Akcja | Klawiatura | Dotyk |
|---|---|---|
| Pochyl do tyłu (unieś przód) | A / ← | ◀ |
| Pochyl do przodu | D / → | ▶ |
| Pas dalej / bliżej | W / ↑, S / ↓ | ▲ ▼ lub swipe na prawej połowie |
| Boost | Shift | BOOST |
| Start / restart | Spacja | przycisk |
| Pauza | P / Esc | II |
| Wyciszenie | M | ustawienia |
| Debug (wykresy θ, ω, momentów) | F1 | ustawienia |

W trybie debug klawisze 1–8 stroją na żywo grawitację, siłę korekty, tłumienie i rampę. Z konsoli: `KUKIRIN.CONFIG.gravity = 180`.

## Parametry CONFIG (góra `game.js`)

**Balans** (stopnie i sekundy):

| Parametr | Co zmienia |
|---|---|
| `physicsHz` | Częstotliwość stałego kroku fizyki (120). |
| `gravity` | Jak mocno hulajnoga „ucieka” od punktu równowagi. Więcej = trudniej i nerwowiej. |
| `damping` | Tłumienie prędkości kątowej. Więcej = spokojniej. |
| `inertia` | Bezwładność, dzieli wszystkie momenty. Więcej = ociężale. |
| `correctionForce` | Maksymalna siła korekty A/D. |
| `correctionRampUp` / `correctionRampDown` | Czas narastania korekty przy trzymaniu klawisza i jej wygaszania po puszczeniu. |
| `correctionCurve` | Kształt rampy. Poniżej 1 = mocniejszy chwyt na początku. |
| `catchAssist` | Bonus siły, gdy korekta hamuje obrót. Daje uczucie „łapania” równowagi. |
| `maxAngularVelocity` | Limit prędkości kątowej. |
| `yellowMargin` | Szerokość żółtej strefy wokół sweet spotu. |
| `perfectBand`, `perfectTime` | Wąskie pasmo „perfect” i czas potrzebny na bonus. |
| `startAngle`, `startGrace` | Kąt startowy i płynne włączanie grawitacji po starcie. |
| `noiseTorque`, `microBumpImpulse` | Ciągłe drgania i mikro-uderzenia nawierzchni. |
| `bumpImpulse`, `manholeImpulse`, `coneImpulse` | Kopnięcia od nierówności, studzienek i pachołków. |

**Pasy:**

| Parametr | Co zmienia |
|---|---|
| `laneChangeTime`, `laneChangeCooldown` | Czas animacji zmiany pasa i przerwa po niej. |
| `laneChangeImpulse` | Impuls kątowy przy zmianie pasa, mnożony przez prędkość. W unosi przód, S go dociska. |
| `laneInputBuffer` | Jak długo pamiętane jest W/S wciśnięte w trakcie animacji. |

**Prędkość:**

| Parametr | Co zmienia |
|---|---|
| `baseSpeed`, `maxSpeed`, `speedRampTime` | Gra sama przyspiesza z czasem jazdy: od `baseSpeed` (36 km/h) płynnie do `maxSpeed` (86 km/h). `speedRampTime` to stała czasowa: po 150 s jest pokonane ok. 63% drogi do limitu. Co 10 km/h pojawia się komunikat SPEED UP. |
| `laneImpulseMaxScale` | Górny limit skalowania impulsu zmiany pasa z prędkością, żeby przy dużej prędkości unik nie był nie do opanowania. |
| `carSpeedFactor` | Prędkość aut na pasach jako ułamek prędkości gracza. |
| `frontDropSlowdown`, `frontDropRecover` | Spowolnienie po opadnięciu na przednie koło i czas powrotu. |

**Boost:**

| Parametr | Co zmienia |
|---|---|
| `boostCost`, `boostDuration`, `boostSpeedMul`, `boostCooldown` | Ekonomia i działanie boosta. |
| `boostKick`, `boostTorque`, `boostTorqueTime` | Szarpnięcie kąta przy boostcie: natychmiastowe i przez pierwsze 0,5 s. |
| `batteryValue`, `startBattery` | Ładowanie z jednej baterii i stan na starcie. |

**Wiatr i trudność w czasie:**

| Parametr | Co zmienia |
|---|---|
| `windTorque`, `windStartDistance`, `windIntervalMin/Max`, `windWarnTime` | Podmuchy wiatru i ostrzeżenie w HUD. |
| `difficultyRampDistance` | Dystans do pełnej trudności. |
| `difficulty*Gain` | O ile rosną grawitacja, zakłócenia i wiatr przy pełnej trudności. |

**Punkty:** `comboStepTime`, `maxCombo` oraz `points*`: wartości za dystans, sweet spot, baterie, close call, perfect, łańcuch baterii i misję. `pedestrian*` to kary za potrącenie pieszego.

**Świat:**

| Parametr | Co zmienia |
|---|---|
| `pxPerMeter` | Skala świata. |
| `stageLength` | Co ile metrów zmienia się pora dnia (domyślnie 1000). |
| `spawnAhead`, `introDistance` | Jak daleko z przodu generowane są wzorce i długość spokojnego startu (60 m). Gęstość ruchu rośnie z czasem: odstępy między wzorcami zmniejszają się przez pierwsze 4 minuty (`density` w `Spawner.spawn`). |

**Opcje i poziomy:**

| Parametr | Co zmienia |
|---|---|
| `invertBalance` | Odwraca kierunek A/D, ◀ ▶ i przechyłu. |
| `difficulty` | Domyślny poziom trudności. |
| `difficulties` | Dla każdego poziomu: sweet spot, mnożniki grawitacji, tłumienia, prędkości i zakłóceń, kąt wywrotki oraz liczba żyć. |

## Architektura

- **Pętla:** `requestAnimationFrame` ze stałym krokiem fizyki (1/120 s), akumulatorem i interpolacją renderu. `timeScale` daje slow motion przy wywrotce.
- **Fizyka balansu:** odwrócone wahadło `α = (korekta + G·sin(θ − θ₀) + zakłócenia − c·ω) / I`. θ₀ leży w środku sweet spotu, więc równowaga jest niestabilna i wymaga stałego łapania.
- **Spawner:** ręcznie zaprojektowane wzorce w trzech poziomach trudności. Odstępy liczone są w sekundach przejazdu, a każdy rząd zostawia wolny pas. Auta na pasach są umieszczane tak, by spotkać gracza w zaplanowanym punkcie.
- **Pule obiektów:** przeszkody, cząsteczki i napisy. Prerenderowane sprite'y poświaty i okna wieżowców.
- **Maszyna stanów:** MENU → PLAYING → PAUSED → GAMEOVER. Ekrany są w DOM, HUD na canvasie.

## Pięć pomysłów na rozszerzenia

1. **Skiny i garaż:** modele KuKirin (G2, G3, C1) z innymi parametrami (rozstaw osi = bezwładność, moc = siła boosta) oraz stroje jeźdźca kupowane za baterie.
2. **Power-upy:** magnes na baterie, żyroskop (chwilowo szerszy sweet spot), tarcza na jedną kolizję, „slow-mo focus” ładowany za perfect balance.
3. **Tryb dzienny/nocny i pogoda:** pełny cykl dobowy, deszcz (mniejsze tłumienie, odbicia neonów na mokrym asfalcie) i mgła ograniczająca widoczność.
4. **Ranking online i ghost:** tablica wyników przez prosty backend (np. Supabase) plus „duch” najlepszego przejazdu. Deterministyczny seed RNG już to umożliwia.
5. **Misje i kariera:** codzienne wyzwania ze stałym seedem, drzewko celów (np. „3× close call podczas boosta”) i odblokowywane dzielnice z innymi przeszkodami (tramwaje, rowerzyści).
