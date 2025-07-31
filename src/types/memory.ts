export interface MemoryMetadata {
  id: string;
  created: string;
  updated: string;
  tags: string[];
  status?: string;
}

export interface Memory {
  metadata: MemoryMetadata;
  content: string;
  filePath: string;
}

export interface MemorySummary {
  id: string;
  created: string;
  updated: string;
  tags: string[];
  status?: string;
  filePath: string;
  sectionCount: number;
}

export interface MemorySection {
  name: string;
  content: string;
  level: number;
}

export interface CreateMemoryParams {
  name: string;
  initial_context?: string;
}

export interface AddToListParams {
  memory_id: string;
  section: string;
  item: Record<string, any>;
}

export interface GetSectionParams {
  memory_id: string;
  section: string;
}

export interface ListMemoriesResult {
  memories: MemorySummary[];
  total: number;
}