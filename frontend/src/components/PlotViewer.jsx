/**
 * PlotViewer.jsx
 *
 * Props:
 *   - glbBase64 {string}  : Base64-encoded GLB from /api/generate-mesh/:id
 *   - metadata  {object}  : Plot metadata returned alongside the GLB
 *   - plotId    {number}  : Plot ID — used for the Download Report button
 *   - height    {string}  : CSS height of the canvas container (default "520px")
 *
 * Features:
 *   - Decodes Base64 → GLB in the browser using GLTFLoader.parse()
 *   - Applies meshStandardMaterial (Kerala Green) on the base terrain
 *   - useBounds / Bounds from drei: auto-centers PerspectiveCamera on any mesh size
 *   - OrbitControls with auto-rotate for HOD demo
 *   - Floating HTML label with risk score
 *   - Download Risk Report button (fetches /api/report/:id, saves as .json)
 */
import React, { Suspense, useRef, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import {
    OrbitControls,
    PerspectiveCamera,
    Bounds,
    useBounds,
    Html,
    Environment,
    Grid,
    TransformControls,
    useFBX,
    useGLTF
} from '@react-three/drei';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as THREE from 'three';
import axios from 'axios';
import { KeralaHouse } from './KeralaHouse';
import { ModernHouse } from './ModernHouse';
import { ClassicCottage } from './ClassicCottage';
import { LuxuryMansion } from './LuxuryMansion';
import { Pillar, Wall, Roof } from './HouseComponents';

const API = '/api';

// ─── Component Factory ───
const COMPONENT_MAP = {
    'KeralaHouse': KeralaHouse,
    'ModernHouse': ModernHouse, 
    'ClassicCottage': ClassicCottage,
    'LuxuryMansion': LuxuryMansion,
    'Pillar': Pillar,
    'Wall': Wall,
    'Roof': Roof,
    'Kerala Villa (Classic)': KeralaHouse,
    'Kerala Villa (Modern)': ModernHouse,
    'Modern Structure': ModernHouse
};

function AssetModel({ path }) {
    const isGLB = path.toLowerCase().endsWith('.glb');
    const fbx = !isGLB ? useFBX(path) : null;
    const { scene } = isGLB ? useGLTF(path) : { scene: null };
    
    const source = isGLB ? scene : fbx;

    // Clone and normalize scale based on bounding box
    const cloned = React.useMemo(() => {
        if (!source) return null;
        const obj = source.clone();
        
        // Reset scale to 1 before measuring for true normalization
        obj.scale.setScalar(1);
        obj.updateMatrixWorld(true);

        const box = new THREE.Box3().setFromObject(obj);
        const size = new THREE.Vector3();
        box.getSize(size);
        
        const lowPath = path.toLowerCase();
        
        // Define hierarchy-based target sizes
        const isVilla = (lowPath.includes('house') && !lowPath.includes('house_parts')) || 
                        lowPath.includes('villa') || 
                        lowPath.includes('/models/');

        const isStructure = lowPath.includes('wall') || 
                            lowPath.includes('roof') || 
                            lowPath.includes('floor') ||
                            lowPath.includes('barricade') ||
                            lowPath.includes('stairs') ||
                            lowPath.includes('border');

        const isDetail = lowPath.includes('column') || 
                         lowPath.includes('door') || 
                         lowPath.includes('window') ||
                         lowPath.includes('gutter') ||
                         lowPath.includes('pipe') ||
                         lowPath.includes('detail') ||
                         lowPath.includes('plating') ||
                         lowPath.includes('corner') ||
                         lowPath.includes('column');

        let targetSize = 1.5; 
        if (isVilla) targetSize = 10;
        else if (isStructure) targetSize = 3.5;
        else if (isDetail) targetSize = 1.0;

        const maxDim = Math.max(size.x, size.y, size.z);
        if (maxDim > 0) {
            const factor = targetSize / maxDim;
            obj.scale.setScalar(factor);
        }
        
        // Final measurement for ground alignment
        obj.updateMatrixWorld(true);
        const centeredBox = new THREE.Box3().setFromObject(obj);
        obj.position.y -= centeredBox.min.y;
        
        return obj;
    }, [source, path]);

    if (!cloned) return null;
    return <primitive object={cloned} dispose={null} />;
}

// ─── Auto-fits the camera via useBounds after the mesh loads ─────────────────
function AutoFit() {
    const bounds = useBounds();
    useEffect(() => {
        const t = setTimeout(() => bounds.refresh().fit(), 120);
        return () => clearTimeout(t);
    }, [bounds]);
    return null;
}

// ─── Terrain mesh: decodes Base64 GLB → Three.js scene ───────────────────────
function TerrainMesh({ glbBase64, metadata }) {
    const [scene, setScene] = useState(null);
    const [parseErr, setParseErr] = useState(null);

    useEffect(() => {
        if (!glbBase64) return;
        try {
            const bin = atob(glbBase64);
            const bytes = new Uint8Array(bin.length);
            for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);

            new GLTFLoader().parse(bytes.buffer, '', (gltf) => {
                gltf.scene.traverse((child) => {
                    if (!child.isMesh) return;
                    if (child.name === 'terrain_base' || !child.name) {
                        child.material = new THREE.MeshStandardMaterial({
                            vertexColors: true,
                            color: '#ffffff',
                            roughness: 0.85,
                            metalness: 0.05,
                            envMapIntensity: 0.5,
                        });
                    }
                    child.castShadow = true;
                    child.receiveShadow = true;
                });
                setScene(gltf.scene);
            }, (err) => { console.error('[PlotViewer] GLB parse:', err); setParseErr('Parse error'); });
        } catch (e) { console.error('[PlotViewer] decode:', e); setParseErr('Decode error'); }
    }, [glbBase64]);

    if (parseErr) return (
        <Html center>
            <div style={{ color: '#f87171', background: '#1a1a2e', padding: '8px 14px', borderRadius: 8 }}>⚠️ {parseErr}</div>
        </Html>
    );
    if (!scene) return (
        <Html center>
            <div style={{ color: '#86efac', fontFamily: 'Inter,sans-serif', fontSize: 14 }}>🌿 Building terrain…</div>
        </Html>
    );

    const rh = metadata?.terrain_height ?? 1.5;

    return (
        <>
            <AutoFit />
            <primitive object={scene} />
        </>
    );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const textCol = s => s <= 3 ? '#f87171' : s <= 6 ? '#fbbf24' : '#86efac';
const borderCol = s => s <= 3 ? 'rgba(248,113,113,0.4)' : s <= 6 ? 'rgba(251,191,36,0.4)' : 'rgba(134,239,172,0.4)';
const icon = s => s <= 3 ? '⚠️' : s <= 6 ? '🟡' : '✅';

// ─── Download risk report ─────────────────────────
async function downloadReport(plotId) {
    const token = localStorage.getItem('token');
    try {
        const { data } = await axios.get(`${API}/report/${plotId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `buyplot_risk_report_plot${plotId}.json`;
        a.click();
        URL.revokeObjectURL(url);
    } catch (err) {
        alert('Could not download report: ' + (err.response?.data?.detail || err.message));
    }
}

// ─── Main export ─────────────────────────────────────────────────────────────
export default function PlotViewer({ 
    glbBase64, 
    metadata, 
    plotId, 
    height = '520px', 
    showHouse = true,
    sceneObjects = [],
    onUpdateComponent = () => {},
    transformMode = 'translate'
}) {
    const [downloading, setDownloading] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const [transformTarget, setTransformTarget] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [orbitEnabled, setOrbitEnabled] = useState(true);

    const handleDownload = async () => {
        setDownloading(true);
        await downloadReport(plotId);
        setDownloading(false);
    };

    // Calculate dimensions based on 1 cent = 2 units rule
    const plotSide = metadata?.area_value ? metadata.area_value * 2 : 10;
    const riskScore = metadata?.risk_score ?? 5;
    const plotColor = riskScore <= 3 ? '#dc2626' : riskScore <= 6 ? '#ca8a04' : '#16a34a';

    const onTransformEnd = () => {
        if (transformTarget && selectedId) {
            const { x, y, z } = transformTarget.position;
            const { x: rx, y: ry, z: rz } = transformTarget.rotation;
            const { x: sx, y: sy, z: sz } = transformTarget.scale;
            
            onUpdateComponent(selectedId, { 
                position: [x, y, z],
                rotation: [rx, ry, rz],
                scale: [sx, sy, sz]
            });
        }
    };

    const selectedComp = sceneObjects.find(c => c.id === selectedId);

    return (
        <div style={{
            width: '100%', height, borderRadius: 20, overflow: 'hidden', position: 'relative',
            border: '1px solid rgba(134,239,172,0.15)',
            background: 'linear-gradient(135deg,#020617 0%,#06200f 100%)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
        }}>
            <Canvas 
                shadows 
                gl={{ 
                    antialias: true, 
                    powerPreference: 'high-performance',
                    preserveDrawingBuffer: false,
                    failIfMajorPerformanceCaveat: false
                }}
                onPointerMissed={() => setSelectedId(null)}
                onCreated={({ gl }) => {
                    gl.domElement.addEventListener('webglcontextlost', (event) => {
                        event.preventDefault();
                        console.warn('Main Plot context lost. Attempting to restore...');
                    }, false);
                }}
            >
                <PerspectiveCamera makeDefault fov={45} near={0.1} far={2000} position={[0, 15, 25]} />

                <ambientLight intensity={0.4} />
                <directionalLight position={[12, 18, 12]} intensity={2.0} castShadow shadow-mapSize={[2048, 2048]} />
                <pointLight position={[-10, 10, -10]} intensity={0.5} color="#86efac" />
                <Environment preset="forest" environmentIntensity={1.2} />

                {/* Vast distant ground (Low depth) */}
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -5, 0]} receiveShadow>
                    <planeGeometry args={[5000, 5000]} />
                    <meshStandardMaterial color="#010409" roughness={1} />
                </mesh>

                {/* Distant Grid (Low depth) */}
                <Grid 
                    args={[1000, 1000]} 
                    cellColor="#1e293b" 
                    sectionColor="#1e293b" 
                    fadeDistance={300} 
                    position={[0, -4.95, 0]} 
                    transparent opacity={0.2} 
                />

                <Bounds fit margin={1.4}>
                    <Suspense fallback={<Html center><div style={{ color: '#86efac' }}>🌿 Syncing spatial twin…</div></Html>}>
                        <TerrainMesh glbBase64={glbBase64} metadata={metadata} />
                        <group>
                            {/* The Plot Slab (Thick and stable at Y=0) */}
                            <mesh position={[0, -1, 0]} castShadow receiveShadow>
                                <boxGeometry args={[plotSide, 2, plotSide]} />
                                {/* 0: +X, 1: -X, 2: +Y (Top), 3: -Y (Bottom), 4: +Z, 5: -Z */}
                                <meshStandardMaterial attach="material-0" color="#3f2e1e" roughness={1} /> 
                                <meshStandardMaterial attach="material-1" color="#3f2e1e" roughness={1} /> 
                                <meshStandardMaterial attach="material-2" color="#16a34a" roughness={0.7} /> {/* Grass Top at Y=0 */}
                                <meshStandardMaterial attach="material-3" color="#1a120b" roughness={1} /> 
                                <meshStandardMaterial attach="material-4" color="#3f2e1e" roughness={1} /> 
                                <meshStandardMaterial attach="material-5" color="#3f2e1e" roughness={1} /> 
                            </mesh>

                            {/* Border/Boundary Grid (Significant Offset from top) */}
                            <Grid 
                                args={[plotSide, plotSide]} 
                                cellColor="#86efac" 
                                sectionColor="#86efac" 
                                position={[0, 0.05, 0]} 
                                transparent 
                                opacity={0.3}
                                cellThickness={1}
                                sectionThickness={2}
                                infiniteGrid={false}
                                fadeDistance={plotSide * 2}
                            />

                            {/* Corner Boundary Stones */}
                            {[
                                [plotSide/2, 0.3, plotSide/2],
                                [-plotSide/2, 0.3, plotSide/2],
                                [plotSide/2, 0.3, -plotSide/2],
                                [-plotSide/2, 0.3, -plotSide/2]
                            ].map((pos, i) => (
                                <mesh key={i} position={pos} castShadow>
                                    <boxGeometry args={[0.2, 0.6, 0.2]} />
                                    <meshStandardMaterial color="#cbd5e1" roughness={0.4} />
                                </mesh>
                            ))}
                        </group>
                        
                        {/* Dynamic Components */}
                        {showHouse && sceneObjects.map((comp) => {
                            const isSelected = selectedId === comp.id;
                            
                            return (
                                <group 
                                    key={comp.id} 
                                    name={`comp-${comp.id}`}
                                    position={comp.position}
                                    rotation={comp.rotation || [0, 0, 0]}
                                    scale={comp.scale || [1, 1, 1]}
                                    ref={isSelected ? setTransformTarget : null}
                                    onPointerDown={(e) => {
                                        e.stopPropagation();
                                        setSelectedId(comp.id);
                                    }}
                                >
                                    {comp.path ? (
                                        <AssetModel path={comp.path} />
                                    ) : (
                                        (() => {
                                            const Component = COMPONENT_MAP[comp.type];
                                            return Component ? <Component /> : null;
                                        })()
                                    )}

                                    {isSelected && (
                                        <mesh position={[0, 0, 0]}>
                                            <boxGeometry args={[2.2, 2.2, 2.2]} />
                                            <meshBasicMaterial color="#86efac" wireframe transparent opacity={0.3} />
                                        </mesh>
                                    )}
                                </group>
                            );
                        })}
                    </Suspense>
                </Bounds>

                {/* TransformControls */}
                {selectedId && transformTarget && (
                    <TransformControls
                        object={transformTarget}
                        mode={transformMode}
                        onDraggingChanged={(e) => {
                            setIsDragging(e.value);
                            setOrbitEnabled(!e.value);
                        }}
                        onMouseUp={onTransformEnd}
                    />
                )}

                <OrbitControls
                    makeDefault
                    enabled={orbitEnabled && !selectedId}
                    autoRotate={!isDragging && !selectedId} 
                    autoRotateSpeed={0.5}
                    enablePan enableZoom enableRotate
                    minDistance={0.5} maxDistance={500}
                />
            </Canvas>

            {/* ── HUD Overlays ── */}
            <div style={{ position: 'absolute', top: 16, left: 16, display: 'flex', flexDirection: 'column', gap: 12, zIndex: 10 }}>
                {plotId && (
                    <button
                        onClick={handleDownload}
                        disabled={downloading}
                        style={{
                            background: 'rgba(15,23,42,0.8)', backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(134,239,172,0.3)',
                            borderRadius: 12, color: '#f0fdf4',
                            padding: '10px 16px', fontSize: 13, fontWeight: 600,
                            cursor: downloading ? 'not-allowed' : 'pointer',
                            display: 'flex', alignItems: 'center', gap: 8,
                            transition: 'all 0.2s',
                        }}
                    >
                        {downloading ? '⏳ Processing...' : '📄 Download Risk Report'}
                    </button>
                )}
                
                {selectedId && (
                    <div style={{
                        background: 'rgba(34,197,94,0.15)', backdropFilter: 'blur(10px)',
                        border: '1px solid #22c55e', borderRadius: 12, padding: '10px 16px',
                        color: '#86efac', fontSize: 12, display: 'flex', alignItems: 'center', gap: 10
                    }}>
                        <span>Editing: <b>{selectedComp?.type}</b></span>
                        <button onClick={() => setSelectedId(null)} style={{
                            background: '#22c55e', border: 'none', color: '#fff', 
                            borderRadius: 6, padding: '2px 8px', cursor: 'pointer', fontWeight: 700
                        }}>DONE</button>
                    </div>
                )}
            </div>

            {/* Plot Info Overlay (Fixed Position) */}
            {metadata && (
                <div style={{
                    position: 'absolute', bottom: 16, left: 16,
                    background: 'rgba(15,23,42,0.88)', backdropFilter: 'blur(10px)',
                    border: `1px solid ${borderCol(metadata.risk_score)}`, borderRadius: 16,
                    padding: '12px 18px', color: '#f0fdf4', fontFamily: 'Inter,sans-serif',
                    fontSize: 13, lineHeight: 1.6, zIndex: 10,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                }}>
                    <div style={{ fontWeight: 800, color: '#86efac', fontSize: 15, marginBottom: 4 }}>{metadata.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, opacity: 0.9 }}>
                        <span>📍 {metadata.location}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0', fontSize: 12 }}>
                        <span>📐 <b>{metadata.area}</b></span>
                        <span style={{ opacity: 0.3 }}>|</span>
                        <span>₹ <b>{metadata.price}</b></span>
                    </div>
                    <div style={{ 
                        marginTop: 8, padding: '6px 10px', borderRadius: 8,
                        background: `${borderCol(metadata.risk_score).replace('0.4', '0.1')}`,
                        border: `1px solid ${borderCol(metadata.risk_score)}`,
                        color: textCol(metadata.risk_score), fontWeight: 600,
                        display: 'flex', alignItems: 'center', gap: 6, fontSize: 12
                    }}>
                        {icon(metadata.risk_score)} {metadata.risk_label ?? metadata.risk_level?.split(' (')[0]}
                        &nbsp;— Score: {metadata.risk_score}/10
                    </div>
                </div>
            )}

            {/* Scale indicator */}
            <div style={{
                position: 'absolute', bottom: 16, right: 16,
                background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)',
                borderRadius: 8, padding: '6px 12px', color: '#94a3b8', fontSize: 10,
                pointerEvents: 'none'
            }}>
                1 Scene Unit ≈ 3 Meter Scale
            </div>
        </div>
    );
}
