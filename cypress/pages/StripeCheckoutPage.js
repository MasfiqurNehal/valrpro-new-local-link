module.exports = {
  cardNumberInput: 'input[placeholder="1234 1234 1234 1234"], input[name="cardnumber"], input[name="cardNumber"], input[autocomplete="cc-number"], #cardNumber',
  expiryInput: 'input[placeholder="MM / YY"], input[name="exp-date"], input[name="cardExpiry"], input[autocomplete="cc-exp"], #cardExpiry',
  cvcInput: 'input[placeholder="CVC"], input[name="cvc"], input[name="cardCvc"], input[autocomplete="cc-csc"], #cardCvc',
  cardholderNameInput: 'input[placeholder="Full name on card"], input[name="billingName"], input[name="name"], #billingName',
  countrySelect: 'select#billingCountry, select[name="country"], select[name="billingCountry"]',
  subscribeButton: 'button[type="submit"], .SubmitButton',
};
