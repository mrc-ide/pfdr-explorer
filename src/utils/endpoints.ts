import type { Column } from '../types.ts';
import { PREVALENCE_COLUMNS, SURVEY_COLUMNS } from '../constants.ts';

export type Endpoint = "/surveys" | "/prevalences";
export interface EndpointConfig<T extends Column = Column> {
  // An allow-list of properties that clients may request as columns.
  requestableProperties: T[];
  // Query parameters that may be used to filter the rows by equality or date range.
  // (The bounding box filter, 'bbox', is handled separately.)
  filterableParams: string[];
  // The column to filter on for requests that scope by date_from/date_to.
  dateColumn: T;
}

export const endpointConfigs: Record<Endpoint, EndpointConfig> = {
  "/surveys": {
    requestableProperties: Object.values(SURVEY_COLUMNS),
    filterableParams: [
      SURVEY_COLUMNS.SURVEY_ID,
      "date_from",
      "date_to",
      SURVEY_COLUMNS.GENE,
      SURVEY_COLUMNS.MUTATION,
    ],
    dateColumn: SURVEY_COLUMNS.COLLECTION_DAY,
  },
  "/prevalences": {
    requestableProperties: Object.values(PREVALENCE_COLUMNS),
    filterableParams: [
      PREVALENCE_COLUMNS.ADMIN0,
      PREVALENCE_COLUMNS.ADMIN1,
      PREVALENCE_COLUMNS.ADMIN2,
      PREVALENCE_COLUMNS.GENE,
      PREVALENCE_COLUMNS.MUTATION,
      PREVALENCE_COLUMNS.DATE,
      "date_from",
      "date_to",
    ],
    dateColumn: PREVALENCE_COLUMNS.DATE,
  },
} as const;
