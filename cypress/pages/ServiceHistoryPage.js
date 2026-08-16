class ServiceHistoryPage {

    assertLoaded() {
        cy.contains("Service History")
            .should("be.visible");

        return this;
    }

    fillServiceHistory(data) {

        // Did you serve under another name? → No
        cy.contains("Did you serve under another name?")
            .parent()
            .contains("No")
            .click();

        // Branch of Service → Army
        cy.get("select")
            .first()
            .select(data.branchOfService);

        // Component → Active
        cy.contains("Component")
            .parent()
            .contains("Active")
            .click();

        // Entry Date
        cy.get('input[type="date"]')
            .eq(0)
            .type(data.entryDate);

        // Exit Date
        cy.get('input[type="date"]')
            .eq(1)
            .type(data.exitDate);

        // Place of Last / Anticipated Separation
        cy.get(
            'input[placeholder="e.g., Fort Hood, TX or Camp Lejeune, NC"]'
        )
            .clear()
            .type(data.separationPlace);

        // Combat zone → No
        cy.contains("Did you serve in a combat zone since 9-11-2001?")
            .parent()
            .contains("No")
            .click();

        // Additional Period of Service
        // Enlistment Date
        cy.get('input[type="date"]')
            .eq(2)
            .type(data.enlistmentDate);

        // Discharge Date
        cy.get('input[type="date"]')
            .eq(3)
            .type(data.dischargeDate);

        // Currently serving / served in Reserves or National Guard → No
        cy.contains(
            "Are you currently serving or have you ever served in the Reserves or National Guard?"
        )
            .parent()
            .contains("No")
            .click();

        // Currently activated on federal orders → No
        cy.contains(
            "Are you currently activated on federal orders within the National Guard or Reserves?"
        )
            .parent()
            .contains("No")
            .click();

        // Prisoner of War → No
        cy.contains("Have you ever been a Prisoner of War?")
            .parent()
            .contains("No")
            .click();

        // Direct deposit with VA already setup → No
        cy.contains("Is your direct deposit with the VA already set up?")
            .parent()
            .contains("No")
            .click();

        return this;
    }

    saveAndContinue() {
        cy.dismissNotificationPopupIfPresent();
        cy.contains("button", "Save and Continue")
            .scrollIntoView()
            .should("exist")
            .click({ force: true });

        return this;
    }
}

export default new ServiceHistoryPage();