import React, {useEffect, useRef, useState} from 'react';
import * as THREE from 'three';
import InfoWindow from "./InfoWindow";
import "./SolarSystem.css"
import {GLTFLoader} from "three/addons/loaders/GLTFLoader";

const SolarSystem = () => {
    const containerRef = useRef(null);
    const spaceshipRef = useRef(null);
    const [currentPlanetInfo, setCurrentPlanetInfo] = useState(null);
    const buttons = {w: false, a: false, s: false, d: false}

    useEffect(() => {
        // Set up scene
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        const renderer = new THREE.WebGLRenderer({antialias: true});
        renderer.setSize(window.innerWidth, window.innerHeight);
        containerRef.current.appendChild(renderer.domElement);
        camera.position.z = 200;

        // Create solar system objects
        const planets = [
            {
                name: 'Sun',
                radius: 10,
                color: 0xffff00,
                position: new THREE.Vector3(0, 0, 0),
                velocity: new THREE.Vector3(0, 0, 0),
                mass: 100,
                orbitRadius: 40,
                orbitInfo: 'This is the Sun. It is the center of the solar system.',
            },
            {
                name: 'Earth',
                radius: 5,
                color: 0x0000ff,
                position: new THREE.Vector3(150, 0, 0),
                velocity: new THREE.Vector3(0, 0.2, 0),
                mass: 0.1,
                orbitRadius: 15,
                orbitInfo: 'This is Earth. It is the third planet from the Sun.',
            },
            {
                name: 'Mars',
                radius: 5,
                color: 0xff0000,
                position: new THREE.Vector3(-170, 0, 0),
                velocity: new THREE.Vector3(0, -0.2, 0),
                mass: 5,
                orbitRadius: 17,
                orbitInfo: 'This is Mars. It is the fourth planet from the Sun.',
            },
            // Add more planets here
        ];

        const createPlanet = (planet) => {
            const geometry = new THREE.SphereGeometry(planet.radius, 32, 32);
            const material = new THREE.MeshBasicMaterial({color: planet.color});
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.copy(planet.position);
            scene.add(mesh);
            return mesh;
        };

        const ambientLight = new THREE.AmbientLight(0xffffff, 1);
        ambientLight.position.set(0, 1, 0); // Set the position of the light
        scene.add(ambientLight);

        const meshes = planets.map((planet) => createPlanet(planet));
        // Create the spaceship
        const spaceshipGeometry = new THREE.BoxGeometry(1, 2, 1);
        const spaceshipMaterial = new THREE.MeshBasicMaterial({color: 0xffffff});
        const spaceship = new THREE.Mesh(spaceshipGeometry, spaceshipMaterial);
        spaceship.velocity = new THREE.Vector3(0, 0.1, 0)
        spaceship.position.set(100, 0, 0)
        spaceshipRef.current = spaceship
        scene.add(spaceshipRef.current);
        const loader = new GLTFLoader();
        loader.load('/spaceshuttle/scene.gltf', (gltf) => {
            const model = gltf.scene;
            model.rotation.y = -Math.PI /2
            spaceship.add(model)
        })


        // Set up gravitational interaction
        const gravitationalConstant = 0.1;

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

            const rotationSpeed = 0.01;
            const speed = 0.001;

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
                if (distanceToPlanet <= planet.orbitRadius) {
                    setCurrentPlanetInfo(planet);
                }

                meshes[i].position.copy(planet.position);
            }

            camera.position.set(...planets[0].position)
            camera.position.z = 200
            spaceship.position.add(spaceship.velocity);
            console.log(spaceshipRef.current.position)

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
                meshes[i].rotation.y += 0.01;
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