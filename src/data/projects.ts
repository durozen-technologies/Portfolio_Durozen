export interface ProjectItem {
  id: string;
  name: string;
  category: 'Automotive' | 'Beauty' | 'Healthcare' | 'Lifestyle' | 'Hospitality';
  tagline: string;
  description: string;
  url: string;
  accentColor: string; // DUROZEN Red, Yellow, Green, or Blue
  accentBadge: string;
  year: string;
  tags: string[];
  client: string;
  highlights: string[];
  domain: string;
  imageUrl?: string; // Custom website front look picture / screenshot
}

// Clean initial state: projects are added dynamically through the Admin Portal
export const LIVE_PROJECTS: ProjectItem[] = [];
