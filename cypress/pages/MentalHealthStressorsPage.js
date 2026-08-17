class MentalHealthStressorsPage {

    // ==========================================
    // ASSERT PAGE LOADED
    // ==========================================

    assertLoaded() {
        cy.dismissNotificationPopupIfPresent();

        cy.contains("Mental Health Stressors", {
            timeout: 60000
        })
            .should("be.visible");

        return this;
    }


    // ==========================================
    // FILL MENTAL HEALTH STRESSORS
    // ==========================================

    fillMentalHealthStressors(data) {

        // ==========================================
        // JOB / ROLE
        // ==========================================

        cy.get("body").then(($body) => {
            const textInputs = $body.find('input[type="text"], input:not([type="checkbox"]):not([type="radio"]):not([type="hidden"])');
            if (textInputs.length) {
                cy.wrap(textInputs.first()).clear({ force: true }).type(data.jobRole, { delay: 0 });
            } else {
                cy.get('input').first().clear({ force: true }).type(data.jobRole, { delay: 0 });
            }
        });


        // ==========================================
        // ROLES / DUTIES
        // ==========================================

        cy.get("body").then(($body) => {
            const textareas = $body.find('textarea');
            if (textareas.length) {
                cy.wrap(textareas.first()).clear({ force: true }).type(data.rolesDuties, { delay: 0 });
            } else {
                cy.get('textarea').first().clear({ force: true }).type(data.rolesDuties, { delay: 0 });
            }
        });


        // ==========================================
        // STRESS LEVEL
        // ==========================================

        cy.contains("How stressful was your job on a scale of 1–10?")
            .parent()
            .within(() => {

                cy.contains(
                    "button",
                    String(data.stressLevel)
                )
                    .click();

            });


        // ==========================================
        // YES / NO QUESTIONS
        // ALL = NO
        // ==========================================

        cy.contains("Were you deployed?")
            .parent()
            .contains("label", data.deployed)
            .click();


        cy.contains(
            "Did anyone close to you (service member or civilian) pass away?"
        )
            .parent()
            .contains("label", data.deathWitnessed)
            .click();


        cy.contains(
            "Did you ever experience a natural disaster while serving?"
        )
            .parent()
            .contains("label", data.naturalDisaster)
            .click();


        cy.contains(
            "Were you ever abused or assaulted?"
        )
            .parent()
            .contains("label", data.abusedOrAssaulted)
            .click();


        cy.contains(
            "Were others' lives at risk on a day-to-day basis"
        )
            .parent()
            .contains("label", data.othersLivesAtRisk)
            .click();


        cy.contains(
            "Did you work in a medical position or other position where you witnessed severe accidents or deaths frequently?"
        )
            .parent()
            .contains("label", data.witnessedSevereAccidents)
            .click();


        cy.contains(
            "Were you or anyone close to you involved in any accidents or crashes?"
        )
            .parent()
            .contains("label", data.accidentsOrCrashes)
            .click();


        cy.contains(
            "Did you ever clean up a crash or accident site?"
        )
            .parent()
            .contains("label", data.cleanedAccidentSite)
            .click();


        cy.contains(
            "Did you have any medical traumas that affected you mentally?"
        )
            .parent()
            .contains("label", data.medicalTrauma)
            .click();


        cy.contains(
            "Did you experience any hazing?"
        )
            .parent()
            .contains("label", data.hazing)
            .click();


        cy.contains(
            "Did you experience any abuse of power by a superior?"
        )
            .parent()
            .contains("label", data.abuseOfPower)
            .click();


        cy.contains(
            "Did you handle dangerous items on a daily basis?"
        )
            .parent()
            .contains("label", data.dangerousItems)
            .click();


        cy.contains(
            "Did you experience any familial issues while in service?"
        )
            .parent()
            .contains("label", data.familyIssues)
            .click();


        // ==========================================
        // OTHER EVENTS
        // ==========================================

        cy.get(
            'textarea[placeholder*="additional events"]'
        )
            .should("be.visible")
            .clear()
            .type(data.otherEvents);


        // ==========================================
        // COMBAT / TRAINING
        // CHECKBOX = NOT SELECTED
        // ==========================================

        if (data.combatTraining === true) {

            cy.contains(
                "The stressor(s) I am claiming is/are related to Combat/Training"
            )
                .click();

        }


        // ==========================================
        // PERSONAL ASSAULT / TRAUMA
        // ==========================================

        cy.contains(
            "Personal Assault/Trauma"
        )
            .parent()
            .contains("label", data.personalAssaultTrauma)
            .click();


        // ==========================================
        // OTHER TRAUMATIC EVENT
        // CHECKBOX = NOT SELECTED
        // ==========================================

        if (data.otherTraumaticEvent === true) {

            cy.contains("Other traumatic event")
                .click();

        }


        return this;
    }


    // ==========================================
    // SAVE & CONTINUE
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


export default new MentalHealthStressorsPage();