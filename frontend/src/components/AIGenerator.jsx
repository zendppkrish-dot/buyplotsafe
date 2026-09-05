import React, { useState, useEffect, Suspense, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { Stage, OrbitControls, Gltf, useGLTF, useFBX, TransformControls, Environment, Center } from '@react-three/drei';
import { Sparkles, Loader2, CheckCircle2 } from 'lucide-react';
import RiskAnalysisOverlay from './RiskAnalysisOverlay';
import * as THREE from 'three';

const TARGET_MODEL_SIZE = {
  house: 3.6,
  part: 0.9,
  default: 2.0,
};

function NormalizedObject({ object, scene, interactionMode, onUpdateObject, onSelectObject, orbitControlsRef, isSelected, ...props }) {
  const groupRef = useRef();
  const dragPlane = React.useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), []);
  const dragOffsetRef = useRef(new THREE.Vector3());
  const isDraggingRef = useRef(false);

  const normalizedScene = React.useMemo(() => {
    const clonedScene = scene.clone();
    const bounds = new THREE.Box3().setFromObject(clonedScene);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    const maxDimension = Math.max(size.x, size.y, size.z, 0.001);
    const targetSize = TARGET_MODEL_SIZE[object?.type] || TARGET_MODEL_SIZE.default;
    const normalizationFactor = targetSize / maxDimension;

    clonedScene.position.sub(center);
    clonedScene.position.y += size.y / 2;
    clonedScene.scale.setScalar(normalizationFactor);
    return clonedScene;
  }, [object?.type, scene]);

  const syncObject = () => {
    if (!groupRef.current || !onUpdateObject) {
      return;
    }

    onUpdateObject(
      object.instanceId,
      groupRef.current.position.toArray(),
      groupRef.current.rotation.toArray(),
      groupRef.current.scale.toArray()
    );
  };

  const handlePointerDown = (event) => {
    event.stopPropagation();
    onSelectObject?.(object);

    if (object.type !== 'part' || !groupRef.current) {
      return;
    }

    const hitPoint = new THREE.Vector3();
    if (!event.ray.intersectPlane(dragPlane, hitPoint)) {
      return;
    }

    isDraggingRef.current = true;
    dragOffsetRef.current.copy(hitPoint).sub(groupRef.current.position);

    if (orbitControlsRef?.current) {
      orbitControlsRef.current.enabled = false;
    }
  };

  const handlePointerMove = (event) => {
    if (!isDraggingRef.current || object.type !== 'part' || !groupRef.current) {
      return;
    }

    event.stopPropagation();
    const hitPoint = new THREE.Vector3();
    if (!event.ray.intersectPlane(dragPlane, hitPoint)) {
      return;
    }

    const nextPosition = hitPoint.sub(dragOffsetRef.current);
    groupRef.current.position.set(nextPosition.x, groupRef.current.position.y, nextPosition.z);
    syncObject();
  };

  const stopDragging = (event) => {
    event?.stopPropagation?.();
    if (!isDraggingRef.current) {
      return;
    }

    isDraggingRef.current = false;
    if (orbitControlsRef?.current) {
      orbitControlsRef.current.enabled = true;
    }
    syncObject();
  };

  const objectNode = (
    <group
      ref={groupRef}
      position={object.position || [6, 1, 0]}
      rotation={object.rotation || [0, 0, 0]}
      scale={object.scale || [1, 1, 1]}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={stopDragging}
      onPointerOut={stopDragging}
    >
      <primitive object={normalizedScene} dispose={null} {...props} />
    </group>
  );

  if (!isSelected) {
    return objectNode;
  }

  return (
    <TransformControls mode={interactionMode} onMouseUp={syncObject}>
      {objectNode}
    </TransformControls>
  );
}

