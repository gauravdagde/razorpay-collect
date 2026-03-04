# Example: Freelancer Invoicing & Payment Tracking

## Scenario

You're a freelance designer. You just completed a branding project for a client and need to:

1. Create an invoice with line items
2. Send it to the client
3. Track payment

## Step 1: Create the Invoice

Tell your OpenClaw agent:

> "Create an invoice for TechStartup Pvt Ltd:
> - Logo design: ₹15,000
> - Brand guidelines document: ₹10,000
> - Social media templates (5): ₹5,000 each = ₹25,000
> Contact: Anita Desai, anita@techstartup.in, 9123456789
> Due by March 30, 2026"

The agent creates the invoice via `POST /v1/invoices` with line items, then issues it via `POST /v1/invoices/{id}/issue`.

```
Invoice created and sent!

Invoice #inv_a1b2c3d4e5
To: TechStartup Pvt Ltd (Anita Desai)
Due: 30 Mar 2026

| Item                      | Qty | Amount    |
|---------------------------|-----|-----------|
| Logo design               | 1   | ₹15,000   |
| Brand guidelines document | 1   | ₹10,000   |
| Social media templates    | 5   | ₹25,000   |
|                           |     |           |
| Total                     |     | ₹50,000   |

Payment link: https://rzp.io/inv/abc123
SMS and email notification sent to Anita.
```

## Step 2: Quick Payment Link (No Invoice Needed)

For smaller gigs where a formal invoice is overkill:

> "Send a payment link for ₹8,000 to Raj at 9988776655 — website maintenance retainer for March"

```
Payment link created!
Amount: ₹8,000
Link: https://rzp.io/i/xyz789
SMS sent to +919988776655
```

## Step 3: Check Outstanding Payments

> "Show me all unpaid invoices and links"

```
Outstanding Payments:

| Type    | Client              | Amount   | Status  | Due        |
|---------|---------------------|----------|---------|------------|
| Invoice | TechStartup Pvt Ltd | ₹50,000  | issued  | 30 Mar     |
| Link    | Raj (maintenance)   | ₹8,000   | created | No expiry  |
| Link    | CloudCo (hosting)   | ₹3,500   | expired | 15 Mar     |

Total outstanding: ₹61,500
```

## Step 4: Generate QR for In-Person Payment

Meeting a client in person and want to collect on the spot:

> "QR code for ₹12,000 — print collateral payment from Meera"

```
UPI QR Code generated!
Amount: ₹12,000 (fixed)
Type: Single use — closes after payment

QR Image: https://rzp.io/qr/abc123.png
Short URL: https://rzp.io/q/abc123

Share this with Meera to pay via any UPI app.
```