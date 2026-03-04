---
name: razorpay-collect
description: Indian payment collection via Razorpay. Create payment links, UPI QR codes, invoices, and track payments. Use when asked to collect money, send payment links, generate QR codes, create invoices, check payment status, or manage customers in INR/UPI/India context.
version: 1.0.0
homepage: https://github.com/gaurav/razorpay-collect
metadata:
  openclaw:
    emoji: "💳"
    requires:
      bins: ["curl", "jq"]
      env: ["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET"]
    primaryEnv: "RAZORPAY_KEY_ID"
---

# Razorpay Collect 💳

Collect payments in India via Razorpay — payment links, UPI QR codes, invoices, and status tracking. All through natural language.

## Auth

All Razorpay API calls use Basic Auth.

```bash
curl -u $RAZORPAY_KEY_ID:$RAZORPAY_KEY_SECRET \
  -X POST https://api.razorpay.com/v1/{endpoint} \
  -H "Content-Type: application/json" \
  -d '{...}'
```

Test keys start with `rzp_test_`. Live keys start with `rzp_live_`.
If live keys detected, ALWAYS warn the user: "You are using LIVE keys. Real money will be charged. Confirm to proceed."

## Currency Rules

- Currency is always `INR`.
- Razorpay amounts are in **paise** (smallest unit). ₹299.35 = `29935`.
- When user says "₹2500", convert to `250000` paise before API call.
- When displaying amounts from API, convert paise back to rupees: `250000` → `₹2,500.00`.

## Workflow 1: Create Payment Link

When user says things like "send payment link", "collect ₹X from Y", "create link for maintenance".

```
POST https://api.razorpay.com/v1/payment_links
```

```json
{
  "amount": 250000,
  "currency": "INR",
  "description": "April maintenance — Flat 401",
  "customer": {
    "name": "Ramesh Kumar",
    "email": "ramesh@example.com",
    "contact": "+919876543210"
  },
  "notify": {
    "sms": true,
    "email": true
  },
  "reminder_enable": true,
  "callback_url": "",
  "callback_method": "get",
  "notes": {
    "flat": "401",
    "month": "April 2026",
    "block": "A"
  }
}
```

Response contains `short_url` — this is the shareable payment link.

Key fields in response:
- `id`: Payment link ID (e.g., `plink_abc123`). Save this.
- `short_url`: Shareable link (e.g., `https://rzp.io/i/abc`). Give this to user.
- `status`: `created` → `paid` → `expired` or `cancelled`.
- `amount_paid`: How much has been paid (in paise).

Optional parameters:
- `accept_partial`: `true` to allow partial payments.
- `first_min_partial_amount`: Minimum first payment in paise.
- `expire_by`: Unix timestamp for link expiry.
- `reference_id`: Your internal reference (max 40 chars, must be unique).

### Bulk Collection

When user wants to send links to multiple people (e.g., "send links to all 50 flats"):

1. Confirm the list of recipients (name, contact, amount).
2. Loop: create one payment link per recipient.
3. Track all link IDs.
4. Report: show table of recipient → link → status.

Store link IDs in a local file `razorpay_links_{date}.json` for later status checks.

## Workflow 2: Generate UPI QR Code

When user says "generate QR", "create QR code", "UPI QR for ₹X".

```
POST https://api.razorpay.com/v1/payments/qr_codes
```

```json
{
  "type": "upi_qr",
  "name": "Electrician payment",
  "usage": "single_use",
  "fixed_amount": true,
  "payment_amount": 180000,
  "description": "Payment for wiring work — March 2026",
  "customer_id": "cust_abc123",
  "close_by": 1711929600,
  "notes": {
    "purpose": "vendor payment"
  }
}
```

Key response fields:
- `id`: QR code ID (e.g., `qr_abc123`).
- `image_url`: URL of the QR code image. Share this with user.
- `short_url`: Short URL for the QR. Alternative to image.
- `close_by`: When the QR expires (Unix timestamp).
- `status`: `active` → `closed`.

Parameters:
- `usage`: `single_use` (closes after one payment) or `multiple_use`.
- `fixed_amount`: `true` for exact amount, `false` for any amount.
- `payment_amount`: Required if `fixed_amount` is `true`. In paise.
- `close_by`: Must be at least 2 minutes in future. Max 2 hours for single_use.

## Workflow 3: Create Invoice

When user says "create invoice", "bill for X", "invoice to company".

```
POST https://api.razorpay.com/v1/invoices
```

