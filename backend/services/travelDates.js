const getReturnDate = (travelDate, durationDays) => {
  const days = Number(durationDays);
  const startDate = travelDate ? new Date(travelDate) : null;

  if (
    !startDate ||
    Number.isNaN(startDate.getTime()) ||
    !Number.isInteger(days) ||
    days < 1
  ) {
    return null;
  }

  startDate.setUTCHours(0, 0, 0, 0);
  startDate.setUTCDate(startDate.getUTCDate() + days - 1);
  return startDate;
};

module.exports = { getReturnDate };
