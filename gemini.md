# Project Overview

This project is a web-based user interface for ActivityWatch, an open-source automated time tracker. It allows users to analyze their tracked activities and analyze their time usage.

## Main Technologies

*   **Frontend:** svelte
*   **Backend:**  ActivityWatch REST API, OpenAPI (Swagger) 2.0

## Architecture

The application is a single-page application (SPA) that runs entirely in the browser. It communicates with a local ActivityWatch server to fetch and manipulate data. It uses a Web Worker for background data processing to keep the UI responsive.

## Key Files

*   `input/swagger.json`: The OpenAPI (Swagger) 2.0 specification for the ActivityWatch REST API. This is the most important file in the project, as it describes all the available API endpoints, their parameters, and their responses.
*   `app/src/App.svelte`: The main Svelte component that serves as the entry point for the user interface. It orchestrates data fetching and processing.
*   `app/src/lib/apiClient.js`: A module responsible for all communication with the ActivityWatch REST API. It handles fetching events from the server.
*   `app/src/lib/dataProcessor.js`: The core of the application's logic. This module is responsible for processing the raw data from ActivityWatch (filtering, splitting, aggregating) and ensuring data integrity by cleaning and analyzing events for inconsistencies. Its rules are defined in `input/anchor-context.md`.
*   `app/src/lib/dataProcessor.worker.js`: Contains the core data processing logic that runs in a background Web Worker to prevent UI freezes.
*   `app/src/lib/DatePicker.svelte`: A UI component that allows the user to select a date for analysis.
*   `app/src/lib/TimelineView.svelte`: The container for the "Detailed Day View", which organizes hourly blocks and separates events into parallel tracks.
*   `app/src/lib/HourBlock.svelte`: A component that displays a collapsible list of all events within a single hour.
*   `app/src/lib/EventBar.svelte`: A component responsible for the visual representation of a single event on a timeline track.
*   `app/src/main.js`: The entry point for the frontend application, responsible for initializing the Svelte app.
*   `app/package.json`: Lists the project's dependencies and defines scripts for building, developing, and testing.
*   `input/*.json`: Sample data from the ActivityWatch API. These files can be used to understand the structure of the data returned by the API.

... to be countinued

## Usage

... to be countinued

## Building and Running

... to be countinued

## План работ

План работ и задачи по проекту описаны в файле `input/anchor-context.md`. Прогресс по задачам отслеживается в этом же файле. По мере выполнения работ, нужно обновлять как `input/anchor-context.md`, так и поддерживать актуальность информации в текущем документе.
