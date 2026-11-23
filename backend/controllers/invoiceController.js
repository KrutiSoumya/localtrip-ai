const crypto = require("crypto");
const nodemailer = require("nodemailer");
const QRCode = require("qrcode");
const prisma = require("../services/db");
const { generatePDF } = require("../services/pdfService");
const { decrypt } = require("../utils/encryption");

const dayBoundsIST = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  const key = `${values.year}-${values.month}-${values.day}`;
  const start = new Date(`${key}T00:00:00+05:30`);
  return { key: key.replace(/-/g, ""), start, end: new Date(start.getTime() + 86400000) };
};
const fmtDate = value => value ? new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium" }).format(new Date(value)) : "Not set";
const { getAgentUpiId } = require("../services/agentPaymentConfig");
const getInvoiceNumber = async () => {
  const { key, start, end } = dayBoundsIST();
  const count = await prisma.invoice.count({ where: { createdAt: { gte: start, lt: end } } });
  return `INV-${key}-${String(count + 1).padStart(3, "0")}`;
};
const formatLineItems = items => Array.isArray(items)
  ? items.map(item => ({ description: item.description || item.name || "Trip item", amount: Number(item.amount ?? item.total ?? item.cost ?? 0) }))
  : Object.entries(items || {}).filter(([key, value]) => !["pricing_details", "anomaly_check", "base_total", "final_total"].includes(key) && Number.isFinite(Number(value))).map(([description, amount]) => ({ description: description.replace(/_/g, " "), amount: Number(amount) }));
