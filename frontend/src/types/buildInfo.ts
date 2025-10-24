export interface BuildInfo {
  buildDate: string;
  version: string;
  git: {
    commitMessage: string;
    commitHash: string;
    commitDate: string;
    branch: string;
  };
  futureTodos: string[];
}
