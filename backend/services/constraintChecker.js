const MAX_ACTIVITIES_PER_DAY = 4;
const MAX_TRAVEL_HOURS_PER_DAY = 8;

function checkBudget(itinerary, budget) {
    const totalCost = itinerary.reduce((sum, day) => {
        return sum + (day.estimated_cost || 0);
    }, 0);

    return totalCost <= budget;
}

function checkDailyActivities(day) {
    return day.activities.length <= MAX_ACTIVITIES_PER_DAY;
}

function checkTravelTime(totalTravelHours, duration_days) {
    const avgPerDay = totalTravelHours / duration_days;
    return avgPerDay <= MAX_TRAVEL_HOURS_PER_DAY;
}

module.exports = {
    checkBudget,
    checkDailyActivities,
    checkTravelTime
};