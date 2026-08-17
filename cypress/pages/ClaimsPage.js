class ClaimsPage {
  get vaConnectionModalTitle() {
    return cy.contains("VA Connection & Verification");
  }

  get continueToClaimButton() {
    return cy.contains('button, a, [role="button"]', /Continue to Claim/i);
  }

  continueToClaim() {
    this.vaConnectionModalTitle.should("be.visible");
    this.continueToClaimButton.scrollIntoView().should("be.visible").click();
    this.closeHeadToToeAssessment();
    cy.url({ timeout: 60000 }).should("include", "/form/pre_screening");
    return this;
  }

  dismissNotificationPopupIfPresent(deadline = Date.now() + 6000) {
    return cy.get("body").then(($body) => {
      const laterBtn = [...$body.find('button, a, [role="button"]')].find((el) => {
        const text = (el.textContent || "").trim();
        return /^Later$/i.test(text);
      });
      if (laterBtn) {
        cy.wrap(laterBtn).click({ force: true });
      } else if (Date.now() < deadline) {
        cy.wait(250);
        return this.dismissNotificationPopupIfPresent(deadline);
      }
    });
  }

  closeHeadToToeAssessment() {
    const handleModalsAndProceed = (deadline = Date.now() + 60000) => {
      return cy.get("body").then(($body) => {
        if (window.location.href.includes("/form/pre_screening") || window.location.href.includes("/form/") || $body.text().includes("Pre Screening")) {
          return;
        }

        // 1. Dismiss notification Later button if present
        const laterBtn = [...$body.find('button, a, [role="button"]')].find((el) => /^Later$/i.test((el.textContent || "").trim()));
        if (laterBtn) {
          cy.wrap(laterBtn).click({ force: true });
          cy.wait(300);
        }

        // 2. Click tour/modal action buttons ('Next', 'Finish', 'Close', 'Skip')
        const tourBtn = [...$body.find('button, a, [role="button"]')].find((el) => {
          const text = (el.textContent || "").trim();
          return /^Next$|^Finish$|^Close$|^Skip$/i.test(text);
        });

        if (tourBtn) {
          cy.wrap(tourBtn).click({ force: true });
          cy.wait(400);
        }

        // 3. Click main page action button ("Confirm & Continue to Claims", "Start Pre-Screening", etc.)
        const confirmBtn = [...$body.find('button, a, [role="button"]')].find((el) => {
          const text = (el.textContent || "").trim();
          return /Confirm|Continue|Start|Pre-Screening/i.test(text);
        });

        if (confirmBtn) {
          cy.wrap(confirmBtn).click({ force: true });
          cy.wait(500);
        }

        if (Date.now() < deadline && !window.location.href.includes("/form/pre_screening")) {
          cy.wait(1000);
          return handleModalsAndProceed(deadline);
        }
      });
    };

    handleModalsAndProceed();

    cy.url({ timeout: 60000 }).should("include", "/form/");
    return this;
  }
}

export default new ClaimsPage();
