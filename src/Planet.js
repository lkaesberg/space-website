import React, {useRef, useMemo, useEffect} from "react";
import {useFrame, useThree} from "@react-three/fiber";
import {Icosahedron, OrbitControls} from "@react-three/drei";
import * as THREE from "three";
import {useLoader} from "react-three-fiber";

const Planet = ({color, distance, scale, orbitalSpeed, rotationSpeed, texture, onClick, focusPlanet}) => {
    const planetRef = useRef();
    const orbitRef = useRef();
    const orbitRadius = useMemo(() => {
        return new THREE.Vector3(distance, 0, 0);
    }, [distance]);
    const {camera} = useThree();

    useFrame((state, delta) => {
        if (planetRef.current && orbitRef.current) {

            orbitRef.current.rotation.y += orbitalSpeed * delta;
            planetRef.current.rotation.y += rotationSpeed * delta;
        }
    });

    const getPlanetPosition = () => {
        if (planetRef.current) {
            const worldPosition = new THREE.Vector3();
            planetRef.current.getWorldPosition(worldPosition);
            return worldPosition;
        }
        return null;
    };
    useEffect(() => {
        setInterval(() => {
            if (focusPlanet) {
                let position = getPlanetPosition()
                if (position) {
                    console.log(position)
                    camera.lookAt(position);
                }
            }
        }, 10);
    })


    const handlePlanetClick = () => {
        if (onClick) {
            onClick(orbitRadius);
        }
    };

    return (
        <group ref={orbitRef}>
            <Icosahedron
                ref={planetRef}
                args={[1, 20]} // Change the second argument to adjust the level of subdivision
                position={orbitRadius}
                scale={scale}
                onClick={handlePlanetClick}
            >
                {texture ? (
                    <meshLambertMaterial map={texture} color={new THREE.Color(0xbbbbbb)}/>
                ) : (
                    <meshStandardMaterial color={color}/>
                )}
            </Icosahedron>
            {focusPlanet && (
                <OrbitControls
                    enableZoom={false}
                    enablePan={false}
                    enableRotate={false}
                    minDistance={1}
                    maxDistance={5}
                />
            )}
        </group>
    );
};

export default Planet;