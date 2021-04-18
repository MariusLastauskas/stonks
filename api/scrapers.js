const { JSDOM } = require("jsdom")
const axios = require('axios')

const getCachFlowUrl = ticker => `https://www.barchart.com/stocks/quotes/${ticker}/cash-flow/annual`;
const getBalanceSheetUrl = ticker => `https://www.barchart.com/stocks/quotes/${ticker}/balance-sheet/quarterly`;
const getFinvizUrl = ticker => `https://finviz.com/quote.ashx?t=${ticker}`;

const readTable = async (url, rowIndex, columnIndex = 1, isFinviz = false) => {
    try {
        const { data } = await axios.get(url);
        const dom = new JSDOM(data);
        const { document } = dom.window;
  
        const table = document.querySelector(isFinviz ? '.snapshot-table2' : 'tbody');
        const allRows = table.querySelectorAll('tr');
        const resultRow = allRows[rowIndex >= 0 ? rowIndex : allRows.length + rowIndex];
        const allCells = resultRow.querySelectorAll('td');
        const result = allCells[columnIndex >= 0 ? columnIndex : allRows.length + columnIndex].textContent;
    
        return result;
    } catch (error) {
        throw error;
    }
}

const normalize = data => {
    return data.split(',').join('').split('$').join('');
}

exports.getAnnualFreeCashFlow = async ticker => {
    const nominal = 1000;
    const TableEntry = await readTable(getCachFlowUrl(ticker), -1);
    const CF = normalize(TableEntry) * nominal;
    return CF;
};

exports.getCachAndCacheEquivalents = async ticker => {
    const nominal = 1000;
    const cashTableEntry = await readTable(getBalanceSheetUrl(ticker), 3);
    const otherTableEntry = await readTable(getBalanceSheetUrl(ticker), 4);
    const cash = normalize(cashTableEntry) * nominal;
    const other = normalize(otherTableEntry) * nominal;

    return cash + other;
};

exports.getTotalDebt = async ticker => {
    const nominal = 1000;
    const shortTermDebtTableEntry = await readTable(getBalanceSheetUrl(ticker), 20);
    const longTermDebtTableEntry = await readTable(getBalanceSheetUrl(ticker), 26);
    const shortTermDebt = normalize(shortTermDebtTableEntry) * nominal;
    const longTermDebt = normalize(longTermDebtTableEntry) * nominal;
    
    return shortTermDebt + longTermDebt
};

exports.getEstimatedGrowth = async ticker => {
    const nominal = 0.01;
    const tableEntry = await readTable(getFinvizUrl(ticker), 5, 5, true);
    
    if (tableEntry === '-') {
        return 0;
    }

    const growthRate = Number.parseFloat(tableEntry) * nominal;

    return growthRate;
}

exports.getSharesCount = async ticker => {
    const sharesTableEntry = await readTable(getFinvizUrl(ticker), 0, 9, true);
    const nominalChar = sharesTableEntry.substring(sharesTableEntry.length - 1);
    let nominal;

    if (nominalChar === 'B') {
        nominal = Math.pow(10, 9);
    } else if (nominalChar === 'M') {
        nominal = Math.pow(10, 6);
    } else {
        throw `Unexpected nominal extension: ${nominalChar}`;
    }

    const sharesCount = Number.parseFloat(sharesTableEntry) * nominal;

    return sharesCount;
}

exports.getBeta = async ticker => {
    const tableEntry = await readTable(getFinvizUrl(ticker), 6, -1, true);
    const beta = Number.parseFloat(tableEntry);

    return beta;
}