export type Bounds = [[number, number], [number, number]];

export type MapProjection = {
  svgPath: string | null;
  svgLayer: string | null;
  transform: [number, number, number, number];
  bounds: Bounds;
  svgBounds?: Bounds;
  coordinateRotation: number;
};

export type Point = { x: number; y: number };

const SVG_BASE = 'https://assets.tarkov.dev/maps/svg';

const projections: Record<string, MapProjection> = {
  customs: {
    svgPath: `${SVG_BASE}/Customs.svg`,
    svgLayer: 'Ground_Level',
    transform: [0.239, 168.65, 0.239, 136.35],
    bounds: [[698, -307], [-372, 237]],
    coordinateRotation: 180,
  },
  factory: {
    svgPath: `${SVG_BASE}/Factory.svg`,
    svgLayer: 'Ground_Floor',
    transform: [1.629, 119.9, 1.629, 139.3],
    bounds: [[77, -64.5], [-65.5, 67.4]],
    coordinateRotation: 90,
  },
  'ground-zero': {
    svgPath: `${SVG_BASE}/GroundZero.svg`,
    svgLayer: 'Ground_Level',
    transform: [0.524, 167.3, 0.524, 65.1],
    bounds: [[249, -124], [-99, 364]],
    coordinateRotation: 180,
  },
  icebreaker: {
    svgPath: null,
    svgLayer: null,
    transform: [2, 125, 3.5, 91],
    bounds: [[77, -64.5], [-65.5, 67.4]],
    coordinateRotation: 180,
  },
  interchange: {
    svgPath: `${SVG_BASE}/Interchange.svg`,
    svgLayer: 'Ground_Level',
    transform: [0.265, 150.6, 0.265, 134.6],
    bounds: [[598, -442], [-433, 426]],
    coordinateRotation: 180,
  },
  lighthouse: {
    svgPath: `${SVG_BASE}/Lighthouse.svg`,
    svgLayer: 'Ground_Level',
    transform: [0.2, 0, 0.2, 0],
    bounds: [[515, -998], [-545, 725]],
    coordinateRotation: 180,
  },
  reserve: {
    svgPath: `${SVG_BASE}/Reserve.svg`,
    svgLayer: 'Ground_Level',
    transform: [0.395, 122, 0.395, 137.65],
    bounds: [[289, -293], [-303, 244]],
    svgBounds: [[289, -274], [-303, 272]],
    coordinateRotation: 180,
  },
  shoreline: {
    svgPath: `${SVG_BASE}/Shoreline.svg`,
    svgLayer: 'Ground_Level',
    transform: [0.16, 83.2, 0.16, 111.1],
    bounds: [[504, -415], [-1056, 618]],
    coordinateRotation: 180,
  },
  'streets-of-tarkov': {
    svgPath: `${SVG_BASE}/StreetsOfTarkov.svg`,
    svgLayer: 'Ground_Level',
    transform: [0.38, 0, 0.38, 0],
    bounds: [[323, -295], [-280, 532]],
    coordinateRotation: 180,
  },
  terminal: {
    svgPath: `${SVG_BASE}/Terminal.svg`,
    svgLayer: 'Ground_Level',
    transform: [0.2, 0, 0.2, 0],
    bounds: [[463, -580], [-433, 475]],
    coordinateRotation: 180,
  },
  'the-lab': {
    svgPath: null,
    svgLayer: null,
    transform: [0.575, 281.2, 0.575, 193.7],
    bounds: [[-80, -477], [-287, -193]],
    coordinateRotation: 270,
  },
  'the-labyrinth': {
    svgPath: null,
    svgLayer: null,
    transform: [2.115, 85.5, 2.115, 128],
    bounds: [[-52, -37], [53, 76]],
    coordinateRotation: 270,
  },
  woods: {
    svgPath: `${SVG_BASE}/Woods.svg`,
    svgLayer: 'Ground_Level',
    transform: [0.1855, 112.95, 0.1855, 167.85],
    bounds: [[646, -914], [-761, 442]],
    coordinateRotation: 180,
  },
};

const aliases: Record<string, string> = {
  'night-factory': 'factory',
  'the-lab-dark': 'the-lab',
  'ground-zero-21': 'ground-zero',
};

export function getProjection(normalizedName: string): MapProjection | null {
  return projections[aliases[normalizedName] ?? normalizedName] ?? null;
}

export function projectPosition(position: { x: number; z: number }, projection: MapProjection): Point {
  const radians = (projection.coordinateRotation * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  const rotatedX = position.x * cos - position.z * sin;
  const rotatedY = position.x * sin + position.z * cos;
  const [scaleX, marginX, scaleY, marginY] = projection.transform;
  return { x: scaleX * rotatedX + marginX, y: -scaleY * rotatedY + marginY };
}

export function projectBounds(bounds: Bounds, projection: MapProjection) {
  const [[x1, z1], [x2, z2]] = bounds;
  const northWest = projectPosition({ x: Math.min(x1, x2), z: Math.max(z1, z2) }, projection);
  const southEast = projectPosition({ x: Math.max(x1, x2), z: Math.min(z1, z2) }, projection);
  return {
    x: Math.min(northWest.x, southEast.x),
    y: Math.min(northWest.y, southEast.y),
    width: Math.abs(northWest.x - southEast.x),
    height: Math.abs(northWest.y - southEast.y),
  };
}
