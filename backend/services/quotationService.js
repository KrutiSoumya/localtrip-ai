
const destinations = require("../data/destinations.json");

// ==================================================
// GENERAL HELPERS
// ==================================================

const toNumber = (value, fallback = 0) => {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
};

const roundMoney = (value) =>
    Number(toNumber(value, 0).toFixed(2));

const normalize = (value) =>
    String(value || "")
        .trim()
        .toLowerCase()
        .replace(/[\s_-]+/g, " ")
        .replace(/[^\w\s]/g, "")
        .replace(/\s+/g, " ");

// Handles common destination spelling variations.
const normalizeDestinationName = (value) => {
    const normalized = normalize(value);

    const aliases = {
        kerela: "kerala",
    };

    return aliases[normalized] || normalized;
};

// Supports both:
// "Beach visit — Baga Beach"
// "Beach visit - Baga Beach"
// and a plain "Beach visit".
const extractActivityName = (activity) => {
    const rawName =
        typeof activity === "string"
            ? activity
            : activity?.name;

    if (!rawName || typeof rawName !== "string") {
        return null;
    }

    return rawName
        .split(/\s+[—–-]\s+/)[0]
        .trim();
};

// ==================================================
// DESTINATION LOOKUP
// ==================================================

const getDestinationList = () => {
    if (Array.isArray(destinations)) {
        return destinations;
    }

    if (Array.isArray(destinations.destinations)) {
        return destinations.destinations;
    }

    return [];
};

const findDestination = (destinationName) => {
    if (!destinationName) {
        return null;
    }

    const destinationList = getDestinationList();

    const searchName =
        normalizeDestinationName(destinationName);

    return (
        destinationList.find((destination) =>
            normalizeDestinationName(destination.name) === searchName
        ) || null
    );
};

// ==================================================
// ACTIVITY PRICE LOOKUP
// ==================================================

const getActivityCost = (destination, activityName) => {
    if (!destination || !activityName) {
        return null;
    }

    const cleanedName = extractActivityName(activityName);

    if (!cleanedName) {
        return null;
    }

    const activityList = destination.activities || [];

    const activity = activityList.find((item) => {
        return (
            normalize(item.name) === normalize(cleanedName)
        );
    });

    if (!activity) {
        return null;
    }

    const cost = Number(activity.cost);

    return Number.isFinite(cost) && cost >= 0
        ? cost
        : null;
};

// ==================================================
// ACCOMMODATION PRICE LOOKUP
// ==================================================

const getAccommodationRate = (
    destination,
    accommodationType
) => {
    if (
        !destination?.accommodation ||
        !accommodationType
    ) {
        return null;
    }

    const selected = destination.accommodation.find(
        (item) =>
            normalize(item.type) === normalize(accommodationType)
    );

    if (!selected) {
        return null;
    }

    const rate = Number(
        selected.cost_per_room_per_night
    );

    if (!Number.isFinite(rate) || rate < 0) {
        return null;
    }

    // Read the occupancy basis from the dataset.
    // Example: "2 guests per room" -> 2.
    const occupancyText =
        selected.occupancy_basis || "2 guests per room";

    const occupancyMatch =
        String(occupancyText).match(/\d+/);

    const guestsPerRoom = occupancyMatch
        ? Math.max(1, Number(occupancyMatch[0]))
        : 2;

    return {
        type: selected.type,
        label: selected.label || selected.type,
        rate,
        unit:
            selected.unit ||
            "per_room_per_night",
        occupancy_basis: occupancyText,
        guests_per_room: guestsPerRoom,
    };
};

// ==================================================
// TRANSPORT PRICE LOOKUP
// ==================================================

