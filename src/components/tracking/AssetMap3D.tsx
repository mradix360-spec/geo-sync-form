import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Asset } from '@/types/tracking';
import { createAssetMarker, createAssetLabel, latLonToVector3 } from '@/lib/threejsUtils';

interface AssetMap3DProps {
  assets: Asset[];
  selectedAsset?: Asset;
  onAssetSelect?: (asset: Asset) => void;
}

export const AssetMap3D = ({ assets, selectedAsset, onAssetSelect }: AssetMap3DProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const markersRef = useRef<Map<string, THREE.Group>>(new Map());

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 50, 100);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controlsRef.current = controls;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 50, 10);
    scene.add(directionalLight);

    // Grid
    const gridHelper = new THREE.GridHelper(200, 20, 0x444444, 0x222222);
    scene.add(gridHelper);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current || !camera || !renderer) return;
      
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      controls.dispose();
      renderer.dispose();
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  useEffect(() => {
    if (!sceneRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => {
      sceneRef.current!.remove(marker);
    });
    markersRef.current.clear();

    // Add new markers
    assets.forEach(asset => {
      if (!asset.coordinates) return;

      const [lng, lat] = asset.coordinates.coordinates;
      const position = latLonToVector3(lat, lng);

      const group = new THREE.Group();

      const marker = createAssetMarker(
        selectedAsset?.id === asset.id ? '#3b82f6' : '#64748b'
      );
      marker.position.copy(position);
      group.add(marker);

      const label = createAssetLabel(asset.name);
      label.position.copy(position);
      label.position.y += 3;
      group.add(label);

      sceneRef.current!.add(group);
      markersRef.current.set(asset.id, group);
    });

    // Center camera on assets
    if (assets.length > 0 && assets[0].coordinates) {
      const firstAsset = assets[0];
      const [lng, lat] = firstAsset.coordinates.coordinates;
      const centerPos = latLonToVector3(lat, lng);
      
      if (controlsRef.current) {
        controlsRef.current.target.copy(centerPos);
        controlsRef.current.update();
      }
    }
  }, [assets, selectedAsset]);

  return (
    <div ref={containerRef} className="w-full h-full rounded-lg overflow-hidden" />
  );
};
