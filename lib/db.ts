import { supabase } from "./supabase";
import { Tables, TablesInsert } from "@/types/database";

export async function getUserProfile(userId: string): Promise<Tables<"user_profiles"> | null> {
  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) return null;
  return data;
}

export async function getCompanies(userId: string): Promise<Tables<"companies">[]> {
  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) return [];
  return data || [];
}

export async function getOutreachEmails(userId: string): Promise<Tables<"outreach_emails">[]> {
  const { data, error } = await supabase
    .from("outreach_emails")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) return [];
  return data || [];
}
