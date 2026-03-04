# Example: Society Maintenance Collection

## Scenario

You're the treasurer of Sunrise Apartments (Block A, 20 flats). Monthly maintenance is ₹2,500 per flat. You want to:

1. Send payment links to all residents
2. Track who's paid after a week
3. Follow up with defaulters

## Step 1: Add Residents as Customers

Tell your OpenClaw agent:

> "Add these residents as Razorpay customers:
> - Ramesh Kumar, Flat 401, 9876543210, ramesh@email.com
> - Priya Sharma, Flat 402, 9876543211, priya@email.com
> - Vikram Singh, Flat 403, 9876543212, vikram@email.com"

The agent creates each customer via `POST /v1/customers` and saves the customer IDs.

## Step 2: Bulk Create Payment Links

> "Send April 2026 maintenance links to all Block A residents — ₹2,500 each. Set expiry to April 15."

The agent:
1. Loops through the resident list
2. Creates a payment link per resident via `POST /v1/payment_links`
3. Each link has:
   - Amount: 250000 paise (₹2,500)
   - Description: "April 2026 Maintenance — Flat {number}"
   - Customer details from saved records
   - Notes: `{"flat": "401", "block": "A", "month": "April 2026"}`
   - Expiry: April 15 Unix timestamp
   - SMS + email notifications enabled
4. Saves all link IDs to a local tracking file
5. Reports:

```
Created 20 payment links for Block A — April 2026:

| Flat | Resident       | Amount  | Link                    | Status  |
|------|----------------|---------|-------------------------|---------|
| 401  | Ramesh Kumar   | ₹2,500  | https://rzp.io/i/abc123 | created |
| 402  | Priya Sharma   | ₹2,500  | https://rzp.io/i/def456 | created |
| 403  | Vikram Singh   | ₹2,500  | https://rzp.io/i/ghi789 | created |
...

Total: ₹50,000 across 20 links. All notifications sent.
```

## Step 3: Check Status After a Week

> "Show me April maintenance status for Block A"

The agent fetches each saved payment link via `GET /v1/payment_links/{id}` and reports:

```
April 2026 Maintenance — Block A Status:

| Flat | Resident       | Amount  | Status  | Paid On     |
|------|----------------|---------|---------|-------------|
| 401  | Ramesh Kumar   | ₹2,500  | paid    | 3 Apr 2026  |
| 402  | Priya Sharma   | ₹2,500  | paid    | 5 Apr 2026  |
| 403  | Vikram Singh   | ₹2,500  | created | —           |
| 404  | Anjali Mehta   | ₹2,500  | expired | —           |
...

Summary: ₹35,000 collected of ₹50,000 (70%). 6 pending.
Defaulters: Flats 403, 404, 408, 412, 415, 419.
```

## Step 4: Follow Up with Defaulters

> "Resend payment links to all unpaid flats with a new expiry of April 25"

The agent:
1. Filters for `status: created` or `status: expired` links
2. Creates new payment links for defaulters (or resends notifications for active ones)
3. Reports the updated links

## Step 5: Monthly Summary

> "Give me a collection summary for April"

```
April 2026 Collection Summary — Block A:

Total expected:    ₹50,000 (20 flats × ₹2,500)
Total collected:   ₹45,000 (18 flats)
Outstanding:       ₹5,000  (2 flats)
Collection rate:   90%

Pending:
- Flat 403 (Vikram Singh) — link resent, expires Apr 25
- Flat 412 (Deepak Rao) — link resent, expires Apr 25
```