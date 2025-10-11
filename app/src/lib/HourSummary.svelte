<script>
    export let summary = [];
    import { formatDuration } from './timeUtils.js'; // Assuming a time formatting utility

    function formatPercent(p) {
        return p.toFixed(1) + '%';
    }
</script>

<div class="hour-summary">
    <h4>Hour Summary</h4>
    {#if summary.length > 0}
        <ul>
            {#each summary as item}
                <li>
                    <div class="app-line">
                        <span class="app-name">{item.name}</span>
                        <span class="app-duration">{formatDuration(item.totalDuration)}</span>
                        <span class="app-percent">({formatPercent(item.percentage)})</span>
                    </div>
                    {#if item.titles && item.titles.length > 0}
                        <ul class="title-list">
                            {#each item.titles as titleItem}
                                <li>
                                    <div class="title-line">
                                        <span class="title-name">{titleItem.title || '[No Title]'}</span>
                                        <span class="title-duration">{formatDuration(titleItem.duration)}</span>
                                    </div>
                                </li>
                            {/each}
                        </ul>
                    {/if}
                </li>
            {/each}
        </ul>
    {:else}
        <p>No activity to summarize for this hour.</p>
    {/if}
</div>

<style>
    .hour-summary {
        font-family: monospace;
        padding: 10px;
        border-bottom: 1px solid #444;
        margin-bottom: 10px;
    }
    h4 {
        margin-top: 0;
        font-size: 1em;
        font-weight: bold;
    }
    ul {
        list-style: none;
        padding-left: 0;
    }
    .app-line, .title-line {
        display: flex;
        justify-content: space-between;
    }
    .app-line {
        font-weight: bold;
    }
    .title-list {
        padding-left: 20px;
        font-size: 0.9em;
        color: #ccc;
    }
    .title-name {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 70%;
    }
</style>
