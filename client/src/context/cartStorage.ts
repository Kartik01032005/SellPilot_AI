export const getCartStorageKey = (userId: string | null | undefined): string | null => {
  if (!userId) return null;
  return `sellpilot_cart:${userId}`;
};
