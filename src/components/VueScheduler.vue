<template>
  <div
    class="vs-scheduler"
    style="grid-template-areas: 'grid1 grid2 grid2 grid2 grid2 '"
  >
    <!-- Headers + Identifers (first column) -->
    <div
      class="vs-first-col"
      :style="{ gridTemplateColumns: `repeat(${headers.length}, auto)` }"
    >
      <!-- Headers -->
      <div class="vs-headers">
        <div
          v-for="(header, index) in headers"
          :key="index"
          class="vs-header-cell"
          :style="{
            'min-height': `${rowHeight}px`,
            'max-height': `${rowHeight}px`,
          }"
        >
          {{ header }}
        </div>
      </div>
      <!-- Identifiers -->
      <div class="vs-identifiers">
        <div
          v-for="(identifier, index) in identifiers"
          :key="index"
          class="vs-identifier-row"
        >
          <div
            v-for="col in identifier"
            :key="col"
            class="vs-identifier-cell"
            :style="{
              'min-height': `${rowHeight}px`,
              'max-height': `${rowHeight}px`,
            }"
          >
            {{ col }}
          </div>
        </div>
      </div>
    </div>
    <!-- Timeline + Events (second column) -->
    <div class="vs-second-col">
      <!-- Timeline -->
      <div class="vs-timeline">
        <div
          v-for="time in getTimeline"
          :key="time.id"
          class="vs-timeline-cell"
          :style="{
            'min-width': `${cellWidth}px`,
            'max-width': `${cellWidth}px`,
            'min-height': `${rowHeight}px`,
            'max-height': `${rowHeight}px`,
          }"
        >
          <span>
            {{ time.formattedDate }}
            {{ time.formattedTime }}
          </span>
        </div>
      </div>
      <!-- Events -->
      <div class="vs-events">
        <!-- events -->
        <Task
          v-for="(event, index) in events"
          :key="index"
          :event="event"
          :row-height="rowHeight"
          :cell-width="cellWidth"
          :scale="scale"
          :start="start"
          @resize="eventResized"
          @dragged="eventDragged"
        >
          <template #event="slotData">
            <slot
              name="event"
              v-bind="slotData"
            />
          </template>
        </Task>
        <!-- Empty event grid -->
        <div
          v-for="(_row, index) in identifiers"
          :key="index"
          ref="dropzones"
          class="dropzone"
        >
          <!-- Timespans underneath the event grid -->
          <template
            v-for="(span, spanIdx) in spans"
            :key="spanIdx"
          >
            <div
              v-if="!span.timelines || span.timelines.includes(index)"
              :class="['vs-timespan', span.color]"
              :style="{
                height: `${rowHeight}px`,
                width: `${getElemWidth(span.start, span.end, cellWidth, scale)}px`,
                left: `${getElemLeft(start, span.start, cellWidth, scale)}px`,
                top: `${index * rowHeight}px`,
              }"
            />
          </template>
          <div
            v-for="(_time, timeIdx) in getTimeline"
            :key="timeIdx"
            class="vs-timeslot"
            :style="{
              'min-width': `${cellWidth}px`,
              'max-width': `${cellWidth}px`,
              'min-height': `${rowHeight}px`,
              'max-height': `${rowHeight}px`,
            }"
          />
        </div>
        <!-- Row separators rendered above timespans (z-index: 2) but below events (z-index: 10) -->
        <div
          v-for="(_, index) in identifiers"
          :key="`sep-${index}`"
          class="vs-row-sep"
          :style="{ top: `${(index + 1) * rowHeight - 1}px` }"
        />
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import { computed, defineComponent, PropType, ref, watchEffect } from "vue";
import { Target, ResizeEvent } from "@interactjs/types";
import interact from "interactjs";
import { format } from "date-fns";
import Task from "./Task.vue";
import { Options, Event, TimeSpan } from "../types/VueScheduler";
import { getElemLeft, getElemRow, getElemWidth } from "../util/position";

