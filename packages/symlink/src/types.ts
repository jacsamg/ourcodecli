export interface SymlinkConfig {
  name: string;
  force: boolean;
  source: string;
  target: string[];
}

export type OurSymlinkConfig = SymlinkConfig[];
