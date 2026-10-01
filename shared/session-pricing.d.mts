export type SessionPackage = { id: string; name: string; minutes: number; duration: string; price: number; hourlyPrice: number; description: string }
export const sessionPackages: SessionPackage[]
export function resolveSession(input: { packageId?: unknown; hours?: unknown }): SessionPackage | undefined
export function formatNaira(amount: number): string
