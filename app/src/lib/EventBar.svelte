<script>
    import { createEventDispatcher } from 'svelte';
    import { formatDuration } from './timeUtils.js';

    export let event;
    export let track = 'detailed'; // detailed, aggregated, tasks

    const dispatch = createEventDispatcher();

  function formatTitle(event) {
    const titleId = `ID: ${event.id}`;
    const titleDuration = `Длительность: ${formatDuration(event.duration)}`;

    if (event.data.is_aggregated) {
        const dirtyDuration = event.duration;
        const cleanDuration = event.data.cleanDuration;
        const afkDuration = dirtyDuration - cleanDuration;
        const totalEvents = event.data.eventCount;
        const uniqueApps = Object.keys(event.data.apps).length;

        let summary = `Сводка по группе:\n`;
        summary += `• Общее время: ${formatDuration(dirtyDuration)}\n`;
        summary += `• Активность: ${formatDuration(cleanDuration)}\n`;
        if (afkDuration > 1) {
          summary += `• AFK: ${formatDuration(afkDuration)}\n`;
        }
        summary += `• Событий: ${totalEvents} (${uniqueApps} уник.)\n\n`;

        let details = 'Содержимое:\n';
        const sortedApps = Object.entries(event.data.apps).sort((a, b) => b[1] - a[1]);

        for (const [appName, appDuration] of sortedApps) {
            const percentage = cleanDuration > 0 ? ((appDuration / cleanDuration) * 100).toFixed(0) : 0;
            if (percentage > 0) {
              details += `• ${percentage}% ${appName}: ${formatDuration(appDuration)}\n`;
            }
        }

        details += '\nСодержимое (заголовки):\n';

        const groupedByTitle = new Map();
        event.data.original_events.forEach(orig => {
            const key = `${orig.data.app}::${orig.data.title}`;
            if (!groupedByTitle.has(key)) {
                groupedByTitle.set(key, {
                    duration: 0,
                    count: 0,
                    app: orig.data.app,
                    title: orig.data.title
                });
            }
            const group = groupedByTitle.get(key);
            group.duration += orig.duration;
            group.count += 1;
        });

        const sortedGroups = Array.from(groupedByTitle.values())
            .sort((a, b) => b.duration - a.duration);

        sortedGroups.forEach(group => {
            const percentage = cleanDuration > 0 ? ((group.duration / cleanDuration) * 100).toFixed(0) : 0;
            if (percentage > 0) {
                const title = (group.title || '[no title]').substring(0, 70);
                const countStr = group.count > 1 ? ` (${group.count} событий)` : '';
                details += `• ${percentage}% (${formatDuration(group.duration)}): ${group.app} - ${title}${countStr}\n`;
            }
        });

        return summary + details;

    } else if (event.data.label) { // Task Event
        return `[ЗАДАЧА] ${event.data.label}\n${titleDuration}\n${titleId}`;
    } else { // Single Window Event
        return `Приложение: ${event.data.app}\nЗаголовок: ${event.data.title}\n${titleDuration}\n${titleId}`;
    }
  }

  function getEventPosition(event) {
    const start = new Date(event.timestamp);
    const startSecondsInHour = start.getMinutes() * 60 + start.getSeconds();
    const left = (startSecondsInHour / 3600) * 100;
    const width = (event.duration / 3600) * 100;
    return `left: ${left}%; width: ${width}%;`;
  }
</script>

<div
  class="event-bar"
  class:aggregated={event.data.is_aggregated}
  style={getEventPosition(event)}
  title={formatTitle(event)}
></div>

<style>
  .event-bar {
    position: absolute;
    height: 100%;
    background-color: #4db6ac; /* A pleasant color from the user's themes (mint) */
    border-radius: 3px;
    opacity: 0.8;
    cursor: pointer;
    transition: opacity 0.2s ease;
    box-sizing: border-box;
  }
  .event-bar:hover {
    opacity: 1;
    border: 1px solid rgba(0,0,0,0.5);
  }

  /* Style for aggregated meta-events */
  .event-bar.aggregated {
    background-color: #bdbdbd; /* Neutral grey color */
  }
</style>