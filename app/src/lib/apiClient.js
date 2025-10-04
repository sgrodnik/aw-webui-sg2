// Base URL for the ActivityWatch API
const BASE_URL = "http://localhost:5600/api";

/**
 * Fetches events from a specific bucket within a given time range.
 * As described in swagger.json
 *
 * @param {string} bucketId The ID of the bucket (e.g., "aw-watcher-window_localhost.localdomain").
 * @param {string} startTime ISO 8601 formatted start time.
 * @param {string} endTime ISO 8601 formatted end time.
 * @returns {Promise<Array>} A promise that resolves to an array of events.
 */
export async function getEvents(bucketId, startTime, endTime) {
    const url = `${BASE_URL}/0/buckets/${bucketId}/events?starttime=${startTime}&endtime=${endTime}`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`Error fetching events for bucket ${bucketId}:`, error);
        return [];
    }
}
