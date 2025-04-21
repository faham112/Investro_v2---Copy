const calculateBtn = document.getElementById('calculateBtn');
const investmentAmount = document.getElementById('investmentAmount');
const planSelect = document.getElementById('planSelect');
const dailyProfit = document.getElementById('dailyProfit');
const weeklyProfit = document.getElementById('weeklyProfit');
const monthlyProfit = document.getElementById('monthlyProfit');
const totalReturn = document.getElementById('totalReturn');

calculateBtn.addEventListener('click', () => {
  const amount = parseFloat(investmentAmount.value);
  const roi = parseFloat(planSelect.value);

  if (isNaN(amount) || amount < 50) {
    alert('Please enter a valid investment amount (minimum ₨50)');
    return;
  }

  const daily = (amount * roi) / 100;
  const weekly = daily * 7;
  const monthly = daily * 30;
  const total = amount + monthly;

  dailyProfit.textContent = `₨${daily.toFixed(2)}`;
  weeklyProfit.textContent = `₨${weekly.toFixed(2)}`;
  monthlyProfit.textContent = `₨${monthly.toFixed(2)}`;
  totalReturn.textContent = `₨${total.toFixed(2)}`;
});