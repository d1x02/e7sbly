const $ = (id) => document.getElementById(id);

let farePerPassenger = 7;
let totalSeats = 14;
let totalCollected = 0;
let paidCount = 0;
let selectedBill = 0;
let payingCount = 1;
let history = [];

function formatMoney(value) {
    return Number(value).toLocaleString('ar-EG');
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
    const progress = targetTotal > 0
        ? Math.min(100, Math.max(0, (totalCollected / targetTotal) * 100))
        : 0;

    $('collectedMoney').textContent = formatMoney(totalCollected);
    $('paidPassengers').textContent = paidCount;
    $('totalPassengersDisplay').textContent = totalSeats;
    $('remainingPassengers').textContent = remainingPassengers;
    $('remainingMoney').textContent = formatMoney(remainingMoney);

    const progressBar = $('progressBar');
    const progressPercent = $('progressPercent');
    const statusBadge = $('statusBadge');
    const normalizedProgress = Number.isFinite(progress) ? Math.min(100, Math.max(0, progress)) : 0;

    progressPercent.textContent = `${Math.round(normalizedProgress)}%`;
    progressBar.style.width = `${normalizedProgress}%`;
    progressBar.style.transform = 'none';

    if (progress >= 100 && targetTotal > 0) {
        progressBar.className = 'h-full rounded-full bg-gradient-to-l from-emerald-400 via-green-500 to-emerald-600';
        progressPercent.className = 'font-black text-emerald-600 dark:text-emerald-400';
        statusBadge.className = 'rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-center text-xs font-bold text-emerald-600 dark:text-emerald-400';
        statusBadge.innerHTML = '<i class="fa-solid fa-circle-check"></i> الله ينور! اكتملت الأجرة بالكامل 🎉';
    } else {
        progressBar.className = 'h-full rounded-full bg-gradient-to-l from-amber-400 via-yellow-400 to-emerald-500';
        progressPercent.className = 'font-black text-slate-600 dark:text-slate-300';
        statusBadge.className = 'rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-center text-xs font-bold dark:border-slate-800 dark:bg-slate-950';
        statusBadge.innerHTML =
            `<i class="fa-solid fa-circle-info text-amber-500"></i> باقي ` +
            `<span class="text-amber-600 dark:text-amber-400">${formatMoney(remainingMoney)}</span> جنيه ` +
            `(أجرة <span class="text-amber-600 dark:text-amber-400">${remainingPassengers}</span> ركاب)`;
    }

    calculateChange();
}

function selectBill(amount) {
    selectedBill = amount;

    document.querySelectorAll('.bill-button').forEach((button) => {
        const selected = Number(button.dataset.bill) === amount;
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
        changeDisplay.textContent = 'اكتمل العدد';
        changeDisplay.className = 'text-2xl font-black text-rose-500';
        details.textContent = 'تم تسجيل أجرة جميع الركاب';
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
    if (!selectedBill || payingCount < 1 || payingCount > remainingSeats) return;

    const fareTotal = farePerPassenger * payingCount;
    const change = selectedBill - fareTotal;
    if (change < 0) return;

    history.unshift({
        id: Date.now(),
        passengers: payingCount,
        bill: selectedBill,
        fareTotal,
        change,
        time: new Date().toLocaleTimeString('ar-EG', {
            hour: '2-digit',
            minute: '2-digit'
        })
    });

    totalCollected += fareTotal;
    paidCount += payingCount;
    selectedBill = 0;
    payingCount = 1;
    $('payingPassengersCount').textContent = payingCount;

    document.querySelectorAll('.bill-button').forEach((button) => {
        button.className =
        'bill-button btn-active rounded-xl border border-slate-200 bg-slate-100 p-2.5 text-lg font-black dark:border-slate-800 dark:bg-slate-950';
    });

    updateTripCalculations();
    renderHistory();
}

function undoPayment(id) {
    const index = history.findIndex((item) => item.id === id);
    if (index === -1) return;

    const [removed] = history.splice(index, 1);
    totalCollected = Math.max(0, totalCollected - removed.fareTotal);
    paidCount = Math.max(0, paidCount - removed.passengers);

    updateTripCalculations();
    renderHistory();
}

function renderHistory() {
    $('historyCount').textContent = `${history.length} عمليات`;

    if (history.length === 0) {
        $('historyList').innerHTML =
        '<div class="py-6 text-center text-xs text-slate-400">لم يتم تسجيل أي دفعات بعد</div>';
        return;
    }

    $('historyList').innerHTML = history.map((item) => `
    <div class="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-800 dark:bg-slate-950">
    <div class="flex items-center gap-3">
    <div class="min-w-10 rounded-lg bg-emerald-500/10 p-2 text-center text-emerald-600 dark:text-emerald-400">
    <span class="block text-sm font-black">${item.passengers}</span>
    <span class="text-[9px]">فرد</span>
    </div>
    <div>
    <div class="font-bold">استلم ${formatMoney(item.bill)} ج | الباقي: ${formatMoney(item.change)} ج</div>
    <div class="mt-1 text-[10px] text-slate-500">صافي الأجرة: ${formatMoney(item.fareTotal)} ج • ${item.time}</div>
    </div>
    </div>
    <button type="button" onclick="undoPayment(${item.id})" aria-label="التراجع عن الدفعة"
    class="rounded-lg p-2 text-slate-400 hover:bg-rose-500/10 hover:text-rose-500">
    <i class="fa-solid fa-trash-can"></i>
    </button>
    </div>
    `).join('');
}

function resetTrip() {
    if (history.length > 0 && !window.confirm('هل تريد بدء رحلة جديدة وتصفير سجل المدفوعات؟')) {
        return;
    }

    totalCollected = 0;
    paidCount = 0;
    selectedBill = 0;
    payingCount = 1;
    history = [];

    $('payingPassengersCount').textContent = payingCount;

    document.querySelectorAll('.bill-button').forEach((button) => {
        button.className =
        'bill-button btn-active rounded-xl border border-slate-200 bg-slate-100 p-2.5 text-lg font-black dark:border-slate-800 dark:bg-slate-950';
    });

    updateTripCalculations();
    renderHistory();
}

window.addEventListener('DOMContentLoaded', () => {
    initTheme();
    updateTripCalculations();
    renderHistory();
});

