const {
    checkAllConstraints
} = require('./constraintChecker');

const {
    generateItinerary
} = require("./aiService");

const destinations =
    require("../data/destinations.json");


/**
 * ============================================================
 * VALIDATE ITINERARY
 * ============================================================
 */
function isValidItinerary(
    itinerary,
    days
) {

    if (
        !itinerary ||
        !Array.isArray(itinerary.days)
    ) {
        return false;
    }

    if (
        itinerary.days.length !==
        Number(days)
    ) {
        return false;
    }

    return itinerary.days.every(
        day => {

            if (
                !day ||
                typeof day.day !== "number"
            ) {
                return false;
            }

            if (
                !Array.isArray(
                    day.activities
                )
            ) {
                return false;
            }

            if (
                day.activities.length < 1 ||
                day.activities.length > 4
            ) {
                return false;
            }

            return day.activities.every(
                activity => {

                    return (
                        activity &&
                        typeof activity.name ===
                            "string" &&
                        typeof activity.location ===
                            "string" &&
                        typeof activity.cost ===
                            "number" &&
                        !Number.isNaN(
                            activity.cost
                        )
                    );
                }
            );
        }
    );
}


/**
 * ============================================================
 * GENERATE TWO VARIATIONS
 * ============================================================
 */
async function generateVariations(
    query
) {

    try {

        const [
            budgetTrip,
            experienceTrip
        ] = await Promise.all([

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


        const variations = [];


if (
    isValidItinerary(
        budgetTrip,
        query.duration_days
    ) &&
    checkAllConstraints(
        budgetTrip,
        query.budget_total
    )
) {

            variations.push({
                type: "budget",
                itinerary: budgetTrip
            });

        } else {

            console.warn(
                "⚠️ Budget itinerary failed validation"
            );
        }


if (
    isValidItinerary(
        experienceTrip,
        query.duration_days
    ) &&
    checkAllConstraints(
        experienceTrip,
        query.budget_total
    )
) {

            variations.push({
                type: "experience",
                itinerary: experienceTrip
            });

        } else {

            console.warn(
                "⚠️ Experience itinerary failed validation"
            );
        }


        if (
            variations.length === 0
        ) {

            throw new Error(
                "No valid itineraries generated"
            );
        }


        console.log(
            `✓ Generated ${variations.length} itinerary variation(s)`
        );


        return {
            variations
        };

    } catch (error) {

        console.error(
            "Variation Error:",
            error.message
        );

        return {
            variations: []
        };
    }
}


module.exports = {
    generateVariations,
    isValidItinerary
};