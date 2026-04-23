import React, { useState } from 'react';
import imageCompression from 'browser-image-compression';
import { useNavigate } from 'react-router-dom';
import { MapPin, IndianRupee, Ruler, FileText, ArrowLeft, Save, Image as ImageIcon, X, Box } from 'lucide-react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stage, useGLTF, Environment } from '@react-three/drei';
import { KeralaHouse } from '../components/KeralaHouse';

const keralaDistricts = [
    "Alappuzha", "Ernakulam", "Idukki", "Kannur", "Kasaragod",
    "Kollam", "Kottayam", "Kozhikode", "Malappuram", "Palakkad",
    "Pathanamthitta", "Thiruvananthapuram", "Thrissur", "Wayanad"
];

const AddPlot = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [show3DModal, setShow3DModal] = useState(false);
    const [glbUrl, setGlbUrl] = useState(null);
    const [uploadStage, setUploadStage] = useState('idle'); // 'idle', 'uploading', 'checking_risk', 'saving'
    const [imageFile, setImageFile] = useState(null); // To store the actual file
    const [imagePreview, setImagePreview] = useState(null); // To store the UI preview URL
    const [uploadProgress, setUploadProgress] = useState(0); // Progress percentage
    const [formData, setFormData] = useState({
        name: '',
        district: 'Ernakulam',
        price: '',
        area: '',
        latitude: '',
        longitude: '',
        description: ''
    });

    // Handle token check on mount
    React.useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            alert("You must be logged in to add a plot.");
            navigate('/login');
        }
    }, [navigate]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Handle 3D Preview
    const handlePreview3D = async () => {
        if (!formData.area) {
            alert("Please enter the plot area first.");
            return;
        }

        setPreviewLoading(true);
        try {
            // Calculate dimensions from cents (approx)
            // 1 Cent = 435.6 sq ft. We'll assuming a square plot for preview.
            const totalSqFt = parseFloat(formData.area) * 435.6;
            const side = Math.sqrt(totalSqFt);

            const response = await fetch('/api/generate-plot-3d', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ length: side, width: side })
            });

            if (!response.ok) throw new Error("Failed to generate 3D model");

            const data = await response.json();
            // Convert Base64 to a Blob URL
            const binaryData = atob(data.glb_base64);
            const array = new Uint8Array(binaryData.length);
            for (let i = 0; i < binaryData.length; i++) array[i] = binaryData.charCodeAt(i);
            const blob = new Blob([array], { type: 'model/gltf-binary' });
            const url = URL.createObjectURL(blob);

            setGlbUrl(url);
            setShow3DModal(true);
        } catch (error) {
            console.error("3D Preview Error:", error);
            alert("Could not generate 3D preview. Is the backend running?");
        } finally {
            setPreviewLoading(false);
        }
    };

    // 3D Model Component
    const PlotModel = ({ url }) => {
        const { scene } = useGLTF(url);
        return <primitive object={scene} />;
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);

            // --- Instant Local Preview (Canvas) ---
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    // Create a 300px thumbnail
                    const scale = 300 / Math.max(img.width, img.height);
                    canvas.width = img.width * scale;
                    canvas.height = img.height * scale;
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    setImagePreview(canvas.toDataURL('image/jpeg', 0.8));
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const token = localStorage.getItem('token');
        if (!token) {
            alert("You must be logged in to add a plot.");
            navigate('/login');
            return;
        }

        try {
            let imageUrl = "";
            let processedImage = imageFile;

            // 1. Compress Image
            if (imageFile) {
                setUploadStage('uploading'); // Misnomer for compression for simplicity, or add a stage
                console.log('[COMPRESS] Original size:', (imageFile.size / 1024 / 1024).toFixed(2), 'MB');
                const options = {
                    maxSizeMB: 1,
                    maxWidthOrHeight: 1920,
                    useWebWorker: true
                };
                try {
                    processedImage = await imageCompression(imageFile, options);
                    console.log('[COMPRESS] Compressed size:', (processedImage.size / 1024 / 1024).toFixed(2), 'MB');
                } catch (compressError) {
                    console.error('[COMPRESS] Compression failed:', compressError);
                    // Fallback to original image if compression fails
                }
            }

            // 2. Upload Image and Metadata to FastAPI Backend
            if (processedImage) {
                setUploadStage('uploading');
                setUploadProgress(0);

                const uploadFormData = new FormData();
                // Pass the original file name to preserve the extension (.glb, .obj, .jpg, etc)
                uploadFormData.append('file', processedImage, imageFile.name);

                // Decode token payload to get user email (simple way)
                let userEmail = 'Guest';
                try {
                    const payload = JSON.parse(atob(token.split('.')[1]));
                    userEmail = payload.sub || 'Guest';
                    console.log('[DEBUG] Uploading as:', userEmail);
                } catch (e) {
                    console.warn('[AUTH] Could not decode token for metadata');
                }

                // Add plot metadata to the same request
                const plotMetadata = {
                    ...formData,
                    sellerId: userEmail, // Using email as identifier since UID is gone
                    sellerEmail: userEmail,
                };
                uploadFormData.append('metadata', JSON.stringify(plotMetadata));

                await new Promise((resolve, reject) => {
                    const xhr = new XMLHttpRequest();
                    const url = '/api/upload';
                    console.log('Attempting to connect to:', url);
                    xhr.open('POST', url);
                    xhr.setRequestHeader('Authorization', `Bearer ${token}`);

                    xhr.upload.onprogress = (event) => {
                        if (event.lengthComputable) {
                            const percent = Math.round((event.loaded / event.total) * 100);
                            setUploadProgress(percent);
                        }
                    };

                    xhr.onload = () => {
                        if (xhr.status >= 200 && xhr.status < 300) {
                            const data = JSON.parse(xhr.responseText);
                            console.log('[OPTIMIZED] Server Response:', data);
                            resolve();
                        } else {
                            reject(new Error(`Upload failed: ${xhr.statusText}`));
                        }
                    };

                    xhr.onerror = () => {
                        const errorMsg = 'Network Error: Could not connect to the backend server. Please ensure the Python FastAPI server is running at /api';
                        alert(errorMsg);
                        reject(new Error(errorMsg));
                    };
                    xhr.send(uploadFormData);
                });

                setUploadStage('idle');
                alert("Listed! Processing complete in the background. Redirecting...");
                navigate('/gallery');
            }
        } catch (error) {
            console.error("Error adding plot:", error);
            alert(error.message || "Failed to add plot. Please try again.");
            setUploadStage('idle');
        } finally {
            setLoading(false);
        }
    };

    const getLoadingMessage = () => {
        switch (uploadStage) {
            case 'uploading': return 'Uploading Image...';
            case 'checking_risk': return 'Analyzing Risk...';
            case 'saving': return 'Finalizing Listing...';
            default: return 'Processing...';
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 text-white flex justify-center items-center p-4">
            <div className="bg-slate-800/50 backdrop-blur-md border border-white/10 rounded-2xl p-8 w-full max-w-2xl shadow-xl">

                <div className="flex items-center gap-4 mb-8">
                    <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-white transition-colors">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h2 className="text-2xl font-bold text-white">List a New Plot</h2>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* --- Image Upload Section --- */}
                    {uploadStage === 'uploading' && (
                        <div className="w-full bg-slate-700/50 rounded-full h-1.5 mb-2 overflow-hidden">
                            <div
                                className="bg-emerald-500 h-full transition-all duration-300 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                                style={{ width: `${uploadProgress}%` }}
                            ></div>
                        </div>
                    )}
                    <label className="block text-slate-400 text-sm mb-2 flex justify-between">
                        <span>Property Image</span>
                        {uploadStage === 'uploading' && <span className="text-emerald-400 font-mono text-xs">{uploadProgress}%</span>}
                    </label>
                    <div className="flex items-center justify-center w-full">
                        {imagePreview ? (
                            <div className="relative w-full h-48 rounded-lg overflow-hidden border border-slate-700">
                                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                <button
                                    type="button"
                                    onClick={() => { setImagePreview(null); setImageFile(null); }}
                                    className="absolute top-2 right-2 bg-red-500 p-1 rounded-full hover:bg-red-600"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-700 border-dashed rounded-lg cursor-pointer bg-slate-900/50 hover:bg-slate-800 transition-colors">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <ImageIcon className="w-8 h-8 text-slate-500 mb-2" />
                                    <p className="text-sm text-slate-400">Click to upload plot photo</p>
                                </div>
                                <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                            </label>
                        )}
                    </div>

                    {/* Plot Name */}
                    <div>
                        <label className="block text-slate-400 text-sm mb-2">Plot Title</label>
                        <div className="relative">
                            <FileText className="absolute left-3 top-3 text-slate-500 w-5 h-5" />
                            <input
                                type="text"
                                name="name"
                                required
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="e.g. Riverside Plot in Aluva"
                                className="w-full bg-slate-900/50 border border-slate-700 text-white py-3 pl-10 pr-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                            />
                        </div>
                    </div>

                    {/* District & Price Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-slate-400 text-sm mb-2">District</label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-3 text-slate-500 w-5 h-5" />
                                <select
                                    name="district"
                                    value={formData.district}
                                    onChange={handleChange}
                                    className="w-full bg-slate-900/50 border border-slate-700 text-white py-3 pl-10 pr-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/50 appearance-none"
                                >
                                    {keralaDistricts.map(dist => (
                                        <option key={dist} value={dist} className="bg-slate-800">{dist}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-slate-400 text-sm mb-2">Price (in Lakhs)</label>
                            <div className="relative">
                                <IndianRupee className="absolute left-3 top-3 text-slate-500 w-5 h-5" />
                                <input
                                    type="number"
                                    name="price"
                                    required
                                    min="0"
                                    value={formData.price}
                                    onChange={handleChange}
                                    placeholder="e.g. 45"
                                    className="w-full bg-slate-900/50 border border-slate-700 text-white py-3 pl-10 pr-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Area & Coordinates Row */}
                    {/* Area & Coordinates Row */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div className="md:col-span-2">
                            <label className="block text-slate-400 text-sm mb-2">Area (Cents)</label>
                            <div className="relative">
                                <Ruler className="absolute left-3 top-3 text-slate-500 w-5 h-5" />
                                <input
                                    type="number"
                                    name="area"
                                    required
                                    min="0"
                                    step="0.01"
                                    value={formData.area}
                                    onChange={handleChange}
                                    placeholder="e.g. 10.5"
                                    className="w-full bg-slate-900/50 border border-slate-700 text-white py-3 pl-10 pr-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                />
                            </div>
                        </div>

                        <div className="md:col-span-2">
                            <button
                                type="button"
                                onClick={handlePreview3D}
                                disabled={previewLoading}
                                className="w-full h-[50px] bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/20"
                            >
                                {previewLoading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Box className="w-5 h-5" />
                                        Preview 3D
                                    </>
                                )}
                            </button>
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-slate-400 text-sm mb-2">Latitude</label>
                            <input
                                type="number"
                                name="latitude"
                                required
                                step="any"
                                value={formData.latitude}
                                onChange={handleChange}
                                placeholder="e.g. 10.8505"
                                className="w-full bg-slate-900/50 border border-slate-700 text-white py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-slate-400 text-sm mb-2">Longitude</label>
                            <input
                                type="number"
                                name="longitude"
                                required
                                step="any"
                                value={formData.longitude}
                                onChange={handleChange}
                                placeholder="e.g. 76.2711"
                                className="w-full bg-slate-900/50 border border-slate-700 text-white py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-slate-400 text-sm mb-2">Description</label>
                        <textarea
                            name="description"
                            rows="4"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Describe the property features, access to roads, etc..."
                            className="w-full bg-slate-900/50 border border-slate-700 text-white py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none"
                        ></textarea>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20"
                    >
                        {loading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                {getLoadingMessage()}
                            </>
                        ) : (
                            <>
                                <Save className="w-5 h-5" />
                                List Property
                            </>
                        )}
                    </button>
                </form>
            </div >

            {/* --- 3D Preview Modal --- */}
            {
                show3DModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                        <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl">
                            <div className="p-4 border-b border-white/5 flex justify-between items-center bg-slate-800/50">
                                <h3 className="font-bold flex items-center gap-2">
                                    <Box className="text-indigo-400" />
                                    3D Plot Visualization
                                </h3>
                                <button onClick={() => setShow3DModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="h-[500px] relative bg-[#0a0a0f]">
                                <Canvas camera={{ position: [20, 20, 20], fov: 45 }}>
                                    <ambientLight intensity={0.5} />
                                    <pointLight position={[10, 10, 10]} intensity={1} />
                                    <Environment preset="city" />

                                    <Stage environment="city" intensity={0.5}>
                                        {/* 1. The Dynamic Land Plot from FastAPI */}
                                        {glbUrl && <PlotModel url={glbUrl} />}

                                        {/* 2. Your New Kerala House Component */}
                                        {/* position={[0, 0.51, 0]} ensures it sits slightly above the land surface to prevent flickering */}
                                        <KeralaHouse position={[0, 0.51, 0]} scale={[0.8, 0.8, 0.8]} />
                                    </Stage>

                                    <OrbitControls autoRotate />
                                </Canvas>


                                <div className="absolute bottom-4 left-4 bg-slate-900/80 p-3 rounded-lg border border-white/5 text-xs text-slate-400 max-w-xs">
                                    <p>• Visualizing {formData.area} cents as a square plot</p>
                                    <p>• Height represents standard elevation (0.5 units)</p>
                                </div>
                            </div>

                            <div className="p-4 bg-slate-800/30 text-center text-sm text-slate-500 italic">
                                Drag to rotate • Scroll to zoom
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default AddPlot;
