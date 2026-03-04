#!/usr/bin/env node

/**
 * Mock Razorpay API Server
 * Simulates Razorpay API v1 endpoints for testing the razorpay-collect OpenClaw skill.
 * Run: node mock-server.js
 * Base URL: http://localhost:8080/v1
 *
 * Set RAZORPAY_BASE_URL=http://localhost:8080/v1 in your OpenClaw skill config to use.
 */

const http = require("http");
const crypto = require("crypto");

const PORT = process.env.MOCK_PORT || 8080;

// In-memory stores
const paymentLinks = {};
const qrCodes = {};
const invoices = {};
const customers = {};
const payments = {};
const orders = {};

function generateId(prefix) {
  return `${prefix}_${crypto.randomBytes(7).toString("hex")}`;
}

function now() {
  return Math.floor(Date.now() / 1000);
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

function sendJSON(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data, null, 2));
}

function sendError(res, status, code, description, field) {
  sendJSON(res, status, {
    error: {
      code,
      description,
      field: field || null,
      source: "business",
      step: "payment_initiation",
      reason: "input_validation_failed",
      metadata: {},
    },
  });
}

function checkAuth(req, res) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Basic ")) {
    sendError(res, 401, "BAD_REQUEST_ERROR", "Authentication failed due to incorrect API credentials.");
    return false;
  }
  return true;
}

function listItems(store, query) {
  let items = Object.values(store);
  if (query.from) items = items.filter((i) => i.created_at >= parseInt(query.from));
  if (query.to) items = items.filter((i) => i.created_at <= parseInt(query.to));
  const count = Math.min(parseInt(query.count) || 10, 100);
  const skip = parseInt(query.skip) || 0;
  items = items.slice(skip, skip + count);
  return { entity: "collection", count: items.length, items };
}

function parseQuery(url) {
  const q = {};
  const idx = url.indexOf("?");
  if (idx === -1) return q;
  url
    .slice(idx + 1)
    .split("&")
    .forEach((p) => {
      const [k, v] = p.split("=");
      q[decodeURIComponent(k)] = decodeURIComponent(v || "");
    });
  return q;
}

