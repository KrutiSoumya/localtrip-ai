
const {
    buildQuote,
    detectPricingAnomalies,
} = require("./services/quotationService");

// --------------------------------------------------
// TEST ITINERARY
// --------------------------------------------------

const testItinerary = {
    destination: "Kerala",

    duration_days: 3,
    nights: 2,

    // Accommodation pricing
    accommodation_type: "standard",

    // Daily transport pricing
    transport_type: "private_sedan",
    vehicle_count: 1,

    // Airport transfer pricing
    airport_transfer_type: "airport_transfer_sedan",
    airport_transfers: 2,

    days: [
        {
            day: 1,
            title: "Cultural Experience",
            activities: [
                "Kathakali show",
                "Guided spice plantation tour",
            ],
        },
        {
            day: 2,
            title: "Backwater Experience",
            activities: [
                "Houseboat day cruise",
            ],
        },
        {
            day: 3,
            title: "Wellness Experience",
            activities: [
                "Ayurvedic massage",
            ],
        },
    ],
};

// --------------------------------------------------
// TEST CONFIGURATION
// --------------------------------------------------

const GROUP_SIZE = 2;
const MARGIN_PERCENT = 10;

// --------------------------------------------------
// RUN QUOTATION TEST
// --------------------------------------------------

function runQuotationTest() {
    try {
        console.log("\n========================================");
        console.log("       LOCALTRIP AI QUOTATION TEST");
        console.log("========================================\n");

        console.log("TEST CONFIGURATION");
        console.log("----------------------------------------");
        console.log("Destination:", testItinerary.destination);
        console.log("Duration:", testItinerary.duration_days, "days");
        console.log("Nights:", testItinerary.nights);
        console.log("Group Size:", GROUP_SIZE);
        console.log("Margin:", `${MARGIN_PERCENT}%`);
        console.log(
            "Accommodation:",
            testItinerary.accommodation_type
        );
        console.log(
            "Transport:",
            testItinerary.transport_type
        );
        console.log(
            "Airport Transfer:",
            testItinerary.airport_transfer_type
        );

        // --------------------------------------
        // 1. BUILD QUOTATION
        // --------------------------------------

        console.log("\n1. BUILDING QUOTATION");
        console.log("----------------------------------------");

        const quote = buildQuote(
            testItinerary,
            MARGIN_PERCENT,
            GROUP_SIZE
        );

        // --------------------------------------
        // 2. DISPLAY PRICE BREAKDOWN
        // --------------------------------------

        console.log("\n2. PRICE BREAKDOWN");
        console.log("----------------------------------------");

        console.log(
            JSON.stringify(
                quote.breakdown,
                null,
                2
            )
        );

        // --------------------------------------
        // 3. DISPLAY PRICING DETAILS
        // --------------------------------------

        console.log("\n3. PRICING DETAILS");
        console.log("----------------------------------------");

        console.log(
            JSON.stringify(
                quote.pricing_details,
                null,
                2
            )
        );

        // --------------------------------------
        // 4. DISPLAY FINAL TOTALS
        // --------------------------------------

        console.log("\n4. FINAL QUOTATION");
        console.log("----------------------------------------");

        console.log(
            "Per Person:",
            `₹${Number(quote.per_person).toLocaleString("en-IN")}`
        );

        console.log(
            "Group Total:",
            `₹${Number(quote.group_total).toLocaleString("en-IN")}`
        );

        console.log(
            "Margin Applied:",
            `${quote.margin_applied}%`
        );

        // --------------------------------------
        // 5. PRICING ANOMALY CHECK
        // --------------------------------------

        console.log("\n5. PRICING ANOMALY CHECK");
        console.log("----------------------------------------");

        const anomalyCheck = detectPricingAnomalies(
            quote.breakdown,
            testItinerary.destination,
            testItinerary.days.length,
            GROUP_SIZE
        );

        console.log(
            JSON.stringify(
                anomalyCheck,
                null,
                2
            )
        );

        // --------------------------------------
        // 6. TEST RESULT
        // --------------------------------------

        console.log("\n========================================");

        if (
            Number.isFinite(quote.group_total) &&
            quote.group_total > 0
        ) {
            console.log("QUOTATION TEST PASSED");

            console.log(
                "Final Group Price:",
                `₹${Number(quote.group_total).toLocaleString("en-IN")}`
            );
        } else {
            throw new Error(
                "Quotation generated an invalid group total."
            );
        }

        console.log("========================================\n");

    } catch (error) {
        console.error("\n========================================");
        console.error("QUOTATION TEST FAILED");
        console.error("========================================");

        console.error(error.message);

        console.error("\nFull Error:");
        console.error(error);

        process.exitCode = 1;
    }
}

// --------------------------------------------------
// EXECUTE TEST
// --------------------------------------------------

runQuotationTest();
