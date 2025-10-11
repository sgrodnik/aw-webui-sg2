const DEBUG_IDS = new Set([33045, 33046, 33047, 33048, 33049, 33051, 33052, 33053]);

/**
 * Helper to get the ISO week number for a given Date.
 * @param {Date} d The date.
 * @returns {number} The ISO week number.
 */
function getWeekNumber(d) {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return weekNo;
}

/**
 * Merges overlapping time intervals with detailed logging.
 * @param {Array<object>} intervals Array of {start, end} Date objects.
 * @returns {Array<object>} A new array with overlapping intervals merged.
 */
function mergeOverlappingIntervals(intervals) {
    if (intervals.length <= 1) {
        return intervals;
    }

    // 1. Sort intervals by start time
    const sortedIntervals = intervals.sort((a, b) => a.start - b.start);

    const merged = [sortedIntervals[0]];

    for (let i = 1; i < sortedIntervals.length; i++) {
        const current = sortedIntervals[i];
        const lastMerged = merged[merged.length - 1];

        // If current interval overlaps with the last merged one, extend the last one
        if (current.start < lastMerged.end) {
            console.log('Merging interval:', {
                start: current.start.toISOString(),
                end: current.end.toISOString()
            }, 'into:', {
                start: lastMerged.start.toISOString(),
                end: lastMerged.end.toISOString()
            });
            lastMerged.end = new Date(Math.max(lastMerged.end, current.end));
        } else {
            merged.push(current);
        }
    }

    return merged;
}

/**
 * Analyzes window events for overlaps and logs them.
 * This is for analysis only and does not modify the events.
 * @param {Array<object>} windowEvents Array of window event objects.
 */
function analyzeWindowOverlaps(windowEvents) {
    // Sort events by timestamp to easily compare adjacent events
    const sortedEvents = [...windowEvents].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    console.log('--- Starting Window Overlap Analysis ---');
    let overlapCount = 0;

    for (let i = 0; i < sortedEvents.length - 1; i++) {
        const event1 = sortedEvents[i];
        const event2 = sortedEvents[i+1];

        const end1 = new Date(event1.timestamp).getTime() + event1.duration * 1000;
        const start2 = new Date(event2.timestamp).getTime();

        if (end1 > start2) {
            const overlapDuration = (end1 - start2) / 1000;
            console.log(
                `[Overlap Detected] Duration: ${overlapDuration.toFixed(3)}s`,
                {
                    event1: { id: event1.id, start: event1.timestamp, duration: event1.duration, data: event1.data },
                    event2: { id: event2.id, start: event2.timestamp, duration: event2.duration, data: event2.data },
                }
            );
            overlapCount++;
        }
    }

    if (overlapCount === 0) {
        console.log('No window overlaps found.');
    }
    console.log('--- Finished Window Overlap Analysis ---');
}

/**
 * Analyzes task events for overlaps and logs them.
 * @param {Array<object>} taskEvents Array of stopwatch event objects.
 */
function analyzeTaskOverlaps(taskEvents) {
    const sortedEvents = [...taskEvents].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    console.log('--- Starting Task Overlap Analysis ---');
    let overlapFound = false;

    for (let i = 0; i < sortedEvents.length; i++) {
        const event1 = sortedEvents[i];
        const start1 = new Date(event1.timestamp).getTime();
        const end1 = start1 + event1.duration * 1000;

        let simultaneousEvents = [event1];

        // Check against subsequent events
        for (let j = i + 1; j < sortedEvents.length; j++) {
            const event2 = sortedEvents[j];
            const start2 = new Date(event2.timestamp).getTime();
            const end2 = start2 + event2.duration * 1000;

            // Stop checking if event2 is already past event1
            if (start2 >= end1) {
                break;
            }

            overlapFound = true;
            const overlapStart = Math.max(start1, start2);
            const overlapEnd = Math.min(end1, end2);
            const overlapDuration = (overlapEnd - overlapStart) / 1000;

            // Determine overlap type
            if (start1 <= start2 && end1 >= end2) {
                console.log(`[Task Overlap - Inclusion] Duration: ${overlapDuration.toFixed(3)}s. Event 2 is inside Event 1.`, { event1, event2 });
            } else if (start2 <= start1 && end2 >= end1) {
                console.log(`[Task Overlap - Inclusion] Duration: ${overlapDuration.toFixed(3)}s. Event 1 is inside Event 2.`, { event1, event2 });
            } else {
                console.log(`[Task Overlap - Simple] Duration: ${overlapDuration.toFixed(3)}s.`, { event1, event2 });
            }

            simultaneousEvents.push(event2);
        }

        if (simultaneousEvents.length > 2) {
            console.error(`[CRITICAL] ${simultaneousEvents.length} tasks overlap at the same time!`, simultaneousEvents);
        }
    }

    if (!overlapFound) {
        console.log('No task overlaps found.');
    }
    console.log('--- Finished Task Overlap Analysis ---');
}


