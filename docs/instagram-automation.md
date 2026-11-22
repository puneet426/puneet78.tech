# Instagram Reel automation (ManyChat-style)

```
Someone comments on your reel
   │
   ├─► Public reply under the comment   "Thanks @rahul! Check your DMs 📩"
   └─► DM with a button                 "Hey rahul 👋 tap below"  [Send me the link]
                                              │ tap (or any reply)
                                              ▼
                               Follow-gate on? → do they follow you?
                                   │ no                         │ yes
                                   ▼                            ▼
              "Follow me first 🙏" [I followed ✅]     "Here you go 🎉" [Open link]
                     └──── tap → checks again ────┘
```

- Works on **any comment** by default; add per-reel or keyword automations from the dashboard.
- Dashboard at **`https://puneet.occazi.in/admin/instagram`**: edit messages, pick reels, toggle the follow-gate, see the funnel (comments → DMs → taps → delivered) and a live activity log.
- Uses Meta's **official** Instagram API (the same one ManyChat uses), so it's allowed and safe for your account.

## Files

| File | Purpose |
|---|---|
| `app/admin/instagram/page.tsx` | Dashboard UI |
| `app/api/instagram/webhook/route.ts` | Webhook Meta calls for comments, DMs and button taps |
| `app/api/instagram/admin/*` | Dashboard API (login, automations, activity, reels) |
| `lib/instagram/engine.ts` | The flow logic shown above |
| `lib/instagram/api.ts` | Instagram Graph API calls |
| `lib/instagram/store.ts` | Redis storage (automations, logs, stats) |
| `lib/instagram/config.ts` | Default automation used until you save one in the dashboard |

## One-time setup (~30 min)

### 1. Instagram account
Your Instagram must be a **Professional account** (Creator or Business).
Then in the Instagram app: Settings → Messages and story replies → Message controls →
**Connected tools → Allow access to messages** → ON.

### 2. Create a Meta app
1. <https://developers.facebook.com/apps> → **Create app** → use case
   **"Manage messaging & content on Instagram"**.
2. Open **Instagram → API setup with Instagram login**.
3. **Generate access tokens** → add your Instagram account → **Generate token** → copy it (`IG_ACCESS_TOKEN`).
4. **App settings → Basic** → copy the **App secret** (`IG_APP_SECRET`).

### 3. Add Redis (free) for storage
Vercel → your project → **Storage** → **Create** → **Upstash for Redis** (free plan) → connect it to
the project. This adds `KV_REST_API_URL` and `KV_REST_API_TOKEN` automatically.
Without it, automations you save in the dashboard and the logs are lost.

### 4. Environment variables (Vercel → Settings → Environment Variables)

```
IG_ACCESS_TOKEN=<token from step 2.3>
IG_APP_SECRET=<app secret from step 2.4>
IG_VERIFY_TOKEN=<any random string you make up>
IG_USERNAME=<your instagram handle without @>
ADMIN_PASSWORD=<a strong password for the dashboard>
```

Redeploy.

### 5. Subscribe the webhook
In **Instagram → API setup with Instagram login → Configure webhooks**:

- Callback URL: `https://puneet.occazi.in/api/instagram/webhook`
- Verify token: your `IG_VERIFY_TOKEN`
- **Verify and save**, then subscribe to these fields:
  **`comments`**, **`messages`**, **`messaging_postbacks`**

### 6. Test
Open `/admin/instagram`, log in, and edit the default automation (change the link to your notes/PDF).
Comment on one of your reels from another account that has a role on the app
(App roles → Roles → add an Instagram tester). You should get the reply and DM within seconds,
and see it in the Activity log.

### 7. Go live for everyone
While the app is in **Development mode** it only responds to accounts with a role on the app.
For all your followers:

1. App settings → Basic: add a Privacy Policy URL and app icon.
2. **App Review** → request Advanced Access for `instagram_business_basic`,
   `instagram_business_manage_comments` and `instagram_business_manage_messages`.
   Upload a short screen recording of the comment → DM → link flow.
3. Once approved, switch the app to **Live**.

## Instagram rules to know
- The first DM can be sent **once per comment**, within **7 days** of the comment.
- People who don't follow you get the DM in **message requests**. The follow-gate helps with this,
  because once they follow, later DMs land in the main inbox.
- After someone taps the button, you have 24 h to message them (the flow runs instantly, so this is fine).
- Your own comments and replies are ignored, so the bot never replies to itself.
- Normal DMs from people who aren't in an automation are left for you to answer.
- The access token lasts **60 days**. Refresh it before then:
  `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=<token>`
  and update `IG_ACCESS_TOKEN` in Vercel.
