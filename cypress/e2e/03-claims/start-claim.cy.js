import ClaimsPage from "../../pages/ClaimsPage";
import PreScreeningFormPage from "../../pages/PreScreeningFormPage";
import PersonalInformationPage from "../../pages/PersonalInformationPage";
import ServiceHistoryPage from "../../pages/ServiceHistoryPage";
import ConditionSelectionPage from "../../pages/ConditionSelectionPage";
import MentalHealthStressorsPage from "../../pages/MentalHealthStressorsPage";
import MentalHealthImpactPage from "../../pages/MentalHealthImpactPage";
import EvidenceUploadPage from "../../pages/EvidenceUploadPage";
import ServicePayDirectDepositPage from "../../pages/ServicePayDirectDepositPage";
import ReviewAndSignPage from "../../pages/ReviewAndSignPage";

describe("Claims", () => {

  it("TC-CLAIM-001: starts a new claim and completes pre-screening", () => {

    // ==========================================
    // LOGIN
    // ==========================================

    cy.getAccount().then((account) => {
      cy.login(account.email, account.password);
    });


    // ==========================================
    // DASHBOARD
    // ==========================================

    cy.closeOnboardingModal();

    cy.contains("Dashboard", {
      timeout: 60000
    })
      .should("be.visible");


    // ==========================================
    // START A NEW CLAIM
    // ==========================================

    cy.contains(
      'button, a, [role="button"]',
      /START A NEW CLAIM/i,
      { timeout: 60000 }
    )
      .scrollIntoView()
      .should("be.visible")
      .click();


    // ==========================================
    // VA CONNECTION & VERIFICATION 
    // ==========================================

    cy.contains(
      "VA Connection & Verification",
      { timeout: 60000 }
    )
      .should("be.visible");

    cy.contains(
      'button, a, [role="button"]',
      /Continue to Claim/i,
      { timeout: 60000 }
    )
      .scrollIntoView()
      .should("be.visible")
      .click();

    // Handle Head-to-Toe assessment tutorial (Step 1 -> Next, Step 2 -> Next) and notification popups (Later)
    ClaimsPage.closeHeadToToeAssessment();


    // ==========================================
    // PRE-SCREENING
    // ==========================================

    cy.url({ timeout: 60000 })
      .should("include", "/form/pre_screening");

    PreScreeningFormPage
      .assertLoaded()
      .selectBenefitType("Compensation")
      .selectPreviousClaim("No")
      .selectActiveIntent("No")
      .saveAndContinue();


    // ==========================================
    // LOAD TEST DATA ONCE
    // ==========================================

    cy.fixture("testData/claimData.json").then((claimData) => {


      // ==========================================
      // PERSONAL INFORMATION
      // ==========================================

      PersonalInformationPage
        .assertLoaded()
        .fillPersonalInformation(
          claimData.personalInformation
        )
        .saveAndContinue();


      // ==========================================
      // SERVICE HISTORY
      // ==========================================

      ServiceHistoryPage
        .assertLoaded()
        .fillServiceHistory(
          claimData.serviceHistory
        )
        .saveAndContinue();


      // ==========================================
      // CONDITION SELECTION
      // PTSD ONLY
      // ==========================================

      ConditionSelectionPage
        .assertLoaded()
        .fillConditionSelection(
          claimData.conditionSelection
        )
        .saveAndContinue();


      // ==========================================
      // MENTAL HEALTH STRESSORS
      // ==========================================

      MentalHealthStressorsPage
        .assertLoaded()
        .fillMentalHealthStressors(
          claimData.mentalHealthStressors
        )
        .saveAndContinue();

      // ==========================================
      // MENTAL HEALTH IMPACT
      // ==========================================

      MentalHealthImpactPage
        .assertLoaded()
        .fillMentalHealthImpact(
          claimData.mentalHealthImpact
        )
        .saveAndContinue();

      // ==========================================
      // EVIDENCE UPLOAD
      // ==========================================

      EvidenceUploadPage
        .assertLoaded()
        .fillEvidenceUpload()
        .saveAndContinue();

      // ==========================================
      // SERVICE PAY DIRECT DEPOSIT
      // ==========================================

      ServicePayDirectDepositPage
        .assertLoaded()
        .fillServicePayDirectDeposit()
        .saveAndContinue();

      // ==========================================
      // REVIEW AND SIGN
      // ==========================================

      ReviewAndSignPage
        .assertLoaded()
        .fillReviewAndSign()
        .saveAndPreview()
        .completeNextFlow()
        .authorizeWithVaGov();

    });

  });

});
