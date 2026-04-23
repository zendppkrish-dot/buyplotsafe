import React from 'react';

export function ModernHouse(props) {
    return (
        <group {...props} dispose={null}>
            {/* Ground Floor */}
            <mesh position={[0, 1.5, 0]}>
                <boxGeometry args={[10, 3, 8]} />
                <meshStandardMaterial color="#ffffff" roughness={0.2} />
            </mesh>

            {/* First Floor - Offset */}
            <mesh position={[1, 4, -1]}>
                <boxGeometry args={[8, 2.5, 6]} />
                <meshStandardMaterial color="#2c3e50" roughness={0.5} />
            </mesh>
            
            {/* Overhanging Roof - Ground */}
            <mesh position={[0, 3.1, 0]}>
                <boxGeometry args={[10.5, 0.2, 8.5]} />
                <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
            </mesh>

            {/* Overhanging Roof - First Floor */}
            <mesh position={[1, 5.35, -1]}>
                <boxGeometry args={[8.5, 0.2, 6.5]} />
                <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
            </mesh>

            {/* Large Glass Window Ground Floor Front */}
            <mesh position={[2, 1.5, 4.01]}>
                <planeGeometry args={[4, 2.5]} />
                <meshStandardMaterial color="#87ceeb" transparent opacity={0.6} metalness={0.9} roughness={0.1} />
            </mesh>

            {/* Large Glass Window First Floor Front */}
            <mesh position={[1, 4, 2.01]}>
                <planeGeometry args={[5, 2]} />
                <meshStandardMaterial color="#87ceeb" transparent opacity={0.6} metalness={0.9} roughness={0.1} />
            </mesh>
            
            {/* Front Door */}
            <mesh position={[-3, 1.25, 4.01]}>
                <planeGeometry args={[1.5, 2.5]} />
                <meshStandardMaterial color="#3e2723" roughness={0.7} />
            </mesh>

            {/* Balcony Railing */}
            <mesh position={[1, 3.25, 2.5]}>
                <boxGeometry args={[8, 0.5, 0.1]} />
                <meshStandardMaterial color="#bdc3c7" transparent opacity={0.5} />
            </mesh>
        </group>
    );
}
