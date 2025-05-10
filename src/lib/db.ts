import { supabase } from "../../supabase/supabase";
import { Database } from "../types/supabase";

export type Auction = Database["public"]["Tables"]["auctions"]["Row"];
export type AuctionItem = Database["public"]["Tables"]["auction_items"]["Row"];
export type Bid = Database["public"]["Tables"]["bids"]["Row"];
export type PhoneVerification =
  Database["public"]["Tables"]["phone_verifications"]["Row"];

// Auctions
export async function getAuctions() {
  const { data, error } = await supabase
    .from("auctions")
    .select("*")
    .order("start_time", { ascending: true });

  if (error) throw error;
  return data;
}

export async function getAuctionById(id: string) {
  const { data, error } = await supabase
    .from("auctions")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

export async function createAuction(
  auction: Omit<Auction, "id" | "created_at" | "updated_at">,
) {
  const { data, error } = await supabase
    .from("auctions")
    .insert(auction)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Auction Items
export async function getAuctionItems(auctionId: string) {
  const { data, error } = await supabase
    .from("auction_items")
    .select("*")
    .eq("auction_id", auctionId);

  if (error) throw error;
  return data;
}

export async function getAuctionItemById(id: string) {
  const { data, error } = await supabase
    .from("auction_items")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

export async function createAuctionItem(
  item: Omit<AuctionItem, "id" | "created_at" | "updated_at" | "current_bid">,
) {
  const { data, error } = await supabase
    .from("auction_items")
    .insert(item)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Bids
export async function getBidsForItem(itemId: string) {
  const { data, error } = await supabase
    .from("bids")
    .select("*, users(name, phone_number)")
    .eq("item_id", itemId)
    .order("amount", { ascending: false });

  if (error) throw error;
  return data;
}

export async function createBid(bid: Omit<Bid, "id" | "created_at">) {
  // First, check if this is the highest bid
  const { data: currentHighestBid } = await supabase
    .from("bids")
    .select("amount")
    .eq("item_id", bid.item_id)
    .order("amount", { ascending: false })
    .limit(1)
    .single();

  if (currentHighestBid && currentHighestBid.amount >= bid.amount) {
    throw new Error("Your bid must be higher than the current highest bid");
  }

  // Create the bid
  const { data, error } = await supabase
    .from("bids")
    .insert(bid)
    .select()
    .single();

  if (error) throw error;

  // Update the current_bid on the auction item
  await supabase
    .from("auction_items")
    .update({ current_bid: bid.amount, updated_at: new Date().toISOString() })
    .eq("id", bid.item_id);

  return data;
}

// Phone Verifications
export async function createPhoneVerification(
  phoneNumber: string,
  userId?: string,
) {
  const { data, error } = await supabase
    .from("phone_verifications")
    .upsert({
      phone_number: phoneNumber,
      user_id: userId,
      verified: false,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function markPhoneAsVerified(
  phoneNumber: string,
  userId?: string,
) {
  const { data, error } = await supabase
    .from("phone_verifications")
    .update({
      verified: true,
      user_id: userId,
      updated_at: new Date().toISOString(),
    })
    .eq("phone_number", phoneNumber)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getPhoneVerification(phoneNumber: string) {
  const { data, error } = await supabase
    .from("phone_verifications")
    .select("*")
    .eq("phone_number", phoneNumber)
    .single();

  if (error && error.code !== "PGRST116") throw error; // PGRST116 is "No rows found"
  return data;
}
