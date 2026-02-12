export interface Secret {
  id: string;
  content: string;
  created_at: string;
  is_reply?: boolean;
  parent_secret_id?: string | null;
  is_sealed?: boolean;
  seal_type?: string | null;
  paper_id?: string | null;
  ink_effect?: string | null;
}

export interface ApiEmptyResponse {
  empty: true;
  message: string;
}

export interface KeptSecret {
  id: string;
  content: string;
  keptAt: string;
}

export interface PaymentHistoryItem {
  id: string;
  feature_type: string;
  offer_id: string;
  amount: number;
  currency: string;
  created_at: string;
  expires_at: string | null;
}

export interface PaymentIntentResponse {
  paymentIntentId: string;
  clientSecret: string | null;
  checkoutUrl?: string | null;
  offer: {
    id: string;
    featureType: string;
    label: string;
    ritualVerb: string;
    amountEurCents: number;
  };
  copy: {
    title: string;
    subtitle: string;
  };
}
