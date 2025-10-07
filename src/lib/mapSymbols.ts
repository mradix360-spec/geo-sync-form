import L from 'leaflet';

export const SYMBOL_TYPES = [
  { id: 'circle', name: 'Circle', icon: '●' },
  { id: 'square', name: 'Square', icon: '■' },
  { id: 'triangle', name: 'Triangle', icon: '▲' },
  { id: 'star', name: 'Star', icon: '★' },
  { id: 'diamond', name: 'Diamond', icon: '◆' },
  { id: 'heart', name: 'Heart', icon: '♥' },
  { id: 'pin', name: 'Pin', icon: '📍' },
  { id: 'flag', name: 'Flag', icon: '⚑' },
  { id: 'cross', name: 'Cross', icon: '✚' },
  { id: 'pentagon', name: 'Pentagon', icon: '⬟' },
] as const;

export type SymbolType = typeof SYMBOL_TYPES[number]['id'];

export const SYMBOL_SIZES = [
  { id: 'small', name: 'Small', size: 20 },
  { id: 'medium', name: 'Medium', size: 30 },
  { id: 'large', name: 'Large', size: 40 },
] as const;

export type SymbolSize = typeof SYMBOL_SIZES[number]['id'];

const getSVGPath = (type: SymbolType): string => {
  switch (type) {
    case 'circle':
      return '<circle cx="15" cy="15" r="12" />';
    case 'square':
      return '<rect x="5" y="5" width="20" height="20" />';
    case 'triangle':
      return '<polygon points="15,5 25,25 5,25" />';
    case 'star':
      return '<polygon points="15,2 18,12 28,12 20,18 23,28 15,22 7,28 10,18 2,12 12,12" />';
    case 'diamond':
      return '<polygon points="15,3 27,15 15,27 3,15" />';
    case 'heart':
      return '<path d="M15,27 C15,27 3,18 3,12 C3,8 5,5 9,5 C12,5 15,8 15,8 C15,8 18,5 21,5 C25,5 27,8 27,12 C27,18 15,27 15,27 Z" />';
    case 'pin':
      return '<path d="M15,3 C10,3 6,7 6,12 C6,18 15,28 15,28 C15,28 24,18 24,12 C24,7 20,3 15,3 Z M15,15 C13,15 11,13 11,11 C11,9 13,7 15,7 C17,7 19,9 19,11 C19,13 17,15 15,15 Z" />';
    case 'flag':
      return '<path d="M5,5 L5,28 M5,5 L23,10 L5,15 Z" stroke-width="2" />';
    case 'cross':
      return '<path d="M15,5 L15,25 M5,15 L25,15" stroke-width="3" />';
    case 'pentagon':
      return '<polygon points="15,3 27,11 22,25 8,25 3,11" />';
    default:
      return '<circle cx="15" cy="15" r="12" />';
  }
};

export const createCustomIcon = (
  symbolType: SymbolType,
  color: string,
  size: SymbolSize = 'medium'
): L.DivIcon => {
  const sizeConfig = SYMBOL_SIZES.find(s => s.id === size) || SYMBOL_SIZES[1];
  const iconSize = sizeConfig.size;
  
  const svg = `
    <svg width="${iconSize}" height="${iconSize}" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg">
      <g fill="${color}" stroke="#fff" stroke-width="1.5">
        ${getSVGPath(symbolType)}
      </g>
    </svg>
  `;

  return L.divIcon({
    html: svg,
    className: 'custom-marker-icon',
    iconSize: [iconSize, iconSize],
    iconAnchor: [iconSize / 2, symbolType === 'pin' ? iconSize : iconSize / 2],
    popupAnchor: [0, symbolType === 'pin' ? -iconSize : -iconSize / 2],
  });
};
