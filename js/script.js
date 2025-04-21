const toggle = document.querySelector('.menu-toggle');
const menu = document.querySelector('.mobile-menu');
const overlay = document.querySelector('.overlay');

toggle.addEventListener('click', () => {
    toggle.classList.toggle('open');
    menu.classList.toggle('show');
    overlay.style.display = menu.classList.contains('show') ? 'block' : 'none';
});

overlay.addEventListener('click', () => {
    toggle.classList.remove('open');
    menu.classList.remove('show');
    overlay.style.display = 'none';
});


const newsletterForm = document.querySelector('.newsletter-form');

newsletterForm.addEventListener('submit', (e) => {
    e.preventDefault();
    alert('Thank you for subscribing!');
    newsletterForm.reset();
});


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
