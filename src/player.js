class Player {
    constructor(camera, scene, controls) {
        this.camera = camera;
        this.scene = scene;
        this.controls = controls;
        this.moveSpeed = 5;
        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;

        this.createBody();
        this.setupEventListeners();
    }

    createBody() {
        const geometry = new THREE.CylinderGeometry(0.5, 0.5, 1.6, 32);
        const material = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
        this.body = new THREE.Mesh(geometry, material);
        this.body.position.y = 0.8; // Mitad de la altura del cilindro
        this.scene.add(this.body);
    }

    setupEventListeners() {
        document.addEventListener('keydown', (event) => this.onKeyDown(event), false);
        document.addEventListener('keyup', (event) => this.onKeyUp(event), false);
    }

    onKeyDown(event) {
        switch (event.code) {
            case 'KeyW': this.moveForward = true; break;
            case 'KeyS': this.moveBackward = true; break;
            case 'KeyA': this.moveLeft = true; break;
            case 'KeyD': this.moveRight = true; break;
        }
    }

    onKeyUp(event) {
        switch (event.code) {
            case 'KeyW': this.moveForward = false; break;
            case 'KeyS': this.moveBackward = false; break;
            case 'KeyA': this.moveLeft = false; break;
            case 'KeyD': this.moveRight = false; break;
        }
    }

    update(delta) {
        // Obtener la dirección de la cámara
        this.camera.getWorldDirection(this.direction);
        this.direction.y = 0;
        this.direction.normalize();

        // Calcular el movimiento
        const moveX = (Number(this.moveRight) - Number(this.moveLeft)) * this.moveSpeed * delta;
        const moveZ = (Number(this.moveForward) - Number(this.moveBackward)) * this.moveSpeed * delta;

        // Aplicar el movimiento
        if (moveZ !== 0) {
            this.controls.moveForward(moveZ);
        }
        if (moveX !== 0) {
            this.controls.moveRight(moveX);
        }

        // Actualizar la posición del cuerpo
        const cameraPosition = this.controls.getObject().position;
        this.body.position.set(cameraPosition.x, this.body.position.y, cameraPosition.z);
    }
}