const getTransportRate = (
    destination,
    transportType
) => {
    if (
        !destination?.transport ||
        !transportType
    ) {
        return null;
    }

    const selected = destination.transport.find(
        (item) =>
            normalize(item.type) === normalize(transportType)
    );

    if (!selected) {
        return null;
    }

    // Per-person daily transport.
    if (
        selected.cost_per_person_per_day !== undefined
    ) {
        const amount = Number(
            selected.cost_per_person_per_day
        );

        if (!Number.isFinite(amount) || amount < 0) {
            return null;
        }

        return {
            type: selected.type,
            label: selected.label || selected.type,
            amount,
            unit: "per_person_per_day",
        };
    }

    // Per-vehicle daily transport.
    if (
        selected.cost_per_vehicle_per_day !== undefined
    ) {
        const amount = Number(
            selected.cost_per_vehicle_per_day
        );

        if (!Number.isFinite(amount) || amount < 0) {
            return null;
        }

        return {
            type: selected.type,
            label: selected.label || selected.type,
            amount,
            unit: "per_vehicle_per_day",
            includedKm: toNumber(
                selected.included_km_per_day,
                0
            ),
            extraKmRate: toNumber(
                selected.extra_km_rate,
                0
            ),
        };
    }

    // Per-vehicle airport transfer.
    if (
        selected.cost_per_vehicle_per_transfer !== undefined
    ) {
        const amount = Number(
            selected.cost_per_vehicle_per_transfer
        );

        if (!Number.isFinite(amount) || amount < 0) {
            return null;
        }

        return {
            type: selected.type,
            label: selected.label || selected.type,
            amount,
            unit: "per_vehicle_per_transfer",
        };
    }

    return null;
};

// ==================================================
// QUOTATION GENERATOR
// ==================================================

