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
 * ============================================================
 */
function checkBudget(itinerary, budget) {

    if (
        !itinerary ||
        !Array.isArray(itinerary.days) ||
        !budget ||
        budget <= 0
    ) {
        return false;
    }

    const totalCost = itinerary.days.reduce(
        (sum, day) => {
            const accommodation =
                Number(day.estimated_cost || 0);

            const activities =
                Array.isArray(day.activities)
                    ? day.activities.reduce(
                        (activitySum, activity) =>
                            activitySum +
                            Number(activity.cost || 0),
                        0
                    )
                    : 0;

            return sum + accommodation + activities;
        },
        0
    );

    return totalCost <= budget;
}


/**
 * ============================================================
 * DAILY ACTIVITY CHECK
 * Maximum 4 activities per day.
 * ============================================================
 */
function checkDailyActivities(itinerary) {

    const days =
        getActivitiesPerDay(itinerary);

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
            Number(day.travel_time_hours || 0);

        return travelHours <= 8;
    });
}


/**
 * ============================================================
 * ALL CONSTRAINTS
 * ============================================================
 */
function checkAllConstraints(
    itinerary,
    budget
) {

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