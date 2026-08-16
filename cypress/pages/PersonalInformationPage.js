class PersonalInformationPage {

    assertLoaded() {
        cy.url()
            .should("include", "/form/personal-information-form");

        cy.contains("Personal Information")
            .should("be.visible");

        return this;
    }

    fillPersonalInformation(data) {

        // First Name
        cy.get('input[placeholder="Enter first name"]')
            .clear()
            .type(data.firstName);

        // Middle Initial
        cy.get('input[placeholder="Enter middle initial"]')
            .clear()
            .type(data.middleInitial);

        // Last Name
        cy.get('input[placeholder="Enter last name"]')
            .clear()
            .type(data.lastName);

        // Email
        cy.get('input[placeholder="your@email.com"]')
            .first()
            .clear()
            .type(data.email);

        // Alternate Email
        cy.get('input[placeholder="your@email.com"]')
            .eq(1)
            .clear()
            .type(data.alternateEmail);

        // Electronic correspondence agreement
        cy.contains(
            "I agree to receive electronic correspondence from VA in regards to my claim"
        )
            .click();

        // Social Security Number
        cy.get('input[placeholder="XXX-XX-XXXX"]')
            .clear()
            .type(data.ssn);

        // US Phone Number
        cy.get('input[placeholder="(XXX) XXX-XXXX"]')
            .first()
            .clear()
            .type(data.usPhone);

        // International Phone Number
        cy.get('input[placeholder="+XX XXX XXX XXXX"]')
            .clear()
            .type(data.internationalPhone);

        // Date of Birth
        cy.get('input[type="date"]')
            .clear()
            .type(data.dateOfBirth);

        // VA File Number
        cy.get(
            'input[placeholder="Enter va file number (if different from ssn)"]'
        )
            .clear()
            .type(data.vaFileNumber);

        // Service Number
        cy.get('input[placeholder="Enter service number"]')
            .clear()
            .type(data.serviceNumber);

        // Street Address
        cy.get('input[placeholder="Enter street address"]')
            .clear()
            .type(data.streetAddress);

        // Apt / Suite / Unit
        cy.get('input[placeholder="Enter apt / suite / unit"]')
            .clear()
            .type(data.aptSuiteUnit);

        // City
        cy.get('input[placeholder="Enter city"]')
            .clear()
            .type(data.city);

        // State
        cy.get("select")
            .select(data.state);

        // ZIP Code
        cy.get('input[placeholder="12345 or 12345-6789"]')
            .clear()
            .type(data.zipCode);

        // International Postal Code
        cy.get(
            'input[placeholder="Enter international postal code (if outside usa)"]'
        )
            .clear()
            .type(data.internationalPostalCode);

        // Country
        cy.get('input[value="USA"]')
            .should("exist");

        // Currently homeless? -> No
        cy.contains("Are you currently homeless?")
            .parent()
            .contains("No")
            .click();

        // At risk of becoming homeless? -> No
        cy.contains("Are you currently at risk of becoming homeless?")
            .parent()
            .contains("No")
            .click();

        // Point of Contact - Name
        cy.get(
            'input[placeholder="Full name of contact person"]'
        )
            .clear()
            .type(data.pointOfContactName);

        // Point of Contact - Phone
        cy.get('input[placeholder="(XXX) XXX-XXXX"]')
            .eq(1)
            .clear()
            .type(data.pointOfContactPhone);

        return this;
    }

    saveAndContinue() {
        cy.dismissNotificationPopupIfPresent();
        cy.contains(
            "button",
            "Save and Continue"
        )
            .scrollIntoView()
            .should("exist")
            .click({ force: true });

        return this;
    }
}

export default new PersonalInformationPage();