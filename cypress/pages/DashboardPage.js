class DashboardPage {
  get onboardingModalCloseButton() {
    return cy.get('button[aria-label="Close onboarding"]');
  }

  // The onboarding modal renders asynchronously after the dashboard mounts
  // (the app checks server-side whether the tutorial was already seen), so a
  // single synchronous DOM check races it. Poll for a short window instead.
  closeOnboardingModalIfPresent(deadline = Date.now() + 6000) {
    const closeSelector = 'button[aria-label="Close onboarding"]';
    cy.get("body").then(($body) => {
      if ($body.find(closeSelector).length) {
        cy.get(closeSelector).click();
        cy.get('[role="dialog"]').should("not.exist");
      } else if (Date.now() < deadline) {
        cy.wait(250);
        this.closeOnboardingModalIfPresent(deadline);
      }
    });
    return this;
  }

  closePushNotificationsModalIfPresent(deadline = Date.now() + 6000) {
    const dialogSelector = '[role="dialog"]';
    const rejectButtonSelector = 'button, a, [role="button"]';

    cy.get("body").then(($body) => {
      // Check for any 'Later' button anywhere in body (e.g. Subscribe to our notifications popup)
      const laterBtn = [...$body.find('button, a, [role="button"]')].find((el) => {
        const text = (el.textContent || "").trim();
        return /^Later$/i.test(text);
      });

      if (laterBtn) {
        cy.wrap(laterBtn).click({ force: true });
      } else {
        const pushModal = [...$body.find(dialogSelector)].find((dialog) => {
          const text = dialog.textContent || "";
          return (/Push Notifications/i.test(text) || /Subscribe to our notifications/i.test(text)) && (/Reject/i.test(text) || /Later/i.test(text));
        });

        if (pushModal) {
          cy.wrap(pushModal).within(() => {
            cy.contains(rejectButtonSelector, /^Reject$|^Later$/i, { timeout: 1000 }).click({ force: true });
          });
        } else if (Date.now() < deadline) {
          cy.wait(250);
          this.closePushNotificationsModalIfPresent(deadline);
        }
      }
    });

    return this;
  }

  get secureVeteranPlanButton() {
    return cy.contains("button, a", "Secure Your Veteran Plan");
  }

  openPlanPicker() {
    this.secureVeteranPlanButton.click();
    return this;
  }

  get startNewClaimButton() {
    return cy.contains('button, a, [role="button"]', /START A NEW CLAIM/i);
  }

  clickStartNewClaim() {
    this.startNewClaimButton.scrollIntoView().should("be.visible").click();
    return this;
  }

  get lastPaymentAmount() {
    return cy.contains("LAST PAYMENT").parent().find("h3, h2, div");
  }

  assertSubscriptionActive() {
    cy.url().should("include", "/dashboard");
    cy.contains("Update Plan").should("be.visible");
    return this;
  }

  dismissDashboardPopupsIfPresent() {
    this.closeOnboardingModalIfPresent();
    this.closePushNotificationsModalIfPresent();
    return this;
  }
}

export default new DashboardPage();
