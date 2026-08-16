class ConditionSelectionPage {

    // ==========================================
    // PAGE LOAD
    // ==========================================

    assertLoaded() {
        cy.dismissNotificationPopupIfPresent();

        cy.contains("Condition Selection", { timeout: 60000 })
            .should("be.visible");

        return this;
    }


    // ==========================================
    // FILL CONDITION SELECTION
    // ==========================================

    fillConditionSelection(data) {

        cy.dismissNotificationPopupIfPresent();

        // ==========================================
        // SELECT PTSD ONLY
        // ==========================================

        cy.contains(/PTSD/i, { timeout: 30000 })
            .scrollIntoView()
            .should("be.visible");

        cy.get("body").then(($body) => {
            const agentOrangeField = $body.find('[placeholder*="Agent Orange"]');
            if (!agentOrangeField.length || !agentOrangeField.is(":visible")) {
                const ptsdInput = $body.find('input[type="checkbox"]').filter((_, el) => {
                    const text = Cypress.$(el).closest("label, div").text();
                    return /PTSD/i.test(text);
                });

                if (ptsdInput.length) {
                    cy.wrap(ptsdInput.first()).check({ force: true });
                } else {
                    cy.contains("label", /^PTSD$/i).click({ force: true });
                }
            }
        });

        // ==========================================
        // WAIT FOR PTSD SECTION TO APPEAR
        // ==========================================

        cy.dismissNotificationPopupIfPresent();

        cy.get('[placeholder*="Agent Orange"]', { timeout: 30000 })
            .first()
            .scrollIntoView()
            .should("be.visible");

        // ==========================================
        // PTSD INFORMATION
        // ==========================================

        if (data && data.ptsd) {
            // Exposure / Event / Injury
            if (data.ptsd.exposure) {
                cy.get('[placeholder*="Agent Orange"]').first().clear({ force: true });
                cy.get('[placeholder*="Agent Orange"]').first().type(data.ptsd.exposure, { force: true, delay: 0 });
            }

            // Relation to in-service event
            if (data.ptsd.relation) {
                cy.get('[placeholder*="Heavy equipment"]').first().clear({ force: true });
                cy.get('[placeholder*="Heavy equipment"]').first().type(data.ptsd.relation, { force: true, delay: 0 });
            }

            // Year
            if (data.ptsd.year) {
                cy.get('[placeholder*="2009"]').first().clear({ force: true });
                cy.get('[placeholder*="2009"]').first().type(data.ptsd.year, { force: true, delay: 0 });
            }
        }

        // ==========================================
        // TOXIC EXPOSURE → NO
        // ==========================================

        if (data && data.toxicExposure) {
            cy.contains(
                "Are you claiming any conditions related to toxic exposures?",
                { timeout: 15000 }
            )
                .scrollIntoView()
                .should("exist")
                .parent()
                .contains(data.toxicExposure)
                .scrollIntoView()
                .click({ force: true });
        }

        return this;
    }


    // ==========================================
    // SAVE & CONTINUE
    // ==========================================

    saveAndContinue() {

        cy.contains("button", "Save and Continue", {
            timeout: 60000
        })
            .scrollIntoView()
            .should("exist")
            .click({ force: true });

        return this;
    }
}


export default new ConditionSelectionPage();