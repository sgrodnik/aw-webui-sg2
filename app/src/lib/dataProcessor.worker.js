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
 * Merges overlapping time intervals.
 * @param {Array<object>} intervals Array of {start, end} Date objects.
 * @returns {Array<object>} A new array with overlapping intervals merged.
 */
function mergeOverlappingIntervals(intervals) {
    if (intervals.length <= 1) {
        return intervals;
    }
    const sortedIntervals = intervals.sort((a, b) => a.start - b.start);
    const merged = [sortedIntervals[0]];
    for (let i = 1; i < sortedIntervals.length; i++) {
        const current = sortedIntervals[i];
        const lastMerged = merged[merged.length - 1];
        if (current.start < lastMerged.end) {
            lastMerged.end = new Date(Math.max(lastMerged.end, current.end));
        } else {
            merged.push(current);
        }
    }
    return merged;
}

// NOTE: This is a permanent analysis function and should not be removed.
/**
 * Analyzes window events for overlaps and logs them.
 */
function analyzeWindowOverlaps(windowEvents) {
    const sortedEvents = [...windowEvents].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    let overlapCount = 0;
    for (let i = 0; i < sortedEvents.length - 1; i++) {
        const event1 = sortedEvents[i];
        const event2 = sortedEvents[i+1];
        const end1 = new Date(event1.timestamp).getTime() + event1.duration * 1000;
        const start2 = new Date(event2.timestamp).getTime();
        if (end1 > start2) {
            const overlapDuration = (end1 - start2) / 1000;
            console.warn(
                `[Data Anomaly] Window overlap detected. Duration: ${overlapDuration.toFixed(3)}s`,
                { event1, event2 }
            );
            overlapCount++;
        }
    }
}

// NOTE: This is a permanent analysis function and should not be removed.
/**
 * Analyzes task events for overlaps and logs them.
 */
function analyzeTaskOverlaps(taskEvents) {
    const sortedEvents = [...taskEvents].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    for (let i = 0; i < sortedEvents.length; i++) {
        const event1 = sortedEvents[i];
        const start1 = new Date(event1.timestamp).getTime();
        const end1 = start1 + event1.duration * 1000;

        let simultaneousEvents = [event1];

        for (let j = i + 1; j < sortedEvents.length; j++) {
            const event2 = sortedEvents[j];
            const start2 = new Date(event2.timestamp).getTime();

            if (start2 >= end1) {
                break;
            }

            console.warn('[Data Anomaly] Overlapping task event detected.', { event1, event2 });
            simultaneousEvents.push(event2);
        }

        if (simultaneousEvents.length > 2) {
            console.error(`[CRITICAL] ${simultaneousEvents.length} tasks overlap at the same time!`, simultaneousEvents);
        }
    }
}

/**
 * Aggregates consecutive short events into a single meta-event.
 */
function aggregateShortEvents(events, durationThreshold) {
    if (events.length === 0) {
        return [];
    }

    const aggregatedEvents = [];
    let currentGroup = [];
    const MAX_GAP_SECONDS = 10;

    function finalizeGroup() {
        if (currentGroup.length === 0) {
            return;
        }

        if (currentGroup.length > 1) {
            const firstEvent = currentGroup[0];
            const lastEvent = currentGroup[currentGroup.length - 1];
            const groupStart = new Date(firstEvent.timestamp);
            const groupEnd = new Date(new Date(lastEvent.timestamp).getTime() + lastEvent.duration * 1000);
            const totalDuration = (groupEnd.getTime() - groupStart.getTime()) / 1000;

            const appStats = {};
            let totalCleanDuration = 0;
            for (const event of currentGroup) {
                appStats[event.data.app] = (appStats[event.data.app] || 0) + event.duration;
                totalCleanDuration += event.duration;
            }

            const title = 'Aggregated Activity';
            const newId = `meta_${groupStart.toISOString()}_${currentGroup.length}`;

            aggregatedEvents.push({
                id: newId,
                timestamp: groupStart.toISOString(),
                duration: totalDuration,
                data: {
                    app: 'Aggregated',
                    is_aggregated: true,
                    title: title,
                    apps: appStats,
                    cleanDuration: totalCleanDuration,
                    eventCount: currentGroup.length,
                    original_events: currentGroup
                }
            });
        } else {
            aggregatedEvents.push(...currentGroup);
        }
        currentGroup = [];
    }

    for (const event of events) {
        if (event.duration < durationThreshold) {
            if (currentGroup.length > 0) {
                const lastEvent = currentGroup[currentGroup.length - 1];
                const lastEventEnd = new Date(lastEvent.timestamp).getTime() + lastEvent.duration * 1000;
                const currentEventStart = new Date(event.timestamp).getTime();
                const gap = (currentEventStart - lastEventEnd) / 1000;
                if (gap > MAX_GAP_SECONDS) {
                    finalizeGroup();
                }
            }
            currentGroup.push(event);
        } else {
            finalizeGroup();
            aggregatedEvents.push(event);
        }
    }

    finalizeGroup();
    return aggregatedEvents;
}

