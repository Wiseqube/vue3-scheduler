<template>
  <div
    class="vs-scheduler"
    :style="{
      '--identifier-column-width': identifier_column_width,
    }"
  >
    <div class="vs-header-left">
      <slot
        name="header-column-identifier"
        :get_elem_left="getElemLeft"
        :get_elem_width="getElemWidth"
        :start
        :cell_width="cellWidth"
        :scale
      />
    </div>

    <div class="vs-header-right">
      <div
        class="vs-header-right-content"
        :style="{ '--header-scroll-left': `-${scrollLeft}px` }"
      >
        <slot
          name="header-column-timeline"
          :get_elem_left="getElemLeft"
          :get_elem_width="getElemWidth"
          :start
          :cell_width="cellWidth"
          :scale
        />
      </div>
    </div>
    <!-- Headers + Identifers (first column) -->
    <div
      class="vs-first-col"
      :style="{
        gridTemplateColumns: `repeat(${headers.length}, var(--identifier-column-width))`,
      }"
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
          <slot :name="`header-${header}`">
            {{ header }}
          </slot>
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
            v-for="(col, col_index) in identifier"
            :key="col_index"
            class="vs-identifier-cell"
            :style="{
              'min-height': `${rowHeights[index]}px`,
              'max-height': `${rowHeights[index]}px`,
            }"
          >
            <template v-if="isIdentifierObject(col)">
              <slot
                :name="`identifier-${col.header_name}-${col.id}`"
                :contains_overlaps="rowHeights[index] > rowHeight"
              >
                <div class="vs-identifier-cell-label">
                  {{ col.name }}
                </div>
              </slot>
            </template>
            <template v-else>
              <div class="vs-identifier-cell-label">
                {{ col }}
              </div>
            </template>
          </div>
        </div>
      </div>

      <slot
        name="additional-rows"
        :row_height="rowHeight"
      />
    </div>
    <!-- Timeline + Events (second column) -->
    <div
      class="vs-second-col"
      @scroll="onScroll"
    >
      <!-- Timeline -->
      <div class="vs-timeline">
        <slot
          name="timeline-header"
          :get_elem_left="getElemLeft"
          :get_elem_width="getElemWidth"
          :start
          :cell_width="cellWidth"
          :scale
        />
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
          <slot
            name="timeline-cell-content"
            :time
          >
            <span>
              {{ time.formattedDate }}
              {{ time.formattedTime }}
            </span>
          </slot>
        </div>
      </div>

      <!-- Events -->
      <div class="vs-events">
        <!-- events -->
        <slot
          name="timeline-body"
          :get_elem_left="getElemLeft"
          :get_elem_width="getElemWidth"
          :start
          :cell_width="cellWidth"
          :scale
        />
        <Task
          v-for="(event, index) in events"
          :key="index"
          :event="event"
          :row-height="rowHeight"
          :cell-width="cellWidth"
          :scale="scale"
          :start="start"
          :top="getEventTop(event)"
          :drag-resolution-minutes="options?.dragResolutionMinutes ?? 5"
          @resize="eventResized"
          @dragged="eventDragged"
          @activate="eventActivated"
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
                height: `${rowHeights[index]}px`,
                width: `${getElemWidth(span.start, span.end, cellWidth, scale)}px`,
                left: `${getElemLeft(start, span.start, cellWidth, scale)}px`,
                top: `${rowOffsets[index]}px`,
              }"
              @click="timespanClicked(span)"
            >
              <slot
                name="timespan-content"
                :span="span"
              />
            </div>
          </template>
          <div
            v-for="(_time, timeIdx) in getTimeline"
            :key="timeIdx"
            class="vs-timeslot"
            :style="{
              'min-width': `${cellWidth}px`,
              'max-width': `${cellWidth}px`,
              'min-height': `${rowHeights[index]}px`,
              'max-height': `${rowHeights[index]}px`,
            }"
          />
        </div>

        <slot
          name="timeline-body-end"
          :get_elem_left="getElemLeft"
          :get_elem_width="getElemWidth"
          :start
          :cell_width="cellWidth"
          :row_height="rowHeight"
          :scale
          :timeline="getTimeline"
        />

        <!-- Row separators rendered above timespans (z-index: 2) but below events (z-index: 10) -->
        <div
          v-for="(_, index) in identifiers"
          :key="`sep-${index}`"
          class="vs-row-sep"
          :style="{ top: `${rowOffsets[index] + rowHeights[index] - 1}px` }"
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
import { Options, Event, TimeSpan, IdentifierObject } from "../types/VueScheduler";
import { getElemLeft, getElemRow, getElemWidth } from "../util/position";
import { calculateEventLayout } from "../util/eventlayout";

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
      type: Array as PropType<(string | IdentifierObject)[][]>,
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
  emits: [
    "event-activate",
    "timespan-clicked",
  ],
  setup(props, { emit }) {
    const cellWidth = computed(
      () => props.options?.cellWidth || DEFAULT_OPTIONS.cellWidth,
    );
    const rowHeight = computed(
      () => props.options?.rowHeight || DEFAULT_OPTIONS.cellWidth,
    );
    const scale = computed(() => props.options?.scale || 0.5);
    const resolution = computed(() => props.options?.resizeResolution || 15.0);
    const identifier_column_width = computed(() => {
        if (!props.options?.identifier_column_width)  {
          return 'auto';
        }
        return `${props.options?.identifier_column_width}px`;
      }
    );
    const dropzones = ref<Array<Target>>();
    let mostRecentEvent: Event | undefined = undefined;
    const laneMemory = new WeakMap<Event, number>();
    const preferedLanes = new WeakMap<Event, number>();

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
      const origTop = getEventTop(timelineEvent);
      const origRowOffsets = [...rowOffsets.value];

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

      // Calculate the preffered lane base on the position where the user
      // dragged the event
      const relativeTop = origTop - origRowOffsets[timelineEvent.identiferIdx];
      
      const preferredLane = Math.max(
        0,
        Math.round(relativeTop / rowHeight.value),
      );
      mostRecentEvent = timelineEvent;
      preferedLanes.set(mostRecentEvent, preferredLane);
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
      // Get snapshots of orig top position, offset and heights. It is 
      // important that we do this before we modify start/end of the event 
      // because otherwise Vue would rerender and update the values
      const origTop = getEventTop(timelineEvent);
      const origRowOffsets = [...rowOffsets.value];
      const origRowHeights = [...rowHeights.value];

      const rawMinutes = (x / cellWidth.value) * scale.value * 60.0;
      const minutes = Math.round(rawMinutes);
      timelineEvent.start = new Date(
        timelineEvent.start.setMinutes(
          timelineEvent.start.getMinutes() + minutes,
        ),
      );
      timelineEvent.end = new Date(
        timelineEvent.end.setMinutes(timelineEvent.end.getMinutes() + minutes),
      );

      // Use math.round because of floating-point inaccuracy caused by
      // interactjs when dragging. Math.floor may be wrong when the y value
      // is really close to the bigger number. For example the following
      // (actual) y value 49.99998474121094 was rounded to 49 with floor but
      // it should be rounded to 50, so we use Math.round.
      const rawNewTop = origTop + y;
      const newTop = Math.round(rawNewTop / rowHeight.value) * rowHeight.value;

      // fallback in case of floating-point errors
      let newRowIdx = origRowOffsets.length - 1;
      for (let i = 0; i < origRowOffsets.length; i++) {
        // Check in which row offset our new top value is placed
        if (
          newTop >= origRowOffsets[i] && 
          newTop < origRowOffsets[i] + origRowHeights[i]
        ) {
          newRowIdx = i;
          break;
        }
      }

      // Calculate the preffered lane base on the position where the user
      // dragged the event
      const relativeTop = newTop - origRowOffsets[newRowIdx];
      const preferredLane = Math.max(
        0,
        Math.round(relativeTop / rowHeight.value),
      );
      mostRecentEvent = timelineEvent;
      preferedLanes.set(mostRecentEvent, preferredLane);

      timelineEvent.identiferIdx = Math.min(
        Math.max(0, newRowIdx),
        props.identifiers.length - 1,
      );
    }

    function eventActivated(timelineEvent: Event) {
      emit("event-activate", timelineEvent);
    }

    function timespanClicked(timespan: TimeSpan) {
      emit("timespan-clicked", timespan);
    }

    // scrollLeft and onScroll are used to sync the header with the timeline
    // events when scrolling
    const scrollLeft = ref(0)
    function onScroll(e: globalThis.Event) {
      scrollLeft.value = (e.currentTarget as HTMLElement).scrollLeft
    }

    function isIdentifierObject(
      value: string | IdentifierObject
    ): value is IdentifierObject {
      return typeof value === 'object' && value !== null;
    }

    // Event layout calculation
    const eventLayout = computed(
      () => calculateEventLayout(
          props.events,
          laneMemory,
          mostRecentEvent,
          preferedLanes
        )
    );

    // Calculate lane count for each row
    const rowLaneCounts = computed(() => {
      // Each row starts with one lane
      const counts = props.identifiers.map(() => 1);
      // Increase lane count according to calculated event layout
      eventLayout.value.forEach((layout, event) => {
        counts[event.identiferIdx] = Math.max(counts[event.identiferIdx], layout.lane + 1);
      });
      return counts;
    });

    // Calculate height for each row
    const rowHeights = computed(() =>
      rowLaneCounts.value.map((count) => count * rowHeight.value),
    );

    // Caclucatge offset for each row in px
    const rowOffsets = computed(() => {
      const offsets: number[] = [];
      let accumulated_offset = 0;
      rowHeights.value.forEach((height) => {
        offsets.push(accumulated_offset);
        accumulated_offset += height;
      });
      return offsets;
    });

    // Get the top value for an event
    function getEventTop(event: Event): number {
      // Get lane of event
      const lane = eventLayout.value.get(event)?.lane ?? 0;
      // Top value is: row offset + (lane * rowHeight)
      return rowOffsets.value[event.identiferIdx] + (lane * rowHeight.value);
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
      eventActivated,
      dropzones,
      scrollLeft,
      onScroll,
      identifier_column_width,
      isIdentifierObject,
      timespanClicked,
      rowHeights,
      rowOffsets,
      getEventTop,
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
  grid-template-columns: auto minmax(0, 1fr);
  grid-template-rows: auto 1fr;
  height: 100%;
  border-radius: 0.5rem;
  overflow: hidden;
  background-color: #f3f4f6;
  padding: 0.75rem;
  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  font-size: 0.75rem;
  line-height: 1.5;
  grid-template-areas:
    "header-left header-right"
    "left       right";
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
  grid-area: left;
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
  position: relative;
  background-color: #ffffff;
  color: #9ca3af;
  box-shadow: inset 0 -1px 0 0 #e5e7eb;
  transition: min-height 0.2s ease, max-height 0.2s ease;
}

.vs-identifier-cell-label {
  display: flex;
  align-items: center;
  padding: 0.625rem;
  width: 100%;
  height: 100%;
}

.vs-second-col {
  display: flex;
  flex-direction: column;
  overflow: auto;
  border-top-right-radius: 0.5rem;
  border-bottom-right-radius: 0.5rem;
  grid-area: right;
  position: relative;
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
  transition: top 0.2s ease;
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
  pointer-events: none;
  transition: min-height 0.2s ease, max-height 0.2s ease;
}

.vs-timespan {
  position: absolute;
  transition: height 0.2s ease, top 0.2s ease;
}

.vs-header-left {
  grid-area: header-left;
}

.vs-header-right {
  grid-area: header-right;
  overflow: hidden;
  position: relative;
}

.vs-header-right-content {
  width: fit-content;
  transform: translateX(var(--header-scroll-left, 0px));
  will-change: transform;
}

</style>
