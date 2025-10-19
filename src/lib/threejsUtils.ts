import * as THREE from 'three';

export const createAssetMarker = (color: string = '#3b82f6'): THREE.Mesh => {
  const geometry = new THREE.ConeGeometry(0.5, 2, 8);
  const material = new THREE.MeshPhongMaterial({ 
    color,
    emissive: color,
    emissiveIntensity: 0.2
  });
  const marker = new THREE.Mesh(geometry, material);
  marker.rotation.x = Math.PI;
  return marker;
};

export const createAssetLabel = (text: string): THREE.Sprite => {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  
  if (!context) {
    return new THREE.Sprite();
  }

  canvas.width = 256;
  canvas.height = 64;
  
  context.fillStyle = 'rgba(0, 0, 0, 0.7)';
  context.fillRect(0, 0, canvas.width, canvas.height);
  
  context.font = 'Bold 20px Arial';
  context.fillStyle = 'white';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(text, canvas.width / 2, canvas.height / 2);
  
  const texture = new THREE.CanvasTexture(canvas);
  const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
  const sprite = new THREE.Sprite(spriteMaterial);
  sprite.scale.set(4, 1, 1);
  
  return sprite;
};

export const latLonToVector3 = (lat: number, lon: number, scale: number = 100): THREE.Vector3 => {
  // Simple equirectangular projection for demo
  const x = lon * scale;
  const z = -lat * scale;
  return new THREE.Vector3(x, 0, z);
};
