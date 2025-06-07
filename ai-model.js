// AI Model for Expense Tracker

// Common expense keywords for automatic categorization
const categoryKeywords = {
    'Food': ['restaurant', 'cafe', 'grocery', 'food', 'meal', 'lunch', 'dinner', 'breakfast', 'snack', 'pizza', 'burger', 'coffee'],
    'Transport': ['uber', 'lyft', 'taxi', 'bus', 'train', 'metro', 'gas', 'fuel', 'car', 'parking', 'transport', 'travel', 'fare'],
    'Bills': ['electricity', 'water', 'internet', 'phone', 'bill', 'rent', 'insurance', 'utility', 'subscription', 'service'],
    'Entertainment': ['movie', 'theatre', 'concert', 'show', 'game', 'netflix', 'amazon', 'spotify', 'entertainment', 'party', 'event'],
    'Shopping': ['clothes', 'shoes', 'accessory', 'mall', 'store', 'shop', 'purchase', 'buy', 'amazon', 'online'],
    'Health': ['doctor', 'medicine', 'hospital', 'clinic', 'medical', 'health', 'fitness', 'gym', 'pharmacy', 'dental'],
    'Education': ['book', 'course', 'class', 'tuition', 'school', 'college', 'university', 'education', 'learning', 'tutorial']
};

/**
 * Suggests a category based on the expense description using keyword matching
 * @param {string} description - The expense description
 * @returns {string} - The suggested category
 */
function suggestCategory(description) {
    if (!description) return null;
    
    description = description.toLowerCase();
    
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
        for (const keyword of keywords) {
            if (description.includes(keyword.toLowerCase())) {
                return category;
            }
        }
    }
    
    return null; // No match found
}

/**
 * Predicts future expenses based on spending patterns
 * @param {Array} expenses - Array of expense objects
 * @returns {Object} - Predicted expenses by category
 */
function predictExpenses(expenses) {
    if (!expenses || expenses.length === 0) return {};
    
    // Group expenses by category
    const categorizedExpenses = {};
    expenses.forEach(exp => {
        if (!categorizedExpenses[exp.category]) {
            categorizedExpenses[exp.category] = [];
        }
        categorizedExpenses[exp.category].push(exp.amount);
    });
    
    // Calculate average expense for each category
    const predictions = {};
    for (const [category, amounts] of Object.entries(categorizedExpenses)) {
        const total = amounts.reduce((sum, amount) => sum + amount, 0);
        const average = total / amounts.length;
        predictions[category] = Math.round(average * 100) / 100; // Round to 2 decimal places
    }
    
    return predictions;
}

/**
 * Generates budget recommendations based on income and spending patterns
 * @param {number} income - Total income
 * @param {Array} expenses - Array of expense objects
 * @returns {Object} - Budget recommendations
 */
function generateBudgetRecommendations(income, expenses) {
    if (!income || income <= 0 || !expenses || expenses.length === 0) {
        return {
            message: "Add your income and expenses to get personalized recommendations."
        };
    }
    
    // Calculate total expenses
    const totalExpense = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const savingsRate = (income - totalExpense) / income * 100;
    
    // Group expenses by category
    const categorizedExpenses = {};
    expenses.forEach(exp => {
        if (!categorizedExpenses[exp.category]) {
            categorizedExpenses[exp.category] = 0;
        }
        categorizedExpenses[exp.category] += exp.amount;
    });
    
    // Calculate percentage of income for each category
    const categoryPercentages = {};
    for (const [category, amount] of Object.entries(categorizedExpenses)) {
        categoryPercentages[category] = (amount / income) * 100;
    }
    
    // Generate recommendations
    const recommendations = {
        savingsRate: Math.round(savingsRate * 10) / 10, // Round to 1 decimal place
        message: "",
        categoryTips: {}
    };
    
    // Overall recommendation based on savings rate
    if (savingsRate < 0) {
        recommendations.message = "⚠️ You're spending more than your income. Consider reducing expenses.";
    } else if (savingsRate < 10) {
        recommendations.message = "You're saving less than 10% of your income. Try to increase your savings.";
    } else if (savingsRate < 20) {
        recommendations.message = "Good job! You're saving between 10-20% of your income.";
    } else {
        recommendations.message = "Excellent! You're saving more than 20% of your income.";
    }
    
    // Category-specific recommendations
    const idealPercentages = {
        'Food': 15,
        'Transport': 10,
        'Bills': 25,
        'Entertainment': 5,
        'Shopping': 10,
        'Health': 10,
        'Education': 10
    };
    
    for (const [category, percentage] of Object.entries(categoryPercentages)) {
        const idealPercentage = idealPercentages[category] || 10;
        
        if (percentage > idealPercentage * 1.5) {
            recommendations.categoryTips[category] = `Consider reducing ${category} expenses (currently ${Math.round(percentage)}% of income).`;
        }
    }
    
    return recommendations;
}

/**
 * Identifies spending anomalies (unusually high expenses)
 * @param {Array} expenses - Array of expense objects
 * @returns {Array} - Array of anomalies
 */
function identifyAnomalies(expenses) {
    if (!expenses || expenses.length < 5) return []; // Need enough data
    
    // Group expenses by category
    const categorizedExpenses = {};
    expenses.forEach(exp => {
        if (!categorizedExpenses[exp.category]) {
            categorizedExpenses[exp.category] = [];
        }
        categorizedExpenses[exp.category].push(exp.amount);
    });
    
    const anomalies = [];
    
    // Check for anomalies in each category
    for (const [category, amounts] of Object.entries(categorizedExpenses)) {
        if (amounts.length < 3) continue; // Need enough data points
        
        // Calculate mean and standard deviation
        const sum = amounts.reduce((total, amount) => total + amount, 0);
        const mean = sum / amounts.length;
        
        const squaredDiffs = amounts.map(amount => Math.pow(amount - mean, 2));
        const variance = squaredDiffs.reduce((total, diff) => total + diff, 0) / amounts.length;
        const stdDev = Math.sqrt(variance);
        
        // Find anomalies (values more than 2 standard deviations from the mean)
        expenses.forEach((exp, index) => {
            if (exp.category === category && Math.abs(exp.amount - mean) > 2 * stdDev) {
                anomalies.push({
                    index,
                    category,
                    amount: exp.amount,
                    message: `Unusually ${exp.amount > mean ? 'high' : 'low'} ${category} expense`
                });
            }
        });
    }
    
    return anomalies;
}

// Export functions for use in main script
export {
    suggestCategory,
    predictExpenses,
    generateBudgetRecommendations,
    identifyAnomalies
};