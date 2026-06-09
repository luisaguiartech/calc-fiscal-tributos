const IRPF_BRACKETS_2025 = [
    { limit: 2428.80, rate: 0, deduction: 0 },
    { limit: 2826.65, rate: 0.075, deduction: 182.16 },
    { limit: 3751.05, rate: 0.15, deduction: 394.16 },
    { limit: 4664.68, rate: 0.225, deduction: 675.49 },
    { limit: Infinity, rate: 0.275, deduction: 908.73 }
];

const DEPENDENT_DEDUCTION_MONTHLY = 189.59;
const DEPENDENT_DEDUCTION_ANNUAL = DEPENDENT_DEDUCTION_MONTHLY * 12;

function calculateIRPFMonthly(taxableBase) {
    if (taxableBase <= 0) return 0;
    const bracket = IRPF_BRACKETS_2025.find(b => taxableBase <= b.limit)
        || IRPF_BRACKETS_2025[IRPF_BRACKETS_2025.length - 1];
    return Math.max(0, taxableBase * bracket.rate - bracket.deduction);
}

function getBracketInfo(taxableBase) {
    const bracket = IRPF_BRACKETS_2025.find(b => taxableBase <= b.limit)
        || IRPF_BRACKETS_2025[IRPF_BRACKETS_2025.length - 1];
    return {
        range: bracket.limit === Infinity
            ? 'Acima de R$ 4.664,68'
            : `Até R$ ${bracket.limit.toFixed(2)}`,
        rate: bracket.rate,
        deduction: bracket.deduction
    };
}

function calculateIRPFWith2026Rule(monthlyGross, _monthlyTaxableBase, standardTax) {
    if (monthlyGross <= 5000) return 0;
    if (monthlyGross >= 7350) return standardTax;
    const factor = (monthlyGross - 5000) / (7350 - 5000);
    return Math.min(standardTax, standardTax * factor);
}

function safeText(elId, value) {
    const el = document.getElementById(elId);
    if (el) el.textContent = value;
}

function safeValue(elId) {
    const el = document.getElementById(elId);
    return el ? parseFloat(el.value) || 0 : 0;
}

function safeInt(elId) {
    const el = document.getElementById(elId);
    return el ? parseInt(el.value, 10) || 0 : 0;
}

function validateInput(elId) {
    const el = document.getElementById(elId);
    if (!el) return;
    const val = parseFloat(el.value);
    if (val < 0) {
        el.classList.add('error');
    } else {
        el.classList.remove('error');
    }
}

function formatCurrency(value) {
    return `R$ ${value.toFixed(2)}`;
}

function updateGeneralIRPF() {
    const year = document.getElementById('irpfYear').value;
    const calcType = document.getElementById('calcType').value;
    const grossIncome = safeValue('grossIncome');
    const dependents = safeInt('dependents');
    const otherDeductions = safeValue('otherDeductions');
    let months = safeInt('monthsYear');
    months = Math.max(1, Math.min(12, months));

    const monthlyDeductions = (dependents * DEPENDENT_DEDUCTION_MONTHLY) + otherDeductions;
    let monthlyTaxableBase = Math.max(0, grossIncome - monthlyDeductions);
    const standardTax = calculateIRPFMonthly(monthlyTaxableBase);
    let finalMonthlyTax = standardTax;

    if (year === '2026') {
        finalMonthlyTax = calculateIRPFWith2026Rule(grossIncome, monthlyTaxableBase, standardTax);
    }

    let finalAnnualTax;
    let finalMonthlyForDisplay;
    let displayBase;

    if (calcType === 'annual') {
        const annualGross = grossIncome;
        const annualDependentDeduction = dependents * DEPENDENT_DEDUCTION_ANNUAL;
        const annualTaxable = Math.max(0, annualGross - annualDependentDeduction - otherDeductions);

        const monthlyBracketsAnnual = IRPF_BRACKETS_2025.map(b => ({
            limit: b.limit * 12,
            rate: b.rate,
            deduction: b.deduction * 12
        }));

        const bracketAnnual = monthlyBracketsAnnual.find(b => annualTaxable <= b.limit)
            || monthlyBracketsAnnual[monthlyBracketsAnnual.length - 1];
        let annualStandardTax = Math.max(0, annualTaxable * bracketAnnual.rate - bracketAnnual.deduction);

        const monthlyEquivalentGross = annualGross / 12;
        const monthlyStandardEquiv = annualStandardTax / 12;
        let finalMonthlyEquivalent = monthlyStandardEquiv;

        if (year === '2026') {
            finalMonthlyEquivalent = calculateIRPFWith2026Rule(
                monthlyEquivalentGross, annualTaxable / 12, monthlyStandardEquiv
            );
        }
        finalAnnualTax = finalMonthlyEquivalent * 12;
        finalMonthlyForDisplay = finalMonthlyEquivalent;
        displayBase = annualTaxable / 12;
    } else {
        finalAnnualTax = finalMonthlyTax * months;
        finalMonthlyForDisplay = finalMonthlyTax;
        displayBase = monthlyTaxableBase;
    }

    const bracketInfo = getBracketInfo(displayBase);
    const effectiveRate = displayBase > 0 ? (finalMonthlyForDisplay / displayBase) : 0;

    let statusText;
    let statusClass;

    if (finalMonthlyForDisplay <= 0 && displayBase <= 2428.80) {
        statusText = 'Isento (abaixo da faixa de tributação)';
        statusClass = 'status-isento';
    } else if (finalMonthlyForDisplay <= 0 && displayBase > 2428.80 && year === '2026') {
        const grossForCheck = safeValue('grossIncome');
        const divisor = calcType === 'annual' ? 12 : 1;
        if ((grossForCheck / divisor) <= 5000) {
            statusText = 'Isento (Regra 2026 - até R$5.000/mês)';
            statusClass = 'status-isento';
        } else {
            statusText = 'Tributado - imposto devido';
            statusClass = 'status-tributado';
        }
    } else if (finalMonthlyForDisplay > 0 && displayBase > 0) {
        statusText = 'Tributado - imposto devido';
        statusClass = 'status-tributado';
    } else {
        statusText = 'Parcialmente isento / Base zerada';
        statusClass = 'status-parcial';
    }

    if (calcType === 'annual' && finalAnnualTax === 0 && displayBase <= 2428.80) {
        statusText = 'Isento anual (renda tributável média mensal até R$2.428,80)';
    }

    safeText('taxableBase', `${formatCurrency(displayBase)} ${calcType === 'annual' ? '(média mensal)' : '(mensal)'}`);
    safeText('taxBracket', bracketInfo.range);
    safeText('effectiveRate', `${(effectiveRate * 100).toFixed(2)}%`);
    safeText('deductionAmount', formatCurrency(bracketInfo.deduction));
    safeText('monthlyTaxDue', formatCurrency(finalMonthlyForDisplay));
    safeText('annualTaxDue', formatCurrency(finalAnnualTax));

    const statusSpan = document.getElementById('taxStatus');
    if (statusSpan) {
        statusSpan.textContent = statusText;
        statusSpan.className = 'status-badge ' + statusClass;
    }

    const noteExtra = year === '2026'
        ? ' Regra 2026: isenção até R$5.000/mês e alíquota reduzida até R$7.350. Simulação baseada em proposta.'
        : '';
    safeText('calcNote',
        `✔️ Dependentes: R$ ${DEPENDENT_DEDUCTION_MONTHLY.toFixed(2)}/mês cada. Descontos obrigatórios abatem da base.${noteExtra}`
    );
}

