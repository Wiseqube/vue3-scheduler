<template>
  <div
    :class="event.meta?.class || 'bg-blue-500'"
    :style="{
      height: `${rowHeight}px`,
      width: `${getEventWidth(event.start, event.end)}px`,
      left: `${getEventLeft(event.start)}px`,
      top: `${getEventRow(event.identiferIdx)}px`,
    }"
    data-x="0"
    data-y="0"
    class="z-10 flex absolute draggable"
    ref="elem"
  >
    <slot name="event" :event="event" />
    <!-- resize handle -->
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 192 512"
      class="absolute right-0 h-4 w-4 resize-handle"
      :style="{
        top: `${rowHeight / 3}px`,
      }"
    >
      <path
        class="opacity-40 fill-white"
        d="M0 64C0 46.33 14.33 32 32 32C49.67 32 64 46.33 64 64V448C64 465.7 49.67 480 32 480C14.33 480 0 465.7 0 448V64z"
      />
      <path
        class="opacity-40 fill-white"
        d="M128 64C128 46.33 142.3 32 160 32C177.7 32 192 46.33 192 64V448C192 465.7 177.7 480 160 480C142.3 480 128 465.7 128 448V64z"
      />
    </svg>
  </div>
</template>
<script lang="ts">
import { defineComponent, PropType, ref } from "vue";
import interact from "interactjs";
import { Target } from "@interactjs/types";
import { onMounted } from "vue";

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

export default defineComponent({
  name: "TimelineEvent",
  props: {
    event: {
      type: Object as PropType<Event>,
      required: true,
    },
    rowHeight: {
      type: Number,
      required: true,
    },
    cellWidth: {
      type: Number,
      required: true,
    },
    scale: {
      type: Number,
      required: true,
    },
    start: {
      type: Date,
      required: true,
    },
  },
  emits: ["resize", "dragged"],
  setup(props, { emit }) {
    const elem = ref<Target>();
    const position = { x: 0, y: 0 };

    /**
     * Get event width
     * @param start
     * @param end
     * @returns {number} Width of the event
     */
    function getEventWidth(start: Date, end: Date) {
      const duration = (end.getTime() - start.getTime()) / 60000;
      if (!props.cellWidth) return 0;

      return (duration / 60 / props.scale) * props.cellWidth;
    }

    /**
     * Get event left
     * @param start
     * @returns {number} Left position of the event
     */
    function getEventLeft(eventStart: Date) {
      if (!props.cellWidth) return 0;
      const start = new Date(props.start);
      const timeDifference = (eventStart.getTime() - start.getTime()) / 60000;
      const left = (timeDifference / 60 / props.scale) * props.cellWidth;
      return left;
    }

    /**
     * Get event row
     * @param identiferIdx
     * @returns {number} Top position of the event
     */
    function getEventRow(identiferIdx: number) {
      return identiferIdx * props.rowHeight;
    }

    onMounted(() => {
      if (elem.value !== undefined) {
        interact(elem.value)
          .resizable({
            // resize from all edges and corners
            edges: { left: false, right: true, bottom: false, top: false },
            listeners: {
              move(event) {
                emit("resize", { event, timelineEvent: props.event });
              },
            },
            modifiers: [
              // keep the edges inside the parent
              interact.modifiers.restrictEdges({
                outer: "parent",
              }),
              // minimum size
              interact.modifiers.restrictSize({
                min: { width: 100, height: props.rowHeight },
              }),
              interact.modifiers.snap({
                targets: [
                  interact.snappers.grid({
                    x: props.cellWidth || 100,
                    y: props.rowHeight || 50,
                  }),
                ],
                range: Infinity,
                relativePoints: [{ x: 0, y: 0 }],
                offset: "#events",
                endOnly: true,
              }),
            ],
            inertia: false,
          })
          .draggable({
            listeners: {
              move: function (event) {
                position.x += event.dx;
                position.y += event.dy;

                event.target.style.transform = `translate(${position.x}px, ${position.y}px)`;
              },
              end: function (event) {
                emit("dragged", {
                  timelineEvent: props.event,
                  x: position.x,
                  y: position.y,
                });
                position.x = 0;
                position.y = 0;
                event.target.style.transform = `translate(${position.x}px, ${position.y}px)`;
              },
            },
            modifiers: [
              interact.modifiers.snap({
                targets: [
                  interact.snappers.grid({
                    x: props.cellWidth || 100,
                    y: props.rowHeight || 50,
                  }),
                ],
                range: Infinity,
                relativePoints: [{ x: 0, y: 0 }],
                offset: "#events",
                endOnly: true,
              }),
              interact.modifiers.restrict({
                restriction: "parent",
                elementRect: { top: 0, left: 0, bottom: 1, right: 0 },
                endOnly: false,
              }),
            ],
            inertia: true,
          });
      }
    });

    return {
      getEventWidth,
      getEventLeft,
      getEventRow,
      elem,
    };
  },
});
</script>