/**
 * Aggregates consecutive short events into a single meta-event to reduce visual noise.
 * @param {Array<object>} events - Sorted array of events to process.
 * @param {number} durationThreshold - The duration in seconds below which an event is considered "short".
 * @returns {Array<object>} A new array with short events aggregated.
 */
function aggregateShortEvents(events, durationThreshold) {
    if (events.length === 0) {
        return [];
    }

    const aggregatedEvents = [];
    let currentGroup = [];
    const MAX_GAP_SECONDS = 10; // User-defined value

    function finalizeGroup() {
        if (currentGroup.length === 0) {
            return;
        }

        const hasDebugId = currentGroup.some(e => DEBUG_IDS.has(e.id));
        if (hasDebugId) {
            console.log(`[DEBUG] Finalizing group with IDs: ${currentGroup.map(e => e.id).join(', ')}`);
        }

        if (currentGroup.length >= 1) {
            const firstEvent = currentGroup[0];
            const lastEvent = currentGroup[currentGroup.length - 1];

            const groupStart = new Date(firstEvent.timestamp);
            const groupEnd = new Date(new Date(lastEvent.timestamp).getTime() + lastEvent.duration * 1000);
            
            const totalDuration = (groupEnd.getTime() - groupStart.getTime()) / 1000;

            const appStats = {};
            let totalCleanDuration = 0;
            for (const event of currentGroup) {
                const appName = event.data.app;
                appStats[appName] = (appStats[appName] || 0) + event.duration;
                totalCleanDuration += event.duration;
            }

            const sortedApps = Object.entries(appStats).sort((a, b) => b[1] - a[1]);
            const titleDetails = sortedApps.map(([app, dur]) => `${app} (${Math.round(dur)}s)`).join(', ');
            const originalIds = currentGroup.map(e => e.id).join(', ');
            const title = `Мелкая активность (IDs: ${originalIds}) (${Math.round(totalCleanDuration)}s): ${titleDetails}`;

            const newId = `meta_${groupStart.toISOString()}_${currentGroup.length}`;
            
            const metaEvent = {
                id: newId,
                timestamp: groupStart.toISOString(),
                duration: totalDuration,
                data: {
                    app: 'Aggregated',
                    is_aggregated: true,
                    title: title,
                    apps: appStats,
                    eventCount: currentGroup.length,
                    original_events: currentGroup 
                }
            };

            if (hasDebugId) {
                console.log('[DEBUG] Created meta-event:', JSON.parse(JSON.stringify(metaEvent)));
            }

            aggregatedEvents.push(metaEvent);
        }
        currentGroup = [];
    }

    for (const event of events) {
        if (DEBUG_IDS.has(event.id)) {
            console.log(`[DEBUG] Processing event ${event.id}, duration: ${event.duration}s`);
        }

        if (event.duration < durationThreshold) {
            if (currentGroup.length > 0) {
                const lastEvent = currentGroup[currentGroup.length - 1];
                const lastEventEnd = new Date(lastEvent.timestamp).getTime() + lastEvent.duration * 1000;
                const currentEventStart = new Date(event.timestamp).getTime();
                const gap = (currentEventStart - lastEventEnd) / 1000;

                if (gap > MAX_GAP_SECONDS) {
                    if (currentGroup.some(e => DEBUG_IDS.has(e.id))) {
                        console.log(`[DEBUG] Gap of ${gap.toFixed(2)}s is too large. Finalizing group.`);
                    }
                    finalizeGroup();
                }
            }
            currentGroup.push(event);
            if (DEBUG_IDS.has(event.id)) {
                console.log(`[DEBUG] Pushed ${event.id} to currentGroup. Group now: [${currentGroup.map(e => e.id).join(', ')}]`);
            }
        } else {
            if (currentGroup.length > 0 && currentGroup.some(e => DEBUG_IDS.has(e.id))) {
                console.log(`[DEBUG] Encountered long event. Finalizing group.`);
            }
            finalizeGroup();
            aggregatedEvents.push(event);
        }
    }

    finalizeGroup();

    return aggregatedEvents;
}

