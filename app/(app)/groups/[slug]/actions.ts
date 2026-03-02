"use server";

// Re-export slug-specific actions from the parent actions file
export {
  joinGroupAction,
  leaveGroupAction,
  updateMemberRoleAction,
  removeMemberAction,
} from "../actions";
