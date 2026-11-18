export interface CopyConfig {
  force?: boolean;
  preserveSymlinks?: boolean;
  rename?: string;
  sourcePath: string;
  targetPath: string[];
}

export interface OurCopyConfig {
  $schema?: string;
  copies: CopyConfig[];
}
