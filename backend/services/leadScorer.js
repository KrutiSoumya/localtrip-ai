/**
 * ============================================================
 * LEAD SCORER
 * ============================================================
 *
 * Scores leads using:
 * - Budget value
 * - Travel date urgency
 * - Interaction count
 *
 * Total score: 0–100
 *
 * Hot  >= 70
 * Warm 40–69
 * Cold < 40
 */


/**
 * ============================================================
 * BUDGET SCORE
 * ============================================================
 */
function calculateBudgetScore(budget) {

    const value = Number(budget || 0);

    if (value >= 50000) {
        return 30;
    }

    if (value >= 20000) {
        return 20;
    }

    if (value > 0) {
        return 10;
    }

    return 0;
}


/**
 * ============================================================
 * DATE SCORE
 * ============================================================
 */
function calculateDateScore(travelDate) {

    if (!travelDate) {
        return 0;
    }

    const today = new Date();
    const date = new Date(travelDate);

    if (Number.isNaN(date.getTime())) {
        return 0;
    }

    const diffMs = date.getTime() - today.getTime();

    const daysUntilTravel =
        Math.ceil(
            diffMs /
            (1000 * 60 * 60 * 24)
        );

    if (daysUntilTravel < 30) {
        return 40;
    }

    if (daysUntilTravel < 90) {
        return 20;
    }

    return 5;
}


/**
 * ============================================================
 * INTERACTION SCORE
 * ============================================================
 */
function calculateInteractionScore(
    interactionCount
) {

    const count =
        Number(interactionCount || 0);

    return Math.min(
        count * 5,
        30
    );
}


/**
 * ============================================================
 * TOTAL LEAD SCORE
 * ============================================================
 */
function calculateLeadScore(lead) {

const budgetScore =
    calculateBudgetScore(
        lead.budget
    );

    const dateScore =
        calculateDateScore(
            lead.travel_date
        );

    const interactionScore =
        calculateInteractionScore(
            lead.interaction_count
        );

    const total =
        budgetScore +
        dateScore +
        interactionScore;

    let status;

    if (total >= 70) {
        status = "Hot";
    } else if (total >= 40) {
        status = "Warm";
    } else {
        status = "Cold";
    }

    return {
        score: total,
        status,
        components: {
            budget: budgetScore,
            date: dateScore,
            interaction: interactionScore
        }
    };
}

function explainScore(lead) {

    const result = calculateLeadScore(lead);

    return (
        `Lead scored ${result.score}/100 ` +
        `(${result.status}) because of ` +
        `budget score ${result.components.budget}, ` +
        `date urgency score ${result.components.date}, ` +
        `and interaction score ${result.components.interaction}.`
    );
}

function prioritiseFollowUps(leads) {

    if (!Array.isArray(leads)) {
        return [];
    }

    const now = new Date();

    return leads
        .map(lead => {

            const leadResult =
                calculateLeadScore(lead);

            const lastContact =
                lead.last_contact
                    ? new Date(lead.last_contact)
                    : null;

            const daysSinceLastContact =
                lastContact &&
                !Number.isNaN(lastContact.getTime())
                    ? Math.max(
                        0,
                        Math.floor(
                            (now - lastContact) /
                            (1000 * 60 * 60 * 24)
                        )
                    )
                    : 0;

            const priorityScore =
                leadResult.score * 0.6 +
                daysSinceLastContact * 0.4;

            return {
                ...lead,
                score: leadResult.score,
                status: leadResult.status,
                priority_score:
                    Number(
                        priorityScore.toFixed(2)
                    ),
                days_since_last_contact:
                    daysSinceLastContact
            };
        })
        .sort(
            (a, b) =>
                b.priority_score -
                a.priority_score
        )
        .slice(0, 5);
}

module.exports = {
    calculateBudgetScore,
    calculateDateScore,
    calculateInteractionScore,
    calculateLeadScore,
    explainScore,
    prioritiseFollowUps
};
