export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      secrets: {
        Row: {
          id: string;
          content: string;
          created_at: string;
          is_delivered: boolean;
          delivered_at: string | null;
          receiver_session_id: string | null;
          reply_count: number;
          is_reply: boolean;
          parent_secret_id: string | null;
          deliver_after: string | null;
          is_sealed: boolean;
          seal_type: string | null;
          paper_id: string | null;
          ink_effect: string | null;
        };
        Insert: {
          id?: string;
          content: string;
          created_at?: string;
          is_delivered?: boolean;
          delivered_at?: string | null;
          receiver_session_id?: string | null;
          reply_count?: number;
          is_reply?: boolean;
          parent_secret_id?: string | null;
          deliver_after?: string | null;
          is_sealed?: boolean;
          seal_type?: string | null;
          paper_id?: string | null;
          ink_effect?: string | null;
        };
        Update: {
          id?: string;
          content?: string;
          created_at?: string;
          is_delivered?: boolean;
          delivered_at?: string | null;
          receiver_session_id?: string | null;
          reply_count?: number;
          is_reply?: boolean;
          parent_secret_id?: string | null;
          deliver_after?: string | null;
          is_sealed?: boolean;
          seal_type?: string | null;
          paper_id?: string | null;
          ink_effect?: string | null;
        };
      };
      replies: {
        Row: {
          id: string;
          secret_id: string;
          content: string;
          created_at: string;
          is_delivered: boolean;
          delivered_at: string | null;
          receiver_session_id: string | null;
        };
        Insert: {
          id?: string;
          secret_id: string;
          content: string;
          created_at?: string;
          is_delivered?: boolean;
          delivered_at?: string | null;
          receiver_session_id?: string | null;
        };
        Update: {
          id?: string;
          secret_id?: string;
          content?: string;
          created_at?: string;
          is_delivered?: boolean;
          delivered_at?: string | null;
          receiver_session_id?: string | null;
        };
      };
      kept_secrets: {
        Row: {
          id: string;
          secret_id: string;
          user_session_id: string;
          kept_at: string;
        };
        Insert: {
          id?: string;
          secret_id: string;
          user_session_id: string;
          kept_at?: string;
        };
        Update: {
          id?: string;
          secret_id?: string;
          user_session_id?: string;
          kept_at?: string;
        };
      };
      purchases: {
        Row: {
          id: string;
          session_id: string;
          feature_type: string;
          offer_id: string;
          feature_id: string | null;
          amount: number;
          currency: string;
          stripe_payment_intent_id: string | null;
          status: string;
          metadata: Json;
          created_at: string;
          expires_at: string | null;
        };
        Insert: {
          id?: string;
          session_id: string;
          feature_type: string;
          offer_id: string;
          feature_id?: string | null;
          amount: number;
          currency?: string;
          stripe_payment_intent_id?: string | null;
          status?: string;
          metadata?: Json;
          created_at?: string;
          expires_at?: string | null;
        };
        Update: {
          id?: string;
          session_id?: string;
          feature_type?: string;
          offer_id?: string;
          feature_id?: string | null;
          amount?: number;
          currency?: string;
          stripe_payment_intent_id?: string | null;
          status?: string;
          metadata?: Json;
          created_at?: string;
          expires_at?: string | null;
        };
      };
      unlocked_papers: {
        Row: {
          id: string;
          session_id: string;
          paper_id: string;
          purchase_id: string | null;
          unlocked_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          paper_id: string;
          purchase_id?: string | null;
          unlocked_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          paper_id?: string;
          purchase_id?: string | null;
          unlocked_at?: string;
        };
      };
      time_capsules: {
        Row: {
          id: string;
          secret_id: string;
          session_id: string;
          deliver_at: string;
          is_delivered: boolean;
          purchase_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          secret_id: string;
          session_id: string;
          deliver_at: string;
          is_delivered?: boolean;
          purchase_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          secret_id?: string;
          session_id?: string;
          deliver_at?: string;
          is_delivered?: boolean;
          purchase_id?: string | null;
          created_at?: string;
        };
      };
      eternal_secrets: {
        Row: {
          id: string;
          secret_id: string;
          patron_session_id: string;
          purchase_id: string | null;
          preserved_at: string;
        };
        Insert: {
          id?: string;
          secret_id: string;
          patron_session_id: string;
          purchase_id?: string | null;
          preserved_at?: string;
        };
        Update: {
          id?: string;
          secret_id?: string;
          patron_session_id?: string;
          purchase_id?: string | null;
          preserved_at?: string;
        };
      };
      long_letter_entitlements: {
        Row: {
          id: string;
          session_id: string;
          max_chars: number;
          purchase_id: string | null;
          granted_at: string;
          expires_at: string | null;
        };
        Insert: {
          id?: string;
          session_id: string;
          max_chars: number;
          purchase_id?: string | null;
          granted_at?: string;
          expires_at?: string | null;
        };
        Update: {
          id?: string;
          session_id?: string;
          max_chars?: number;
          purchase_id?: string | null;
          granted_at?: string;
          expires_at?: string | null;
        };
      };
      seal_entitlements: {
        Row: {
          id: string;
          session_id: string;
          seal_type: string;
          remaining_uses: number;
          purchase_id: string | null;
          granted_at: string;
          expires_at: string | null;
        };
        Insert: {
          id?: string;
          session_id: string;
          seal_type: string;
          remaining_uses?: number;
          purchase_id?: string | null;
          granted_at?: string;
          expires_at?: string | null;
        };
        Update: {
          id?: string;
          session_id?: string;
          seal_type?: string;
          remaining_uses?: number;
          purchase_id?: string | null;
          granted_at?: string;
          expires_at?: string | null;
        };
      };
      ink_entitlements: {
        Row: {
          id: string;
          session_id: string;
          ink_effect: string;
          purchase_id: string | null;
          granted_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          ink_effect: string;
          purchase_id?: string | null;
          granted_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          ink_effect?: string;
          purchase_id?: string | null;
          granted_at?: string;
        };
      };
      gifted_voids: {
        Row: {
          id: string;
          giver_session_id: string;
          gift_token: string;
          recipient_session_id: string | null;
          purchase_id: string | null;
          max_chars: number;
          seals_quota: number;
          starts_at: string;
          expires_at: string;
          redeemed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          giver_session_id: string;
          gift_token: string;
          recipient_session_id?: string | null;
          purchase_id?: string | null;
          max_chars?: number;
          seals_quota?: number;
          starts_at?: string;
          expires_at: string;
          redeemed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          giver_session_id?: string;
          gift_token?: string;
          recipient_session_id?: string | null;
          purchase_id?: string | null;
          max_chars?: number;
          seals_quota?: number;
          starts_at?: string;
          expires_at?: string;
          redeemed_at?: string | null;
          created_at?: string;
        };
      };
      sanctuary_access: {
        Row: {
          id: string;
          session_id: string;
          tier: string;
          purchase_id: string | null;
          granted_at: string;
          expires_at: string | null;
        };
        Insert: {
          id?: string;
          session_id: string;
          tier: string;
          purchase_id?: string | null;
          granted_at?: string;
          expires_at?: string | null;
        };
        Update: {
          id?: string;
          session_id?: string;
          tier?: string;
          purchase_id?: string | null;
          granted_at?: string;
          expires_at?: string | null;
        };
      };
    };
    Functions: {
      pull_next_secret: {
        Args: {
          p_session_id: string;
        };
        Returns: {
          id: string;
          content: string;
          created_at: string;
          is_delivered: boolean;
          delivered_at: string | null;
          receiver_session_id: string | null;
          reply_count: number;
          is_reply: boolean;
          parent_secret_id: string | null;
          deliver_after: string | null;
          is_sealed: boolean;
          seal_type: string | null;
          paper_id: string | null;
          ink_effect: string | null;
        }[];
      };
      release_secret: {
        Args: {
          p_secret_id: string;
          p_session_id: string;
        };
        Returns: boolean;
      };
      create_reply: {
        Args: {
          p_target_secret_id: string;
          p_content: string;
        };
        Returns: {
          id: string;
          content: string;
          created_at: string;
          is_delivered: boolean;
          delivered_at: string | null;
          receiver_session_id: string | null;
          reply_count: number;
          is_reply: boolean;
          parent_secret_id: string | null;
          deliver_after: string | null;
          is_sealed: boolean;
          seal_type: string | null;
          paper_id: string | null;
          ink_effect: string | null;
        }[];
      };
    };
    Views: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
