interface Location {
    lat: number;
    lon: number;
    timestamp: Date;
}
export declare class GeoService {
    /**
     * Calculates the great-circle distance between two points in KM
     */
    static getDistance(loc1: {
        lat: number;
        lon: number;
    }, loc2: {
        lat: number;
        lon: number;
    }): number;
    /**
     * Detects "Impossible Travel" based on distance and time delta
     * Returns: { isImpossible: boolean, speed: number }
     */
    static checkImpossibleTravel(prev: Location, current: Location): {
        isImpossible: boolean;
        speed: number;
        risk: 'LOW' | 'MEDIUM' | 'HIGH';
    };
    /**
     * MOCK: Returns coordinates for a given IP or Country string
     * In production, this would use a GeoIP provider like MaxMind.
     */
    static mockLookup(locationHint: string): {
        lat: number;
        lon: number;
    };
}
export {};
//# sourceMappingURL=GeoService.d.ts.map