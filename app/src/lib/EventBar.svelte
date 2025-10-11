<script>
      import { createEventDispatcher } from 'svelte';
      import { formatDuration } from './timeUtils.js';
      import { highlightedIdentifier } from './highlightStore.js';
      import { appAliases } from './appAliases.js';
    export let event;
    export let track = 'detailed'; // detailed, aggregated, tasks

    const dispatch = createEventDispatcher();

    function handleMouseover() {
        highlightedIdentifier.set(event.sdbmId);
    }

    function handleMouseout() {
        highlightedIdentifier.set(null);
    }

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

  function getEventLabel(event) {
    if (event.data.is_aggregated) {
      return `${event.data.eventCount} events`;
    }
    if (event.data.label) { // Task Event
      return event.data.label;
    }
    if (event.data.title) {
        const appName = event.data.app;
        const alias = appAliases[appName];
        if (alias) {
            return `${alias}`;
        }
        return event.data.title;
    }
    return '';
  }
</script>

<div
  class="event-bar"
  class:aggregated={event.data.is_aggregated}
  style={getEventPosition(event)}
  style:--highlight-opacity={$highlightedIdentifier === event.sdbmId ? 1 : 0.8}
  style:--highlight-border-color={$highlightedIdentifier === event.sdbmId ? 'rgba(0,0,0,0.3)' : 'rgba(220,220,220,0.5)'}
  title={formatTitle(event)}
  on:mouseover={handleMouseover}
  on:mouseout={handleMouseout}
>
  <span class="event-label">{getEventLabel(event)}</span>
</div>

<style>
  .event-bar {
    position: absolute;
    height: 100%;
    background-color: #f4f4f4;
    border-radius: 3px;
    opacity: var(--highlight-opacity, 0.8);
    cursor: pointer;
    box-sizing: border-box;
    border: 1px solid var(--highlight-border-color, transparent);
    overflow: hidden;
    white-space: nowrap;
  }
  .event-label {
    display: block;
    padding: 0 0.5em;
    font-size: 12px;
    line-height: 20px; /* Match parent height */
    color: #333;
  }
  .event-bar:hover {
    opacity: 1;
    border-color: rgba(0,0,0,0.5);
    transition: none; /* Apply instantly and override the main transition */
  }

  /* Style for aggregated meta-events */
  .event-bar.aggregated {
    background-color: #bdbdbd; /* Neutral grey color */
  }
</style>