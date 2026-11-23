const cron = require("node-cron");
const prisma = require("./db");

const markOverdueInvoices = async () => {
  const now = new Date();
  const due = await prisma.invoice.findMany({ where: { status: "Sent", due_date: { lt: now } }, select: { id: true, bookingId: true } });
  if (!due.length) return 0;
  await prisma.$transaction([
    prisma.invoice.updateMany({ where: { id: { in: due.map(i => i.id) }, status: "Sent" }, data: { status: "Overdue" } }),
    prisma.booking.updateMany({ where: { id: { in: due.map(i => i.bookingId) }, paymentStatus: "Invoice Sent" }, data: { paymentStatus: "Overdue" } }),
  ]);
  return due.length;
};
const startOverdueInvoiceJob = () => {
  cron.schedule("5 0 * * *", () => markOverdueInvoices().catch(error => console.error("Overdue invoice job failed:", error)), { timezone: "Asia/Kolkata" });
};
module.exports = { startOverdueInvoiceJob, markOverdueInvoices };
