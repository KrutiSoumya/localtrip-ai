
const path = require("path");

const { checkAllConstraints } = require("./constraintChecker");
const { generateItinerary } = require("./aiService");
const destinations = require("../data/destinations.json");

// Confirm which file Node.js is loading.
console.log("ITINERARY SERVICE LOADED FROM:", __filename);

// ==============================
// 🔹 VALIDATE ITINERARY STRUCTURE
// ==============================

function isValidItinerary(itinerary, days) {
    if (!itinerary || typeof itinerary !== "object") {
        console.warn("Invalid itinerary: response is not an object.");
        return false;
    }

    if (!Array.isArray(itinerary.days)) {
        console.warn("Invalid itinerary: days is not an array.");
        return false;
    }

    if (itinerary.days.length !== Number(days)) {
        console.warn(
            `Invalid itinerary: expected ${days} days, received ${itinerary.days.length}.`
        );
        return false;
    }

    return itinerary.days.every((day, index) => {

        if (!day || typeof day.day !== "number") {
            console.warn(
                `Invalid day number at day ${index + 1}.`
            );
            return false;
        }

        if (!Array.isArray(day.activities)) {
            console.warn(
                `Activities missing for day ${index + 1}.`
            );
            return false;
        }

        if (
            day.activities.length < 1 ||
            day.activities.length > 4
        ) {
            console.warn(
                `Day ${index + 1} must contain between 1 and 4 activities.`
            );
            return false;
        }

        return day.activities.every((activity, activityIndex) => {

            if (!activity || typeof activity !== "object") {
                console.warn(
                    `Invalid activity at day ${index + 1}, activity ${activityIndex + 1}.`
                );
                return false;
            }

            if (
                typeof activity.name !== "string" ||
                activity.name.trim() === ""
            ) {
                console.warn(
                    `Invalid activity name at day ${index + 1}, activity ${activityIndex + 1}.`
                );
                return false;
            }

            if (
                typeof activity.location !== "string" ||
                activity.location.trim() === ""
            ) {
                console.warn(
                    `Invalid activity location at day ${index + 1}, activity ${activityIndex + 1}.`
                );
                return false;
            }

            if (
                typeof activity.cost !== "number" ||
                !Number.isFinite(activity.cost)
            ) {
                console.warn(
                    `Invalid activity cost at day ${index + 1}, activity ${activityIndex + 1}.`
                );
                return false;
            }

            return true;
        });
    });
}


// ==============================
// 🔹 VALIDATE BUDGET CONSTRAINTS
// ==============================

function validateBudget(itinerary, budget, type) {
    try {
        const valid = checkAllConstraints(itinerary, budget);

        console.log(
            `${type} budget validation result:`,
            valid
        );

        return valid;

    } catch (error) {
        console.error(
            `${type} budget validation threw an error:`,
            error
        );

        return false;
    }
}


// ==============================
// 🔹 GENERATE ITINERARY VARIATIONS
// ==============================

async function generateVariations(query) {

    console.log("\n========================================");
    console.log("ITINERARY GENERATION STARTED");
    console.log("========================================");

    console.log("Service file:", __filename);
    console.log("Destination:", query.destination);
    console.log("Duration:", query.duration_days);
    console.log("Budget:", query.budget_total);
    console.log("Group size:", query.group_size);
    console.log("Interests:", query.interests);

    try {

        // ==============================
        // 1. GENERATE BOTH VARIATIONS
        // ==============================

        console.log("\n[1] Starting AI generation...");

        const results = await Promise.allSettled([

            generateItinerary(
                query,
                "budget",
                destinations
            ),

            generateItinerary(
                query,
                "experience",
                destinations
            )

        ]);

        const [budgetResult, experienceResult] = results;

        // ==============================
        // 2. INSPECT AI RESPONSES
        // ==============================

        console.log("\n[2] AI GENERATION RESULTS");

        let budgetTrip = null;
        let experienceTrip = null;

        if (budgetResult.status === "fulfilled") {

            budgetTrip = budgetResult.value;

            console.log("\nBUDGET ITINERARY:");
            console.dir(budgetTrip, { depth: null });

        } else {

            console.error(
                "BUDGET GENERATION FAILED:",
                budgetResult.reason
            );
        }

        if (experienceResult.status === "fulfilled") {

            experienceTrip = experienceResult.value;

            console.log("\nEXPERIENCE ITINERARY:");
            console.dir(experienceTrip, { depth: null });

        } else {

            console.error(
                "EXPERIENCE GENERATION FAILED:",
                experienceResult.reason
            );
        }

        // ==============================
        // 3. VALIDATE VARIATIONS
        // ==============================

        const variations = [];

        // ----- Budget variation -----

        console.log("\n[3A] Validating budget itinerary...");

        if (isValidItinerary(budgetTrip, query.duration_days)) {

            const budgetValid = validateBudget(
                budgetTrip,
                query.budget_total,
                "Budget"
            );

            if (budgetValid) {

                variations.push({
                    type: "budget",
                    itinerary: budgetTrip
                });

                console.log(
                    "Budget itinerary PASSED validation."
                );

            } else {

                console.warn(
                    "Budget itinerary FAILED budget constraints."
                );
            }

        } else {

            console.warn(
                "Budget itinerary FAILED structural validation."
            );
        }

        // ----- Experience variation -----

        console.log("\n[3B] Validating experience itinerary...");

        if (isValidItinerary(experienceTrip, query.duration_days)) {

            const experienceValid = validateBudget(
                experienceTrip,
                query.budget_total,
                "Experience"
            );

            if (experienceValid) {

                variations.push({
                    type: "experience",
                    itinerary: experienceTrip
                });

                console.log(
                    "Experience itinerary PASSED validation."
                );

            } else {

                console.warn(
                    "Experience itinerary FAILED budget constraints."
                );
            }

        } else {

            console.warn(
                "Experience itinerary FAILED structural validation."
            );
        }

        // ==============================
        // 4. CHECK FINAL RESULTS
        // ==============================

        console.log("\n[4] FINAL VALIDATION RESULTS");

        console.log(
            "Valid variations:",
            variations.length
        );

        if (variations.length === 0) {

            const budgetError =
                budgetResult.status === "rejected"
                    ? budgetResult.reason?.message
                    : "Generated response failed validation";

            const experienceError =
                experienceResult.status === "rejected"
                    ? experienceResult.reason?.message
                    : "Generated response failed validation";

            throw new Error(
                `No valid itineraries. Budget: ${budgetError}. Experience: ${experienceError}.`
            );
        }

        // ==============================
        // 5. RETURN VALID VARIATIONS
        // ==============================

        console.log(
            `\nSuccessfully generated ${variations.length} variation(s).`
        );

        console.log("========================================");
        console.log("ITINERARY GENERATION COMPLETED");
        console.log("========================================\n");

        return {
            variations
        };

    } catch (error) {

        console.error("\n========================================");
        console.error("VARIATION GENERATION FAILED");
        console.error("========================================");

        console.error("Error message:", error.message);
        console.error("Full error:", error);

        console.error("========================================\n");

        throw error;
    }
}


// ==============================
// 🔹 EXPORTS
// ==============================

module.exports = {
    generateVariations,
    isValidItinerary
};
