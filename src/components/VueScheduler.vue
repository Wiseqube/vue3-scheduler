<template>
  <div
    id="vue3-scheduler"
    class="grid h-full rounded-lg overflow-hidden overscroll-none bg-gray-100 p-3"
    style="grid-template-areas: 'grid1 grid2 grid2 grid2 grid2 '"
  >
    <!-- Headers + Identifers (first column) -->
    <div
      id="first-column"
      class="w-[250px] border-r rounded-l-lg bg-gray-300 mr-px overflow-hidden overscroll-noner"
    >
      <!-- Headers -->
      <div id="headers" class="flex border-b">
        <div
          v-for="(header, index) in headers"
          :key="index"
          class="grid w-full text-left items-center relative p-2.5 mr-px text-xs text-gray-100 bg-slate-500"
          :style="{
            'min-width': `${cellWidth}px`,
            'min-height': `${rowHeight}px`,
            'max-height': `${rowHeight}px`,
          }"
        >
          {{ header }}
        </div>
      </div>
      <!-- Identifiers -->
      <div id="identifiers" class="relative">
        <div
          v-for="(identifier, index) in identifiers"
          :key="index"
          class="flex flex-row w-full"
        >
          <div
            v-for="col in identifier"
            :key="col"
            class="grid w-full text-left relative border-b p-2.5 mr-px bg-white text-xs text-gray-400 leading-10 text-medium"
            :style="{
              'min-width': `${cellWidth}px`,
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
    <div
      @wheel="onWheel"
      id="second-column"
      class="flex flex-col overflow-auto rounded-r-lg"
    >
      <!-- Timeline -->
      <div id="timeline" class="flex border-b">
        <div
          v-for="time in getTimeline"
          :key="time.id"
          class="overflow-hidden text-center items-center relative p-2.5 border-r bg-slate-500 text-xs text-gray-100"
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
      <div id="events" class="relative">
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
          <template v-slot:event="slotData"
            ><slot name="event" v-bind="slotData"></slot
          ></template>
        </Task>
        <!-- Empty event grid -->
        <div
          v-for="(_row, index) in identifiers"
          :key="index"
          class="flex dropzone"
          ref="dropzones"
        >
          <div
            v-for="(_time, timeIdx) in getTimeline"
            :key="timeIdx"
            class="timeslot text-center relative p-2.5 border-b border-gray-20 border-r text-xs text-white leading-10 text-medium"
            :style="{
              'min-width': `${cellWidth}px`,
              'max-width': `${cellWidth}px`,
              'min-height': `${rowHeight}px`,
              'max-height': `${rowHeight}px`,
            }"
          />
        </div>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import { computed, defineComponent, onMounted, PropType, ref } from "vue";
import { Target, ResizeEvent } from "@interactjs/types";
import interact from "interactjs";
import Task from "./Task.vue";

interface Event {
  identiferIdx: number;
  start: Date;
  end: Date;
  meta?: {
    class?: string;
    description?: string;
    title?: string;
  };
}

interface Options {
  cellWidth: number;
  rowHeight: number;
  scaleUnit: string;
  scaleCustom?: number;
  scrollSpeed: number;
  timeFormat: string;
}

