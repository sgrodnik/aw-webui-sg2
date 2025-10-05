/**
 * Processes raw activity data from the ActivityWatch server by offloading the work to a Web Worker.
 *
 * @param {Array} afkEvents Events from the AFK watcher.
 * @param {Array} windowEvents Events from the Window watcher.
 * @param {Array} stopwatchEvents Events from the Stopwatch watcher.
 * @returns {Promise<{time_view: object, task_view: object}>} A promise that resolves with the processed data.
 */
export function processActivityData(afkEvents, windowEvents, stopwatchEvents) {
  return new Promise((resolve, reject) => {
    // Vite requires `new URL(...)` for worker imports.
    const worker = new Worker(new URL('./dataProcessor.worker.js', import.meta.url), {
      type: 'module'
    });

    worker.onmessage = (e) => {
      console.log("Main thread received processed data from worker.");
      resolve(e.data);
      worker.terminate(); // Clean up the worker once the job is done.
    };

    worker.onerror = (e) => {
      console.error("An error occurred in the data processing worker:", e);
      reject(e);
      worker.terminate(); // Clean up on error as well.
    };

    console.log("Sending data to worker for processing...");
    // We need to transfer the data, not just copy it, for performance.
    // However, these are complex objects, so we'll stick to copying for now.
    worker.postMessage({ afkEvents, windowEvents, stopwatchEvents });
  });
}