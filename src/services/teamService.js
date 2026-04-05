import apiClient from "../api/apiClient";
import { cleanQueryParams } from "../api/endpoints";
import { normalizePagination } from "../utils/formatters";
import {
  normalizeWorkspaceRole,
  toBackendWorkspaceRole,
} from "../utils/workspaceRoles";
import { normalizeWorkspacePermissions } from "../utils/workspacePermissions";

const TEAM_ENDPOINTS = {
  members: "/tenant/members",
  invitations: "/tenant/invitations",
  audit: "/tenant/audit",
  memberRole: (memberId) => `/tenant/members/${memberId}/role`,
  memberPermissions: (memberId) => `/tenant/members/${memberId}/permissions`,
  memberActive: (memberId) => `/tenant/members/${memberId}/active`,
  member: (memberId) => `/tenant/members/${memberId}`,
  invitation: (invitationId) => `/tenant/invitations/${invitationId}`,
};

function extractApiData(response) {
  return response?.data?.data ?? response?.data ?? null;
}

function extractErrorMessage(error, fallback) {
  const payload = error?.response?.data;
  if (typeof payload === "string" && payload.trim()) return payload;
  if (typeof payload?.message === "string" && payload.message.trim()) return payload.message;
  if (typeof payload?.error === "string" && payload.error.trim()) return payload.error;
  return fallback;
}

function normalizeId(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function buildInvitationLink(token) {
  const normalized = String(token ?? "").trim();
  if (!normalized) return "";

  if (typeof window === "undefined") {
    return normalized;
  }

  const url = new URL("/onboarding/accept-invite", window.location.origin);
  url.searchParams.set("token", normalized);
  return url.toString();
}

export function normalizeTeamMember(member = {}) {
  return {
    memberId: normalizeId(member.memberId ?? member.id),
    userId: normalizeId(member.userId ?? member.user?.id),
    username: String(member.username ?? member.user?.username ?? "").trim(),
    email: String(member.email ?? member.user?.email ?? "").trim(),
    role: normalizeWorkspaceRole(member.role),
    roleLabel: String(member.roleLabel ?? "").trim(),
    customRoleName: String(member.customRoleName ?? "").trim(),
    permissions: normalizeWorkspacePermissions(member.permissions),
    active: typeof member.active === "boolean" ? member.active : true,
    createdAt: member.createdAt ?? null,
    updatedAt: member.updatedAt ?? null,
    createdBy: String(member.createdBy ?? "").trim(),
    updatedBy: String(member.updatedBy ?? "").trim(),
  };
}

export function normalizeInvitation(invitation = {}) {
  const token = String(invitation.token ?? "").trim();
  return {
    invitationId: normalizeId(invitation.invitationId ?? invitation.id),
    email: String(invitation.email ?? "").trim(),
    role: normalizeWorkspaceRole(invitation.role),
    token,
    inviteLink: buildInvitationLink(token),
    accepted: Boolean(invitation.accepted),
    expiresAt: invitation.expiresAt ?? null,
    createdAt: invitation.createdAt ?? null,
    createdBy: String(invitation.createdBy ?? "").trim(),
  };
}

export function normalizeAuditLog(entry = {}) {
  return {
    auditId: normalizeId(entry.auditId ?? entry.id),
    action: String(entry.action ?? "").trim().toUpperCase(),
    subjectType: String(entry.subjectType ?? "").trim(),
    subjectId: normalizeId(entry.subjectId),
    actor: String(entry.actor ?? entry.createdBy ?? "").trim(),
    targetName: String(entry.targetName ?? "").trim(),
    targetEmail: String(entry.targetEmail ?? "").trim(),
    previousValue: String(entry.previousValue ?? "").trim(),
    nextValue: String(entry.nextValue ?? "").trim(),
    description: String(entry.description ?? "").trim(),
    createdAt: entry.createdAt ?? null,
  };
}

export async function listTeamMembers() {
  try {
    const response = await apiClient.get(TEAM_ENDPOINTS.members);
    const payload = extractApiData(response);
    return Array.isArray(payload) ? payload.map((item) => normalizeTeamMember(item)) : [];
  } catch (error) {
    throw new Error(extractErrorMessage(error, "Could not load team members."));
  }
}

export async function listPendingInvitations() {
  try {
    const response = await apiClient.get(TEAM_ENDPOINTS.invitations);
    const payload = extractApiData(response);
    return Array.isArray(payload) ? payload.map((item) => normalizeInvitation(item)) : [];
  } catch (error) {
    throw new Error(extractErrorMessage(error, "Could not load invitations."));
  }
}

export async function listAuditLogs({
  search = "",
  action = "",
  page = 0,
  size = 10,
} = {}) {
  try {
    const response = await apiClient.get(TEAM_ENDPOINTS.audit, {
      params: cleanQueryParams({
        search: String(search ?? "").trim(),
        action: String(action ?? "").trim(),
        page,
        size,
      }),
    });
    const payload = extractApiData(response);
    const normalized = normalizePagination(payload, { page, size });
    return {
      ...normalized,
      items: normalized.items.map((entry) => normalizeAuditLog(entry)),
    };
  } catch (error) {
    throw new Error(extractErrorMessage(error, "Could not load audit history."));
  }
}

export async function createInvitation({ email, role } = {}) {
  try {
    const response = await apiClient.post(TEAM_ENDPOINTS.invitations, {
      email,
      role: normalizeWorkspaceRole(role),
    });
    return normalizeInvitation(extractApiData(response));
  } catch (error) {
    throw new Error(extractErrorMessage(error, "Could not create invitation."));
  }
}

export async function updateMemberRole({ memberId, role } = {}) {
  try {
    const response = await apiClient.put(TEAM_ENDPOINTS.memberRole(memberId), {
      role: toBackendWorkspaceRole(role),
    });
    return normalizeTeamMember(extractApiData(response));
  } catch (error) {
    throw new Error(extractErrorMessage(error, "Could not update member role."));
  }
}

export async function updateMemberPermissions({
  memberId,
  customRoleName = "",
  permissions = [],
} = {}) {
  try {
    const response = await apiClient.put(TEAM_ENDPOINTS.memberPermissions(memberId), {
      customRoleName: String(customRoleName ?? "").trim(),
      permissions: normalizeWorkspacePermissions(permissions),
    });
    return normalizeTeamMember(extractApiData(response));
  } catch (error) {
    throw new Error(extractErrorMessage(error, "Could not update advanced access."));
  }
}

export async function updateMemberActive({ memberId, active } = {}) {
  try {
    const response = await apiClient.patch(TEAM_ENDPOINTS.memberActive(memberId), {
      active: Boolean(active),
    });
    return normalizeTeamMember(extractApiData(response));
  } catch (error) {
    throw new Error(extractErrorMessage(error, "Could not update member status."));
  }
}

export async function removeMember({ memberId } = {}) {
  try {
    await apiClient.delete(TEAM_ENDPOINTS.member(memberId));
  } catch (error) {
    throw new Error(extractErrorMessage(error, "Could not remove member."));
  }
}

export async function revokeInvitation({ invitationId } = {}) {
  try {
    await apiClient.delete(TEAM_ENDPOINTS.invitation(invitationId));
  } catch (error) {
    throw new Error(extractErrorMessage(error, "Could not revoke invitation."));
  }
}
