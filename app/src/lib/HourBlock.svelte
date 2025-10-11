<script>
  import EventBar from './EventBar.svelte';
  export let events;
</script>

<div class="timeline-track">
  {#if events && events.length > 0}
    {#each events as event (event.id + event.timestamp)} 
      <EventBar {event} />
    {/each}
  {:else}
    <p class="no-activity-track">(Нет активности)</p>
  {/if}
</div>

<style>
  .timeline-track {
    position: relative;
    width: 100%;
    height: 20px; 
    border-radius: 4px;
    border: 1px solid #e0e0e0;
    flex-grow: 1; /* Allow track to fill space */
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
</style>