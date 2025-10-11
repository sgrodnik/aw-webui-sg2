<script>
  import { formatDuration } from './timeUtils.js';
  import { highlightedIdentifier as highlightStore } from './highlightStore.js';

  export let data; // Expected format: [{ name/title, duration, percentage, sdbmId }]

  let sortedData = [];

  $: {
    sortedData = [...data].sort((a, b) => b.duration - a.duration);
  }

  function handleMouseover(sdbmId) {
    if (sdbmId === -1) return; // Do not highlight AFK
    highlightStore.set(sdbmId);
  }

  function handleMouseout() {
    highlightStore.set(null);
  }
</script>

<div class="stacked-bar-chart">
  <div class="bar-container">
    {#each sortedData as item, i}
      {@const isHighlighted = $highlightStore === item.sdbmId}
      {@const isDimmed = $highlightStore !== null && !isHighlighted}
      <div
        class="bar-segment"
        style="width: {item.percentage}%; opacity: {isDimmed ? 0.3 : 1};"
        title="{item.name || item.title}: {formatDuration(item.duration)}"
        on:mouseenter={() => handleMouseover(item.sdbmId)}
        on:mouseleave={handleMouseout}
      >
        <span class="segment-label">
          {item.name || item.title} ({formatDuration(item.duration)})
        </span>
      </div>
    {/each}
  </div>
</div>

<style>
  .stacked-bar-chart {
    width: 100%;
  }
  .bar-container {
    display: flex;
    width: 100%;
    height: 18px; 
    background-color: #f0f0f0;
    border: 1px solid #e0e0e0;
    border-radius: 3px;
    overflow: hidden;
  }
  .bar-segment {
    height: 100%;
    /* background-color is removed */
    border-right: 1px solid #d0d0d0; /* Darker separator */
    box-sizing: border-box;
    position: relative;
    overflow: hidden;
    white-space: nowrap;
    transition: opacity 0.2s ease-in-out;
  }
  .bar-segment:last-child {
    border-right: none;
  }
  .segment-label {
    display: block;
    padding: 0 0.5em;
    font-size: 12px;
    line-height: 18px; /* Match container height */
    color: #333;
  }
</style>