function GLTFObject({ object, url, interactionMode, onUpdateObject, onSelectObject, orbitControlsRef, isSelected, ...props }) {
  const gltf = useGLTF(url);
  return <NormalizedObject object={object} scene={gltf.scene} interactionMode={interactionMode} onUpdateObject={onUpdateObject} onSelectObject={onSelectObject} orbitControlsRef={orbitControlsRef} isSelected={isSelected} {...props} />;
}

function FBXObject({ object, url, interactionMode, onUpdateObject, onSelectObject, orbitControlsRef, isSelected, ...props }) {
  const fbx = useFBX(url);
  return <NormalizedObject object={object} scene={fbx} interactionMode={interactionMode} onUpdateObject={onUpdateObject} onSelectObject={onSelectObject} orbitControlsRef={orbitControlsRef} isSelected={isSelected} {...props} />;
}

function SceneObject({ object, interactionMode, onUpdateObject, onSelectObject, orbitControlsRef, isSelected, ...props }) {
  const url = object?.modelUrl || object?.glb_url || object?.url || object;

  // Check explicit format field first (from catalog), then fall back to URL extension
  const isFBX =
    object?.format === 'fbx' ||
    (typeof url === 'string' && url.toLowerCase().endsWith('.fbx'));

  console.log('Rendering object:', url, '| format:', object?.format, '| isFBX:', isFBX);

  return isFBX ? (
    <FBXObject object={object} url={url} interactionMode={interactionMode} onUpdateObject={onUpdateObject} onSelectObject={onSelectObject} orbitControlsRef={orbitControlsRef} isSelected={isSelected} {...props} />
  ) : (
    <GLTFObject object={object} url={url} interactionMode={interactionMode} onUpdateObject={onUpdateObject} onSelectObject={onSelectObject} orbitControlsRef={orbitControlsRef} isSelected={isSelected} {...props} />
  );
}
export default function AIGenerator({
  plotId = "1",
  plotImage = "https://images.unsplash.com/photo-1524813686514-a57563d77965?auto=format&fit=crop&q=80&w=1200",
  sceneObjects = [],
  interactionMode = 'translate',
  onUpdateObject,
  onSelectObject,
  selectedObjectId,
  selectedPlot,
  modelUrl: propModelUrl
}) {
  const [state, setState] = useState('Idle'); // 'Idle', 'Generating', 'Done'
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Scanning Topography...');
  const orbitControlsRef = useRef(null);

  // Prioritize passed modelUrl, fallback to pattern-based path
  // If plotId is a number > 6 (not in catalog), fallback to plot1.glb
  const modelUrl = propModelUrl || 
                   (parseInt(plotId) > 6 ? '/models/plots/plot1.glb' : `/models/plots/plot${plotId}.glb`);

  useEffect(() => {
    if (state === 'Generating') {
      const steps = [
        { progress: 12, text: 'Analyzing Geometry...', delay: 500 },
        { progress: 45, text: 'Mapping Terrain...', delay: 1800 },
        { progress: 89, text: 'Applying Textures...', delay: 3500 },
        { progress: 100, text: 'Finalizing...', delay: 4800 }
      ];

      const timeouts = steps.map(step => {
        return setTimeout(() => {
          setProgress(step.progress);
          setStatusText(step.text);
          if (step.progress === 100) {
            setTimeout(() => setState('Done'), 800); // Small pause at 100% before transition
          }
        }, step.delay);
      });

      return () => timeouts.forEach(clearTimeout);
    }
  }, [state]);

  const handleGenerate = () => {
    setState('Generating');
    setProgress(0);
  };

  return (
    <div className="w-full max-w-5xl mx-auto rounded-[32px] overflow-hidden border border-white/5 shadow-2xl bg-slate-950 font-inter">
      <div className="relative aspect-[16/9] bg-black flex items-center justify-center overflow-hidden">

        {/* ── 2D Image View & Overlay (Idle / Generating) ── */}
        <div className={`absolute inset-0 transition-opacity duration-1000 ${state === 'Done' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          <img src={plotImage} alt="2D Plot Blueprint" className="w-full h-full object-cover opacity-40 blur-[2px]" />

          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent">
            {state === 'Idle' && (
              <div className="text-center animate-in fade-in zoom-in duration-500">
                <div className="mb-6 inline-flex p-4 rounded-3xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.15)]">
                  <Sparkles className="w-10 h-10" />
                </div>
                <h2 className="text-4xl font-black text-white mb-4 tracking-tight">Generate 3D Plot</h2>
                <p className="text-slate-400 mb-10 max-w-lg mx-auto text-sm font-medium leading-relaxed">
                  Transform this static 2D blueprint into an immersive, interactive 3D digital twin using our proprietary spatial AI pipeline.
                </p>
                <button
                  onClick={handleGenerate}
                  className="group relative inline-flex items-center gap-3 px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest transition-all active:scale-[0.98] shadow-[0_0_30px_rgba(16,185,129,0.25)] hover:shadow-[0_0_50px_rgba(16,185,129,0.4)] overflow-hidden"
                >
                  <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                  <span className="relative z-10 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Generate 3D Plot
                  </span>
                </button>
              </div>
            )}

            {state === 'Generating' && (
              <div className="w-full max-w-sm bg-slate-950/60 backdrop-blur-2xl border border-white/10 rounded-[24px] p-8 shadow-2xl animate-in slide-in-from-bottom-8 duration-500">
                <div className="flex items-center justify-between mb-5">
                  <span className="text-emerald-400 font-bold uppercase tracking-widest text-[10px] flex items-center gap-2">
                    {progress === 100 ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    {statusText}
                  </span>
                  <span className="text-white font-mono font-black text-sm">{progress}%</span>
                </div>

                <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden relative">
                  <div
                    className="absolute top-0 left-0 h-full bg-emerald-500 transition-all duration-700 ease-out"
                    style={{ width: `${progress}%` }}
                  >
                    <div className="absolute top-0 right-0 w-8 h-full bg-gradient-to-r from-transparent to-white/40" />
                  </div>
                </div>
                <p className="text-[9px] text-slate-500 mt-5 text-center uppercase tracking-widest font-black opacity-60">
                  Plot Generator
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── 3D Canvas View (Done) ── */}
        <div className={`absolute inset-0 transition-all duration-1000 ${state === 'Done' ? 'opacity-100 scale-100' : 'opacity-0 scale-110 pointer-events-none'}`}>
          {state === 'Done' && (
            <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 3, 10], fov: 50 }}>
              <color attach="background" args={['#020617']} />
              <ambientLight intensity={0.4} />

              <Suspense fallback={null}>
                <Environment preset="city" />
                <Center disableY position={[0, -0.1, 0]}>
                  <Gltf src={modelUrl} scale={[9, 9, 9]} />
                </Center>
                <group>
                  <Suspense fallback={null}>
                    {sceneObjects.map((obj) => (
                      <SceneObject
                        key={obj.instanceId}
                        object={obj}
                        interactionMode={interactionMode}
                        onUpdateObject={onUpdateObject}
                        onSelectObject={onSelectObject}
                        orbitControlsRef={orbitControlsRef}
                        isSelected={selectedObjectId === obj.instanceId}
                      />
                    ))}
                  </Suspense>
                </group>
              </Suspense>

              <OrbitControls ref={orbitControlsRef} makeDefault enablePan={false} maxPolarAngle={Math.PI / 2.1} />
            </Canvas>
          )}

          {/* Live View HUD */}
          {state === 'Done' && (
            <div className="absolute top-6 left-6 flex flex-col gap-3 pointer-events-none animate-in fade-in duration-1000 delay-500">
              <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black tracking-widest uppercase px-4 py-2 rounded-xl backdrop-blur-md flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                Live 3D Twin Generated
              </span>
            </div>
          )}
        </div>
        
        {/* Risk Analysis Overlay - Persistent visibility within viewport */}
        {selectedPlot && (
          <RiskAnalysisOverlay plotId={selectedPlot.id} />
        )}
      </div>
    </div>
  );
}
