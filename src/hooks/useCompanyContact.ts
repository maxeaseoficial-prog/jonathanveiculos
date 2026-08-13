import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import * as fallback from "@/lib/site-data";

export interface CompanyContact {
  name: string;
  whatsappUrl: string;
  whatsappPortoUniaoUrl: string;
  whatsappBiturunaUrl: string;
  phoneDisplay: string;
  phoneTel: string;
  instagramUrl: string;
  instagramHandle: string;
  facebookUrl: string;
  addressLine1: string;
  addressLine2: string;
  addressCep: string;
  addressFull: string;
  biturunaAddress: string;
  biturunaLine2: string;
  biturunaCep: string;
  mapsEmbedUrl: string;
  businessHours: string;
  email: string;
}

const digitsOnly = (s: string) => (s || "").replace(/\D/g, "");

function toWhatsappUrl(raw: string | null | undefined): string {
  if (!raw) return fallback.WHATSAPP_URL;
  const trimmed = raw.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const digits = digitsOnly(trimmed);
  if (!digits) return fallback.WHATSAPP_URL;
  return `https://wa.me/${digits}`;
}

function toTel(raw: string | null | undefined): string {
  const digits = digitsOnly(raw ?? "");
  if (!digits) return fallback.PHONE_TEL;
  return digits.startsWith("55") ? `+${digits}` : `+55${digits}`;
}

function formatPhoneDisplay(raw: string | null | undefined): string {
  const digits = digitsOnly(raw ?? "");
  if (!digits) return fallback.PHONE_DISPLAY;
  const local = digits.startsWith("55") ? digits.slice(2) : digits;
  if (local.length === 11) return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`;
  if (local.length === 10) return `(${local.slice(0, 2)}) ${local.slice(2, 6)}-${local.slice(6)}`;
  return raw ?? fallback.PHONE_DISPLAY;
}

function toSocialUrl(raw: string | null | undefined, base: string, fb: string): string {
  if (!raw) return fb;
  const t = raw.trim();
  if (!t) return fb;
  if (/^https?:\/\//i.test(t)) return t;
  const handle = t.replace(/^@/, "").replace(/\/+$/, "");
  return `${base}${handle}`;
}

function handleFromInstagram(url: string): string {
  try {
    const u = new URL(url);
    const seg = u.pathname.split("/").filter(Boolean)[0];
    return seg ? `@${seg}` : fallback.INSTAGRAM_HANDLE;
  } catch {
    return fallback.INSTAGRAM_HANDLE;
  }
}

export function useCompanyContact(): CompanyContact {
  const qc = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel(`company_settings-public-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "company_settings" },
        () => qc.invalidateQueries({ queryKey: ["company_settings_public"] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);


  const { data } = useQuery({
    queryKey: ["company_settings_public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_settings")
        .select("*")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    staleTime: 60_000,
  });

  const whatsappUrl = toWhatsappUrl(data?.whatsapp);
  const whatsappPortoUniaoUrl = toWhatsappUrl(data?.whatsapp_porto_uniao);
  const whatsappBiturunaUrl = toWhatsappUrl(data?.whatsapp_bituruna);
  const instagramUrl = toSocialUrl(data?.instagram, "https://www.instagram.com/", fallback.INSTAGRAM_URL);
  const facebookUrl = toSocialUrl(data?.facebook, "https://www.facebook.com/", fallback.FACEBOOK_URL);

  const address = data?.address?.trim() || fallback.ADDRESS_LINE_1;
  const city = data?.city?.trim() || "";
  const state = data?.state?.trim() || "";
  const cep = data?.cep?.trim() || fallback.ADDRESS_CEP;
  const line2 = [city, state].filter(Boolean).join(" / ") || fallback.ADDRESS_LINE_2;
  const addressFull = `${address}${line2 ? ` - ${line2}` : ""}${cep ? `, ${cep}` : ""}`;

  return {
    name: data?.name || "Jonathan Veículos",
    whatsappUrl,
    whatsappPortoUniaoUrl,
    whatsappBiturunaUrl,
    phoneDisplay: formatPhoneDisplay(data?.phone),
    phoneTel: toTel(data?.phone),
    instagramUrl,
    instagramHandle: data?.instagram ? handleFromInstagram(instagramUrl) : fallback.INSTAGRAM_HANDLE,
    facebookUrl,
    addressLine1: address,
    addressLine2: line2,
    addressCep: cep,
    addressFull,
    biturunaAddress: data?.city === "Bituruna" ? (data?.address || fallback.BITURUNA_ADDRESS) : fallback.BITURUNA_ADDRESS,
    biturunaLine2: data?.city === "Bituruna" ? `${data?.city || "Bituruna"} / ${data?.state || "PR"}` : fallback.BITURUNA_LINE2,
    biturunaCep: data?.city === "Bituruna" ? (data?.cep || fallback.BITURUNA_CEP) : fallback.BITURUNA_CEP,
    mapsEmbedUrl: `https://www.google.com/maps?q=${encodeURIComponent(addressFull)}&output=embed`,
    businessHours: data?.business_hours || fallback.BUSINESS_HOURS,
    email: data?.email || fallback.EMAIL,
  };
}
