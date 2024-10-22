const CATEGORIES = {
  KEY_ACCOUNT: 'Key Account',
  PROSPECT: 'Prospect',
  REPEAT_BUYER: 'Repeat Buyer',
  CUSTOMER: 'Customer',
  MICRO_DEALER: 'Micro Dealer'
};

// Function to categorize a customer
function categorizeCustomer(orderCount, totalOrderValue) {
  const ORDER_THRESHOLD = 3;
  const VALUE_THRESHOLD = 100000; // 1 lakh in rupees

  if (orderCount >= ORDER_THRESHOLD && totalOrderValue >= VALUE_THRESHOLD) {
    return CATEGORIES.KEY_ACCOUNT;
  } else if (orderCount < ORDER_THRESHOLD && totalOrderValue > VALUE_THRESHOLD) {
    return CATEGORIES.PROSPECT;
  } else if (orderCount >= ORDER_THRESHOLD && totalOrderValue < VALUE_THRESHOLD) {
    return CATEGORIES.REPEAT_BUYER;
  } else {
    return CATEGORIES.CUSTOMER;
  }
}

// Test function
function testCategorization() {
  const testCases = [
    { orderCount: 3, totalOrderValue: 150000, expected: CATEGORIES.KEY_ACCOUNT },
    { orderCount: 2, totalOrderValue: 120000, expected: CATEGORIES.PROSPECT },
    { orderCount: 3, totalOrderValue: 80000, expected: CATEGORIES.REPEAT_BUYER },
    { orderCount: 2, totalOrderValue: 50000, expected: CATEGORIES.CUSTOMER },
    { orderCount: 1, totalOrderValue: 30000, expected: CATEGORIES.CUSTOMER },
  ];

  testCases.forEach((testCase, index) => {
    const result = categorizeCustomer(testCase.orderCount, testCase.totalOrderValue);
    console.log(`Test case ${index + 1}:`);
    console.log(`  Input: orderCount=${testCase.orderCount}, totalOrderValue=${testCase.totalOrderValue}`);
    console.log(`  Expected: ${testCase.expected}`);
    console.log(`  Result: ${result}`);
    console.log(`  Pass: ${result === testCase.expected ? 'Yes' : 'No'}`);
    console.log('');
  });
}

module.exports = { categorizeCustomer, CATEGORIES, testCategorization };