export const CLERK_WEBHOOK_EVENTS = {
  USER_CREATED: 'user.created',
  USER_UPDATED: 'user.updated',
  USER_DELETED: 'user.deleted',
} as const;

export const CLERK_WEBHOOK_ROUTE = 'webhooks/clerk';

export const CLERK_VERIFIED_EVENT_KEY = 'clerk_verified_event';
