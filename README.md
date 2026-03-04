# razorpay-collect 🦞💳

**The first Indian payments skill for OpenClaw.**

13,700+ skills on ClawHub. Zero for Razorpay. Zero for UPI. Until now.

`razorpay-collect` turns any OpenClaw agent into a payment collection assistant — powered by Razorpay's APIs, operated through natural language, delivered on WhatsApp, Telegram, Slack, or any channel OpenClaw supports.

---

## The Problem

Collecting payments in India is still painfully manual. Society treasurers chase residents on WhatsApp groups. Freelancers send individual invoices. SMB owners toggle between dashboards and spreadsheets to track who's paid.

Razorpay has world-class APIs. OpenClaw has 20+ messaging channels. Nobody connected the two.

## The Solution

Tell your OpenClaw agent:

```
"Send ₹2500 maintenance links to all Block A residents"
```

The agent bulk-creates Razorpay payment links, sends them out, and tracks who's paid — all from your chat window.

```
"Generate a UPI QR for the electrician — ₹1800"
```

Instant QR code via Razorpay, shareable right from the conversation.

```
"Who hasn't paid from last month?"
```

The agent queries Razorpay, filters by status, and gives you a defaulter report.

---

## Workflows

### 1. Bulk Payment Link Collection
Create and distribute Razorpay payment links to a list of recipients. Supports partial payments, custom expiry dates, and automatic SMS/email notifications via Razorpay.

**Razorpay API:** `POST /v1/payment_links`

### 2. UPI QR Code Generation
Generate single-use or multi-use UPI QR codes for one-off payments. Share the QR image or short URL directly in chat.

**Razorpay API:** `POST /v1/payments/qr_codes`

### 3. Invoice Creation
Create itemized invoices with line items, tax breakdowns, and customer details. Razorpay handles delivery via SMS and email.

**Razorpay API:** `POST /v1/invoices`

### 4. Payment Status Tracking
Fetch payment status for links, orders, or invoices. Filter by paid/unpaid/expired. Get summary reports with amounts collected vs outstanding.

**Razorpay API:** `GET /v1/payment_links`, `GET /v1/payments`

### 5. Customer Management
Create and manage a customer directory synced with Razorpay. Reuse customer records across payment links, invoices, and subscriptions.

**Razorpay API:** `POST /v1/customers`

### 6. Recurring Subscriptions *(coming soon)*
Set up monthly recurring collections via Razorpay Subscriptions and UPI AutoPay — ideal for society maintenance, SaaS billing, or membership dues.

**Razorpay API:** `POST /v1/subscriptions`

---

## Installation

### From ClawHub
```bash
clawhub install razorpay-collect
```

### Manual
```bash
# Copy the skill folder to your OpenClaw workspace
cp -r razorpay-collect ~/.openclaw/skills/razorpay-collect

# Or to a specific agent workspace
cp -r razorpay-collect <workspace>/skills/razorpay-collect
```

Start a new OpenClaw session — the skill is picked up automatically.

## Configuration

### Required Environment Variables

| Variable | Description |
|---|---|
| `RAZORPAY_KEY_ID` | Your Razorpay API Key ID (starts with `rzp_test_` or `rzp_live_`) |
| `RAZORPAY_KEY_SECRET` | Your Razorpay API Key Secret |

### Setting Up

