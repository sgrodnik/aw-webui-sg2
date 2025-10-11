<script>
  import HourBlock from './HourBlock.svelte';

  export let timeViewForDay;

  // Helper functions for event filtering
  const getTaskEvents = (events) => events.filter(e => e.data.label);
  const getAggregatedWindowEvents = (events) => events.filter(e => !e.data.label);
  const getDetailedWindowEvents = (events) => events;

  // Helper functions for details view
  function getEventTitle(event) {
    if (event.data.label) {
      return `[ЗАДАЧА] ${event.data.label}`;
    }
    if (event.data.app && event.data.title) {
      return `${event.data.app} - ${event.data.title}`;
    }
    return 'Unknown Event';
  }

  function formatDuration(seconds) {
    if (seconds < 1) return '< 1s';
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  }

  function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }
</script>

<div class="timeline-view">
  {#if Object.keys(timeViewForDay || {}).length === 0}
    <p>Нет данных для отображения за выбранный день.</p>
  {:else}
    {#each Object.entries(timeViewForDay).sort((a, b) => parseInt(a[0]) - parseInt(b[0])) as [hour, hourData] (hour)}
      {@const detailedEvents = getDetailedWindowEvents(hourData.detailed)}
      {@const sortedDetailedEvents = [...detailedEvents].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))}

      <div class="hour-container">
        <div class="timelines-wrapper">
          <HourBlock events={getTaskEvents(hourData.tasks)} />
          <HourBlock events={detailedEvents} />
          <HourBlock events={getAggregatedWindowEvents(hourData.aggregated)} />
        </div>

        {#if sortedDetailedEvents.length > 0}
          <div class="hour-details">
            <details class="details-spoiler">
              <summary>Детали (час: {hour}, {sortedDetailedEvents.length} событий)</summary>
              <ul class="event-list">
                {#each sortedDetailedEvents as event (event.id + event.timestamp)}
                  <li>
                    <span class="event-time">{formatTime(event.timestamp)}</span>
                    <span class="event-title" title={getEventTitle(event)}>{getEventTitle(event)}</span>
                    <span class="event-duration">{formatDuration(event.duration)}</span>
                  </li>
                {/each}
              </ul>
            </details>
          </div>
        {/if}
      </div>
    {/each}
  {/if}
</div>

<style>
  .timeline-view {
    padding: 1rem;
  }
  .hour-container {
    margin-bottom: 1rem; /* Reduced margin */
    padding: 0.5rem; /* Reduced padding */
    background-color: #ffffff;
    border: 1px solid #ccc;
    border-radius: 8px;
    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
  }
  .timelines-wrapper {
    display: flex;
    flex-direction: column;
    gap: 4px; /* Space between timelines */
  }

  /* Details List Styles */
  .hour-details {
    margin-top: 0.5rem; /* Reduced margin */
    padding-top: 0.25rem; /* Reduced padding */
    border-top: 1px solid #f0f0f0;
  }
  .details-spoiler summary {
    cursor: pointer;
    font-weight: bold;
    color: #6c757d;
    font-size: 0.8em;
    padding: 0.1rem;
  }
  .event-list {
    list-style-type: none;
    padding-left: 1rem;
    margin-top: 0.25rem;
  }
  li {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    padding: 0.2rem 0;
    border-bottom: 1px solid #f0f0f0;
    color: #212529;
    font-size: 0.85em;
  }
  li:last-child {
    border-bottom: none;
  }
  .event-time {
    flex-shrink: 0;
    font-family: monospace;
    color: #6c757d;
  }
  .event-title {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex-grow: 1;
  }
  .event-duration {
    flex-shrink: 0;
    font-weight: bold;
    color: #6c757d;
  }
</style>
