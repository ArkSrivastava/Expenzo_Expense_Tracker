// Import AI model functions
import { suggestCategory, predictExpenses, generateBudgetRecommendations, identifyAnomalies } from './ai-model.js';

document.addEventListener("DOMContentLoaded", loadData);

const incomeForm = document.getElementById("income-form");
const expenseForm = document.getElementById("expense-form");
const themeToggle = document.getElementById("theme-toggle");
const totalIncomeEl = document.getElementById("total-income");
const totalExpensesEl = document.getElementById("total-expenses");
const expenseList = document.getElementById("expense-list");
const ctx = document.getElementById("expense-chart").getContext("2d");
const aiInsightsEl = document.getElementById("ai-insights");
const predictionEl = document.getElementById("expense-predictions");
const recommendationsEl = document.getElementById("budget-recommendations");

let income = localStorage.getItem("income") ? parseFloat(localStorage.getItem("income")) : 0;
let expenses = JSON.parse(localStorage.getItem("expenses")) || [];
let isDarkMode = localStorage.getItem("darkMode") === "enabled";

if (isDarkMode) {
    document.body.classList.add("dark-mode");
    themeToggle.checked = true;
}

// 🎨 Expense Colors
const expenseColors = [
    "#ff6384", "#36a2eb", "#ffce56", "#8e44ad", "#e74c3c", "#f39c12", "#27ae60", "#d35400"
];

// 🎛 Dark Mode Toggle
themeToggle.addEventListener("change", () => {
    document.body.classList.toggle("dark-mode");
    isDarkMode = !isDarkMode;
    localStorage.setItem("darkMode", isDarkMode ? "enabled" : "disabled");
});

// 💰 Income Form Submission
incomeForm.addEventListener("submit", function(event) {
    event.preventDefault();
    income = parseFloat(document.getElementById("income").value);
    localStorage.setItem("income", income);
    updateUI();
    updateChart();
});

// ➕ Expense Form Submission
expenseForm.addEventListener("submit", function(event) {
    event.preventDefault();
    let amount = parseFloat(document.getElementById("amount").value);
    let category = document.getElementById("category").value;
    let customCategory = document.getElementById("custom-category").value.trim();
    let description = document.getElementById("description").value.trim();

    if (category === "Other" && customCategory !== "") {
        category = customCategory;
    } else if (category === "Auto" && description) {
        // Use AI to suggest category based on description
        const suggestedCategory = suggestCategory(description);
        if (suggestedCategory) {
            category = suggestedCategory;
        }
    }

    let totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    // ❌ Check if expense exceeds income
    if (totalExpenses + amount > income) {
        alert("⚠️ Expense cannot exceed total income!");
        return;
    }

    if (amount > 0) {
        expenses.push({ amount, category, description });
        localStorage.setItem("expenses", JSON.stringify(expenses));
        updateUI();
        updateChart();
        updateAIInsights();
    }
});

// 🔄 UI Update Function
function updateUI() {
    totalIncomeEl.innerText = income;
    let totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    totalExpensesEl.innerText = totalExpenses;

    expenseList.innerHTML = "";
    expenses.forEach((exp, index) => {
        let li = document.createElement("li");
        let descriptionText = exp.description ? `<small>${exp.description}</small>` : "";
        li.innerHTML = `${exp.category}: ₹${exp.amount} ${descriptionText} <button onclick="deleteExpense(${index})">❌</button>`;
        expenseList.appendChild(li);
    });
}

// ❌ Delete Expense Function
function deleteExpense(index) {
    expenses.splice(index, 1);
    localStorage.setItem("expenses", JSON.stringify(expenses));
    updateUI();
    updateChart();
}

// Make deleteExpense function globally accessible
window.deleteExpense = deleteExpense;