const getInvoice = async (req, res) => {
  try {
    const bookingId = Number(req.body.booking_id);
    const booking = await prisma.booking.findFirst({ where: { id: bookingId, lead: { userId: req.user.id } }, include: { quotation: true, invoice: true } });
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    if (booking.status === "Cancelled") return res.status(400).json({ message: "Cancelled bookings cannot be invoiced" });
    if (booking.status !== "Confirmed") return res.status(400).json({ message: "Only confirmed bookings can be invoiced" });
    if (booking.invoice) return res.json({ invoice: booking.invoice, existing: true });
    if (!booking.quotation) return res.status(400).json({ message: "A quotation is required before generating an invoice" });
    const amount = Math.round(Number(booking.quotation.total_price));
    let invoice;
    for (let attempt = 0; attempt < 4; attempt += 1) {
      try {
        invoice = await prisma.invoice.create({ data: {
          invoice_number: await getInvoiceNumber(), bookingId: booking.id,
          quotation_amount: amount, line_items: booking.quotation.breakdown || {},
          final_amount: amount, public_token: crypto.randomBytes(32).toString("hex"),
        } });
        break;
      } catch (error) {
        if (error.code !== "P2002") throw error;
        const existing = await prisma.invoice.findUnique({ where: { bookingId: booking.id } });
        if (existing) return res.json({ invoice: existing, existing: true });
      }
    }
    if (!invoice) return res.status(409).json({ message: "Could not allocate a unique invoice number. Please retry." });
    return res.status(201).json({ invoice, existing: false });
  } catch (error) {
    if (error.code === "P2002" && req.body.booking_id) {
      const existing = await prisma.invoice.findUnique({ where: { bookingId: Number(req.body.booking_id) } });
      if (existing) return res.json({ invoice: existing, existing: true });
    }
    console.error("Invoice generation error:", error);
    return res.status(500).json({ message: "Error generating invoice" });
  }
};
const updateAdjustments = async (req, res) => {
  try {
    const invoice = await prisma.invoice.findFirst({ where: { id: Number(req.params.id), booking: { lead: { userId: req.user.id } } } });
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });
    if (invoice.status !== "Draft") return res.status(400).json({ message: "Only draft invoices can be adjusted" });
    const adjustments = req.body.adjustments;
    if (!Array.isArray(adjustments) || adjustments.some(a => !String(a.reason || "").trim())) return res.status(400).json({ message: "Every adjustment requires a reason" });
    const normalized = adjustments.map(a => ({ description: String(a.description).trim(), amount: Math.round(Number(a.amount)), reason: String(a.reason).trim() }));
    if (normalized.some(a => !a.description || !Number.isFinite(a.amount))) return res.status(400).json({ message: "Adjustments need a description and valid amount" });
    const finalAmount = invoice.quotation_amount + normalized.reduce((sum, a) => sum + a.amount, 0);
    if (finalAmount < 0) return res.status(400).json({ message: "Final amount cannot be negative" });
    const updated = await prisma.invoice.update({ where: { id: invoice.id }, data: { adjustments: normalized, final_amount: finalAmount } });
    return res.json({ invoice: updated, warning: finalAmount > invoice.quotation_amount * 1.1 });
  } catch (error) {
    console.error("Invoice adjustment error:", error);
    return res.status(500).json({ message: "Error updating invoice adjustments" });
  }
};
const getMailTransport = () => {
  if (process.env.SMTP_URL) return nodemailer.createTransport(process.env.SMTP_URL);
  if (!process.env.SMTP_HOST) return null;
  return nodemailer.createTransport({ host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT || 587), secure: process.env.SMTP_SECURE === "true", auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined });
};
const sendInvoice = async (req, res) => {
  try {
    const invoice = await prisma.invoice.findFirst({ where: { id: Number(req.params.id), booking: { lead: { userId: req.user.id } } }, include: { booking: { include: { lead: { include: { user: true } }, itinerary: true } } } });
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });
    if (invoice.status !== "Draft") return res.status(400).json({ message: "Only draft invoices can be sent" });
    const email = decrypt(invoice.booking.lead.email);
    if (!email) return res.status(400).json({ message: "The customer does not have an email address" });
    const transport = getMailTransport();
    if (!transport) return res.status(503).json({ message: "SMTP settings must be configured before sending invoices" });
    const agent = invoice.booking.lead.user;
    const upiId = await getAgentUpiId(invoice.booking.lead.userId);
    if (!upiId) return res.status(503).json({ message: "Add a UPI ID to the agent profile or configure UPI_ID" });
    const upiLink = `upi://pay?${new URLSearchParams({ pa: upiId, pn: agent.agency_name || agent.name, am: String(invoice.final_amount), tn: invoice.invoice_number, cu: "INR" })}`;
    const qr = await QRCode.toDataURL(upiLink, { errorCorrectionLevel: "M", margin: 1, width: 240 });
    const now = new Date();
    const dueDate = new Date(now.getTime() + 7 * 86400000);
    const baseUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const publicUrl = `${baseUrl.replace(/\/$/, "")}/invoice/${invoice.public_token}`;
    const pdf = await generatePDF("invoice", {
      agency_name: agent.agency_name || agent.name, agent_name: agent.name, agent_phone: agent.phone || "",
      invoice_number: invoice.invoice_number, customer_name: invoice.booking.lead.customer_name,
      issued_date: fmtDate(now), due_date: fmtDate(dueDate),
      trip_dates: `${fmtDate(invoice.booking.travelDate)} ? ${fmtDate(invoice.booking.returnDate)}`,
      quoted_amount: `INR ${invoice.quotation_amount.toLocaleString("en-IN")}`,
      line_items: formatLineItems(invoice.line_items), adjustments: invoice.adjustments,
      final_amount: `INR ${invoice.final_amount.toLocaleString("en-IN")}`,
      upi_link: upiLink, payment_qr_code: qr, public_url: publicUrl,
    });
    await transport.sendMail({ from: process.env.SMTP_FROM || agent.email, to: email, subject: `Invoice ${invoice.invoice_number} from ${agent.agency_name || agent.name}`, text: `Your invoice is attached. View and pay securely: ${publicUrl}`, attachments: [{ filename: `${invoice.invoice_number}.pdf`, content: pdf, contentType: "application/pdf" }] });
    const [sent] = await prisma.$transaction([
      prisma.invoice.update({ where: { id: invoice.id }, data: { status: "Sent", sent_at: now, due_date: dueDate } }),
      prisma.booking.update({ where: { id: invoice.bookingId }, data: { paymentStatus: "Invoice Sent" } }),
    ]);
    return res.json({ invoice: sent, public_url: publicUrl });
  } catch (error) {
    console.error("Invoice send error:", error);
    return res.status(502).json({ message: `Invoice email failed; no payment status was changed. ${error.message}` });
  }
};
const markInvoicePaid = async (req, res) => {
  try {
    const invoice = await prisma.invoice.findFirst({ where: { id: Number(req.params.id), booking: { lead: { userId: req.user.id } } } });
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });
    if (!["Sent", "Overdue"].includes(invoice.status)) return res.status(400).json({ message: "Only sent or overdue invoices can be marked paid" });
    const paidAt = new Date();
    const [updated] = await prisma.$transaction([
      prisma.invoice.update({ where: { id: invoice.id }, data: { status: "Paid", paid_at: paidAt, payment_method: req.body.method, payment_ref: req.body.reference || null } }),
      prisma.booking.update({ where: { id: invoice.bookingId }, data: { paymentStatus: "Paid", status: "Completed" } }),
    ]);
    return res.json({ invoice: updated });
  } catch (error) {
    console.error("Invoice payment update error:", error);
    return res.status(500).json({ message: "Error marking invoice as paid" });
  }
};
const getDueToday = async (req, res) => {
  try {
    const { start, end } = dayBoundsIST();
    const bookings = await prisma.booking.findMany({ where: { status: "Confirmed", paymentStatus: "Not Due", returnDate: { lt: end }, quotation: { isNot: null }, lead: { userId: req.user.id } }, include: { lead: true, quotation: true, invoice: true }, orderBy: { returnDate: "asc" } });
    return res.json(bookings.filter(b => !b.invoice));
  } catch (error) {
    console.error("Due invoice list error:", error);
    return res.status(500).json({ message: "Error fetching invoices due today" });
  }
};
const getPublicInvoice = async (req, res) => {
  try {
    const invoice = await prisma.invoice.findUnique({ where: { public_token: req.params.token }, include: { booking: { include: { lead: { include: { user: true } } } } } });
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });
    const agent = invoice.booking.lead.user;
    const upiId = await getAgentUpiId(invoice.booking.lead.userId);
    const upiLink = upiId ? `upi://pay?${new URLSearchParams({ pa: upiId, pn: agent.agency_name || agent.name, am: String(invoice.final_amount), tn: invoice.invoice_number, cu: "INR" })}` : null;
    const paymentQr = upiLink ? await QRCode.toDataURL(upiLink) : null;
    return res.json({ invoice: { invoice_number: invoice.invoice_number, customer_name: invoice.booking.lead.customer_name, quotation_amount: invoice.quotation_amount, line_items: formatLineItems(invoice.line_items), adjustments: invoice.adjustments, final_amount: invoice.final_amount, status: invoice.status, sent_at: invoice.sent_at, due_date: invoice.due_date, paid_at: invoice.paid_at, currency: "INR", trip_dates: { start: invoice.booking.travelDate, return: invoice.booking.returnDate } }, agent: { name: agent.name, agency_name: agent.agency_name, phone: decrypt(agent.phone) }, payment: { upi_id: upiId || null, upi_link: upiLink, qr_code: paymentQr } });
  } catch (error) {
    console.error("Public invoice error:", error);
    return res.status(500).json({ message: "Error fetching invoice" });
  }
};
module.exports = { generateInvoice: getInvoice, updateAdjustments, sendInvoice, markInvoicePaid, getDueToday, getPublicInvoice };
