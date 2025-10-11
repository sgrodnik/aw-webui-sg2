import { writable } from 'svelte/store';

// Stores the identifier of the event being hovered.
export const highlightedIdentifier = writable(null);