/**
 * Helper to set a value in a nested object path.
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
                id: event.data.is_aggregated ? `${event.id}_${current.toISOString()}` : event.id,
                timestamp: current.toISOString(),
                duration: duration,
            };

            if (fragment.data.is_aggregated && Array.isArray(fragment.data.original_events)) {
                const fragmentStart = current;
                const fragmentEnd = splitPoint;

                const newOriginalEvents = fragment.data.original_events.filter(orig => {
                    const origStart = new Date(orig.timestamp);
                    const origEnd = new Date(origStart.getTime() + orig.duration * 1000);
                    return origStart < fragmentEnd && origEnd > fragmentStart;
                });

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
 * Cleans up window event titles based on a set of rules.
 * @param {object} event The event object.
 * @returns {object} The event with a sanitized title.
 */
const simpleSuffixRules = {
    'chrome.exe': ' - Google Chrome',
    'Notepad3.exe': ' - Notepad3',
    'Code.exe': ' - Visual Studio Code'
};

function sanitizeEventTitle(event) {
    if (!event.data || !event.data.title) {
        return event;
    }

    let title = event.data.title;
    const app = event.data.app;

    // Rule 1: Remove leading special characters (●, *) and subsequent spaces.
    title = title.replace(/^[●*]+\s*/, '');

    // Rule 2: App-specific title cleaning
    if (app === 'Code.exe' || app === 'code') {
        // Hardcoded special case for VS Code
        title = title.replace(/\s*\(Working Tree\)\s*\(.*\)/, '');
    }

    // Handle simple suffix removals from the rule set
    const suffix = simpleSuffixRules[app];
    if (suffix) {
        // Escape special characters in suffix for RegExp and remove it from the end of the string
        const escapedSuffix = suffix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        title = title.replace(new RegExp(escapedSuffix + '$'), '');
    }


    // Return a new event object with the sanitized title.
    return {
        ...event,
        data: {
            ...event.data,
            title: title.trim()
        }
    };
}

/**
 * Calculates a summary of activity for a given set of events.
 */
function calculateHourSummary(detailedEvents, taskEvents, notAfkDuration = 0, showAfkInSummary = true) {
    const summary = {};
    const totalActiveDuration = [...detailedEvents, ...taskEvents].reduce((acc, e) => acc + (parseFloat(e.duration) || 0), 0);

    let afkDuration = 0;
    let totalHourDuration = totalActiveDuration;

    if (showAfkInSummary) {
        afkDuration = Math.max(0, 3600 - notAfkDuration);
        totalHourDuration = 3600; // Percentages are based on the full hour.
    }

    if (totalHourDuration === 0) {
        return [];
    }

    for (const event of detailedEvents) {
        const app = event.data.app;
        if (!summary[app]) {
            summary[app] = { name: app, totalDuration: 0, titles: {} };
        }
        summary[app].totalDuration += (parseFloat(event.duration) || 0);
        const title = event.data.title || '[No Title]';
        if (!summary[app].titles[title]) {
            summary[app].titles[title] = 0;
        }
        summary[app].titles[title] += (parseFloat(event.duration) || 0);
    }

    for (const event of taskEvents) {
        const label = event.data.label;
        if (!summary[label]) {
            summary[label] = { name: label, totalDuration: 0, titles: {} };
        }
        summary[label].totalDuration += (parseFloat(event.duration) || 0);
    }

    // Add the calculated AFK time as a summary item if enabled
    if (showAfkInSummary && afkDuration > 0) {
        summary['AFK'] = { name: 'AFK', totalDuration: afkDuration, titles: { 'AFK': afkDuration } };
    }

    const summaryArray = Object.values(summary).map(item => {
        const titlesArray = Object.entries(item.titles)
            .map(([title, duration]) => ({ title, duration }))
            .sort((a, b) => b.duration - a.duration);
        
        return {
            ...item,
            percentage: (item.totalDuration / totalHourDuration) * 100,
            titles: titlesArray
        };
    });

    return summaryArray.sort((a, b) => b.totalDuration - a.totalDuration);
}

/**
 * Main processing function.
 */
