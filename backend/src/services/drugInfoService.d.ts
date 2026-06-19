/**
 * DrugInfoService
 *
 * API-agnostic service for fetching drug medical information.
 * Phase 1: Standardized interface for manual data entry.
 * Phase 2 (Future): Integration with RxNav, OpenFDA, and other clinical databases.
 */
export interface DrugInfoResponse {
    name: string;
    medicalDescription?: string;
    uses?: string[];
    sideEffects?: string[];
    warnings?: string[];
    dosage?: string;
    contraindications?: string[];
}
declare class DrugInfoService {
    /**
     * Fetches medical information for a given drug name.
     * Currently returns a placeholder structure for future API integration.
     */
    fetchDrugData(drugName: string): Promise<DrugInfoResponse | null>;
    /**
     * Formats raw external API data into the system's standardized medical info format.
     */
    formatApiResponse(rawData: any): Partial<DrugInfoResponse>;
}
declare const _default: DrugInfoService;
export default _default;
//# sourceMappingURL=drugInfoService.d.ts.map