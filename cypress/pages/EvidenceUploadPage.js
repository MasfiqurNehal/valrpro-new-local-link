class EvidenceUploadPage {

    // ==========================================
    // ASSERT PAGE LOADED
    // ==========================================

    assertLoaded() {
        cy.dismissNotificationPopupIfPresent();

        cy.contains("Evidence Upload", { timeout: 60000 })
            .should("be.visible");

        return this;
    }


    // ==========================================
    // FILL EVIDENCE UPLOAD
    // ==========================================

    fillEvidenceUpload() {

        // ==========================================
        // NEXUS LETTER / DBQ
        // ==========================================

        cy.get('input[placeholder*="what is a nexus letter"]')
            .clear()
            .type(
                "A Nexus Letter is a medical opinion linking a veteran's condition to military service. A DBQ is a Disability Benefits Questionnaire used to document medical information for a VA disability claim."
            );


        // ==========================================
        // WOULD YOU LIKE TO ADD EVIDENCE?
        // YES
        // ==========================================

        cy.contains(
            "Would you like to add evidence to your claim?"
        )
            .parent()
            .contains("label", "Yes")
            .click();


        // ==========================================
        // BUDDY STATEMENTS
        // NO
        // ==========================================

        cy.contains(
            "Do you have buddy statements to upload?"
        )
            .parent()
            .contains("label", "No")
            .click();


        // ==========================================
        // REPORTS
        // NO
        // ==========================================

        cy.contains(
            "Do you have any reports to upload?"
        )
            .parent()
            .contains("label", "No")
            .click();


        // ==========================================
        // NEWS ARTICLES
        // NO
        // ==========================================

        cy.contains(
            "Do you have news articles to upload?"
        )
            .parent()
            .contains("label", "No")
            .click();


        // ==========================================
        // MEDICAL RECORDS
        // NO
        // ==========================================

        cy.contains(
            "Do you have medical records to upload?"
        )
            .parent()
            .contains("label", "No")
            .click();


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


export default new EvidenceUploadPage();