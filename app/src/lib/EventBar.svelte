
<script>
  export let event;

  function getEventTitle(event) {
    // For aggregated meta-events, the title is pre-generated.
    if (event.data.is_aggregated) {
      return event.data.title;
    }
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
  title={`[ID: ${event.id}] ${getEventTitle(event)} (${formatDuration(event.duration)})`}
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
