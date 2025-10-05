<script>
  export let hour;
  export let events;

  function getEventTitle(event) {
    // Stopwatch events have 'label'
    if (event.data.label) {
      return `[ЗАДАЧА] ${event.data.label}`;
    }
    // Window events have 'app' and 'title'
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
</script>

<div class="hour-block">
  <h3>Час: {hour}</h3>
  
  {#if events.length > 0}
    <ul class="event-list">
      {#each events as event (event.id + event.timestamp)}
        <li>
          <span class="event-title" title={getEventTitle(event)}>{getEventTitle(event)}</span>
          <span class="event-duration">{formatDuration(event.duration)}</span>
        </li>
      {/each}
    </ul>
  {:else}
    <p>(Нет активности)</p>
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
  .event-list {
    list-style-type: none;
    padding-left: 0;
  }
  li {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0;
    border-bottom: 1px solid #f0f0f0; /* A lighter separator */
    color: #212529; /* --color-text */
  }
  li:last-child {
    border-bottom: none;
  }
  .event-title {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-right: 1rem;
    font-size: 0.9em;
  }
  .event-duration {
    flex-shrink: 0;
    font-weight: bold;
    color: #6c757d; /* --color-text-muted */
    font-size: 0.9em;
  }
</style>