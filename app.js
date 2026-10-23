const $ = (id) => document.getElementById(id);

let farePerPassenger = 7;
let totalSeats = 14;
let totalCollected = 0;
let paidCount = 0;
let selectedBill = 0;
let payingCount = 1;

function formatMoney(value) {
    return Number(value || 0).toLocaleString('ar-EG');
}

function initTheme() {
    const isDark = localStorage.getItem('e7sbly_theme') !== 'light';
    document.documentElement.classList.toggle('dark', isDark);

    const icon = $('themeIcon');
    if (icon) {
        icon.className = isDark
            ? 'fa-solid fa-moon text-amber-400'
            : 'fa-solid fa-sun text-amber-500';
    }
}

function toggleTheme() {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('e7sbly_theme', isDark ? 'dark' : 'light');
    initTheme();
}

function setFare(amount) {
    $('fareInput').value = amount;
    updateTripCalculations();
}

function updateTripCalculations() {
    const inputFare = Number.parseFloat($('fareInput').value);
    farePerPassenger = Number.isFinite(inputFare) ? Math.max(0, inputFare) : 0;

    const requestedSeats = Number.parseInt($('passengersCount').value, 10) || 14;

    if (requestedSeats < paidCount) {
        $('passengersCount').value = String(totalSeats);
    } else {
        totalSeats = requestedSeats;
    }

    const targetTotal = farePerPassenger * totalSeats;
    const remainingPassengers = Math.max(0, totalSeats - paidCount);
    const remainingMoney = Math.max(0, targetTotal - totalCollected);

    $('collectedMoney').textContent = formatMoney(totalCollected);
    $('paidPassengers').textContent = paidCount;
    $('totalPassengersDisplay').textContent = totalSeats;
    $('remainingPassengers').textContent = remainingPassengers;
    $('remainingMoney').textContent = formatMoney(remainingMoney);

    calculateChange();
}

function selectBill(amount) {
    selectedBill = Number(amount) || 0;

    document.querySelectorAll('.bill-button').forEach((button) => {
        const selected = Number(button.dataset.bill) === selectedBill;
        button.className = selected
            ? 'bill-button btn-active rounded-xl border border-amber-400 bg-amber-500 p-2.5 text-lg font-black text-slate-950'
            : 'bill-button btn-active rounded-xl border border-slate-200 bg-slate-100 p-2.5 text-lg font-black dark:border-slate-800 dark:bg-slate-950';
    });

    calculateChange();
}

function adjustPassengerCount(delta) {
    const remainingSeats = Math.max(0, totalSeats - paidCount);
    if (remainingSeats === 0) return;

    payingCount = Math.min(remainingSeats, Math.max(1, payingCount + delta));
    $('payingPassengersCount').textContent = payingCount;
    calculateChange();
}

function calculateChange() {
    const required = farePerPassenger * payingCount;
    $('requiredMoney').textContent = `${formatMoney(required)} ج`;
    $('givenBillDisplay').textContent = `${formatMoney(selectedBill)} ج`;

    const changeDisplay = $('changeAmount');
    const details = $('changeDetails');
    const addButton = $('addPaymentBtn');
    const result = $('resultContainer');
    const remainingSeats = Math.max(0, totalSeats - paidCount);

    if (!selectedBill) {
        changeDisplay.textContent = '0 جنيه';
        changeDisplay.className = 'text-3xl font-black text-slate-400 dark:text-slate-500';
        details.textContent = 'حدد الورقة النقدية لحساب الباقي';
        addButton.disabled = true;
        result.className =
            'space-y-2 rounded-2xl border-2 border-slate-200 bg-slate-50 p-4 text-center dark:border-slate-800 dark:bg-slate-950';
        return;
    }

    if (remainingSeats === 0 || payingCount > remainingSeats) {
        changeDisplay.textContent = 'مكتمل';
        changeDisplay.className = 'text-2xl font-black text-rose-500';
        details.textContent = 'تم جمع كامل أجرة الميكروباص';
        addButton.disabled = true;
        result.className =
            'space-y-2 rounded-2xl border-2 border-rose-500/40 bg-slate-50 p-4 text-center dark:bg-slate-950';
        return;
    }

    const change = selectedBill - required;

    if (change >= 0) {
        changeDisplay.textContent = `${formatMoney(change)} جنيه`;
        changeDisplay.className = 'text-4xl font-black text-emerald-600 dark:text-emerald-400';

        details.innerHTML = change === 0
            ? '<span class="font-bold text-emerald-600 dark:text-emerald-400">خالصة بدون باقي! 👌</span>'
            : `رجّع للراكب <strong class="font-extrabold text-amber-600 dark:text-amber-400">${formatMoney(change)} جنيه</strong>`;

        addButton.disabled = false;
        result.className =
            'space-y-2 rounded-2xl border-2 border-emerald-500/40 bg-slate-50 p-4 text-center dark:bg-slate-950';
    } else {
        const shortfall = Math.abs(change);
        changeDisplay.textContent = `ناقص ${formatMoney(shortfall)} ج`;
        changeDisplay.className = 'text-3xl font-black text-rose-500';
        details.textContent = `المبلغ لا يكفي؛ يتبقى ${formatMoney(shortfall)} جنيه`;
        addButton.disabled = true;
        result.className =
            'space-y-2 rounded-2xl border-2 border-rose-500/40 bg-slate-50 p-4 text-center dark:bg-slate-950';
    }
}

function confirmPayment() {
    const remainingSeats = Math.max(0, totalSeats - paidCount);
    if (remainingSeats === 0 || payingCount > remainingSeats) {
        $('changeAmount').textContent = 'مكتمل';
        $('changeDetails').textContent = 'تم جمع كامل أجرة الميكروباص';
        $('addPaymentBtn').disabled = true;
        alert('تم جمع كامل أجرة الميكروباص');
        return;
    }

    const safeBill = Number(selectedBill) || 0;
    const safePassengers = Number(payingCount) || 0;
    if (!safeBill || safePassengers < 1 || safePassengers > remainingSeats) return;

    const fareTotal = farePerPassenger * safePassengers;
    const change = safeBill - fareTotal;
    if (change < 0) return;

    totalCollected += fareTotal;
    paidCount += safePassengers;
    selectedBill = 0;
    payingCount = 1;
    $('payingPassengersCount').textContent = payingCount;

    document.querySelectorAll('.bill-button').forEach((button) => {
        button.className =
            'bill-button btn-active rounded-xl border border-slate-200 bg-slate-100 p-2.5 text-lg font-black dark:border-slate-800 dark:bg-slate-950';
    });

    updateTripCalculations();
}

function resetTrip() {
    totalCollected = 0;
    paidCount = 0;
    selectedBill = 0;
    payingCount = 1;

    $('payingPassengersCount').textContent = payingCount;

    document.querySelectorAll('.bill-button').forEach((button) => {
        button.className =
            'bill-button btn-active rounded-xl border border-slate-200 bg-slate-100 p-2.5 text-lg font-black dark:border-slate-800 dark:bg-slate-950';
    });

    updateTripCalculations();
}

window.addEventListener('DOMContentLoaded', () => {
    initTheme();
    updateTripCalculations();
});
