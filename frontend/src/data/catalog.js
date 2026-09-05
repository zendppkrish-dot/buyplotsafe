import assetCatalog from '../assets_catalog.json';

const createPartThumbnail = (label) => {
    const displayLabel = label.replace(/-/g, ' ').toUpperCase();
    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
            <defs>
                <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#0f172a" />
                    <stop offset="100%" stop-color="#1e293b" />
                </linearGradient>
            </defs>
            <rect width="400" height="400" rx="36" fill="url(#bg)" />
            <rect x="56" y="56" width="288" height="288" rx="28" fill="#111827" stroke="#334155" stroke-width="6" />
            <path d="M140 236h120M164 200h72M184 164h32" stroke="#10b981" stroke-width="14" stroke-linecap="round" />
            <text x="200" y="296" fill="#cbd5e1" font-family="Arial, sans-serif" font-size="26" font-weight="700" text-anchor="middle">
                ${displayLabel.slice(0, 18)}
            </text>
        </svg>
    `;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

const toPublicModelPath = (sourcePath) => {
    const segments = sourcePath.split('/');
    const folderName = segments[segments.length - 2];
    const extension = segments[segments.length - 1].split('.').pop()?.toLowerCase() || 'fbx';
    const rawId = segments[segments.length - 1]
        .replace(/\.[^.]+$/, '')
        .toLowerCase()
        .replace(/[\s-]+/g, '_');
    const fileName = `part_${rawId}.${extension}`;
    return `/models/parts/${[folderName, fileName].map(encodeURIComponent).join('/')}`;
};

const buildPartCatalog = () => (
    assetCatalog.map((asset) => ({
        id: asset.id,
        name: asset.label.replace(/-/g, ' '),
        thumbnail: createPartThumbnail(asset.label),
        glb_url: toPublicModelPath(asset.path),
        type: 'part',
        format: asset.path.toLowerCase().endsWith('.fbx') ? 'fbx' : 'glb',
    }))
);

export const RAW_CATALOG = {
    plots: [
        { 
            id: 'plot_1', 
            name: 'Wayanad Hillside', 
            thumbnail: 'https://images.unsplash.com/photo-1524813686514-a57563d77965?auto=format&fit=crop&w=800&q=80', 
            glb_url: '/models/plots/plot1.glb', 
            format: 'glb', 
            type: 'plot',
            price: '₹45L',
            lat: 11.5833,
            lng: 76.1333,
            risk_level: 'Safe',
            safety_score: 9.2,
            location: 'Meppadi, Wayanad',
            area: '12 Cents',
            description: 'Verified Safe Zone. Sufficient clearance from known KSDMA hazard zones.'
        },
        { 
            id: 'plot_2', 
            name: 'Standard Plot', 
            thumbnail: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80', 
            glb_url: '/models/plots/plot2.glb', 
            format: 'glb', 
            type: 'plot',
            price: '₹28L',
            lat: 11.8333,
            lng: 75.9667,
            risk_level: 'Moderate Risk',
            safety_score: 5.4,
            location: 'Mananthavady, Wayanad',
            area: '8 Cents',
            description: 'GEOSPATIAL WARNING: Located in the buffer zone of Mananthavady hazard area.'
        },
        { 
            id: 'plot_3', 
            name: 'Corner Plot', 
            thumbnail: 'https://images.unsplash.com/photo-1590069230002-df267a0bb8d3?auto=format&fit=crop&w=800&q=80', 
            glb_url: '/models/plots/plot3.glb', 
            format: 'glb', 
            type: 'plot',
            price: '₹62L',
            lat: 11.6000,
            lng: 76.0833,
            risk_level: 'High Risk',
            safety_score: 2.1,
            location: 'Chooralmala, Wayanad',
            area: '15 Cents',
            description: 'KSDMA ALERT: Critical proximity to Chooralmala Landslide Zone. Construction Restricted.'
        }
    ],
    houses: [
        { id: 'house_1', name: 'Modern Kerala Villa', thumbnail: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=300&q=80', modelUrl: '/models/houses/house_1.glb', format: 'glb', type: 'house' },
        { id: 'house_2', name: 'Modern Villa', thumbnail: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=300&q=80', glb_url: '/models/houses/house_2.glb', format: 'glb', type: 'house' },
        { id: 'house_3', name: 'Traditional Home', thumbnail: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=300&q=80', glb_url: '/models/houses/house_3.glb', format: 'glb', type: 'house' }
    ],
    parts: buildPartCatalog(),
};
