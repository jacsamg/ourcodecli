export interface SymlinkConfig {
  force?: boolean;
  sourcePath: string;
  targetName?: string;
  targetDir: string[];
}

export interface OurSymlinkConfig {
  symlinks: SymlinkConfig[];
}