const buildQuote = (
    itinerary,
    margin = 0,
    groupSize = 1
) => {
    // ----------------------------------------------
    // 1. VALIDATE ITINERARY
    // ----------------------------------------------

    if (
        !itinerary ||
        !Array.isArray(itinerary.days) ||
        itinerary.days.length === 0
    ) {
        throw new Error(
            "Invalid itinerary format. Expected a non-empty days array."
        );
    }

    // ----------------------------------------------
    // 2. BASIC DETAILS
    // ----------------------------------------------

    const destinationName =
        itinerary.destination ||
        itinerary.destination_name;

    const destination =
        findDestination(destinationName);

    if (!destination) {
        throw new Error(
            `Destination "${destinationName}" was not found in destinations.json.`
        );
    }

    const people = Math.floor(
        toNumber(groupSize, 1)
    );

    if (people < 1) {
        throw new Error(
            "Group size must be at least 1."
        );
    }

    const profitMargin = toNumber(margin, 0);

    if (
        !Number.isFinite(profitMargin) ||
        profitMargin < 0
    ) {
        throw new Error(
            "Margin cannot be negative."
        );
    }

    const durationDays = itinerary.days.length;

    const nights = Math.max(
        0,
        Math.floor(
            toNumber(
                itinerary.nights,
                Math.max(0, durationDays - 1)
            )
        )
    );

    // ----------------------------------------------
    // 3. INITIALISE TOTALS
    // ----------------------------------------------

    let activityTotal = 0;
    let accommodationTotal = 0;
    let transportTotal = 0;
    let airportTransferTotal = 0;

    const activityDetails = [];

    // ==================================================
    // 4. ACTIVITIES
    // ==================================================

    itinerary.days.forEach((day, dayIndex) => {
        if (!Array.isArray(day.activities)) {
            return;
        }

        day.activities.forEach((activity) => {
            const originalActivityName =
                typeof activity === "string"
                    ? activity
                    : activity?.name;

            const activityName =
                extractActivityName(activity);

            if (!activityName) {
                throw new Error(
                    `Activity name missing on Day ${dayIndex + 1}.`
                );
            }

            // Look up the activity using its base name.
            // Location suffixes are not part of the lookup.
            const activityCost = getActivityCost(
                destination,
                activityName
            );

            if (
                activityCost === null ||
                !Number.isFinite(activityCost)
            ) {
                throw new Error(
                    `Price not found for activity "${originalActivityName}" in ${destination.name}. Check the activity name against destinations.json.`
                );
            }

            // Dataset activity prices are treated as
            // per-person prices.
            const quantity = people;

            const totalForActivity =
                activityCost * quantity;

            activityTotal += totalForActivity;

            activityDetails.push({
                day: dayIndex + 1,
                name: activityName,
                display_name: originalActivityName,
                unit_price: activityCost,
                quantity,
                unit: "per_person",
                total: roundMoney(totalForActivity),
            });
        });
    });

    // ==================================================
    // 5. ACCOMMODATION
    // ==================================================

    const accommodationType =
        itinerary.accommodation_type;

    if (!accommodationType) {
        throw new Error(
            "Please select an accommodation type before generating the quotation."
        );
    }

    const accommodation = getAccommodationRate(
        destination,
        accommodationType
    );

    if (!accommodation) {
        throw new Error(
            `Accommodation type "${accommodationType}" was not found for ${destination.name}.`
        );
    }

    const guestsPerRoom =
        accommodation.guests_per_room;

    const roomsRequired = Math.ceil(
        people / guestsPerRoom
    );

    accommodationTotal =
        accommodation.rate *
        roomsRequired *
        nights;

    const accommodationDetails = {
        type: accommodation.type,
        label: accommodation.label,
        unit_price: accommodation.rate,
        rooms: roomsRequired,
        guests_per_room: guestsPerRoom,
        nights,
        unit: "per_room_per_night",
        total: roundMoney(accommodationTotal),
    };

    // ==================================================
    // 6. DAILY TRANSPORT
    // ==================================================

    const transportType =
        itinerary.transport_type;

    if (!transportType) {
        throw new Error(
            "Please select a daily transport type before generating the quotation."
        );
    }

    const transport = getTransportRate(
        destination,
        transportType
    );

    if (!transport) {
        throw new Error(
            `Transport type "${transportType}" was not found for ${destination.name}.`
        );
    }

    const vehicleCount = Math.max(
        1,
        Math.floor(
            toNumber(itinerary.vehicle_count, 1)
        )
    );

    let transportQuantity;

    if (
        transport.unit === "per_person_per_day"
    ) {
        transportQuantity = people;

        transportTotal =
            transport.amount *
            people *
            durationDays;
    } else if (
        transport.unit === "per_vehicle_per_day"
    ) {
        transportQuantity = vehicleCount;

        transportTotal =
            transport.amount *
            vehicleCount *
            durationDays;
    } else {
        throw new Error(
            `Transport type "${transportType}" is not a daily transport option. Select a daily transport option instead.`
        );
    }

    const transportDetails = {
        type: transport.type,
        label: transport.label,
        unit_price: transport.amount,
        quantity: transportQuantity,
        days: durationDays,
        unit: transport.unit,
        total: roundMoney(transportTotal),
        included_km_per_day:
            transport.includedKm || 0,
        extra_km_rate:
            transport.extraKmRate || 0,
    };

    // ==================================================
    // 7. AIRPORT TRANSFERS
    // ==================================================

    const airportTransferType =
        itinerary.airport_transfer_type;

    const transferCount = Math.max(
        0,
        Math.floor(
            toNumber(itinerary.airport_transfers, 0)
        )
    );

    let airportTransferDetails = {
        type: null,
        label: null,
        unit_price: 0,
        quantity: transferCount,
        unit: "per_vehicle_per_transfer",
        total: 0,
    };

    if (
        airportTransferType &&
        transferCount > 0
    ) {
        const airportTransfer = getTransportRate(
            destination,
            airportTransferType
        );

        if (
            !airportTransfer ||
            airportTransfer.unit !==
                "per_vehicle_per_transfer"
        ) {
            throw new Error(
                `Airport transfer type "${airportTransferType}" is invalid for ${destination.name}.`
            );
        }

        airportTransferTotal =
            airportTransfer.amount * transferCount;

        airportTransferDetails = {
            type: airportTransfer.type,
            label: airportTransfer.label,
            unit_price: airportTransfer.amount,
            quantity: transferCount,
            unit: "per_vehicle_per_transfer",
            total: roundMoney(airportTransferTotal),
        };
    } else if (
        transferCount > 0 &&
        !airportTransferType
    ) {
        throw new Error(
            "An airport transfer count was provided, but no airport transfer type was selected."
        );
    }

    // ==================================================
    // 8. FINAL PRICE CALCULATION
    // ==================================================

    const baseTotal =
        activityTotal +
        accommodationTotal +
        transportTotal +
        airportTransferTotal;

    const marginAmount =
        baseTotal * (profitMargin / 100);

    const groupTotal =
        baseTotal + marginAmount;

    const perPerson =
        groupTotal / people;

    // ==================================================
    // 9. PRICE BREAKDOWN
    // ==================================================

    const breakdown = {
        activities: roundMoney(activityTotal),

        accommodation: roundMoney(accommodationTotal),

        transport: roundMoney(transportTotal),

        airport_transfers:
            roundMoney(airportTransferTotal),

        base_total: roundMoney(baseTotal),

        margin_amount: roundMoney(marginAmount),

        final_total: roundMoney(groupTotal),
    };

    // ==================================================
    // 10. ITEMISED PRICING DETAILS
    // ==================================================

    const pricingDetails = {
        destination: destination.name,

        group_size: people,

        duration_days: durationDays,

        accommodation_nights: nights,

        rooms_required: roomsRequired,

        accommodation: accommodationDetails,

        transport: transportDetails,

        airport_transfers: airportTransferDetails,

        activities: activityDetails,

        currency: "INR",

        price_type:
            destination.pricing_metadata?.price_type ||
            "indicative_estimate",

        pricing_note:
            "Prices are indicative dataset estimates and should be verified with suppliers before confirming a booking.",
    };

    // ==================================================
    // 11. RETURN QUOTATION
    // ==================================================

    return {
        per_person: roundMoney(perPerson),

        group_total: roundMoney(groupTotal),

        margin_applied: profitMargin,

        breakdown,

        pricing_details: pricingDetails,

        activity_details: activityDetails,
    };
};

