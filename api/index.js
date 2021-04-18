const {
    getAnnualFreeCashFlow,
    getCachAndCacheEquivalents,
    getTotalDebt,
    getEstimatedGrowth,
    getSharesCount,
    getBeta
} = require('./scrapers')

const DEBUG_MODE = false;

const getCashFlow = (CF0, GrowthRate, DiscountFactor, count) => {
    var result = 0;
    for (var i = 0; i < count; i++) {
        currentCF = CF0 * Math.pow(1 + GrowthRate, i + 1) * Math.pow(DiscountFactor, i + 1);
        result += currentCF;
    }

    return {
        lastCF: currentCF,
        allCF: result
    };
};

const getDiscountFactor = beta => {
    var discountRate;

    if (beta < 0.8) {
        discountRate = 0.05;
    } else if (beta < 0.9) {
        discountRate = 0.055;
    } else if (beta < 1) {
        discountRate = 0.06;
    } else if (beta < 1.1) {
        discountRate = 0.065;
    } else if (beta < 1.2) {
        discountRate = 0.07;
    } else if (beta < 1.3) {
        discountRate = 0.075;
    } else if (beta < 1.5) {
        discountRate = 0.08;
    } else if (beta < 1.6) {
        discountRate = 0.085;
    } else {
        discountRate = 0.09;
    }

    const discountFactor = 1 / (1 + discountRate);

    return discountFactor;
}

const getShareEvaluation = async ticker => {
    const CF0 = await getAnnualFreeCashFlow(ticker);
    const growthRate = await getEstimatedGrowth(ticker);
    const beta = await getBeta(ticker);
    const cash = await getCachAndCacheEquivalents(ticker);
    const debt = await getTotalDebt(ticker);
    const sharesCount = await getSharesCount(ticker);
    if (DEBUG_MODE) {
        console.log('CF0', CF0);
        console.log('growthRate', growthRate);
        console.log('beta', beta);
        console.log('cash', cash);
        console.log('debt', debt);
        console.log('sharesCount', sharesCount);
    }

    const discountFactor = getDiscountFactor(beta);

    const CF5Year = getCashFlow(CF0, growthRate, discountFactor, 5);
    const CF10Year = getCashFlow(CF5Year.lastCF, growthRate / 2, discountFactor, 5);
    const CF20Year = getCashFlow(CF10Year.lastCF, 0.04, discountFactor, 10);
    const discountedCF = CF5Year.allCF + CF10Year.allCF + CF20Year.allCF;

    console.log((cash - debt + discountedCF) / sharesCount);
}

getShareEvaluation('F')