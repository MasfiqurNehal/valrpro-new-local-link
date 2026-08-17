import LandingPage from "../pages/LandingPage";
import LoginPage from "../pages/LoginPage";
import DashboardPage from "../pages/DashboardPage";
import SubscriptionModal from "../pages/SubscriptionModal";
import ClaimsPage from "../pages/ClaimsPage";
import PreScreeningFormPage from "../pages/PreScreeningFormPage";
import stripeSelectors from "../pages/StripeCheckoutPage";

Cypress.Commands.add("getAccount", () => {
  const envEmail = Cypress.env("accountEmail") || Cypress.env("valrEmail");
  const envPassword = Cypress.env("accountPassword") || Cypress.env("valrPassword");
  const envId = Cypress.env("accountId") || Cypress.env("valrId");

  return cy.task("accounts:get", envId).then((account) => {
    if (account && account.email && account.password) {
      return account;
    }

    if (envEmail && envPassword) {
      return {
        id: envId || envEmail,
        email: envEmail,
        password: envPassword,
      };
    }

    return cy.fixture("accounts").then((accounts) => accounts[0]);
  });
});

Cypress.Commands.add("login", (email, password) => {
  cy.session(
    email,
    () => {
      LandingPage.visit().goToLogin();

      LoginPage.login(email, password);

      cy.url().should("include", "/dashboard");
    },
    {
      cacheAcrossSpecs: true,
    }
  );

  cy.visit("/dashboard");
});

Cypress.Commands.add("dismissNotificationPopupIfPresent", () => {
  cy.get("body").then(($body) => {
    const laterBtn = [...$body.find('button, a, [role="button"]')].find((el) => {
      const text = (el.textContent || "").trim();
      return /^Later$/i.test(text);
    });
    if (laterBtn) {
      cy.wrap(laterBtn).click({ force: true });
    }
  });
});

Cypress.Commands.add("closeOnboardingModal", () => {
  DashboardPage.dismissDashboardPopupsIfPresent();
  cy.dismissNotificationPopupIfPresent();
});

Cypress.Commands.add("fillStripeCheckout", (card) => {
  cy.intercept("POST", "**/r.stripe.com/**", { statusCode: 200, body: {} });
  cy.intercept("POST", "**/m.stripe.com/**", { statusCode: 200, body: {} });

  cy.origin(
    "https://checkout.stripe.com",
    { args: { card, selectors: stripeSelectors } },
    ({ card, selectors }) => {
      Cypress.on("uncaught:exception", (err) => {
        if (
          err.message.includes("expressCheckout") ||
          err.message.includes("IntegrationError") ||
          /stripe/i.test(err.message)
        ) {
          return false;
        }
      });

      cy.get("body", { timeout: 60000 }).should("be.visible");

      const getField = (selector) => {
        return cy.get("body", { timeout: 60000 }).then(($body) => {
          const directMatch = $body.find(selector);
          if (directMatch.length && directMatch.is(":visible")) {
            return cy.wrap(directMatch.first());
          }
          return cy.get("iframe", { timeout: 60000 }).then(($iframes) => {
            const frame = [...$iframes].find((f) => {
              try {
                const doc = f.contentDocument || (f.contentWindow && f.contentWindow.document);
                return doc && doc.body && doc.body.querySelector(selector);
              } catch (e) {
                return false;
              }
            });
            if (frame) {
              const doc = frame.contentDocument || frame.contentWindow.document;
              return cy.wrap(doc.body, { log: false }).find(selector, { timeout: 30000 }).first();
            }
            return cy.get(selector, { timeout: 30000 }).first();
          });
        });
      };

      getField(selectors.cardNumberInput)
        .should("be.visible")
        .click({ force: true })
        .clear({ force: true })
        .type(card.number, { delay: 10, force: true });

      getField(selectors.expiryInput)
        .should("be.visible")
        .click({ force: true })
        .clear({ force: true })
        .type(card.expiry, { delay: 10, force: true });

      getField(selectors.cvcInput)
        .should("be.visible")
        .click({ force: true })
        .clear({ force: true })
        .type(card.cvc, { delay: 10, force: true });

      getField(selectors.cardholderNameInput).then(($el) => {
        if ($el && $el.length) {
          cy.wrap($el)
            .should("be.visible")
            .click({ force: true })
            .clear({ force: true })
            .type(card.name, { delay: 10, force: true });
        }
      });

      cy.get("body").then(($body) => {
        if ($body.find(selectors.countrySelect).length > 0) {
          cy.get(selectors.countrySelect).select(card.country, { force: true });
        }
      });

      cy.get(selectors.subscribeButton, { timeout: 30000 })
        .should("be.visible")
        .click({ force: true });
    }
  );

  cy.url({
    timeout: 60000,
  }).should("include", "/dashboard");
});

Cypress.Commands.add("subscribeToPlan", (plan = "basic") => {
  DashboardPage.openPlanPicker();

  SubscriptionModal.subscribeTo(plan);

  cy.fixture("testData/card").then((card) => {
    cy.fillStripeCheckout(card);
  });

  DashboardPage.assertSubscriptionActive();
});

Cypress.Commands.add("startNewClaim", () => {
  DashboardPage.clickStartNewClaim();

  ClaimsPage.continueToClaim();

  PreScreeningFormPage.assertLoaded();
});