```json
{
  "type": "invoice",
  "description": "Q1 2026 Maintenance",
  "customer": {
    "name": "Acme Corp",
    "email": "accounts@acme.in",
    "contact": "+919876543210",
    "billing_address": {
      "line1": "Tower B, Floor 5",
      "city": "Pune",
      "state": "Maharashtra",
      "zipcode": "411001",
      "country": "IN"
    }
  },
  "line_items": [
    {
      "name": "Monthly Maintenance",
      "description": "Society maintenance for Jan-Mar 2026",
      "amount": 750000,
      "currency": "INR",
      "quantity": 3
    }
  ],
  "sms_notify": 1,
  "email_notify": 1,
  "expire_by": 1711929600,
  "notes": {
    "quarter": "Q1-2026"
  }
}
```

Key response fields:
- `id`: Invoice ID (e.g., `inv_abc123`).
- `short_url`: Payment URL for the invoice.
- `status`: `draft` → `issued` → `paid` / `expired` / `cancelled`.
- `amount_due`: Remaining amount in paise.
- `amount_paid`: Paid amount in paise.

After creation, issue the invoice:
```
POST https://api.razorpay.com/v1/invoices/{id}/issue
```

## Workflow 4: Check Payment Status

When user says "who hasn't paid", "check status", "show collections", "defaulters list".

### Fetch single payment link:
```
GET https://api.razorpay.com/v1/payment_links/{id}
```

### Fetch all payment links:
```
GET https://api.razorpay.com/v1/payment_links
```

### Fetch payments for an order:
```
GET https://api.razorpay.com/v1/orders/{id}/payments
```

### Fetch single payment details:
```
GET https://api.razorpay.com/v1/payments/{id}
```

Filter and present results as a table:

```
| Recipient     | Amount   | Status  | Paid At    |
|---------------|----------|---------|------------|
| Flat 401      | ₹2,500   | paid    | 2 Mar 2026 |
| Flat 402      | ₹2,500   | created | —          |
| Flat 403      | ₹2,500   | expired | —          |
```

Summary line: "Collected ₹2,500 of ₹7,500 (33%). 2 pending."

If local tracking file exists (`razorpay_links_{date}.json`), use it to map link IDs to recipients.

## Workflow 5: Manage Customers

When user says "add customer", "save resident details", "create contact".

### Create customer:
```
POST https://api.razorpay.com/v1/customers
```

```json
{
  "name": "Ramesh Kumar",
  "email": "ramesh@example.com",
  "contact": "+919876543210",
  "fail_existing": 0,
  "notes": {
    "flat": "401",
    "block": "A"
  }
}
```

- `fail_existing`: `0` = return existing customer if contact matches. `1` = fail if duplicate.

Response returns `id` (e.g., `cust_abc123`). Use this in payment links, QR codes, and invoices.

### Fetch customer:
```
GET https://api.razorpay.com/v1/customers/{id}
```

### Fetch all customers:
```
GET https://api.razorpay.com/v1/customers
```

## Workflow 6: Refunds

When user says "refund", "return money", "cancel and refund".

```
POST https://api.razorpay.com/v1/payments/{payment_id}/refund
```

```json
{
  "amount": 250000,
  "speed": "normal",
  "notes": {
    "reason": "Duplicate payment"
  }
}
```

- `amount`: Partial refund amount in paise. Omit for full refund.
- `speed`: `normal` (5-7 days) or `optimum` (instant if eligible).

**SAFETY: ALWAYS confirm refund amount and reason with user before executing.**

## Safety Rules

1. **CONFIRM** amounts with the user before creating any payment link, invoice, or QR code.
2. **WARN** if live API keys are detected. Require explicit confirmation for live operations.
3. **NEVER** store API keys in chat logs, notes, or plain text files.
4. **NEVER** auto-execute refunds. Always require explicit user confirmation with amount and reason.
5. **VALIDATE** phone numbers are 10-digit Indian mobile numbers (prefix +91 if missing).
6. **CONVERT** amounts: user speaks in rupees, API expects paise. Always convert correctly.
7. **LOG** all created payment link IDs, invoice IDs, and QR code IDs locally for tracking.

## Error Handling

Razorpay returns errors as:
```json
{
  "error": {
    "code": "BAD_REQUEST_ERROR",
    "description": "Human readable message",
    "field": "amount",
    "source": "business",
    "step": "payment_initiation",
    "reason": "input_validation_failed"
  }
}
```

Common errors:
- `BAD_REQUEST_ERROR` + "Authentication failed": Wrong API keys. Ask user to verify.
- `BAD_REQUEST_ERROR` + "amount less than minimum": Amount must be ≥ ₹1 (100 paise).
- `429` status: Rate limited. Wait and retry with exponential backoff.

## Notes Object

Every Razorpay entity supports a `notes` object — max 15 key-value pairs, 256 chars each. Use it to store:
- Flat/unit number
- Block/wing
- Month/period
- Purpose
- Internal reference IDs

This is your metadata layer. Use it consistently for tracking and filtering.