/**
 * Helper to set a value in a nested object path, creating objects if they don't exist.
 * The final property is always an array to which the value is pushed.
 * @param {object} obj The object to modify.
 * @param {Array<string|number>} path The path to set.
 * @param {*} value The value to push into the final array.
 */
function setDeep(obj, path, value) {
    let schema = obj;
    for (let i = 0; i < path.length - 1; i++) {
        const key = path[i];
        if (!schema[key]) {
            schema[key] = {};
        }
        schema = schema[key];
    }
    const finalKey = path[path.length - 1];
    if (!schema[finalKey]) {
        schema[finalKey] = [];
    }
    schema[finalKey].push(value);
}

/**
 * Calculates the intersection of an event with a list of "not-afk" time intervals.
 * @param {object} event The event to process.
 * @param {Array<object>} notAfkIntervals Array of {start, end} Date objects for not-afk periods.
 * @returns {Array<object>} An array of event fragments that fall within the not-afk intervals.
 */
function getActiveFragments(event, notAfkIntervals) {
    const activeFragments = [];
    const eventStart = new Date(event.timestamp);
    const eventEnd = new Date(eventStart.getTime() + event.duration * 1000);

    for (const interval of notAfkIntervals) {
        const intersectionStart = new Date(Math.max(eventStart, interval.start));
        const intersectionEnd = new Date(Math.min(eventEnd, interval.end));

        if (intersectionStart < intersectionEnd) {
            const newDuration = (intersectionEnd.getTime() - intersectionStart.getTime()) / 1000;
            activeFragments.push({
                ...event,
                timestamp: intersectionStart.toISOString(),
                duration: newDuration,
            });
        }
    }
    return activeFragments;
}

/**
 * Splits a single event by hour boundaries.
 * @param {object} event The event to split.
 * @returns {Array<object>} An array of event fragments, split by hour.
 */
function splitEventByHour(event) {
    const fragments = [];
    const start = new Date(event.timestamp);
    const end = new Date(start.getTime() + event.duration * 1000);

    let current = new Date(start);

    while (current < end) {
        const nextHour = new Date(current);
        nextHour.setMinutes(0, 0, 0);
        nextHour.setHours(current.getHours() + 1);

        const splitPoint = new Date(Math.min(end, nextHour));
        const duration = (splitPoint.getTime() - current.getTime()) / 1000;

        if (duration > 0) {
            const fragment = {
                ...event,
                id: `${event.id}_${current.toISOString()}`, // Create unique ID for each fragment
                timestamp: current.toISOString(),
                duration: duration,
            };

            // If it's a meta-event, we must also filter its original_events to match the fragment's timeframe
            if (fragment.data.is_aggregated && Array.isArray(fragment.data.original_events)) {
                const fragmentStart = current;
                const fragmentEnd = splitPoint;

                const newOriginalEvents = fragment.data.original_events.filter(orig => {
                    const origStart = new Date(orig.timestamp);
                    const origEnd = new Date(origStart.getTime() + orig.duration * 1000);
                    // Check for overlap between the original event and the new fragment
                    return origStart < fragmentEnd && origEnd > fragmentStart;
                });

                // Create a new data object to avoid modifying the shared reference
                fragment.data = {
                    ...fragment.data,
                    original_events: newOriginalEvents,
                    eventCount: newOriginalEvents.length
                };
            }
            fragments.push(fragment);
        }
        current = splitPoint;
    }
    return fragments;
}

/**
 * Processes raw activity data from the ActivityWatch server.
 *
 * @param {Array} afkEvents Events from the AFK watcher.
 * @param {Array} windowEvents Events from the Window watcher.
 * @param {Array} stopwatchEvents Events from the Stopwatch watcher.
 * @returns {{time_view: object, task_view: object}} The processed data structured for visualization.
 */