1. **Get API Keys:** Log into [Razorpay Dashboard](https://dashboard.razorpay.com) → Settings → API Keys → Generate Key.
2. **Test Mode:** Use test keys (`rzp_test_*`) to try the skill without real transactions. No money is debited.
3. **Configure in OpenClaw:**

```json
{
  "skills": {
    "entries": {
      "razorpay-collect": {
        "enabled": true,
        "env": {
          "RAZORPAY_KEY_ID": "rzp_test_xxxxxxxxxxxxx",
          "RAZORPAY_KEY_SECRET": "your_key_secret_here"
        }
      }
    }
  }
}
```

---

## Usage Examples

Once installed, just talk to your agent naturally:

| What you say | What happens |
|---|---|
| "Create a payment link for ₹5000, description: March rent" | Creates a Razorpay payment link, returns the short URL |
| "Send maintenance links to all residents — ₹2500 each" | Bulk-creates payment links from your resident list |
| "Generate a QR code for ₹1800" | Creates a UPI QR via Razorpay, returns image/URL |
| "Create an invoice for Acme Corp — 3 items" | Creates an itemized Razorpay invoice |
| "Show me all unpaid links from last week" | Fetches payment links filtered by status and date |
| "How much have we collected this month?" | Aggregates payments, shows collected vs outstanding |
| "Add Ramesh, flat 401, 9876543210 as a customer" | Creates a Razorpay customer record |

---

## Project Structure

```
razorpay-collect/
├── SKILL.md                        # Core skill file — instructions for the agent
├── references/
│   ├── razorpay-api.md             # Razorpay API reference (endpoints, params, examples)
│   └── indian-payments-context.md  # UPI, INR formatting, GST, and India-specific notes
├── scripts/
│   └── mock-server.js              # Mock Razorpay API server for testing without credentials
├── examples/
│   ├── society-collection.md       # Example: Society maintenance collection workflow
│   └── freelancer-invoicing.md     # Example: Freelancer invoice + payment tracking
└── README.md
```

---

## Mock API Server

Don't have Razorpay credentials yet? Use the mock server to test the skill:

```bash
cd razorpay-collect/scripts
node mock-server.js
```

The mock server runs on `http://localhost:8080` and simulates:
- Payment link creation and status
- QR code generation
- Invoice creation
- Payment status queries

Set `RAZORPAY_BASE_URL=http://localhost:8080/v1` in your skill config to use the mock.

---

## Why This Exists

Razorpay [just launched Agentic Payments](https://razorpay.com/m/agentic-payments/) with NPCI — AI-powered conversational payments using UPI Reserve Pay. This skill is the open-source, community-built version of that vision: letting any OpenClaw agent tap into Razorpay's payment infrastructure from any messaging channel.

India processes 20+ billion UPI transactions monthly. 85% of digital payments are UPI. The future of payments is conversational — and this skill connects OpenClaw's agent ecosystem to India's payment rails.

---

## Target Users

- **Society treasurers** — Collect maintenance, track defaults, send reminders. No more WhatsApp group chaos.
- **Freelancers** — Generate invoices, send payment links, track receivables. All from chat.
- **SMB owners** — Bulk collections, vendor payments via QR, subscription billing.
- **Anyone collecting money in India** — If you use Razorpay and OpenClaw, this skill just works.

---

## Roadmap

- [x] Payment link creation and bulk collection
- [x] UPI QR code generation
- [x] Invoice creation with line items
- [x] Payment status tracking and reporting
- [x] Customer management
- [x] Mock API server for testing
- [ ] Recurring subscriptions via UPI AutoPay
- [ ] Smart Collect (virtual account reconciliation)
- [ ] RazorpayX payouts (send money out)
- [ ] Route (split payments across accounts)
- [ ] Webhook listener for real-time payment notifications
- [ ] Publish to ClawHub

---

## Safety Rules

This skill handles financial operations. The following rules are enforced:

1. **ALWAYS** confirm amounts with the user before creating payment links or invoices.
2. **NEVER** store API keys or secrets in plain text files or chat logs.
3. **NEVER** auto-execute refunds without explicit user confirmation.
4. **All amounts are in paise** internally (₹299.35 = `29935`) — the skill handles conversion so the user talks in rupees.
5. **Test mode by default** — the skill warns if live keys are detected and confirms the user intends to process real payments.

---

## Tech Details

- **Razorpay API version:** v1
- **Base URL:** `https://api.razorpay.com/v1`
- **Auth:** Basic Auth (`RAZORPAY_KEY_ID:RAZORPAY_KEY_SECRET`)
- **Currency:** INR only (amounts in paise)
- **Required binaries:** `curl`, `jq`
- **Sandbox supported:** Yes — use `rzp_test_*` keys

---

## Contributing

PRs welcome. If you're adding a new workflow:

1. Add the API reference to `references/razorpay-api.md`
2. Update the workflow section in `SKILL.md`
3. Add a mock endpoint in `scripts/mock-server.js`
4. Test with both mock and sandbox keys

---

## License

MIT

---

Built for the [OpenClaw Showcase](https://luma.com/qt1z6mzk) by Razorpay, OpenAI & Peak XV Partners.
