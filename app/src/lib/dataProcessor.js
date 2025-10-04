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
            fragments.push({
                ...event,
                timestamp: current.toISOString(),
                duration: duration,
            });
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
export function processActivityData(afkEvents, windowEvents, stopwatchEvents) {
    // 1. Generate "not-afk" intervals
    const notAfkIntervals = afkEvents
        .filter(e => e.data.status === 'not-afk')
        .map(e => {
            const start = new Date(e.timestamp);
            const end = new Date(start.getTime() + e.duration * 1000);
            return { start, end };
        });

    // 2. Filter and split events by "not-afk" intervals
    const activeWindowEvents = windowEvents.flatMap(event => getActiveFragments(event, notAfkIntervals));
    const activeStopwatchEvents = stopwatchEvents.flatMap(event => getActiveFragments(event, notAfkIntervals));

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

    console.log("Data processing complete.", { time_view, task_view });

    return { time_view, task_view };
}
