/**
 * Type definitions for buildInfo.json structure
 */

export interface BuildInfo {
  buildDate: string;
  version: string;
  environment?: string;
  git: {
    commitMessage: string;
    commitHash: string;
    commitDate: string;
    branch: string;
  };
  releaseDate?: string;
  buildStatus?: string;
  testsStatus?: {
    backend: string;
    frontend?: string;
    e2e: string;
    overall?: string;
  };
  sprint?: string;
  currentPhases?: string[];
  recentChanges?: string[];
  keyFeatures?: string[];
  techStack?: {
    frontend: string[];
    backend: string[];
  };
  notes?: string[];
  phases?: Record<string, PhaseInfo>;
  totalDuration?: string;
  newFeatures?: string[];
  databaseTables?: string[];
  improvements?: string[];
  upcomingFeatures?: string[];
  latestDoneFeatures?: FeatureGroup[];
  futureTodos?: string[];
  features?: Record<string, string>;
  changes?: string[];
}

export interface PhaseInfo {
  name: string;
  status: string;
  duration: string;
  dateCompleted?: string;
  features?: string[];
  tasks?: string[];
  improvements?: string[];
  deletedFiles?: string[];
  modifiedFiles?: string[];
  newFiles?: string[];
}

export interface FeatureGroup {
  title: string;
  date: string;
  features: string[];
}

export interface CleanupResult {
  message: string;
  deletedCount?: {
    inMemory?: number;
    activeGames?: number;
    finishedGames?: number;
    sessions?: number;
  };
}
