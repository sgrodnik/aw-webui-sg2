<script>
  import EventBar from './EventBar.svelte';
  export let events;
  export let title;

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
</script>

<div class="hour-block">
  <h4 class="track-title">{title}</h4>
  <div class="timeline-track">
    {#if events && events.length > 0}
      {#each events as event (event.id + event.timestamp)} 
        <EventBar {event} />
      {/each}
    {:else}
      <p class="no-activity-track">(Нет активности)</p>
    {/if}
  </div>

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
    {/if}
  </div>
</div>

<style>
  .hour-block {
    margin-bottom: 1rem;
  }
  .track-title {
    font-size: 0.9em;
    color: #6c757d;
    margin-bottom: 0.25rem;
    font-weight: normal;
  }
  .timeline-track {
    position: relative;
    width: 100%;
    height: 20px; 
    background-color: #f0f0f0;
    border-radius: 4px;
    border: 1px solid #e0e0e0;
  }
  .no-activity-track {
    position: absolute;
    left: 0.5rem;
    top: 50%;
    transform: translateY(-50%);
    color: #9e9e9e;
    font-style: italic;
    font-size: 0.8em;
    margin: 0;
  }

  /* Details List Styles */
  .hour-details {
    margin-top: 0.5rem;
  }
  .details-spoiler summary {
    cursor: pointer;
    font-weight: bold;
    color: #6c757d;
    font-size: 0.8em;
    padding: 0.25rem;
  }
  .event-list {
    list-style-type: none;
    padding-left: 1rem;
    margin-top: 0.5rem;
  }
  li {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    padding: 0.25rem 0;
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