// 📊 Expense Chart using Chart.js
let expenseChart = new Chart(ctx, {
    type: "doughnut",
    data: {
        labels: ["Remaining Income", ...expenses.map(exp => exp.category)],
        datasets: [{
            data: [income, ...expenses.map(exp => exp.amount)],
            backgroundColor: ["#28a745", ...expenseColors]
        }]
    },
    options: {
        responsive: true,
        plugins: {
            tooltip: {
                callbacks: {
                    label: function(tooltipItem) {
                        let amount = tooltipItem.raw;
                        let percentage = ((amount / income) * 100).toFixed(2);
                        return `₹${amount} (${percentage}%)`;
                    }
                }
            }
        }
    }
});

// 🔄 Update Chart
function updateChart() {
    let totalExpense = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    expenseChart.data.labels = ["Remaining Income", ...expenses.map(exp => exp.category)];
    expenseChart.data.datasets[0].data = [income - totalExpense, ...expenses.map(exp => exp.amount)];
    expenseChart.update();
}

// 📂 Load Data from Local Storage
function loadData() {
    updateUI();
    updateChart();
    updateAIInsights();
}

// 🧠 Update AI Insights
function updateAIInsights() {
    if (!aiInsightsEl || !predictionEl || !recommendationsEl) return;
    
    // Generate predictions
    const predictions = predictExpenses(expenses);
    predictionEl.innerHTML = "<h3>📊 Expense Predictions</h3>";
    
    if (Object.keys(predictions).length > 0) {
        const predictionList = document.createElement("ul");
        predictionList.className = "prediction-list";
        
        for (const [category, amount] of Object.entries(predictions)) {
            const li = document.createElement("li");
            li.innerHTML = `<strong>${category}:</strong> Expected ₹${amount} next month`;
            predictionList.appendChild(li);
        }
        
        predictionEl.appendChild(predictionList);
    } else {
        predictionEl.innerHTML += "<p>Add more expenses to get predictions.</p>";
    }
    
    // Generate budget recommendations
    const recommendations = generateBudgetRecommendations(income, expenses);
    recommendationsEl.innerHTML = "<h3>💡 Budget Recommendations</h3>";
    
    if (recommendations.message) {
        const messageP = document.createElement("p");
        messageP.innerHTML = `<strong>${recommendations.message}</strong>`;
        recommendationsEl.appendChild(messageP);
        
        if (recommendations.savingsRate !== undefined) {
            const savingsP = document.createElement("p");
            savingsP.innerHTML = `Current savings rate: ${recommendations.savingsRate}% of income`;
            recommendationsEl.appendChild(savingsP);
        }
        
        if (recommendations.categoryTips && Object.keys(recommendations.categoryTips).length > 0) {
            const tipsList = document.createElement("ul");
            tipsList.className = "tips-list";
            
            for (const [category, tip] of Object.entries(recommendations.categoryTips)) {
                const li = document.createElement("li");
                li.textContent = tip;
                tipsList.appendChild(li);
            }
            
            recommendationsEl.appendChild(tipsList);
        }
    }
    
    // Identify anomalies
    const anomalies = identifyAnomalies(expenses);
    if (anomalies.length > 0) {
        const anomalySection = document.createElement("div");
        anomalySection.innerHTML = "<h3>⚠️ Unusual Spending Detected</h3>";
        
        const anomalyList = document.createElement("ul");
        anomalyList.className = "anomaly-list";
        
        anomalies.forEach(anomaly => {
            const li = document.createElement("li");
            li.innerHTML = `${anomaly.message}: ₹${anomaly.amount} (${anomaly.category})`;
            anomalyList.appendChild(li);
        });
        
        anomalySection.appendChild(anomalyList);
        aiInsightsEl.appendChild(anomalySection);
    }
}

// 🎭 Custom Expense Input Toggle
function toggleCustomCategory() {
    let category = document.getElementById("category").value;
    let customInput = document.getElementById("custom-category");
    let descriptionInput = document.getElementById("description");
    
    if (category === "Other") {
        customInput.style.display = "block";
        descriptionInput.placeholder = "Enter expense description";
    } else if (category === "Auto") {
        customInput.style.display = "none";
        descriptionInput.placeholder = "Enter description for AI categorization";
    } else {
        customInput.style.display = "none";
        descriptionInput.placeholder = "Enter expense description (optional)";
    }
}
