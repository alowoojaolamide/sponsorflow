export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          password_hash: string | null;
          google_id: string | null;
          google_email: string | null;
          first_name: string | null;
          last_name: string | null;
          email_verified: boolean;
          created_at: string;
          updated_at: string;
          last_login: string | null;
        };
        Insert: {
          id?: string;
          email: string;
          password_hash?: string | null;
          google_id?: string | null;
          google_email?: string | null;
          first_name?: string | null;
          last_name?: string | null;
          email_verified?: boolean;
          created_at?: string;
          updated_at?: string;
          last_login?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          password_hash?: string | null;
          google_id?: string | null;
          google_email?: string | null;
          first_name?: string | null;
          last_name?: string | null;
          email_verified?: boolean;
          created_at?: string;
          updated_at?: string;
          last_login?: string | null;
        };
        Relationships: [];
      };
      user_sessions: {
        Row: {
          id: string;
          user_id: string;
          token: string;
          expires_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          token: string;
          expires_at: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          token?: string;
          expires_at?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_sessions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      user_profiles: {
        Row: {
          id: string;
          user_id: string;
          location: string | null;
          years_experience: number | null;
          target_job_title: string | null;
          linkedin_url: string | null;
          portfolio_url: string | null;
          professional_summary: string | null;
          design_philosophy: string | null;
          unique_thing: string | null;
          writing_tone: string;
          requires_sponsorship: boolean;
          target_salary_gbp: number | null;
          onboarding_complete: boolean;
          profile_complete_percent: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          location?: string | null;
          years_experience?: number | null;
          target_job_title?: string | null;
          linkedin_url?: string | null;
          portfolio_url?: string | null;
          professional_summary?: string | null;
          design_philosophy?: string | null;
          unique_thing?: string | null;
          writing_tone?: string;
          requires_sponsorship?: boolean;
          target_salary_gbp?: number | null;
          onboarding_complete?: boolean;
          profile_complete_percent?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          location?: string | null;
          years_experience?: number | null;
          target_job_title?: string | null;
          linkedin_url?: string | null;
          portfolio_url?: string | null;
          professional_summary?: string | null;
          design_philosophy?: string | null;
          unique_thing?: string | null;
          writing_tone?: string;
          requires_sponsorship?: boolean;
          target_salary_gbp?: number | null;
          onboarding_complete?: boolean;
          profile_complete_percent?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_profiles_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      user_industries: {
        Row: {
          id: string;
          profile_id: string;
          industry: string;
          years_experience: number | null;
          experience_description: string | null;
          problems_solved: string | null;
          motivation: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          industry: string;
          years_experience?: number | null;
          experience_description?: string | null;
          problems_solved?: string | null;
          motivation?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          industry?: string;
          years_experience?: number | null;
          experience_description?: string | null;
          problems_solved?: string | null;
          motivation?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_industries_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      user_skills: {
        Row: {
          id: string;
          profile_id: string;
          skill_name: string;
          skill_category: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          skill_name: string;
          skill_category: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          skill_name?: string;
          skill_category?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_skills_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      user_projects: {
        Row: {
          id: string;
          profile_id: string;
          project_name: string;
          company_name: string | null;
          year: number | null;
          description: string | null;
          role: string | null;
          industry: string | null;
          impact: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          project_name: string;
          company_name?: string | null;
          year?: number | null;
          description?: string | null;
          role?: string | null;
          industry?: string | null;
          impact?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          project_name?: string;
          company_name?: string | null;
          year?: number | null;
          description?: string | null;
          role?: string | null;
          industry?: string | null;
          impact?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_projects_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      user_documents: {
        Row: {
          id: string;
          user_id: string;
          document_type: string;
          file_name: string;
          file_url: string;
          file_size: number | null;
          uploaded_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          document_type: string;
          file_name: string;
          file_url: string;
          file_size?: number | null;
          uploaded_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          document_type?: string;
          file_name?: string;
          file_url?: string;
          file_size?: number | null;
          uploaded_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_documents_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      company_imports: {
        Row: {
          id: string;
          user_id: string;
          file_name: string;
          file_size: number | null;
          companies_found: number;
          companies_duplicates: number;
          companies_imported: number;
          status: string;
          uploaded_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          file_name: string;
          file_size?: number | null;
          companies_found?: number;
          companies_duplicates?: number;
          companies_imported?: number;
          status?: string;
          uploaded_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          file_name?: string;
          file_size?: number | null;
          companies_found?: number;
          companies_duplicates?: number;
          companies_imported?: number;
          status?: string;
          uploaded_at?: string;
          completed_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "company_imports_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      companies: {
        Row: {
          id: string;
          user_id: string;
          company_name: string;
          website: string | null;
          industry: string | null;
          import_id: string | null;
          campaign_tag: string | null;
          normalized_name: string | null;
          external_id: string | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          company_name: string;
          website?: string | null;
          industry?: string | null;
          import_id?: string | null;
          campaign_tag?: string | null;
          normalized_name?: string | null;
          external_id?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          company_name?: string;
          website?: string | null;
          industry?: string | null;
          import_id?: string | null;
          campaign_tag?: string | null;
          normalized_name?: string | null;
          external_id?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "companies_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "companies_import_id_fkey";
            columns: ["import_id"];
            isOneToOne: false;
            referencedRelation: "company_imports";
            referencedColumns: ["id"];
          }
        ];
      };
      contacts: {
        Row: {
          id: string;
          user_id: string;
          company_id: string;
          name: string | null;
          email: string | null;
          linkedin_url: string | null;
          job_title: string | null;
          email_hash: string | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          company_id: string;
          name?: string | null;
          email?: string | null;
          linkedin_url?: string | null;
          job_title?: string | null;
          email_hash?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          company_id?: string;
          name?: string | null;
          email?: string | null;
          linkedin_url?: string | null;
          job_title?: string | null;
          email_hash?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "contacts_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "contacts_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          }
        ];
      };
      outreach_emails: {
        Row: {
          id: string;
          user_id: string;
          company_id: string;
          contact_id: string | null;
          to_email: string;
          to_name: string | null;
          subject: string;
          body: string;
          status: string;
          sent_at: string | null;
          delivery_status: string | null;
          opened_at: string | null;
          clicked_at: string | null;
          ai_model: string | null;
          ai_positioning_angle: string | null;
          ai_confidence: number | null;
          approved_by_user: boolean;
          approved_at: string | null;
          user_edits: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          company_id: string;
          contact_id?: string | null;
          to_email: string;
          to_name?: string | null;
          subject: string;
          body: string;
          status?: string;
          sent_at?: string | null;
          delivery_status?: string | null;
          opened_at?: string | null;
          clicked_at?: string | null;
          ai_model?: string | null;
          ai_positioning_angle?: string | null;
          ai_confidence?: number | null;
          approved_by_user?: boolean;
          approved_at?: string | null;
          user_edits?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          company_id?: string;
          contact_id?: string | null;
          to_email?: string;
          to_name?: string | null;
          subject?: string;
          body?: string;
          status?: string;
          sent_at?: string | null;
          delivery_status?: string | null;
          opened_at?: string | null;
          clicked_at?: string | null;
          ai_model?: string | null;
          ai_positioning_angle?: string | null;
          ai_confidence?: number | null;
          approved_by_user?: boolean;
          approved_at?: string | null;
          user_edits?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "outreach_emails_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "outreach_emails_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "outreach_emails_contact_id_fkey";
            columns: ["contact_id"];
            isOneToOne: false;
            referencedRelation: "contacts";
            referencedColumns: ["id"];
          }
        ];
      };
      email_events: {
        Row: {
          id: string;
          outreach_email_id: string;
          event_type: string;
          event_timestamp: string;
          clicked_link: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          outreach_email_id: string;
          event_type: string;
          event_timestamp?: string;
          clicked_link?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          outreach_email_id?: string;
          event_type?: string;
          event_timestamp?: string;
          clicked_link?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "email_events_outreach_email_id_fkey";
            columns: ["outreach_email_id"];
            isOneToOne: false;
            referencedRelation: "outreach_emails";
            referencedColumns: ["id"];
          }
        ];
      };
      email_replies: {
        Row: {
          id: string;
          user_id: string;
          outreach_email_id: string | null;
          from_email: string;
          from_name: string | null;
          subject: string | null;
          body: string;
          received_at: string;
          ai_classification: string | null;
          ai_confidence: number | null;
          ai_summary: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          outreach_email_id?: string | null;
          from_email: string;
          from_name?: string | null;
          subject?: string | null;
          body: string;
          received_at?: string;
          ai_classification?: string | null;
          ai_confidence?: number | null;
          ai_summary?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          outreach_email_id?: string | null;
          from_email?: string;
          from_name?: string | null;
          subject?: string | null;
          body?: string;
          received_at?: string;
          ai_classification?: string | null;
          ai_confidence?: number | null;
          ai_summary?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "email_replies_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "email_replies_outreach_email_id_fkey";
            columns: ["outreach_email_id"];
            isOneToOne: false;
            referencedRelation: "outreach_emails";
            referencedColumns: ["id"];
          }
        ];
      };
      send_limits: {
        Row: {
          id: string;
          user_id: string;
          daily_limit: number;
          hourly_limit: number;
          emails_sent_today: number;
          emails_sent_this_hour: number;
          last_reset_date: string;
          last_reset_hour: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          daily_limit?: number;
          hourly_limit?: number;
          emails_sent_today?: number;
          emails_sent_this_hour?: number;
          last_reset_date?: string;
          last_reset_hour?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          daily_limit?: number;
          hourly_limit?: number;
          emails_sent_today?: number;
          emails_sent_this_hour?: number;
          last_reset_date?: string;
          last_reset_hour?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "send_limits_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      analytics_daily: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          emails_sent: number;
          emails_delivered: number;
          emails_bounced: number;
          emails_opened: number;
          open_rate: number;
          emails_clicked: number;
          click_rate: number;
          emails_replied: number;
          reply_rate: number;
          positive_replies: number;
          rejection_replies: number;
          interviews_scheduled: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          emails_sent?: number;
          emails_delivered?: number;
          emails_bounced?: number;
          emails_opened?: number;
          open_rate?: number;
          emails_clicked?: number;
          click_rate?: number;
          emails_replied?: number;
          reply_rate?: number;
          positive_replies?: number;
          rejection_replies?: number;
          interviews_scheduled?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          emails_sent?: number;
          emails_delivered?: number;
          emails_bounced?: number;
          emails_opened?: number;
          open_rate?: number;
          emails_clicked?: number;
          click_rate?: number;
          emails_replied?: number;
          reply_rate?: number;
          positive_replies?: number;
          rejection_replies?: number;
          interviews_scheduled?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "analytics_daily_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      analytics_by_industry: {
        Row: {
          id: string;
          user_id: string;
          industry: string;
          companies_targeted: number;
          emails_sent: number;
          replies: number;
          reply_rate: number;
          positive_replies: number;
          interviews: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          industry: string;
          companies_targeted?: number;
          emails_sent?: number;
          replies?: number;
          reply_rate?: number;
          positive_replies?: number;
          interviews?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          industry?: string;
          companies_targeted?: number;
          emails_sent?: number;
          replies?: number;
          reply_rate?: number;
          positive_replies?: number;
          interviews?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "analytics_by_industry_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Functions: {
      normalize_company_name: {
        Args: { raw_name: string };
        Returns: string;
      };
      email_hash: {
        Args: { raw_email: string };
        Returns: string;
      };
    };
  };
};

// Convenience helper type shortcuts
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
