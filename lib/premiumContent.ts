import { ENTITLEMENTS, hasEntitlement, getActiveEntitlements } from "./purchases";
import partyPack from "../assets/prompts/premium-party.json";
import spicyPack from "../assets/prompts/premium-spicy.json";
import chaosPack from "../assets/prompts/premium-chaos.json";

export interface Prompt {
  text: string;
  category: string;
  chaos: number;
  type: string;
  timer?: number;
  isPremium?: boolean;
  packId?: string;
}

interface PremiumPack {
  packId: string;
  name: string;
  description: string;
  prompts: Prompt[];
}

const PREMIUM_PACKS: Record<string, PremiumPack> = {
  [ENTITLEMENTS.PARTY_PACK]: partyPack as PremiumPack,
  [ENTITLEMENTS.SPICY_PACK]: spicyPack as PremiumPack,
  [ENTITLEMENTS.CHAOS_PACK]: chaosPack as PremiumPack,
};

/**
 * Get all unlocked premium prompts based on user's entitlements
 */
export async function getUnlockedPremiumPrompts(): Promise<Prompt[]> {
  const activeEntitlements = await getActiveEntitlements();
  const prompts: Prompt[] = [];

  for (const entitlement of activeEntitlements) {
    const pack = PREMIUM_PACKS[entitlement];
    if (pack) {
      const packPrompts = pack.prompts.map((p) => ({
        ...p,
        isPremium: true,
        packId: pack.packId,
      }));
      prompts.push(...packPrompts);
    }

    // Premium bundle unlocks all packs
    if (entitlement === ENTITLEMENTS.PREMIUM) {
      for (const packKey of Object.keys(PREMIUM_PACKS)) {
        const bundlePack = PREMIUM_PACKS[packKey];
        if (bundlePack) {
          const bundlePrompts = bundlePack.prompts.map((p) => ({
            ...p,
            isPremium: true,
            packId: bundlePack.packId,
          }));
          prompts.push(...bundlePrompts);
        }
      }
      break; // Premium includes everything, no need to continue
    }
  }

  // Remove duplicates (in case of overlapping entitlements)
  const uniquePrompts = prompts.filter(
    (prompt, index, self) =>
      index === self.findIndex((p) => p.text === prompt.text)
  );

  return uniquePrompts;
}

/**
 * Check if a specific pack is unlocked
 */
export async function isPackUnlocked(packId: string): Promise<boolean> {
  // Premium bundle unlocks everything
  if (await hasEntitlement(ENTITLEMENTS.PREMIUM)) {
    return true;
  }
  return hasEntitlement(packId);
}

/**
 * Get info about all available packs
 */
export function getAvailablePacks(): { id: string; name: string; description: string; promptCount: number }[] {
  return Object.entries(PREMIUM_PACKS).map(([id, pack]) => ({
    id,
    name: pack.name,
    description: pack.description,
    promptCount: pack.prompts.length,
  }));
}

/**
 * Get total premium prompt count
 */
export function getTotalPremiumPromptCount(): number {
  return Object.values(PREMIUM_PACKS).reduce(
    (total, pack) => total + pack.prompts.length,
    0
  );
}
