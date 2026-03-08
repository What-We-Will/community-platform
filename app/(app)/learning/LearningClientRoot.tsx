"use client";

import dynamic from "next/dynamic";
import type { LearningPath, LearningPathItem, LearningResource } from "./types";
import type { TrackerStatus } from "./learning-tracker-actions";
import type { StudyGroupRow } from "./page";

const LearningClient = dynamic(
  () => import("./LearningClient").then((m) => ({ default: m.LearningClient })),
  { ssr: false },
);

interface Props {
  paths: LearningPath[];
  itemsByPath: Record<string, LearningPathItem[]>;
  resources: LearningResource[];
  currentUserId: string;
  isPlatformAdmin: boolean;
  trackerByResource: Record<string, { id: string; status: TrackerStatus }>;
  studyGroupsByResource: Record<string, StudyGroupRow[]>;
}

export function LearningClientRoot(props: Props) {
  return <LearningClient {...props} />;
}
