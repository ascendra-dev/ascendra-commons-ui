export type ColumnPreferences = {
  order: string[];
  visibility: Record<string, boolean>;
};

export type QueryStatePreferences = {
  lastConfirmedQueryId?: string;
  /** Serialized QueryParamValues keyed by queryId. Use serializeParamValues/deserializeParamValues. */
  lastRunParams?: Record<string, Record<string, unknown>>;
};

/** Stored representation of a user-saved query. Params are serialized (Date → ISO string). */
export type StoredSavedUserQuery = {
  id: string;
  name: string;
  description: string;
  sourceQueryId: string;
  params: Record<string, unknown>;
  enabled: boolean;
  order: number;
  createdAt: string;
};

/** Persisted ordering and visibility overrides for preset (non-user) queries. */
export type PresetQueryPrefs = {
  /** IDs of preset queries the user has disabled (hidden from dropdown). */
  disabledIds?: string[];
  /** Custom ordering per group — maps QueryGroup key to ordered array of query IDs. */
  groupOrder?: Record<string, string[]>;
};

export type TablePreferences = {
  columns?: ColumnPreferences;
  queryState?: QueryStatePreferences;
  savedUserQueries?: StoredSavedUserQuery[];
  presetQueryPrefs?: PresetQueryPrefs;
};

export type UserPreferences = {
  tables: Record<string, TablePreferences>;
  // future: global?: GlobalPreferences;
};
