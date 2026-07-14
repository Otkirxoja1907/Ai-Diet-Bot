import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "../../../utils/supabase/admin.js";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const db = createSupabaseAdmin();

  let { data: user } = await db
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  if (!user) {
    const { data: newUser } = await db
      .from("users")
      .upsert({ id: userId, tier: "free", chat_used_today: 0 })
      .select()
      .single();
    user = newUser;
  }

  const now = new Date();
  const expiry = user.tier_expiry ? new Date(user.tier_expiry) : null;
  const isActive = expiry && expiry > now;

  let chatUsedToday = user.chat_used_today || 0;
  const lastReset = user.last_reset_date;

  if (!lastReset || lastReset !== now.toISOString().split("T")[0]) {
    chatUsedToday = 0;
    await db
      .from("users")
      .update({ chat_used_today: 0, last_reset_date: now.toISOString().split("T")[0] })
      .eq("id", userId);
  }

  return NextResponse.json({
    tier: isActive ? user.tier : "free",
    chatUsedToday,
    tierExpiry: user.tier_expiry || null,
  });
}