const DEFAULT_OPTIONS: Options = {
  cellWidth: 100,
  rowHeight: 50,
  scaleUnit: "minutes",
  scrollSpeed: 5,
  timeFormat: "HH:mm",
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
    },
    start: {
      type: Date,
      required: true,
    },
  },
  setup(props) {
    const cellWidth = ref(
      props.options?.cellWidth || DEFAULT_OPTIONS.cellWidth
    );
    const rowHeight = ref(
      props.options?.rowHeight || DEFAULT_OPTIONS.rowHeight
    );
    const scale = ref(0.5);
    const scaleIngrement = ref(props.options?.scaleCustom || 0.5);
    const scrollDown = ref(0);
    const scrollUp = ref(0);
    const dropzones = ref<Array<Target>>();

    /**
     * Generate the timeline based on the scale
     * @param scale
     * @returns {Array} Array of strings representing the time slots
     */
    function generateTimeline() {
      const timeSlots = [];
      const start = new Date(props.start);
      const end = new Date(props.end);

      // convert scale from decimal to minutes
      const scaleInMinutes = scale.value * 60;

      for (
        let i = start;
        i < end;
        i.setMinutes(i.getMinutes() + scaleInMinutes)
      ) {
        timeSlots.push({
          id: i.getTime(),
          date: i,
          // formattedTime: i.toLocaleTimeString(),
          // hh:mm am/pm
          formattedDate: `${i.getDate()}/${i.getMonth() + 1}`,
          formattedTime: i.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
          }),
        });
      }

      return timeSlots;
    }

    /**
     * Get the timeline
     */
    const getTimeline = computed(() => generateTimeline());

    /**
     * Get event width
     * @param start
     * @param end
     * @returns {number} Width of the event
     */
    function getEventWidth(start: Date, end: Date) {
      const duration = (end.getTime() - start.getTime()) / 60000;
      if (!cellWidth.value) return 0;

      return (duration / 60 / scale.value) * cellWidth.value;
    }

    /**
     * Get event left
     * @param start
     * @returns {number} Left position of the event
     */
    function getEventLeft(eventStart: Date) {
      if (!cellWidth.value) return 0;
      const start = new Date(props.start);
      const timeDifference = (eventStart.getTime() - start.getTime()) / 60000;
      const left = (timeDifference / 60 / scale.value) * cellWidth.value;
      return left;
    }

    /**
     * Get event row
     * @param identiferIdx
     * @returns {number} Top position of the event
     */
    function getEventRow(identiferIdx: number) {
      return identiferIdx * rowHeight.value;
    }

    function eventResized({
      event,
      timelineEvent,
    }: {
      event: ResizeEvent;
      timelineEvent: Event;
    }) {
      const resolution = 15.0;
      const width = event.rect.width;
      let minutes = Math.round((width / cellWidth.value) * scale.value * 60.0); // convert width to time based on the scale

      const distance = minutes % resolution;
      if (distance > resolution / 2) {
        minutes += resolution - distance;
      } else {
        minutes -= distance;
      }
      if (minutes < resolution) {
        minutes = resolution;
      }
      // remove decimal from timeLength

      const startDateObject = timelineEvent.start;
      const endDateObject = new Date(
        new Date(startDateObject).setMinutes(
          startDateObject.getMinutes() + minutes
        )
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
      const minutes = (x / cellWidth.value) * scale.value * 60.0; // convert width to time based on the scale
      timelineEvent.start = new Date(
        timelineEvent.start.setMinutes(
          timelineEvent.start.getMinutes() + minutes
        )
      );
      timelineEvent.end = new Date(
        timelineEvent.end.setMinutes(timelineEvent.end.getMinutes() + minutes)
      );

      timelineEvent.identiferIdx += Math.floor(y / rowHeight.value);
    }
    /**
     * Scroll to zoom in and out
     * @param e
     * @returns {void}
     */
    const onWheel = (event: WheelEvent) => {
      if (event.deltaY < 0) {
        scrollUp.value++;
        if (scrollUp.value === props.options?.scrollSpeed) {
          scale.value = Math.min(scale.value + scaleIngrement.value, 5); // Limit the scale to 5
          scrollUp.value = 0;
        }
      }
      if (event.deltaY > 0) {
        scrollDown.value++;
        if (scrollDown.value === props.options?.scrollSpeed) {
          scale.value = Math.max(
            scale.value - scaleIngrement.value,
            props.options?.scaleCustom || 0.5
          ); // Limit the scale to 0.5
          scrollDown.value = 0;
        }
      }
    };

    const setScale = () => {
      // check if custom scale is set
      if (props.options?.scaleCustom) {
        scale.value = props.options.scaleCustom;
        return;
      }

      switch (props.options?.scaleUnit) {
        case "minutes":
          // if minute scroll by 0.5
          scale.value = 0.5;
          scaleIngrement.value = 0.5;
          break;
        case "hours":
          // if hour scroll by 1.0
          scale.value = 1.0;
          scaleIngrement.value = 1.0;
          break;
        case "days":
          // if day scroll by 24.0
          scale.value = 24.0;
          scaleIngrement.value = 24.0;
          break;
        default:
          scale.value = 0.5;
          scaleIngrement.value = 0.5;
      }
    };

    onMounted(() => {
      setScale();
      if (dropzones.value !== undefined) {
        dropzones.value.forEach((value) =>
          interact(value)
            .dropzone({
              checker: function (
                _dragEvent,
                _event,
                dropped,
                dropzone,
                dropElement,
                draggable,
                draggableElement
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
            })
        );
      }
    });

    return {
      cellWidth,
      rowHeight,
      getTimeline,
      getEventWidth,
      getEventLeft,
      getEventRow,
      scale,
      onWheel,
      eventResized,
      eventDragged,
      dropzones,
    };
  },
});
</script>
<style>
.draggable {
  touch-action: none;
  user-select: none;
}

.dropzone.drop-target {
  background-color: rgb(213, 250, 213);
}

#events {
  width: fit-content;
}
</style>
