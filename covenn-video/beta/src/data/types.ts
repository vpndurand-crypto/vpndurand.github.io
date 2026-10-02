/** Modèle de données de la bêta (plan technique, section 6). Types uniquement : aucune logique. */
export type Id = string;
export type IsoDate = string;
export type IsoDateTime = string;
/** Montant ou ratio en chaîne décimale ('10000000.00'), jamais en nombre flottant. */
export type DecimalString = string;
/** Clé d'un test : `${covenantId}@${date}`. */
export type TestKey = string;

export interface Organization { id: Id; name: string; reporting_currency: 'EUR'; created_at: IsoDate }
export interface User { id: Id; first_name: string; last_name: string; email: string; job_title: string; role: 'ADMIN' }
export interface Entity { id: Id; name: string; short_name: string; currency: 'EUR'; fiscal_year_end_month: number; fiscal_year_end_day: number; is_active: boolean }
export interface Lender { id: Id; name: string; lender_type: 'BANK' | 'LEASING' }

export type FinancingCategory = 'BANK_MLT' | 'LEASE' | 'REVOLVING_CT';
export interface Financing {
  id: Id; label: string; external_reference: string; entity_id: Id; lender_id: Id; category: FinancingCategory;
  initial_amount: DecimalString | null; authorized_limit: DecimalString | null;
  signature_date: IsoDate; availability_date: IsoDate; maturity_date: IsoDate;
  rate_type: 'FIXED' | 'FLOATING'; fixed_rate: DecimalString | null; floating_index: string | null; margin: DecimalString | null;
  amortization_profile: string; status: 'ACTIVE'; document_ids: Id[]; provenance: ProvenanceRef;
}
export interface OutstandingDeclaration {
  id: Id; financing_id: Id; as_of_date: IsoDate; amount: DecimalString; comment: string; document_id: Id | null; created_by: Id; created_at: IsoDateTime;
}

export type DocumentType = 'CONTRACT' | 'OTHER';
export interface FinancingDocument {
  id: Id; title: string; document_type: DocumentType; file_name: string; entity_id: Id; financing_ids: Id[];
  document_date: IsoDate; reference: string; page_count: number; excerpt_pages: number[]; uploaded_by: Id; uploaded_at: IsoDateTime;
}
export interface ContractBlock { id: string; kind: 'title' | 'heading' | 'paragraph'; text: string }
export interface ContractPage { document_id: Id; page: number; running_header: string; blocks: ContractBlock[] }

export interface AccountingAccount { id: Id; entity_id: Id; account_number: string; label: string }
export interface TrialBalanceLine { row: number; account_number: string; label: string; debit: DecimalString; credit: DecimalString; balance: DecimalString }
export interface TrialBalance {
  id: Id; entity_id: Id; period_end: IsoDate; fiscal_year_start: IsoDate; version: number; status: 'ACTIVE' | 'SUPERSEDED';
  import_job_id: Id; total_debit: DecimalString; total_credit: DecimalString; superseded_at: IsoDateTime | null; lines: TrialBalanceLine[];
}
export interface ImportJob { id: Id; entity_id: Id; balance_id: Id; file_name: string; period_end: IsoDate; row_count: number; created_by: Id; created_at: IsoDateTime; status: 'COMPLETED' }

export type BaseMetricCode =
  | 'MC-01' | 'MC-02' | 'MC-03' | 'MC-04' | 'MC-05' | 'MC-06' | 'MC-07' | 'MC-08' | 'MC-09' | 'MC-10'
  | 'MC-11' | 'MC-12' | 'MC-13' | 'MC-14' | 'MC-15' | 'MC-16' | 'MC-17' | 'MC-18' | 'MC-19' | 'MC-99';
export type DerivedMetricCode = 'MC-30' | 'MC-31' | 'MC-32' | 'MC-33';
export type MetricCode = BaseMetricCode | DerivedMetricCode;
export interface AccountingMappingRule { id: Id; account_pattern: string; match_type: 'PREFIX' | 'EXACT'; metric_code: BaseMetricCode; sign: 1 | -1; status: 'VALIDATED' }
export interface AccountingMapping { id: Id; entity_id: Id; version: number; status: 'ACTIVE'; validated_by: Id; validated_at: IsoDateTime; rules: AccountingMappingRule[] }

