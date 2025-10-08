<script>
  export let hour;
  export let events;

  let sortedEvents = [];
  // Reactive statement to sort events chronologically whenever the `events` prop changes.
  $: {
    if (events) {
      sortedEvents = [...events].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
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

  function getEventPosition(event) {
    const start = new Date(event.timestamp);
    const startSecondsInHour = start.getMinutes() * 60 + start.getSeconds();
    const left = (startSecondsInHour / 3600) * 100;
    const width = (event.duration / 3600) * 100;
    return `left: ${left}%; width: ${width}%;`;
  }
</script>

<div class="hour-block">
  <h3>Час: {hour}</h3>

  {#if sortedEvents.length > 0}
    <div class="timeline-container">
      {#each sortedEvents as event (event.id + event.timestamp)}
        <div
          class="event-bar"
          style={getEventPosition(event)}
          title={`${getEventTitle(event)} (${formatDuration(event.duration)})`}
        ></div>
      {/each}
    </div>

    <details class="details-spoiler">
      <summary>Детали</summary>
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
  /* Inspired by style.css from the user's reference project */
  .hour-block {
    background-color: #ffffff; /* --color-card-bg */
    border: 1px solid #ccc;    /* --color-border */
    border-radius: 8px;
    box-shadow: 0 4px 8px rgba(0,0,0,0.1); /* --color-shadow */
    padding: 15px;
    margin-bottom: 1.5rem;
  }
  h3 {
    margin-top: 0;
    font-size: 1.2em;
    border-bottom: 1px solid #eee; /* --color-header-border */
    padding-bottom: 10px;
    margin-bottom: 10px;
    color: #212529; /* --color-text */
  }
  .no-activity {
    color: #6c757d; /* --color-text-muted */
    font-style: italic;
  }

  /* Timeline styles */
  .timeline-container {
    position: relative;
    height: 20px;
    background-color: #f0f0f0; /* --color-bg */
    border-radius: 4px;
    margin-top: 10px;
    width: 100%;
  }
  .event-bar {
    position: absolute;
    height: 100%;
    background-color: #4db6ac; /* A pleasant color from the user's themes (mint) */
    border-radius: 3px;
    opacity: 0.8;
    cursor: pointer;
    transition: opacity 0.2s ease;
  }
  .event-bar:hover {
    opacity: 1;
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