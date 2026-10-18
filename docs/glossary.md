# Glossary

French domain terms map to **one** English name used in code, database fields, commits and docs.
UI copy stays in French. Add a term here before using a new domain name in code.

| French (UI / business) | English (code) | Notes |
|---|---|---|
| formation | `training` | An item of the academy catalogue (AC-01, AC-02). |
| session inter (inter-entreprises) | `publicSession` | Dated session open to individuals from several companies (AC-05, AC-06). |
| demande intra (intra-entreprise) | `inCompanyRequest` | Training request for one company's staff (AC-07). |
| devis | `quote` | |
| adhésion | `membership` | Association membership (CB-02, CB-03). |
| formule / catégorie d'adhésion | `membershipPlan` | Category, amount and period of a membership. |
| don | `donation` | CB-04. |
| reçu (adhésion / don) | `receipt` | Not an invoice. Tax receipts only if the PO confirms eligibility. |
| facture | `invoice` | Academy only. |
| avoir | `creditNote` | Issued for refunds. |
| commande | `order` | |
| formateur / formatrice | `trainer` | Admin role; contracted trainers (AC-18…AC-22). |
| apprenant / apprenante | `learner` | A relationship (enrollment), not an admin role. |
| inscription (à une formation) | `enrollment` | |
| place (dans une session) | `seat` | |
| liste d'attente | `waitlist` | |
| bénévole | `volunteer` | Career Boost (CB-07). |
| candidature bénévole | `volunteerApplication` | |
| bureau (de l'association) | `board` | The association's elected officers (CB-01). |
| actualité | `news` | Shared `news` collection, tenant-scoped (CB-05, AC-14). |
| mentions légales | `legalNotice` | |
| recette | `recette` / `staging` | Pre-production environment (ADR-017). |
| site / univers | `tenant` | `upwilling` (academy) or `careerboost` (association). |
| organisme de formation | `trainingOrganization` | Regulatory status of the academy (AC-15). |
| interrupteur de fonctionnalité | `featureFlag` / kill switch | Per-tenant, editable in the admin. |
