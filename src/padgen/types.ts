export interface CompanyData {
  companyName: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  tagline: string;
  empName: string;
  empRole: string;
  empPhone?: string;
  empEmail?: string;
  casing?: 'title' | 'upper' | 'as-typed';
  industry?: 'corporate' | 'legal' | 'medical' | 'creative' | 'hospitality';
  customLogo?: string;
  logoScale?: number;
  logoOpacity?: number;
  empPhoto?: string;
  photoScale?: number;
  photoX?: number;
  photoY?: number;
  photoOpacity?: number;
  photoBrightness?: number;
  photoSharpness?: number;
  empId?: string;
}

export interface Theme {
  name: string;
  primary: string;
  accent: string;
  paper: string;
  secondary?: string;
  shade2?: string;
  shade3?: string;
  decorations?: 'none' | 'brackets' | 'horizontal-lines' | 'subtle-box' | 'top-bottom-dots' | 'corner-flourish' | 'crest' | 'modern-accent';
  decorationColor?: string;
}

export interface Font {
  label: string;
  stack: string;
}

export interface DesignState {
  data: CompanyData;
  themeIdx: number;
  shapeIdx: number;
  padLayoutIdx: number;
  cardLayoutIdx: number;
  headlineIdx: number;
  logoStyleIdx: number;
  gridStyleIdx: number;
  textureIdx: number;
}

export interface DesignControls {
  font: string; // "random" or string index e.g. "0", "1"
  shape: "random" | "circle" | "square" | "hexagon" | "diamond" | "shield" | "octagon" | "star" | "rhombus" | "cross" | "ellipse" | "badge-ribbon" | "waves" | "emblem-shield";
  padLayout: any;
  cardLayout: any;
  logoStyle: "random" | "classic" | "typographic" | "bordered" | "shadow-badge";
  gridStyle: "random" | "none" | "dots" | "lines" | "repeated-name" | "graph" | "isometric" | "crosses" | "diagonal" | "hexagonal" | "music" | "calligraphy" | "stipple" | "blueprint" | "circuit";
  texture: "random" | "none" | "linen" | "vellum" | "canvas" | "watercolor" | "parchment" | "recycled" | "felt" | "laid" | "kraft" | "metallic" | "speckled" | "leather" | "wood";
}

export interface HistoryItem {
  id: string;
  timestamp: string;
  type: 'pad-png' | 'card-png' | 'pad-svg' | 'card-svg' | 'pad-pdf' | 'card-pdf' | 'vector-ai' | 'photoshop-psd';
  filename: string;
  data: CompanyData;
  theme: Theme;
  shape: "circle" | "square" | "hexagon" | "diamond" | "shield" | "octagon" | "star" | "rhombus" | "cross" | "ellipse" | "badge-ribbon" | "waves" | "emblem-shield";
  padLayout: any;
  cardLayout: any;
  fontIdx: number;
  logoStyle: "classic" | "typographic" | "bordered" | "shadow-badge";
  gridStyle: "none" | "dots" | "lines" | "repeated-name" | "graph" | "isometric" | "crosses" | "diagonal" | "hexagonal" | "music" | "calligraphy" | "stipple" | "blueprint" | "circuit";
  texture: "none" | "linen" | "vellum" | "canvas" | "watercolor" | "parchment" | "recycled" | "felt" | "laid" | "kraft" | "metallic" | "speckled" | "leather" | "wood";
}
