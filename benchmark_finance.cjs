const performance = require('perf_hooks').performance;

async function main() {
  const numBudgets = 1000;

  const budgets = Array.from({ length: numBudgets }).map((_, i) => ({
    id: i,
    farmId: 1,
    category: `Category ${i % 10}`,
    startDate: new Date('2023-01-01'),
    endDate: new Date('2023-12-31'),
    amount: 1000
  }));

  const transactions = Array.from({ length: 5000 }).map((_, i) => ({
    id: i,
    farmId: 1,
    type: 'EXPENSE',
    category: `Category ${i % 10}`,
    amount: 100,
    date: new Date('2023-06-01')
  }));

  console.log(`Starting real-world latency simulation with ${numBudgets} budgets...`);

  // Real DB N+1 setup (pool limit = 10 connections usually)
  // Instead of Promise.all resolving all 1000 immediately if latency is 10ms,
  // real connection pools queue requests. Let's simulate a basic pool of 10.
  const startNPlus1 = performance.now();
  let completed = 0;
  const poolSize = 10;

  async function queryDb() {
     return new Promise(resolve => setTimeout(resolve, 10)); // 10ms network/DB
  }

  // Promise pool logic
  async function runNPlus1() {
    let index = 0;
    const workers = Array.from({ length: poolSize }).map(async () => {
        while (index < budgets.length) {
           const currentIndex = index++;
           await queryDb();
        }
    });
    await Promise.all(workers);
  }

  await runNPlus1();
  const endNPlus1 = performance.now();
  console.log(`N+1 time (pool size 10, 10ms latency): ${endNPlus1 - startNPlus1}ms`);

  // Optimized in-memory approach
  const startOptimized = performance.now();

  // 1 large query - e.g. 50ms for larger dataset
  await new Promise(resolve => setTimeout(resolve, 50));

  // Pre-process transactions to speed up filtering
  const processedTransactions = transactions.map(t => ({
      ...t,
      time: t.date.getTime(),
      catLower: t.category.toLowerCase()
  }));

  const budgetsWithSpent = budgets.map((budget) => {
    const categoryLower = budget.category.toLowerCase();
    const startTimestamp = budget.startDate.getTime();
    const endTimestamp = budget.endDate.getTime();

    let spentAmount = 0;
    for (let i = 0; i < processedTransactions.length; i++) {
        const t = processedTransactions[i];
        if (
            t.farmId === budget.farmId &&
            t.time >= startTimestamp &&
            t.time <= endTimestamp &&
            t.catLower.includes(categoryLower)
        ) {
            spentAmount += t.amount;
        }
    }
  });

  const endOptimized = performance.now();
  console.log(`Optimized time (1 query 50ms + in-memory mapping): ${endOptimized - startOptimized}ms`);
}

main().catch(console.error);
