# Lisbon with Friends · Web Push setup

The browser/PWA side and the Edge Function are already in this repository. The VAPID private key must never be committed to GitHub.

## 1. Run the database migration

Open **Supabase → SQL Editor** and run the current `supabase.sql` from this repository. This creates the private `push_subscriptions` table plus the `register_push_subscription` and `unregister_push_subscription` RPCs.

## 2. Configure Edge Function secrets

Deploy `supabase/functions/send-web-push` and configure these secrets:

- `VAPID_PUBLIC_KEY` = the same public key stored in `config.js`
- `VAPID_PRIVATE_KEY` = keep this private; do not commit it
- `VAPID_SUBJECT` = `mailto:ralphrichter@me.com`

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are provided by Supabase to Edge Functions.

## 3. Create two Database Webhooks

In **Supabase → Database → Webhooks**, create two webhooks to the `send-web-push` Edge Function:

1. Table `ideas`, event **INSERT**
2. Table `votes`, event **INSERT**

Use the Supabase Edge Function webhook option and add the service-key authorization header when offered by the dashboard.

The function sends notifications to every registered device except the user who created the entry/vote. Expired subscriptions (HTTP 404/410) are removed automatically.

## 4. iPhone

On iPhone, open the GitHub Pages site in Safari, use **Share → Add to Home Screen**, launch the installed Lisbon app from the Home Screen, and tap **Notifications**. The app then creates a Web Push subscription and stores it in Supabase.

Normal Safari tabs on iPhone do not expose Web Push notifications; the Home Screen web app is required.
