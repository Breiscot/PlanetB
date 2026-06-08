        
        Cesium.Ion.defaultAccessToken = '';

        (function patchCesiumRangeError() {
            const originalRender = Cesium.Scene.prototype.render;
            Cesium.Scene.prototype.render = function() {
                try {
                    return originalRender.apply(this, arguments);
                } catch (e) {
                    if (e instanceof RangeError && e.message.includes('Invalid array length')) {
                        return;
                    }
                    throw e;
                }
            };
        })();

        let WEATHER_API_KEY = localStorage.getItem('weatherApiKey') || '';
        let viewer;
        let autoRotateEnabled = false;
        let nightMode = false;
        let gridEnabled = false;
        let gridLayer = null;
        let markers = [];
        let currentBaseLayer = 'satellite';
        let currentPlanet = 'earth';
        let cloudsEnabled = false;
        let cloudsLayer = null;
        let cloudsRotationHandler = null;
        let cloudsEntity = null;
        let auroraEnabled = false;
        let auroraEntities = [];
        let auroraAnimationHandler = null;
        let auroraTime = 0;
        let auroraLayer = null;
        let solarSystemActive = false;
        let solarSystemObjects = {};
        let solarSystemAnimId = null;
        let weatherCursorMode = false;
        let weatherClickHandler = null;
        let solarSpeed = 1.0;
        let solarLabelsVisible = true;
        let solarOrbitsVisible = true;
        let solarPaused = false;
        let selectedSSPlanet = null;
        let distanceMeasurementActive = false;
        let measurePoints = [];
        let measureEntities = [];
        let measureLines = [];
        let measureLabels = [];
        let measureClickHandler = null;
        let measureTooltip = null;
        let issTrackingActive = false;
        let issEntity = null;
        let issPathEntity = null;
        let issPositionHistory = [];
        let issTrackingInterval = null;
        let issModel = null;
        let issCameraViewActive = false;
        let originalCameraPosition = null;
        let originalCameraOrientation = null;
        let issMarkerEntity = null;
        let issGlowEntity = null;

        // Database Planets
        const PLANETS = {
            earth: {
                name: 'Earth',
                emoji: '🌍',
                radius: 6371000,
                description: 'The Earth is our planet',
                distance: '0 km',
                diameter: '12,742 km',
                gravity: '9.81 m/s²',
                temperature: '15°C (average)',
                moons: '1 (Moon)',
                dayLength: '24 hours',
                yearLength: '365.25 days',
                atmosphere: 'N₂, O₂, Ar',
                textureUrl: null,
                color: '#4fc3f7',
                cameraHeight: 15000000,
                hasAtmosphere: true,
                scale: 1.0
            },
            moon: {
                name: 'Moon',
                emoji: '🌕',
                radius: 1737400,
                description: 'The natural satellite of Earth',
                distance: '384,400 km',
                diameter: '3,474 km',
                gravity: '1.62 m/s²',
                temperature: '-23°C (average)',
                moons: '0',
                dayLength: '27.3 days',
                yearLength: '27.3 days',
                atmosphere: 'Null',
                textureUrl: 'textures/planets/moon.jpg',
                color: '#aaa',
                cameraHeight: 8000000,
                hasAtmosphere: false,
                scale: 0.27
            },
            mercury: {
                name: 'Mercury',
                emoji: '⚪',
                radius: 2439700,
                description: 'The planet closest to the sun',
                distance: '77.3 millions km',
                diameter: '4,879 km',
                gravity: '3.7 m/s²',
                temperature: '167°C (average)',
                moons: '0',
                dayLength: '58.6 days',
                yearLength: '88 days',
                atmosphere: 'Almost null',
                textureUrl: 'textures/planets/mercury.jpg',
                color: '#8c7e6d',
                cameraHeight: 8000000,
                hasAtmosphere: false,
                scale: 0.38
            },
            venus: {
                name: 'Venus',
                emoji: '🟠',
                radius: 6051800,
                description: 'The hottest planet in the solar system',
                distance: '41.4 millions km',
                diameter: '12,104 km',
                gravity: '8.87 m/s²',
                temperature: '464°C (average)',
                moons: '0',
                dayLength: '243 days',
                yearLength: '225 days',
                atmosphere: 'CO² very dense',
                textureUrl: 'textures/planets/venus.jpg',
                color: '#e8a84c',
                cameraHeight: 14000000,
                hasAtmosphere: true,
                scale: 0.95
            },
            mars: {
                name: 'Mars',
                emoji: '🔴',
                radius: 3389500,
                description: 'The red planet',
                distance: '78.3 millions km',
                diameter: '6,779 km',
                gravity: '3.72 m/s²',
                temperature: '-65°C (average)',
                moons: '2 (Phobos, Deimos)',
                dayLength: '24.6 hours',
                yearLength: '687 days',
                atmosphere: 'CO² subtle',
                textureUrl: 'textures/planets/mars.jpg',
                color: '#c1440e',
                cameraHeight: 10000000,
                hasAtmosphere: false,
                scale: 0.53
            },
            jupiter: {
                name: 'Jupiter',
                emoji: '🟠',
                radius: 69911000,
                description: 'The largest gas giant',
                distance: '628.7 millions km',
                diameter: '139,820 km',
                gravity: '24.79 m/s²',
                temperature: '-110°C (clouds)',
                moons: '95 (Io, Europa, Ganimede...)',
                dayLength: '9.9 hours',
                yearLength: '11.86 years',
                atmosphere: 'H₂ He',
                textureUrl: 'textures/planets/jupiter.jpg',
                color: '#c88b3a',
                cameraHeight: 20000000,
                hasAtmosphere: false,
                scale: 10.97
            },
            saturn: {
                name: 'Saturn',
                emoji: '🪐',
                radius: 58232000,
                description: 'The gaseous one with the rings',
                distance: '1.275 millions km',
                diameter: '116,460 km',
                gravity: '10.44 m/s²',
                temperature: '-140°C (clouds)',
                moons: '146 (Titano, Encelado...)',
                dayLength: '10.7 hours',
                yearLength: '29.46 years',
                atmosphere: 'H₂ He',
                textureUrl: 'textures/planets/saturn.jpg',
                color: '#e8d5a3',
                cameraHeight: 20000000,
                hasAtmosphere: false,
                scale: 9.14
            },
            uranus: {
                name: 'Uranus',
                emoji: '🔵',
                radius: 25362000,
                description: 'The tilted ice giant',
                distance: '2.724 millions km',
                diameter: '50,724 km',
                gravity: '8.87 m/s²',
                temperature: '-195°C',
                moons: '27 (Titania, Oberon...)',
                dayLength: '17.2 hours',
                yearLength: '84 years',
                atmosphere: 'H₂ He, CH₄',
                textureUrl: 'textures/planets/uranus.jpg',
                color: '#4fc1e9',
                cameraHeight: 18000000,
                hasAtmosphere: false,
                scale: 3.98
            },
            neptune: {
                name: 'Neptune',
                emoji: '🔵',
                radius: 24622000,
                description: 'The windiest planet',
                distance: '4.351 millions km',
                diameter: '49,244 km',
                gravity: '11.15 m/s²',
                temperature: '-200°C',
                moons: '16 (Tritone...)',
                dayLength: '16.1 hours',
                yearLength: '164.8 years',
                atmosphere: 'H₂ He, CH₄',
                textureUrl: 'textures/planets/neptune.jpg',
                color: '#3498db',
                cameraHeight: 18000000,
                hasAtmosphere: false,
                scale: 3.86
            },
            pluto: {
                name: 'Pluto',
                emoji: '⚪',
                radius: 1188300,
                description: 'The dwarf planet at the edge of the solar system',
                distance: '5.906 millions km',
                diameter: '2,377 km',
                gravity: '0.62 m/s²',
                temperature: '-229°C',
                moons: '5 (Caronte...)',
                dayLength: '6.4 days',
                yearLength: '248 years',
                atmosphere: 'N₂ very thin',
                textureUrl: 'textures/planets/pluto.jpg',
                color: '#8e735b',
                cameraHeight: 8000000,
                hasAtmosphere: false,
                scale: 0.18
            },
            timber_hearth: {
                name: 'Timber Hearth',
                emoji: '',
                radius: 300,
                description: 'Home planet of the Hearthians. A small rocky world with forests, geysers and a village.',
                distance: 'Outer Wilds System',
                diameter: '~600 m',
                gravity: 'Low',
                temperature: 'Temperate',
                moons: '1 (Attlerock)',
                dayLength: '22 min (loop)',
                yearLength: '22 min (loop)',
                atmosphere: 'Breathable',
                textureUrl: null,
                modelUrl: 'OW-planets/TimberHearth/TimberHearth_noMoon.glb',
                color: '#4a7c3f',
                cameraHeight: 15000000,
                hasAtmosphere: true,
                scale: 1.0,
                isOuterWilds: true
            },
            giants_deep: {
                name: "Giant's Deep",
                emoji: '',
                radius: 500,
                description: 'A gas giant covered in a turbulent ocean with massive tornadoes that launch islands into orbit.',
                distance: 'Outer Wilds System',
                diameter: '~1000 m',
                gravity: 'High',
                temperature: 'Cold (surface)',
                moons: '0',
                dayLength: '22 min (loop)',
                yearLength: '22 min (loop)',
                atmosphere: 'Dense, stormy',
                textureUrl: null,
                modelUrl: 'OW-planets/GiantsDeep/GiantsDeep_green.glb',
                color: '#1a5c3a',
                cameraHeight: 15000000,
                hasAtmosphere: true,
                scale: 1.0,
                isOuterWilds: true
            },
            brittle_hollow: {
                name: "Brittle Hollow",
                emoji: '',
                radius: 400,
                description: 'A fragile planet that slowly collapses into its own black hole as volcanic moon bombards it.',
                distance: 'Outer Wilds System',
                diameter: '~800 m',
                gravity: 'Medium',
                temperature: 'Varies',
                moons: "1 (Hollow's Lantern)",
                dayLength: '22 min (loop)',
                yearLength: '22 min (loop)',
                atmosphere: 'Thin',
                textureUrl: null,
                modelUrl: 'OW-planets/BrittleHollow/BrittleHollow_noMoon.glb',
                color: '#6b4c8a',
                cameraHeight: 15000000,
                hasAtmosphere: false,
                scale: 1.0,
                isOuterWilds: true
            },
            ash_twin: {
                name: "Ash Twin",
                emoji: '',
                radius: 250,
                description: 'One of the Hourglass Twins. Sand flows from Ember Twin through a sand column connecting them.',
                distance: 'Outer Wilds System',
                diameter: '~500 m',
                gravity: 'Low',
                temperature: 'Hot',
                moons: '0 (twin: Ember Twin)',
                dayLength: '22 min (loop)',
                yearLength: '22 min (loop)',
                atmosphere: 'None',
                textureUrl: null,
                modelUrl: 'OW-planets/Ash-EmberTwins/TwinPlanets_Ash-Ember.glb',
                color: '#c4956a',
                cameraHeight: 15000000,
                hasAtmosphere: false,
                scale: 1.0,
                isOuterWilds: true
            },
            dark_bramble: {
                name: "Dark Bramble",
                emoji: '',
                radius: 450,
                description: 'A terrifying seed that consumed the original fifth planet. Bigger on the inside than the outside.',
                distance: 'Outer Wilds System',
                diameter: '~900 m (outside)',
                gravity: 'Zero (inside)',
                temperature: 'Freezing',
                moons: '0',
                dayLength: '22 min (loop)',
                yearLength: '22 min (loop)',
                atmosphere: 'Foggy void',
                textureUrl: null,
                modelUrl: 'OW-planets/DarkBramble/DarkBramble.glb',
                color: '#2a3a2a',
                cameraHeight: 15000000,
                hasAtmosphere: false,
                scale: 1.0,
                isOuterWilds: true
            },
            halo_ring: {
                name: 'Halo',
                emoji: '',
                radius: 5000,
                description: 'Installation 04. A massive ring-shaped superweapon built by the Forerunners to contain the Flood.',
                distance: 'Soell System',
                diameter: '10.000 km',
                gravity: '1.0 G (Artificial)',
                temperature: 'Varied (Earth-like)',
                moons: '0',
                dayLength: 'Artificial cycle',
                yearLength: 'N/A',
                atmosphere: 'Earth-like (artificial)',
                textureUrl: null,
                modelUrl: 'Halo-planets/HaloRing/Halo.glb',
                color: '#4a9e6b',
                cameraHeight: 15000000,
                hasAtmosphere: true,
                scale: 1.0,
                isHalo: true
            },
            reach: {
                name: 'Reach',
                emoji: '',
                radius: 7000,
                description: 'A major UNSC military stronghold and the largest human colony. Fell during the Covenant invasion in 2552.',
                distance: 'Epsilon Eridani System',
                diameter: '15.273 km',
                gravity: '1.08 G',
                temperature: 'Temperate',
                moons: '2 (Csodaszarvas, Turul)',
                dayLength: '27 hours',
                yearLength: '390 days',
                atmosphere: 'N₂, O₂ (breathable)',
                textureUrl: null,
                modelUrl: 'Halo-planets/Reach/Reach.glb',
                color: '#3a6b9e',
                cameraHeight: 15000000,
                hasAtmosphere: true,
                scale: 1.0,
                isHalo: true
            }
        };

        // SOLAR SYSTEM DATA

        const SOLAR_SYSTEM_DATA = {
            mercury: {
                image: 'https://upload.wikimedia.org/wikipedia/commons/4/4a/Mercury_in_true_color.jpg',
                subtitle: 'The Swift Planet — Closest to the Sun',
                about: 'Mercury is the smallest and innermost planet in the Solar System. It has no atmosphere to retain heat, causing extreme temperature swings from -180°C at night to 430°C during the day. Despite being closest to the Sun, it is not the hottest planet, that title belongs to Venus.',
                curiosities : [
                    'A year on Mercury lasts only 88 Earth days, but a single day lasts 59 Earth days',
                    'Mercury has ice in permanently shadowed creters near its poles',
                    'It is shrinking! Mercury has contracted about 7 km in radius over billions of years',
                    'Mercury has the most eccentric orbit of any planet in our solar system',
                    'Its surface looks remarkably similar to our Moon'
                ],
                missions: [
                    'Mariner 10 (1974-1975) — First spacecraft to visit Mercury, mapped 45% of surface',
                    'MESSENGER (2011-2015) — Orbited Mercury, discovered water ice at poles',
                    'BepiColombo (2018-2025) — ESA/JAXA mission currently en route'
                ]
            },
            venus: {
                image: 'https://upload.wikimedia.org/wikipedia/commons/0/08/Venus_from_Mariner_10.jpg',
                subtitle: 'Earth\'s Evil Twin — The hottest Planet',
                about: 'Venus is often called Earth\'s twin due to its similar size, but its conditions are hellish. A thick CO₂ atmosphere creates a runaway greenhouse effect, making it the hottest planet at 464°C. Its surface pressure is 90 times Earth\'s — equivalent to being 1 km underwater.',
                curiosities: [
                    'Venus rotates backwards (retrograde) compared to most planets',
                    'A day on Venus (243 Earth days) is longer than its year (225 Earth days)',
                    'It rains sulfuric acid in the upper atmosphere',
                    'Venus has over 1,600 major volcanoes — more than any other planet',
                    'Soviet Venera probes survived on the surface for only about 2 hours'
                ],
                missions: [
                    'Venera 7 (1970) — First successful landing on another planet',
                    'Magellan (1990-1994) — Mapped 98% of Venus surface with radar',
                    'Venus Express (2006-2014) — ESA orbiter studying atmosphere',
                    'DAVINCI+ & VERITAS — Upcoming NASA missions planned for 2030s'
                ]
            },
            earth: {
                image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/The_Earth_seen_from_Apollo_17.jpg/960px-The_Earth_seen_from_Apollo_17.jpg',
                subtitle: 'The Blue Marble — Our Home',
                about: 'Earth is the only known planet to harbon life. With 71% of its surface covered in water, a protective magnetic field, and a nitrogen-oxygen atmosphere, it provides the perfect conditions for a diverse biosphere. Earth is approximately 4.54 billion years old.',
                curiosities: [
                    'Earth is the densest planet in the Solar System',
                    'The planet\'s rotation is gradually slowing — days are getting longer by 1.4 milliseconds per century',
                    '99% of Earth\'s gold is in its core, enough to coat the surface in 1.5 feet of gold',
                    'Earth is the only planet not named after a god',
                    'Lightning strikes Earth about 8.6 million times per day'
                ],
                missions: [
                    'Apollo 8 (1968) — First humans to orbit another world and see Earthrise',
                    'Apollo 17 (1972) — Took the famous Blue Marble photo',
                    'ISS (1998-present) — Continuous human presence in orbit since 2000',
                    'DSCOVR (2015-present) — Monitors Earth from Lagrange point L1'
                ]
            },
            mars: {
                image: 'https://upload.wikimedia.org/wikipedia/commons/0/0c/Mars_-_August_30_2021_-_Flickr_-_Kevin_M._Gill.png',
                subtitle: 'The Red Planet — Future Human Frontier',
                about: 'Mars is the most explored planet besides Earth. Its red color comes from iron oxide (rust) on its surface. Mars has the largest volcano (Olympus Mons, 21.9 km tall) and the longest canyon (Valles Marineris, 4.000 km) in the Solar System. Evidence suggests it once had rivers and lakes.',
                curiosities: [
                    'Olympus Mons is nearly 3 times the height of Mount Everest',
                    'Mars has two tiny moons: Phobos and Deimos, likely captured asteroids',
                    'A Mars day (sol) is 24 hours and 37 minutes — very close to Earth\'s',
                    'Mars sunsets appear blue due to fine dust in the atmosphere',
                    'The Curiosity rover sings "Happy Birthday" to itself every year on its anniversary'
                ],
                missions: [
                    'Viking 1 & 2 (1976) — First successful Mars landers',
                    'Spirit & Opportunity (2004) — Rovers that far exceeded their 90-day missions',
                    'Curiosity (2012-present) — Car-sized rover exploring Gale Crater',
                    'Perseverance & Ingenuity (2021-present) — Collecting samples and first Mars helicopter',
                    'Mars Sample Return — Planned mission to bring Perseverance samples to Earth'
                ]
            },
            jupiter: {
                image: 'https://upload.wikimedia.org/wikipedia/commons/e/e2/Jupiter.jpg',
                subtitle: 'King of the Planets — The Gas Giant',
                about: 'Jupiter is the largest planet in our Solar System — so massive that over 1,300 Earths could fit inside it. Its Great Red Spot is a storm larger than Earth that has been raging for at least 400 years. Jupiter acts as a cosmic vacuum cleaner, protecting inner planets from asteroid impacts.',
                curiosities: [
                    'Jupiter has the shortest day of any planet — just 9 hours 55 minutes',
                    'The Great Red Spot is shrinking but is still larger than Earth',
                    'Jupiter has 95 known moons, including the four Galilean moons',
                    'Europa likely has a subsurface ocean with more water than all of Earth\'s oceans',
                    'Jupiter\'s magnetic field is 20,000 times stronger than Earth\'s'
                ],
                missions: [
                    'Pioneer 10 & 11 (1973-74) — First spacecraft to fly by Jupiter',
                    'Voyager 1 & 2 (1979) — Detailed images and discovery of Jupiter\'s rings',
                    'Galileo (1995-2003) — First orbiter, dropped probe into atmosphere',
                    'Juno (2016-present) — Studying Jupiter\'s interior and magnetic field',
                    'Europa Clipper (2024) — Mission to study Europa\'s ocean'
                ]
            },
            saturn: {
                image: 'https://upload.wikimedia.org/wikipedia/commons/c/c7/Saturn_during_Equinox.jpg',
                subtitle: 'The Ringed Beauty — Jewel of the Solar System',
                about: 'Saturn is famous for its stunning ring system, made of billions of particles of ice and rock ranging from tiny grains to house-sized chunks. Despite being the second-largest planet, Saturn is the least dense — it would float in a bathtub large enough to hold it.',
                curiosities: [
                    'Saturn\'s rings are only about 10 meters thick but extend 282,000 km from the planet',
                    'Saturn has a hexagonal storm at its north pole — unique in the Solar System',
                    'Titan, Saturn\'s largest moon, has lakes of liquid methane and a thick atmosphere',
                    'Enceladus shoots geysers of water ice into space from its south pole',
                    'Saturn\'s density is 0.687 g/cm³ — less dense than water'
                ],
                missions: [
                    'Pioneer 11 (1979) — First flyby of Saturn',
                    'Voyager 1 & 2 (1980-81) — Detailed study of rings and moons',
                    'Cassini-Huygens (2004-2017) — 13 years orbiting Saturn, Huygens landed on Titan',
                    'Dragonfly (planned 2027) — Drone mission to explore Titan\'s surface'
                ]
            },
            uranus: {
                image: 'https://upload.wikimedia.org/wikipedia/commons/3/3d/Uranus2.jpg',
                subtitle: 'The Tilted Ice Giant — Rolling Through Space',
                about: 'Uranus is unique among planets because it rotates on its side, with an axial tilt of 98°. This means it essentially rolls around the Sun like a ball. It\'s classified as an ice giant, with its blue-green color coming from methane in its atmosphere.',
                curiosities: [
                    'Uranus rotates on its side — likely due to a massive ancient collision',
                    'It takes 84 Earth years to orbit the Sun once',
                    'Uranus has 13 known rings, discovered in 1977',
                    'Winds on Uranus can reach speeds of 900 km/h',
                    'Its interior is thought to contain a "diamond rain" from compressed carbon'
                ],
                missions: [
                    'Voyager 2 (1986) — The only spacecraft to visit Uranus',
                    'Uranus Orbiter — Proposed flagship mission recommended by Planetary Science Decadal Survey 2023-2032'
                ]
            },
            neptune: {
                image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Neptune_Full.jpg/960px-Neptune_Full.jpg',
                subtitle: 'The Windiest Planet — Deep Blue World',
                about: 'Neptune is the most distant planet from the Sun and the windiest world in our Solar System, with wind speeds reaching 2,100 km/h. Its deep blue color comes from methane absorbing red light. Neptune was the first planet found through mathematical prediction rather than observation.',
                curiosities: [
                    'Neptune has the strongest sustained winds of any planet — up to 2,100 km/h',
                    'It was discovered in 1846 after mathematical predictions by Le Verrier',
                    'Neptune\'s moon Triton orbits backwards — likely a captured Kuiper Belt object',
                    'A year on Neptune lasts 164.8 Earth years',
                    'Neptune has completed only one orbit since its discovery in 1846 (completed 2011)'
                ],
                missions: [
                    'Voyager 2 (1989) — The only spacecraft to visit Neptune',
                    'Various Neptune orbiter concepts are being studied for future decades'
                ]
            },
            pluto: {
                image: 'https://upload.wikimedia.org/wikipedia/commons/e/ef/Pluto_in_True_Color_-_High-Res.jpg',
                subtitle: 'The Dwarf Planet — Heart of the Kuiper Belt',
                about: 'Pluto was reclassified as a dwarf planet in 2006 but remains one of the most fascinating worlds. The New Horizons flyby in 2015 revealed a geologically active world with nitrogen glaciers, a thin atmosphere, and a heart-shaped feature named Tombaugh Regio.',
                curiosities: [
                    'Pluto\'s heart-shaped region (Tombaugh Regio) is larger than Texas',
                    'Pluto and its moon Charon are tidally locked — they always show the same face to each other',
                    'Pluto has blue skies and red water ice on its surface',
                    'It takes 248 Earth years for Pluto to orbit the Sun once',
                    'Pluto is smaller than Earth\'s Moon'
                ],
                missions: [
                    'New Horizons (2015) — First and only flyby, revealed stunning detail',
                    'New Horizons then continued to fly by Arrokoth (2019) in the Kuiper Belt'
                ]
            }
        };

        function loadImage(url) {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.crossOrigin = 'anonymous';

                img.onload = () => resolve(img);
                img.onerror = (e) => reject(new Error('Image load failed: ' + url));

                const timeout = setTimeout(() => {
                    reject(new Error('Image load timeout: ' + url));
                }, 10000);

                img.onload = () => {
                    clearTimeout(timeout);
                    resolve(img);
                };

                img.src = url;
            });
        }

        function resizeImageToPowerOfTwo(img, maxWidth, maxHeight) {
            const canvas = document.createElement('canvas');
            canvas.width = maxWidth || 2048;
            canvas.height = maxHeight || 1024;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            return canvas.toDataURL('image/jpeg', 0.92);
        }

        // Procedural Texture for planets

        function createProceduralTexture(planet) {
            const canvas = document.createElement('canvas');
            canvas.width = 2048;
            canvas.height = 1024;
            const ctx = canvas.getContext('2d');

            const baseColor = Cesium.Color.fromCssColorString(planet.color);
            const r = Math.floor(baseColor.red * 255);
            const g = Math.floor(baseColor.green * 255);
            const b = Math.floor(baseColor.blue * 255);

            const bgGradient = ctx.createLinearGradient(0, 0, 0, 1024);
            bgGradient.addColorStop(0, `rgb(${Math.min(255, r + 20)}, ${Math.min(255, g + 20)}, ${Math.min(255, b + 20)})`);
            bgGradient.addColorStop(0.3, `rgb(${r}, ${g}, ${b})`);
            bgGradient.addColorStop(0.5, `rgb(${Math.max(0, r - 10)}, ${Math.max(0, g - 10)}, ${Math.max(0, b - 10)})`);
            bgGradient.addColorStop(0.7, `rgb(${r}, ${g}, ${b})`);
            bgGradient.addColorStop(1, `rgb(${Math.min(255, r + 15)}, ${Math.min(255, g + 15)}, ${Math.min(255, b + 15)})`);
            ctx.fillStyle = bgGradient;
            ctx.fillRect(0, 0, 2048, 1024);

            const isGasGiant = ['jupiter', 'saturn', 'uranus', 'neptune'].includes(planet.name.toLowerCase()) || planet.color === '#c88b3a' || planet.color === '#e8d5a3' || planet.color === '#4fc1e9' || planet.color === '#3498db';
            const isRocky = ['mercury', 'moon', 'pluto'].includes(planet.name.toLowerCase()) || planet.color === '#8c7e6d' || planet.color === '#aaaaaa' || planet.color === '#8e735b';

            if (isGasGiant) {
                // Horizontal bands for Gas Giant
                for (let y = 0; y < 1024; y++) {
                    const bandIntensity = Math.sin(y * 0.03) * 0.15 + Math.sin(y * 0.07) * 0.08 + Math.sin(y * 0.15) * 0.05;
                    const noise = (Math.random() - 0.5) * 10;

                    const br = Math.max(0, Math.min(255, r + bandIntensity * 255 + noise));
                    const bg2 = Math.max(0, Math.min(255, g + bandIntensity * 200 + noise));
                    const bb = Math.max(0, Math.min(255, b + bandIntensity * 150 + noise));

                    ctx.fillStyle = `rgb(${br}, ${bg2}, ${bb})`;
                    ctx.fillRect(0, y, 2048, 1);
                }

                // Turbulence
                for (let i = 0; i < 200; i++) {
                    const x = Math.random() * 2048;
                    const y = Math.random() * 1024;
                    const w = Math.random() * 100 + 20;
                    const h = Math.random() * 5 + 1;
                    const alpha = Math.random() * 0.1;
                    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
                    ctx.fillRect(x, y, w, h);
                }

                // Great Red Spot for Jupiter
                if (planet.name === 'Jupiter') {
                    ctx.beginPath();
                    ctx.ellipse(1400, 580, 120, 60, 0, 0, Math.PI * 2);
                    const spotGradient = ctx.createRadialGradient(1400, 580, 10, 1400, 580, 100);
                    spotGradient.addColorStop(0, 'rgba(200, 80, 50, 0.6)');
                    spotGradient.addColorStop(0.5, 'rgba(180, 60, 30, 0.4)');
                    spotGradient.addColorStop(1, 'rgba(160, 50, 20, 0.1)');
                    ctx.fillStyle = spotGradient;
                    ctx.fill();
                }

            } else if (isRocky) {
                for (let i = 0; i < 500; i++) {
                    const cx = Math.random() * 2048;
                    const cy = Math.random() * 1024;
                    const cr = Math.random() * 15 + 2;
                    const alpha = Math.random() * 0.3 + 0.05;

                    // Border of the Crater
                    ctx.beginPath();
                    ctx.arc(cx, cy, cr, 0, Math.PI * 2);
                    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
                    ctx.lineWidth = 1;
                    ctx.stroke();

                    // Inside Shadow
                    ctx.beginPath();
                    ctx.arc(cx + 1, cy + 1, cr * 0.7, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(0, 0, 0, ${alpha * 0.5})`;
                    ctx.fill();
                }

                // Variable of Terrain
                for (let i = 0; i < 15000; i++) {
                    const x = Math.random() * 2048;
                    const y = Math.random() * 1024;
                    const size = Math.random() * 3 + 0.5;
                    const bright = Math.random() > 0.5;
                    const alpha = Math.random() * 0.1;
                    ctx.fillStyle = bright ? `rgba(255, 255, 255, ${alpha})` : `rgba(0,0,0,${alpha})`;
                    ctx.fillRect(x, y, size, size);
                }

            } else {
                // Venus or other: surface with clouds/pattern
                for (let i = 0; i < 5000; i++) {
                    const x = Math.random() * 2048;
                    const y = Math.random() * 1024;
                    const w = Math.random() * 80 + 10;
                    const h = Math.random() * 20 + 5;
                    const alpha = Math.random() * 0.08;
                    ctx.fillStyle = `rgba(255, 200, 100, ${alpha})`;
                    ctx.beginPath();
                    ctx.ellipse(x, y, w, h, Math.random() * Math.PI, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
            const provider = new Cesium.SingleTileImageryProvider({
                url: canvas.toDataURL('image/jpeg', 0.9),
                rectangle: Cesium.Rectangle.fromDegrees(-180, -90, 180, 90)
            });
            return provider;
        }

        function createProceduralPlanetTexture(name, colorHex) {
            const canvas = document.createElement('canvas');
            canvas.width = 1024;
            canvas.height = 1024;
            const ctx = canvas.getContext('2d');

            const color = typeof colorHex === 'number' ? colorHex : parseInt(colorHex.substrings(1), 16);
            const r = (color >> 16) & 255;
            const g = (color >> 8) & 255;
            const b = color & 255;

            // Base gradient
            const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            grad.addColorStop(0, `rgb(${r}, ${g}, ${b})`);
            grad.addColorStop(1, `rgb(${Math.max(0, r - 40)}, ${Math.max(0, g - 40)}, ${Math.max(0, b - 40)})`);
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const nameLower = name.toLowerCase();
            const isGasGiant = ['jupiter', 'saturn', 'uranus', 'neptune'].includes(nameLower);

            if (isGasGiant) {
                // Bands for gas giants
                for (let y = 0; y < canvas.height; y += 4) {
                    const intensity = Math.sin(y * 0.02) * 30 + Math.sin(y * 0.05) * 15;
                    ctx.fillStyle = `rgba(${Math.min(255, r + intensity)}, ${Math.min(255, g + intensity * 0.7)}, ${Math.min(255, b + intensity * 0.5)}, 0.8)`;
                    ctx.fillRect(0, y, canvas.width, 4);
                }

                // Storms for Jupiter
                if (nameLower === 'jupiter') {
                    ctx.beginPath();
                    ctx.ellipse(700, 500, 100, 50, 0, 0, Math.PI * 2);
                    ctx.fillStyle = 'rgba(180, 70, 40, 0.5)';
                    ctx.fill();
                }
            } else {
                // Craters for rocky planets
                for (let i = 0; i < 400; i++) {
                    const cx = Math.random() * canvas.width;
                    const cy = Math.random() * canvas.height;
                    const rad = Math.random() * 20 + 3;

                    ctx.beginPath();
                    ctx.arc(cx, cy, rad, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(0, 0, 0, ${Math.random() * 0.3})`;
                    ctx.fill();

                    ctx.beginPath();
                    ctx.arc(cx - rad * 0.3, cy - rad * 0.3, rad * 0.4, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.2})`;
                    ctx.fill();
                }
            }

            return canvas;
        }

        // Variables Three.js for the Moon
        let threeRenderer = null;
        let threeScene = null;
        let threeCamera = null;
        let threeControls = null;
        let threeAnimationId = null;
        let isThreeJSActive = false;

        // Switch Planets

        async function switchPlanet(planetId) {
            if (planetId === currentPlanet) return;
            if (window._switchingPlanet) return;
            window._switchingPlanet = true;

            const planet = PLANETS[planetId];
            if (!planet) {
                window._switchingPlanet = false;
                return;
            }

            // Show transition
            showPlanetTransition(planet);
            await sleep(2000);

            const previousPlanet = currentPlanet;
            currentPlanet = planetId;

            try {
                // Stop auto-rotate
                stopAutoRotate();

                // Remove clouds if active
                if (cloudsEnabled) {
                    removeCloudsLayer();
                    cloudsEnabled = false;
                    const btnClouds = document.getElementById('btnClouds');
                    if (btnClouds) btnClouds.classList.remove('active');
                }

                // Remove Aurora if active
                if (auroraEnabled) {
                    removeAurora();
                    auroraEnabled = false;
                    const btnAurora = document.getElementById('btnAurora');
                    if (btnAurora) btnAurora.classList.remove('active');
                }

                // Remove weather cursor
                if (weatherCursorMode) {
                    disableWeatherClickMode();
                    weatherCursorMode = false;
                    const btnWeather = document.getElementById('btnWeatherCursor');
                    if (btnWeather) btnWeather.classList.remove('active');
                }

                destroyThreeJS();
                if (viewer && !viewer.isDestroyed()) {
                    viewer.destroy();
                    viewer = null;
                }

                // Create new viewer
                if (planetId === 'earth') {
                    document.getElementById('threejsContainer').style.display = 'none';
                    document.getElementById('cesiumContainer').style.display = 'block';
                    await createEarthViewer();

                } else if (planetId === 'moon' || planet.isOuterWilds || planet.isHalo) {
                    document.getElementById('cesiumContainer').style.display = 'none';
                    document.getElementById('threejsContainer').style.display = 'block';

                    if (planetId === 'moon') {
                        await createMoonThreeJS();
                    } else if (planet.isHalo) {
                        await createHaloThreeJS(planetId, planet);
                    } else {
                        await createOuterWildsThreeJS(planetId, planet);
                    }

                } else {
                    document.getElementById('threejsContainer').style.display = 'none';
                    document.getElementById('cesiumContainer').style.display = 'block';
                    await createPlanetViewer(planetId, planet);
                }

                // Update UI
                updatePlanetUI(planetId, planet);

            } catch (error) {
                console.error('Error switching to planet:', planetId, error);

                currentPlanet = 'earth';
                try {
                    destroyThreeJS();
                    if (viewer && !viewer.isDestroyed()) {
                        viewer.destroy();
                        viewer = null;
                    }
                    document.getElementById('threejsContainer').style.display = 'none';
                    document.getElementById('cesiumContainer').style.display = 'block';
                    await createEarthViewer();
                    updatePlanetUI('earth', PLANETS.earth);
                } catch (e) {
                    console.error('Fallback failed:', e);
                }
            }

            // Hide transition
            hidePlanetTransition();
            window._switchingPlanet = false;
        }

        function cleanupCurrentView(planetId) {
            if (planetId === 'moon') {
                destroyThreeJS();
            } else {
                if (viewer && !viewer.isDestroyed()) {
                    viewer.destroy();
                    viewer = null;
                }
            }
        }

        function showCesium() {
            document.getElementById('cesiumContainer').style.display = 'block';
        }

        function hideCesium() {
            if (viewer && !viewer.isDestroyed()) {
                viewer.destroy();
                viewer = null;
            }
            document.getElementById('cesiumContainer').style.display = 'none';
        }

        function hideThreeJS() {
            document.getElementById('threejsContainer').style.display = 'none';
            destroyThreeJS();
        }

        // Three.js - Moon
        
        async function createMoonThreeJS() {
            const container = document.getElementById('threejsContainer');
            container.style.display = 'block';
            container.innerHTML = '';

            threeRenderer = new THREE.WebGLRenderer({ antialias: true });
            threeRenderer.setSize(window.innerWidth, window.innerHeight);
            threeRenderer.setPixelRatio(window.devicePixelRatio);
            threeRenderer.setClearColor(0x000000);
            container.appendChild(threeRenderer.domElement);

            // Scene
            threeScene = new THREE.Scene();

            // Camera
            threeCamera = new THREE.PerspectiveCamera(
                45,
                window.innerWidth / window.innerHeight,
                0.1,
                20000
            );
            threeCamera.position.set(0, 0, 3);

            // Orbit Controls
            threeControls = new THREE.OrbitControls(threeCamera, threeRenderer.domElement);
            threeControls.enableDamping = true;
            threeControls.dampingFactor = 0.05;
            threeControls.minDistance = 1.2;
            threeControls.maxDistance = 10;
            threeControls.rotateSpeed = 0.5;

            // Skybox
            createStarField(50);
            
            // Light
            const sunLight = new THREE.DirectionalLight(0xfffaf0, 2.0);
            sunLight.position.set(50, 30, 50);
            threeScene.add(sunLight);

            const ambientLight = new THREE.AmbientLight(0x222233, 0.3);
            threeScene.add(ambientLight);

            addSunToScene(threeScene, sunLight.position);

            window._moonGroup = new THREE.Group();
            threeScene.add(window._moonGroup);

            const geometry = new THREE.SphereGeometry(1, 64, 64);

            // Load texture
            let material;
            try {
                const texture = await loadThreeTexture('textures/planets/moon.jpg')
                material = new THREE.MeshPhongMaterial({
                    map: texture,
                    bumpMap: texture,
                    bumpScale: 0.02,
                });
                console.log('Moon texture loaded (Three.js)');
            } catch (e) {
                console.warn('Moon texture failed');
                material = new THREE.MeshPhongMaterial({ color: 0xaaaaaa });
            }

            const moonMesh = new THREE.Mesh(geometry, material);
            window._moonGroup.add(moonMesh);

            addMoonPOIsThreeJS();

            window._moonAutoRotate = false;

            isThreeJSActive = true;

            // Loop of rendering
            function animate() {
                if (!isThreeJSActive) return;
                threeAnimationId = requestAnimationFrame(animate);

                if (window._moonAutoRotate) {
                    window._moonGroup.rotation.y += 0.002;
                }

                updateSunAnimation(Date.now() * 0.001);

                threeControls.update();
                threeRenderer.render(threeScene, threeCamera);
            }
            animate();

            window._threeResizeHandler = function() {
                if (!isThreeJSActive) return;
                threeCamera.aspect = window.innerWidth / window.innerHeight;
                threeCamera.updateProjectionMatrix();
                threeRenderer.setSize(window.innerWidth, window.innerHeight);
            };
            window.addEventListener('resize', window._threeResizeHandler);

            setupMoonMouseTracking();
        }

        async function createOuterWildsThreeJS(planetId, planet) {
            const container = document.getElementById('threejsContainer');
            container.style.display = 'block';
            container.innerHTML = '';

            threeRenderer = new THREE.WebGLRenderer({ antialias: true });
            threeRenderer.setSize(window.innerWidth, window.innerHeight);
            threeRenderer.setPixelRatio(window.devicePixelRatio);
            threeRenderer.setClearColor(0x000000);
            threeRenderer.shadowMap.enabled = true;
            threeRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
            container.appendChild(threeRenderer.domElement);

            threeScene = new THREE.Scene();

            // Camera
            threeCamera = new THREE.PerspectiveCamera(
                50,
                window.innerWidth / window.innerHeight,
                0.1,
                5000
            );
            threeCamera.position.set(0, 200, 800);

            threeControls = new THREE.OrbitControls(threeCamera, threeRenderer.domElement);
            threeControls.enableDamping = true;
            threeControls.dampingFactor = 0.05;
            threeControls.minDistance = 100;
            threeControls.maxDistance = 3000;
            threeControls.rotateSpeed = 0.5;

            createStarField(2000);

            // sunLight
            const sunLight = new THREE.DirectionalLight(0xfffaf0, 2.0);
            sunLight.position.set(3000, 1500, 2000);
            sunLight.castShadow = true;
            threeScene.add(sunLight);

            // ambientLight
            const ambientLight = new THREE.AmbientLight(0x222233, 0.3);
            threeScene.add(ambientLight);

            addSunToScene(threeScene, sunLight.position);

            // OW Planet group
            window._owPlanetGroup = new THREE.Group();
            threeScene.add(window._owPlanetGroup);

            console.log('Building OW planet:', planetId);

            // Build Planet
            switch (planetId) {
                case 'timber_hearth':
                    buildTimberHearth(window._owPlanetGroup);
                    break;
                case 'giants_deep':
                    buildGiantsDeep(window._owPlanetGroup);
                    break;
                case 'brittle_hollow':
                    buildBrittleHollow(window._owPlanetGroup);
                    break;
                case 'ash_twin':
                    buildAshTwin(window._owPlanetGroup);
                    break;
                case 'dark_bramble':
                    buildDarkBramble(window._owPlanetGroup);
                    break;
            }

            // AutoRotate 
            window._owAutoRotate = true;
            isThreeJSActive = true;

            // Render loop with dynamic effects
            const clock = new THREE.Clock();
            function animate() {
                if (!isThreeJSActive) return;
                threeAnimationId = requestAnimationFrame(animate);

                const elapsed = clock.getElapsedTime();

                if (window._owAutoRotate && window._owPlanetGroup) {
                    window._owPlanetGroup.rotation.y += 0.001;
                }

                // Specific effects for planet
                if (planetId === 'giants_deep') {
                    updateGiantsDeep(elapsed);
                } else if (planetId === 'brittle_hollow') {
                    updateBrittleHollow(elapsed);
                } else if (planetId === 'dark_bramble') {
                    updateDarkBramble(elapsed);
                } else if (planetId === 'ash_twin') {
                    updateAshTwin(elapsed);
                }

                updateSunAnimation(elapsed);

                threeControls.update();
                threeRenderer.render(threeScene, threeCamera);
            }
            animate();

            // Resize
            window._threeResizeHandler = function () {
                if (!isThreeJSActive) return;
                threeCamera.aspect = window.innerWidth / window.innerHeight;
                threeCamera.updateProjectionMatrix();
                threeRenderer.setSize(window.innerWidth, window.innerHeight);
            };
            window.addEventListener('resize', window._threeResizeHandler);
        }

        async function createHaloThreeJS(planetId, planet) {
            const container = document.getElementById('threejsContainer');
            container.style.display = 'block';
            container.innerHTML = '';

            threeRenderer = new THREE.WebGLRenderer({ antialias: true });
            threeRenderer.setSize(window.innerWidth, window.innerHeight);
            threeRenderer.setPixelRatio(window.devicePixelRatio);
            threeRenderer.setClearColor(0x000000);
            threeRenderer.shadowMap.enabled = true;
            threeRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
            container.appendChild(threeRenderer.domElement);

            threeScene = new THREE.Scene();

            // Camera
            threeCamera = new THREE.PerspectiveCamera(
                50,
                window.innerWidth / window.innerHeight,
                0.1,
                50000
            );
            threeCamera.position.set(0, 200, 800);

            // Controls
            threeControls = new THREE.OrbitControls(threeCamera, threeRenderer.domElement);
            threeControls.enableDamping = true;
            threeControls.dampingFactor = 0.05;
            threeControls.minDistance = 50;
            threeControls.maxDistance = 5000;
            threeControls.rotateSpeed = 0.5;

            // Stars
            createStarField(3000);

            // Lights
            const sunLight = new THREE.DirectionalLight(0xfffaf0, 2.0);
            sunLight.position.set(3000, 1500, 2000);
            sunLight.castShadow = true;
            threeScene.add(sunLight);

            addSunToScene(threeScene, sunLight.position);

            // Ambiental light blue for Halo
            const ambientColor = planet.isHalo ? 0x1a2233 : 0x222233;
            const ambientLight = new THREE.AmbientLight(ambientColor, 0.4);
            threeScene.add(ambientLight);

            // Rim light
            const rimLight = new THREE.DirectionalLight(0x4488ff, 0.5);
            rimLight.position.set(-2000, 500, -1000);
            threeScene.add(rimLight);

            // Planet group
            window._haloPlanetGroup = new THREE.Group();
            threeScene.add(window._haloPlanetGroup);

            console.log('Building Halo planet:', planetId);

            // Build
            switch (planetId) {
                case 'halo_ring':
                    buildHaloRing(window._haloPlanetGroup);
                    break;
                case 'reach':
                    buildReach(window._haloPlanetGroup);
                    break;
            }

            // Auto Rotate
            window._haloAutoRotate = true;
            isThreeJSActive = true;

            // Render
            const clock = new THREE.Clock();
            function animate() {
                if (!isThreeJSActive) return;
                threeAnimationId = requestAnimationFrame(animate);

                const elapsed = clock.getElapsedTime();

                if (window._haloAutoRotate && window._haloPlanetGroup) {
                    window._haloPlanetGroup.rotation.y += 0.001;
                }

                if (planetId === 'halo_ring') {
                    updateHaloRing(elapsed);
                } else if (planetId === 'reach') {
                    updateReach(elapsed);
                }

                updateSunAnimation(elapsed);

                threeControls.update();
                threeRenderer.render(threeScene, threeCamera);
            }
            animate();

            // Resize Handler
            window._threeResizeHandler = function () {
                if (!isThreeJSActive) return;
                threeCamera.aspect = window.innerWidth / window.innerHeight;
                threeCamera.updateProjectionMatrix();
                threeRenderer.setSize(window.innerWidth, window.innerHeight);
            };
            window.addEventListener('resize', window._threeResizeHandler);
        }

        // BUILDS OUTER WILDS

        function buildTimberHearth(group) {
            const loader = new THREE.GLTFLoader();

            loader.load(
                'OW-planets/TimberHearth/TimberHearth_noMoon.glb',
                function (gltf) {
                    const model = gltf.scene;

                    const box = new THREE.Box3().setFromObject(model);
                    const center = box.getCenter(new THREE.Vector3());
                    model.position.sub(center);

                    const size = box.getSize(new THREE.Vector3());
                    const maxDim = Math.max(size.x, size.y, size.z);
                    console.log('Model original size:', maxDim);

                    model.traverse(function (child) {
                        if (child.isMesh) {
                            child.castShadow = true;
                            child.receiveShadow = true;

                            if (child.material) {
                                const materials = Array.isArray(child.material)
                                    ? child.material
                                    : [child.material];

                                materials.forEach(mat => {
                                    mat.transparent = false;
                                    mat.opacity = 1.0;
                                    mat.side = THREE.DoubleSide
                                    mat.depthWrite = true;
                                    mat.needsUpdate = true;
                                });
                            }
                        }
                    });

                    group.add(model);
                    console.log('Timber Hearth loaded.');

                    if (threeCamera && threeControls) {
                        const cameraDistance = maxDim * 1.5;
                        threeCamera.position.set(0, maxDim * 0.3 , cameraDistance);
                        threeCamera.lookAt(0, 0, 0);
                        threeControls.minDistance = maxDim * 0.6;
                        threeControls.maxDistance = maxDim * 5;
                        threeControls.target.set(0, 0, 0);
                        threeControls.update();
                    }
                },
                function (progress) {
                    if (progress.total > 0) {
                        console.log('Loading Timber Hearth: ' + Math.round((progress.loaded / progress.total) * 100) + '%');
                    }  
                },
                function (error) {
                    console.error('Failed to load Timber Hearth model:', error);
                    // Fallback
                    const geo = new THREE.SphereGeometry(1, 32, 32);
                    const mat = new THREE.MeshPhongMaterial({ color: 0x4a7c3f, flatShading: true });
                    group.add(new THREE.Mesh(geo, mat));
                }
            );

            addAtmosphereGlow(group, 1, 0x88ccff, 0.15);
        }

        function buildBrittleHollow(group) {
            console.log('buildBrittleHollow called');

            const loader = new THREE.GLTFLoader();
            const filePath = 'OW-planets/BrittleHollow/BrittleHollow_noMoon.glb';

            console.log('Attempting to load:', filePath);

            try {
                loader.load(
                    filePath,
                    function (gltf) {
                        console.log('GLTF loaded successfully');
                        console.log('Scene children:', gltf.scene.children.length);

                        const model = gltf.scene;

                        const box = new THREE.Box3().setFromObject(model);
                        const center = box.getCenter(new THREE.Vector3());
                        model.position.sub(center);

                        const size = box.getSize(new THREE.Vector3());
                        const maxDim = Math.max(size.x, size.y, size.z);
                        console.log('Brittle Hollow size:', maxDim);

                        model.traverse(function (child) {
                            if (child.isMesh) {
                                child.castShadow = true;
                                child.receiveShadow = true;

                                if (child.material) {
                                    const materials = Array.isArray(child.material)
                                        ? child.material
                                        : [child.material];

                                    materials.forEach(mat => {
                                        mat.transparent = false;
                                        mat.opacity = 1.0;
                                        mat.side = THREE.DoubleSide;
                                        mat.depthWrite = true;
                                        mat.needsUpdate = true;
                                    });
                                }
                            }
                        });

                        group.add(model);
                        console.log('Brittle Hollow added to scene');

                        // Camera
                        if (threeCamera && threeControls) {
                            const cameraDistance = maxDim * 1.5;
                            threeCamera.position.set(0, maxDim * 0.3, cameraDistance);
                            threeCamera.lookAt(0, 0, 0);
                            threeControls.minDistance = maxDim * 0.6;
                            threeControls.maxDistance = maxDim * 5;
                            threeControls.target.set(0, 0, 0);
                            threeControls.update();
                            console.log('Camera set at distance:', cameraDistance);
                        }
                    },
                    function (progress) {
                        if (progress.total > 0) {
                            console.log('Loading Brittle Hollow: ' + Math.round((progress.loaded / progress.total) * 100) + '%');
                        }
                    },
                    function (error) {
                        console.error('Failed to load Brittle Hollow:', error);
                        const geo = new THREE.SphereGeometry(1, 32, 32);
                        const mat = new THREE.MeshPhongMaterial({ color: 0x6b4c8a, flatShading: true });
                        group.add(new THREE.Mesh(geo, mat));
                    }
                );
            } catch (e) {
                console.error('Exception in buildBrittleHollow:', e);
            }
            
            console.log('loader.load() called');
        }

        function buildAshTwin(group) {
            console.log('buildAshTwin called');
            const loader = new THREE.GLTFLoader();
            const filePath = 'OW-planets/Ash-EmberTwins/TwinPlanets_Ash-Ember.glb';

            loader.load(
                filePath,
                function (gltf) {
                    const model = gltf.scene;

                    const box = new THREE.Box3().setFromObject(model);
                    const center = box.getCenter(new THREE.Vector3());
                    model.position.sub(center);

                    const size = box.getSize(new THREE.Vector3());
                    const maxDim = Math.max(size.x, size.y, size.z);
                    console.log('Hourglass Twins size:', maxDim);

                    model.traverse(function (child) {
                        if (child.isMesh) {
                            child.castShadow = true;
                            child.receiveShadow = true;

                            if (child.material) {
                                const materials = Array.isArray(child.material) ? child.material : [child.material];
                                materials.forEach(mat => {
                                    mat.transparent = false;
                                    mat.opacity = 1.0;
                                    mat.side = THREE.DoubleSide;
                                    mat.depthWrite = true;
                                    mat.needsUpdate = true;
                                });
                            }
                        }
                    });

                    group.add(model);
                    console.log('Ash & Ember Twins loaded');

                    // Camera
                    if (threeCamera && threeControls) {
                        const cameraDistance = maxDim * 1.8;
                        threeCamera.position.set(0, maxDim * 0.5, cameraDistance);
                        threeCamera.lookAt(0, 0, 0);
                        threeControls.minDistance = maxDim * 0.5;
                        threeControls.maxDistance = maxDim * 10;
                        threeControls.update();
                    }
                },
                function (progress) {
                    if (progress.total > 0) {
                        console.log('Loading Hourglass Twins: ' + Math.round((progress.loaded / progress.total) * 100) + '%');
                    }
                },
                function (error) {
                    console.error('Failed to load Hourglass Twins:', error);
                    // Fallback sphere
                    const geo = new THREE.SphereGeometry(1, 32, 32);
                    const mat = new THREE.MeshPhongMaterial({ color: 0xc4956a, flatShading: true });
                    group.add(new THREE.Mesh(geo, mat));
                }
            );
        }

        function buildDarkBramble(group) {
            console.log('buildDarkBramble called');
            const loader = new THREE.GLTFLoader();
            const filePath = 'OW-planets/DarkBramble/DarkBramble.glb';

            // Fog effect
            if (threeScene) {
                threeScene.fog = new THREE.FogExp2(0x101510, 0.0008);
            }

            loader.load(
                filePath,
                function (gltf) {
                    const model = gltf.scene;

                    const box = new THREE.Box3().setFromObject(model);
                    const center = box.getCenter(new THREE.Vector3());
                    model.position.sub(center);

                    const size = box.getSize(new THREE.Vector3());
                    const maxDim = Math.max(size.x, size.y, size.z);
                    console.log('Dark Bramble size:', maxDim);

                    model.traverse(function (child) {
                        if (child.isMesh) {
                            child.castShadow = true;
                            child.receiveShadow = true;

                            if (child.material) {
                                const materials = Array.isArray(child.material) ? child.material : [child.material];
                                materials.forEach(mat => {
                                    mat.transparent = false;
                                    mat.opacity = 1.0;
                                    mat.side = THREE.DoubleSide;
                                    mat.depthWrite = true;
                                    
                                    if (child.name.toLowerCase().includes('thorn') || child.name.toLowerCase().includes('branch')) {
                                        mat.emissive = new THREE.Color(0x111111);
                                    }
                                });
                            }
                        }
                    });
                    group.add(model);
                    console.log('Dark Bramble loaded');

                    // Camera
                    if (threeCamera && threeControls) {
                        const cameraDistance = maxDim * 1.6;
                        threeCamera.position.set(maxDim * 0.2, maxDim * 0.2, cameraDistance);
                        threeCamera.lookAt(0, 0, 0);
                        threeControls.minDistance = maxDim * 0.4;
                        threeControls.maxDistance = maxDim * 8;
                        threeControls.update();
                    }
                },
                function (progress) {
                    if (progress.total > 0) {
                        console.log('Loading Dark Bramble: ' + Math.round((progress.loaded / progress.total) * 100) + '%');
                    }
                },
                function (error) {
                    console.error('Failed to load Dark Bramble:', error);
                    const geo = new THREE.SphereGeometry(1, 32, 32);
                    const mat = new THREE.MeshPhongMaterial({ color: 0x2a3a2a, flatShading: true });
                    group.add(new THREE.Mesh(geo, mat));
                }
            );
        }

        function buildGiantsDeep(group) {
            console.log('buildGiantsDeep called');
            const loader = new THREE.GLTFLoader();
            const filePath = 'OW-planets/GiantsDeep/GiantsDeep_green.glb';

            loader.load(
                filePath,
                function (gltf) {
                    const model = gltf.scene;

                    const box = new THREE.Box3().setFromObject(model);
                    const center = box.getCenter(new THREE.Vector3());
                    model.position.sub(center);

                    const size = box.getSize(new THREE.Vector3());
                    const maxDim = Math.max(size.x, size.y, size.z);
                    console.log("Giant's Deep size:", maxDim);

                    // Scale
                    const targetSize = 500;
                    const scale = targetSize / maxDim;
                    model.scale.setScalar(scale);

                    model.traverse(function (child) {
                        if (child.isMesh) {
                            child.castShadow = true;
                            child.receiveShadow = true;
                            child.frustumCulled = false;

                            if (child.material) {
                                const materials = Array.isArray(child.material)
                                    ? child.material
                                    : [child.material];

                                materials.forEach(mat => {
                                    mat.side = THREE.DoubleSide;
                                    mat.depthWrite = true;
                                    mat.needsUpdate = true;
                                });
                            }
                        }
                    });

                    group.add(model);
                    console.log("Giant's Deep loaded");

                    // Camera
                    if (threeCamera && threeControls) {
                        const scaledSize = maxDim * scale;
                        const cameraDistance = scaledSize * 2.2;

                        threeCamera.position.set(0, scaledSize * 0.35, cameraDistance);
                        threeCamera.lookAt(0, 0, 0);

                        threeControls.target.set(0, 0, 0);
                        threeControls.minDistance = scaledSize * 0.6;
                        threeControls.maxDistance = scaledSize * 6;
                        threeControls.update();
                    }
                },
                function (progress) {
                    if (progress.total > 0) {
                        console.log("Loading Giant's Deep: " + Math.round((progress.loaded / progress.total) * 100) + '%');
                    }
                },
                function (error) {
                    console.error("Failed to load Giant's Deep:", error);
                    const geo = new THREE.SphereGeometry(1, 32, 32);
                    const mat = new THREE.MeshPhongMaterial({ color: 0x1a5c3a, flatShading: true });
                    group.add(new THREE.Mesh(geo, mat));
                }
            );
        }

        // BUILDS HALO

        function buildHaloRing(group) {
            console.log('buildHaloRing called');
            const loader = new THREE.GLTFLoader();
            const filePath = 'Halo-planets/HaloRing/Halo.glb';

            loader.load(
                filePath,
                function (gltf) {
                    const model = gltf.scene;

                    const box = new THREE.Box3().setFromObject(model);
                    const center = box.getCenter(new THREE.Vector3());
                    model.position.sub(center);

                    const size = box.getSize(new THREE.Vector3());
                    const maxDim = Math.max(size.x, size.y, size.z);
                    console.log('Halo Ring size:', maxDim);

                    model.traverse(function (child) {
                        if (child.isMesh) {
                            child.castShadow = true;
                            child.receiveShadow = true;
                            child.frustumCulled = false;

                            if (child.material) {
                                const materials = Array.isArray(child.material)
                                    ? child.material
                                    : [child.material];
                                    
                                materials.forEach(mat => {
                                    mat.side = THREE.DoubleSide;
                                    mat.depthWrite = true;
                                    mat.needsUpdate = true;
                                });
                            }
                        }
                    });

                    group.add(model);
                    console.log('Halo Ring loaded');

                    // Camera
                    if (threeCamera && threeControls) {
                        const cameraDistance = maxDim * 1.8;
                        threeCamera.position.set(
                            maxDim * 0.5,
                            maxDim * 0.8,
                            cameraDistance
                        );
                        threeCamera.lookAt(0, 0, 0);
                        threeControls.target.set(0, 0, 0);
                        threeControls.minDistance = maxDim * 0.3;
                        threeControls.maxDistance = maxDim * 6;
                        threeControls.update();
                    }
                },
                function (progress) {
                    if (progress.total > 0) {
                        console.log('Loading Halo Ring: ' + Math.round((progress.loaded / progress.total) * 100) + '%');
                    }
                },
                function (error) {
                    console.error('Failed to load Halo Ring:', error);
                    // Fallback
                    const torusGeo = new THREE.TorusGeometry(2, 0.15, 32, 200);
                    const torusMat = new THREE.MeshPhongMaterial({
                        color: 0x4a9e6b,
                        flatShading: false,
                        shininess: 30
                    });
                    const torus = new THREE.Mesh(torusGeo, torusMat);
                    group.add(torus);

                    if (threeCamera && threeControls) {
                        threeCamera.position.set(2, 3, 5);
                        threeCamera.lookAt(0, 0, 0);
                        threeControls.minDistance = 2;
                        threeControls.maxDistance = 20;
                        threeControls.update();
                    }
                }
            );
        }

        function buildReach(group) {
            console.log('buildReach called');
            const loader = new THREE.GLTFLoader();
            const filePath = 'Halo-planets/Reach/Reach.glb';

            loader.load(
                filePath,
                function (gltf) {
                    const model = gltf.scene;

                    const box = new THREE.Box3().setFromObject(model);
                    const center = box.getCenter(new THREE.Vector3());
                    model.position.sub(center);

                    const size = box.getSize(new THREE.Vector3());
                    const maxDim = Math.max(size.x, size.y, size.z);
                    console.log('Reach size:', maxDim);

                    model.traverse(function (child) {
                        if (child.isMesh) {
                            child.castShadow = true;
                            child.receiveShadow = true;
                            child.frustumCulled = false;

                            if (child.material) {
                                const materials = Array.isArray(child.material)
                                    ? child.material
                                    : [child.material];

                                materials.forEach(mat => {
                                    mat.side = THREE.DoubleSide;
                                    mat.depthWrite = true;
                                    mat.needsUpdate = true;
                                });
                            }
                        }
                    });

                    group.add(model);
                    console.log('Reach loaded');

                    // Camera
                    if (threeCamera && threeControls) {
                        const cameraDistance = maxDim * 1.5;
                        threeCamera.position.set(0, maxDim * 0.3, cameraDistance);
                        threeCamera.lookAt(0, 0, 0);
                        threeControls.target.set(0, 0, 0);
                        threeControls.minDistance = maxDim * 0.6;
                        threeControls.maxDistance = maxDim * 5;
                        threeControls.update();
                    }
                },
                function (progress) {
                    if (progress.total > 0) {
                        console.log('Loading Reach: ' + Math.round((progress.loaded / progress.total) * 100) + '%');
                    }
                },
                function (error) {
                    console.error('Failed to load Reach:', error);
                    // Fallback
                    const geo = new THREE.SphereGeometry(1, 32, 32);
                    const mat = new THREE.MeshPhongMaterial({
                        color: 0x3a6b9e,
                        flatShading: true
                    });
                    group.add(new THREE.Mesh(geo, mat));
                }
            );
        }

        function addAtmosphereGlow(group, radius, color, opacity) {
            const atmosGeo = new THREE.SphereGeometry(radius * 1.08, 32, 32);
            const atmosMat = new THREE.MeshPhongMaterial({
                color : color,
                transparent: true,
                opacity: opacity,
                side: THREE.BackSide
            });
            const atmosphere = new THREE.Mesh(atmosGeo, atmosMat);
            group.add(atmosphere);
        }

        // Simplex Noise 3D
        function simplex3D(x, y, z) {
            // Implementation of noise 3D
            const p = [151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,
                140,36,103,30,69,142,8,99,37,240,21,10,23,190,6,148,
                247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,
                57,177,33,88,237,149,56,87,174,20,125,136,171,168,68,175,
                74,165,71,134,139,48,27,166,77,146,158,231,83,111,229,122,
                60,211,133,230,220,105,92,41,55,46,245,40,244,102,143,54,
                65,25,63,161,1,216,80,73,209,76,132,187,208,89,18,169,
                200,196,135,130,116,188,159,86,164,100,109,198,173,186,3,64,
                52,217,226,250,124,123,5,202,38,147,118,126,255,82,85,212,
                207,206,59,227,47,16,58,17,182,189,28,42,223,183,170,213,
                119,248,152,2,44,154,163,70,221,153,101,155,167,43,172,9,
                129,22,39,253,19,98,108,110,79,113,224,232,178,185,112,104,
                218,246,97,228,251,34,242,193,238,210,144,12,191,179,162,241,
                81,51,145,235,249,14,239,107,49,192,214,31,181,199,106,157,
                184,84,204,176,115,121,50,45,127,4,150,254,138,236,205,93,
                222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180];

            // Extend for avoid overflow
            const perm = new Array(512);
            for (let i = 0; i < 512; i++) perm[i] = p[i & 255];

            // Function of hash and interpolation
            const fade = t => t * t * t * (t * (t * 6 - 15) + 10);
            const lerp = (t, a, b) => a + t * (b - a);
            const grad = (hash, x, y, z) => {
                const h = hash & 15;
                const u = h < 8 ? x : y;
                const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
                return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
            };

            const X = Math.floor(x) & 255;
            const Y = Math.floor(y) & 255;
            const Z = Math.floor(z) & 255;

            x -= Math.floor(x);
            y -= Math.floor(y);
            z -= Math.floor(z);

            const u = fade(x);
            const v = fade(y);
            const w = fade(z);

            const A = perm[X] + Y;
            const AA = perm[A] + Z;
            const AB = perm[A + 1] + Z;
            const B = perm[X + 1] + Y;
            const BA = perm[B] + Z;
            const BB = perm[B + 1] + Z;

            return lerp(w,
                lerp(v,
                    lerp(u, grad(perm[AA], x, y, z), grad(perm[BA], x - 1, y, z)),
                    lerp(u, grad(perm[AB], x, y, - 1, z), grad(perm[BB], x - 1, y - 1, z))
                ),
                lerp(v,
                    lerp(u, grad(perm[AA + 1], x, y, z - 1), grad(perm[BA + 1], x - 1, y, z - 1)),
                    lerp(u, grad(perm[AB + 1], x, y - 1, z - 1), grad(perm[BB + 1], x - 1, y - 1, z - 1))
                )
            );
        }

        // PLACEHOLDER for the updates of planets
        function updateGiantsDeep(elapsed) {}
        function updateBrittleHollow(elapsed) {}
        function updateDarkBramble(elapsed) {}
        function updateAshTwin(elapsed) {}
        function updateHaloRing(elapsed) {}
        function updateReach(elapsed) {}

        function loadThreeTexture(url) {
            return new Promise((resolve, reject) => {
                const loader = new THREE.TextureLoader();
                loader.load(
                    url,
                    (texture) => resolve(texture),
                    undefined,
                    (error) => reject(error)
                );
            });
        }

        function createStarField(minDistance) {
            const baseDistance = minDistance || 2000;
            const starsGeometry = new THREE.BufferGeometry();
            const starPositions = [];
            const starColors = [];

            for (let i = 0; i < 8000; i++) {
                const distance = baseDistance + Math.random() * baseDistance * 1.5;
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.acos(2 * Math.random() - 1);

                const x = distance * Math.sin(phi) * Math.cos(theta);
                const y = distance * Math.sin(phi) * Math.sin(theta);
                const z = distance * Math.cos(phi);
                starPositions.push(x, y, z);
            
                // Variants Colors
                const colorType = Math.random();
                if (colorType < 0.6) {
                    // Whites
                    starColors.push(1, 1, 1);
                } else if (colorType < 0.8) {
                    // Blues
                    starColors.push(0.7, 0.8, 1);
                } else if (colorType < 0.95) {
                    // Yellow
                    starColors.push(1, 0.95, 0.7);
                } else {
                    // Red
                    starColors.push(1, 0.7, 0.6);
                }
            }

            starsGeometry.setAttribute('position',
                new THREE.Float32BufferAttribute(starPositions, 3)
            );
            starsGeometry.setAttribute('color',
                new THREE.Float32BufferAttribute(starColors, 3)
            );

            const starSize = baseDistance * 0.001;

            const starsMaterial = new THREE.PointsMaterial({
                size: Math.max(0.15, starSize),
                sizeAttenuation: true,
                vertexColors: true,
                transparent: true,
                opacity: 0.9
            });

            const stars = new THREE.Points(starsGeometry, starsMaterial);
            threeScene.add(stars);
        }

        function addSunToScene(scene, lightPosition) {
            const sunGroup = new THREE.Group();
            sunGroup.name = 'sunGroup';

            const sunDirection = new THREE.Vector3(
                lightPosition.x,
                lightPosition.y,
                lightPosition.z
            ).normalize();

            const sunDistance = 4000;
            const sunPos = sunDirection.multiplyScalar(sunDistance);

            sunGroup.position.copy(sunPos);

            // Core
            const coreGeo = new THREE.SphereGeometry(15, 32, 32);
            const coreMat = new THREE.MeshBasicMaterial({
                color: 0xffffff,
            });
            const core = new THREE.Mesh(coreGeo, coreMat);
            sunGroup.add(core);

            // Hot Core
            const hotCoreGeo = new THREE.SphereGeometry(22, 32, 32);
            const hotCoreMat = new THREE.MeshBasicMaterial({
                color: 0xfff8e0,
                transparent: true,
                opacity: 0.85,
            });
            const hotCore = new THREE.Mesh(hotCoreGeo, hotCoreMat);
            sunGroup.add(hotCore);

            // Glow 1
            const glow1Geo = new THREE.SphereGeometry(35, 32, 32);
            const glow1Mat = new THREE.MeshBasicMaterial({
                color: 0xffcc33,
                transparent: true,
                opacity: 0.45,
                side: THREE.BackSide,
                depthWrite: false,
            });
            const glow1 = new THREE.Mesh(glow1Geo, glow1Mat);
            sunGroup.add(glow1)

            // Glow 2
            const glow2Geo = new THREE.SphereGeometry(55, 32, 32);
            const glow2Mat = new THREE.MeshBasicMaterial({
                color: 0xff9922,
                transparent: true,
                opacity: 0.25,
                side: THREE.BackSide,
                depthWrite: false,
            });
            const glow2 = new THREE.Mesh(glow2Geo, glow2Mat);
            sunGroup.add(glow2);

            // Glow 3
            const glow3Geo = new THREE.SphereGeometry(85, 32, 32);
            const glow3Mat = new THREE.MeshBasicMaterial({
                color: 0xff6611,
                transparent: true,
                opacity: 0.12,
                side: THREE.BackSide,
                depthWrite: false,
            });
            const glow3 = new THREE.Mesh(glow3Geo, glow3Mat);
            sunGroup.add(glow3);

            // Glow 4
            const glow4Geo = new THREE.SphereGeometry(130, 32, 32);
            const glow4Mat = new THREE.MeshBasicMaterial({
                color: 0xff4400,
                transparent: true,
                opacity: 0.06,
                side: THREE.BackSide,
                depthWrite: false,
            });
            const glow4 = new THREE.Mesh(glow4Geo, glow4Mat);
            sunGroup.add(glow4);

            // Glow 5
            const glow5Geo = new THREE.SphereGeometry(200, 32, 32);
            const glow5Mat = new THREE.MeshBasicMaterial({
                color: 0xff3300,
                transparent: true,
                opacity: 0.025,
                side: THREE.BackSide,
                depthWrite: false,
            });
            const glow5 = new THREE.Mesh(glow5Geo, glow5Mat);
            sunGroup.add(glow5);

            // Glow Sprite
            const glowSprite = createSunGlowSprite();
            sunGroup.add(glowSprite);

            // Light Rays of the Sun
            addSunRays(sunGroup);

            const sunPointLight = new THREE.PointLight(0xffeecc, 0.8, sunDistance * 3);
            sunPointLight.position.set(0, 0, 0);
            sunGroup.add(sunPointLight);

            scene.add(sunGroup);

            window._sunGroup = sunGroup;
            window._sunCoreParts = {
                core: core,
                hotCore: hotCore,
                glow1: glow1,
                glow2: glow2,
                glow3: glow3,
                glowSprite: glowSprite
            };

            console.log('Sun added to scene');
            return sunGroup;
        }

        function createSunGlowSprite() {
            const canvas = document.createElement('canvas');
            canvas.width = 512;
            canvas.height = 512;
            const ctx = canvas.getContext('2d');

            // Transparent Bg
            ctx.clearRect(0, 0, 512, 512);

            const cx = 256;
            const cy = 256;

            // Esternal Glow
            const outerGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 256);
            outerGlow.addColorStop(0, 'rgba(255, 220, 150, 0.8)');
            outerGlow.addColorStop(0.05, 'rgba(255, 200, 100, 0.6)');
            outerGlow.addColorStop(0.1, 'rgba(255, 180, 60, 0.4)');
            outerGlow.addColorStop(0.2, 'rgba(255, 150, 30, 0.2)');
            outerGlow.addColorStop(0.4, 'rgba(255, 100, 10, 0.08)');
            outerGlow.addColorStop(0.7, 'rgba(255, 60, 0, 0.02)');
            outerGlow.addColorStop(1.0, 'rgba(255, 30, 0, 0.0)');

            ctx.fillStyle = outerGlow;
            ctx.fillRect(0, 0, 512, 512);

            // Central Core
            const coreGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 40);
            coreGlow.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
            coreGlow.addColorStop(0.3, 'rgba(255, 255, 230, 0.9)');
            coreGlow.addColorStop(0.6, 'rgba(255, 240, 180, 0.5)');
            coreGlow.addColorStop(1.0, 'rgba(255, 220, 120, 0.0)');

            ctx.fillStyle = coreGlow;
            ctx.fillRect(0, 0, 512, 512);

            const texture = new THREE.CanvasTexture(canvas);
            texture.needsUpdate = true;

            const spriteMat = new THREE.SpriteMaterial({
                map: texture,
                transparent: true,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
                depthTest: true,
            });

            const sprite = new THREE.Sprite(spriteMat);
            sprite.scale.set(500, 500, 1);

            return sprite;
        }

        function addSunRays(sunGroup) {
            const numRays = 6;
            const rayLength = 180;
            const rayWidth = 0.8;

            for (let i = 0; i < numRays; i++) {
                const angle = (i / numRays) * Math.PI;

                const rayCanvas = document.createElement('canvas');
                rayCanvas.width = 512;
                rayCanvas.height = 32;
                const ctx = rayCanvas.getContext('2d');

                ctx.clearRect(0, 0, 512, 32);

                const gradient = ctx.createLinearGradient(0, 16, 512, 16);
                gradient.addColorStop(0, 'rgba(255, 220, 150, 0.0)');
                gradient.addColorStop(0.15, 'rgba(255, 220, 150, 0.15)');
                gradient.addColorStop(0.5, 'rgba(255, 255, 230, 0.25)');
                gradient.addColorStop(0.85, 'rgba(255, 220, 150, 0.15)');
                gradient.addColorStop(1.0, 'rgba(255, 220, 150, 0.0)');

                ctx.fillStyle = gradient;

                const vGradient = ctx.createLinearGradient(0, 0, 0, 32);
                vGradient.addColorStop(0, 'rgba(255, 220, 150, 0.0)');
                vGradient.addColorStop(0.4, 'rgba(255, 220, 150, 0.2)');
                vGradient.addColorStop(0.5, 'rgba(255, 255, 230, 0.3)');
                vGradient.addColorStop(0.6, 'rgba(255, 220, 150, 0.2)');
                vGradient.addColorStop(1.0, 'rgba(255, 220, 150, 0.0)');

                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, 512, 32);

                ctx.globalCompositeOperation = 'multiply';
                ctx.fillStyle = vGradient;
                ctx.fillRect(0, 0, 512, 32);

                const rayTexture = new THREE.CanvasTexture(rayCanvas);

                const rayMat = new THREE.SpriteMaterial({
                    map: rayTexture,
                    transparent: true,
                    blending: THREE.AdditiveBlending,
                    depthWrite: false,
                    depthTest: true,
                    rotation: angle,
                });

                const ray = new THREE.Sprite(rayMat);
                ray.scale.set(rayLength * 2, rayWidth * 12, 1);
                ray.name = 'sunRay_' + i;

                sunGroup.add(ray);
            }
        }

        function updateSunAnimation(elapsed) {
            if (!window._sunGroup || !window._sunCoreParts) return;

            const parts = window._sunCoreParts;

            const pulse = 1.0 + Math.sin(elapsed * 0.8) * 0.03;
            const pulse2 = 1.0 + Math.sin(elapsed * 1.2 + 1.0) * 0.05;

            if (parts.core) {
                parts.core.scale.setScalar(pulse);
            }

            if (parts.hotCore) {
                parts.hotCore.scale.setScalar(pulse2);
                parts.hotCore.material.opacity = 0.8 + Math.sin(elapsed * 0.6) * 0.05;
            }

            if (parts.glow1) {
                const glowPulse = 1.0 + Math.sin(elapsed * 0.5) * 0.04;
                parts.glow1.scale.setScalar(glowPulse);
            }

            if (parts.glow2) {
                const glowPulse2 = 1.0 + Math.sin(elapsed * 0.3 + 0.5) * 0.06;
                parts.glow2.scale.setScalar(glowPulse2);
            }

            window._sunGroup.children.forEach(child => {
                if (child.name && child.name.startsWith('sunRay_')) {
                    child.material.rotation += 0.0003;
                    child.material.opacity = 0.2 + Math.sin(elapsed * 0.4 + parseFloat(child.name.split('_')[1])) * 0.08;
                }
            });

            if (parts.glowSprite) {
                parts.glowSprite.material.rotation += 0.0001;
            }
        }

        function removeSunFromScene(scene) {
            if (window._sunGroup && scene) {
                scene.remove(window._sunGroup);
                window._sunGroup = null;
                window._sunCoreParts = null;
            }
        }

        function addMoonPOIsThreeJS() {
            const pois = [
                { name: 'Sea ​​of ​​tranquility', lat: 8.5, lon: 31.4, desc: 'Apollo 11 - First Moon Landing'},
                { name: 'Crater Tycho', lat: -43.3, lon: -11.2, desc: 'Crater'},
                { name: 'Crater Copernicus', lat: 9.6, lon: -20.1, desc: 'Crater'},
                { name: 'Apollo 17', lat: 20.2, lon: 30.8, desc: 'Last Human Moon Landing'},
                { name: 'Lunar South Pole', lat: -89.5, lon: 0, desc: 'Possible water ice'},
            ];

            pois.forEach(poi => {
                const latRad = THREE.MathUtils.degToRad(poi.lat);
                const lonRad = THREE.MathUtils.degToRad(poi.lon);

                // Point on the surface
                const surfaceR = 1.0;
                const sx = surfaceR * Math.cos(latRad) * Math.cos(lonRad);
                const sy = surfaceR * Math.sin(latRad);
                const sz = -surfaceR * Math.cos(latRad) * Math.sin(lonRad);

                // Vertical line from the point of the label
                const lineR = 1.08;
                const lx = lineR * Math.cos(latRad) * Math.cos(lonRad);
                const ly = lineR * Math.sin(latRad);
                const lz = -lineR * Math.cos(latRad) * Math.sin(lonRad);

                // Luminous point on the surface
                const dotGeometry = new THREE.SphereGeometry(0.018, 12, 12);
                const dotMaterial = new THREE.MeshBasicMaterial({
                    color: 0x4fc3f7,
                    transparent: true,
                    opacity: 1.0
                });
                const dot = new THREE.Mesh(dotGeometry, dotMaterial);
                dot.position.set(sx, sy, sz);
                window._moonGroup.add(dot);

                // Glow around the point
                const glowGeometry = new THREE.SphereGeometry(0.03, 12, 12);
                const glowMaterial = new THREE.MeshBasicMaterial({
                    color: 0x4fc3f7,
                    transparent: true,
                    opacity: 0.3
                });
                const glow = new THREE.Mesh(glowGeometry, glowMaterial);
                glow.position.set(sx, sy, sz);
                window._moonGroup.add(glow); 
                
                // Line from point on the label
                const lineGeometry = new THREE.BufferGeometry().setFromPoints([
                    new THREE.Vector3(sx, sy, sz),
                    new THREE.Vector3(lx, ly, lz)
                ]);
                const lineMaterial = new THREE.LineBasicMaterial({
                    color: 0x4fc3f7,
                    transparent: true,
                    opacity: 0.5
                });
                const line = new THREE.Line(lineGeometry, lineMaterial);
                window._moonGroup.add(line);

                const labelR = 1.12;
                const labX = labelR * Math.cos(latRad) * Math.cos(lonRad);
                const labY = labelR * Math.sin(latRad);
                const labZ = -labelR * Math.cos(latRad) * Math.sin(lonRad);

                const label = createMoonLabel(poi.name);
                label.position.set(labX, labY, labZ);
                label.scale.set(0.25, 0.08, 1);
                window._moonGroup.add(label);
            });
        }

        function createMoonLabel(text) {
            const canvas = document.createElement('canvas');
            canvas.width = 512;
            canvas.height = 80;
            const ctx = canvas.getContext('2d');

            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.beginPath();
            ctx.roundRect(4, 4, 504, 72, 12);
            ctx.fill();
            
            ctx.strokeStyle = 'rgba(79, 195, 247, 0.6)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(4, 4, 504, 72, 12);
            ctx.stroke();

            ctx.font = 'bold 28px Arial, sans-serif';
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(text, 256, 42);

            const texture = new THREE.CanvasTexture(canvas);
            texture.minFilter = THREE.LinearFilter;

            const material = new THREE.SpriteMaterial({
                map: texture,
                transparent: true,
                depthTest: false,
                depthWrite: false
            });
            
            return new THREE.Sprite(material);
        }

        function setupMoonMouseTracking() {
            const raycaster = new THREE.Raycaster();
            const mouse = new THREE.Vector2();

            threeRenderer.domElement.addEventListener('mousemove', function(event) {
                mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
                mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

                raycaster.setFromCamera(mouse, threeCamera);

                const sphereCenter = new THREE.Vector3(0, 0, 0);
                const sphereRadius = 1;
                const ray = raycaster.ray;

                const oc = new THREE.Vector3().subVectors(ray.origin, sphereCenter);
                const a = ray.direction.dot(ray.direction);
                const b = 2.0 * oc.dot(ray.direction);
                const c = oc.dot(oc) - sphereRadius * sphereRadius;
                const discriminant = b * b - 4 * a * c;

                if (discriminant > 0) {
                    const t = (-b - Math.sqrt(discriminant)) / (2 * a);
                    if (t > 0) {
                        const point = new THREE.Vector3();
                        ray.at(t, point);

                        const lat = THREE.MathUtils.radToDeg(Math.asin(point.y / sphereCenter));
                        const lon = THREE.MathUtils.radToDeg(Math.atan2(-point.z, point.x));

                        document.getElementById('latValue').textContent = lat.toFixed(3) + '°';
                        document.getElementById('lonValue').textContent = lon.toFixed(3) + '°';
                    }
                }

                const dist = threeCamera.position.length();
                const altKm = ((dist - 1) * 1737.4).toFixed(0);
                document.getElementById('altValue').textContent = altKm + ' km';
            });
        }

        function destroyThreeJS() {
            isThreeJSActive = false;

            if (threeScene) {
                threeScene.fog = null;
                removeSunFromScene(threeScene);
            }

            solarSystemObjects = {};
            if (solarSystemAnimId) {
                cancelAnimationFrame(solarSystemAnimId);
                solarSystemAnimId = null;
            }

            if (threeAnimationId) {
                cancelAnimationFrame(threeAnimationId);
                threeAnimationId = null;
            }

            if (window._threeResizeHandler) {
                window.removeEventListener('resize', window._threeResizeHandler);
                window._threeResizeHandler = null;
            }

            if (threeControls) {
                threeControls.dispose();
                threeControls = null;
            }

            if (threeRenderer) {
                threeRenderer.dispose();
                threeRenderer = null;
            }

            threeScene = null;
            threeCamera = null;

            const container = document.getElementById('threejsContainer');
            container.innerHTML = '';
            container.style.display = 'none';
        }

        async function switchPlanetInPlace(planetId, planet) {
            // Remove all entities
            viewer.entities.removeAll();

            let textureDataUrl = null;
            if (planet.textureUrl) {
                try {
                    const img = await loadImage(planet.textureUrl);
                    const canvas = document.createElement('canvas');
                    canvas.width = 2048;
                    canvas.height = 1024;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    textureDataUrl = canvas.toDataURL('image/jpeg', 0.92);
                } catch (e) {
                    console.warn('Texture failed:', planet.name, e.message);
                }
            }

            const DISPLAY_RADIUS = 6371000;

            let sphereMaterial;
            if (textureDataUrl) {
                sphereMaterial = new Cesium.ImageMaterialProperty({
                    image: textureDataUrl,
                    transparent: false,
                    repeat: new Cesium.Cartesian2(1.0, 1.0)
                });
            } else {
                const proceduralCanvas = buildProceduralCanvas(planet);
                sphereMaterial = new Cesium.ImageMaterialProperty({
                    image: proceduralCanvas.toDataURL('image/jpeg', 0.9),
                    transparent: false
                });
            }

            viewer.entities.add({
                name: planet.name,
                position: Cesium.Cartesian3.ZERO,
                ellipsoid: {
                    radii: new Cesium.Cartesian3(DISPLAY_RADIUS, DISPLAY_RADIUS, DISPLAY_RADIUS),
                    material: sphereMaterial,
                    outline: false,
                }
            });

            addSphericalShadow(viewer, DISPLAY_RADIUS, planetId);

            const cameraDistance = DISPLAY_RADIUS * 3.5;
            viewer.camera.setView({
                destination: new Cesium.Cartesian3(0, -cameraDistance, DISPLAY_RADIUS * 0.3),
                orientation: {
                    direction: Cesium.Cartesian3.normalize(
                        new Cesium.Cartesian3(0, 1, -0.05),
                        new Cesium.Cartesian3()
                    ),
                    up: Cesium.Cartesian3.UNIT_Z
                }
            });

            addPlanetPOIsOnSphere(planetId, DISPLAY_RADIUS);

            if (planetId === 'saturn') {
                addSaturnRings(viewer);
            }

            if (planetId === 'uranus') {
                addUranusRings(viewer);
            }
        }

        // Earth Viewer

        async function createEarthViewer() {
            viewer = new Cesium.Viewer('cesiumContainer', {
                terrainProvider: new Cesium.EllipsoidTerrainProvider(),
                animation: false,
                baseLayerPicker: false,
                fullscreenButton: false,
                vrButton: false,
                geocoder: false,
                homeButton: false,
                infoBox: true,
                sceneModePicker: false,
                selectionIndicator: true,
                timeline: false,
                navigationHelpButton: false,
                navigationInstructionsInitiallyVisible: false,
                scene3DOnly: false,
                skyBox: createSkyBox(),
                skyAtmosphere: new Cesium.SkyAtmosphere(),
                baseLayer: false
            });

            try {
                const esriProvider = await Cesium.ArcGisMapServerImageryProvider.fromUrl(
                    'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer'
                );
                viewer.imageryLayers.addImageryProvider(esriProvider);
            } catch (e) {
                viewer.imageryLayers.addImageryProvider(
                    new Cesium.OpenStreetMapImageryProvider({
                        url: 'https://tile.openstreetmap.org/'
                    })
                );
            }

            const scene = viewer.scene;
            scene.globe.enableLighting = true;
            scene.globe.depthTestAgainstTerrain = false;
            scene.fog.enabled = true;
            scene.globe.showGroundAtmosphere = true;

            viewer.camera.flyTo({
                destination: Cesium.Cartesian3.fromDegrees(12.4964, 41.9028, 15000000),
                orientation: {
                    heading: Cesium.Math.toRadians(0),
                    pitch: Cesium.Math.toRadians(-90),
                    roll: 0
                },
                duration: 2
            });

            addFamousPlaceMarkers();
            setupStreetViewEntitySelection();
            setupMouseTracking();
        }

        // Viewer Generic Planet
        
        async function createPlanetViewer(planetId, planet) {

            let textureDataUrl = null;

            if (planet.textureUrl) {
                try {
                    const img = await loadImage(planet.textureUrl);
                    const canvas = document.createElement('canvas');
                    canvas.width = 2048;
                    canvas.height = 1024;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    textureDataUrl = canvas.toDataURL('image/jpeg', 0.92);
                    console.log('Texture ready: ' + planet.name);
                } catch (e) {
                    console.warn('Texture failed:  ' + planet.name, e.message);
                }
            }

            // Create Viewer
            viewer = new Cesium.Viewer('cesiumContainer', {
                animation: false,
                baseLayerPicker: false,
                fullscreenButton: false,
                vrButton: false,
                geocoder: false,
                homeButton: false,
                infoBox: true,
                sceneModePicker: false,
                selectionIndicator: false,
                timeline: false,
                navigationHelpButton: false,
                scene3DOnly: false,
                skyBox: createSkyBox(),
                skyAtmosphere: false,
                baseLayer: false
            });

            const scene = viewer.scene;
            scene.globe.show = false;
            scene.fog.enabled = false;
            scene.backgroundColor = Cesium.Color.BLACK;

            if (scene.skyAtmosphere) {
                scene.skyAtmosphere.show = false;
            }

            viewer.imageryLayers.removeAll();

            viewer.clock.currentTime = Cesium.JulianDate.fromDate(
                new Date('2024-06-21T12:00:00Z')
            );
            viewer.clock.shouldAnimate = false;

            const DISPLAY_RADIUS = 6371000;

            let sphereMaterial;
            if (textureDataUrl) {
                sphereMaterial = new Cesium.ImageMaterialProperty({
                    image: textureDataUrl,
                    transparent: false,
                    repeat: new Cesium.Cartesian2(1.0, 1.0)
                });
            } else {
                const proceduralCanvas = buildProceduralCanvas(planet);
                sphereMaterial = new Cesium.ImageMaterialProperty({
                    image: proceduralCanvas.toDataURL('image/jpeg', 0.9),
                    transparent: false
                });
            }

            const planetEntity = viewer.entities.add({
                name: planet.name,
                position: Cesium.Cartesian3.ZERO,
                ellipsoid: {
                    radii: new Cesium.Cartesian3(DISPLAY_RADIUS, DISPLAY_RADIUS, DISPLAY_RADIUS),
                    material: sphereMaterial,
                    outline: false,
                }
            });

            addSphericalShadow(viewer, DISPLAY_RADIUS, planetId);

            // Camera
            const cameraDistance = DISPLAY_RADIUS * 3.5;
            viewer.camera.setView({
                destination: new Cesium.Cartesian3(0, -cameraDistance, DISPLAY_RADIUS * 0.3),
                orientation: {
                    direction: Cesium.Cartesian3.normalize(
                        new Cesium.Cartesian3(0, 1, -0.05),
                        new Cesium.Cartesian3()
                    ),
                    up: Cesium.Cartesian3.UNIT_Z
                }
            });

            viewer.scene.screenSpaceCameraController.minimumZoomDistance = DISPLAY_RADIUS * 1.05;
            viewer.scene.screenSpaceCameraController.maximumZoomDistance = DISPLAY_RADIUS * 20;

            addPlanetPOIsOnSphere(planetId, DISPLAY_RADIUS);

            if (planetId === 'saturn') {
                addSaturnRings(viewer);
            }

            if (planetId === 'uranus') {
                addUranusRings(viewer);
            }

            setupPlanetMouseTracking(planetId, planet);
        }

        function addSphericalShadow(viewer, radius, planetId) {
            const shadowCanvas = createSphericalShadowTexture(2048, 1024);
            const shadowDataUrl = shadowCanvas.toDataURL('image/png');

            const shadowRadius = radius * 1.002;

            viewer.entities.add({
                name: 'shadow_overlay',
                position: Cesium.Cartesian3.ZERO,
                ellipsoid: {
                    radii: new Cesium.Cartesian3(shadowRadius, shadowRadius, shadowRadius),
                    material: new Cesium.ImageMaterialProperty({
                        image: shadowDataUrl,
                        transparent: true,
                        color: Cesium.Color.WHITE
                    }),
                    outline: false,
                }
            });
        }

        function createSphericalShadowTexture(width, height) {
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');

            // Direction of the light

            const sunLon = Math.PI * 0.3;
            const sunLat = 0

            const sunX = Math.cos(sunLat) * Math.cos(sunLon);
            const sunY = Math.cos(sunLat) * Math.sin(sunLon);
            const sunZ = Math.sin(sunLat);

            const imageData = ctx.createImageData(width, height);
            const data = imageData.data;

            for (let py = 0; py < height; py++) {
                // Lat:
                const lat = (1.0 - py / height) * Math.PI - Math.PI / 2;

                for (let px = 0; px < width; px++) {
                    // Lon:
                    const lon = ((px + 0.5) / width) * 2.0 * Math.PI - Math.PI;

                    const nx = Math.cos(lat) * Math.cos(lon);
                    const ny = Math.cos(lat) * Math.sin(lon);
                    const nz = Math.sin(lat);

                    let dot = nx * sunX + ny * sunY + nz * sunZ;

                    let shadow;
                    const termLow = -0.08;  // Start shade
                    const termHigh = 0.12;  // End shade

                    if (dot <= termLow) {
                        shadow = 0.82;
                    } else if (dot >= termHigh) {
                        shadow = 0.0;
                    } else {
                        let t = (dot - termLow) / (termHigh - termLow);
                        t = t * t * (3.0 - 2.0 * t);
                        shadow = 0.82 * (1.0 - t);
                    }

                    const poleFactor = Math.cos(lat);
                    const poleDarken = (1.0 - poleFactor) * 0.08;
                    shadow = Math.min(0.9, shadow + poleDarken);

                    const idx = (py * width + px) * 4;
                    data[idx] = 0;      // R
                    data[idx + 1] = 0;  // G
                    data[idx + 2] = 0;  // B
                    data[idx + 3] = Math.floor(shadow * 255);   // Alpha
                }
            }

            ctx.putImageData(imageData, 0, 0);

            for (let py = 0; py < height; py++) {
                const rowStart = py * width * 4;

                data[rowStart + (width - 1) * 4 + 0] = data[rowStart + 0];
                data[rowStart + (width - 1) * 4 + 1] = data[rowStart + 1];
                data[rowStart + (width - 1) * 4 + 2] = data[rowStart + 2];
                data[rowStart + (width - 1) * 4 + 3] = data[rowStart + 3];
            }

            //const blurCanvas = document.createElement('canvas');
            //blurCanvas.width = width;
            //blurCanvas.height = height;
            //const blurCtx = blurCanvas.getContext('2d');
            //blurCtx.filter = 'blur(4px)';
            //blurCtx.drawImage(canvas, 0, 0);

            return canvas;
        }

        function buildProceduralCanvas(planet) {
            const canvas = document.createElement('canvas');
            canvas.width = 1024;
            canvas.height = 512;
            const ctx = canvas.getContext('2d');

            const baseColor = Cesium.Color.fromCssColorString(planet.color);
            const r = Math.floor(baseColor.red * 255);
            const g = Math.floor(baseColor.green * 255);
            const b = Math.floor(baseColor.blue * 255);

            ctx.fillStyle = `rgb(${r},${g},${b})`;
            ctx.fillRect(0, 0, 1024, 512);

            const name = planet.name.toLowerCase();
            const isGas = ['jupiter', 'saturn', 'uranus', 'neptune'].includes(name);
            const isRocky = ['mercury', 'moon', 'pluto', 'mars'].includes(name);

            if (isGas) {
                for (let y = 0; y < 512; y++) {
                    const intensity = Math.sin(y * 0.05) * 30 + Math.sin(y * 0.12) * 15;
                    const noise = (Math.random() - 0.5) * 8;
                    ctx.fillStyle = `rgb(
                        ${Math.max(0,Math.min(255, r + intensity + noise))},
                        ${Math.max(0,Math.min(255, g + intensity * 0.7 + noise))},
                        ${Math.max(0,Math.min(255, b + intensity * 0.5 + noise))}
                    )`;
                    ctx.fillRect(0, y, 1024, 1);
                }
                if (name === 'jupiter') {
                    ctx.beginPath();
                    ctx.ellipse(650, 280, 80, 40, 0, 0, Math.PI * 2);
                    ctx.fillStyle = 'rgba(180,60,30,0.5)';
                    ctx.fill();
                }
            } else if (isRocky) {
                for (let i = 0; i < 300; i++) {
                    const cx = Math.random() * 1024;
                    const cy = Math.random() * 512;
                    const cr = Math.random() * 12 + 1;
                    ctx.beginPath();
                    ctx.arc(cx, cy, cr, 0, Math.PI * 2);
                    ctx.strokeStyle = `rgba(255,255,255,${Math.random() * 0.2 + 0.05})`;

                    ctx.lineWidth = 1;
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.arc(cx, cy, cr * 0.6, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.15})`;
                    ctx.fill();
                }
            } else {
                for (let i = 0; i < 3000; i++) {
                    ctx.beginPath();
                    ctx.ellipse(
                        Math.random() * 1024, Math.random() * 512,
                        Math.random() * 60 + 5, Math.random() * 15 + 5,
                        Math.random() * Math.PI, 0, Math.PI * 2
                    );
                    ctx.fillStyle = `rgba(255,200,100,${Math.random() * 0.06})`;
                    ctx.fill();
                }
            }

            return canvas;
        }

        function addPlanetPOIsOnSphere(planetId, radius) {
            const pois = {
                moon: [
                    { name: 'Sea ​​of ​​tranquility', lat: 8.5, lon: 31.4, desc: 'Apollo 11 - First Moon Landing'},
                    { name: 'Crater Tycho', lat: -43.3, lon: -11.2, desc: 'Crater'},
                    { name: 'Crater Copernicus', lat: 9.6, lon: -20.1, desc: 'Crater'},
                    { name: 'Apollo 17', lat: 20.2, lon: 30.8, desc: 'Last Human Moon Landing'},
                    { name: 'Lunar South Pole', lat: -89.5, lon: 0, desc: 'Possible water ice'},
                ],
                mars: [
                    { name: 'Olympus Mons', lat: 18.65, lon: 133.8, desc: 'Tallest volcano in the Solar System (21.9 Km)'},
                    { name: 'North Pole', lat: 89.5, lon: 0, desc: 'Cap Polar Ice'},
                ],
                jupiter: [
                    { name: 'Big chunky spot', lat: -22.0, lon: -138.0, desc: 'Large Storm 16.000 km'},
                ],
                saturn: [
                    { name: 'Storm of the 2011', lat: 35.0, lon: 0, desc: 'Large White Storm'},
                ]
            };

            const planetPOIs = pois[planetId];
            if (!planetPOIs) return;

            const poiRadius = radius * 1.02;

            planetPOIs.forEach(poi => {
                const latRad = Cesium.Math.toRadians(poi.lat);
                const lonRad = Cesium.Math.toRadians(poi.lon);

                const x = poiRadius * Math.cos(latRad) * Math.cos(lonRad);
                const y = poiRadius * Math.cos(latRad) * Math.sin(lonRad);
                const z = poiRadius * Math.sin(latRad);

                const position = new Cesium.Cartesian3(x, y, z);

                viewer.entities.add({
                    name: poi.name,
                    position: position,
                    point: {
                        pixelSize: 8,
                        color: Cesium.Color.fromCssColorString(PLANETS[planetId].color),
                        outlineColor: Cesium.Color.WHITE,
                        outlineWidth: 2,
                        scaleByDistance: new Cesium.NearFarScalar(1e5, 2.0, 1e8, 0.3),
                    },
                    label: {
                        text: poi.name,
                        font: '13px sans-serif',
                        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                        outlineWidth: 2,
                        outlineColor: Cesium.Color.BLACK,
                        fillColor: Cesium.Color.WHITE,
                        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                        pixelOffset: new Cesium.Cartesian2(0, -10),
                        scaleByDistance: new Cesium.NearFarScalar(1e5, 1.0, 1e8, 0.0),
                        translucencyByDistance: new Cesium.NearFarScalar(1e6, 1.0, 5e7, 0.0),
                    },
                    description: `
                        <div style="font-family: sans-serif; padding: 10px;">
                            <h2>${poi.name}</h2>
                            <p>${poi.desc}</p>
                            <p><strong>Lat:</strong> ${poi.lat}° <strong>Lon:</strong> ${poi.lon}°</p>
                            <p><strong>Planet:</strong> ${PLANETS[planetId].emoji} ${PLANETS[planetId].name}</p>
                        </div>
                    `
                });
            });
        }

        function addSaturnRings(viewer) {
            const DISPLAY_RADIUS = 6371000;

            const ringCanvas = createSaturnRingTexture();
            const ringTextureUrl = ringCanvas.toDataURL('image/png');
            const ringCtx = ringCanvas.getContext('2d');

            const INNER_R = DISPLAY_RADIUS * 1.25;
            const OUTER_R = DISPLAY_RADIUS * 2.3;
            const NUM_RINGS = 60;
            const SEGMENTS = 180;

            for (let ring = 0; ring < NUM_RINGS; ring++) {
                const t = ring / NUM_RINGS;
                const radius = INNER_R + t * (OUTER_R - INNER_R);
                
                const canvasX = Math.floor(t * 1024);
                const pixelData = ringCtx.getImageData(canvasX, 32, 1, 1).data;

                if (pixelData[3] < 8) continue;

                const color = Cesium.Color.fromBytes(
                    pixelData[0], pixelData[1], pixelData[2],
                    Math.min(255, pixelData[3] + 30)
                );

                const positions = [];
                for (let i = 0; i <= SEGMENTS; i++) {
                    const angle = (i / SEGMENTS) * Math.PI * 2;
                    positions.push(new Cesium.Cartesian3(
                        radius * Math.cos(angle),
                        radius * Math.sin(angle),
                        0
                    ));
                }

                viewer.entities.add({
                    polyline: {
                        positions: positions,
                        width: 3,
                        material: new Cesium.ColorMaterialProperty(color),
                        followSurface: false,
                    }
                });
            }
        }

        function createSaturnRingTexture() {
            const canvas = document.createElement('canvas');
            canvas.width = 1024;
            canvas.height = 64;
            const ctx = canvas.getContext('2d');

            ctx.clearRect(0, 0, 1024, 64);

            const bands = [
                // Ring D
                { start: 0.00, end: 0.04, r: 120, g: 105, b: 85, alpha: 0.12 },
                // Ring C
                { start: 0.04, end: 0.17, r: 155, g: 135, b: 105, alpha: 0.25 },
                { start: 0.10, end: 0.12, r: 140, g: 120, b: 95, alpha: 0.15 }, // Gap C
                // Transition C -> B
                { start: 0.17, end: 0.19, r: 170, g: 150, b: 120, alpha: 0.35 },
                // Internal Ring B
                { start: 0.19, end: 0.30, r: 220, g: 200, b: 170, alpha: 0.90 },
                // Center Ring B
                { start: 0.30, end: 0.40, r: 235, g: 215, b: 180, alpha: 0.95 },
                // External Ring B
                { start: 0.40, end: 0.47, r: 215, g: 195, b: 165, alpha: 0.85 },
                // Cassini Division
                { start: 0.47, end: 0.53, r: 25, g: 20, b: 15, alpha: 0.06 },
                // Internal Ring A
                { start: 0.53, end: 0.62, r: 195, g: 175, b: 145, alpha: 0.70 },
                // Encke Division
                { start: 0.62, end: 0.63, r: 15, g: 12, b: 8, alpha: 0.04 },
                // Center Ring A
                { start: 0.63, end: 0.72, r: 185, g: 165, b: 135, alpha: 0.65 },
                // Keeler Division
                { start: 0.72, end: 0.725, r: 10, g: 8, b: 5, alpha: 0.03 },
                // External Ring A
                { start: 0.725, end: 0.78, r: 175, g: 155, b: 125, alpha: 0.55 },
                // Gap A-F
                { start: 0.78, end: 0.82, r: 8, g: 6, b: 4, alpha: 0.02 },
                // Ring F
                { start: 0.82, end: 0.84, r: 180, g: 160, b: 130, alpha: 0.45 },
                // Null Space
                { start: 0.84, end: 0.88, r: 5, g: 4, b: 3, alpha: 0.01 },
                // Ring G
                { start: 0.88, end: 0.93, r: 120, g: 105, b: 85, alpha: 0.06 },
                // Ring E
                { start: 0.94, end: 1.00, r: 140, g: 130, b: 120, alpha: 0.03 },
            ];

            bands.forEach(band => {
                const x1 = Math.floor(band.start * 1024);
                const x2 = Math.floor(band.end * 1024);

                for (let x = x1; x < x2; x++) {
                    const noise = Math.sin(x * 0.3) * 12
                                + Math.sin(x * 1.1) * 7
                                + Math.sin(x * 3.7) * 4
                                + Math.sin(x * 11.3) * 2;

                    const bandT = (x - x1) / Math.max(1, x2 - x1);
                    const radialFade = 1.0 - Math.pow(Math.abs(bandT - 0.5) * 2, 2) * 0.15;

                    const r = Math.max(0, Math.min(255, band.r + noise));
                    const g = Math.max(0, Math.min(255, band.g + noise * 0.85));
                    const b = Math.max(0, Math.min(255, band.b + noise * 0.7));
                    const a = Math.max(0, Math.min(1, band.alpha * radialFade + (Math.random() - 0.5) * 0.05));

                    for (let y = 0; y < 64; y++) {
                        const yNoise = (Math.random() - 0.5) * 8;
                        const finalR = Math.max(0, Math.min(255, r + yNoise));
                        const finalG = Math.max(0, Math.min(255, g + yNoise * 0.8));
                        const finalB = Math.max(0, Math.min(255, b + yNoise * 0.6));
                        ctx.fillStyle = `rgba(${Math.floor(finalR)}, ${Math.floor(finalG)}, ${Math.floor(finalB)}, ${a})`;
                        ctx.fillRect(x, y, 1, 1);
                    }
                }
            });

            for (let i = 0; i < 5000; i++) {
                const x = Math.random() * 1024;
                const y = Math.random() * 64;
                const bright = Math.random() > 0.4;
                const alpha = Math.random() * 0.08;
                ctx.fillStyle = bright
                    ? `rgba(255, 240, 200, ${alpha})`
                    : `rgba(0, 0, 0, ${alpha * 1.5})`;
                ctx.fillRect(x, y, 1, 1);
            }
            
            return canvas;
        }

        function addUranusRings(viewer) {
            const DISPLAY_RADIUS = 6371000;

            const ringCanvas = createUranusRingTexture();
            const ringCtx = ringCanvas.getContext('2d');

            const INNER_R = DISPLAY_RADIUS * 1.15;
            const OUTER_R = DISPLAY_RADIUS * 2.0;
            const NUM_RINGS = 50;
            const SEGMENTS = 180;

            const TILT_ANGLE = 98 * (Math.PI / 180);

            for (let ring = 0; ring < NUM_RINGS; ring++) {
                const t = ring / NUM_RINGS;
                const radius = INNER_R + t * (OUTER_R - INNER_R);

                const canvasX = Math.floor(t * 1024);
                const pixelData = ringCtx.getImageData(canvasX, 32, 1, 1).data;

                if (pixelData[3] < 5) continue;

                const color = Cesium.Color.fromBytes(
                    pixelData[0], pixelData[1], pixelData[2],
                    Math.min(255, pixelData[3] + 20)
                );

                const positions = [];
                for (let i = 0; i <= SEGMENTS; i++) {
                    const angle = (i / SEGMENTS) * Math.PI * 2;

                    const ringX = radius * Math.cos(angle);
                    const ringY = radius * Math.sin(angle);

                    const finalX = ringX;
                    const finalY = ringY * Math.cos(TILT_ANGLE);
                    const finalZ = ringY * Math.sin(TILT_ANGLE);

                    positions.push(new Cesium.Cartesian3(finalX, finalY, finalZ));
                }

                viewer.entities.add({
                    polyline: {
                        positions: positions,
                        width: 2,
                        material: new Cesium.ColorMaterialProperty(color),
                        followSurface: false,
                    }
                });
            }
        }

        function createUranusRingTexture() {
            const canvas = document.createElement('canvas');
            canvas.width = 1024;
            canvas.height = 64;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });

            ctx.clearRect(0, 0, 1024, 64);

            const rings = [
                // Ring 1986U2R
                { start: 0.00, end: 0.04, r: 130, g: 140, b:160, alpha: 0.04 },

                // Ring 6
                { start: 0.06, end: 0.075, r: 140, g: 150, b: 170, alpha: 0.15 },

                // Ring 5
                { start: 0.09, end: 0.105, r: 135, g: 145, b: 165, alpha: 0.18 },

                // Ring 4
                { start: 0.12, end: 0.135, r: 130, g: 140, b: 160, alpha: 0.14 },

                // Ring Alpha
                { start: 0.16, end: 0.19, r: 150, g: 160, b: 180, alpha: 0.28 },

                // Ring Beta
                { start: 0.21, end: 0.245, r: 145, g: 155, b: 175, alpha: 0.25 },

                // Ring Eta
                { start: 0.27, end: 0.29, r: 140, g: 150, b: 170, alpha: 0.12 },

                // Ring Gamma
                { start: 0.31, end: 0.335, r: 155, g: 165, b: 185, alpha: 0.30 },

                // Ring Delta
                { start: 0.36, end: 0.39, r: 150, g: 160, b: 180, alpha: 0.22 },

                // Ring Lambda
                { start: 0.42, end: 0.435, r: 135, g: 145, b: 165, alpha: 0.06 },

                // Ring Epsilon
                { start: 0.47, end: 0.55, r: 170, g: 180, b: 200, alpha: 0.50 },
                // Inside border in Epsilon
                { start: 0.47, end: 0.49, r: 180, g: 190, b: 210, alpha: 0.60 },
                // Outside border in Epsilon
                { start: 0.53, end: 0.55, r: 180, g: 190, b: 210, alpha: 0.55 },

                // Gap after Epsilon
                { start: 0.55, end: 0.62, r: 5, g: 5, b: 8, alpha: 0.01 },

                // Ring Nu
                { start: 0.65, end: 0.75, r: 120, g: 135, b: 165, alpha: 0.06 },
                // Border of Nu
                { start: 0.65, end: 0.67, r: 130, g: 145, b: 175, alpha: 0.10 },
                { start: 0.73, end: 0.75, r: 130, g: 145, b: 175, alpha: 0.10 },

                // Ring Mu
                { start: 0.82, end: 0.98, r: 110, g: 125, b: 155, alpha: 0.03 },
                // Central peak of Mu
                { start: 0.88, end: 0.92, r: 120, g: 135, b: 165, alpha: 0.06 },
            ];

            rings.forEach(ring => {
                const x1 = Math.floor(ring.start * 1024);
                const x2 = Math.floor(ring.end * 1024);

                for (let x = x1; x < x2; x++) {
                    const noise = Math.sin(x * 0.5) * 5
                                + Math.sin(x * 2.3) * 3
                                + Math.sin(x * 7.1) * 1.5;

                    const bandT = (x - x1) / Math.max(1, x2 - x1);
                    const radialFade = 1.0 - Math.pow(Math.abs(bandT - 0.5) * 2, 2) * 0.3;

                    const r = Math.max(0, Math.min(255, ring.r + noise));
                    const g = Math.max(0, Math.min(255, ring.g + noise * 0.9));
                    const b = Math.max(0, Math.min(255, ring.b + noise * 0.8));
                    const a = Math.max(0, Math.min(1, ring.alpha * radialFade));

                    for (let y = 0; y < 64; y++) {
                        const yNoise = (Math.random() - 0.5) * 4;
                        const finalR = Math.max(0, Math.min(255, r + yNoise));
                        const finalG = Math.max(0, Math.min(255, g + yNoise * 0.9));
                        const finalB = Math.max(0, Math.min(255, b + yNoise * 0.8));

                        ctx.fillStyle = `rgba(${Math.floor(finalR)}, ${Math.floor(finalG)}, ${Math.floor(finalB)}, ${a})`;
                        ctx.fillRect(x, y, 1, 1);
                    }
                }
            });

            for (let i = 0; i < 2000; i++) {
                const x = Math.random() * 1024;
                const y = Math.random() * 64;
                const bright = Math.random() > 0.5;
                const alpha = Math.random() * 0.04;
                ctx.fillStyle = bright
                    ? `rgba(180, 190, 210, ${alpha})`
                    : `rgba(0, 0, 0, ${alpha * 1.2})`;
                ctx.fillRect(x, y, 1, 1);
            }

            return canvas;
        }

        function createSaturnRingTextureForThree() {
            const canvas = document.createElement('canvas');
            canvas.width = 1024;
            canvas.height = 256;
            const ctx = canvas.getContext('2d');

            ctx.clearRect(0, 0, 1024, 256);

            const bands = [
                { start: 0.00, end: 0.08, r: 120, g: 105, b: 85, alpha: 0.12 },
                { start: 0.08, end: 0.20, r: 155, g: 135, b: 105, alpha: 0.25 },
                { start: 0.20, end: 0.35, r: 220, g: 200, b: 170, alpha: 0.70 },
                { start: 0.35, end: 0.48, r: 235, g: 215, b: 180, alpha: 0.85 },
                { start: 0.48, end: 0.54, r: 25, g: 20, b: 15, alpha: 0.05 }, // Cassini
                { start: 0.54, end: 0.68, r: 195, g: 175, b: 145, alpha: 0.60 },
                { start: 0.68, end: 0.72, r: 15, g: 12, b: 8, alpha: 0.03 }, // Encke
                { start: 0.72, end: 0.82, r: 185, g: 165, b: 135, alpha: 0.50 },
                { start: 0.82, end: 0.88, r: 180, g: 160, b: 130, alpha: 0.35 },
                { start: 0.88, end: 1.00, r: 120, g: 105, b: 85, alpha: 0.08 },
            ];

            bands.forEach(band => {
                const x1 = Math.floor(band.start * 1024);
                const x2 = Math.floor(band.end * 1024);

                for (let x = x1; x < x2; x++) {
                    const noise = Math.sin(x * 0.3) * 12 + Math.sin(x * 1.1) * 7;
                    const r = Math.max(0, Math.min(255, band.r + noise));
                    const g = Math.max(0, Math.min(255, band.g + noise * 0.85));
                    const b = Math.max(0, Math.min(255, band.b + noise * 0.7));
                    const a = band.alpha + (Math.random() - 0.5) * 0.05;

                    for (let y = 0; y < 256; y++) {
                        const yFade = Math.sin((y / 256) * Math.PI);
                        const finalAlpha = a * yFade;
                        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${finalAlpha})`;
                        ctx.fillRect(x, y, 1, 1);
                    }
                }
            });

            // Add noise
            for (let i = 0; i < 8000; i++) {
                const x = Math.random() * 1024; 
                const y = Math.random() * 256;
                const bright = Math.random() > 0.6;
                const alpha = Math.random() * 0.15;
                ctx.fillStyle = bright ? `rgba(255, 240, 200, ${alpha})`: `rgba(100, 80, 60, ${alpha * 0.5})`;
                ctx.fillRect(x, y, 1, 1);
            }

            const texture = new THREE.CanvasTexture(canvas);
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(4, 1);
            return texture;
        }

        function createUranusRingTextureForThree() {
            const canvas = document.createElement('canvas');
            canvas.width = 1024;
            canvas.height = 128;
            const ctx = canvas.getContext('2d');

            ctx.clearRect(0, 0, 1024, 128);

            const rings = [
                { start: 0.00, end: 0.06, r: 130, g: 140, b: 160, alpha: 0.04 },
                { start: 0.10, end: 0.16, r: 140, g: 150, b: 170, alpha: 0.12 },
                { start: 0.20, end: 0.28, r: 150, g: 160, b: 180, alpha: 0.20 },
                { start: 0.32, end: 0.42, r: 155, g: 165, b: 185, alpha: 0.25 },
                { start: 0.46, end: 0.58, r: 170, g: 180, b: 280, alpha: 0.40 },
                { start: 0.62, end: 0.72, r: 120, g: 135, b: 165, alpha: 0.06 },
                { start: 0.76, end: 0.86, r: 110, g: 125, b: 155, alpha: 0.03 },
                { start: 0.90, end: 1.00, r: 100, g: 115, b: 145, alpha: 0.02 },
            ];

            rings.forEach(ring => {
                const x1 = Math.floor(ring.start * 1024);
                const x2 = Math.floor(ring.end * 1024);

                for (let x = x1; x < x2; x++) {
                    const noise = Math.sin(x * 0.8) * 8 + Math.sin(x * 2.5) * 4;
                    const r = Math.max(0, Math.min(255, ring.r + noise));
                    const g = Math.max(0, Math.min(255, ring.g + noise * 0.9));
                    const b = Math.max(0, Math.min(255, ring.b + noise * 0.8));

                    const bandT = (x - x1) / Math.max(1, x2 - x1);
                    const radialFade = Math.sin(bandT * Math.PI);
                    const a = ring.alpha * radialFade;

                    for (let y = 0; y < 128; y++) {
                        const yFade = Math.sin((y / 128) * Math.PI);
                        const finalAlpha = a * yFade;
                        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${finalAlpha})`;
                        ctx.fillRect(x, y, 1, 1);
                    }
                }
            });

            const texture = new THREE.CanvasTexture(canvas);
            texture.wrapS = THREE.RepeatWrapping;
            texture.repeat.set(3, 1);
            return texture;
        }

        function createSkyBox() {
            return new Cesium.SkyBox({
                sources: {
                    positiveX: 'https://cesium.com/downloads/cesiumjs/releases/1.113/Build/Cesium/Assets/Textures/SkyBox/tycho2t3_80_px.jpg',
                    negativeX: 'https://cesium.com/downloads/cesiumjs/releases/1.113/Build/Cesium/Assets/Textures/SkyBox/tycho2t3_80_mx.jpg',
                    positiveY: 'https://cesium.com/downloads/cesiumjs/releases/1.113/Build/Cesium/Assets/Textures/SkyBox/tycho2t3_80_py.jpg',
                    negativeY: 'https://cesium.com/downloads/cesiumjs/releases/1.113/Build/Cesium/Assets/Textures/SkyBox/tycho2t3_80_my.jpg',
                    positiveZ: 'https://cesium.com/downloads/cesiumjs/releases/1.113/Build/Cesium/Assets/Textures/SkyBox/tycho2t3_80_pz.jpg',
                    negativeZ: 'https://cesium.com/downloads/cesiumjs/releases/1.113/Build/Cesium/Assets/Textures/SkyBox/tycho2t3_80_mz.jpg'
                }
            });
        }

        

        // Planets Mouse Tracking
        function setupPlanetMouseTracking(planetId, planet) {
            if (!viewer || viewer.isDestroyed()) return;
            
            const handler = new Cesium.ScreenSpaceEventHandler(viewer.canvas);

            handler.setInputAction(function (movement) {
                if (!viewer || viewer.isDestroyed()) return;

                const cartesian = viewer.camera.pickEllipsoid(
                    movement.endPosition,
                    viewer.scene.globe.ellipsoid
                );

                if (cartesian) {
                    const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
                    const lat = Cesium.Math.toDegrees(cartographic.latitude);
                    const lon = Cesium.Math.toDegrees(cartographic.longitude);
                    document.getElementById('latValue').textContent = lat.toFixed(3) + '°';
                    document.getElementById('lonValue').textContent = lon.toFixed(3) + '°';
                }

                const cameraHeight = viewer.camera.positionCartographic.height;
                if (cameraHeight > 1000000) {
                    document.getElementById('altValue').textContent = (cameraHeight / 1000).toFixed(0) + ' km';
                } else if (cameraHeight > 1000) {
                    document.getElementById('altValue').textContent = (cameraHeight / 1000).toFixed(1) + ' km';
                } else {
                    document.getElementById('altValue').textContent = cameraHeight.toFixed(0) + ' m';
                }
            }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
        }

        // Planet Transition Animation
        function showPlanetTransition(planet) {
            const overlay = document.getElementById('planetTransition');
            document.getElementById('travelEmoji').textContent = planet.emoji;
            document.getElementById('travelText').textContent = `Travel to ${planet.name}...`;
            document.getElementById('travelSubtext').textContent = `Distance from the Earth: ${planet.distance}`;
            overlay.classList.add('active');
        }

        function hidePlanetTransition() {
            setTimeout(() => {
                document.getElementById('planetTransition').classList.remove('active');
            }, 500);
        }

        // Update Planet UI
        function updatePlanetUI(planetId, planet) {
            document.querySelectorAll('.planet-btn').forEach(b => b.classList.remove('active'));

            const activeBtn = document.getElementById('planet-' + planetId);
            if (activeBtn) activeBtn.classList.add('active');

            const earthSections = document.querySelectorAll('.earth-only');
            const planetInfo = document.getElementById('planetInfo');

            if (planetId === 'earth') {
                earthSections.forEach(s => {
                    s.classList.remove('hidden-section');
                    s.style.opacity = '';
                    s.style.maxHeight = '';
                    s.style.pointerEvents = '';
                });

                planetInfo.style.display = 'none';
                document.getElementById('locationName').textContent = '-';
            } else {
                earthSections.forEach(s => {
                    s.classList.add('hidden-section');
                });

                planetInfo.style.display = 'block';
                document.getElementById('planetInfoName').textContent = `${planet.emoji} ${planet.name}`;
                document.getElementById('planetInfoDetails').innerHTML = `
                    📏 Diameter: ${planet.diameter}<br>
                    ⚖️ Gravity: ${planet.gravity}<br>
                    🌡️ Temperature: ${planet.temperature}<br>
                    🌙 Moons: ${planet.moons}<br>
                    ☀️ Day: ${planet.dayLength}<br>
                    📅 Year: ${planet.yearLength}<br>
                    💨 Atmosphere: ${planet.atmosphere}
                `;
                document.getElementById('locationName').textContent = planet.name;
            }

            setTimeout(() => {
                if (typeof lucide !== 'undefined') {
                    lucide.createIcons();
                }
            }, 100);
        }

        // Utility
        function sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }

        // Manage layer imagery (Satellite, Osm ..)
        
        async function setImageryLayer(type) {
            if (!viewer) return;

            const layers = viewer.imageryLayers;
            layers.removeAll();
            gridLayer = null;

            try {
                let provider;

                switch (type) {
                    case 'satellite':
                        provider = await Cesium.ArcGisMapServerImageryProvider.fromUrl(
                            'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer'
                        );
                        layers.addImageryProvider(provider);
                        break;

                    case 'osm':
                        provider = new Cesium.OpenStreetMapImageryProvider({
                            url: 'https://tile.openstreetmap.org/'
                        });
                        layers.addImageryProvider(provider);
                        break;

                    case 'terrain':
                        provider = new Cesium.UrlTemplateImageryProvider({
                            url: 'https://tiles.stadiamaps.com/tiles/stamen_terrain/{z}/{x}/{y}.png',
                            credit: new Cesium.Credit('Stadia Maps / Stamen Design'),
                            maximumLevel: 14
                        });
                        layers.addImageryProvider(provider)
                        break;

                    case 'dark':
                        provider = new Cesium.UrlTemplateImageryProvider({
                            url: 'https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
                            credit: new Cesium.Credit('CartoDB'),
                            maximumLevel: 18
                        });
                        layers.addImageryProvider(provider);
                        break;

                    case 'watercolor':
                        provider = new Cesium.UrlTemplateImageryProvider({
                            url: 'https://tiles.stadiamaps.com/tiles/stamen_watercolor/{z}/{x}/{y}.jpg',
                            credit: new Cesium.Credit('Stadia Maps / Stamen Design'),
                            maximumLevel: 16
                        });
                        layers.addImageryProvider(provider);
                        break;

                    case 'satellite_labels':
                        const satProvider = await Cesium.ArcGisMapServerImageryProvider.fromUrl(
                            'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer'
                        );
                        layers.addImageryProvider(satProvider);

                        const labelsProvider = new Cesium.UrlTemplateImageryProvider({
                            url: 'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
                            credit: new Cesium.Credit('ESRI Labels'),
                            maximumLevel: 18,
                            tileWidth: 256,
                            tileHeight: 256
                        });
                        const labelsLayer = layers.addImageryProvider(labelsProvider);
                        labelsLayer.alpha = 1.0;
                        break;
                    
                    default:
                        provider = new Cesium.OpenStreetMapImageryProvider({
                            url: 'https://tile.openstreetmap.org/'
                        });
                        layers.addImageryProvider(provider);
                        type = 'osm';
                        break;
                }

                if (gridEnabled) addGridLayer();

                currentBaseLayer = type;
                document.querySelectorAll('.map-btn').forEach(b => b.classList.remove('active'));
                const activeBtn = document.getElementById('btn_' + type);
                if (activeBtn) activeBtn.classList.add('active');

            } catch (error) {
                console.error('Error loading layer ' + type + ':', error);
                layers.removeAll();
                layers.addImageryProvider(
                    new Cesium.OpenStreetMapImageryProvider({url: 'https://tile.openstreetmap.org/' })
                );
                if (gridEnabled) addGridLayer();
                currentBaseLayer = 'osm';
                document.querySelectorAll('.map-btn').forEach(b => b.classList.remove('active'));
                const fb = document.getElementById('btn_osm');
                if (fb) fb.classList.add('active');
            }
        }

        // Markers in famous places

        let wondersVisible = true;
        let famousVisible = true;
        let wonderEntities = [];
        let famousEntities = [];

        function addFamousPlaceMarkers() {
            const wonders = [
                // 7 Wonders of the Modern World
                { name: 'Hagia Sophia', lat: 41.0082, lon: 28.9784, emoji: '' },
                { name: 'Chichén Itzá', lat: 20.6843, lon: -88.5678, emoji: '' },
                { name: 'Cristo Redentor', lat: -22.9519, lon: -43.2105, emoji: '' },
                { name: 'Colosseum', lat: 41.8902, lon: 12.4922, emoji: '' },
                { name: 'Great Wall', lat: 40.4319, lon: 116.5704, emoji: '' },
                { name: 'Machu Picchu', lat: -13.1631, lon: -72.5450, emoji: '' },
                { name: 'Petra', lat: 30.3285, lon: 35.4444, emoji: '' },
                { name: 'Taj Mahal', lat: 27.1751, lon: 78.0421, emoji: '' },
            ];

            const famous = [
                // Famous Places
                { name: 'Tour Eiffel', lat: 48.8584, lon: 2.2945, emoji: '' },
                { name: 'Statue of Liberty', lat: 40.6892, lon: -74.0445, emoji: '' },
                { name: 'Tokyo Tower', lat: 35.6586, lon: 139.7454, emoji: '' },
                { name: 'Pyramids of Giza', lat: 29.9792, lon: 31.1342, emoji: '' },
                { name: 'Sydney Opera House ', lat: -33.8568, lon: 151.2153, emoji: '' },
                { name: 'Big Ben', lat: 51.5007, lon: -0.1246, emoji: '' },
                { name: 'Acropolis', lat: 37.9715, lon: 23.7267, emoji: '' },
                { name: 'Louvre Museum', lat: 48.8606, lon: 2.3376, emoji: '' },
                { name: 'Grand Canyon', lat: 36.1069, lon: -112.1129, emoji: '' },
                { name: 'Mt. Kilimanjaro', lat: -3.0674, lon: 37.3556, emoji: '' },
                { name: 'Victoria Falls', lat: -17.9243, lon: 25.8572, emoji: ''},
                { name: 'Mount Everest', lat: 27.9881, lon: 86.9250, emoji: '' },
                { name: 'Uluru', lat: -25.3444, lon: 131.0369, emoji: '' },
                { name: 'Tower of Pisa', lat: 43.7230, lon: 10.3966, emoji: '' },
                { name: 'Sagrada Familia', lat: 41.4036, lon: 2.1744, emoji: '' },
                { name: 'Angkor Wat', lat: 13.4125, lon: 103.8670, emoji: '' },
                { name: 'Burj Khalifa', lat: 25.1972, lon: 55.2744, emoji: '' },
            ];

            wonderEntities = [];
            wonders.forEach(place => {
                const entity = viewer.entities.add({
                    name: place.name,
                    position: Cesium.Cartesian3.fromDegrees(place.lon, place.lat, 0),
                    point: {
                        pixelSize: 12,
                        color: Cesium.Color.fromCssColorString('#ffd700'),
                        outlineColor: Cesium.Color.WHITE,
                        outlineWidth: 2,
                        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                        scaleByDistance: new Cesium.NearFarScalar(1.5e2, 2.0, 1.5e7, 0.5),
                    },
                    label: {
                        text: `${place.emoji} ${place.name}`,
                        font: 'bold 14px sans-serif',
                        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                        outlineWidth: 2,
                        outlineColor: Cesium.Color.BLACK,
                        fillColor: Cesium.Color.fromCssColorString('#ffd700'),
                        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                        pixelOffset: new Cesium.Cartesian2(0, -15),
                        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                        scaleByDistance: new Cesium.NearFarScalar(1.5e2, 1.0, 5.0e6, 0.0),
                        translucencyByDistance: new Cesium.NearFarScalar(1.5e5, 1.0, 5.0e6, 0.0),
                    },
                    description: `
                        <div style="font-family: sans-serif; padding: 10px;">
                            <h2>${place.emoji} ${place.name}</h2>
                            <p><strong>Wonder of the Modern World</strong></p>
                            <p><strong>Coordinates:</strong> ${place.lat.toFixed(4)}°, ${place.lon.toFixed(4)}°</p>
                        </div>
                    `
                });

                entity.streetViewData = {
                    lat: place.lat,
                    lon: place.lon,
                    name: place.name
                };

                wonderEntities.push(entity);
            });

            famousEntities = [];
            famous.forEach(place => {
                const entity = viewer.entities.add({
                    name: place.name,
                    position: Cesium.Cartesian3.fromDegrees(place.lon, place.lat, 0),
                    point: {
                        pixelSize: 10,
                        color: Cesium.Color.fromCssColorString('#4fc3f7'),
                        outlineColor: Cesium.Color.WHITE,
                        outlineWidth: 2,
                        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                        scaleByDistance: new Cesium.NearFarScalar(1.5e2, 2.0, 1.5e7, 0.5),
                    },
                    label: {
                        text: `${place.emoji} ${place.name}`,
                        font: '14px sans-serif',
                        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                        outlineWidth: 2,
                        outlineColor: Cesium.Color.BLACK,
                        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                        pixelOffset: new Cesium.Cartesian2(0, -15),
                        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                        scaleByDistance: new Cesium.NearFarScalar(1.5e2, 1.0, 1.5e7, 0.3),
                        translucencyByDistance: new Cesium.NearFarScalar(1.5e5, 1.0, 5.0e6, 0.0),
                    },
                    description: `
                        <div style="font-family: sans-serif; padding: 10px;">
                            <h2>${place.emoji} ${place.name}</h2>
                            <p><strong>Coordinates:</strong> ${place.lat.toFixed(4)}°, ${place.lon.toFixed(4)}°</p>
                        </div>
                    `
                });

                entity.streetViewData = {
                    lat: place.lat,
                    lon: place.lon,
                    name: place.name
                };

                famousEntities.push(entity);
            });
        }

        function toggleWonders() {
            wondersVisible = !wondersVisible;

            wonderEntities.forEach(entity => {
                entity.show = wondersVisible;
            });

            const section = document.getElementById('wondersSection');
            section.style.display = wondersVisible ? 'block' : 'none';

            document.getElementById('btnToggleWonders').classList.toggle('active', wondersVisible);
        }

        function toggleFamous() {
            famousVisible = !famousVisible;

            famousEntities.forEach(entity => {
                entity.show = famousVisible;
            });

            const section = document.getElementById('famousSection');
            section.style.display = famousVisible ? 'block' : 'none';

            document.getElementById('btnToggleFamous').classList.toggle('active', famousVisible);
        }

        // Mouse Tracking

        function setupMouseTracking() {
            if (!viewer || viewer.isDestroyed()) return;

            const handler = new Cesium.ScreenSpaceEventHandler(viewer.canvas);

            handler.setInputAction(function (movement) {
                if (!viewer || viewer.isDestroyed()) return;
                
                const cartesian = viewer.camera.pickEllipsoid(
                    movement.endPosition,
                    viewer.scene.globe.ellipsoid
                );

                if (cartesian) {
                    const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
                    const lat = Cesium.Math.toDegrees(cartographic.latitude);
                    const lon = Cesium.Math.toDegrees(cartographic.longitude);

                    document.getElementById('latValue').textContent = lat.toFixed(3) + '°';
                    document.getElementById('lonValue').textContent = lon.toFixed(3) + '°';
                }

                const cameraHeight = viewer.camera.positionCartographic.height;
                if(cameraHeight > 1000000) {
                    document.getElementById('altValue').textContent = (cameraHeight / 1000).toFixed(0) + ' km';
                } else if (cameraHeight > 1000) {
                    document.getElementById('altValue').textContent = (cameraHeight / 1000).toFixed(1) + ' km';
                } else {
                    document.getElementById('altValue').textContent = cameraHeight.toFixed(0) + ' m';
                }
            }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
        }

        // Navigation - flyTo

        function flyTo(lat, lon, height, name) {
            stopAutoRotate();
            viewer.camera.flyTo({
                destination: Cesium.Cartesian3.fromDegrees(lon, lat, height || 1000),
                orientation: {
                    heading: Cesium.Math.toRadians(0),
                    pitch: Cesium.Math.toRadians(-45),
                    roll: 0
                },
                duration: 3
            });

            if (name) {
                document.getElementById('locationName').textContent = name;
            }

            if (currentPlanet === 'earth' && name) {
                showStreetViewButton(lat, lon, name);
            }
        }

        function resetView() {
            stopAutoRotate();
            if (currentPlanet === 'earth') {
                viewer.camera.flyTo({
                    destination: Cesium.Cartesian3.fromDegrees(12.4964, 41.9028, 15000000),
                    orientation: { heading: 0, pitch: Cesium.Math.toRadians(-90), roll: 0 },
                    duration: 2
                });
            } else if (currentPlanet === 'moon' || (PLANETS[currentPlanet] && PLANETS[currentPlanet].isOuterWilds) || (PLANETS[currentPlanet] && PLANETS[currentPlanet].isHalo)) {
                if (threeCamera && threeControls) {
                    threeCamera.position.set(0, 0, 8);
                    threeControls.update();
                }
                if (window._moonGroup) {
                    window._moonGroup.rotation.set(0, 0, 0);
                }
            } else {
                const DISPLAY_RADIUS = 6371000;
                const cameraDistance = DISPLAY_RADIUS * 3.5;
                viewer.camera.flyTo({
                    destination: new Cesium.Cartesian3(0, -cameraDistance, DISPLAY_RADIUS * 0.3),
                    orientation: { 
                        direction: Cesium.Cartesian3.normalize(
                            new Cesium.Cartesian3(0, 1, -0.05),
                            new Cesium.Cartesian3()
                        ),
                        up: Cesium.Cartesian3.UNIT_Z
                    },
                    duration: 2
                });
            }
            document.getElementById('locationName').textContent =
                currentPlanet === 'earth' ? '-' : PLANETS[currentPlanet].name;
        }

        // Zoom

        function zoomIn() {
            if (currentPlanet === 'moon' || (PLANETS[currentPlanet] && PLANETS[currentPlanet].isOuterWilds) || (PLANETS[currentPlanet] && PLANETS[currentPlanet].isHalo)) {
                if (threeCamera) {
                    const direction = new THREE.Vector3();
                    threeCamera.getWorldDirection(direction);
                    threeCamera.position.addScaledVector(direction, threeCamera.position.length() * 0.2);
                }
                return;
            }
            if (!viewer || viewer.isDestroyed()) return;
            viewer.camera.zoomIn(viewer.camera.positionCartographic.height * 0.3);
        }

        function zoomOut() {
            if (currentPlanet === 'moon' || (PLANETS[currentPlanet] && PLANETS[currentPlanet].isOuterWilds) || (PLANETS[currentPlanet] && PLANETS[currentPlanet].isHalo)) {
                if (threeCamera) {
                    const direction = new THREE.Vector3();
                    threeCamera.getWorldDirection(direction);
                    threeCamera.position.addScaledVector(direction, -threeCamera.position.length() * 0.2);
                }
                return;
            }
            if (!viewer || viewer.isDestroyed()) return;
            viewer.camera.zoomOut(viewer.camera.positionCartographic.height * 0.5);
        }

        // ViewMode

        function setViewMode(mode) {
            document.getElementById('btn3d').classList.remove('active');
            document.getElementById('btn2d').classList.remove('active');
            document.getElementById('btnColumbus').classList.remove('active');

            switch (mode) {
                case '3d':
                    viewer.scene.mode = Cesium.SceneMode.SCENE3D;
                    document.getElementById('btn3d').classList.add('active');
                    break;
                case '2d':
                    viewer.scene.mode = Cesium.SceneMode.SCENE2D;
                    document.getElementById('btn2d').classList.add('active');
                    break;
                case 'columbus':
                    viewer.scene.mode = Cesium.SceneMode.COLUMBUS_VIEW;
                    document.getElementById('btnColumbus').classList.add('active');
                    break;
            }
        }

        // Toggle Features

        function toggleNight() {
            nightMode = !nightMode;
            document.getElementById('btnNight').classList.toggle('active');

            if (nightMode) {
                // Simulate night view
                viewer.clock.currentTime = Cesium.JulianDate.fromDate(new Date('2024-01-15T22:00:00Z'));
                viewer.clock.shouldAnimate = false;
            } else {
                viewer.clock.currentTime = Cesium.JulianDate.now();
                viewer.clock.shouldAnimate = true;
            }

            viewer.scene.globe.enableLighting = true;
        }

        function toggleAtmosphere() {
            const scene = viewer.scene;

            if(currentPlanet !== 'earth') {
                alert(`${PLANETS[currentPlanet].emoji} ${PLANETS[currentPlanet].name} - Atmosphere: ${PLANETS[currentPlanet].atmosphere}`);
                return;
            }

            if (scene.skyAtmosphere) {
                scene.skyAtmosphere.show = !scene.skyAtmosphere.show;
            }
            scene.globe.showGroundAtmosphere = !scene.globe.showGroundAtmosphere;
            document.getElementById('btnAtmosphere').classList.toggle('active');
        }

        function addGridLayer() {
            if (!viewer) return;
            if (gridLayer) {
                viewer.imageryLayers.remove(gridLayer);
                gridLayer = null;
            }
            const gridProvider = new Cesium.GridImageryProvider({
                cells: 4,
                color: Cesium.Color.fromCssColorString('rgba(255, 255, 255, 0.3)'),
                glowColor: Cesium.Color.fromCssColorString('rgba(79, 195, 247, 0.2)'),
                glowWidth: 2
            });
            gridLayer = viewer.imageryLayers.addImageryProvider(gridProvider);
            gridLayer.alpha = 0.6;
        }

        function toggleGrid() {
            gridEnabled = !gridEnabled;
            document.getElementById('btnGrid').classList.toggle('active');
            if (gridEnabled) {
                addGridLayer();
            } else {
                // Remove grid layer
                if (gridLayer) {
                    viewer.imageryLayers.remove(gridLayer);
                    gridLayer = null;
                }
            }
        }

        // AutoRotate

        function startAutoRotate() {
            if (currentPlanet === 'moon') {
                window._moonAutoRotate = !window._moonAutoRotate;
                return;
            }

            if (PLANETS[currentPlanet] && PLANETS[currentPlanet].isOuterWilds) {
                window._owAutoRotate = !window._owAutoRotate;
                return;
            }

            if (PLANETS[currentPlanet] && PLANETS[currentPlanet].isHalo) {
                window._haloAutoRotate = !window._haloAutoRotate;
                return;
            }

            if (autoRotateEnabled) {
                stopAutoRotate();
                return;
            }
            autoRotateEnabled = true;
            viewer.clock.onTick.addEventListener(autoRotateTick);
        }

        function autoRotateTick() {
            if (!autoRotateEnabled) return;
            viewer.camera.rotate(Cesium.Cartesian3.UNIT_Z, -0.002);
        }

        function stopAutoRotate() {
            autoRotateEnabled = false;

            if (window._moonAutoRotate) window._moonAutoRotate = false;
            if (window._owAutoRotate) window._owAutoRotate = false;
            if (window._haloAutoRotate) window._haloAutoRotate = false;

            try {
                if (viewer && !viewer.isDestroyed()) {
                    viewer.clock.onTick.removeEventListener(autoRotateTick);
                }
            } catch (e) {}
        }

        // Search

        async function handleSearch(event) {
            if (event.key !== 'Enter') return;
            if (currentPlanet !== 'earth') {
                alert('The research is available only on Earth');
                return;
            }

            const query = document.getElementById('searchInput').value.trim();
            if (!query) return;

            try {
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`
                );
                const data = await response.json();

                if (data && data.length > 0) {
                    const result = data[0];
                    const lat = parseFloat(result.lat);
                    const lon = parseFloat(result.lon);
                    const displayName = result.display_name.split(',')[0];

                    flyTo(lat, lon, 5000, displayName);

                    // Add marker
                    const entity = viewer.entities.add({
                        name: displayName,
                        position: Cesium.Cartesian3.fromDegrees(lon, lat),
                        point: {
                            pixelSize: 12,
                            color: Cesium.Color.RED,
                            outlineColor: Cesium.Color.WHITE,
                            outlineWidth: 2,
                            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                        },
                        label: {
                            text: '- ' + displayName,
                            font: '14px sans-serif',
                            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                            outlineWidth: 2,
                            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                            pixelOffset: new Cesium.Cartesian2(0, -20),
                            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                        },
                        description: `
                            <div style="font-family: sans-serif; padding: 10px;">
                                <h2>- ${displayName}</h2>
                                <p>${result.display_name}</p>
                                <p><strong>Coordinate:</strong> ${lat.toFixed(4)}°, ${lon.toFixed(4)}°</p>
                                <p style="font-size:12px;opacity:0.75;">Use the Street View button outside this panel.</p>
                            </div>
                        `
                    });

                    entity.streetViewData = {
                        lat: lat,
                        lon: lon,
                        name: displayName
                    };

                    showStreetViewButton(lat, lon, displayName);

                } else {
                    alert('Place not founded. Try with another name.');
                }
            } catch (error) {
                console.error('Error research: ', error);
                alert('Error in the research. Check your internet connection.');
            }
        }

        // Fallback

        function initFallbackGlobe() {
            viewer = new Cesium.Viewer('cesiumContainer', {
                animation: false,
                baseLayerPicker: false,
                fullscreenButton: false,
                vrButton: false,
                geocoder: false,
                homeButton: false,
                infoBox: true,
                sceneModePicker: false,
                selectionIndicator: true,
                timeline: false,
                navigationHelpButton: false,
                terrainProvider: new Cesium.EllipsoidTerrainProvider(),
                baseLayer: false
            });

            viewer.imageryLayers.addImageryProvider(
                new Cesium.OpenStreetMapImageryProvider({
                    url: 'https://tile.openstreetmap.org/'
                })
            );

            viewer.scene.globe.enableLighting = true;
            viewer.scene.globe.showGroundAtmosphere = true;

            viewer.camera.flyTo({
                destination: Cesium.Cartesian3.fromDegrees(12.4964, 41.9028, 15000000),
                orientation: { heading: 0, pitch: Cesium.Math.toRadians(-90), roll: 0 },
                duration: 3
            });

            addFamousPlaceMarkers();
            setupStreetViewEntitySelection();
            setupMouseTracking();

            setTimeout(() => {
                document.getElementById('loadingScreen').classList.add('hidden');
            }, 2500);
        }

        function bakeShadowOnTexture(ctx, width, height) {
            return;
        }

        // Street View

        function openStreetView(lat, lon, name) {
            const overlay = document.getElementById('streetViewOverlay');
            const frame = document.getElementById('streetViewFrame');

            if (!overlay || !frame) return;

            const directUrl = `https://maps.google.com/maps?layer=c&cbll=${encodeURIComponent(lat)},${encodeURIComponent(lon)}&cbp=11,0,0,0,0&output=svembed`;

            frame.src = directUrl;

            // View Overlay
            overlay.style.display = 'block';

            requestAnimationFrame(() => {
                overlay.classList.add('active');
            });

            // Hide UI
            document.body.classList.add('streetview-active');

            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }

            console.log('Street View opened:', name, lat, lon);
        }

        function closeStreetView() {
            const overlay = document.getElementById('streetViewOverlay');
            const frame = document.getElementById('streetViewFrame');

            if (!overlay || !frame) return;

            // Fade out
            overlay.classList.remove('active');

            setTimeout(() => {
                overlay.style.display = 'none';
                frame.src = '';
            }, 400);

            // Restore UI
            document.body.classList.remove('streetview-active');

            console.log('Street View closed');
        }

        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && document.body.classList.contains('streetview-active')) {
                closeStreetView();
            }
        });

        let selectedStreetViewPlace = null;

        function showStreetViewButton(lat, lon, name) {
            selectedStreetViewPlace = {
                lat: Number(lat),
                lon: Number(lon),
                name: name || 'Selected location'
            };

            const btn = document.getElementById('streetViewFloatingBtn');
            if (!btn) return;

            const span = btn.querySelector('span');
            if (span) {
                span.textContent = `Street View: ${selectedStreetViewPlace.name}`;
            }

            btn.classList.add('visible');

            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }

        function hideStreetViewButton() {
            selectedStreetViewPlace = null;

            const btn = document.getElementById('streetViewFloatingBtn');
            if (btn) {
                btn.classList.remove('visible');
            }
        }

        function openSelectedStreetView() {
            if (!selectedStreetViewPlace) return;

            openStreetView(
                selectedStreetViewPlace.lat,
                selectedStreetViewPlace.lon,
                selectedStreetViewPlace.name
            );
        }

        function setupStreetViewEntitySelection() {
            if (!viewer || viewer.isDestroyed()) return;

            viewer.selectedEntityChanged.addEventListener(function(entity) {
                if (entity && entity.streetViewData) {
                    showStreetViewButton(
                        entity.streetViewData.lat,
                        entity.streetViewData.lon,
                        entity.streetViewData.name
                    );
                } else {
                    if (!document.body.classList.contains('streetview-active')) {
                        hideStreetViewButton();
                    }
                }
            });
        }

        // Clouds of Earth System

        function toggleClouds() {
            if (currentPlanet !== 'earth') {
                alert('Clouds are only available on Earth');
                return;
            }

            cloudsEnabled = !cloudsEnabled;
            document.getElementById('btnClouds').classList.toggle('active');

            if (cloudsEnabled) {
                addCloudsLayer();
            } else {
                removeCloudsLayer();
            }
        }

        function addCloudsLayer() {
            if (!viewer || viewer.isDestroyed()) return;

            // Generate texture
            const cloudCanvas = generateCloudTexture(2048, 1024);
            const cloudDataUrl = cloudCanvas.toDataURL('image/png');

            // Altitude
            const cloudProvider = new Cesium.SingleTileImageryProvider({
                url: cloudDataUrl,
                rectangle: Cesium.Rectangle.fromDegrees(-180, -90, 180, 90)
            });

            cloudsLayer = viewer.imageryLayers.addImageryProvider(cloudProvider);
            cloudsLayer.alpha = 0.6;
            cloudsLayer.brightness = 1.8;

            startCloudRotation();

            console.log('Clouds layer added');
        }

        function removeCloudsLayer() {
            if (cloudsLayer && viewer && !viewer.isDestroyed()) {
                viewer.imageryLayers.remove(cloudsLayer);
                cloudsLayer = null;
            }

            if (cloudsEntity && viewer && !viewer.isDestroyed()) {
                viewer.entities.remove(cloudsEntity);
                cloudsEntity = null;
            }

            stopCloudRotation();

            console.log('Clouds layer removed');
        }

        function startCloudRotation() {
            if (!cloudsLayer) return;

            let cloudOffset = 0;
            let frameCount = 0;

            cloudsRotationHandler = function () {
                if (!cloudsLayer || !viewer || viewer.isDestroyed()) return;

                frameCount++;

                if (frameCount % 600 === 0) {
                    cloudOffset += 0.02;

                    const cloudCanvas = generateCloudTexture(2048, 1024, cloudOffset);
                    const cloudDataUrl = cloudCanvas.toDataURL('image/png');

                    const currentAlpha = cloudsLayer.alpha;
                    viewer.imageryLayers.remove(cloudsLayer);

                    const cloudProvider = new Cesium.SingleTileImageryProvider({
                        url: cloudDataUrl,
                        rectangle: Cesium.Rectangle.fromDegrees(-180, -90, 180, 90)
                    });

                    cloudsLayer = viewer.imageryLayers.addImageryProvider(cloudProvider);
                    cloudsLayer.alpha = currentAlpha;
                    cloudsLayer.brightness = 1.8;
                }
            };

            viewer.clock.onTick.addEventListener(cloudsRotationHandler);
        }

        function stopCloudRotation() {
            if (cloudsRotationHandler && viewer && !viewer.isDestroyed()) {
                try {
                    viewer.clock.onTick.removeEventListener(cloudsRotationHandler);
                } catch (e) {}
            }
            cloudsRotationHandler = null;
        }

        function generateCloudTexture(width, height, offset) {
            const timeOffset = offset || 0;
            const workWidth = 1024;
            const workHeight = 512;

            const canvas = document.createElement('canvas');
            canvas.width = workWidth;
            canvas.height = workHeight;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });

            ctx.clearRect(0, 0, workWidth, workHeight);

            const imageData = ctx.createImageData(workWidth, workHeight);
            const data = imageData.data;

            const perm = generatePermutationTable();

            for (let py = 0; py < workHeight; py++) {
                const lat = (py / workHeight) * Math.PI;
                const latFactor = Math.sin(lat);
                const ny = py / workHeight;

                for (let px = 0; px < workWidth; px++) {
                    const nx = (px / workWidth) + timeOffset;

                    // Three Octave
                    let cloudValue = 0;

                    // Octave 1
                    cloudValue += perlinNoise2D(nx * 6, ny * 3, perm) * 0.5;

                    // Octave 2
                    cloudValue += perlinNoise2D(nx * 12, ny * 6, perm) * 0.25;

                    // Octave 3
                    cloudValue += perlinNoise2D(nx * 24, ny * 12, perm) * 0.125;

                    // Normalize on -1,1 to 0,1
                    cloudValue = (cloudValue + 1) * 0.5;
                    cloudValue = Math.max(0, cloudValue - 0.3) / 0.7;
                    cloudValue *= latFactor;

                    // ITCZ Equator
                    const equatorDist = Math.abs(ny - 0.5);
                    if (equatorDist < 0.08) {
                        cloudValue = Math.min(1, cloudValue + 0.3 * (1 - equatorDist / 0.08));
                    }

                    // Mid Latitude
                    const midLatNorth = Math.abs(ny - 0.3);
                    const midLatSouth = Math.abs(ny - 0.7);
                    if (midLatNorth < 0.1) {
                        cloudValue = Math.min(1, cloudValue + 0.2 * (1 - midLatNorth / 0.1));
                    }
                    if (midLatSouth < 0.1) {
                        cloudValue = Math.min(1, cloudValue + 0.2 * (1 - midLatSouth / 0.1));
                    }

                    // Soft borders
                    cloudValue = smoothstepCloud(cloudValue);

                    // Alpha
                    const alpha = Math.floor(cloudValue * 255);

                    // Brightness
                    const brightness = 240 + Math.floor(cloudValue * 15);

                    const idx = (py * workWidth + px) * 4;
                    data[idx] = brightness;                         // R
                    data[idx + 1] = brightness;                     // G
                    data[idx + 2] = Math.min(255, brightness + 8);  // B
                    data[idx + 3] = alpha;                          // A
                }
            }

            ctx.putImageData(imageData, 0, 0);

            const finalCanvas = document.createElement('canvas');
            finalCanvas.width = width;
            finalCanvas.height = height;
            const finalCtx = finalCanvas.getContext('2d');

            finalCtx.imageSmoothingEnabled = true;
            finalCtx.imageSmoothingQuality = 'high';
            finalCtx.drawImage(canvas, 0, 0, width, height);

            return finalCanvas;
        }

        function generatePermutationTable() {
            const p = [];
            for (let i = 0; i < 256; i++) p[i] = i;

            let seed = 42;
            for (let i = 255; i > 0; i--) {
                seed = (seed * 16807 + 0) % 2147483647;
                const j = seed % (i + 1);
                [p[i], p[j]] = [p[j], p[i]];
            }

            const perm = new Array(512);
            for (let i = 0; i < 512; i++) perm[i] = p[i & 255];

            return perm;
        }

        function perlinNoise2D(x, y, perm) {
            const X = Math.floor(x) & 255;
            const Y = Math.floor(y) & 255;

            x -= Math.floor(x);
            y -= Math.floor(y);

            const u = fadeNoise(x);
            const v = fadeNoise(y);

            const a = perm[X] + Y;
            const b = perm[X + 1] + Y;

            return lerpNoise(v,
                lerpNoise(u, gradNoise2D(perm[a], x, y), gradNoise2D(perm[b], x - 1, y)),
                lerpNoise(u, gradNoise2D(perm[a + 1], x, y - 1), gradNoise2D(perm[b + 1], x - 1, y - 1))
            );
        }

        function fadeNoise(t) {
            return t * t * t * (t * (t * 6 - 15) + 10);
        }

        function lerpNoise(t, a, b) {
            return a + t * (b - a);
        }

        function gradNoise2D(hash, x, y) {
            const h = hash & 3;
            const u = h < 2 ? x : y;
            const v = h < 2 ? y : x;
            return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
        }

        function smoothstepCloud(t) {
            t = Math.max(0, Math.min(1, t));
            return t * t * (3 - 2 * t);
        }

        // Aurora Borealis System

        function toggleAurora() {
            if (currentPlanet !== 'earth') {
                alert('Aurora Borealis is only available on Earth');
                return;
            }

            auroraEnabled = !auroraEnabled;
            document.getElementById('btnAurora').classList.toggle('active');

            if (auroraEnabled) {
                createAurora();
            } else {
                removeAurora();
            }
        }

        function createAurora() {
            if (!viewer || viewer.isDestroyed()) return;

            removeAurora();

            const auroraCanvas = generateAuroraTexture();
            const auroraDataUrl = auroraCanvas.toDataURL('image/png');

            const auroraProvider = new Cesium.SingleTileImageryProvider({
                url: auroraDataUrl,
                rectangle: Cesium.Rectangle.fromDegrees(-180, -90, 180, 90)
            });

            auroraLayer = viewer.imageryLayers.addImageryProvider(auroraProvider);
            auroraLayer.alpha = 0.7;
            auroraLayer.brightness = 2.0;

            startAuroraAnimation();

            console.log('Aurora Borealis enabled');
        }

        function generateAuroraTexture() {
            const auroraWidth = 1024;
            const auroraHeight = 512;

            const auroraCanvas = document.createElement('canvas');
            auroraCanvas.width = auroraWidth;
            auroraCanvas.height = auroraHeight;
            const auroraCtx = auroraCanvas.getContext('2d');

            auroraCtx.clearRect(0, 0, auroraWidth, auroraHeight);

            // Aurora Nord
            drawAuroraBand(auroraCtx, auroraWidth, auroraHeight, 'north');

            // Aurora Sud
            drawAuroraBand(auroraCtx, auroraWidth, auroraHeight, 'south');

            return auroraCanvas;
        }

        function drawAuroraBand(ctx, width, height, pole) {
            let centerY, bandHeight;
            if (pole === 'north') {
                centerY = Math.floor((90 - 68) / 180 * height);
                bandHeight = Math.floor(14 / 180 * height);
            } else {
                centerY = Math.floor((90 + 68) / 180 * height);
                bandHeight = Math.floor(14 / 180 * height);
            }

            const startY = centerY - Math.floor(bandHeight / 2);
            const endY = centerY + Math.floor(bandHeight / 2);

            const NUM_CURTAINS = 20;

            for (let c = 0; c < NUM_CURTAINS; c++) {
                const curtainStartX = Math.floor((c / NUM_CURTAINS) * width);
                const curtainWidth = Math.floor(width / NUM_CURTAINS * 1.8);

                const curtainIntensity = 0.4 + Math.random() * 0.6;

                for (let x = curtainStartX; x < curtainStartX + curtainWidth && x < width; x++) {
                    const xT = (x - curtainStartX) / curtainWidth;
                    const fadeX = Math.sin(xT * Math.PI);

                    const yOffset = Math.sin(x * 0.03 + c * 2.1) * 8
                                  + Math.sin(x * 0.07 + c * 0.9) * 4;
                    
                    for (let y = startY - 10; y < endY + 10; y++) {
                        const adjustedY = y - yOffset;

                        if (adjustedY < 0 || adjustedY >= height) continue;

                        const distFromCenter = Math.abs(adjustedY - centerY) / (bandHeight / 2);

                        if (distFromCenter > 1.3) continue;

                        // Vertical Profile
                        let verticalFade;
                        if (pole === 'north') {
                            const relY = (adjustedY - startY) / bandHeight;
                            verticalFade = Math.sin(relY * Math.PI * 0.8) * (1 - distFromCenter * 0.7);
                        } else {
                            const relY = (endY - adjustedY) / bandHeight;
                            verticalFade = Math.sin(relY * Math.PI * 0.8) * (1 - distFromCenter * 0.7);
                        }

                        verticalFade = Math.max(0, verticalFade);

                        const alpha = verticalFade * fadeX * curtainIntensity;

                        if (alpha < 0.01) continue;

                        // Color
                        const greenBase = 180 + Math.floor(Math.random() * 40);
                        const blueBase = 40 + Math.floor(distFromCenter * 120);
                        const redBase = Math.floor(distFromCenter * 80);

                        const px = x % width;

                        ctx.fillStyle = `rgba(${redBase}, ${greenBase}, ${blueBase}, ${alpha * 0.8})`;
                        ctx.fillRect(px, Math.floor(adjustedY), 1, 1);
                    }
                }
            }

            for (let i = 0; i < 60; i++) {
                const rayX = Math.random() * width;
                const rayWidth = 1 + Math.random() * 2;
                const rayAlpha = 0.1 + Math.random() * 0.3;
                const rayStartY = startY - 5 + Math.random() * 10;
                const rayHeight = bandHeight * (0.5 + Math.random() * 0.5);

                const gradient = ctx.createLinearGradient(rayX, rayStartY, rayX, rayStartY + rayHeight);

                if (pole === 'north') {
                    gradient.addColorStop(0, `rgba(100, 255, 150, 0)`);
                    gradient.addColorStop(0.3, `rgba(100, 255, 150, ${rayAlpha})`);
                    gradient.addColorStop(0.6, `rgba(80, 220, 180, ${rayAlpha * 0.7})`);
                    gradient.addColorStop(1, `rgba(60, 150, 200, 0)`);
                } else {
                    gradient.addColorStop(0, `rgba(60, 150, 200, 0)`);
                    gradient.addColorStop(0.4, `rgba(80, 220, 180, ${rayAlpha * 0.7})`);
                    gradient.addColorStop(0.7, `rgba(100, 255, 150, ${rayAlpha})`);
                    gradient.addColorStop(1, `rgba(100, 255, 150, 0)`);
                }

                ctx.fillStyle = gradient;
                ctx.fillRect(rayX, rayStartY, rayWidth, rayHeight);
            }

            // Glow
            const glowGradient = ctx.createLinearGradient(0, startY - 20, 0, endY + 20);
            glowGradient.addColorStop(0, 'rgba(50, 200, 100, 0)');
            glowGradient.addColorStop(0.2, 'rgba(50, 200, 100, 0.03)');
            glowGradient.addColorStop(0.5, 'rgba(80, 255, 150, 0.06)');
            glowGradient.addColorStop(0.8, 'rgba(50, 200, 100, 0.03)');
            glowGradient.addColorStop(1, 'rgba(50, 200, 100, 0)');

            ctx.fillStyle = glowGradient;
            ctx.fillRect(0, startY - 20, width, bandHeight + 40);
        }

        function startAuroraAnimation() {
            if (auroraAnimationHandler) return;

            auroraTime = 0;
            let lastUpdate = 0;

            auroraAnimationHandler = function () {
                if (!auroraEnabled || !viewer || viewer.isDestroyed() || !auroraLayer) return;

                auroraTime += 0.016;

                // Pulse of opacity
                const pulse = Math.sin(auroraTime * 0.4) * 0.15 + 0.7;
                const breathe = Math.sin(auroraTime * 0.15) * 0.1 + 0.9;

                auroraLayer.alpha = pulse * breathe;
                auroraLayer.brightness = 1.8 + Math.sin(auroraTime * 0.3) * 0.4;

                if (auroraTime - lastUpdate > 8) {
                    lastUpdate = auroraTime;

                    const newCanvas = generateAuroraTexture();
                    const newDataUrl = newCanvas.toDataURL('image/png');

                    const currentAlpha = auroraLayer.alpha;
                    const currentBrightness = auroraLayer.brightness;

                    viewer.imageryLayers.remove(auroraLayer);

                    const newProvider = new Cesium.SingleTileImageryProvider({
                        url: newDataUrl,
                        rectangle: Cesium.Rectangle.fromDegrees(-180, -90, 180, 90)
                    });

                    auroraLayer = viewer.imageryLayers.addImageryProvider(newProvider);
                    auroraLayer.alpha = currentAlpha;
                    auroraLayer.brightness = currentBrightness;
                }
            };

            viewer.clock.onTick.addEventListener(auroraAnimationHandler);
        }

        function stopAuroraAnimation() {
            if (auroraAnimationHandler && viewer && !viewer.isDestroyed()) {
                try {
                    viewer.clock.onTick.removeEventListener(auroraAnimationHandler);
                } catch (e) {}
            }
            auroraAnimationHandler = null;
        }

        function removeAurora() {
            stopAuroraAnimation();

            if (auroraLayer && viewer && !viewer.isDestroyed()) {
                viewer.imageryLayers.remove(auroraLayer);
                auroraLayer = null;
            }

            auroraEntities.forEach(aurora => {
                if (aurora.entity && viewer && !viewer.isDestroyed()) {
                    viewer.entities.remove(aurora.entity);
                }
            });

            auroraEntities = [];
            auroraTime = 0;

            console.log('Aurora Borealis removed');
        }

        // Measurement System

        function toggleDistanceMeasurement() {
            if (currentPlanet !== 'earth') {
                alert('Distance measurement is only available on Earth');
                return;
            }

            distanceMeasurementActive = !distanceMeasurementActive;
            const btn = document.getElementById('btnDistanceMeasure');

            if (distanceMeasurementActive) {
                // Active mode
                btn.classList.add('active');
                clearAllMeasurement();
                enableDistanceMeasurement();
                showMeasureTooltip('Click on two points on the map to measure distance', 3000);
            } else {
                // Deactive mode
                btn.classList.remove('active');
                disableDistanceMeasurement();
                clearAllMeasurement();
                hideMeasureTooltip();
            }
        }

        function enableDistanceMeasurement() {
            if (!viewer || viewer.isDestroyed()) return;

            // Change cursor
            viewer.canvas.style.cursor = 'crosshair';

            // Add event handler
            measureClickHandler = new Cesium.ScreenSpaceEventHandler(viewer.canvas);

            measureClickHandler.setInputAction(function(click) {
                if (!distanceMeasurementActive) return;

                const cartesian = viewer.camera.pickEllipsoid(
                    click.position,
                    viewer.scene.globe.ellipsoid
                );

                if (cartesian) {
                    const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
                    const lat = Cesium.Math.toDegrees(cartographic.latitude);
                    const lon = Cesium.Math.toDegrees(cartographic.longitude);

                    addMeasurePoint(lat, lon, cartesian);
                }
            }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

            // Button ESC for cancel
            document.addEventListener('keydown', measureKeyHandler);
        }

        function disableDistanceMeasurement() {
            if (measureClickHandler) {
                measureClickHandler.destroy();
                measureClickHandler = null;
            }
            document.removeEventListener('keydown', measureKeyHandler);
            if (viewer && !viewer.isDestroyed()) {
                viewer.canvas.style.cursor = 'default';
            }
        }

        function measureKeyHandler(e) {
            if (e.key === 'Escape' && distanceMeasurementActive) {
                clearAllMeasurement();
            }
        }

        function addMeasurePoint(lat, lon, position) {
            if (measurePoints.length >= 2) {
                clearAllMeasurement();
            }

            const pointNumber = measurePoints.length + 1;
            const color = measurePoints.length === 0 ? Cesium.Color.LIME : Cesium.Color.YELLOW;

            // Add point
            const pointEntity = viewer.entities.add({
                name: `Measure Point ${pointNumber}`,
                position: position,
                point: {
                    pixelSize: 14,
                    color: color,
                    outlineColor: Cesium.Color.WHITE,
                    outlineWidth: 2,
                    heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                },
                label: {
                    text: `${pointNumber}`,
                    font: 'bold 16px sans-serif',
                    fillColor: Cesium.Color.WHITE,
                    outlineColor: Cesium.Color.BLACK,
                    outlineWidth: 2,
                    verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                    pixelOffset: new Cesium.Cartesian2(0, -15),
                    heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                }
            });

            measureEntities.push(pointEntity);
            measurePoints.push({ lat, lon, position, entity: pointEntity });

            // Tooltip with coordinates
            showMeasureTooltip(`Point ${pointNumber}: ${lat.toFixed(4)}°, ${lon.toFixed(4)}°`, 2000);

            if (measurePoints.length === 2) {
                calculateAndShowDistance();
            }
        }

        function calculateAndShowDistance() {
            if (measurePoints.length !== 2) return;

            const p1 = measurePoints[0];
            const p2 = measurePoints[1];

            const distance = Cesium.Cartesian3.distance(p1.position, p2.position);

            const distanceKm = distance / 1000;

            const greatCircleDistance = calculateGreatCircleDistance(p1.lat, p1.lon, p2.lat, p2.lon);

            let distanceText;
            if (distanceKm < 1) {
                distanceText = `${(distanceKm * 1000).toFixed(0)} m`;
            } else if (distanceKm < 100) {
                distanceText = `${distanceKm.toFixed(2)} km`;
            } else {
                distanceText = `${distanceKm.toFixed(1)} km`;
            }

            const linePositions = [p1.position, p2.position];
            const lineEntity = viewer.entities.add({
                name: 'Distance Line',
                polyline: {
                    positions: linePositions,
                    width: 3,
                    material: new Cesium.PolylineGlowMaterialProperty({
                        glowPower: 0.2,
                        color: Cesium.Color.CYAN
                    }),
                    arcType: Cesium.ArcType.GEODESIC,
                }
            });
            measureLines.push(lineEntity);

            const centerPoint = Cesium.Cartesian3.midpoint(p1.position, p2.position, new Cesium.Cartesian3());
            const centerCartographic = Cesium.Cartographic.fromCartesian(centerPoint);
            const labelEntity = viewer.entities.add({
                name: 'Distance Label',
                position: centerPoint,
                label: {
                    text: `📏 ${distanceText}`,
                    font: 'bold 14px sans-serif',
                    fillColor: Cesium.Color.CYAN,
                    outlineColor: Cesium.Color.BLACK,
                    outlineWidth: 3,
                    style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                    verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                    horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
                    pixelOffset: new Cesium.Cartesian2(0, -20),
                    heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                    scaleByDistance: new Cesium.NearFarScalar(1e3, 1.0, 1e7, 0.3),
                }
            });
            measureLabels.push(labelEntity);

            const greatCircleText = greatCircleDistance < 1000 ?
                `${greatCircleDistance.toFixed(1)} km` :
                `${(greatCircleDistance / 1000).toFixed(1)} km`;

            showMeasureTooltip(
                `- Distance: ${distanceText}\n` +
                `- Great-circle: ${greatCircleText}\n` +
                `- From: ${p1.lat.toFixed(4)}°, ${p1.lon.toFixed(4)}°\n` +
                `- To: ${p2.lat.toFixed(4)}°, ${p2.lon.toFixed(4)}°`,
                5000
            );

            updateMeasurementPanel(p1, p2, distanceKm, greatCircleDistance);

            console.log(`Distance: ${distanceKm.toFixed(2)} km | Great-circle: ${greatCircleDistance.toFixed(1)} km`);
        }

        function calculateGreatCircleDistance(lat1, lon1, lat2, lon2) {
            const R = 6371;
            const dLat = (lat2 - lat1) * Math.PI / 180;
            const dLon = (lon2 - lon1) * Math.PI / 180;
            const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            return R * c;
        }

        function clearAllMeasurement() {
            measureEntities.forEach(entity => {
                if (entity && viewer && !viewer.isDestroyed()) viewer.entities.remove(entity);
            });
            measureLines.forEach(entity => {
                if (entity && viewer && !viewer.isDestroyed()) viewer.entities.remove(entity);
            });
            measureLabels.forEach(entity => {
                if (entity && viewer && !viewer.isDestroyed()) viewer.entities.remove(entity);
            });

            measureEntities = [];
            measureLines = [];
            measureLabels = [];
            measurePoints = [];

            const panel = document.getElementById('measurementPanel');
            if (panel) panel.style.display = 'none';
        }

        function showMeasureTooltip(message, duration) {
            let tooltip = document.getElementById('measureTooltip');
            if (!tooltip) {
                tooltip = document.createElement('div');
                tooltip.id = 'measureTooltip';
                tooltip.style.cssText = `
                    position: fixed;
                    bottom: 100px;
                    left: 50%;
                    transform: translateX(-50%);
                    background rgba(0, 0, 0, 0.85);
                    backdrop-filter: blur(10px);
                    color: #4fc3f7;
                    padding: 10px 20px;
                    border-radius: 12px;
                    font-size: 13px;
                    font-family: monospace;
                    z-index: 2000;
                    border: 1px solid rgba(79, 195, 247, 0.3);
                    white-space: pre-line;
                    text-align: center;
                    pointer-events: none;
                    transition: opacity 0.3s;    
                `;
                document.body.appendChild(tooltip);
            }

            tooltip.textContent = message;
            tooltip.style.opacity = '1';
            tooltip.style.display = 'block';

            clearTimeout(window.measureTooltipTimeout);
            window.measureTooltipTimeout = setTimeout(() => {
                if (tooltip) tooltip.style.opacity = '0';
                setTimeout(() => {
                    if (tooltip) tooltip.style.display = 'none';
                }, 300);
            }, duration);
        }

        function hideMeasureTooltip() {
            const tooltip = document.getElementById('measureTooltip');
            if (tooltip) {
                tooltip.style.opacity = '0';
                setTimeout(() => {
                    if (tooltip) tooltip.style.display = 'none';
                }, 300);
            }
        }

        function updateMeasurementPanel(p1, p2, distanceKm, greatCircleDistance) {
            let panel = document.getElementById('measurementPanel');
            if (!panel) {
                panel = document.createElement('div');
                panel.id = 'measurementPanel';
                panel.className = 'measurement-panel';
                panel.innerHTML = `
                    <div class="measurement-header">
                        <span>📏 Distance Measurement</span>
                        <button onclick="clearAllMeasurement()" class="measurement-clear">x</button>
                    </div>
                    <div class="measurement-content">
                        <div class="measurement-points">
                            <div><span class="point-badge point-1">1</span> <span id="measurePoint1" style="color: white;">-</span></div>
                            <div><span class="point-badge point-2">2</span> <span id="measurePoint2" style="color: white;">-</span></div>
                        </div>
                        <div class="measurement-result">
                            <div class="result-line">📏 <span id="measureDistance">-</span></div>
                            <div class="result-line">🔄 <span id="measureGreatCircle">-</span></div>
                    </div>
                `;
                document.body.appendChild(panel);

                // CSS
                const style = document.createElement('style');
                style.textContent = `
                    .measurement-panel {
                        position: fixed;
                        bottom: 20px;
                        right: 20px;
                        width: 260px;
                        background: rgba(0, 0, 0, 0.85);
                        backdrop-filter: blur(15px);
                        border: 1px solid rgba(79, 195, 247, 0.3);
                        border-radius: 12px;
                        z-index: 1500;
                        font-family: 'Segoe UI', sans-serif;
                        overflow: hidden;
                    }
                    .measurement-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 10px 15px;
                        background: rgba(79, 195, 247, 0.15);
                        color: #4fc3f7;
                        font-size: 13px;
                        font-weight: 600;
                        border-bottom: 1px solid rgba(255,255,255,0.1);
                    }
                    .measurement-clear {
                        background: none;
                        border: none;
                        color: rgba(255,255,255,0.6);
                        cursor: pointer;
                        font-size: 16px;
                        padding: 0 5px;
                    }
                    .measurement-clear:hover {
                        color: #ff5555;
                    }
                    .measurement-content {
                        padding: 12px 15px;
                        font-size: 12px;
                    }
                    .measurement-points {
                        margin-bottom: 12px;
                        padding-bottom: 10px;
                        border-bottom: 1px solid rgba(255,255,255,0.1);
                    }
                    .measurement-points > div {
                        margin: 5px 0;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    }
                    .point-badge {
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        width: 20px;
                        height: 20px;
                        border-radius: -50%;
                        font-size: 11px;
                        font-weight: bold;
                        color: white;
                    }
                    .point-badge.point-1 { background: #4caf50; }
                    .point-badge.point-2 { background: #ffc107; color: #332; }
                    .measurement-result {
                        background: rgba(79, 195, 247, 0.08);
                        border-radius: 8px;
                        padding: 8px 10px;
                        margin-bottom: 10px;
                    }
                    .result-line {
                        margin: 4px 0;
                        color: rgba(255,255,255,0.8);
                    }
                    .measurement-hint {
                        font-size: 10px;
                        color: rgba(255,255,255,0.4);
                        text-align: center;
                        margin-top: 8px;
                    }
                `;
                document.head.appendChild(style);
            }
            
            document.getElementById('measurePoint1').textContent = `${p1.lat.toFixed(4)}°, ${p1.lon.toFixed(4)}°`;
            document.getElementById('measurePoint2').textContent = `${p2.lat.toFixed(4)}°, ${p2.lon.toFixed(4)}°`;

            let distText;
            if (distanceKm < 1) {
                distText = `${(distanceKm * 1000).toFixed(0)} m`;
            } else if (distanceKm < 100) {
                distText = `${distanceKm.toFixed(2)} km`;
            } else {
                distText = `${distanceKm.toFixed(1)} km`;
            }
            document.getElementById('measureDistance').textContent = distText;

            let greatText
            if (greatCircleDistance < 1) {
                greatText = `${(greatCircleDistance * 1000).toFixed(0)} m`;
            } else if (greatCircleDistance < 100) {
                greatText = `${greatCircleDistance.toFixed(2)} km`;
            } else {
                greatText = `${greatCircleDistance.toFixed(1)} km`;
            }
            document.getElementById('measureGreatCircle').textContent = greatText;

            panel.style.display = 'block';
        }

        // ISS System

        async function toggleISS() {
            if (currentPlanet !== 'earth') {
                alert('ISS tracking is only available on Earth');
                return;
            }

            issTrackingActive = !issTrackingActive;
            const btn = document.getElementById('btnISS');

            if (issTrackingActive) {
                btn.classList.add('active');
                btn.innerHTML = '<i data-lucide="satellite"></i> ISS: ON';
                await startISSTracking();
            } else {
                btn.classList.remove('active');
                btn.innerHTML = '<i data-lucide="satellite"></i> Track ISS';
                stopISSTracking();
            }
            
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }

        async function startISSTracking() {
            showMeasureTooltip('🛰️ Connecting to ISS...', 1500);

            // Take initial position
            await updateISSPosition();

            // Update every 2 seconds
            issTrackingInterval = setInterval(updateISSPosition, 5000);

            // Draw orbit
            drawISSOrbit();
        }

        function stopISSTracking() {
            if (issTrackingInterval) {
                clearInterval(issTrackingInterval);
                issTrackingInterval = null;
            }

            if (issEntity && viewer && !viewer.isDestroyed()) {
                viewer.entities.remove(issEntity);
                issEntity = null;
            }

            if (issPathEntity && viewer && !viewer.isDestroyed()) {
                viewer.entities.remove(issPathEntity);
                issPathEntity = null;
            }

            if (issMarkerEntity && viewer && !viewer.isDestroyed()) {
                viewer.entities.remove(issMarkerEntity);
                issMarkerEntity = null;
            }

            if (issGlowEntity && viewer && !viewer.isDestroyed()) {
                viewer.entities.remove(issGlowEntity);
                issGlowEntity = null;
            }

            if (issModel && viewer && !viewer.isDestroyed()) {
                viewer.entities.remove(issModel);
                issModel = null;
            }

            issPositionHistory = [];

            // Return with normal view if it was in ISS camera mode
            if (issCameraViewActive) {
                exitISSView();
            }
        }

        async function updateISSPosition() {
            if (!viewer || viewer.isDestroyed()) return;

            try {
                // API for position of ISS in real-time
                const response = await fetch('https://api.wheretheiss.at/v1/satellites/25544');
                const data = await response.json();
                const lat = data.latitude;
                const lon = data.longitude;
                const alt = data.altitude; // km

                console.log(`ISS Position: ${lat.toFixed(2)}°, ${lon.toFixed(2)}°, Alt: ${alt.toFixed(0)} km`);

                // Create position Cesium
                const position = Cesium.Cartesian3.fromDegrees(lon, lat, alt * 1000);

                if (!issEntity) {
                    issEntity = viewer.entities.add({
                        name: 'International Space Station',
                        position: position,
                        point: {
                            pixelSize: 8,
                            color: Cesium.Color.YELLOW,
                            outlineColor: Cesium.Color.WHITE,
                            outlineWidth: 2,
                            scaleByDistance: new Cesium.NearFarScalar(1e3, 1.0, 1e8, 0.1),
                        },
                        label: {
                            text: '🛰️ ISS',
                            font: 'bold 12px sans-serif',
                            fillColor: Cesium.Color.YELLOW,
                            outlineColor: Cesium.Color.BLACK,
                            outlineWidth: 2,
                            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                            pixelOffset: new Cesium.Cartesian2(0, -15),
                            scaleByDistance: new Cesium.NearFarScalar(1e3, 1.0, 1e7, 0.2),
                        }
                    });

                    issGlowEntity = viewer.entities.add({
                        name: 'ISS Glow',
                        position: position,
                        ellipse: {
                            semiMinorAxis: 50000,
                            semiMajorAxis: 50000,
                            material: Cesium.Color.YELLOW.withAlpha(0.15),
                            outline: true,
                            outlineColor: Cesium.Color.YELLOW.withAlpha(0.5),
                            outlineWidth: 2,
                            height: alt * 1000,
                            scaleByDistance: new Cesium.NearFarScalar(1e3, 1.0, 5e6, 0.0),
                        }
                    });

                    issMarkerEntity = viewer.entities.add({
                        name: 'ISS Marker',
                        position: position,
                        billboard: {
                            image: createTargetTexture(),
                            width: 48,
                            height: 48,
                            scaleByDistance: new Cesium.NearFarScalar(1e3, 1.0, 5e6, 0.15),
                            eyeOffset: new Cesium.Cartesian3(0, 0, -1000),
                        }
                    });

                } else {
                    issEntity.position = position;
                    if (issGlowEntity) issGlowEntity.position = position;
                    if (issMarkerEntity) issMarkerEntity.position = position;
                }

                issPositionHistory.push({ lat, lon, alt, time: Date.now() });
                if (issPositionHistory.length > 100) issPositionHistory.shift();

                updateISSOrbit();

                if (issCameraViewActive) {
                    updateISSView();
                }

                updateISSInfoPanel(lat, lon, alt, data.velocity);

            } catch (error) {
                console.error('Error fetching ISS position:', error);
                // Fallback: use simulated orbit
                updateISSOrbitSimulated();
            }
        }

        function drawISSOrbit() {
            const orbitPoints = [];
            const segments = 200;

            for (let i = 0; i <= segments; i++) {
                const angle = (i / segments) * Math.PI * 2;
                const lat = Math.sin(angle) * 51.6;
                const lon = angle * 180 / Math.PI;
                const alt = 408000; // 408 km

                orbitPoints.push(Cesium.Cartesian3.fromDegrees(lon, lat, alt));
            }

            issPathEntity = viewer.entities.add({
                name: 'ISS Orbit Path',
                polyline: {
                    positions: orbitPoints,
                    width: 1,
                    material: Cesium.Color.YELLOW.withAlpha(0.3),
                    arcType: Cesium.ArcType.NONE,
                }
            });
        }

        function updateISSOrbit() {
            if (issPositionHistory.length < 2) return;
            
            const positions = issPositionHistory.map(p =>
                Cesium.Cartesian3.fromDegrees(p.lon, p.lat, p.alt * 1000)
            );

            if (issPathEntity && viewer && !viewer.isDestroyed()) {
                viewer.entities.remove(issPathEntity);
            }

            issPathEntity = viewer.entities.add({
                name: 'ISS Orbit Path',
                polyline: {
                    positions: positions,
                    width: 2,
                    material: new Cesium.PolylineGlowMaterialProperty({
                        glowPower: 0.2,
                        color: Cesium.Color.YELLOW.withAlpha(0.7)
                    }),
                    arcType: Cesium.ArcType.GEODESIC,
                }
            });
        }



        // Solar System View

        async function openSolarSystem() {
            if (solarSystemActive) return;
            if (window._switchingPlanet) return;

            solarSystemActive = true;

            // Transition
            showPlanetTransition({
                emoji: '☀️',
                name: 'Solar System',
                distance: 'Overview'
            });

            await sleep(2000);

            stopAutoRotate();

            if (cloudsEnabled) {
                removeCloudsLayer();
                cloudsEnabled = false;
                const btnClouds = document.getElementById('btnClouds');
                if (btnClouds) btnClouds.classList.remove('active');
            }

            if (auroraEnabled) {
                removeAurora();
                auroraEnabled = false;
                const btnAurora = document.getElementById('btnAurora');
                if (btnAurora) btnAurora.classList.remove('active');
            }

            destroyThreeJS();
            if (viewer && !viewer.isDestroyed()) {
                viewer.destroy();
                viewer = null;
            }

            document.getElementById('cesiumContainer').style.display = 'none';
            document.getElementById('threejsContainer').style.display = 'block';

            await createSolarSystemScene();

            document.getElementById('controlPanel').classList.add('collapsed');
            document.getElementById('togglePanelBtn').style.display = 'none';
            document.getElementById('solarSystemBack').classList.add('visible');

            document.getElementById('locationName').textContent = 'Solar System';
            document.getElementById('latValue').textContent = '-';
            document.getElementById('lonValue').textContent = '-';
            document.getElementById('altValue').textContent = '-';

            hidePlanetTransition();

            document.getElementById('ssToolbar').classList.add('visible');

            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }

        async function closeSolarSystem() {
            if (!solarSystemActive) return;

            solarSystemActive = false;

            document.getElementById('solarSystemBack').classList.remove('visible');
            document.getElementById('solarSystemTooltip').classList.remove('visible');

            document.getElementById('togglePanelBtn').style.display = 'flex';
            document.getElementById('controlPanel').classList.remove('collapsed');

            currentPlanet = '__solar_system__';

            document.getElementById('ssToolbar').classList.remove('visible');
            closeSSInfoPanel();

            await switchPlanet('earth');
        }

        function goToPlanetFromSolarSystem(planetId) {
            if (!solarSystemActive) return;
            
            solarSystemActive = false;

            document.getElementById('solarSystemBack').classList.remove('visible');
            document.getElementById('solarSystemTooltip').classList.remove('visible');

            document.getElementById('togglePanelBtn').style.display = 'flex';
            document.getElementById('controlPanel').classList.remove('collapsed');

            document.getElementById('ssToolbar').classList.remove('visible');
            closeSSInfoPanel();

            currentPlanet = '__solar_system__';
            switchPlanet(planetId);
        }

        async function createSolarSystemScene() {
            const container = document.getElementById('threejsContainer');
            container.style.display = 'block';
            container.innerHTML = '';

            threeRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
            threeRenderer.setSize(window.innerWidth, window.innerHeight);
            threeRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            threeRenderer.setClearColor(0x000000);
            container.appendChild(threeRenderer.domElement);

            threeScene = new THREE.Scene();

            // Camera
            threeCamera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 100000);
            threeCamera.position.set(0, 800, 500);
            threeCamera.lookAt(0, 0, 0);

            // Controls
            threeControls = new THREE.OrbitControls(threeCamera, threeRenderer.domElement);
            threeControls.enableDamping = true;
            threeControls.dampingFactor = 0.05;
            threeControls.minDistance = 200;
            threeControls.maxDistance = 3000;
            threeControls.maxPolarAngle = Math.PI * 0.85;
            threeControls.rotateSpeed = 0.5;

            // Stars
            createStarField(5000);

            await buildSolarSystemObjects();

            setupSolarSystemInteraction();

            isThreeJSActive = true;

            // Render loop
            const clock = new THREE.Clock();
            function animate() {
                if (!isThreeJSActive || !solarSystemActive) return;
                solarSystemAnimId = requestAnimationFrame(animate);
                const elapsed = clock.getElapsedTime();
                updateSolarSystemOrbits(elapsed);
                threeControls.update();
                threeRenderer.render(threeScene, threeCamera);
            }
            animate();

            // Resize
            window._threeResizeHandler = function () {
                if (!isThreeJSActive) return;
                threeCamera.aspect = window.innerWidth / window.innerHeight;
                threeCamera.updateProjectionMatrix();
                threeRenderer.setSize(window.innerWidth, window.innerHeight);
            };
            window.addEventListener('resize', window._threeResizeHandler);
        }

        async function buildSolarSystemObjects() {
            solarSystemObjects = {};

            // Sun
            const sunGroup = new THREE.Group();
            sunGroup.name = 'sun';

            // Core
            const sunCoreGeo = new THREE.SphereGeometry(25, 64, 64);
            const sunCoreMat = new THREE.MeshStandardMaterial({
                color: 0xffaa66,
                emissive: 0xff4422,
                emissiveIntensity: 0.8,
                metalness: 0.1,
                roughness: 0.5
            });
            const sunCore = new THREE.Mesh(sunCoreGeo, sunCoreMat);
            sunGroup.add(sunCore);

            // Glow 1
            const sunGlow1Geo = new THREE.SphereGeometry(30, 32, 32);
            const sunGlow1Mat = new THREE.MeshBasicMaterial({
                color: 0xfff0c0,
                transparent: true,
                opacity: 0.7,
            });
            sunGroup.add(new THREE.Mesh(sunGlow1Geo, sunGlow1Mat));

            // Glow 2
            const sunGlow2Geo = new THREE.SphereGeometry(38, 32, 32);
            const sunGlow2Mat = new THREE.MeshBasicMaterial({
                color: 0xffcc33,
                transparent: true,
                opacity: 0.35,
                side: THREE.BackSide,
            });
            sunGroup.add(new THREE.Mesh(sunGlow2Geo, sunGlow2Mat));

            // Glow 3
            const sunGlow3Geo = new THREE.SphereGeometry(50, 32, 32);
            const sunGlow3Mat = new THREE.MeshBasicMaterial({
                color: 0xff8800,
                transparent: true,
                opacity: 0.15,
                side: THREE.BackSide,
            });
            sunGroup.add(new THREE.Mesh(sunGlow3Geo, sunGlow3Mat));

            // Point light of Sun
            const sunLight = new THREE.PointLight(0xffeedd, 2.5, 3000);
            sunLight.position.set(0, 0, 0);
            sunGroup.add(sunLight);

            // Ambient light
            const ambientLight = new THREE.AmbientLight(0x222222, 0.4);
            threeScene.add(ambientLight);

            // Directional light for shadows
            const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
            dirLight.position.set(100, 100, 50);
            threeScene.add(dirLight);

            threeScene.add(sunGroup);
            solarSystemObjects.sun = { group: sunGroup, core: sunCore };

            // Planets
            const planetData = [
                { id: 'mercury', name: 'Mercury', color: 0x8c7e6d, size: 2.0, orbit: 60, speed: 4.15, rotationSpeed: 0.008, emoji: '⚪', textureUrl: 'textures/planets/mercury.jpg' },
                { id: 'venus', name: 'Venus', color: 0xe8a84c, size: 3.5, orbit: 90, speed: 4.15, rotationSpeed: 0.004, emoji: '🟠', textureUrl: 'textures/planets/venus.jpg' },
                { id: 'earth', name: 'Earth', color: 0x4fc3f7, size: 3.8, orbit: 120, speed: 1.0, rotationSpeed: 0.01, emoji: '🌍', textureUrl: 'textures/planets/earth.jpg' },
                { id: 'mars', name: 'Mars', color: 0xc1440e, size: 2.5, orbit: 160, speed: 0.53, rotationSpeed: 0.009, emoji: '🔴', textureUrl: 'textures/planets/mars.jpg' },
                { id: 'jupiter', name: 'Jupiter', color: 0xc88b3a, size: 10, orbit: 250, speed: 0.084, rotationSpeed: 0.02, emoji: '🟠', textureUrl: 'textures/planets/jupiter.jpg' },
                { id: 'saturn', name: 'Saturn', color: 0xe8d5a3, size: 8.5, orbit: 340, speed: 0.034, rotationSpeed: 0.018, emoji: '🪐', textureUrl: 'textures/planets/saturn.jpg' },
                { id: 'uranus', name: 'Uranus', color: 0x4fc1e9, size: 5.5, orbit: 440, speed: 0.012, rotationSpeed: 0.015, emoji: '🔵', textureUrl: 'textures/planets/uranus.jpg' },
                { id: 'neptune', name: 'Neptune', color: 0x3498db, size: 5.2, orbit: 530, speed: 0.006, rotationSpeed: 0.014, emoji: '🔵', textureUrl: 'textures/planets/neptune.jpg' },
                { id: 'pluto', name: 'Pluto', color: 0x8e735b, size: 1.5, orbit: 600, speed: 0.004, rotationSpeed: 0.006, emoji: '⚪', textureUrl: 'textures/planets/pluto.jpg' },
            ];

            const textureLoader = new THREE.TextureLoader();
            const textures = {};

            const texturePromises = planetData.map(p => {
                return new Promise((resolve) => {
                    if (p.textureUrl) {
                        textureLoader.load(p.textureUrl,
                            (texture) => {
                                textures[p.id] = texture;
                                console.log(`Loaded texture for ${p.name}`);
                                resolve();
                            },
                            undefined,
                            (err) => {
                                console.warn(`Could not load texture for ${p.name}`, err);
                                textures[p.id] = null;
                                resolve();
                            }
                        );
                    } else {
                        textures[p.id] = null;
                        resolve();
                    }
                });
            });

            await Promise.all(texturePromises);
            console.log('All textures loaded, creating planets...');

            planetData.forEach(p => {
                // Orbit
                const orbitGeo = new THREE.RingGeometry(p.orbit - 0.5, p.orbit + 0.5, 128);
                const orbitMat = new THREE.MeshBasicMaterial({
                    color: 0xffffff,
                    transparent: true,
                    opacity: 0.15,
                    side: THREE.DoubleSide,
                });
                const orbitMesh = new THREE.Mesh(orbitGeo, orbitMat);
                orbitMesh.rotation.x = -Math.PI / 2;
                threeScene.add(orbitMesh);

                // Planet Group
                const planetOrbitGroup = new THREE.Group();
                const startAngle = Math.random() * Math.PI * 2;
                planetOrbitGroup.userData = {
                    orbitRadius: p.orbit,
                    speed: p.speed,
                    startAngle: startAngle,
                    currentAngle: startAngle,
                    planetId: p.id,
                    rotationSpeed: p.rotationSpeed,
                    currentRotation: 0
                };

                let planetMaterial;
                if (textures[p.id]) {
                    console.log(`Using texture for ${p.name}`);
                    planetMaterial = new THREE.MeshStandardMaterial({
                        map: textures[p.id],
                        roughness: 0.6,
                        metalness: 0.1,
                    });
                } else {
                    console.log(`Using procedural fallback for ${p.name}`);
                    // Procedural texture fallback
                    const proceduralCanvas = createProceduralPlanetTexture(p.name, p.color);
                    const proceduralTexture = new THREE.CanvasTexture(proceduralCanvas);

                    planetMaterial = new THREE.MeshStandardMaterial({
                        map: proceduralTexture,
                        color: p.color,
                        roughness: 0.7,
                        metalness: 0.1,
                    });
                }

                const planetMesh = new THREE.Mesh(new THREE.SphereGeometry(p.size, 64, 64), planetMaterial);
                planetMesh.position.set(p.orbit, 0, 0);
                planetMesh.castShadow = true;
                planetMesh.userData = { planetId: p.id };

                // Atmosphere glow
                const atmosphereGeo = new THREE.SphereGeometry(p.size * 1.02, 32, 32);
                const atmosphereMat = new THREE.MeshPhongMaterial({
                    color: p.color,
                    transparent: true,
                    opacity: 0.08,
                    side: THREE.BackSide,
                });
                const atmosphere = new THREE.Mesh(atmosphereGeo, atmosphereMat);
                planetOrbitGroup.add(atmosphere);

                planetOrbitGroup.add(planetMesh);

                // Label
                const label = createSolarSystemLabel(p.name, p.emoji);
                label.position.set(p.orbit, p.size + 5, 0);
                planetOrbitGroup.add(label);

                // Saturn rings
                if (p.id === 'saturn') {
                    const ringTexture = createSaturnRingTextureForThree();

                    const ringGeo = new THREE.RingGeometry(p.size * 1.2, p.size * 2.1, 128);
                    const ringMat = new THREE.MeshStandardMaterial({
                        map: ringTexture,
                        transparent: true,
                        opacity: 0.65,
                        side: THREE.DoubleSide,
                        emissive: 0x332200,
                        emissiveIntensity: 0.1
                    });
                    const ring = new THREE.Mesh(ringGeo, ringMat);
                    ring.rotation.x = Math.PI / 2.2;
                    ring.position.copy(planetMesh.position);
                    planetOrbitGroup.add(ring);

                    const ringOuterGeo = new THREE.RingGeometry(p.size * 2.0, p.size * 2.4, 128);
                    const ringOuterMat = new THREE.MeshStandardMaterial({
                        map: ringTexture,
                        transparent: true,
                        opacity: 0.25,
                        side: THREE.DoubleSide,
                    });
                    const ringOuter = new THREE.Mesh(ringOuterGeo, ringOuterMat);
                    ringOuter.rotation.x = Math.PI / 2.2;
                    ringOuter.position.copy(planetMesh.position);
                    planetOrbitGroup.add(ringOuter);
                }

                // Uranus rings
                if (p.id === 'uranus') {
                    const ringTexture = createUranusRingTextureForThree();

                    const ringGeo = new THREE.RingGeometry(p.size * 1.15, p.size * 1.9, 128);
                    const ringMat = new THREE.MeshStandardMaterial({
                        map: ringTexture,
                        transparent: true,
                        opacity: 0.35,
                        side: THREE.DoubleSide,
                        color: 0x88aaff,
                    });
                    const ring = new THREE.Mesh(ringGeo, ringMat);
                    ring.rotation.x = Math.PI / 2;
                    ring.rotation.z = 0.3;
                    ring.position.copy(planetMesh.position);
                    planetOrbitGroup.add(ring);
                }

                // Earth's Moon
                if (p.id === 'earth') {
                    const moonTexture = textureLoader.load('textures/planets/moon.jpg');
                    const moonMat = new THREE.MeshStandardMaterial({
                        map: moonTexture,
                        color: 0xaaaaaa,
                        roughness: 0.8,
                    });
                    const moonMesh = new THREE.Mesh(new THREE.SphereGeometry(1.2, 32, 32), moonMat);
                    moonMesh.position.set(p.orbit + 10, 0, 0);
                    planetOrbitGroup.add(moonMesh);
                    planetOrbitGroup.userData.moonMesh = moonMesh;
                    planetOrbitGroup.userData.moonOrbitRadius = 10;
                    planetOrbitGroup.userData.moonAngle = 0;
                }

                threeScene.add(planetOrbitGroup);

                solarSystemObjects[p.id] = {
                    group: planetOrbitGroup,
                    mesh: planetMesh,
                    orbit: orbitMesh,
                    data: p,
                };
            });

            console.log('Solar system creation complete.');
        }

        function createSolarSystemLabel(name, emoji) {
            const labelCanvas = document.createElement('canvas');
            labelCanvas.width = 256;
            labelCanvas.height = 64;
            const ctx = labelCanvas.getContext('2d');

            ctx.clearRect(0, 0, 256, 64);

            // Semitransparent Bg
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.beginPath();
            ctx.roundRect(20, 8, 216, 48, 8);
            ctx.fill();

            // Border
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.roundRect(20, 8, 216, 48, 8);
            ctx.stroke();

            // Text
            ctx.font = 'bold 22px Arial, sans-serif';
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${emoji} ${name}`, 128, 34);

            const texture = new THREE.CanvasTexture(labelCanvas);
            texture.minFilter = THREE.LinearFilter;

            const spriteMat = new THREE.SpriteMaterial({
                map: texture,
                transparent: true,
                depthTest: false,
                depthWrite: false,
            });

            const sprite = new THREE.Sprite(spriteMat);
            sprite.scale.set(30, 8, 1);

            return sprite;
        }

        function updateSolarSystemOrbits(elapsed) {
            if (solarPaused) return;

            // Pulse of the Sun
            if (solarSystemObjects.sun) {
                const sunPulse = 1.0 + Math.sin(elapsed * 0.8) * 0.03;
                solarSystemObjects.sun.core.scale.setScalar(sunPulse);
            }

            const deltaTime = 0.016; // 60fps
            const effectiveSpeed = solarSpeed;

            // Orbits of Planets
            Object.keys(solarSystemObjects).forEach(key => {
                if (key === 'sun') return;

                const obj = solarSystemObjects[key];
                if (!obj || !obj.group || !obj.group.userData) return;

                const ud = obj.group.userData;

                if (ud.currentAngle === undefined) ud.currentAngle = ud.startAngle || 0;

                ud.currentAngle += ud.speed * 0.5 * effectiveSpeed * deltaTime;
                obj.group.rotation.y = ud.currentAngle;

                if (obj.mesh) {
                    if (ud.currentRotation === undefined) ud.currentRotation = 0;
                    ud.currentRotation += (ud.rotationSpeed || 0.01) * effectiveSpeed;
                    obj.mesh.rotation.y = ud.currentRotation;
                }

                // Moon of the Earth
                if (ud.moonMesh && ud.moonOrbitRadius) {
                    if (ud.moonAngle === undefined) ud.moonAngle = 0;
                    ud.moonAngle += 2 * effectiveSpeed * deltaTime;
                    ud.moonMesh.position.set(
                        ud.orbitRadius + Math.cos(ud.moonAngle) * ud.moonOrbitRadius,
                        0,
                        Math.sin(ud.moonAngle) * ud.moonOrbitRadius
                    );
                    // Moon rotation
                    ud.moonMesh.rotation.y += 0.02 * effectiveSpeed;
                }
            });
        }

        function setupSolarSystemInteraction() {
            const raycaster = new THREE.Raycaster();
            const mouse = new THREE.Vector2();
            let hoveredPlanet = null;

            const tooltip = document.getElementById('solarSystemTooltip');

            threeRenderer.domElement.addEventListener('mousemove', function (event) {
                mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
                mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

                raycaster.setFromCamera(mouse, threeCamera);

                const planetMeshes = [];
                Object.keys(solarSystemObjects).forEach(key => {
                    if (key === 'sun') return;
                    const obj = solarSystemObjects[key];
                    if (obj && obj.mesh) {
                        const worldPos = new THREE.Vector3();
                        obj.mesh.getWorldPosition(worldPos);

                        planetMeshes.push({
                            id: key,
                            mesh: obj.mesh,
                            worldPos: worldPos,
                            data: obj.data,
                        });
                    }
                });

                let closest = null;
                let closestDist = Infinity;

                planetMeshes.forEach(pm => {
                    const dist = raycaster.ray.distanceToPoint(pm.worldPos);
                    const threshold = pm.data.size * 2.5;

                    if (dist < threshold && dist < closestDist) {
                        closest = pm;
                        closestDist = dist;
                    }
                });

                if (closest) {
                    hoveredPlanet = closest.id;
                    threeRenderer.domElement.style.cursor = 'pointer';

                    const planetInfo = PLANETS[closest.id];
                    if (planetInfo && tooltip) {
                        document.getElementById('ssTooltipName').textContent = `${planetInfo.emoji} ${planetInfo.name}`;
                        document.getElementById('ssTooltipDiameter').textContent = `Diameter: ${planetInfo.diameter}`;
                        document.getElementById('ssTooltipDistance').textContent = `Distance: ${planetInfo.distance}`;

                        tooltip.style.left = (event.clientX + 15) + 'px';
                        tooltip.style.top = (event.clientY - 10) + 'px';
                        tooltip.classList.add('visible');
                    }

                    if (closest.mesh) {
                        closest.mesh.material.emissiveIntensity = 0.4;
                    }

                    planetMeshes.forEach(pm => {
                        if (pm.id !== closest.id && pm.mesh) {
                            pm.mesh.material.emissiveIntensity = 0.1;
                        }
                    });
                    
                } else {
                    hoveredPlanet = null;
                    threeRenderer.domElement.style.cursor = 'default';

                    if (tooltip) {
                        tooltip.classList.remove('visible');
                    }

                    // Reset all
                    planetMeshes.forEach(pm => {
                        if (pm.mesh) {
                            pm.mesh.material.emissiveIntensity = 0.1;
                        }
                    });
                }
            });

            threeRenderer.domElement.addEventListener('click', function () {
                if (hoveredPlanet) {
                    showSSInfoPanel(hoveredPlanet);
                }
            });
        }

        // Solar System Toolbar functions

        function setSolarSpeed(speed) {
            solarSpeed = speed;

            document.querySelectorAll('.ss-speed-btn').forEach(btn => btn.classList.remove('active'));
            const btnId = 'ssSpeed' + String(speed).replace('.', '');
            const btn = document.getElementById(btnId);
            if (btn) btn.classList.add('active');
        }

        function toggleSolarLabels() {
            solarLabelsVisible = !solarLabelsVisible;
            document.getElementById('ssToggleLabels').classList.toggle('active');

            Object.keys(solarSystemObjects).forEach(key => {
                if (key === 'sun') return;
                const obj = solarSystemObjects[key];
                if (obj && obj.group) {
                    obj.group.children.forEach(child => {
                        if (child.isSprite && child.material && child.material.map) {
                            child.visible = solarLabelsVisible;
                        }
                    });
                }
            });
        }

        function toggleSolarOrbits() {
            solarOrbitsVisible = !solarOrbitsVisible;
            document.getElementById('ssToggleOrbits').classList.toggle('active');

            Object.keys(solarSystemObjects).forEach(key => {
                if (key === 'sun') return;
                const obj = solarSystemObjects[key];
                if (obj && obj.orbit) {
                    obj.orbit.visible = solarOrbitsVisible;
                }
            });
        }

        function toggleSolarPause() {
            solarPaused = !solarPaused;
            document.getElementById('ssTogglePause').classList.toggle('active');
        }

        function showSSInfoPanel(planetId) {
            const planet = PLANETS[planetId];
            const data = SOLAR_SYSTEM_DATA[planetId];
            if (!planet || !data) {
                console.error('Planet data missing:', planetId);
                return;
            }

            selectedSSPlanet = planetId;

            // Image
            const imgEl = document.getElementById('ssInfoImage');
            if (imgEl) {
                imgEl.src = data.image;
                imgEl.alt = planet.name;
            }

            // Name / Subtitle
            const nameEl = document.getElementById('ssInfoName');
            if (nameEl) nameEl.textContent = `${planet.emoji || ''} ${planet.name}`;
            
            
            const subtitleEl = document.getElementById('ssInfoSubtitle');
            if (subtitleEl) subtitleEl.textContent = data.subtitle;

            // Stats
            const statsHtml = `
                <div class="ss-info-stat">
                    <div class="ss-info-stat-label">Diameter</div>
                    <div class="ss-info-stat-value">${planet.diameter}</div>
                </div>
                <div class="ss-info-stat">
                    <div class="ss-info-stat-label">Gravity</div>
                    <div class="ss-info-stat-value">${planet.gravity}</div>
                </div>
                <div class="ss-info-stat">
                    <div class="ss-info-stat-label">Temperature</div>
                    <div class="ss-info-stat-value">${planet.temperature}</div>
                </div>
                <div class="ss-info-stat">
                    <div class="ss-info-stat-label">Moons</div>
                    <div class="ss-info-stat-value">${planet.moons}</div>
                </div>
                <div class="ss-info-stat">
                    <div class="ss-info-stat-label">Day Length</div>
                    <div class="ss-info-stat-value">${planet.dayLength}</div>
                </div>
                <div class="ss-info-stat">
                    <div class="ss-info-stat-label">Year Length</div>
                    <div class="ss-info-stat-value">${planet.yearLength}</div>
                </div>
                <div class="ss-info-stat">
                    <div class="ss-info-stat-label">Distance</div>
                    <div class="ss-info-stat-value">${planet.distance}</div>
                </div>
                <div class="ss-info-stat">
                    <div class="ss-info-stat-label">Atmosphere</div>
                    <div class="ss-info-stat-value">${planet.atmosphere}</div>
                </div>
            `;
            const statsEl = document.getElementById('ssInfoStats');
            if (statsEl) statsEl.innerHTML = statsHtml;

            // About
            const aboutEl = document.getElementById('ssInfoAbout');
            if (aboutEl) aboutEl.textContent = data.about || 'No information available.';

            // Curiosities
            const curiositiesHtml = data.curiosities.map(c => `<li>${c}</li>`).join('');
            document.getElementById('ssInfoCuriosities').innerHTML = curiositiesHtml;

            // Missions
            const missionsHtml = data.missions.map(m => `<li>${m}</li>`).join('');
            document.getElementById('ssInfoMissions').innerHTML = missionsHtml;

            // View Panel
            document.getElementById('ssInfoPanel').classList.add('visible');

            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }

        function closeSSInfoPanel() {
            document.getElementById('ssInfoPanel').classList.remove('visible');
            selectedSSPlanet = null;
        }

        function visitPlanetFromInfo() {
            if (!selectedSSPlanet) return;

            const planetId = selectedSSPlanet;
            closeSSInfoPanel();
            goToPlanetFromSolarSystem(planetId);
        }

        // Weather System

        function toggleWeatherCursor() {
            if (currentPlanet !== 'earth') {
                alert('Weather is only available on Earth');
                return;
            }

            weatherCursorMode = !weatherCursorMode;
            document.getElementById('btnWeatherCursor').classList.toggle('active');

            if (weatherCursorMode) {
                enableWeatherClickMode();
            } else {
                disableWeatherClickMode();
            }
        }

        function enableWeatherClickMode() {
            if (!viewer || viewer.isDestroyed()) return;

            weatherClickHandler = new Cesium.ScreenSpaceEventHandler(viewer.canvas);

            weatherClickHandler.setInputAction(function (click) {
                if (!weatherCursorMode) return;

                const cartesian = viewer.camera.pickEllipsoid(
                    click.position,
                    viewer.scene.globe.ellipsoid
                );

                if (cartesian) {
                    const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
                    const lat = Cesium.Math.toDegrees(cartographic.latitude);
                    const lon = Cesium.Math.toDegrees(cartographic.longitude);

                    fetchWeatherByCoords(lat, lon);
                }
            }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
        }

        function disableWeatherClickMode() {
            if (weatherClickHandler) {
                weatherClickHandler.destroy();
                weatherClickHandler = null;
            }
        }

        async function handleWeatherSearch(event) {
            if (event.key !== 'Enter') return;
            if (currentPlanet !== 'earth') {
                alert('Weather is only available on Earth');
                return;
            }

            const query = document.getElementById('weatherSearchInput').value.trim();
            if (!query) return;

            await fetchWeatherByCity(query);
        }

        async function fetchWeatherByCity(city) {
            const apiKey = getWeatherApiKey();
            if (!apiKey) {
                alert('Weather API key is required. Click the weather button again to enter it.');
                return;
            }

            showWeatherLoading();

            try {
                const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${apiKey}`;
                const response = await fetch(url);

                if (response.status === 401) {
                    localStorage.removeItem('weatherApiKey');
                    WEATHER_API_KEY = '';
                    alert('Invalid API key. Please try again with a valid key.');
                    hideWeatherLoading();
                    return;
                }

                if(!response.ok) {
                    throw new Error('City not found');
                }

                const data = await response.json();
                displayWeather(data);

                flyTo(data.coord.lat, data.coord.lon, 500000, data.name);

                fetchForecast(data.coord.lat, data.coord.lon);

            } catch (error) {
                console.error('Weather error:', error);
                hideWeatherLoading();
                alert('City not found. Try another name.');
            }
        }

        async function fetchWeatherByCoords(lat, lon) {
            const apiKey = getWeatherApiKey();
            if (!apiKey) return;

            showWeatherLoading();

            try {
                const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;
                const response = await fetch(url);

                if (response.status === 401) {
                    localStorage.removeItem('weatherApiKey');
                    WEATHER_API_KEY = '';
                    alert('Invalid API key. Please try again.');
                    hideWeatherLoading();
                    return;
                }

                if (!response.ok) {
                    throw new Error('Weather data not available');
                }

                const data = await response.json();
                displayWeather(data);

                fetchForecast(lat, lon);
                
            } catch (error) {
                console.error('Weather error:', error);
                hideWeatherLoading();
            }
        }

        async function fetchForecast(lat, lon) {
            const apiKey = getWeatherApiKey();
            if (!apiKey) return;

            try {
                const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;
                const response = await fetch(url);

                if (!response.ok) return;

                const data = await response.json();
                displayForecast(data);

            } catch (error) {
                console.error('Forecast error:', error);
            }
        }

        function displayWeather(data) {
            const card = document.getElementById('weatherCard');
            card.style.display = 'block';

            // City and country
            const country = data.sys.country || '';
            document.getElementById('weatherCity').textContent = `${data.name}, ${country}`;

            // Icon emoji
            const emoji = getWeatherEmoji(data.weather[0].id, data.weather[0].icon);
            document.getElementById('weatherIconEmoji').textContent = emoji;

            // Temp
            document.getElementById('weatherTemp').textContent = `${Math.round(data.main.temp)}°C`;

            // Desc
            document.getElementById('weatherDesc').textContent = data.weather[0].description;

            // Details
            document.getElementById('weatherFeelsLike').textContent = `${Math.round(data.main.feels_like)}°C`;
            document.getElementById('weatherHumidity').textContent = `${data.main.humidity}%`;
            document.getElementById('weatherWind').textContent = `${(data.wind.speed * 3.6).toFixed(1)} km/h`;
            document.getElementById('weatherPressure').textContent = `${data.main.pressure} hPa`;

            const visibilityKm = data.visibility ? (data.visibility / 1000).toFixed(1) : '-';
            document.getElementById('weatherVisibility').textContent = `${visibilityKm} km`;

            document.getElementById('weatherCloudsPercent').textContent = `${data.clouds.all}%`;

            // Sunrise / Sunset
            const sunrise = new Date(data.sys.sunrise * 1000);
            const sunset = new Date(data.sys.sunset * 1000);
            document.getElementById('weatherSunrise').textContent = formatTime(sunrise);
            document.getElementById('weatherSunset').textContent = formatTime(sunset);

            // Lucide
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }
        
        function displayForecast(data) {
            const forecastDiv = document.getElementById('weatherForecast');
            const grid = document.getElementById('forecastGrid');

            forecastDiv.style.display = 'block';
            grid.innerHTML = '';

            const dailyData = [];
            const seenDays = new Set();

            data.list.forEach(item => {
                const date = new Date(item.dt * 1000);
                const dayKey = date.toLocaleDateString('en', { weekday: 'short' });

                const hour = date.getHours();
                if (!seenDays.has(dayKey) && hour >= 11 && hour <= 14) {
                    seenDays.add(dayKey);
                    dailyData.push({
                        day: dayKey,
                        temp: Math.round(item.main.temp),
                        tempMin: Math.round(item.main.temp_min),
                        icon: item.weather[0].id,
                        iconCode: item.weather[0].icon,
                        desc: item.weather[0].description
                    });
                }
            });

            dailyData.slice(0, 5).forEach(day => {
                const emoji = getWeatherEmoji(day.icon, day.iconCode);

                const item = document.createElement('div');
                item.className = 'forecast-item';
                item.innerHTML = `
                    <div class="forecast-day">${day.day}</div>
                    <span class="forecast-icon">${emoji}</span>
                    <div class="forecast-temp">${day.temp}°</div>
                    <div class="forecast-temp-min">${day.tempMin}°</div>
                `;
                grid.appendChild(item);
            });
        }

        function getWeatherEmoji(weatherId, iconCode) {
            const isNight = iconCode && iconCode.includes('n');

            if (weatherId >= 200 && weatherId < 300) return '⛈️';
            if (weatherId >= 300 && weatherId < 400) return '🌧️';
            if (weatherId >= 500 && weatherId < 510) return '🌧️';
            if (weatherId === 511) return '🧊';
            if (weatherId >= 520 && weatherId < 600) return '🌧️';
            if (weatherId >= 600 && weatherId < 700) return '❄️';
            if (weatherId >= 700 && weatherId < 800) return '🌫️';
            if (weatherId === 800) return isNight ? '🌙' : '☀️';
            if (weatherId === 801) return isNight ? '🌙' : '⛅';
            if (weatherId === 802) return '⛅';
            if (weatherId >= 803) return '☁️';

            return '🌡️';
        }
        
        function formatTime(date) {
            return date.toLocaleTimeString('en', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });
        }

        function showWeatherLoading() {
            const card = document.getElementById('weatherCard');
            card.style.display = 'block';
            document.getElementById('weatherCity').textContent = 'Loading...';
            document.getElementById('weatherIconEmoji').textContent = '⏳';
            document.getElementById('weatherTemp').textContent = '-';
            document.getElementById('weatherDesc').textContent = 'Fetching weather data...';
        }

        function hideWeatherLoading() {
            // It doesn't clean the Card
        }

        function getWeatherApiKey() {
            if (WEATHER_API_KEY) return WEATHER_API_KEY;

            const key = prompt(
                '• Weather API Key Required\n\n' +
                'To use weather features, you need a free OpenWeatherMap API key.\n\n' +
                '1. Go to openweathermap.org/api\n' +
                '2. Sign up for free\n' +
                '3. Copy your API key\n' +
                '4. Paste it here:\n\n' +
                '(Your key will be saved locally in your browser)'
            );

            if (key && key.trim().length > 10) {
                WEATHER_API_KEY = key.trim();
                localStorage.setItem('weatherApiKey', WEATHER_API_KEY);
                return WEATHER_API_KEY;
            }

            return null;
        }

        function resetWeatherKey() {
            localStorage.removeItem('weatherApiKey');
            WEATHER_API_KEY = '';

            document.getElementById('weatherCard').style.display = 'none';
            document.getElementById('weatherForecast').style.display = 'none';

            alert('API key removed.');
        }

        // UI Help

        function togglePanel() {
            const panel = document.getElementById('controlPanel');
            const btn = document.getElementById('togglePanelBtn');
            panel.classList.toggle('collapsed');

            if (panel.classList.contains('collapsed')) {
                btn.style.left = '20px';
                btn.innerHTML = '<i data-lucide="panel-left-open" id="togglePanelIcon"></i>';
            } else {
                btn.style.left = '325px';
                btn.innerHTML = '<i data-lucide="panel-left-close" id="togglePanelIcon"></i>';
            }

            lucide.createIcons();
        }

        function toggleFullscreen() {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen();
            } else {
                document.exitFullscreen();
            }
        }

        // Initializing

        async function initGlobe() {
            try {
                await createEarthViewer();
                setTimeout(() => {
                    document.getElementById('loadingScreen').classList.add('hidden');
                }, 2500);
            } catch (error) {
                console.error('Error init', error);
                initFallbackGlobe();
            }
        }

        initGlobe();

        lucide.createIcons();
        
        const originalUpdatePlanetUI = updatePlanetUI;
        updatePlanetUI = function(planetId, planet) {
            originalUpdatePlanetUI(planetId, planet);
            setTimeout(() => lucide.createIcons(), 100);
        };

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT') return;
            switch (e.key) {
                case 'r': startAutoRotate(); break;
                case 'h': resetView(); break;
                case 'f': toggleFullscreen(); break;
                case 'g': toggleGrid(); break;
                case 'Escape': stopAutoRotate(); break;
            }
        });