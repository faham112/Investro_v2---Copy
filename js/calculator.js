function calculateInvestment(event) {
    event.preventDefault();

    // Get input values
    const initialAmount = parseFloat(document.getElementById('initialAmount').value);
    const investmentPlan = document.getElementById('investmentPlan').value;

    // Validate input
    if (isNaN(initialAmount) || initialAmount <= 0) {
        alert('Please enter a valid investment amount.');
        return;
    }

    // Determine ROI based on investment plan
    let dailyROI;
    switch (investmentPlan) {
        case 'starter':
            dailyROI = 0.015; // 1.5%
            break;
        case 'silver':
            dailyROI = 0.02; // 2%
            break;
        case 'gold':
            dailyROI = 0.025; // 2.5%
            break;
        case 'platinum':
            dailyROI = 0.03; // 3%
            break;
        case 'diamond':
            dailyROI = 0.035; // 3.5%
            break;
        case 'vip':
            dailyROI = 0.04; // 4%
            break;
        default:
            alert('Invalid investment plan selected.');
            return;
    }

    // Calculate earnings
    const dailyProfit = initialAmount * dailyROI;
    const weeklyProfit = dailyProfit * 7;
    const monthlyProfit = dailyProfit * 30;
    const totalReturn = initialAmount + monthlyProfit;

    // Display results
    document.getElementById('dailyProfit').textContent = 'Rs' + dailyProfit.toFixed(2);
    document.getElementById('weeklyProfit').textContent = 'Rs' + weeklyProfit.toFixed(2);
    document.getElementById('monthlyProfit').textContent = 'Rs' + monthlyProfit.toFixed(2);
    document.getElementById('totalReturn').textContent = 'Rs' + totalReturn.toFixed(2);
}
