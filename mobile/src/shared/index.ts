// Shared module public surface
//
// RULE: Feature modules import shared UI from '@/shared' (this barrel), never
// from deep paths like '@/shared/components/buttons/PrimaryButton'. This
// insulates features from internal restructuring of the shared module.

export * from './components';
export * from './utils/validation.utils';
export * from './utils/format.utils';
export type { UserProfile } from './types/user.types';
