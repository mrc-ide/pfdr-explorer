import type { PREVALENCE_COLUMNS, SURVEY_COLUMNS } from "./columns.ts";

export interface Mutation {
  mutation: string;
  date_range: {
    start: string;
    end: string;
  };
}

export interface Bounds {
  min: { lat: number; lng: number };
  max: { lat: number; lng: number };
}

export interface MetadataResponse {
  model_releases: string[];
  prevalences: {
    version: string;
    dependencies: {
      data_release: string;
      shapefile_source: string;
    };
    variants: {
      gene: string;
      mutations: Mutation[];
    }[];
  };
  bounds: Bounds;
}

export type SurveyColumn = typeof SURVEY_COLUMNS[keyof typeof SURVEY_COLUMNS];
export type PrevalenceColumn = typeof PREVALENCE_COLUMNS[keyof typeof PREVALENCE_COLUMNS];
export type Column = SurveyColumn | PrevalenceColumn;
