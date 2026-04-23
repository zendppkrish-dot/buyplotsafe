import React from 'react';

export function LuxuryMansion(props) {
    return (
        <group {...props} dispose={null}>
            {/* Main Center Building */}
            <mesh position={[0, 2.5, 0]}>
                <boxGeometry args={[8, 5, 8]} />
                <meshStandardMaterial color="#fdf5e6" roughness={0.2} /> {/* Old Lace */}
            </mesh>

            {/* Left Wing */}
            <mesh position={[-6, 1.5, 0]}>
                <boxGeometry args={[4, 3, 6]} />
                <meshStandardMaterial color="#fdf5e6" roughness={0.2} />
            </mesh>

            {/* Right Wing */}
            <mesh position={[6, 1.5, 0]}>
                <boxGeometry args={[4, 3, 6]} />
                <meshStandardMaterial color="#fdf5e6" roughness={0.2} />
            </mesh>

            {/* Center Roof */}
            <mesh position={[0, 5.5, 0]}>
                <coneGeometry args={[6, 2, 4]} rotation={[0, Math.PI / 4, 0]} />
                <meshStandardMaterial color="#2f4f4f" roughness={0.8} /> {/* Dark Slate Gray */}
            </mesh>

            {/* Left Wing Roof */}
            <mesh position={[-6, 3.5, 0]}>
                <coneGeometry args={[3.2, 1.5, 4]} rotation={[0, Math.PI / 4, 0]} />
                <meshStandardMaterial color="#2f4f4f" roughness={0.8} />
            </mesh>

            {/* Right Wing Roof */}
            <mesh position={[6, 3.5, 0]}>
                <coneGeometry args={[3.2, 1.5, 4]} rotation={[0, Math.PI / 4, 0]} />
                <meshStandardMaterial color="#2f4f4f" roughness={0.8} />
            </mesh>

            {/* Grand Entrance Pillars */}
            {[-1.5, 1.5].map((x, i) => (
                <mesh key={i} position={[x, 2.5, 4.2]}>
                    <cylinderGeometry args={[0.3, 0.3, 5]} />
                    <meshStandardMaterial color="#ffffff" roughness={0.1} />
                </mesh>
            ))}

            {/* Grand Balcony */}
            <mesh position={[0, 2.5, 4.2]}>
                <boxGeometry args={[4, 0.2, 2]} />
                <meshStandardMaterial color="#ffffff" roughness={0.2} />
            </mesh>

            {/* Grand Door */}
            <mesh position={[0, 1.25, 4.01]}>
                <planeGeometry args={[2, 2.5]} />
                <meshStandardMaterial color="#4a3b32" roughness={0.5} />
            </mesh>

            {/* Windows Center */}
            {[-2, 0, 2].map((x, i) => (
                <mesh key={i} position={[x, 3.8, 4.01]}>
                    <planeGeometry args={[1, 1.5]} />
                    <meshStandardMaterial color="#87cefa" transparent opacity={0.6} metalness={0.9} />
                </mesh>
            ))}

            {/* Windows Wings */}
            {[-6, 6].map((x, i) => (
                <mesh key={i} position={[x, 1.5, 3.01]}>
                    <planeGeometry args={[2, 1.5]} />
                    <meshStandardMaterial color="#87cefa" transparent opacity={0.6} metalness={0.9} />
                </mesh>
            ))}
        </group>
    );
}