async function handleRequest(req, res) {
  const urlParts = req.url.split("?");
  const path = urlParts[0].replace(/\/+$/, "");
  const query = parseQuery(req.url);
  const method = req.method.toUpperCase();

  if (!checkAuth(req, res)) return;

  try {
    // ─── Payment Links ───
    if (path === "/v1/payment_links" && method === "POST") {
      const body = await parseBody(req);
      if (!body.amount || body.amount < 100) {
        return sendError(res, 400, "BAD_REQUEST_ERROR", "The amount must be at least 100 (paise).", "amount");
      }
      const id = generateId("plink");
      const link = {
        id,
        entity: "payment_link",
        amount: body.amount,
        currency: body.currency || "INR",
        description: body.description || "",
        customer: body.customer || {},
        notify: body.notify || { sms: false, email: false },
        reminder_enable: body.reminder_enable || false,
        notes: body.notes || {},
        short_url: `https://rzp.io/i/${id.slice(-8)}`,
        status: "created",
        amount_paid: 0,
        reference_id: body.reference_id || null,
        accept_partial: body.accept_partial || false,
        expire_by: body.expire_by || null,
        created_at: now(),
        payments: null,
      };
      paymentLinks[id] = link;
      return sendJSON(res, 200, link);
    }

    if (path === "/v1/payment_links" && method === "GET") {
      return sendJSON(res, 200, listItems(paymentLinks, query));
    }

    const plinkMatch = path.match(/^\/v1\/payment_links\/(plink_[a-f0-9]+)$/);
    if (plinkMatch && method === "GET") {
      const link = paymentLinks[plinkMatch[1]];
      if (!link) return sendError(res, 404, "BAD_REQUEST_ERROR", "Payment link not found.");
      return sendJSON(res, 200, link);
    }

    const plinkCancelMatch = path.match(/^\/v1\/payment_links\/(plink_[a-f0-9]+)\/cancel$/);
    if (plinkCancelMatch && method === "POST") {
      const link = paymentLinks[plinkCancelMatch[1]];
      if (!link) return sendError(res, 404, "BAD_REQUEST_ERROR", "Payment link not found.");
      link.status = "cancelled";
      link.cancelled_at = now();
      return sendJSON(res, 200, link);
    }

    // ─── QR Codes ───
    if (path === "/v1/payments/qr_codes" && method === "POST") {
      const body = await parseBody(req);
      const id = generateId("qr");
      const qr = {
        id,
        entity: "qr_code",
        name: body.name || "",
        usage: body.usage || "multiple_use",
        type: body.type || "upi_qr",
        fixed_amount: body.fixed_amount || false,
        payment_amount: body.payment_amount || null,
        description: body.description || "",
        customer_id: body.customer_id || null,
        notes: body.notes || {},
        image_url: `https://rzp.io/qr/${id.slice(-8)}.png`,
        short_url: `https://rzp.io/q/${id.slice(-8)}`,
        status: "active",
        payments_amount_received: 0,
        payments_count_received: 0,
        close_by: body.close_by || now() + 7200,
        created_at: now(),
      };
      qrCodes[id] = qr;
      return sendJSON(res, 200, qr);
    }

    if (path === "/v1/payments/qr_codes" && method === "GET") {
      return sendJSON(res, 200, listItems(qrCodes, query));
    }

    const qrMatch = path.match(/^\/v1\/payments\/qr_codes\/(qr_[a-f0-9]+)$/);
    if (qrMatch && method === "GET") {
      const qr = qrCodes[qrMatch[1]];
      if (!qr) return sendError(res, 404, "BAD_REQUEST_ERROR", "QR code not found.");
      return sendJSON(res, 200, qr);
    }

    const qrCloseMatch = path.match(/^\/v1\/payments\/qr_codes\/(qr_[a-f0-9]+)\/close$/);
    if (qrCloseMatch && method === "POST") {
      const qr = qrCodes[qrCloseMatch[1]];
      if (!qr) return sendError(res, 404, "BAD_REQUEST_ERROR", "QR code not found.");
      qr.status = "closed";
      qr.closed_at = now();
      return sendJSON(res, 200, qr);
    }

    // ─── Invoices ───
    if (path === "/v1/invoices" && method === "POST") {
      const body = await parseBody(req);
      const id = generateId("inv");
      const totalAmount = (body.line_items || []).reduce(
        (sum, item) => sum + (item.amount || 0) * (item.quantity || 1),
        0
      );
      const inv = {
        id,
        entity: "invoice",
        type: body.type || "invoice",
        description: body.description || "",
        customer: body.customer || {},
        customer_id: body.customer_id || null,
        line_items: body.line_items || [],
        notes: body.notes || {},
        status: "draft",
        short_url: `https://rzp.io/inv/${id.slice(-8)}`,
        amount: totalAmount,
        amount_paid: 0,
        amount_due: totalAmount,
        currency: "INR",
        sms_status: body.sms_notify ? "pending" : null,
        email_status: body.email_notify ? "pending" : null,
        expire_by: body.expire_by || null,
        issued_at: null,
        paid_at: null,
        created_at: now(),
      };
      invoices[id] = inv;
      return sendJSON(res, 200, inv);
    }

    if (path === "/v1/invoices" && method === "GET") {
      return sendJSON(res, 200, listItems(invoices, query));
    }

    const invMatch = path.match(/^\/v1\/invoices\/(inv_[a-f0-9]+)$/);
    if (invMatch && method === "GET") {
      const inv = invoices[invMatch[1]];
      if (!inv) return sendError(res, 404, "BAD_REQUEST_ERROR", "Invoice not found.");
      return sendJSON(res, 200, inv);
    }

    const invIssueMatch = path.match(/^\/v1\/invoices\/(inv_[a-f0-9]+)\/issue$/);
    if (invIssueMatch && method === "POST") {
      const inv = invoices[invIssueMatch[1]];
      if (!inv) return sendError(res, 404, "BAD_REQUEST_ERROR", "Invoice not found.");
      inv.status = "issued";
      inv.issued_at = now();
      inv.sms_status = "sent";
      inv.email_status = "sent";
      return sendJSON(res, 200, inv);
    }

    const invCancelMatch = path.match(/^\/v1\/invoices\/(inv_[a-f0-9]+)\/cancel$/);
    if (invCancelMatch && method === "POST") {
      const inv = invoices[invCancelMatch[1]];
      if (!inv) return sendError(res, 404, "BAD_REQUEST_ERROR", "Invoice not found.");
      inv.status = "cancelled";
      return sendJSON(res, 200, inv);
    }

    // ─── Customers ───
    if (path === "/v1/customers" && method === "POST") {
      const body = await parseBody(req);
      if (!body.name) {
        return sendError(res, 400, "BAD_REQUEST_ERROR", "The name field is required.", "name");
      }
      // Check for existing customer by contact
      if (body.contact && !body.fail_existing) {
        const existing = Object.values(customers).find((c) => c.contact === body.contact);
        if (existing) return sendJSON(res, 200, existing);
      }
      const id = generateId("cust");
      const cust = {
        id,
        entity: "customer",
        name: body.name,
        email: body.email || null,
        contact: body.contact || null,
        gstin: body.gstin || null,
        notes: body.notes || {},
        created_at: now(),
      };
      customers[id] = cust;
      return sendJSON(res, 200, cust);
    }

    if (path === "/v1/customers" && method === "GET") {
      return sendJSON(res, 200, listItems(customers, query));
    }

    const custMatch = path.match(/^\/v1\/customers\/(cust_[a-f0-9]+)$/);
    if (custMatch && method === "GET") {
      const cust = customers[custMatch[1]];
      if (!cust) return sendError(res, 404, "BAD_REQUEST_ERROR", "Customer not found.");
      return sendJSON(res, 200, cust);
    }

    // ─── Orders ───
    if (path === "/v1/orders" && method === "POST") {
      const body = await parseBody(req);
      if (!body.amount || body.amount < 100) {
        return sendError(res, 400, "BAD_REQUEST_ERROR", "The amount must be at least 100 (paise).", "amount");
      }
      const id = generateId("order");
      const order = {
        id,
        entity: "order",
        amount: body.amount,
        amount_paid: 0,
        amount_due: body.amount,
        currency: body.currency || "INR",
        receipt: body.receipt || null,
        status: "created",
        attempts: 0,
        notes: body.notes || {},
        created_at: now(),
      };
      orders[id] = order;
      return sendJSON(res, 200, order);
    }

    if (path === "/v1/orders" && method === "GET") {
      return sendJSON(res, 200, listItems(orders, query));
    }

    const orderMatch = path.match(/^\/v1\/orders\/(order_[a-f0-9]+)$/);
    if (orderMatch && method === "GET") {
      const order = orders[orderMatch[1]];
      if (!order) return sendError(res, 404, "BAD_REQUEST_ERROR", "Order not found.");
      return sendJSON(res, 200, order);
    }

    // ─── Payments (read-only mock) ───
    if (path === "/v1/payments" && method === "GET") {
      return sendJSON(res, 200, listItems(payments, query));
    }

    const payMatch = path.match(/^\/v1\/payments\/(pay_[a-f0-9]+)$/);
    if (payMatch && method === "GET") {
      const pay = payments[payMatch[1]];
      if (!pay) return sendError(res, 404, "BAD_REQUEST_ERROR", "Payment not found.");
      return sendJSON(res, 200, pay);
    }

    // Refund (mock)
    const refundMatch = path.match(/^\/v1\/payments\/(pay_[a-f0-9]+)\/refund$/);
    if (refundMatch && method === "POST") {
      const body = await parseBody(req);
      const refundId = generateId("rfnd");
      const refund = {
        id: refundId,
        entity: "refund",
        payment_id: refundMatch[1],
        amount: body.amount || 0,
        currency: "INR",
        speed_requested: body.speed || "normal",
        status: "processed",
        notes: body.notes || {},
        created_at: now(),
      };
      return sendJSON(res, 200, refund);
    }

    // ─── Simulate Payment (test helper — not a real Razorpay endpoint) ───
    if (path === "/v1/_test/simulate_payment" && method === "POST") {
      const body = await parseBody(req);
      const payId = generateId("pay");
      const payment = {
        id: payId,
        entity: "payment",
        amount: body.amount || 250000,
        currency: "INR",
        status: "captured",
        method: body.method || "upi",
        email: body.email || "test@example.com",
        contact: body.contact || "+919876543210",
        notes: body.notes || {},
        created_at: now(),
      };
      payments[payId] = payment;

      // If linked to a payment_link, update it
      if (body.payment_link_id && paymentLinks[body.payment_link_id]) {
        const link = paymentLinks[body.payment_link_id];
        link.status = "paid";
        link.amount_paid = link.amount;
        link.payments = [{ payment_id: payId }];
      }

      return sendJSON(res, 200, { success: true, payment });
    }

    // ─── Fallback ───
    sendError(res, 404, "BAD_REQUEST_ERROR", `Route not found: ${method} ${path}`);
  } catch (err) {
    sendError(res, 500, "SERVER_ERROR", err.message);
  }
}

