class ServicePayDirectDepositPage {

    // ==========================================
    // ASSERT PAGE LOADED
    // ==========================================

    assertLoaded() {
        cy.dismissNotificationPopupIfPresent();

        cy.contains("Service Pay Direct Deposit", { timeout: 60000 })
            .should("be.visible");

        return this;
    }


    // ==========================================
    // FILL SERVICE PAY DIRECT DEPOSIT
    // ==========================================

    fillServicePayDirectDeposit() {

        // ==========================================
        // RECEIVING MILITARY RETIRED PAY
        // NO
        // ==========================================

        cy.contains(
            "Are you receiving military retired pay?"
        )
            .parent()
            .contains("label", "No")
            .click();


        // ==========================================
        // WILL RECEIVE MILITARY RETIRED PAY
        // IN THE FUTURE → NO
        // ==========================================

        cy.contains(
            "Will you receive military retired pay in the future?"
        )
            .parent()
            .contains("label", "No")
            .click();


        // ==========================================
        // DO NOT PAY ME VA COMPENSATION
        // CHECKBOX → CHECKED
        // ==========================================

        cy.contains(
            "Do NOT pay me VA compensation. I do NOT want to receive VA compensation in lieu of retired pay."
        )
            .parent()
            .find('input[type="checkbox"]')
            .check({ force: true });


        // ==========================================
        // NO FINANCIAL INSTITUTION / PAYMENT AGENT
        // CHECKBOX → CHECKED
        // ==========================================

        cy.contains(
            "I certify that I do NOT have an account with a financial institution or certified payment agent."
        )
            .parent()
            .find('input[type="checkbox"]')
            .check({ force: true });


        // ==========================================
        // EVER RECEIVED PAY / SEVERANCE / LUMP SUM
        // NO
        // ==========================================

        cy.contains(
            "Have you ever received pay, disability severance pay, or any other lump sum payment from your branch of service?"
        )
            .parent()
            .contains("label", "No")
            .click();


        // ==========================================
        // DO NOT PAY ME VA COMPENSATION
        // TRAINING PAY
        // CHECKBOX → CHECKED
        // ==========================================

        cy.contains(
            "Do NOT pay me VA compensation. I do NOT want to receive VA compensation in lieu of training pay."
        )
            .parent()
            .find('input[type="checkbox"]')
            .check({ force: true });


        return this;
    }


    // ==========================================
    // SAVE AND CONTINUE
    // ==========================================

    saveAndContinue() {

        cy.contains(
            "button",
            "Save and Continue"
        )
            .should("be.visible")
            .click();

        return this;
    }
}


export default new ServicePayDirectDepositPage();