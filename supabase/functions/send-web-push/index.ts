import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

type WebhookPayload = {
  type?: string;
  table?: string;
  schema?: string;
  record?: Record<string, unknown> | null;
  old_record?: Record<string, unknown> | null;
};

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export default {
  async fetch(req: Request): Promise<Response> {
    if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const vapidPublic = Deno.env.get("VAPID_PUBLIC_KEY") || "";
    const vapidPrivate = Deno.env.get("VAPID_PRIVATE_KEY") || "";
    const vapidSubject = Deno.env.get("VAPID_SUBJECT") || "mailto:ralphrichter@me.com";

    if (!supabaseUrl || !serviceRole || !vapidPublic || !vapidPrivate) {
      return Response.json({ error: "Missing Supabase or VAPID configuration" }, { status: 500 });
    }

    webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);
    const admin = createClient(supabaseUrl, serviceRole, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    let payload: WebhookPayload;
    try {
      payload = await req.json();
    } catch {
      return Response.json({ error: "Invalid JSON" }, { status: 400 });
    }

    if ((payload.type || "").toUpperCase() !== "INSERT" || !payload.record) {
      return Response.json({ ignored: true });
    }

    const table = text(payload.table);
    const record = payload.record;
    let title = "Lisbon with Friends";
    let body = "There is an update to the trip.";
    let url = "./#overview";
    let actorUserId = text(record.user_id);
    let actorName = text(record.user_name || record.created_by);

    if (table === "ideas") {
      const entryTitle = text(record.title) || "New entry";
      const type = text(record.type);
      body = actorName ? `${actorName} added: ${entryTitle}` : `New entry: ${entryTitle}`;
      url = type === "idea" ? "./#suggestions" : "./#overview";
    } else if (table === "votes") {
      title = "New vote";
      const entryId = text(record.entry_id || record.idea_id);
      let entryTitle = "an entry";
      if (entryId) {
        const { data } = await admin.from("ideas").select("title").eq("id", entryId).maybeSingle();
        if (data?.title) entryTitle = data.title;
      }
      body = `${actorName || "Someone"} liked ${entryTitle}`;
      url = "./#suggestions";
    } else {
      return Response.json({ ignored: true, table });
    }

    const { data: subscriptions, error } = await admin
      .from("push_subscriptions")
      .select("endpoint,p256dh,auth,user_id,user_name");

    if (error) return Response.json({ error: error.message }, { status: 500 });

    const recipients = (subscriptions || []).filter((sub) => {
      const sameUserId = actorUserId && text(sub.user_id) === actorUserId;
      const sameName = actorName && text(sub.user_name).toLowerCase() === actorName.toLowerCase();
      return !sameUserId && !sameName;
    });

    let sent = 0;
    let removed = 0;
    const message = JSON.stringify({ title, body, url, tag: `${table}-${text(record.id) || Date.now()}` });

    await Promise.all(recipients.map(async (sub) => {
      try {
        await webpush.sendNotification({
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth }
        }, message);
        sent += 1;
      } catch (err) {
        const statusCode = Number((err as { statusCode?: number })?.statusCode || 0);
        if (statusCode === 404 || statusCode === 410) {
          await admin.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
          removed += 1;
        } else {
          console.error("Push delivery failed", statusCode, err);
        }
      }
    }));

    return Response.json({ sent, removed, recipients: recipients.length });
  }
};
