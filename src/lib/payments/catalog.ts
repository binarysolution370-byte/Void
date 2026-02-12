export type FeatureType =
  | "long_letter"
  | "capsule"
  | "seal"
  | "paper"
  | "ink"
  | "gift"
  | "sanctuary"
  | "eternity";

export interface Offering {
  id: string;
  featureType: FeatureType;
  label: string;
  ritualVerb: "OFFRIR" | "DEPOSER" | "SCELLER";
  amountEurCents: number;
  durationDays?: number;
}

export const OFFERINGS: Offering[] = [
  { id: "long_letter_1000", featureType: "long_letter", label: "Longue Lettre 1000", ritualVerb: "DEPOSER", amountEurCents: 99 },
  { id: "long_letter_5000", featureType: "long_letter", label: "Longue Lettre 5000", ritualVerb: "DEPOSER", amountEurCents: 299 },
  { id: "long_letter_infinite", featureType: "long_letter", label: "Longue Lettre Illimitee", ritualVerb: "DEPOSER", amountEurCents: 999 },
  { id: "capsule_1d", featureType: "capsule", label: "Capsule Demain", ritualVerb: "DEPOSER", amountEurCents: 49, durationDays: 1 },
  { id: "capsule_7d", featureType: "capsule", label: "Capsule 7 jours", ritualVerb: "DEPOSER", amountEurCents: 99, durationDays: 7 },
  { id: "capsule_30d", featureType: "capsule", label: "Capsule 30 jours", ritualVerb: "DEPOSER", amountEurCents: 199, durationDays: 30 },
  { id: "seal_classic", featureType: "seal", label: "Sceau de Cire", ritualVerb: "SCELLER", amountEurCents: 49 },
  { id: "paper_parchment", featureType: "paper", label: "Papier Parchemin", ritualVerb: "OFFRIR", amountEurCents: 49 },
  { id: "ink_typewriter", featureType: "ink", label: "Encre Machine a ecrire", ritualVerb: "OFFRIR", amountEurCents: 99 },
  { id: "gift_void_for_two", featureType: "gift", label: "Un vide pour deux", ritualVerb: "OFFRIR", amountEurCents: 499, durationDays: 30 },
  { id: "sanctuary_monthly", featureType: "sanctuary", label: "Sanctuaire Mensuel", ritualVerb: "OFFRIR", amountEurCents: 199, durationDays: 30 },
  { id: "sanctuary_yearly", featureType: "sanctuary", label: "Sanctuaire Annuel", ritualVerb: "OFFRIR", amountEurCents: 1499, durationDays: 365 },
  { id: "sanctuary_lifetime", featureType: "sanctuary", label: "Sanctuaire A vie", ritualVerb: "OFFRIR", amountEurCents: 4999 },
  { id: "eternity_secret", featureType: "eternity", label: "Mur des Disparus", ritualVerb: "OFFRIR", amountEurCents: 199 }
];

export function getOffering(offerId: string): Offering | null {
  return OFFERINGS.find((item) => item.id === offerId) ?? null;
}