// ==================================================
// DESTINATION AVERAGE COST
// ==================================================

const getDestinationAverage = (destinationName) => {
    const destination =
        findDestination(destinationName);

    if (!destination) {
        return null;
    }

    const average = Number(
        destination.avg_cost_per_day
    );

    return (
        Number.isFinite(average) &&
        average > 0
    )
        ? average
        : null;
};

// ==================================================
// PRICING ANOMALY DETECTION
// ==================================================

const detectPricingAnomalies = (
    breakdown,
    destinationName,
    durationDays = 1,
    groupSize = 1
) => {
    const destination =
        findDestination(destinationName);

    if (!destination) {
        return {
            is_anomaly: false,
            message:
                `No destination data found for ${destinationName}.`,
        };
    }

    const averageCostPerDay =
        getDestinationAverage(destinationName);

    if (!averageCostPerDay) {
        return {
            is_anomaly: false,
            message:
                `No average cost data found for destination: ${destinationName}.`,
        };
    }

    const days = Math.max(
        1,
        toNumber(durationDays, 1)
    );

    const people = Math.max(
        1,
        toNumber(groupSize, 1)
    );

    const baseTotal = toNumber(
        breakdown?.base_total,
        0
    );

    // Compare the quoted per-person daily cost
    // against the destination's average daily cost.
    const costPerPersonPerDay =
        baseTotal / (people * days);

    const threshold =
        averageCostPerDay * 2;

    const isAnomaly =
        costPerPersonPerDay > threshold;

    return {
        is_anomaly: isAnomaly,

        destination_average_per_day:
            averageCostPerDay,

        quoted_cost_per_person_per_day:
            roundMoney(costPerPersonPerDay),

        threshold:
            roundMoney(threshold),

        message: isAnomaly
            ? "The quotation is significantly higher than the destination's average daily cost. Please review the pricing."
            : "The quotation is within the expected destination pricing range.",
    };
};

// ==================================================
// EXPORTS
// ==================================================

module.exports = {
    buildQuote,
    detectPricingAnomalies,
    getDestinationAverage,
    findDestination,
    getActivityCost,
    getAccommodationRate,
    getTransportRate,
    extractActivityName,
};