const DEFAULT_OPTIONS: Options = {
  cellWidth: 100,
  rowHeight: 50,
  timeFormat: "HH:mm",
  dateFormat: "yyyy-MM-dd",
};

export default defineComponent({
  name: "VueScheduler",
  components: { Task },
  props: {
    end: {
      type: Date,
      required: true,
    },
    events: {
      type: Array as PropType<Event[]>,
      required: true,
    },
    headers: {
      type: Array,
      required: true,
    },
    identifiers: {
      type: Array,
      required: true,
    },
    options: {
      type: Object as PropType<Options>,
      required: false,
      default: DEFAULT_OPTIONS,
    },
    start: {
      type: Date,
      required: true,
    },
    spans: {
      type: Array<TimeSpan>,
      required: false,
      default: [],
    },
  },
  setup(props) {
    const cellWidth = computed(
      () => props.options?.cellWidth || DEFAULT_OPTIONS.cellWidth,
    );
    const rowHeight = computed(
      () => props.options?.rowHeight || DEFAULT_OPTIONS.cellWidth,
    );
    const scale = computed(() => props.options?.scale || 0.5);
    const resolution = computed(() => props.options?.resizeResolution || 15.0);
    const dropzones = ref<Array<Target>>();

    function generateTimeline() {
      const timeSlots = [];
      const start = new Date(props.start);
      const end = new Date(props.end);
      const scaleInMinutes = scale.value * 60;

      for (
        let i = start;
        i < end;
        i.setMinutes(i.getMinutes() + scaleInMinutes)
      ) {
        timeSlots.push({
          id: i.getTime(),
          date: i,
          formattedDate: format(
            i,
            props.options?.dateFormat || DEFAULT_OPTIONS.dateFormat,
          ),
          formattedTime: format(
            i,
            props.options?.timeFormat || DEFAULT_OPTIONS.timeFormat,
          ),
        });
      }

      return timeSlots;
    }

    const getTimeline = computed(() => generateTimeline());

    function eventResized({
      event,
      timelineEvent,
    }: {
      event: ResizeEvent;
      timelineEvent: Event;
    }) {
      const width = event.rect.width;
      let minutes = Math.round((width / cellWidth.value) * scale.value * 60.0);

      const distance = minutes % resolution.value;
      if (distance > resolution.value / 2) {
        minutes += resolution.value - distance;
      } else {
        minutes -= distance;
      }
      if (minutes < resolution.value) {
        minutes = resolution.value;
      }

      const startDateObject = timelineEvent.start;
      const endDateObject = new Date(
        new Date(startDateObject).setMinutes(
          startDateObject.getMinutes() + minutes,
        ),
      );
      timelineEvent.end = endDateObject;
    }

    function eventDragged({
      x,
      y,
      timelineEvent,
    }: {
      x: number;
      y: number;
      timelineEvent: Event;
    }) {
      const minutes = (x / cellWidth.value) * scale.value * 60.0;
      timelineEvent.start = new Date(
        timelineEvent.start.setMinutes(
          timelineEvent.start.getMinutes() + minutes,
        ),
      );
      timelineEvent.end = new Date(
        timelineEvent.end.setMinutes(timelineEvent.end.getMinutes() + minutes),
      );

      const newIx =
        timelineEvent.identiferIdx + Math.floor(y / rowHeight.value);
      timelineEvent.identiferIdx = Math.min(
        Math.max(0, newIx),
        props.identifiers.length,
      );
    }

    watchEffect((onCleanup) => {
      const zones = dropzones.value;
      if (!zones?.length) return;

      zones.forEach((value) =>
        interact(value)
          .dropzone({
            checker: function (
              _dragEvent,
              _event,
              dropped,
              dropzone,
              dropElement,
              draggable,
              draggableElement,
            ) {
              const rect = dropzone.getRect(dropElement);
              const dragRect = draggable.getRect(draggableElement);
              if (dragRect && rect) {
                const cx = dragRect.left + rect.width / 2;
                const cy = dragRect.top + dragRect.height / 2;
                dropped =
                  cx >= rect.left &&
                  cx <= rect.right &&
                  cy >= rect.top &&
                  cy <= rect.bottom;
              }
              return dropped;
            },
            ondrop: function (event) {
              const draggableElement = event.relatedTarget;
              const dropzoneElement = event.target;
              dropzoneElement.classList.remove("drop-target");
              draggableElement?.classList.remove("-drop-possible");
            },
            ondragenter: function (event) {
              const draggableElement = event.relatedTarget;
              const dropzoneElement = event.target;
              dropzoneElement.classList.add("drop-target");
              draggableElement?.classList.add("-drop-possible");
            },
            ondragleave: function (event) {
              const draggableElement = event.relatedTarget;
              const dropzoneElement = event.target;
              dropzoneElement.classList.remove("drop-target");
              draggableElement?.classList.remove("-drop-possible");
            },
          })
          .on("dropactivate", function (event) {
            event.target.classList.add("drop-activated");
          }),
        );

        onCleanup(() => {
          zones.forEach(el => {
            interact(el).unset();
          });
        });
      }
    );

    return {
      cellWidth,
      rowHeight,
      getTimeline,
      getElemWidth,
      getElemLeft,
      getElemRow,
      scale,
      eventResized,
      eventDragged,
      dropzones,
    };
  },
});
</script>
<style scoped>
.vs-scheduler *,
.vs-scheduler *::before,
.vs-scheduler *::after {
  box-sizing: border-box;
}

