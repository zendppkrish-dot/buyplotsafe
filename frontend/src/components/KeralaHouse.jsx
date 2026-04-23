import React from 'react';

export function KeralaHouse(props) {
    return (
        <group {...props} dispose={null}>
            {/* Main Building Structure - White Exterior */}
            <mesh position={[0, 1.5, 0]}>
                <boxGeometry args={[10, 3, 8]} />
                <meshStandardMaterial color="#ffffff" roughness={0.3} />
            </mesh>

            {/* Veranda / Poomukham - Recessed front section */}
            <mesh position={[0, 1, 4.2]}>
                <boxGeometry args={[8, 2, 0.4]} />
                <meshStandardMaterial color="#f0f0f0" />
            </mesh>

            {/* Pillars for Veranda */}
            {[-3.5, 3.5].map((x, i) => (
                <mesh key={i} position={[x, 1, 4.4]}>
                    <cylinderGeometry args={[0.15, 0.15, 2]} />
                    <meshStandardMaterial color="#8b4513" /> {/* Wooden pillars */}
                </mesh>
            ))}

            {/* Sloped Red-Tiled Roof (2-sided pitch) */}
            <group position={[0, 3, 0]}>
                {/* Front Slope */}
                <mesh position={[0, 1.25, 2.5]} rotation={[-Math.PI / 6, 0, 0]}>
                    <boxGeometry args={[11, 0.2, 6]} />
                    <meshStandardMaterial color="#b22222" roughness={0.8} />
                </mesh>
                {/* Back Slope */}
                <mesh position={[0, 1.25, -2.5]} rotation={[Math.PI / 6, 0, 0]}>
                    <boxGeometry args={[11, 0.2, 6]} />
                    <meshStandardMaterial color="#b22222" roughness={0.8} />
                </mesh>
                {/* Side Gable Ends */}
                <mesh position={[5, 0.5, 0]} rotation={[0, Math.PI / 2, 0]}>
                    <coneGeometry args={[4.5, 1.5, 4]} rotation={[0, Math.PI / 4, 0]} />
                    <meshStandardMaterial color="#ffffff" />
                </mesh>
                <mesh position={[-5, 0.5, 0]} rotation={[0, Math.PI / 2, 0]}>
                    <coneGeometry args={[4.5, 1.5, 4]} rotation={[0, Math.PI / 4, 0]} />
                    <meshStandardMaterial color="#ffffff" />
                </mesh>
            </group>

            {/* Windows - Glass Material */}
            {[
                [-3, 1.8, 4.01], [3, 1.8, 4.01], // Front windows
                [5.01, 1.8, 0], [-5.01, 1.8, 0], // Side windows
            ].map((pos, i) => (
                <mesh key={i} position={pos} rotation={pos[0] > 4 ? [0, Math.PI / 2, 0] : [0, 0, 0]}>
                    <planeGeometry args={[2, 1.5]} />
                    <meshStandardMaterial
                        color="#87ceeb"
                        transparent
                        opacity={0.6}
                        metalness={0.9}
                        roughness={0.1}
                    />
                </mesh>
            ))}

            {/* Front Door */}
            <mesh position={[0, 1, 4.01]}>
                <planeGeometry args={[1.5, 2.2]} />
                <meshStandardMaterial color="#3e2723" /> {/* Teak wood color */}
            </mesh>
        </group>
    );
}