export interface ClauseRef { document_id: Id; page: number; clause_id: string; article: string; excerpt: string }
export type Comparison = 'LTE' | 'LT' | 'GTE' | 'GT';
export type CovenantForm = 'RATIO' | 'AMOUNT';
export type Side = 'NUMERATOR' | 'DENOMINATOR';
export interface Covenant {
  id: Id; label: string; short_label: string; covenant_type: 'LEVERAGE' | 'CUSTOM'; form: CovenantForm; entity_id: Id;
  financing_ids: Id[]; source_document_id: Id; source_note: string; status: 'ACTIVE';
}
export type ComponentSourceKind = 'REGISTRY_OUTSTANDING' | 'FINANCIAL_DATA' | 'MANUAL_VALUE';
export interface CovenantComponent {
  id: Id; side: Side; sequence: number; label: string; sign: 1 | -1; source_kind: ComponentSourceKind;
  metric_code: MetricCode | null; basis: 'LTM' | null; financing_ids: Id[]; clause: ClauseRef;
}
export interface ThresholdStep { id: Id; from_date: IsoDate; threshold: DecimalString; clause: ClauseRef }
export interface AdjustmentCategory {
  id: Id; label: string; side: Side; direction: 1 | -1; cap_type: 'NONE' | 'ABSOLUTE' | 'PERCENT';
  cap_value: DecimalString | null; cap_reference_component_id: Id | null; clause: ClauseRef;
}
export interface DeltaLabels { numerator: string; denominator: string }
export interface CovenantDefinition {
  id: Id; covenant_id: Id; version: number; status: 'VALIDATED'; effective_from: IsoDate; effective_to: IsoDate | null;
  comparison: Comparison; numerator_label: string; denominator_label: string; frequency: 'QUARTERLY' | 'SEMI_ANNUAL' | 'ANNUAL';
  first_test_date: IsoDate; calculation_basis: 'LTM'; components: CovenantComponent[]; threshold_steps: ThresholdStep[];
  adjustment_categories: AdjustmentCategory[]; delta_labels: DeltaLabels; validated_by: Id; validated_at: IsoDateTime;
}
export interface CovenantAdjustment {
  id: Id; test_key: TestKey; category_id: Id; label: string; amount: DecimalString; justification: string;
  document_id: Id | null; created_by: Id; created_at: IsoDateTime;
}

/** Origine d'un chiffre (plan technique, section 11). */
export type ProvenanceObjectKind = 'OUTSTANDING' | 'ADJUSTMENT' | 'FINANCING';
export type ProvenanceRef =
  | { type: 'CONTRACT'; documentId: Id; page: number; clauseId: string; article: string; excerpt: string; validatedBy: Id; validatedAt: IsoDateTime }
  | { type: 'IMPORT'; balanceId: Id; balanceVersion: number; importJobId: Id; fileName: string; rows: number[]; accounts: string[]; column: 'Débit' | 'Crédit' }
  | { type: 'MANUAL_ENTRY'; userId: Id; recordedAt: IsoDateTime; justification: string | null; documentId: Id | null; object: { kind: ProvenanceObjectKind; id: Id } }
  | { type: 'CALCULATION'; rule: string; formula: string; inputs: string[] };

export type NodeRole = 'RESULT' | 'NUMERATOR' | 'DENOMINATOR' | 'COMPONENT' | 'AGGREGATE' | 'ACCOUNT' | 'OUTSTANDING' | 'ADJUSTMENT' | 'THRESHOLD';
export interface DecompositionNode {
  id: string; label: string; value: DecimalString | null; unit: 'EUR' | 'RATIO'; sign: 1 | -1 | null; role: NodeRole;
  provenance: ProvenanceRef; clause: ClauseRef | null; missing: MissingInput[]; children: DecompositionNode[];
}
export type MissingCode = 'BALANCE_MISSING' | 'OUTSTANDING_MISSING' | 'MAPPING_INCOMPLETE' | 'MANUAL_VALUE_MISSING';
export interface MissingInput { code: MissingCode; label: string; entityId: Id | null; financingId: Id | null; date: IsoDate }

export type CalcStatus = 'COMPLIANT' | 'WATCH' | 'CRITICAL' | 'BREACH' | 'NOT_COMPUTABLE' | 'NOT_MEANINGFUL';
export interface RetainedAdjustment { adjustmentId: Id; categoryId: Id; label: string; side: Side; direction: 1 | -1; entered: DecimalString; retained: DecimalString }
export interface EvaluationResult {
  covenantId: Id; definitionId: Id; definitionVersion: number; calcDate: IsoDate; isContractualTestDate: boolean;
  form: CovenantForm; comparison: Comparison; thresholdStep: ThresholdStep; nextThresholdStep: ThresholdStep | null;
  numerator: DecimalString | null; denominator: DecimalString | null; adjustmentsRetained: RetainedAdjustment[];
  valueExact: DecimalString | null; value: DecimalString | null; threshold: DecimalString; status: CalcStatus;
  headroom: DecimalString | null; headroomPct: DecimalString | null;
  deltaNumerator: DecimalString | null; deltaDenominator: DecimalString | null; deltaLabels: DeltaLabels;
  missing: MissingInput[]; tree: DecompositionNode;
}