function processActivityData(afkEvents, windowEvents, stopwatchEvents, aggregationThreshold) {
    // 1. Generate and clean "not-afk" intervals
    const rawNotAfkIntervals = afkEvents
        .filter(e => e.data.status === 'not-afk')
        .map(e => {
            const start = new Date(e.timestamp);
            const end = new Date(start.getTime() + e.duration * 1000);
            return { start, end };
        });
    
    const notAfkIntervals = mergeOverlappingIntervals(rawNotAfkIntervals);
    console.log(`Cleaned up not-afk intervals. Before: ${rawNotAfkIntervals.length}, After: ${notAfkIntervals.length}`);

    // 2. Filter and split events by the cleaned "not-afk" intervals
    let activeWindowEvents = windowEvents.flatMap(event => getActiveFragments(event, notAfkIntervals));
    const activeStopwatchEvents = stopwatchEvents.flatMap(event => getActiveFragments(event, notAfkIntervals));

    // --- New Step: Aggregate short window events to reduce noise ---
    if (aggregationThreshold > 0) {
        // Ensure events are sorted by time before aggregation
        activeWindowEvents.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        const preAggregationCount = activeWindowEvents.length;
        activeWindowEvents = aggregateShortEvents(activeWindowEvents, aggregationThreshold);
        console.log(`Aggregated short window events with threshold ${aggregationThreshold}s. Before: ${preAggregationCount}, After: ${activeWindowEvents.length}`);
    } else {
        console.log('Aggregation skipped as threshold is 0.');
    }

    // --- Run analysis on window and task events ---
    analyzeWindowOverlaps(activeWindowEvents);
    analyzeTaskOverlaps(activeStopwatchEvents);

    // 3. Split active events by hour
    const hourlySplitWindowEvents = activeWindowEvents.flatMap(splitEventByHour);
    const hourlySplitStopwatchEvents = activeStopwatchEvents.flatMap(splitEventByHour);

    // 4. Build final data structures
    const time_view = {};
    const task_view = {};

    // Build time_view
    const allHourlyEvents = [...hourlySplitWindowEvents, ...hourlySplitStopwatchEvents];

    for (const event of allHourlyEvents) {
        const d = new Date(event.timestamp);
        const path = [d.getFullYear(), d.getMonth() + 1, getWeekNumber(d), d.getDate(), d.getHours()];
        setDeep(time_view, path, event);
    }

    // Build task_view
    for (const taskEvent of hourlySplitStopwatchEvents) {
        const taskLabel = taskEvent.data.label;
        if (!taskLabel) continue;

        const taskStart = new Date(taskEvent.timestamp);
        const taskEnd = new Date(taskStart.getTime() + taskEvent.duration * 1000);

        for (const windowEvent of hourlySplitWindowEvents) {
            const windowStart = new Date(windowEvent.timestamp);
            const windowEnd = new Date(windowStart.getTime() + windowEvent.duration * 1000);

            const intersectionStart = new Date(Math.max(taskStart, windowStart));
            const intersectionEnd = new Date(Math.min(taskEnd, windowEnd));

            if (intersectionStart < intersectionEnd) {
                const d = new Date(intersectionStart);
                const path = [taskLabel, d.getFullYear(), d.getMonth() + 1, getWeekNumber(d), d.getDate(), d.getHours()];
                const fragmentDuration = (intersectionEnd.getTime() - intersectionStart.getTime()) / 1000;
                
                const windowFragment = {
                    ...windowEvent,
                    timestamp: intersectionStart.toISOString(),
                    duration: fragmentDuration,
                };
                setDeep(task_view, path, windowFragment);
            }
        }
    }

    console.log("Data processing complete in worker.");

    return { time_view, task_view };
}

self.onmessage = function(e) {
  const { afkEvents, windowEvents, stopwatchEvents, aggregationThreshold } = e.data;
  console.log("Worker received data, starting processing...");
  const processedData = processActivityData(afkEvents, windowEvents, stopwatchEvents, aggregationThreshold);
  console.log("Final object from worker:", processedData);
  console.log('[DEBUG] Final data to UI:', JSON.stringify(processedData, null, 2));
  self.postMessage(processedData);
};
