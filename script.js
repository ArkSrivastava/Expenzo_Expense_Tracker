document.addEventListener("DOMContentLoaded", loadData);

const incomeForm = document.getElementById("income-form");
const expenseForm = document.getElementById("expense-form");
const themeToggle = document.getElementById("theme-toggle");
const totalIncomeEl = document.getElementById("total-income");
const totalExpensesEl = document.getElementById("total-expenses");
const expenseList = document.getElementById("expense-list");
const ctx = document.getElementById("expense-chart").getContext("2d");

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

    if (category === "Other" && customCategory !== "") {
        category = customCategory;
    }

    let totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    // ❌ Check if expense exceeds income
    if (totalExpenses + amount > income) {
        alert("⚠️ Expense cannot exceed total income!");
        return;
    }

    if (amount > 0) {
        expenses.push({ amount, category });
        localStorage.setItem("expenses", JSON.stringify(expenses));
        updateUI();
        updateChart();
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
        li.innerHTML = `${exp.category}: ₹${exp.amount} <button onclick="deleteExpense(${index})">❌</button>`;
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
}

// 🎭 Custom Expense Input Toggle
function toggleCustomCategory() {
    let category = document.getElementById("category").value;
    let customInput = document.getElementById("custom-category");
    if (category === "Other") {
        customInput.style.display = "block";
    } else {
        customInput.style.display = "none";
    }
}
