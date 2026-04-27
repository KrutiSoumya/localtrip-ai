// ==============================
// 🔹 Count days
// ==============================
function getDayCount(itinerary) {
    return (itinerary.match(/Day\s\d+:/g) || []).length;
}


// ==============================
// 🔹 Count activities per day
// ==============================
function getActivitiesPerDay(itinerary) {
    const days = itinerary.split(/Day\s\d+:/).slice(1);

    return days.map(day => {
        return (day.match(/-\s/g) || []).length;
    });
}


// ==============================
// 🔹 Budget check (improved heuristic)
// ==============================
function checkBudget(itinerary, budget) {
    const text = itinerary.toLowerCase();

    const luxuryWords = ["cruise", "resort", "private", "spa", "fine dining"];
    const cheapWords = ["free", "market", "local", "street"];

    const luxuryHits = luxuryWords.filter(w => text.includes(w)).length;
    const cheapHits = cheapWords.filter(w => text.includes(w)).length;

    // 🔹 Low budget → penalize luxury heavily
    if (budget <= 20000) {
        if (luxuryHits > 1) return false;
        return true;
    }

    // 🔹 High budget → must have some premium feel
    if (budget > 20000) {
        return luxuryHits > 0 || cheapHits >= 1;
    }

    return true;
}


// ==============================
// 🔹 Activity limit check
// ==============================
function checkDailyActivities(itinerary) {
    const activities = getActivitiesPerDay(itinerary);

    return activities.every(count => count >= 3 && count <= 4);
}


// ==============================
// 🔹 Travel time check (strict)
// ==============================
function checkTravelTime(itinerary, duration_days) {
    const days = getDayCount(itinerary);

    return days === duration_days;
}


// ==============================
// 🔹 MASTER VALIDATOR
// ==============================
function validateItinerary(itinerary, query) {
    if (!itinerary) return false;

    return (
        checkTravelTime(itinerary, query.duration_days) &&
        checkDailyActivities(itinerary) &&
        checkBudget(itinerary, query.budget_total)
    );
}


module.exports = {
    validateItinerary,
    checkBudget,
    checkDailyActivities,
    checkTravelTime
};