import { SECURITY_THRESHOLDS } from "../config/security.js";
export class GeoService {
    /**
     * Calculates the great-circle distance between two points in KM
     */
    static getDistance(loc1, loc2) {
        const R = 6371; // Earth radius in km
        const dLat = (loc2.lat - loc1.lat) * Math.PI / 180;
        const dLon = (loc2.lon - loc1.lon) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(loc1.lat * Math.PI / 180) * Math.cos(loc2.lat * Math.PI / 180) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
    /**
     * Detects "Impossible Travel" based on distance and time delta
     * Returns: { isImpossible: boolean, speed: number }
     */
    static checkImpossibleTravel(prev, current) {
        const distanceKm = this.getDistance(prev, current);
        const timeHours = (current.timestamp.getTime() - prev.timestamp.getTime()) / (1000 * 60 * 60);
        if (timeHours <= 0)
            return { isImpossible: false, speed: 0, risk: 'LOW' };
        const speedKmh = distanceKm / timeHours;
        let risk = 'LOW';
        if (speedKmh > SECURITY_THRESHOLDS.GEO_SPEED_KMH)
            risk = 'HIGH';
        else if (distanceKm > 500)
            risk = 'MEDIUM'; // New country or far region
        return {
            isImpossible: speedKmh > SECURITY_THRESHOLDS.GEO_SPEED_KMH,
            speed: Math.round(speedKmh),
            risk
        };
    }
    /**
     * MOCK: Returns coordinates for a given IP or Country string
     * In production, this would use a GeoIP provider like MaxMind.
     */
    static mockLookup(locationHint) {
        const table = {
            'INDIA': { lat: 20.5937, lon: 78.9629 },
            'GERMANY': { lat: 51.1657, lon: 10.4515 },
            'USA': { lat: 37.0902, lon: -95.7129 },
            'UK': { lat: 55.3781, lon: -3.4360 },
            'AUSTRALIA': { lat: -25.2744, lon: 133.7751 }
        };
        return table[locationHint.toUpperCase()] || table['INDIA'];
    }
}
//# sourceMappingURL=GeoService.js.map