import LandingPage from "../../pages/LandingPage";
import LoginPage from "../../pages/LoginPage";
import DashboardPage from "../../pages/DashboardPage";

describe("Authentication", () => {
  it("TC-AUTH-001: logs in and lands on the dashboard", () => {

    LandingPage.visit();
    LandingPage.goToLogin();

    cy.getAccount().then((account) => {
      LoginPage.login(account.email, account.password);
    });

    cy.url({ timeout: 60000 }).should("include", "/dashboard");
    cy.contains("Dashboard", { timeout: 60000 }).should("be.visible");
  });
});