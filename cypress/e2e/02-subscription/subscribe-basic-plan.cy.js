import DashboardPage from "../../pages/DashboardPage";

describe("Subscription", () => {
  beforeEach(() => {
    // Intercept failing Stripe telemetry calls to prevent skeleton UI hangs
    cy.intercept("POST", "**/r.stripe.com/**", { statusCode: 200, body: {} }).as("stripeTelemetry");
    cy.intercept("POST", "**/m.stripe.com/**", { statusCode: 200, body: {} }).as("stripeMetrics");
  });

  it("TC-SUB-001: subscribes to the Basic plan via Stripe test checkout", () => {
    cy.getAccount().then((account) => {
      cy.login(account.email, account.password);
    });

    cy.closeOnboardingModal();

    DashboardPage.openPlanPicker();
    cy.contains("CLAIM YOUR VETERAN PLAN").should("be.visible");
    cy.contains("button", "SUBSCRIBE").click();

    cy.fixture("testData/card").then((card) => {
      cy.fillStripeCheckout(card);
    });

    DashboardPage.assertSubscriptionActive();
    DashboardPage.lastPaymentAmount.should("contain", "69.99");
  });
});
