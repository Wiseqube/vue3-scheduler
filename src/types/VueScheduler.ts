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
  scale?: number;
  timeFormat: string;
  dateFormat: string;
  resizeResolution?: number;
}

interface TimeSpan {
  start: Date;
  end: Date;
  color: string;
  timelines?: Array<number>;
}
export type { Event, Options, TimeSpan };
