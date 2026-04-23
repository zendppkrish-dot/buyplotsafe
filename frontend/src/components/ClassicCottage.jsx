import React from 'react';

export function ClassicCottage(props) {
    return (
        <group {...props} dispose={null}>
            {/* Main Body */}
            <mesh position={[0, 1.25, 0]}>
                <boxGeometry args={[8, 2.5, 6]} />
                <meshStandardMaterial color="#f5deb3" roughness={0.8} /> {/* Wheat/Warm color */}
            </mesh>

            {/* Pitched Roof */}
            <group position={[0, 2.5, 0]}>
                <mesh position={[0, 1, 1.5]} rotation={[-Math.PI / 4, 0, 0]}>
                    <boxGeometry args={[9, 0.2, 5]} />
                    <meshStandardMaterial color="#8b4513" roughness={0.9} /> {/* Saddlebrown */}
                </mesh>
                <mesh position={[0, 1, -1.5]} rotation={[Math.PI / 4, 0, 0]}>
                    <boxGeometry args={[9, 0.2, 5]} />
                    <meshStandardMaterial color="#8b4513" roughness={0.9} />
                </mesh>
                {/* Gable Ends */}
                <mesh position={[4, 0.5, 0]} rotation={[0, Math.PI / 2, 0]}>
                    <coneGeometry args={[3, 1.5, 4]} rotation={[0, Math.PI / 4, 0]} />
                    <meshStandardMaterial color="#d2b48c" roughness={0.9} />
                </mesh>
                <mesh position={[-4, 0.5, 0]} rotation={[0, Math.PI / 2, 0]}>
                    <coneGeometry args={[3, 1.5, 4]} rotation={[0, Math.PI / 4, 0]} />
                    <meshStandardMaterial color="#d2b48c" roughness={0.9} />
                </mesh>
            </group>

            {/* Chimney */}
            <mesh position={[-2.5, 3.5, -1]}>
                <boxGeometry args={[0.8, 2, 0.8]} />
                <meshStandardMaterial color="#a52a2a" roughness={1} /> {/* Brown/Red Brick */}
            </mesh>

            {/* Door */}
            <mesh position={[0, 1, 3.01]}>
                <planeGeometry args={[1.2, 2]} />
                <meshStandardMaterial color="#5c4033" roughness={0.6} /> {/* Dark wood */}
            </mesh>

            {/* Windows */}
            {[[-2, 1.2, 3.01], [2, 1.2, 3.01]].map((pos, i) => (
                <mesh key={i} position={pos}>
                    <planeGeometry args={[1.2, 1.2]} />
                    <meshStandardMaterial color="#add8e6" transparent opacity={0.7} metalness={0.8} />
                </mesh>
            ))}
            
            {/* Window Frames */}
            {[[-2, 1.2, 3.02], [2, 1.2, 3.02]].map((pos, i) => (
                <group key={i} position={pos}>
                    <mesh><boxGeometry args={[1.3, 0.1, 0.05]} /><meshStandardMaterial color="#ffffff" /></mesh>
                    <mesh><boxGeometry args={[0.1, 1.3, 0.05]} /><meshStandardMaterial color="#ffffff" /></mesh>
                </group>
            ))}
        </group>
    );
}
