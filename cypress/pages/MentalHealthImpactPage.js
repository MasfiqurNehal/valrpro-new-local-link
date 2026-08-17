class MentalHealthImpactPage {

    // ==========================================
    // ASSERT PAGE LOADED
    // ==========================================

    assertLoaded() {
        cy.dismissNotificationPopupIfPresent();

        cy.contains("Mental Health Impact", {
            timeout: 60000
        })
            .should("be.visible");

        return this;
    }


    // ==========================================
    // FILL MENTAL HEALTH IMPACT
    // ==========================================

    fillMentalHealthImpact(data) {

        // ==========================================
        // 1. MEDICAL VISITS
        // ==========================================

        cy.contains(
            "Did you have any increased or decreased visits to a medical professional?"
        )
            .parent()
            .contains("label", data.medicalVisits)
            .click();


        // ==========================================
        // 2. OCCUPATIONAL SERIES / DUTY ASSIGNMENT
        // ==========================================

        cy.contains(
            "Did you request a change in occupational series or duty assignment?"
        )
            .parent()
            .contains("label", data.occupationalChange)
            .click();


        // ==========================================
        // 3. USE OF LEAVE
        // ==========================================

        cy.contains(
            "Did you have any increased or decreased use of leave?"
        )
            .parent()
            .contains("label", data.leaveUse)
            .click();


        // ==========================================
        // 4. PERFORMANCE / EVALUATIONS
        // ==========================================

        cy.contains(
            "Were there any changes in your performance or performance evaluations?"
        )
            .parent()
            .contains("label", data.performanceChanges)
            .click();


        // ==========================================
        // 5. DEPRESSION / PANIC / ANXIETY
        // ==========================================

        cy.contains(
            "Did you have episodes of depression, panic attacks, or anxiety?"
        )
            .parent()
            .contains("label", data.depressionPanicAnxiety)
            .click();


        // ==========================================
        // 6. MEDICATION / DRUGS / ALCOHOL
        // ==========================================

        cy.contains(
            "Was there any increased use of prescription medications"
        )
            .parent()
            .contains("label", data.increasedMedicationAlcohol)
            .click();


        // ==========================================
        // 7. DISCIPLINARY / LEGAL DIFFICULTIES
        // ==========================================

        cy.contains(
            "Were there any disciplinary or legal difficulties?"
        )
            .parent()
            .contains("label", data.disciplinaryLegal)
            .click();


        // ==========================================
        // 8. EATING HABITS
        // ==========================================

        cy.contains(
            "Were there any changes in your eating habits"
        )
            .parent()
            .contains("label", data.eatingHabits)
            .click();


        // ==========================================
        // 9. PREGNANCY / STD / STI TESTS
        // ==========================================

        cy.contains(
            "Were there any pregnancy tests or tests for STDs/STIs?"
        )
            .parent()
            .contains("label", data.pregnancyStdTests)
            .click();


        // ==========================================
        // 10. ECONOMIC / SOCIAL BEHAVIOR CHANGES
        // ==========================================

        cy.contains(
            "Were there any economic or social behavior changes"
        )
            .parent()
            .contains("label", data.socialBehaviorChanges)
            .click();


        // ==========================================
        // 11. SIGNIFICANT RELATIONSHIP CHANGES
        // ==========================================

        cy.contains(
            "Were there any changes or breakups of a significant relationship?"
        )
            .parent()
            .contains("label", data.relationshipChanges)
            .click();


        // ==========================================
        // 12. ADDITIONAL BEHAVIORAL CHANGES
        // ==========================================

        cy.get("body").then(($body) => {
            const textarea = $body.find('textarea[placeholder*="behavioral"], textarea[placeholder*="additional"]');
            if (textarea.length) {
                cy.wrap(textarea.first()).clear({ force: true }).type(data.additionalBehavioralChanges, { delay: 0 });
            }
        });


        // ==========================================
        // 13. OFFICIAL REPORT
        // ==========================================

        cy.contains(
            "Was an official report"
        )
            .parent()
            .contains("label", data.officialReport)
            .click();


        // ==========================================
        // OFFICIAL REPORT TYPE
        // ALL CHECKBOXES REMAIN UNCHECKED
        // ==========================================

        // Restricted
        // Unrestricted
        // Police Report
        // Neither
        // Other

        // Since officialReport = No,
        // no report type is selected.


        // ==========================================
        // OFFICIAL REPORT DETAILS
        // ==========================================

        cy.get(
            'textarea[placeholder*="official record details"]'
        )
            .should("be.visible")
            .clear()
            .type(data.officialReportDetails);


        // ==========================================
        // SUPPORTING EVIDENCE SOURCES
        // ALL CHECKBOXES REMAIN UNCHECKED
        // ==========================================

        // Chaplain or clergy
        // Counseling facility / health clinic
        // Faculty member
        // Rape crisis center
        // Civilian police reports
        // Family members / roommates
        // Fellow service member
        // Medical reports
        // Personal diaries / journals
        // None
        // Neither
        // Other


        // ==========================================
        // TREATMENT RECEIVED
        // ==========================================

        cy.contains(
            "Have you received treatment related to the impact of the traumatic event"
        )
            .parent()
            .contains("label", data.treatmentReceived)
            .click();


        // ==========================================
        // TREATMENT LOCATION
        // ALL CHECKBOXES REMAIN UNCHECKED
        // ==========================================

        // Private healthcare provider
        // VA Vet Center
        // Community Care
        // VA Medical Center / CBOC
        // Department of Defense / Military Treatment Facility


        // ==========================================
        // TREATMENT FACILITY FIELDS
        // ==========================================

        // Treatment = No,
        // therefore no treatment facility data is entered.


        // ==========================================
        // TREATMENT DATES
        // ==========================================

        // Treatment = No,
        // therefore no treatment dates are entered.


        // ==========================================
        // BEHAVIORAL / MENTAL HEALTH QUESTIONS
        // ALL = NO
        // ==========================================

        cy.contains(
            "Do you have a hard time motivating yourself?"
        )
            .parent()
            .contains("label", data.motivation)
            .click();


        cy.contains(
            "Do daily tasks feel like chores to you?"
        )
            .parent()
            .contains("label", data.dailyTasks)
            .click();


        cy.contains(
            "Do you have a hard time getting out of bed in the morning?"
        )
            .parent()
            .contains("label", data.gettingOutOfBed)
            .click();


        cy.contains(
            "Do you tend to procrastinate?"
        )
            .parent()
            .contains("label", data.procrastination)
            .click();


        cy.contains(
            "Do you isolate yourself and prefer to be alone?"
        )
            .parent()
            .contains("label", data.isolation)
            .click();


        cy.contains(
            "Do you avoid going out in public?"
        )
            .parent()
            .contains("label", data.avoidPublic)
            .click();


        cy.contains(
            "Do you look for exits and entrances when out in public?"
        )
            .parent()
            .contains("label", data.lookForExits)
            .click();


        cy.contains(
            "Do you feel like you are always on guard and wary of other people?"
        )
            .parent()
            .contains("label", data.alwaysOnGuard)
            .click();


        cy.contains(
            "Do you have a hard time sleeping"
        )
            .parent()
            .contains("label", data.sleepDifficulty)
            .click();


        cy.contains(
            "Do you have nightmares?"
        )
            .parent()
            .contains("label", data.nightmares)
            .click();


        cy.contains(
            "Do you feel like you are always exhausted and in a foggy state?"
        )
            .parent()
            .contains("label", data.exhaustedFoggy)
            .click();


        cy.contains(
            "Do you get irritable due to this?"
        )
            .parent()
            .contains("label", data.irritable)
            .click();


        cy.contains(
            "Do you tend to snap easily?"
        )
            .parent()
            .contains("label", data.snapEasily)
            .click();


        cy.contains(
            "Do you have little to no patience?"
        )
            .parent()
            .contains("label", data.lackOfPatience)
            .click();


        cy.contains(
            "Do you avoid people due to this?"
        )
            .parent()
            .contains("label", data.avoidPeople)
            .click();


        cy.contains(
            "Do you ever use substances to cope with your mental health?"
        )
            .parent()
            .contains("label", data.substances)
            .click();


        cy.contains(
            "Do you ever feel like a burden to your family?"
        )
            .parent()
            .contains("label", data.burdenToFamily)
            .click();


        cy.contains(
            "Do you ever wonder why you are still here or question your purpose?"
        )
            .parent()
            .contains("label", data.questionPurpose)
            .click();


        // ==========================================
        // OTHER MENTAL HEALTH SYMPTOMS
        // ==========================================

        cy.get(
            'textarea[placeholder*="other mental health symptoms"]'
        )
            .should("be.visible")
            .clear()
            .type(data.otherMentalHealthSymptoms);


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


export default new MentalHealthImpactPage();