// src/script.js

const Game = {
    scene: null,
    camera: null,
    renderer: null,
    controls: null,
    player: null,
    birds: null,
    isPlaying: false,
    isPaused: false,
    animationFrameId: null,
    clock: new THREE.Clock(),
    shaderMaterial: null,
    sun: null,
    sunLight: null,

    init() {
        this.initScene();
        this.initCamera();
        this.initRenderer();
        this.createSkyAndSun();
        this.initLights();
        this.createGround();
        this.createTrees();
        this.initControls();
        this.initPlayer();
        this.initBirds();
        this.applyShader();
        this.initMenuListeners();
        window.addEventListener('resize', () => this.onWindowResize(), false);
        document.addEventListener('visibilitychange', () => this.handleVisibilityChange());
    },

    initScene() {
        this.scene = new THREE.Scene();
    },

    initCamera() {
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);  // Aumenta el far plane
        this.camera.position.set(0, 1.6, 5);
    },

    initRenderer() {
        this.renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('game-canvas'), antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x87CEEB);
        this.renderer.setPixelRatio(window.devicePixelRatio);
    },

    createSkyAndSun() {
        // Crear el cielo
        const skyGeometry = new THREE.SphereGeometry(1000, 32, 32);
        const textureLoader = new THREE.TextureLoader();
        const skyTexture = textureLoader.load(
            'assets/skybox/OIP.jpg',
            (texture) => {
                console.log('Textura del cielo cargada correctamente');
                this.renderer.render(this.scene, this.camera);
            },
            (xhr) => {
                console.log((xhr.loaded / xhr.total * 100) + '% cargado');
            },
            (err) => {
                console.error('Error al cargar la textura del cielo', err);
            }
        );
        const skyMaterial = new THREE.MeshBasicMaterial({
            map: skyTexture,
            side: THREE.BackSide,
            fog: false  // Asegúrate de que el cielo no tenga niebla
        });
        this.sky = new THREE.Mesh(skyGeometry, skyMaterial);
        this.scene.add(this.sky);

        // Crear el sol
        const sunGeometry = new THREE.CircleGeometry(10, 32);
        const sunMaterial = new THREE.ShaderMaterial({
            uniforms: THREE.UniformsUtils.clone(SunShader.uniforms),
            vertexShader: SunShader.vertexShader,
            fragmentShader: SunShader.fragmentShader,
            transparent: true,
            side: THREE.DoubleSide
        });
        this.sun = new THREE.Mesh(sunGeometry, sunMaterial);
        this.sun.position.set(100, 100, -100);
        this.sun.lookAt(this.scene.position);
        this.scene.add(this.sun);

        // Luz direccional para simular la luz del sol
        this.sunLight = new THREE.DirectionalLight(0xffffff, 1);
        this.sunLight.position.copy(this.sun.position);
        this.scene.add(this.sunLight);
    },

    initLights() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.4);
        directionalLight.position.set(1, 1, 1).normalize();
        this.scene.add(directionalLight);
    },

    createGround() {
        const groundGroup = new THREE.Group();
        const tileSize = 2;
        const mapSize = 100;
        const tilesPerSide = mapSize / tileSize;
        const overlap = 0.1;

        const loader = new THREE.TextureLoader();
        const textures = [
            loader.load('assets/textures/ground/grass_1.png'),
            loader.load('assets/textures/ground/grass_2.png'),
            loader.load('assets/textures/ground/grass_3.png'),
            loader.load('assets/textures/ground/grass_2.png')
        ];

        textures.forEach(texture => {
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(1.1, 1.1);
        });

        const baseGeometry = new THREE.PlaneGeometry(mapSize + tileSize * 2, mapSize + tileSize * 2);
        const baseMaterial = new THREE.MeshBasicMaterial({ color: 0x1a5f1a });
        const basePlane = new THREE.Mesh(baseGeometry, baseMaterial);
        basePlane.rotation.x = -Math.PI / 2;
        basePlane.position.y = -0.05;
        groundGroup.add(basePlane);

        for (let i = 0; i < tilesPerSide; i++) {
            for (let j = 0; j < tilesPerSide; j++) {
                const tileGeometry = new THREE.PlaneGeometry(tileSize + overlap * 2, tileSize + overlap * 2);
                const randomTextureIndex = Math.floor(Math.random() * textures.length);
                const tileMaterial = new THREE.MeshStandardMaterial({
                    map: textures[randomTextureIndex],
                    roughness: 0.8,
                    metalness: 0.2,
                    transparent: true,
                    opacity: 0.99
                });

                const tile = new THREE.Mesh(tileGeometry, tileMaterial);
                tile.rotation.x = -Math.PI / 2;
                tile.position.set(
                    (i - tilesPerSide / 2) * tileSize + tileSize / 2,
                    0,
                    (j - tilesPerSide / 2) * tileSize + tileSize / 2
                );

                tile.position.y += Math.random() * 0.02;
                tile.rotation.z = (Math.random() - 0.5) * 0.02;

                groundGroup.add(tile);
            }
        }

        groundGroup.children.sort((a, b) => b.position.z - a.position.z);
        this.scene.add(groundGroup);
    },

    createTrees() {
        const treeGeometry = new THREE.ConeGeometry(1, 4, 6);
        treeGeometry.computeVertexNormals();
        const treeMaterial = new THREE.MeshStandardMaterial({ color: 0x2e8b57 });

        for (let i = 0; i < 50; i++) {
            const tree = new THREE.Mesh(treeGeometry, treeMaterial);
            tree.position.set(
                Math.random() * 80 - 40,
                2,
                Math.random() * 80 - 40
            );
            this.scene.add(tree);
        }
    },

    initControls() {
        this.controls = new THREE.PointerLockControls(this.camera, document.body);
        this.scene.add(this.controls.getObject());

        this.controls.addEventListener('lock', () => {
            if (this.isPlaying && !this.isPaused) {
                document.getElementById('pause-menu').style.display = 'none';
            }
        });

        this.controls.addEventListener('unlock', () => {
            if (this.isPlaying && !this.isPaused) {
                this.togglePause();
            }
        });
    },

    initPlayer() {
        this.player = new Player(this.camera, this.scene, this.controls);
    },

    initBirds() {
        this.birds = new Birds(this.scene);
    },

    applyShader() {
        const fogColor = new THREE.Color(0xcccccc);
        const fogNear = 50;
        const fogFar = 300;
    
        this.scene.traverse((child) => {
            if (child instanceof THREE.Mesh && child !== this.sun && child !== this.sky) {
                let uniforms = THREE.UniformsUtils.clone(Shaders.uniforms);
                if (child.material.map) {
                    uniforms.map.value = child.material.map;
                    uniforms.useTexture.value = true;
                } else {
                    uniforms.color.value = child.material.color || new THREE.Color(0xffffff);
                    uniforms.useTexture.value = false;
                }
                uniforms.fogColor.value = fogColor;
                uniforms.fogNear.value = fogNear;
                uniforms.fogFar.value = fogFar;
    
                child.material = new THREE.ShaderMaterial({
                    uniforms: uniforms,
                    vertexShader: Shaders.vertexShader,
                    fragmentShader: Shaders.fragmentShader,
                    fog: true,
                    transparent: child.material.transparent || false,
                    side: child.material.side || THREE.FrontSide
                });
            }
        });
    
        this.scene.fog = new THREE.Fog(fogColor, fogNear, fogFar);
    },

    initMenuListeners() {
        document.getElementById('start-button').addEventListener('click', () => this.startGame());
        document.getElementById('resume-button').addEventListener('click', () => this.resumeGame());
        document.getElementById('quit-button').addEventListener('click', () => this.quitGame());
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && this.isPlaying) {
                this.togglePause();
            }
        });
    },

    startGame() {
        document.getElementById('start-menu').style.display = 'none';
        this.isPlaying = true;
        this.isPaused = false;
        this.controls.lock();
        this.player.body.position.set(0, 0.8, 0);
        this.camera.position.set(0, 1.6, 0);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.clock.start();
        this.animate();  // Asegúrate de que esta línea esté presente
    },

    resumeGame() {
        document.getElementById('pause-menu').style.display = 'none';
        this.isPaused = false;
        this.controls.lock();
        this.animate();
    },

    quitGame() {
        document.getElementById('pause-menu').style.display = 'none';
        document.getElementById('start-menu').style.display = 'block';
        this.isPlaying = false;
        this.isPaused = false;
        this.controls.unlock();
        this.player.body.position.set(0, 0.8, 0);
        this.camera.position.set(0, 1.6, 0);
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    },

    togglePause() {
        if (this.isPaused) {
            this.resumeGame();
        } else {
            document.getElementById('pause-menu').style.display = 'block';
            this.isPaused = true;
            this.controls.unlock();
            if (this.animationFrameId) {
                cancelAnimationFrame(this.animationFrameId);
                this.animationFrameId = null;
            }
        }
    },

    animate() {
        if (!this.isPaused && this.isPlaying) {
            this.animationFrameId = requestAnimationFrame(() => this.animate());

            const delta = this.clock.getDelta();
            const elapsedTime = this.clock.getElapsedTime();

            this.player.update(delta);
            this.birds.update(delta);

            // Actualizar el shader del sol
            if (this.sun && this.sun.material.uniforms) {
                this.sun.material.uniforms.time.value = elapsedTime;
            }

            // Actualizar la posición de la luz del sol
            if (this.sunLight && this.sun) {
                this.sunLight.position.copy(this.sun.position);
            }

            // Actualizar la posición del cielo
            if (this.sky) {
                this.sky.position.copy(this.camera.position);
            }

            // Asegurarse de que el cielo esté renderizado correctamente
            if (this.sky) {
                this.sky.material.depthWrite = false;
                this.sky.renderOrder = -1;  // Asegura que el cielo se renderice primero
            }

            this.renderer.render(this.scene, this.camera);

            // Registro para depuración
            if (elapsedTime % 5 < 0.1) {  // Registra cada 5 segundos aproximadamente
                console.log('Posición de la cámara:', this.camera.position);
                console.log('Posición del cielo:', this.sky ? this.sky.position : 'No hay cielo');
                console.log('Posición del sol:', this.sun ? this.sun.position : 'No hay sol');
            }
        }
    },

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    },

    handleVisibilityChange() {
        if (document.hidden) {
            this.isPaused = true;
            if (this.animationFrameId) {
                cancelAnimationFrame(this.animationFrameId);
                this.animationFrameId = null;
            }
        } else {
            if (this.isPlaying) {
                this.isPaused = false;
                this.renderer.setSize(window.innerWidth, window.innerHeight);
                this.camera.aspect = window.innerWidth / window.innerHeight;
                this.camera.updateProjectionMatrix();
                this.animate();
            }
        }
    }
};

// Iniciar el juego cuando se cargue la ventana
window.onload = () => Game.init();