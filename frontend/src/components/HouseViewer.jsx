import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, Stage, Center } from '@react-three/drei';

// This sub-component loads the actual GLB file
function Model({ path }) {
    const { scene } = useGLTF(path);
    return <primitive object={scene} />;
}

export default function HouseViewer({ modelPath }) {
    return (
        <div className="w-full h-[400px] bg-slate-900 rounded-xl shadow-inner">
            <Canvas shadows camera={{ position: [4, 4, 4], fov: 45 }}>
                <ambientLight intensity={0.5} />
                <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />

                <Suspense fallback={<mesh><boxGeometry /><meshStandardMaterial color="gray" /></mesh>}>
                    <Stage environment="city" intensity={0.6} contactShadow={true}>
                        <Center>
                            <Model path={modelPath} />
                        </Center>
                    </Stage>
                </Suspense>

                <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 1.75} />
            </Canvas>
            <div className="absolute bottom-4 left-4 text-white text-xs bg-black/50 p-2 rounded">
                Left Click: Rotate | Right Click: Pan | Scroll: Zoom
            </div>
        </div>
    );
}