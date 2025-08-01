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
  content?: string;
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

export interface GetMemorySummaryParams {
  memory_id: string;
}

export interface SearchWithinMemoryParams {
  memory_id: string;
  query: string;
}

export interface UpdateSectionParams {
  memory_id: string;
  section: string;
  content: string;
  mode?: 'replace' | 'append';
}

export interface UpdateListItemParams {
  memory_id: string;
  section: string;
  item_identifier: string;
  updates: Record<string, any>;
}

export interface MoveListItemParams {
  memory_id: string;
  from_section: string;
  to_section: string;
  item_identifier: string;
  reason?: string;
}

export interface GetFullMemoryParams {
  memory_id: string;
}