function updateLocacao() {
    const annualRent = safeValue('annualRent');
    const numProperties = safeInt('numProperties');
    const monthlyRent = annualRent / 12;
    const monthlyTax = calculateIRPFMonthly(monthlyRent);
    const annualTax = monthlyTax * 12;

    safeText('monthlyIrpfLoc', formatCurrency(monthlyTax));
    safeText('annualIrpfLoc', formatCurrency(annualTax));

    const ibsApplicable = (annualRent > 240000 && numProperties > 3) || (annualRent > 288000);
    const ibsRate = 15.0;
    const ibsAmount = ibsApplicable ? annualRent * (ibsRate / 100) : 0;

    safeText('ibsValueLoc', ibsApplicable
        ? `${formatCurrency(ibsAmount)} (estimado)`
        : 'R$ 0,00'
    );
    safeText('ibsStatusLoc', ibsApplicable
        ? `⚠️ Sujeito IBS/CBS (aprox. ${formatCurrency(ibsAmount)}/ano) - declaração 2026, pagamento 2027.`
        : '❌ Fora da tributação IBS/CBS (não atinge os limites de R$240k c/ 3+ imóveis ou R$288k anuais).'
    );

    updatePenalidades();
}

function updatePenalidades() {
    const landlordOmiss = safeValue('landlordOmission');
    const aggravated = document.getElementById('aggravatedPenalty').checked;
    const landlordFine = landlordOmiss * (aggravated ? 1.5 : 0.75);

    const tenantOmiss = safeValue('tenantOmission');
    const tenantFine = tenantOmiss * 0.20;

    const agencyMis = safeValue('agencyMisdeclared');
    const agencyFine = agencyMis * 0.03;

    safeText('landlordFineDisplay', formatCurrency(landlordFine));
    safeText('tenantFineDisplay', formatCurrency(tenantFine));
    safeText('agencyFineDisplay', formatCurrency(agencyFine));
}

function bindEvents() {
    const generalInputs = ['irpfYear', 'calcType', 'grossIncome', 'dependents', 'otherDeductions', 'monthsYear'];
    generalInputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', () => updateGeneralIRPF());
    });

    const locInputs = ['annualRent', 'numProperties'];
    locInputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', () => updateLocacao());
    });

    const penaltyInputs = ['landlordOmission', 'tenantOmission', 'agencyMisdeclared', 'aggravatedPenalty'];
    penaltyInputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            const eventType = el.type === 'checkbox' ? 'change' : 'input';
            el.addEventListener(eventType, () => updatePenalidades());
        }
    });

    const calcTypeSelect = document.getElementById('calcType');
    const incomeLabel = document.getElementById('incomeLabel');
    if (calcTypeSelect && incomeLabel) {
        calcTypeSelect.addEventListener('change', () => {
            incomeLabel.textContent = calcTypeSelect.value === 'monthly'
                ? 'Renda bruta mensal (R$)'
                : 'Renda bruta anual (R$)';
            updateGeneralIRPF();
        });
    }

    const validateIds = ['grossIncome', 'otherDeductions', 'annualRent', 'landlordOmission', 'tenantOmission', 'agencyMisdeclared'];
    validateIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', () => validateInput(id));
    });
}

document.addEventListener('DOMContentLoaded', () => {
    bindEvents();
    updateGeneralIRPF();
    updateLocacao();
});
