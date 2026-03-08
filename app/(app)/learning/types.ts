export interface LearningCreator {
  id: string;
  display_name: string;
}

export interface LearningPath {
  id: string;
  title: string;
  description: string | null;
  is_starred: boolean;
  created_by: string;
  created_at: string;
  creator: LearningCreator | null;
}

export interface LearningPathItem {
  id: string;
  path_id: string;
  title: string;
  url: string;
  description: string | null;
  position: number;
}

export type ResourceType = "course" | "video" | "tutorial";

export interface LearningResource {
  id: string;
  type: ResourceType;
  title: string;
  url: string;
  description: string | null;
  added_by: string;
  created_at: string;
  adder: LearningCreator | null;
}