export interface SourceVersions { balances: Array<{ id: Id; version: number }>; outstanding: Id[] }
export interface CanonicalComponent {
  id: Id; side: Side; sign: 1 | -1; source_kind: ComponentSourceKind; metric_code: MetricCode | null; basis: 'LTM' | null;
  value: DecimalString; sources: SourceVersions;
}
export interface CanonicalInputs {
  covenant_id: Id; definition_id: Id; definition_version: number; calc_date: IsoDate; comparison: Comparison;
  threshold_step: { id: Id; from_date: IsoDate; threshold: DecimalString };
  components: CanonicalComponent[]; adjustments: Array<{ category_id: Id; entered: DecimalString; retained: DecimalString }>;
}
export interface SnapshotVersions extends SourceVersions { mapping: { id: Id; version: number } | null }
export interface TestSnapshot { definition_version: number; inputs: CanonicalInputs; inputs_hash: string; result: EvaluationResult; versions: SnapshotVersions }
export interface SavedTest {
  key: TestKey; occurrence: number; covenant_id: Id; definition_id: Id; test_date: IsoDate; is_contractual_test_date: boolean;
  closed_by: Id; closed_at: IsoDateTime; snapshot: TestSnapshot;
}
export interface SavedTestSeed { key: TestKey; occurrence: number; covenant_id: Id; test_date: IsoDate; closed_by: Id; closed_at: IsoDateTime }

export type AuditAction =
  | 'ORGANIZATION_CREATED' | 'ENTITY_CREATED' | 'FINANCING_CREATED' | 'DOCUMENT_UPLOADED' | 'TRIAL_BALANCE_IMPORTED'
  | 'MAPPING_VALIDATED' | 'DEFINITION_VALIDATED' | 'OUTSTANDING_DECLARED' | 'ADJUSTMENT_SAVED' | 'ADJUSTMENT_RESTORED'
  | 'CALCULATION_RUN' | 'TEST_CLOSED' | 'ALERT_ACKNOWLEDGED';
export type AuditTargetType =
  | 'ORGANIZATION' | 'ENTITY' | 'FINANCING' | 'DOCUMENT' | 'TRIAL_BALANCE' | 'MAPPING' | 'COVENANT_DEFINITION'
  | 'OUTSTANDING' | 'ADJUSTMENT' | 'TEST' | 'ALERT';
export interface AuditEvent {
  id: Id; organization_id: Id; entity_id: Id | null; user_id: Id; action: AuditAction; target_type: AuditTargetType;
  target_id: Id; target_label: string; before: Record<string, string> | null; after: Record<string, string> | null;
  created_at: IsoDateTime; origin: 'SEED' | 'DEMO';
}

export type ScheduleKind = 'COVENANT_TEST' | 'INSTALLMENT' | 'MATURITY' | 'THRESHOLD_STEP';
export interface ScheduleEvent {
  id: Id; event_date: IsoDate; kind: ScheduleKind; label: string; entity_id: Id; financing_id: Id; covenant_ids: Id[];
  principal: DecimalString | null; interest: DecimalString | null; total: DecimalString | null;
}
export interface ScheduleGap { financing_id: Id; note: string }
export interface AlertItem {
  id: Id; alert_type: 'COVENANT_STATUS' | 'THRESHOLD_STEP' | 'MATURITY'; severity: 'INFO' | 'WATCH';
  title: string; message: string; due_date: IsoDate; entity_id: Id; target: { kind: 'COVENANT' | 'FINANCING'; id: Id }; created_at: IsoDateTime;
}
export interface AiProposal {
  id: Id; document_id: Id; field_label: string; proposed_value: string; final_value: string; page: number; clause_id: string | null;
  confidence: 'HIGH' | 'MEDIUM'; status: 'VALIDATED' | 'CORRECTED';
}
export interface RoadmapStep { id: Id; order: number; title: string; horizon: string; summary: string; capabilities: string[]; in_beta: boolean }
export interface PreviewData { schedule: ScheduleEvent[]; scheduleGaps: ScheduleGap[]; alerts: AlertItem[]; aiProposals: AiProposal[]; roadmap: RoadmapStep[] }

/** Vue complète des données : jeu initial, ou jeu initial + actions de la démonstration (store). */
export interface SeedData {
  organization: Organization; users: User[]; entities: Entity[]; lenders: Lender[]; financings: Financing[];
  outstanding: OutstandingDeclaration[]; documents: FinancingDocument[]; contractPages: ContractPage[];
  accounts: AccountingAccount[]; balances: TrialBalance[]; importJobs: ImportJob[]; mappings: AccountingMapping[];
  covenants: Covenant[]; definitions: CovenantDefinition[]; adjustments: CovenantAdjustment[]; savedTests: SavedTest[];
  audit: AuditEvent[]; preview: PreviewData;
}