.vs-scheduler {
  display: grid;
  grid-template-columns: auto 1fr;
  height: 100%;
  border-radius: 0.5rem;
  overflow: hidden;
  overscroll-behavior: none;
  background-color: #f3f4f6;
  padding: 0.75rem;
  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  font-size: 0.75rem;
  line-height: 1.5;
}

.vs-first-col {
  display: grid;
  column-gap: 1px;
  align-content: start;
  border-right: 1px solid #e5e7eb;
  border-top-left-radius: 0.5rem;
  border-bottom-left-radius: 0.5rem;
  background-color: #d1d5db;
  margin-right: 1px;
  overflow: hidden;
  min-width: fit-content;
}

.vs-headers {
  display: contents;
}

.vs-header-cell {
  display: flex;
  align-items: center;
  position: relative;
  padding: 0.625rem;
  color: #f3f4f6;
  background-color: #64748b;
  box-shadow: inset 0 -1px 0 0 #e5e7eb;
}

.vs-identifiers {
  display: contents;
}

.vs-identifier-row {
  display: contents;
}

.vs-identifier-cell {
  display: flex;
  align-items: center;
  position: relative;
  padding: 0.625rem;
  background-color: #ffffff;
  color: #9ca3af;
  box-shadow: inset 0 -1px 0 0 #e5e7eb;
}

.vs-second-col {
  display: flex;
  flex-direction: column;
  overflow: auto;
  border-top-right-radius: 0.5rem;
  border-bottom-right-radius: 0.5rem;
}

.vs-timeline {
  display: flex;
  box-shadow: inset 0 -1px 0 0 #e5e7eb;
}

.vs-timeline-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;
  padding: 0.625rem;
  border-right: 1px solid #e5e7eb;
  background-color: #64748b;
  color: #f3f4f6;
  text-align: center;
}

.vs-events {
  width: fit-content;
  contain: paint;
}

.dropzone {
  display: flex;
}

.vs-row-sep {
  position: absolute;
  left: 0;
  right: 0;
  height: 1px;
  background-color: #e5e7eb;
  z-index: 2;
  pointer-events: none;
}

.dropzone.drop-target {
  background-color: rgb(213, 250, 213);
}

.dropzone.drop-target .vs-timespan {
  filter: saturate(0.75);
}

.vs-timeslot {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  padding: 0.625rem;
  border-right: 1px solid #e5e7eb;
  color: #ffffff;
}

.vs-timespan {
  position: absolute;
}
</style>
