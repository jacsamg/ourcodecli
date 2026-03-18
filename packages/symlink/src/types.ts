export interface SymlinkConfig {
  force?: boolean;
  sourcePath: string;
  targetName?: string;
  targetDir: string[];
}

export type OurSymlinkConfig = SymlinkConfig[];