const server = http.createServer(handleRequest);

server.listen(PORT, () => {
  console.log(`
🦞 Razorpay Mock API Server running on http://localhost:${PORT}/v1

Endpoints:
  POST   /v1/payment_links          Create payment link
  GET    /v1/payment_links           List payment links
  GET    /v1/payment_links/:id       Fetch payment link
  POST   /v1/payment_links/:id/cancel Cancel payment link

  POST   /v1/payments/qr_codes       Create QR code
  GET    /v1/payments/qr_codes       List QR codes
  GET    /v1/payments/qr_codes/:id   Fetch QR code
  POST   /v1/payments/qr_codes/:id/close Close QR code

  POST   /v1/invoices                Create invoice
  GET    /v1/invoices                List invoices
  GET    /v1/invoices/:id            Fetch invoice
  POST   /v1/invoices/:id/issue      Issue invoice
  POST   /v1/invoices/:id/cancel     Cancel invoice

  POST   /v1/customers               Create customer
  GET    /v1/customers               List customers
  GET    /v1/customers/:id           Fetch customer

  POST   /v1/orders                  Create order
  GET    /v1/orders                  List orders
  GET    /v1/orders/:id              Fetch order

  GET    /v1/payments                List payments
  GET    /v1/payments/:id            Fetch payment
  POST   /v1/payments/:id/refund     Refund payment

  POST   /v1/_test/simulate_payment  Simulate a payment (test helper)

Auth: Any Basic Auth header accepted (use rzp_test_xxx:xxx)
Set RAZORPAY_BASE_URL=http://localhost:${PORT}/v1 to use with the skill.
  `);
});