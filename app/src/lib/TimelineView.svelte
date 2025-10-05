<script>
  import HourBlock from './HourBlock.svelte';

  export let data;

  let timeViewForDay = null;

  // Reactive statement to find the first available day's data
  $: {
    timeViewForDay = null;

    if (data) {
      // Find the first available day's data
      const years = Object.keys(data.time_view || {});
      if (years.length > 0) {
        const year = years[0];
        const months = Object.keys(data.time_view[year]);
        if (months.length > 0) {
          const month = months[0];
          const weeks = Object.keys(data.time_view[year][month]);
          if (weeks.length > 0) {
            const week = weeks[0];
            const days = Object.keys(data.time_view[year][month][week]);
            if (days.length > 0) {
              const day = days[0];
              timeViewForDay = data.time_view[year][month][week][day];
            }
          }
        }
      }
    }
  }
</script>

<div class="timeline-container">
  <h2>Детальный вид дня</h2>

  {#if timeViewForDay}
    {#each Object.entries(timeViewForDay) as [hour, events] (hour)}
      <HourBlock {hour} {events} />
    {/each}
  {:else}
    <p>Нет почасовых данных для отображения.</p>
  {/if}
</div>

<style>
  .timeline-container {
    margin-top: 1rem;
  }
</style>
