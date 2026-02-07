export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      analytics_events: {
        Row: {
          created_at: string
          event_data: Json | null
          event_type: string
          franchise_id: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_data?: Json | null
          event_type: string
          franchise_id?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_data?: Json | null
          event_type?: string
          franchise_id?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_franchise_id_fkey"
            columns: ["franchise_id"]
            isOneToOne: false
            referencedRelation: "franchises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_events_franchise_id_fkey"
            columns: ["franchise_id"]
            isOneToOne: false
            referencedRelation: "franchises_public"
            referencedColumns: ["id"]
          },
        ]
      }
      api_key_audit_log: {
        Row: {
          action: string
          created_at: string
          franchise_id: string | null
          id: string
          ip_address: string | null
          new_values: Json | null
          old_values: Json | null
          performed_by: string | null
          service_name: string
        }
        Insert: {
          action: string
          created_at?: string
          franchise_id?: string | null
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          performed_by?: string | null
          service_name: string
        }
        Update: {
          action?: string
          created_at?: string
          franchise_id?: string | null
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          performed_by?: string | null
          service_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_key_audit_log_franchise_id_fkey"
            columns: ["franchise_id"]
            isOneToOne: false
            referencedRelation: "franchises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "api_key_audit_log_franchise_id_fkey"
            columns: ["franchise_id"]
            isOneToOne: false
            referencedRelation: "franchises_public"
            referencedColumns: ["id"]
          },
        ]
      }
      cities: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          lat: number | null
          lng: number | null
          name: string
          population: number | null
          state: string
          subdomain: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          lat?: number | null
          lng?: number | null
          name: string
          population?: number | null
          state: string
          subdomain: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          lat?: number | null
          lng?: number | null
          name?: string
          population?: number | null
          state?: string
          subdomain?: string
          updated_at?: string
        }
        Relationships: []
      }
      coupon_usages: {
        Row: {
          discount_applied: number
          id: string
          promotion_id: string
          ride_id: string | null
          used_at: string
          user_id: string
        }
        Insert: {
          discount_applied: number
          id?: string
          promotion_id: string
          ride_id?: string | null
          used_at?: string
          user_id: string
        }
        Update: {
          discount_applied?: number
          id?: string
          promotion_id?: string
          ride_id?: string | null
          used_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupon_usages_promotion_id_fkey"
            columns: ["promotion_id"]
            isOneToOne: false
            referencedRelation: "promotions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_usages_ride_id_fkey"
            columns: ["ride_id"]
            isOneToOne: false
            referencedRelation: "rides"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_transactions: {
        Row: {
          amount: number
          created_at: string
          delivery_id: string | null
          description: string | null
          driver_id: string
          franchise_id: string
          id: string
          payment_id: string | null
          payment_status: Database["public"]["Enums"]["payment_status"] | null
          ride_id: string | null
          type: string
        }
        Insert: {
          amount: number
          created_at?: string
          delivery_id?: string | null
          description?: string | null
          driver_id: string
          franchise_id: string
          id?: string
          payment_id?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          ride_id?: string | null
          type: string
        }
        Update: {
          amount?: number
          created_at?: string
          delivery_id?: string | null
          description?: string | null
          driver_id?: string
          franchise_id?: string
          id?: string
          payment_id?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          ride_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_transactions_delivery_id_fkey"
            columns: ["delivery_id"]
            isOneToOne: false
            referencedRelation: "deliveries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_transactions_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_transactions_franchise_id_fkey"
            columns: ["franchise_id"]
            isOneToOne: false
            referencedRelation: "franchises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_transactions_franchise_id_fkey"
            columns: ["franchise_id"]
            isOneToOne: false
            referencedRelation: "franchises_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_transactions_ride_id_fkey"
            columns: ["ride_id"]
            isOneToOne: false
            referencedRelation: "rides"
            referencedColumns: ["id"]
          },
        ]
      }
      default_api_keys: {
        Row: {
          api_key_encrypted: string
          api_secret_encrypted: string | null
          created_at: string
          created_by: string | null
          environment: string
          id: string
          is_active: boolean
          metadata: Json | null
          service_name: string
          updated_at: string
        }
        Insert: {
          api_key_encrypted: string
          api_secret_encrypted?: string | null
          created_at?: string
          created_by?: string | null
          environment?: string
          id?: string
          is_active?: boolean
          metadata?: Json | null
          service_name: string
          updated_at?: string
        }
        Update: {
          api_key_encrypted?: string
          api_secret_encrypted?: string | null
          created_at?: string
          created_by?: string | null
          environment?: string
          id?: string
          is_active?: boolean
          metadata?: Json | null
          service_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      deliveries: {
        Row: {
          cancelled_at: string | null
          created_at: string
          delivered_at: string | null
          delivery_address: string
          delivery_lat: number
          delivery_lng: number
          distance_km: number | null
          driver_id: string | null
          estimated_price: number | null
          final_price: number | null
          franchise_id: string
          id: string
          merchant_id: string | null
          package_description: string | null
          package_size: string | null
          picked_up_at: string | null
          pickup_address: string
          pickup_lat: number
          pickup_lng: number
          recipient_name: string | null
          recipient_phone: string | null
          status: Database["public"]["Enums"]["delivery_status"] | null
          updated_at: string
        }
        Insert: {
          cancelled_at?: string | null
          created_at?: string
          delivered_at?: string | null
          delivery_address: string
          delivery_lat: number
          delivery_lng: number
          distance_km?: number | null
          driver_id?: string | null
          estimated_price?: number | null
          final_price?: number | null
          franchise_id: string
          id?: string
          merchant_id?: string | null
          package_description?: string | null
          package_size?: string | null
          picked_up_at?: string | null
          pickup_address: string
          pickup_lat: number
          pickup_lng: number
          recipient_name?: string | null
          recipient_phone?: string | null
          status?: Database["public"]["Enums"]["delivery_status"] | null
          updated_at?: string
        }
        Update: {
          cancelled_at?: string | null
          created_at?: string
          delivered_at?: string | null
          delivery_address?: string
          delivery_lat?: number
          delivery_lng?: number
          distance_km?: number | null
          driver_id?: string | null
          estimated_price?: number | null
          final_price?: number | null
          franchise_id?: string
          id?: string
          merchant_id?: string | null
          package_description?: string | null
          package_size?: string | null
          picked_up_at?: string | null
          pickup_address?: string
          pickup_lat?: number
          pickup_lng?: number
          recipient_name?: string | null
          recipient_phone?: string | null
          status?: Database["public"]["Enums"]["delivery_status"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deliveries_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliveries_franchise_id_fkey"
            columns: ["franchise_id"]
            isOneToOne: false
            referencedRelation: "franchises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliveries_franchise_id_fkey"
            columns: ["franchise_id"]
            isOneToOne: false
            referencedRelation: "franchises_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliveries_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      demand_bonus_claims: {
        Row: {
          bonus_earned: number | null
          bonus_id: string
          completed_at: string | null
          created_at: string
          driver_id: string
          id: string
          paid_at: string | null
          rides_completed: number | null
          status: string | null
        }
        Insert: {
          bonus_earned?: number | null
          bonus_id: string
          completed_at?: string | null
          created_at?: string
          driver_id: string
          id?: string
          paid_at?: string | null
          rides_completed?: number | null
          status?: string | null
        }
        Update: {
          bonus_earned?: number | null
          bonus_id?: string
          completed_at?: string | null
          created_at?: string
          driver_id?: string
          id?: string
          paid_at?: string | null
          rides_completed?: number | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "demand_bonus_claims_bonus_id_fkey"
            columns: ["bonus_id"]
            isOneToOne: false
            referencedRelation: "demand_bonuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demand_bonus_claims_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
      }
      demand_bonuses: {
        Row: {
          bonus_type: string
          bonus_value: number
          created_at: string
          current_claims: number | null
          days_of_week: string[] | null
          end_time: string | null
          franchise_id: string
          id: string
          is_active: boolean | null
          max_claims: number | null
          min_rides_required: number | null
          name: string
          start_time: string | null
          valid_from: string | null
          valid_until: string | null
          zone_lat: number | null
          zone_lng: number | null
          zone_radius_km: number | null
        }
        Insert: {
          bonus_type: string
          bonus_value: number
          created_at?: string
          current_claims?: number | null
          days_of_week?: string[] | null
          end_time?: string | null
          franchise_id: string
          id?: string
          is_active?: boolean | null
          max_claims?: number | null
          min_rides_required?: number | null
          name: string
          start_time?: string | null
          valid_from?: string | null
          valid_until?: string | null
          zone_lat?: number | null
          zone_lng?: number | null
          zone_radius_km?: number | null
        }
        Update: {
          bonus_type?: string
          bonus_value?: number
          created_at?: string
          current_claims?: number | null
          days_of_week?: string[] | null
          end_time?: string | null
          franchise_id?: string
          id?: string
          is_active?: boolean | null
          max_claims?: number | null
          min_rides_required?: number | null
          name?: string
          start_time?: string | null
          valid_from?: string | null
          valid_until?: string | null
          zone_lat?: number | null
          zone_lng?: number | null
          zone_radius_km?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "demand_bonuses_franchise_id_fkey"
            columns: ["franchise_id"]
            isOneToOne: false
            referencedRelation: "franchises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demand_bonuses_franchise_id_fkey"
            columns: ["franchise_id"]
            isOneToOne: false
            referencedRelation: "franchises_public"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_approval_requests: {
        Row: {
          created_at: string | null
          driver_id: string | null
          extracted_data: Json | null
          franchise_id: string | null
          id: string
          notification_sent: boolean | null
          notification_sent_at: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          driver_id?: string | null
          extracted_data?: Json | null
          franchise_id?: string | null
          id?: string
          notification_sent?: boolean | null
          notification_sent_at?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          driver_id?: string | null
          extracted_data?: Json | null
          franchise_id?: string | null
          id?: string
          notification_sent?: boolean | null
          notification_sent_at?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "driver_approval_requests_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_approval_requests_franchise_id_fkey"
            columns: ["franchise_id"]
            isOneToOne: false
            referencedRelation: "franchises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_approval_requests_franchise_id_fkey"
            columns: ["franchise_id"]
            isOneToOne: false
            referencedRelation: "franchises_public"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_financial_reports: {
        Row: {
          average_rating: number | null
          breakdown: Json | null
          cancellation_rate: number | null
          driver_id: string
          franchise_id: string
          generated_at: string
          id: string
          net_earnings: number | null
          online_hours: number | null
          peak_hours_worked: number | null
          period_end: string
          period_start: string
          report_type: string
          total_bonuses: number | null
          total_credits_used: number | null
          total_earnings: number | null
          total_rides: number | null
          total_tips: number | null
        }
        Insert: {
          average_rating?: number | null
          breakdown?: Json | null
          cancellation_rate?: number | null
          driver_id: string
          franchise_id: string
          generated_at?: string
          id?: string
          net_earnings?: number | null
          online_hours?: number | null
          peak_hours_worked?: number | null
          period_end: string
          period_start: string
          report_type: string
          total_bonuses?: number | null
          total_credits_used?: number | null
          total_earnings?: number | null
          total_rides?: number | null
          total_tips?: number | null
        }
        Update: {
          average_rating?: number | null
          breakdown?: Json | null
          cancellation_rate?: number | null
          driver_id?: string
          franchise_id?: string
          generated_at?: string
          id?: string
          net_earnings?: number | null
          online_hours?: number | null
          peak_hours_worked?: number | null
          period_end?: string
          period_start?: string
          report_type?: string
          total_bonuses?: number | null
          total_credits_used?: number | null
          total_earnings?: number | null
          total_rides?: number | null
          total_tips?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "driver_financial_reports_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_financial_reports_franchise_id_fkey"
            columns: ["franchise_id"]
            isOneToOne: false
            referencedRelation: "franchises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_financial_reports_franchise_id_fkey"
            columns: ["franchise_id"]
            isOneToOne: false
            referencedRelation: "franchises_public"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_verifications: {
        Row: {
          created_at: string
          driver_id: string
          expires_at: string | null
          id: string
          photo_url: string | null
          rejection_reason: string | null
          status: string | null
          verification_type: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string
          driver_id: string
          expires_at?: string | null
          id?: string
          photo_url?: string | null
          rejection_reason?: string | null
          status?: string | null
          verification_type: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string
          driver_id?: string
          expires_at?: string | null
          id?: string
          photo_url?: string | null
          rejection_reason?: string | null
          status?: string | null
          verification_type?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "driver_verifications_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
      }
      drivers: {
        Row: {
          cnh_back_url: string | null
          cnh_category: string | null
          cnh_expiry: string | null
          cnh_front_url: string | null
          cnh_number: string | null
          created_at: string
          credits: number | null
          crlv_url: string | null
          current_lat: number | null
          current_lng: number | null
          franchise_id: string
          id: string
          insurance_document_url: string | null
          is_approved: boolean | null
          is_online: boolean | null
          last_verification_at: string | null
          motorcycle_photo_url: string | null
          motorcycle_plate_photo_url: string | null
          rating: number | null
          registration_complete: boolean | null
          requires_verification: boolean | null
          total_rides: number | null
          updated_at: string
          user_id: string
          vehicle_color: string | null
          vehicle_model: string | null
          vehicle_plate: string | null
          vehicle_year: number | null
        }
        Insert: {
          cnh_back_url?: string | null
          cnh_category?: string | null
          cnh_expiry?: string | null
          cnh_front_url?: string | null
          cnh_number?: string | null
          created_at?: string
          credits?: number | null
          crlv_url?: string | null
          current_lat?: number | null
          current_lng?: number | null
          franchise_id: string
          id?: string
          insurance_document_url?: string | null
          is_approved?: boolean | null
          is_online?: boolean | null
          last_verification_at?: string | null
          motorcycle_photo_url?: string | null
          motorcycle_plate_photo_url?: string | null
          rating?: number | null
          registration_complete?: boolean | null
          requires_verification?: boolean | null
          total_rides?: number | null
          updated_at?: string
          user_id: string
          vehicle_color?: string | null
          vehicle_model?: string | null
          vehicle_plate?: string | null
          vehicle_year?: number | null
        }
        Update: {
          cnh_back_url?: string | null
          cnh_category?: string | null
          cnh_expiry?: string | null
          cnh_front_url?: string | null
          cnh_number?: string | null
          created_at?: string
          credits?: number | null
          crlv_url?: string | null
          current_lat?: number | null
          current_lng?: number | null
          franchise_id?: string
          id?: string
          insurance_document_url?: string | null
          is_approved?: boolean | null
          is_online?: boolean | null
          last_verification_at?: string | null
          motorcycle_photo_url?: string | null
          motorcycle_plate_photo_url?: string | null
          rating?: number | null
          registration_complete?: boolean | null
          requires_verification?: boolean | null
          total_rides?: number | null
          updated_at?: string
          user_id?: string
          vehicle_color?: string | null
          vehicle_model?: string | null
          vehicle_plate?: string | null
          vehicle_year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "drivers_franchise_id_fkey"
            columns: ["franchise_id"]
            isOneToOne: false
            referencedRelation: "franchises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drivers_franchise_id_fkey"
            columns: ["franchise_id"]
            isOneToOne: false
            referencedRelation: "franchises_public"
            referencedColumns: ["id"]
          },
        ]
      }
      emergency_alerts: {
        Row: {
          alert_type: string
          created_at: string
          delivery_id: string | null
          description: string | null
          franchise_id: string
          id: string
          location_address: string | null
          location_lat: number | null
          location_lng: number | null
          reporter_type: string
          reporter_user_id: string
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          ride_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          alert_type: string
          created_at?: string
          delivery_id?: string | null
          description?: string | null
          franchise_id: string
          id?: string
          location_address?: string | null
          location_lat?: number | null
          location_lng?: number | null
          reporter_type: string
          reporter_user_id: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          ride_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          alert_type?: string
          created_at?: string
          delivery_id?: string | null
          description?: string | null
          franchise_id?: string
          id?: string
          location_address?: string | null
          location_lat?: number | null
          location_lng?: number | null
          reporter_type?: string
          reporter_user_id?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          ride_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "emergency_alerts_delivery_id_fkey"
            columns: ["delivery_id"]
            isOneToOne: false
            referencedRelation: "deliveries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emergency_alerts_franchise_id_fkey"
            columns: ["franchise_id"]
            isOneToOne: false
            referencedRelation: "franchises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emergency_alerts_franchise_id_fkey"
            columns: ["franchise_id"]
            isOneToOne: false
            referencedRelation: "franchises_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emergency_alerts_ride_id_fkey"
            columns: ["ride_id"]
            isOneToOne: false
            referencedRelation: "rides"
            referencedColumns: ["id"]
          },
        ]
      }
      franchise_api_keys: {
        Row: {
          api_key_encrypted: string
          api_secret_encrypted: string | null
          created_at: string
          environment: string
          franchise_id: string
          id: string
          is_active: boolean
          is_validated: boolean
          metadata: Json | null
          service_name: string
          updated_at: string
          validated_at: string | null
        }
        Insert: {
          api_key_encrypted: string
          api_secret_encrypted?: string | null
          created_at?: string
          environment?: string
          franchise_id: string
          id?: string
          is_active?: boolean
          is_validated?: boolean
          metadata?: Json | null
          service_name: string
          updated_at?: string
          validated_at?: string | null
        }
        Update: {
          api_key_encrypted?: string
          api_secret_encrypted?: string | null
          created_at?: string
          environment?: string
          franchise_id?: string
          id?: string
          is_active?: boolean
          is_validated?: boolean
          metadata?: Json | null
          service_name?: string
          updated_at?: string
          validated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "franchise_api_keys_franchise_id_fkey"
            columns: ["franchise_id"]
            isOneToOne: false
            referencedRelation: "franchises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "franchise_api_keys_franchise_id_fkey"
            columns: ["franchise_id"]
            isOneToOne: false
            referencedRelation: "franchises_public"
            referencedColumns: ["id"]
          },
        ]
      }
      franchise_credit_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          franchise_id: string
          id: string
          payment_id: string | null
          payment_method: string | null
          payment_status: string | null
          processed_by: string | null
          type: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          franchise_id: string
          id?: string
          payment_id?: string | null
          payment_method?: string | null
          payment_status?: string | null
          processed_by?: string | null
          type: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          franchise_id?: string
          id?: string
          payment_id?: string | null
          payment_method?: string | null
          payment_status?: string | null
          processed_by?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "franchise_credit_transactions_franchise_id_fkey"
            columns: ["franchise_id"]
            isOneToOne: false
            referencedRelation: "franchises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "franchise_credit_transactions_franchise_id_fkey"
            columns: ["franchise_id"]
            isOneToOne: false
            referencedRelation: "franchises_public"
            referencedColumns: ["id"]
          },
        ]
      }
      franchise_credits: {
        Row: {
          balance: number
          created_at: string
          franchise_id: string
          id: string
          updated_at: string
        }
        Insert: {
          balance?: number
          created_at?: string
          franchise_id: string
          id?: string
          updated_at?: string
        }
        Update: {
          balance?: number
          created_at?: string
          franchise_id?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "franchise_credits_franchise_id_fkey"
            columns: ["franchise_id"]
            isOneToOne: true
            referencedRelation: "franchises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "franchise_credits_franchise_id_fkey"
            columns: ["franchise_id"]
            isOneToOne: true
            referencedRelation: "franchises_public"
            referencedColumns: ["id"]
          },
        ]
      }
      franchise_leads: {
        Row: {
          city: string
          contacted_at: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string
          state: string | null
          status: string | null
        }
        Insert: {
          city: string
          contacted_at?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone: string
          state?: string | null
          status?: string | null
        }
        Update: {
          city?: string
          contacted_at?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string
          state?: string | null
          status?: string | null
        }
        Relationships: []
      }
      franchise_marketing: {
        Row: {
          created_at: string
          custom_pixels: Json | null
          facebook_access_token: string | null
          facebook_pixel_id: string | null
          franchise_id: string
          google_ads_conversion_id: string | null
          google_ads_id: string | null
          google_analytics_id: string | null
          id: string
          instagram_business_id: string | null
          tiktok_pixel_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          custom_pixels?: Json | null
          facebook_access_token?: string | null
          facebook_pixel_id?: string | null
          franchise_id: string
          google_ads_conversion_id?: string | null
          google_ads_id?: string | null
          google_analytics_id?: string | null
          id?: string
          instagram_business_id?: string | null
          tiktok_pixel_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          custom_pixels?: Json | null
          facebook_access_token?: string | null
          facebook_pixel_id?: string | null
          franchise_id?: string
          google_ads_conversion_id?: string | null
          google_ads_id?: string | null
          google_analytics_id?: string | null
          id?: string
          instagram_business_id?: string | null
          tiktok_pixel_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "franchise_marketing_franchise_id_fkey"
            columns: ["franchise_id"]
            isOneToOne: true
            referencedRelation: "franchises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "franchise_marketing_franchise_id_fkey"
            columns: ["franchise_id"]
            isOneToOne: true
            referencedRelation: "franchises_public"
            referencedColumns: ["id"]
          },
        ]
      }
      franchises: {
        Row: {
          base_price: number | null
          city_id: string
          contract_end_date: string | null
          contract_start_date: string | null
          created_at: string
          credit_debit_per_ride: number | null
          driver_fee_amount: number | null
          driver_fee_type: string | null
          id: string
          is_active: boolean | null
          monthly_fee: number | null
          name: string
          owner_id: string | null
          payment_api_key: string | null
          payment_gateway: string | null
          payment_webhook_url: string | null
          price_per_km: number | null
          surge_days: string[] | null
          surge_end_hour: number | null
          surge_fixed_amount: number | null
          surge_franchise_percentage: number | null
          surge_keep_for_franchise: boolean | null
          surge_percentage: number | null
          surge_start_hour: number | null
          updated_at: string
        }
        Insert: {
          base_price?: number | null
          city_id: string
          contract_end_date?: string | null
          contract_start_date?: string | null
          created_at?: string
          credit_debit_per_ride?: number | null
          driver_fee_amount?: number | null
          driver_fee_type?: string | null
          id?: string
          is_active?: boolean | null
          monthly_fee?: number | null
          name: string
          owner_id?: string | null
          payment_api_key?: string | null
          payment_gateway?: string | null
          payment_webhook_url?: string | null
          price_per_km?: number | null
          surge_days?: string[] | null
          surge_end_hour?: number | null
          surge_fixed_amount?: number | null
          surge_franchise_percentage?: number | null
          surge_keep_for_franchise?: boolean | null
          surge_percentage?: number | null
          surge_start_hour?: number | null
          updated_at?: string
        }
        Update: {
          base_price?: number | null
          city_id?: string
          contract_end_date?: string | null
          contract_start_date?: string | null
          created_at?: string
          credit_debit_per_ride?: number | null
          driver_fee_amount?: number | null
          driver_fee_type?: string | null
          id?: string
          is_active?: boolean | null
          monthly_fee?: number | null
          name?: string
          owner_id?: string | null
          payment_api_key?: string | null
          payment_gateway?: string | null
          payment_webhook_url?: string | null
          price_per_km?: number | null
          surge_days?: string[] | null
          surge_end_hour?: number | null
          surge_fixed_amount?: number | null
          surge_franchise_percentage?: number | null
          surge_keep_for_franchise?: boolean | null
          surge_percentage?: number | null
          surge_start_hour?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "franchises_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: true
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      known_places: {
        Row: {
          address: string
          category: string | null
          created_at: string
          franchise_id: string
          id: string
          is_active: boolean | null
          lat: number
          lng: number
          name: string
        }
        Insert: {
          address: string
          category?: string | null
          created_at?: string
          franchise_id: string
          id?: string
          is_active?: boolean | null
          lat: number
          lng: number
          name: string
        }
        Update: {
          address?: string
          category?: string | null
          created_at?: string
          franchise_id?: string
          id?: string
          is_active?: boolean | null
          lat?: number
          lng?: number
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "known_places_franchise_id_fkey"
            columns: ["franchise_id"]
            isOneToOne: false
            referencedRelation: "franchises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "known_places_franchise_id_fkey"
            columns: ["franchise_id"]
            isOneToOne: false
            referencedRelation: "franchises_public"
            referencedColumns: ["id"]
          },
        ]
      }
      merchants: {
        Row: {
          business_address: string
          business_lat: number | null
          business_lng: number | null
          business_name: string
          business_phone: string | null
          business_type: string | null
          created_at: string
          franchise_id: string
          id: string
          is_approved: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          business_address: string
          business_lat?: number | null
          business_lng?: number | null
          business_name: string
          business_phone?: string | null
          business_type?: string | null
          created_at?: string
          franchise_id: string
          id?: string
          is_approved?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          business_address?: string
          business_lat?: number | null
          business_lng?: number | null
          business_name?: string
          business_phone?: string | null
          business_type?: string | null
          created_at?: string
          franchise_id?: string
          id?: string
          is_approved?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "merchants_franchise_id_fkey"
            columns: ["franchise_id"]
            isOneToOne: false
            referencedRelation: "franchises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "merchants_franchise_id_fkey"
            columns: ["franchise_id"]
            isOneToOne: false
            referencedRelation: "franchises_public"
            referencedColumns: ["id"]
          },
        ]
      }
      neighborhood_stats: {
        Row: {
          delivery_count: number | null
          franchise_id: string
          id: string
          neighborhood: string
          ride_count: number | null
          total_revenue: number | null
          updated_at: string
        }
        Insert: {
          delivery_count?: number | null
          franchise_id: string
          id?: string
          neighborhood: string
          ride_count?: number | null
          total_revenue?: number | null
          updated_at?: string
        }
        Update: {
          delivery_count?: number | null
          franchise_id?: string
          id?: string
          neighborhood?: string
          ride_count?: number | null
          total_revenue?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "neighborhood_stats_franchise_id_fkey"
            columns: ["franchise_id"]
            isOneToOne: false
            referencedRelation: "franchises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "neighborhood_stats_franchise_id_fkey"
            columns: ["franchise_id"]
            isOneToOne: false
            referencedRelation: "franchises_public"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_blocked_users: {
        Row: {
          blocked_by: string
          created_at: string | null
          franchise_id: string | null
          id: string
          reason: string | null
          user_id: string
        }
        Insert: {
          blocked_by: string
          created_at?: string | null
          franchise_id?: string | null
          id?: string
          reason?: string | null
          user_id: string
        }
        Update: {
          blocked_by?: string
          created_at?: string | null
          franchise_id?: string | null
          id?: string
          reason?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_blocked_users_franchise_id_fkey"
            columns: ["franchise_id"]
            isOneToOne: false
            referencedRelation: "franchises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_blocked_users_franchise_id_fkey"
            columns: ["franchise_id"]
            isOneToOne: false
            referencedRelation: "franchises_public"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_broadcasts: {
        Row: {
          content: string
          created_at: string | null
          created_by: string
          franchise_id: string | null
          html_content: string | null
          id: string
          recipient_filter: Json | null
          recipient_type: string
          sent_at: string | null
          sent_count: number | null
          status: string | null
          title: string
        }
        Insert: {
          content: string
          created_at?: string | null
          created_by: string
          franchise_id?: string | null
          html_content?: string | null
          id?: string
          recipient_filter?: Json | null
          recipient_type: string
          sent_at?: string | null
          sent_count?: number | null
          status?: string | null
          title: string
        }
        Update: {
          content?: string
          created_at?: string | null
          created_by?: string
          franchise_id?: string | null
          html_content?: string | null
          id?: string
          recipient_filter?: Json | null
          recipient_type?: string
          sent_at?: string | null
          sent_count?: number | null
          status?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_broadcasts_franchise_id_fkey"
            columns: ["franchise_id"]
            isOneToOne: false
            referencedRelation: "franchises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_broadcasts_franchise_id_fkey"
            columns: ["franchise_id"]
            isOneToOne: false
            referencedRelation: "franchises_public"
            referencedColumns: ["id"]
          },
        ]
      }
      passengers: {
        Row: {
          created_at: string
          favorite_addresses: Json | null
          franchise_id: string
          id: string
          rating: number | null
          total_rides: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          favorite_addresses?: Json | null
          franchise_id: string
          id?: string
          rating?: number | null
          total_rides?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          favorite_addresses?: Json | null
          franchise_id?: string
          id?: string
          rating?: number | null
          total_rides?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "passengers_franchise_id_fkey"
            columns: ["franchise_id"]
            isOneToOne: false
            referencedRelation: "franchises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "passengers_franchise_id_fkey"
            columns: ["franchise_id"]
            isOneToOne: false
            referencedRelation: "franchises_public"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          city: string | null
          cnpj: string | null
          cpf: string | null
          created_at: string
          document_back_url: string | null
          document_front_url: string | null
          email: string
          full_name: string
          id: string
          kyc_status: Database["public"]["Enums"]["kyc_status"] | null
          kyc_verified_at: string | null
          person_type: Database["public"]["Enums"]["person_type"] | null
          phone: string | null
          rg: string | null
          selfie_url: string | null
          selfie_with_doc_url: string | null
          state: string | null
          state_registration: string | null
          updated_at: string
          user_id: string
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          cnpj?: string | null
          cpf?: string | null
          created_at?: string
          document_back_url?: string | null
          document_front_url?: string | null
          email: string
          full_name: string
          id?: string
          kyc_status?: Database["public"]["Enums"]["kyc_status"] | null
          kyc_verified_at?: string | null
          person_type?: Database["public"]["Enums"]["person_type"] | null
          phone?: string | null
          rg?: string | null
          selfie_url?: string | null
          selfie_with_doc_url?: string | null
          state?: string | null
          state_registration?: string | null
          updated_at?: string
          user_id: string
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          cnpj?: string | null
          cpf?: string | null
          created_at?: string
          document_back_url?: string | null
          document_front_url?: string | null
          email?: string
          full_name?: string
          id?: string
          kyc_status?: Database["public"]["Enums"]["kyc_status"] | null
          kyc_verified_at?: string | null
          person_type?: Database["public"]["Enums"]["person_type"] | null
          phone?: string | null
          rg?: string | null
          selfie_url?: string | null
          selfie_with_doc_url?: string | null
          state?: string | null
          state_registration?: string | null
          updated_at?: string
          user_id?: string
          zip_code?: string | null
        }
        Relationships: []
      }
      promotions: {
        Row: {
          code: string | null
          created_at: string
          description: string | null
          discount_type: string | null
          discount_value: number
          first_ride_only: boolean | null
          franchise_id: string | null
          id: string
          is_active: boolean | null
          is_global: boolean | null
          max_discount_value: number | null
          max_uses: number | null
          min_ride_value: number | null
          name: string | null
          new_users_only: boolean | null
          uses_count: number | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          code?: string | null
          created_at?: string
          description?: string | null
          discount_type?: string | null
          discount_value: number
          first_ride_only?: boolean | null
          franchise_id?: string | null
          id?: string
          is_active?: boolean | null
          is_global?: boolean | null
          max_discount_value?: number | null
          max_uses?: number | null
          min_ride_value?: number | null
          name?: string | null
          new_users_only?: boolean | null
          uses_count?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          code?: string | null
          created_at?: string
          description?: string | null
          discount_type?: string | null
          discount_value?: number
          first_ride_only?: boolean | null
          franchise_id?: string | null
          id?: string
          is_active?: boolean | null
          is_global?: boolean | null
          max_discount_value?: number | null
          max_uses?: number | null
          min_ride_value?: number | null
          name?: string | null
          new_users_only?: boolean | null
          uses_count?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "promotions_franchise_id_fkey"
            columns: ["franchise_id"]
            isOneToOne: false
            referencedRelation: "franchises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotions_franchise_id_fkey"
            columns: ["franchise_id"]
            isOneToOne: false
            referencedRelation: "franchises_public"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limit_attempts: {
        Row: {
          action: string
          attempt_count: number | null
          blocked_until: string | null
          created_at: string | null
          first_attempt_at: string | null
          id: string
          identifier: string
          last_attempt_at: string | null
        }
        Insert: {
          action: string
          attempt_count?: number | null
          blocked_until?: string | null
          created_at?: string | null
          first_attempt_at?: string | null
          id?: string
          identifier: string
          last_attempt_at?: string | null
        }
        Update: {
          action?: string
          attempt_count?: number | null
          blocked_until?: string | null
          created_at?: string | null
          first_attempt_at?: string | null
          id?: string
          identifier?: string
          last_attempt_at?: string | null
        }
        Relationships: []
      }
      referral_codes: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean | null
          referee_bonus: number | null
          referral_bonus: number | null
          total_earned: number | null
          total_referrals: number | null
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          referee_bonus?: number | null
          referral_bonus?: number | null
          total_earned?: number | null
          total_referrals?: number | null
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          referee_bonus?: number | null
          referral_bonus?: number | null
          total_earned?: number | null
          total_referrals?: number | null
          user_id?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          bonus_paid_at: string | null
          created_at: string
          first_ride_at: string | null
          id: string
          referee_bonus_paid: number | null
          referee_user_id: string
          referral_code_id: string
          referrer_bonus_paid: number | null
          referrer_user_id: string
          status: string | null
        }
        Insert: {
          bonus_paid_at?: string | null
          created_at?: string
          first_ride_at?: string | null
          id?: string
          referee_bonus_paid?: number | null
          referee_user_id: string
          referral_code_id: string
          referrer_bonus_paid?: number | null
          referrer_user_id: string
          status?: string | null
        }
        Update: {
          bonus_paid_at?: string | null
          created_at?: string
          first_ride_at?: string | null
          id?: string
          referee_bonus_paid?: number | null
          referee_user_id?: string
          referral_code_id?: string
          referrer_bonus_paid?: number | null
          referrer_user_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referral_code_id_fkey"
            columns: ["referral_code_id"]
            isOneToOne: false
            referencedRelation: "referral_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      ride_location_logs: {
        Row: {
          accuracy: number | null
          created_at: string
          driver_id: string
          heading: number | null
          id: string
          lat: number
          lng: number
          ride_id: string
          speed: number | null
        }
        Insert: {
          accuracy?: number | null
          created_at?: string
          driver_id: string
          heading?: number | null
          id?: string
          lat: number
          lng: number
          ride_id: string
          speed?: number | null
        }
        Update: {
          accuracy?: number | null
          created_at?: string
          driver_id?: string
          heading?: number | null
          id?: string
          lat?: number
          lng?: number
          ride_id?: string
          speed?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ride_location_logs_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ride_location_logs_ride_id_fkey"
            columns: ["ride_id"]
            isOneToOne: false
            referencedRelation: "rides"
            referencedColumns: ["id"]
          },
        ]
      }
      ride_shares: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          is_active: boolean | null
          last_viewed_at: string | null
          recipient_email: string | null
          recipient_name: string | null
          recipient_phone: string | null
          ride_id: string
          share_token: string
          shared_by: string
          views_count: number | null
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          is_active?: boolean | null
          last_viewed_at?: string | null
          recipient_email?: string | null
          recipient_name?: string | null
          recipient_phone?: string | null
          ride_id: string
          share_token: string
          shared_by: string
          views_count?: number | null
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          is_active?: boolean | null
          last_viewed_at?: string | null
          recipient_email?: string | null
          recipient_name?: string | null
          recipient_phone?: string | null
          ride_id?: string
          share_token?: string
          shared_by?: string
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ride_shares_ride_id_fkey"
            columns: ["ride_id"]
            isOneToOne: false
            referencedRelation: "rides"
            referencedColumns: ["id"]
          },
        ]
      }
      rides: {
        Row: {
          cancellation_reason: string | null
          cancelled_at: string | null
          completed_at: string | null
          created_at: string
          destination_address: string
          destination_lat: number
          destination_lng: number
          discount_amount: number | null
          distance_km: number | null
          driver_id: string | null
          driver_rating: number | null
          estimated_price: number | null
          final_price: number | null
          franchise_id: string
          id: string
          is_promotional: boolean | null
          origin_address: string
          origin_lat: number
          origin_lng: number
          passenger_id: string | null
          passenger_rating: number | null
          promo_code: string | null
          service_type: Database["public"]["Enums"]["service_type"] | null
          started_at: string | null
          status: Database["public"]["Enums"]["ride_status"] | null
          surge_amount: number | null
          tip_amount: number | null
          tip_paid_at: string | null
          updated_at: string
        }
        Insert: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          completed_at?: string | null
          created_at?: string
          destination_address: string
          destination_lat: number
          destination_lng: number
          discount_amount?: number | null
          distance_km?: number | null
          driver_id?: string | null
          driver_rating?: number | null
          estimated_price?: number | null
          final_price?: number | null
          franchise_id: string
          id?: string
          is_promotional?: boolean | null
          origin_address: string
          origin_lat: number
          origin_lng: number
          passenger_id?: string | null
          passenger_rating?: number | null
          promo_code?: string | null
          service_type?: Database["public"]["Enums"]["service_type"] | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["ride_status"] | null
          surge_amount?: number | null
          tip_amount?: number | null
          tip_paid_at?: string | null
          updated_at?: string
        }
        Update: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          completed_at?: string | null
          created_at?: string
          destination_address?: string
          destination_lat?: number
          destination_lng?: number
          discount_amount?: number | null
          distance_km?: number | null
          driver_id?: string | null
          driver_rating?: number | null
          estimated_price?: number | null
          final_price?: number | null
          franchise_id?: string
          id?: string
          is_promotional?: boolean | null
          origin_address?: string
          origin_lat?: number
          origin_lng?: number
          passenger_id?: string | null
          passenger_rating?: number | null
          promo_code?: string | null
          service_type?: Database["public"]["Enums"]["service_type"] | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["ride_status"] | null
          surge_amount?: number | null
          tip_amount?: number | null
          tip_paid_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rides_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rides_franchise_id_fkey"
            columns: ["franchise_id"]
            isOneToOne: false
            referencedRelation: "franchises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rides_franchise_id_fkey"
            columns: ["franchise_id"]
            isOneToOne: false
            referencedRelation: "franchises_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rides_passenger_id_fkey"
            columns: ["passenger_id"]
            isOneToOne: false
            referencedRelation: "passengers"
            referencedColumns: ["id"]
          },
        ]
      }
      risk_incidents: {
        Row: {
          created_at: string
          description: string | null
          franchise_id: string
          id: string
          incident_type: string
          lat: number
          lng: number
          reported_by: string
          reporter_type: string
          resolved_at: string | null
          resolved_by: string | null
          ride_id: string | null
          severity: string | null
          status: string | null
          zone_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          franchise_id: string
          id?: string
          incident_type: string
          lat: number
          lng: number
          reported_by: string
          reporter_type: string
          resolved_at?: string | null
          resolved_by?: string | null
          ride_id?: string | null
          severity?: string | null
          status?: string | null
          zone_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          franchise_id?: string
          id?: string
          incident_type?: string
          lat?: number
          lng?: number
          reported_by?: string
          reporter_type?: string
          resolved_at?: string | null
          resolved_by?: string | null
          ride_id?: string | null
          severity?: string | null
          status?: string | null
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "risk_incidents_franchise_id_fkey"
            columns: ["franchise_id"]
            isOneToOne: false
            referencedRelation: "franchises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risk_incidents_franchise_id_fkey"
            columns: ["franchise_id"]
            isOneToOne: false
            referencedRelation: "franchises_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risk_incidents_ride_id_fkey"
            columns: ["ride_id"]
            isOneToOne: false
            referencedRelation: "rides"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risk_incidents_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "risk_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      risk_zones: {
        Row: {
          block_reason: string | null
          center_lat: number | null
          center_lng: number | null
          created_at: string
          created_by: string | null
          description: string | null
          franchise_id: string
          id: string
          incidents_count: number | null
          is_active: boolean | null
          is_blocked: boolean | null
          last_incident_at: string | null
          name: string
          polygon_coords: Json
          radius_meters: number | null
          risk_level: string
          updated_at: string
        }
        Insert: {
          block_reason?: string | null
          center_lat?: number | null
          center_lng?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          franchise_id: string
          id?: string
          incidents_count?: number | null
          is_active?: boolean | null
          is_blocked?: boolean | null
          last_incident_at?: string | null
          name: string
          polygon_coords: Json
          radius_meters?: number | null
          risk_level: string
          updated_at?: string
        }
        Update: {
          block_reason?: string | null
          center_lat?: number | null
          center_lng?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          franchise_id?: string
          id?: string
          incidents_count?: number | null
          is_active?: boolean | null
          is_blocked?: boolean | null
          last_incident_at?: string | null
          name?: string
          polygon_coords?: Json
          radius_meters?: number | null
          risk_level?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "risk_zones_franchise_id_fkey"
            columns: ["franchise_id"]
            isOneToOne: false
            referencedRelation: "franchises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risk_zones_franchise_id_fkey"
            columns: ["franchise_id"]
            isOneToOne: false
            referencedRelation: "franchises_public"
            referencedColumns: ["id"]
          },
        ]
      }
      security_audit_log: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          ip_address: string | null
          resource_id: string | null
          resource_type: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          resource_id?: string | null
          resource_type: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          resource_id?: string | null
          resource_type?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          billing_period: string
          created_at: string
          description: string | null
          discount_percentage: number | null
          exclusive_promotions: boolean | null
          features: Json | null
          franchise_id: string | null
          free_cancellations: number | null
          id: string
          is_active: boolean | null
          is_global: boolean | null
          name: string
          price: number
          priority_matching: boolean | null
        }
        Insert: {
          billing_period: string
          created_at?: string
          description?: string | null
          discount_percentage?: number | null
          exclusive_promotions?: boolean | null
          features?: Json | null
          franchise_id?: string | null
          free_cancellations?: number | null
          id?: string
          is_active?: boolean | null
          is_global?: boolean | null
          name: string
          price: number
          priority_matching?: boolean | null
        }
        Update: {
          billing_period?: string
          created_at?: string
          description?: string | null
          discount_percentage?: number | null
          exclusive_promotions?: boolean | null
          features?: Json | null
          franchise_id?: string | null
          free_cancellations?: number | null
          id?: string
          is_active?: boolean | null
          is_global?: boolean | null
          name?: string
          price?: number
          priority_matching?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "subscription_plans_franchise_id_fkey"
            columns: ["franchise_id"]
            isOneToOne: false
            referencedRelation: "franchises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_plans_franchise_id_fkey"
            columns: ["franchise_id"]
            isOneToOne: false
            referencedRelation: "franchises_public"
            referencedColumns: ["id"]
          },
        ]
      }
      support_conversations: {
        Row: {
          assigned_to: string | null
          city_identified: string | null
          created_at: string
          franchise_id: string | null
          id: string
          is_ai_handled: boolean | null
          status: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          city_identified?: string | null
          created_at?: string
          franchise_id?: string | null
          id?: string
          is_ai_handled?: boolean | null
          status?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          city_identified?: string | null
          created_at?: string
          franchise_id?: string | null
          id?: string
          is_ai_handled?: boolean | null
          status?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_conversations_franchise_id_fkey"
            columns: ["franchise_id"]
            isOneToOne: false
            referencedRelation: "franchises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_conversations_franchise_id_fkey"
            columns: ["franchise_id"]
            isOneToOne: false
            referencedRelation: "franchises_public"
            referencedColumns: ["id"]
          },
        ]
      }
      support_messages: {
        Row: {
          content: string
          content_type: string | null
          conversation_id: string
          created_at: string
          file_url: string | null
          id: string
          is_from_ai: boolean | null
          sender_id: string | null
          sender_type: string
        }
        Insert: {
          content: string
          content_type?: string | null
          conversation_id: string
          created_at?: string
          file_url?: string | null
          id?: string
          is_from_ai?: boolean | null
          sender_id?: string | null
          sender_type: string
        }
        Update: {
          content?: string
          content_type?: string | null
          conversation_id?: string
          created_at?: string
          file_url?: string | null
          id?: string
          is_from_ai?: boolean | null
          sender_id?: string | null
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "support_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      tip_transactions: {
        Row: {
          amount: number
          created_at: string
          driver_id: string
          franchise_id: string
          id: string
          passenger_id: string
          ride_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          driver_id: string
          franchise_id: string
          id?: string
          passenger_id: string
          ride_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          driver_id?: string
          franchise_id?: string
          id?: string
          passenger_id?: string
          ride_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tip_transactions_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tip_transactions_franchise_id_fkey"
            columns: ["franchise_id"]
            isOneToOne: false
            referencedRelation: "franchises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tip_transactions_franchise_id_fkey"
            columns: ["franchise_id"]
            isOneToOne: false
            referencedRelation: "franchises_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tip_transactions_passenger_id_fkey"
            columns: ["passenger_id"]
            isOneToOne: false
            referencedRelation: "passengers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tip_transactions_ride_id_fkey"
            columns: ["ride_id"]
            isOneToOne: false
            referencedRelation: "rides"
            referencedColumns: ["id"]
          },
        ]
      }
      user_role_preferences: {
        Row: {
          id: string
          selected_role: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          selected_role: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          id?: string
          selected_role?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          cancellation_reason: string | null
          cancelled_at: string | null
          created_at: string
          current_period_end: string
          current_period_start: string
          franchise_id: string | null
          id: string
          last_payment_at: string | null
          next_payment_at: string | null
          payment_method: string | null
          plan_id: string
          started_at: string
          status: string | null
          user_id: string
        }
        Insert: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          created_at?: string
          current_period_end: string
          current_period_start: string
          franchise_id?: string | null
          id?: string
          last_payment_at?: string | null
          next_payment_at?: string | null
          payment_method?: string | null
          plan_id: string
          started_at?: string
          status?: string | null
          user_id: string
        }
        Update: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          franchise_id?: string | null
          id?: string
          last_payment_at?: string | null
          next_payment_at?: string | null
          payment_method?: string | null
          plan_id?: string
          started_at?: string
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_franchise_id_fkey"
            columns: ["franchise_id"]
            isOneToOne: false
            referencedRelation: "franchises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_subscriptions_franchise_id_fkey"
            columns: ["franchise_id"]
            isOneToOne: false
            referencedRelation: "franchises_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      user_wallets: {
        Row: {
          balance: number | null
          created_at: string
          id: string
          total_earned: number | null
          total_spent: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number | null
          created_at?: string
          id?: string
          total_earned?: number | null
          total_spent?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number | null
          created_at?: string
          id?: string
          total_earned?: number | null
          total_spent?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          description: string | null
          id: string
          reference_id: string | null
          reference_type: string | null
          type: string
          wallet_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          reference_type?: string | null
          type: string
          wallet_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          reference_type?: string | null
          type?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "user_wallets"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      franchises_public: {
        Row: {
          base_price: number | null
          city_id: string | null
          created_at: string | null
          id: string | null
          is_active: boolean | null
          name: string | null
          price_per_km: number | null
        }
        Insert: {
          base_price?: number | null
          city_id?: string | null
          created_at?: string | null
          id?: string | null
          is_active?: boolean | null
          name?: string | null
          price_per_km?: number | null
        }
        Update: {
          base_price?: number | null
          city_id?: string | null
          created_at?: string | null
          id?: string | null
          is_active?: boolean | null
          name?: string | null
          price_per_km?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "franchises_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: true
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      accept_ride: {
        Args: { p_driver_id: string; p_ride_id: string }
        Returns: Json
      }
      check_rate_limit: {
        Args: {
          p_action: string
          p_block_duration_minutes?: number
          p_identifier: string
          p_max_attempts?: number
          p_window_minutes?: number
        }
        Returns: boolean
      }
      complete_ride: {
        Args: {
          p_driver_rating?: number
          p_final_price: number
          p_passenger_rating?: number
          p_ride_id: string
        }
        Returns: Json
      }
      create_ride_share: {
        Args: {
          p_recipient_name?: string
          p_recipient_phone?: string
          p_ride_id: string
        }
        Returns: Json
      }
      deduct_franchise_credit: {
        Args: {
          p_amount: number
          p_description?: string
          p_franchise_id: string
          p_ride_id?: string
        }
        Returns: Json
      }
      get_api_key: {
        Args: {
          p_environment?: string
          p_franchise_id: string
          p_service_name: string
        }
        Returns: {
          api_key: string
          api_secret: string
          is_franchise_key: boolean
          metadata: Json
        }[]
      }
      get_available_drivers: {
        Args: { p_franchise_id: string; p_limit?: number }
        Returns: {
          current_lat: number
          current_lng: number
          id: string
          profile_avatar: string
          profile_name: string
          profile_phone: string
          rating: number
          total_rides: number
          user_id: string
          vehicle_color: string
          vehicle_model: string
          vehicle_plate: string
        }[]
      }
      get_driver_basic_info: {
        Args: { driver_uuid: string }
        Returns: {
          id: string
          is_online: boolean
          rating: number
          total_rides: number
          vehicle_color: string
          vehicle_model: string
          vehicle_plate: string
        }[]
      }
      get_franchise_payment_settings: {
        Args: { _franchise_id: string }
        Returns: {
          has_api_key: boolean
          payment_gateway: string
          payment_webhook_url: string
        }[]
      }
      get_user_franchise_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      log_security_event: {
        Args: {
          p_action: string
          p_details?: Json
          p_resource_id?: string
          p_resource_type: string
        }
        Returns: undefined
      }
      process_franchise_credit_recharge: {
        Args: {
          p_amount: number
          p_franchise_id: string
          p_payment_id: string
          p_payment_method?: string
        }
        Returns: Json
      }
      process_referral_bonus: {
        Args: { p_referee_user_id: string }
        Returns: Json
      }
      set_franchise_payment_settings: {
        Args: {
          _franchise_id: string
          _payment_api_key: string
          _payment_gateway: string
          _payment_webhook_url: string
        }
        Returns: undefined
      }
      verify_franchise_isolation: {
        Args: { other_franchise_id: string; test_franchise_id: string }
        Returns: Json
      }
    }
    Enums: {
      app_role:
        | "super_admin"
        | "franchise_admin"
        | "driver"
        | "passenger"
        | "merchant"
      delivery_status:
        | "pending"
        | "accepted"
        | "picked_up"
        | "delivered"
        | "cancelled"
      kyc_status: "pending" | "approved" | "rejected"
      payment_status: "pending" | "paid" | "failed" | "refunded"
      person_type: "pf" | "pj"
      ride_status:
        | "pending"
        | "accepted"
        | "in_progress"
        | "completed"
        | "cancelled"
      service_type: "ride" | "delivery" | "pharmacy"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "super_admin",
        "franchise_admin",
        "driver",
        "passenger",
        "merchant",
      ],
      delivery_status: [
        "pending",
        "accepted",
        "picked_up",
        "delivered",
        "cancelled",
      ],
      kyc_status: ["pending", "approved", "rejected"],
      payment_status: ["pending", "paid", "failed", "refunded"],
      person_type: ["pf", "pj"],
      ride_status: [
        "pending",
        "accepted",
        "in_progress",
        "completed",
        "cancelled",
      ],
      service_type: ["ride", "delivery", "pharmacy"],
    },
  },
} as const
