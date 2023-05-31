import React, {useEffect, useRef, useState} from 'react';
import * as THREE from 'three';
import InfoWindow from "./InfoWindow";
import "./SolarSystem.css"
import {GLTFLoader} from "three/addons/loaders/GLTFLoader.js";
import {USDZLoader} from "three/addons/loaders/USDZLoader.js";
import {InteractionManager} from 'three.interactive';
import {Vector3} from "three";

const SolarSystem = () => {
    const containerRef = useRef(null);
    const spaceshipRef = useRef(null);
    const [currentPlanetInfo, setCurrentPlanetInfo] = useState(null);
    let targetPlanet = null;
    const buttons = {w: false, a: false, s: false, d: false, " ": false}
    const cameraZ = 1500
    // Set up gravitational interaction
    const gravitationalConstant = 0.0001;

    useEffect(() => {
        // Set up scene
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            2000
        );
        var loader = new THREE.TextureLoader();
        var texture = loader.load('/2k_stars_milky_way.jpg');
        scene.background = texture;
        texture.encoding = THREE.sRGBEncoding;

        const usdzLoader = new USDZLoader();
        const gltfLoader = new GLTFLoader();
        const renderer = new THREE.WebGLRenderer({antialias: true});
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.toneMappingExposure = 1.5;
        containerRef.current.appendChild(renderer.domElement);
        camera.position.z = cameraZ;
        const interactionManager = new InteractionManager(
            renderer,
            camera,
            renderer.domElement
        );

        // Create solar system objects
        const planets = [
            {
                name: 'Sun',
                radius: 40,
                color: 0xffff00,
                position: new THREE.Vector3(0, 0, 0),
                velocity: new THREE.Vector3(0, 0, 0),
                mass: 10000000,
                orbitRadius: 200,
                model: "/planets/sun.glb",
                rotation: 0.002,
                orbitInfo: 'This is the Sun. It is the center of the solar system.',
            },
            {
                name: 'Earth',
                radius: 20,
                color: 0x0000ff,
                position: new THREE.Vector3(300, 0, 0),
                velocity: new THREE.Vector3(0, 0, 0),
                mass: 10000,
                orbitRadius: 40,
                rotation: 0.01,
                model: "/planets/earth.glb",
                orbitInfo: 'This is Earth. It is the third planet from the Sun.',
            },
            {
                name: 'Mars',
                radius: 15,
                color: 0xff0000,
                position: new THREE.Vector3(450, 0, 0),
                velocity: new THREE.Vector3(0, 0, 0),
                mass: 500000,
                orbitRadius: 100,
                rotation: 0.01,
                model: "/planets/mars.glb",
                orbitInfo: 'This is Mars. It is the fourth planet from the Sun.',
            },
            {
                name: 'Neptune',
                radius: 15,
                color: 0x0000aa,
                position: new THREE.Vector3(1300, 0, 0),
                velocity: new THREE.Vector3(0, 0, 0),
                mass: 200000,
                orbitRadius: 60,
                rotation: 0.01,
                model: "/planets/neptune.glb",
                orbitInfo: 'This is Neptune. It is the eighth planet from the Sun.',
            },
            {
                name: 'Saturn',
                radius: 15,
                color: 0x0000aa,
                position: new THREE.Vector3(900, 0, 0),
                velocity: new THREE.Vector3(0, 0, 0),
                mass: 200000,
                orbitRadius: 60,
                rotation: 0.01,
                model: "/planets/saturn.glb",
                orbitInfo: 'This is Saturn. It is the sixth planet from the Sun.',
            },
            // Add more planets here
        ];

        const createPlanet = (planet) => {
            const geometry = new THREE.SphereGeometry(planet.radius, 32, 32);
            const material = new THREE.MeshBasicMaterial({color: planet.color});
            const mesh = new THREE.Mesh(geometry, material);
            interactionManager.add(mesh);
            if (planet.position.length() !== 0) {
                planet.velocity.add(new THREE.Vector3(0, Math.sqrt((gravitationalConstant * planets[0].mass) / planet.position.length()), 0))
            }
            mesh.addEventListener("click", () => {
                targetPlanet = planet;
                console.log(planet.name)
            });
            if (planet.model) {
                gltfLoader.load(planet.model, (gltf) => {
                    const model = gltf.scene
                    model.scale.set(0.1, 0.1, 0.1)
                    model.rotation.x = Math.PI / 2
                    mesh.add(model)
                })
            }
            mesh.position.copy(planet.position);
            scene.add(mesh);
            return mesh;
        };

        const lineGeometry = new THREE.BufferGeometry();
        const lineMaterial = new THREE.LineBasicMaterial({color: 0xffffff});
        const line = new THREE.Line(lineGeometry, lineMaterial);
        let linePositions = [];
        scene.add(line);

        const ambientLight = new THREE.AmbientLight(0xffffff, 1);
        ambientLight.position.set(0, 1, 0); // Set the position of the light
        scene.add(ambientLight);

        const meshes = planets.map((planet) => createPlanet(planet));

        // Create the spaceship
        const spaceshipGeometry = new THREE.BoxGeometry(1, 2, 1);
        const spaceshipMaterial = new THREE.MeshBasicMaterial({color: 0xffffff});
        const spaceship = new THREE.Mesh(spaceshipGeometry, spaceshipMaterial);
        spaceship.velocity = new THREE.Vector3(0, 2, 0)
        spaceship.position.set(300, 0, 0)
        spaceshipRef.current = spaceship
        scene.add(spaceshipRef.current);

        gltfLoader.load('/spaceshuttle/scene.gltf', (gltf) => {
            const model = gltf.scene;
            model.rotation.y = -Math.PI / 2
            model.scale.set(5, 5, 5)
            spaceship.add(model)
        })


        const updatePlanets = () => {
            for (let i = 0; i < planets.length; i++) {
                const planetA = planets[i];

                for (let j = i + 1; j < planets.length; j++) {
                    const planetB = planets[j];
                    const distance = planetA.position.distanceTo(planetB.position);
                    const gravitationalForce =
                        (gravitationalConstant * planetA.mass * planetB.mass) / Math.pow(distance, 2);

                    const direction = new THREE.Vector3().subVectors(planetB.position, planetA.position).normalize();
                    const gravitationalAccelerationA = direction.clone().multiplyScalar(gravitationalForce / planetA.mass);
                    const gravitationalAccelerationB = direction.clone().multiplyScalar(-gravitationalForce / planetB.mass);

                    planetA.velocity.add(gravitationalAccelerationA);
                    planetB.velocity.add(gravitationalAccelerationB);
                }
            }

            for (let i = 0; i < planets.length; i++) {
                const planet = planets[i];
                const distanceToSpaceship = planet.position.distanceTo(spaceship.position);
                const gravitationalForce =
                    (gravitationalConstant * planet.mass) / Math.pow(distanceToSpaceship, 2);
                const direction = new THREE.Vector3().subVectors(planet.position, spaceship.position).normalize();
                const gravitationalAcceleration = direction.multiplyScalar(gravitationalForce);
                spaceship.velocity.add(gravitationalAcceleration);
            }

            const rotationSpeed = 0.05;
            let speed = 0.01;

            if (buttons[" "]) {
                speed = 0.03
            }

            if (buttons.w) {
                spaceship.velocity = addVelocityInForwardDirection(spaceship.rotation, spaceship.velocity, speed);
            }
            if (buttons.a) {
                spaceship.rotation.z += rotationSpeed;
            }
            if (buttons.s) {
                spaceship.velocity = addVelocityInForwardDirection(spaceship.rotation, spaceship.velocity, -speed);
            }
            if (buttons.d) {
                spaceship.rotation.z -= rotationSpeed;
            }
            setCurrentPlanetInfo(null);
            for (let i = 0; i < planets.length; i++) {
                const planet = planets[i];
                planet.position.add(planet.velocity);

                // Check if spaceship entered the orbit of the planet
                const distanceToPlanet = spaceship.position.distanceTo(planet.position);

                if (distanceToPlanet <= planet.orbitRadius * 2) {
                    setCurrentPlanetInfo(planet);
                }
                if (distanceToPlanet <= planet.orbitRadius) {
                    const radialVector = new THREE.Vector3().subVectors(planet.position, spaceship.position).normalize();
                    const tangentialVector = new THREE.Vector3(radialVector.y, -radialVector.x, 0); // Perpendicular to the radial vector in 2D

                    const velocityVector = tangentialVector.multiplyScalar(Math.sqrt((gravitationalConstant * planet.mass) / distanceToPlanet));
                    const targetVelocity = velocityVector.clone().add(planet.velocity);
                    const scaledVelocityDif = targetVelocity.clone().sub(spaceship.velocity).multiplyScalar(0.05);
                    spaceship.velocity.add(new THREE.Vector3(...scaledVelocityDif));
                }
                if (distanceToPlanet <= planet.radius) {
                    spaceship.velocity.set(...planet.position.clone().sub(spaceship.position).normalize().negate().multiplyScalar(planet.mass / planet.radius / 20000))
                }

                meshes[i].position.copy(planet.position);
            }
            linePositions = linePositions.map((linePosition, i, _) => {
                if (i % 3 === 0) {
                    return linePosition + planets[0].velocity.x
                } else if ((i + 2) % 3 === 0) {
                    return linePosition + planets[0].velocity.y
                } else if ((i + 1) % 3 === 0) {
                    return linePosition + planets[0].velocity.z
                }
            })

            linePositions.push(spaceship.position.x, spaceship.position.y, spaceship.position.z);
            if (linePositions.length > 10000) {
                linePositions.shift()
                linePositions.shift()
                linePositions.shift()
            }
            if (targetPlanet) {
                const direction = targetPlanet.position.clone().sub(spaceship.position).normalize();
                const speed = 2;
                const newVelocity = direction.multiplyScalar(speed);
                const scaledVelocityDif = newVelocity.clone().sub(spaceship.velocity).multiplyScalar(0.03)
                spaceship.velocity.add(new THREE.Vector3(...scaledVelocityDif))
                if (spaceship.position.distanceTo(targetPlanet.position) < targetPlanet.orbitRadius) {
                    targetPlanet = null
                }
            }

            line.geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(linePositions), 3));

            camera.position.set(...planets[0].position)
            camera.position.z = cameraZ
            spaceship.position.add(spaceship.velocity);
        };

        const addVelocityInForwardDirection = (rotationVector, velocity, speed) => {
            // Convert rotation vector to THREE.Quaternion
            const quaternion = new THREE.Quaternion().setFromEuler(rotationVector);

            // Get the forward direction vector
            const forwardDirection = new THREE.Vector3(0, 1, 0).applyQuaternion(quaternion);

            // Scale the forward direction vector by the desired speed or velocity
            const forwardVelocity = forwardDirection.multiplyScalar(speed);

            // Add the forward velocity to the current velocity
            const newVelocity = velocity.clone().add(forwardVelocity);

            return newVelocity;
        };

        const handleKeyDown = (event) => {
            const key = event.key.toLowerCase();
            buttons[key] = true;
        }

        const handleKeyUp = (event) => {
            const key = event.key.toLowerCase();
            buttons[key] = false;
        };


        // Add event listeners for spaceship movement
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);

        // Animation loop
        const animate = () => {
            requestAnimationFrame(animate);

            updatePlanets();

            for (let i = 0; i < meshes.length; i++) {
                meshes[i].rotation.z += planets[i].rotation;
            }

            renderer.render(scene, camera);
        };

        animate();

        // Clean up on unmount
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('keyup', handleKeyUp);
            containerRef.current.removeChild(renderer.domElement);
            renderer.dispose();
        };
    }, []);

    return (
        <div>
            <div ref={containerRef}/>
            {currentPlanetInfo && <InfoWindow planetInfo={currentPlanetInfo}/>}
        </div>
    );
};

export default SolarSystem;
