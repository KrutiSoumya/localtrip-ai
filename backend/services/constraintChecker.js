
/**
 * Get activities for each day from a structured itinerary.
 */
function getActivitiesPerDay(itinerary) {
    if (
        !itinerary ||
        !Array.isArray(itinerary.days)
    ) {
        return [];
    }

    return itinerary.days.map(day =>
        Array.isArray(day.activities)
            ? day.activities
            : []
    );
}


/**
 * ============================================================
 * BUDGET CHECK
 *
 * estimated_cost already includes:
 * average daily destination cost + activity costs.
 *
 * Therefore, do NOT add activity costs again.
 * ============================================================
 */
function checkBudget(itinerary, budget) {
    if (
        !itinerary ||
        !Array.isArray(itinerary.days) ||
        !Number.isFinite(Number(budget)) ||
        Number(budget) <= 0
    ) {
        return false;
    }

    const totalCost = itinerary.days.reduce(
        (sum, day) => {
            const dailyCost = Number(day.estimated_cost);

            if (
                !Number.isFinite(dailyCost) ||
                dailyCost < 0
            ) {
                return Infinity;
            }

            return sum + dailyCost;
        },
        0
    );

    return totalCost <= Number(budget);
}


/**
 * ============================================================
 * DAILY ACTIVITY CHECK
 * Minimum 1 and maximum 4 activities per day.
 * ============================================================
 */
function checkDailyActivities(itinerary) {
    const days = getActivitiesPerDay(itinerary);

    if (days.length === 0) {
        return false;
    }

    return days.every(
        activities =>
            activities.length >= 1 &&
            activities.length <= 4
    );
}


/**
 * ============================================================
 * TRAVEL TIME CHECK
 * Maximum 8 hours of travel per day.
 * ============================================================
 */
function checkTravelTime(itinerary) {
    if (
        !itinerary ||
        !Array.isArray(itinerary.days)
    ) {
        return false;
    }

    return itinerary.days.every(day => {
        const travelHours =
            Number(day.travel_time_hours);

        return (
            Number.isFinite(travelHours) &&
            travelHours >= 0 &&
            travelHours <= 8
        );
    });
}


/**
 * ============================================================
 * ALL CONSTRAINTS
 * ============================================================
 */
function checkAllConstraints(itinerary, budget) {
    return (
        checkBudget(itinerary, budget) &&
        checkDailyActivities(itinerary) &&
        checkTravelTime(itinerary)
    );
}


module.exports = {
    checkBudget,
    checkDailyActivities,
    checkTravelTime,
    checkAllConstraints
};
