# Razorpay API Reference

Base URL: `https://api.razorpay.com/v1`

Auth: Basic Auth with `RAZORPAY_KEY_ID:RAZORPAY_KEY_SECRET`

All amounts in **paise** (₹1 = 100 paise). Currency always `INR`.

---

## Payment Links

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/v1/payment_links` | POST | Create a payment link |
| `/v1/payment_links` | GET | List all payment links |
| `/v1/payment_links/{id}` | GET | Fetch a specific payment link |
| `/v1/payment_links/{id}` | PATCH | Update a payment link (before payment) |
| `/v1/payment_links/{id}/cancel` | POST | Cancel a payment link |
| `/v1/payment_links/{id}/notify_by/{medium}` | POST | Resend notification (medium: `sms` or `email`) |

### Payment Link Statuses
- `created`: Link created, awaiting payment
- `partially_paid`: Partial payment received (if `accept_partial` is true)
- `paid`: Full payment received
- `expired`: Link expired (past `expire_by`)
- `cancelled`: Manually cancelled

---

## QR Codes

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/v1/payments/qr_codes` | POST | Create a QR code |
| `/v1/payments/qr_codes/{id}` | GET | Fetch a QR code |
| `/v1/payments/qr_codes/{id}/close` | POST | Close a QR code |
| `/v1/payments/qr_codes` | GET | List all QR codes |
| `/v1/payments/qr_codes/{id}/payments` | GET | Fetch payments on a QR code |

### QR Code Types
- `upi_qr`: Accepts only UPI payments (default and most common)

### QR Code Usage
- `single_use`: Closes after one payment
- `multiple_use`: Accepts multiple payments (default)

---

## Invoices

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/v1/invoices` | POST | Create an invoice |
| `/v1/invoices/{id}` | GET | Fetch an invoice |
| `/v1/invoices` | GET | List all invoices |
| `/v1/invoices/{id}` | PATCH | Update an invoice (draft only) |
| `/v1/invoices/{id}/issue` | POST | Issue a draft invoice |
| `/v1/invoices/{id}/cancel` | POST | Cancel an invoice |
| `/v1/invoices/{id}` | DELETE | Delete a draft invoice |
| `/v1/invoices/{id}/notify_by/{medium}` | POST | Resend notification |

### Invoice Statuses
- `draft`: Created but not issued
- `issued`: Sent to customer
- `partially_paid`: Partial payment received
- `paid`: Fully paid
- `expired`: Past expiry date
- `cancelled`: Manually cancelled

---

## Orders

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/v1/orders` | POST | Create an order |
| `/v1/orders/{id}` | GET | Fetch an order |
| `/v1/orders` | GET | List all orders |
| `/v1/orders/{id}/payments` | GET | Fetch payments for an order |

### Order Statuses
- `created`: Order created
- `attempted`: Payment attempted but not completed
- `paid`: Payment completed

---

## Payments

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/v1/payments/{id}` | GET | Fetch a payment |
| `/v1/payments` | GET | List all payments |
| `/v1/payments/{id}/capture` | POST | Capture an authorized payment |
| `/v1/payments/{id}/refund` | POST | Refund a payment (full or partial) |

### Payment Statuses
- `created`: Payment initiated
- `authorized`: Payment authorized (needs capture)
- `captured`: Payment captured (money received)
- `refunded`: Full refund processed
- `failed`: Payment failed

---

## Customers

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/v1/customers` | POST | Create a customer |
| `/v1/customers/{id}` | GET | Fetch a customer |
| `/v1/customers` | GET | List all customers |
| `/v1/customers/{id}` | PUT | Update a customer |

---

## Refunds

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/v1/payments/{payment_id}/refund` | POST | Create a refund |
| `/v1/refunds/{id}` | GET | Fetch a refund |
| `/v1/refunds` | GET | List all refunds |

### Refund Speed
- `normal`: 5-7 business days
- `optimum`: Instant refund if eligible (Razorpay decides)

---

## Settlements

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/v1/settlements` | GET | List all settlements |
| `/v1/settlements/{id}` | GET | Fetch a settlement |

---

## Subscriptions (Future)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/v1/plans` | POST | Create a billing plan |
| `/v1/subscriptions` | POST | Create a subscription |
| `/v1/subscriptions/{id}` | GET | Fetch a subscription |
| `/v1/subscriptions/{id}/cancel` | POST | Cancel a subscription |

---

## Common Query Parameters

Used with GET (list) endpoints:

| Param | Type | Description |
|-------|------|-------------|
| `count` | int | Number of records to fetch (default 10, max 100) |
| `skip` | int | Number of records to skip (for pagination) |
| `from` | int | Unix timestamp — fetch records created after this |
| `to` | int | Unix timestamp — fetch records created before this |

---

## Webhook Events (Reference)

| Event | Description |
|-------|-------------|
| `payment.authorized` | Payment authorized |
| `payment.captured` | Payment captured |
| `payment.failed` | Payment failed |
| `payment_link.paid` | Payment link paid |
| `payment_link.partially_paid` | Partial payment on link |
| `payment_link.expired` | Payment link expired |
| `invoice.paid` | Invoice paid |
| `invoice.partially_paid` | Partial invoice payment |
| `invoice.expired` | Invoice expired |
| `qr_code.closed` | QR code closed |
| `qr_code.credited` | Payment received on QR |
| `refund.processed` | Refund completed |
| `order.paid` | Order fully paid |