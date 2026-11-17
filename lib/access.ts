export type AccessShare = {
  document_id: string;
  user_id: string;
};

export function isOwner(userId: string, ownerId: string): boolean {
  return userId === ownerId;
}

export function canAccess(
  userId: string,
  docId: string,
  access: {
    ownerId: string | null;
    shares: AccessShare[];
  }
): boolean {
  if (!access.ownerId) {
    return false;
  }

  if (isOwner(userId, access.ownerId)) {
    return true;
  }

  return access.shares.some(
    (share) => share.document_id === docId && share.user_id === userId
  );
}