function processActivityData(afkEvents, windowEvents, stopwatchEvents, aggregationThreshold, showAfkInSummary) {
    const notAfkIntervals = mergeOverlappingIntervals(
        afkEvents
            .filter(e => e.data.status === 'not-afk')
            .map(e => {
                const start = new Date(e.timestamp);
                const end = new Date(start.getTime() + e.duration * 1000);
                return { start, end };
            })
    );

    let activeWindowEvents = windowEvents.flatMap(event => getActiveFragments(event, notAfkIntervals));
    const activeStopwatchEvents = stopwatchEvents.flatMap(event => getActiveFragments(event, notAfkIntervals));

    // Per user instruction, calculate total not-afk time per hour from the raw source
    const notAfkEvents = afkEvents.filter(e => e.data.status === 'not-afk');
    const hourlySplitNotAfk = notAfkEvents.flatMap(splitEventByHour);
    const hourlyNotAfkDurations = {};
    for (const event of hourlySplitNotAfk) {
        const d = new Date(event.timestamp);
        const hourKey = d.getHours(); // Using hour as key for simplicity within a day
        if (!hourlyNotAfkDurations[hourKey]) {
            hourlyNotAfkDurations[hourKey] = 0;
        }
        hourlyNotAfkDurations[hourKey] += (parseFloat(event.duration) || 0);
    }

    // Sanitize window event titles
    activeWindowEvents = activeWindowEvents.map(sanitizeEventTitle);

    analyzeWindowOverlaps(activeWindowEvents);
    analyzeTaskOverlaps(activeStopwatchEvents);

    const aggregatedWindowEvents = aggregateShortEvents([...activeWindowEvents].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)), aggregationThreshold);

    const hourlySplitDetailed = activeWindowEvents.flatMap(splitEventByHour);
    const hourlySplitAggregated = aggregatedWindowEvents.flatMap(splitEventByHour);
    const hourlySplitStopwatch = activeStopwatchEvents.flatMap(splitEventByHour);

    const time_view = {};

    const ensureHourPath = (path) => {
        let schema = time_view;
        for (let i = 0; i < path.length; i++) {
            const key = path[i];
            if (!schema[key]) {
                if (i === path.length - 1) {
                    schema[key] = { detailed: [], aggregated: [], tasks: [], summary: [] };
                } else {
                    schema[key] = {};
                }
            }
            schema = schema[key];
        }
        return schema;
    };

    for (const event of hourlySplitDetailed) {
        const d = new Date(event.timestamp);
        const path = [d.getFullYear(), d.getMonth() + 1, getWeekNumber(d), d.getDate(), d.getHours()];
        const hourObject = ensureHourPath(path);
        hourObject.detailed.push(event);
    }

    for (const event of hourlySplitAggregated) {
        const d = new Date(event.timestamp);
        const path = [d.getFullYear(), d.getMonth() + 1, getWeekNumber(d), d.getDate(), d.getHours()];
        const hourObject = ensureHourPath(path);
        hourObject.aggregated.push(event);
    }

    for (const event of hourlySplitStopwatch) {
        const d = new Date(event.timestamp);
        const path = [d.getFullYear(), d.getMonth() + 1, getWeekNumber(d), d.getDate(), d.getHours()];
        const hourObject = ensureHourPath(path);
        hourObject.tasks.push(event);
    }

    // Final step: Calculate summaries for each hour
    for (const year in time_view) {
        for (const month in time_view[year]) {
            for (const week in time_view[year][month]) {
                for (const day in time_view[year][month][week]) {
                    for (const hour in time_view[year][month][week][day]) {
                        const hourData = time_view[year][month][week][day][hour];
                        const notAfkDuration = hourlyNotAfkDurations[hour] || 0;
                        hourData.summary = calculateHourSummary(hourData.detailed, hourData.tasks, notAfkDuration, showAfkInSummary);
                    }
                }
            }
        }
    }

    const task_view = {};
    for (const taskEvent of hourlySplitStopwatch) {
        const taskLabel = taskEvent.data.label;
        if (!taskLabel) continue;

        const taskStart = new Date(taskEvent.timestamp);
        const taskEnd = new Date(taskStart.getTime() + taskEvent.duration * 1000);

        for (const windowEvent of hourlySplitDetailed) {
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

    self.postMessage({ time_view, task_view });
}

self.onmessage = function (e) {
    const { afkEvents, windowEvents, stopwatchEvents, aggregationThreshold, showAfkInSummary } = e.data;
    if (!afkEvents || !windowEvents || !stopwatchEvents) {
        console.error("Worker received incomplete data.");
        return;
    }
    processActivityData(afkEvents, windowEvents, stopwatchEvents, aggregationThreshold, showAfkInSummary);
};