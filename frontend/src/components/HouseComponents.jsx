import React from 'react';

export function Pillar(props) {
    return (
        <mesh {...props} castShadow receiveShadow>
            <cylinderGeometry args={[0.2, 0.2, 4]} />
            <meshStandardMaterial color="#8b4513" roughness={0.6} />
        </mesh>
    );
}

export function Wall(props) {
    return (
        <mesh {...props} castShadow receiveShadow>
            <boxGeometry args={[4, 3, 0.2]} />
            <meshStandardMaterial color="#ffffff" roughness={0.3} />
        </mesh>
    );
}

export function Roof(props) {
    return (
        <mesh {...props} castShadow receiveShadow>
            <boxGeometry args={[4.5, 0.2, 3]} />
            <meshStandardMaterial color="#b22222" roughness={0.8} />
        </mesh>
    );
}
