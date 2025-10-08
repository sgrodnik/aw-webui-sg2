<script>
  export let allEvents;

  let sortedEvents = [];
  // Reactive statement to sort events chronologically whenever the `allEvents` prop changes.
  $: {
    if (allEvents) {
      sortedEvents = [...allEvents].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    }
  }

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

<div class="hour-details">
  {#if sortedEvents.length > 0}
    <details class="details-spoiler">
      <summary>Детали ({sortedEvents.length} событий)</summary>
      <ul class="event-list">
        {#each sortedEvents as event (event.id + event.timestamp)}
          <li>
            <span class="event-time">{formatTime(event.timestamp)}</span>
            <span class="event-title" title={getEventTitle(event)}>{getEventTitle(event)}</span>
            <span class="event-duration">{formatDuration(event.duration)}</span>
          </li>
        {/each}
      </ul>
    </details>
  {:else}
    <p class="no-activity">(Нет активности)</p>
  {/if}
</div>

<style>
  .hour-details {
    margin-top: 1rem;
  }
  .no-activity {
    color: #6c757d; /* --color-text-muted */
    font-style: italic;
  }

  /* Spoiler and List styles */
  .details-spoiler {
    margin-top: 1rem;
  }
  .details-spoiler summary {
    cursor: pointer;
    font-weight: bold;
    color: #6c757d; /* --color-text-muted */
    font-size: 0.9em;
  }
  .event-list {
    list-style-type: none;
    padding-left: 0;
    margin-top: 0.5rem;
  }
  li {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    padding: 0.5rem 0;
    border-bottom: 1px solid #f0f0f0; /* A lighter separator */
    color: #212529; /* --color-text */
  }
  li:last-child {
    border-bottom: none;
  }
  .event-time {
    flex-shrink: 0;
    font-family: monospace;
    font-size: 0.9em;
    color: #6c757d; /* --color-text-muted */
  }
  .event-title {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex-grow: 1;
    font-size: 0.9em;
  }
  .event-duration {
    flex-shrink: 0;
    font-weight: bold;
    color: #6c757d; /* --color-text-muted */
    font-size: 0.9em;
  }
</style>