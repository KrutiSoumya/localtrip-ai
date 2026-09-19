const destinations = require("../data/destinations.json");

const buildQuote = (itinerary, margin = 0, groupSize = 1) => {
    let activityTotal = 0;
    let transportTotal = 0;
    let accommodationTotal = 0;

    if (!itinerary || !Array.isArray(itinerary.days)) {
        throw new Error("Invalid itinerary format");
    }

    itinerary.days.forEach((day) => {
        // Activity costs
        if (Array.isArray(day.activities)) {
            day.activities.forEach((activity) => {
                activityTotal += Number(activity.cost || 0);
            });
        }

        // Transport cost
        transportTotal += Number(day.transport_cost || 0);

        // Accommodation cost
        accommodationTotal += Number(day.accommodation_cost || 0);
    });

    const baseTotal =
        activityTotal +
        transportTotal +
        accommodationTotal;

    const marginAmount =
        baseTotal * (Number(margin) / 100);

    const groupTotal =
        baseTotal + marginAmount;

    return {
        per_person: groupTotal / Number(groupSize),
        group_total: groupTotal,
        breakdown: {
            activities: activityTotal,
            transport: transportTotal,
            accommodation: accommodationTotal,
            base_total: baseTotal,
            margin_amount: marginAmount,
        },
        margin_applied: Number(margin),
    };
};


/**
 * Find the average daily cost for a destination
 * from destinations.json.
 */
function getDestinationAverage(destinationName) {
    if (!destinationName) {
        return null;
    }

    const destination = destinations.find(
        (destination) =>
            destination.name.toLowerCase() ===
            destinationName.toLowerCase()
    );

    return destination ? Number(destination.avg_cost_per_day) : null;
}


/**
 * Detect pricing anomalies by comparing the
 * computed itinerary cost against the destination
 * average cost from destinations.json.
 *
 * The comparison is performed per day.
 */
const detectPricingAnomalies = (
    breakdown,
    destinationName,
    durationDays = 1
) => {
    if (!breakdown || !destinationName) {
        return {
            anomalies: [],
            detected: false,
            message: "Insufficient data for pricing anomaly detection."
        };
    }

    const avgCostPerDay =
        getDestinationAverage(destinationName);

    if (!avgCostPerDay) {
        return {
            anomalies: [],
            detected: false,
            message: `No average cost data found for destination: ${destinationName}`
        };
    }

    const days = Math.max(Number(durationDays) || 1, 1);

    const computedTotal =
        Number(breakdown.base_total || 0);

    const computedPerDay =
        computedTotal / days;

    const expectedTotal =
        avgCostPerDay * days;

    const anomalies = [];

    // Flag if computed cost is more than
    // twice the expected destination average.
    if (computedPerDay > avgCostPerDay * 2) {
        anomalies.push({
            component: "total",
            expected: expectedTotal,
            computed: computedTotal,
            expected_per_day: avgCostPerDay,
            computed_per_day: computedPerDay,
            threshold: avgCostPerDay * 2
        });
    }

    return {
        anomalies,
        detected: anomalies.length > 0,
        destination: destinationName,
        duration_days: days,
        expected_average_per_day: avgCostPerDay,
        expected_total: expectedTotal,
        computed_total: computedTotal,
        computed_per_day: computedPerDay,
        message:
            anomalies.length > 0
                ? `Computed itinerary cost ₹${computedTotal} is significantly higher than the expected average of ₹${expectedTotal} for ${destinationName}.`
                : `Computed itinerary cost ₹${computedTotal} is within the expected range for ${destinationName}.`
    };
};


module.exports = {
    buildQuote,
    detectPricingAnomalies,
    getDestinationAverage
};

