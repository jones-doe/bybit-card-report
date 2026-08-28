/**
 * How long fetched history stays fresh. Past this, the next mount (opening the
 * app, switching keys back) triggers a silent background refetch instead of
 * serving the cached copy forever — react-query walks every already-cached
 * page again, and useAssetRecordsQuery's own pagination effect picks up from
 * there if the history has grown since.
 */
export const QUERY_STALE_TIME_MS = 12 * 60 * 60 * 1000
