# Nest marketplace

A responsive React storefront with an Express API and MongoDB persistence. Includes product discovery, search, category filters, sorting, product details, browser-persisted bag and wishlist, email signup/login, Google Identity Services, shipping address checkout, cash on delivery, Razorpay checkout, verified payments, and account order history.

## Run locally

Requires Node.js 22+ and access to the MongoDB Atlas cluster.

```sh
npm install
npm run dev
```

Open http://localhost:5173. The API runs on port 4000. On Windows PowerShell, use `npm.cmd` if execution policy blocks `npm.ps1`.

The requested `.env` is already created, with the supplied MongoDB URI and a generated session signing secret. It is ignored by Git. No `.env.example` is used. Never copy its contents into source control or frontend environment variables.

MongoDB uses the `nest_shop` database. Startup inserts the sample catalog only where matching product slugs do not exist. Users and orders persist in MongoDB; bag and wishlist persist in the current browser. If Atlas is unavailable, the catalog remains viewable as a preview; account operations and checkout require a working database and never fake success. Permit the server's outbound IP in Atlas Network Access if needed.

## Activate integrations

Fill these existing entries in `.env` and restart the server:

- `GOOGLE_CLIENT_ID`: Google OAuth web client ID. Add `http://localhost:5173` to Authorized JavaScript origins. The server verifies Google ID tokens. Existing password accounts are not automatically linked by email.
- `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`: Start with Razorpay test keys. Checkout amounts come from database prices. The server validates the signature and fetches the payment to confirm capture, amount, currency, and order identity.
- `RAZORPAY_WEBHOOK_SECRET`: Set a Razorpay webhook for `payment.captured` at your public HTTPS `/api/payments/webhook` endpoint. Webhooks reconcile captured payments even if the browser closes.
- Configure automatic payment capture in Razorpay. An authorized payment is not represented as paid until captured.

Official integration references: [Razorpay](https://razorpay.com/docs/payments/server-integration/nodejs/integration-steps/) and [Google token verification](https://developers.google.com/identity/gsi/web/guides/verify-google-id-token).

## Signup welcome emails

Welcome emails now use Gmail SMTP through Nodemailer. The sender is fixed to **Nest <kiranjeetkr80@gmail.com>**. Both the recipient and Reply-To are the new account's email address, as requested. This means pressing Reply addresses the user's own inbox. Normal login does not trigger another welcome email; email signup and first-time Google signup queue one notification.

Only one email credential is needed in the existing .env:

```dotenv
GMAIL_APP_PASSWORD=your_google_app_password
```

1. Sign into **kiranjeetkr80@gmail.com** and enable 2-Step Verification in Google Account Security.
2. Open https://myaccount.google.com/apppasswords, create an App Password named Nest, and enter it in GMAIL_APP_PASSWORD locally. Do not use the account's normal password. Spaces in the generated App Password are removed automatically.
3. Restart with `npm.cmd run dev`. New signup emails are processed every 5 seconds while the API is running.

Google may not offer App Passwords for some managed accounts or security configurations; see [Google's App Password instructions](https://support.google.com/accounts/answer/185833). Sending from a deployed server requires outbound access to smtp.gmail.com on TLS port 465. Gmail limits and security checks apply; inbox placement is not guaranteed. See [Nodemailer's Gmail guide](https://nodemailer.com/guides/using-gmail).

Resend is no longer used. RESEND_API_KEY, EMAIL_FROM and EMAIL_REPLY_TO have been removed from .env. APP_URL still controls the website button in the email; set it to the real HTTPS URL when deploying.

For a manual test to an inbox you control:

```sh
npm.cmd run email:test -- user@example.com
```

That command sends one real welcome email. Automated tests mock SMTP and send no real mail. Disable GMAIL_APP_PASSWORD and restart the API before synthetic browser signup tests.

Delivery state remains in each user's welcomeEmail field. Missing credentials leave new messages pending, and email problems do not undo account creation. Confirmed temporary SMTP failures retry up to five times. Interrupted or ambiguous attempts are marked failed for review because SMTP has no exactly-once guarantee; check Gmail Sent before resending. Gmail acceptance is not proof of inbox delivery. Old failed Resend attempts are not automatically resent; pending messages use the new Gmail sender and the correct user's email. Existing accounts are not backfilled merely by logging in.

## Build and checks

```sh
npm test
npm run build
npm start
```

Browser smoke check (with the development server running): `node scripts/smoke.mjs`. Install Chromium once with `npx playwright install chromium`. The check covers signup/login, wishlist, bag, cash-on-delivery checkout, saved orders, and mobile overflow; it removes its own temporary MongoDB account and orders afterward. Screenshots are saved under `test-results/`.

Verified locally: production build, three checkout-total tests, MongoDB Atlas connectivity, and the desktop/mobile browser smoke check. Google OAuth and online payment execution remain unverified until their credentials are supplied.

For production, set `NODE_ENV=production`, set `APP_URL` to the public HTTPS origin, build, then run the API behind HTTPS. It serves the built frontend. The development origin is `http://localhost:5173`; production cookies require HTTPS.

## Scope before commercial launch

This is a complete customer shopping flow with a sample catalog, not an Amazon-scale marketplace. Publish real merchant/support details, product specifications and policies; replace illustrative Unsplash photos and sample ratings. Stock currently validates against catalog availability but is not reserved/decremented. Add transactional inventory reservations, fulfillment/admin tooling, refunds, tax invoices, password recovery/email verification, monitoring, and deployment-specific hardening before accepting commercial orders. Payment and Google integrations need merchant-owned credentials and end-to-end sandbox validation. No card details are stored by this application.
