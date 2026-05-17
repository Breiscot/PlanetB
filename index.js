        
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

        let viewer;
        let autoRotateEnabled = false;
        let nightMode = false;
        let gridEnabled = false;
        let gridLayer = null;
        let markers = [];
        let currentBaseLayer = 'satellite';
        let currentPlanet = 'earth';

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

                } else if (planetId === 'moon' || planet.isOuterWilds) {
                    document.getElementById('cesiumContainer').style.display = 'none';
                    document.getElementById('threejsContainer').style.display = 'block';

                    if (planetId === 'moon') {
                        await createMoonThreeJS();
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

            let textureDataUrl = null
            if (planet.textureUrl) {
                try {
                    const img = await loadImage(planet.textureUrl);
                    const canvas = document.createElement('canvas');
                    canvas.width = 1024;
                    canvas.height = 512;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, 1024, 512);
                    textureDataUrl = canvas.toDataURL('image/jpeg', 0.9);
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
            setupMouseTracking();
        }

        // Viewer Generic Planet
        
        async function createPlanetViewer(planetId, planet) {

            let textureDataUrl = null;

            if (planet.textureUrl) {
                try {
                    const img = await loadImage(planet.textureUrl);
                    const canvas = document.createElement('canvas');
                    canvas.width = 1024;
                    canvas.height = 512;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, 1024, 512);
                    textureDataUrl = canvas.toDataURL('image/jpeg', 0.9);
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

            const cameraDistance = DISPLAY_RADIUS * 3.5;

            // Camera
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

            setupPlanetMouseTracking(planetId, planet);
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
                            <p><strong>Coordinate:</strong> ${place.lat.toFixed(4)}°, ${place.lon.toFixed(4)}°</p>
                        </div>
                    `
                });
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
            if (name) document.getElementById('locationName').textContent = name;
        }

        function resetView() {
            stopAutoRotate();
            if (currentPlanet === 'earth') {
                viewer.camera.flyTo({
                    destination: Cesium.Cartesian3.fromDegrees(12.4964, 41.9028, 15000000),
                    orientation: { heading: 0, pitch: Cesium.Math.toRadians(-90), roll: 0 },
                    duration: 2
                });
            } else if (currentPlanet === 'moon' || (PLANETS[currentPlanet] && PLANETS[currentPlanet].isOuterWilds)) {
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
            if (currentPlanet === 'moon' || (PLANETS[currentPlanet] && PLANETS[currentPlanet].isOuterWilds)) {
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
            if (currentPlanet === 'moon' || (PLANETS[currentPlanet] && PLANETS[currentPlanet].isOuterWilds)) {
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
            viewer.scene.globe.enableLighting = nightMode;
            document.getElementById('btnNight').classList.toggle('active');

            if (nightMode) {
                // Simulate night view
                viewer.clock.currentTime = Cesium.JulianDate.fromDate(new Date('2024-01-15T22:00:00Z'));
                viewer.clock.shouldAnimate = false;
            } else {
                viewer.clock.currentTime = Cesium.JulianDate.now();
            }
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
                    viewer.entities.add({
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
                            </div>
                        `
                    });
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
            setupMouseTracking();

            setTimeout(() => {
                document.getElementById('loadingScreen').classList.add('hidden');
            }, 2500);
        }

        // UI Help

        function togglePanel() {
            document.getElementById('controlPanel').classList.toggle('collapsed');
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