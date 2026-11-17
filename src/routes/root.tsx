import { useEffect, useRef, useState } from "react";
import SearchBar from "@/components/SearchBar";
import "@/css/Root.css";
import DataTable from "@/components/DataTable";
import { parseAsArrayOf, parseAsString, useQueryState } from "nuqs";
import { notifications } from "@mantine/notifications";

// Number of rows requested per page. The API caps this at 200.
const PAGE_SIZE = 50;

type McapPage = {
  data: MCAPFileInformation[];
  /** Cursor for the next page, or null when there are no more rows. */
  nextCursor: string | null;
};

export default function Root() {
  const [pendingUploads, setPendingUploads] = useState<string[]>([]);
  const [filteredData, setFilteredData] = useState<MCAPFileInformation[]>();
  const [selectedRow, setSelectedRow] = useState<string>("");
  const [selectedData, setSelectedData] = useState<MCAPFileInformation>();
  const [distinctLocations, setDistinctLocations] = useState<string[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  // Identifies the active query so responses from superseded requests are dropped.
  const queryIdRef = useRef(0);

  const [searchTerm] = useQueryState("notes", parseAsString.withDefault(""));
  const [selectedId] = useQueryState("id", parseAsString.withDefault(""));
  const [selectedLocation] = useQueryState(
    "location",
    parseAsString.withDefault(""),
  );
  const [selectedEventType] = useQueryState(
    "event",
    parseAsString.withDefault(""),
  );
  const [beforeDate] = useQueryState(
    "beforeDate",
    parseAsString.withDefault(""),
  );
  const [afterDate] = useQueryState("afterDate", parseAsString.withDefault(""));
  const [selectedSchemas] = useQueryState<string[]>(
    "schemas",
    parseAsArrayOf(parseAsString).withDefault([]),
  );
  const [carModel] = useQueryState("carModel", parseAsString.withDefault(""));

  // corresponds with index.d.ts - type SearchFilter
  const searchFilters = {
    location: selectedLocation,
    date: selectedEventType,
    eventType: selectedEventType,
    beforeDate,
    afterDate,
    searchText: searchTerm,
    selectedSchemas,
    carModel: carModel,
  };

  const [search, setSearch] = useState<boolean>(false);
  const formatDate = (dateStr: string, time: string) => {
    const [year, month, day] = dateStr.split("-");
    if (month.length !== 2 || day.length !== 2 || year.length !== 4) {
      throw new Error(`Invalid date format: ${dateStr}`);
    }
    return new Date(`${year}-${month}-${day}T${time}Z`).toISOString();
  };

  // fetch request of wanted files with filters as Query Params.
  // The first page omits the cursor; later pages pass the previous next_cursor.
  const fetchData = async (
    filters: SearchFilter,
    cursor?: string,
  ): Promise<McapPage> => {
    if (selectedId != "") {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/v2/mcaps/${selectedId}`,
        { credentials: "include" },
      );

      const data = await res.json();
      return {
        data: data.data as MCAPFileInformation[],
        nextCursor: null,
      };
    }

    // corresponds with index.d.ts - type SearchFilter
    const { location, date, eventType, searchText, carModel } = filters;
    let { afterDate, beforeDate } = filters;

    beforeDate = beforeDate
      ? formatDate(beforeDate, "00:00:00.000")
      : undefined;
    afterDate = afterDate ? formatDate(afterDate, "23:59:59.999") : undefined;
    const params = {
      ...(location ? { location } : {}),
      ...(eventType ? { eventType } : {}),
      ...(date ? { date } : {}),
      ...(afterDate ? { after_date: afterDate } : {}),
      ...(beforeDate ? { before_date: beforeDate } : {}),
      ...(searchText ? { search_text: searchText } : {}),
      ...(carModel ? { car_model: carModel } : {}),
      limit: String(PAGE_SIZE),
      ...(cursor ? { cursor } : {}),
    };

    const queryString = new URLSearchParams(params).toString();

    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/api/v2/mcaps?${queryString}`,
      { credentials: "include" },
    );

    const data = await res.json();
    return {
      data: (data.data ?? []) as MCAPFileInformation[],
      nextCursor: (data.next_cursor ?? null) as string | null,
    };
  };

  // Loads the first page of the current query, replacing any existing rows.
  // Responses from a superseded query are ignored.
  const loadFirstPage = async () => {
    const queryId = ++queryIdRef.current;
    // Drop the old cursor so "Load more" can't request the previous query's page.
    setNextCursor(null);
    const page = await fetchData(searchFilters);
    if (queryId !== queryIdRef.current) return;

    setFilteredData(filterAndSort(page.data));
    setNextCursor(page.nextCursor);
    updateLocations(page.data);
  };

  const loadMore = async () => {
    if (!nextCursor || loadingMore) return;

    const queryId = queryIdRef.current;
    const cursor = nextCursor;
    setLoadingMore(true);
    try {
      const page = await fetchData(searchFilters, cursor);
      if (queryId !== queryIdRef.current) return;

      setFilteredData((current) =>
        filterAndSort(mergeUnique(current ?? [], page.data)),
      );
      setNextCursor(page.nextCursor);
      addLocations(page.data);
    } finally {
      setLoadingMore(false);
    }
  };

  const filterAndSort = (unsortedData: MCAPFileInformation[]) =>
    unsortedData.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateB.getTime() - dateA.getTime();
    });

  // Keeps existing rows when a later page repeats a file (e.g. after an SSE insert).
  const mergeUnique = (
    current: MCAPFileInformation[],
    incoming: MCAPFileInformation[],
  ) => {
    const knownIds = new Set(current.map((item) => item.id));
    return [...current, ...incoming.filter((item) => !knownIds.has(item.id))];
  };

  const updatePendingUploads = async () => {
    const resp = await fetch(
      `${import.meta.env.VITE_API_URL}/api/v2/mcaps/pending`,
    );
    const pendingUploads = await resp.json();
    if (Array.isArray(pendingUploads)) {
      setPendingUploads(pendingUploads);
    }
  };

  const extractLocations = (unsortedData: MCAPFileInformation[]) =>
    unsortedData
      .map((item) => item.location)
      .filter((loc) => loc != null && loc.trim() !== "");

  const updateLocations = (unsortedData: MCAPFileInformation[]) => {
    setDistinctLocations(Array.from(new Set(extractLocations(unsortedData))));
  };

  // Locations are discovered page by page, so keep options from earlier pages.
  const addLocations = (data: MCAPFileInformation[]) => {
    setDistinctLocations((current) =>
      Array.from(new Set([...current, ...extractLocations(data)])),
    );
  };

  useEffect(() => {
    // fetch data on load
    loadFirstPage();

    // Fetch currently pending MCAP file uploads (most of the time, this is empty)
    updatePendingUploads();

    // Refreshes data table entries when user refocuses the page
    const reloadCallback = () => setSearch(!document.hidden);
    document.addEventListener("visibilitychange", reloadCallback);

    // Creates a Server-Sent Events subscriber that listens to file upload changes
    const eventSource = new EventSource(
      `${import.meta.env.VITE_API_URL}/api/v2/mcaps/subscribe`,
    );
    eventSource.onmessage = (ev) => {
      const data = JSON.parse(ev.data);
      if (data.status === "processing" && data.name != null) {
        setPendingUploads((uploads) => [...uploads, data.name]);
      } else if (data.status === "completed" && data.data != null) {
        const mcapFileInfo = data.data as MCAPFileInformation;
        const mcapFileName = mcapFileInfo.mcap_files[0].file_name;
        setFilteredData((dataList) =>
          filterAndSort([...(dataList ?? []), data.data]),
        );
        setPendingUploads((uploads) =>
          uploads.filter((u) => u !== mcapFileName),
        );
      } else if (data.status === "failed") {
        notifications.show({
          title: `${data.name ?? "Unknown File"} failed to upload`,
          message: data.error || "",
          color: "red",
        });
        setPendingUploads((uploads) => uploads.filter((u) => u !== data.name));
      }
    };

    return () => {
      eventSource.close();
      document.removeEventListener("visibilitychange", reloadCallback);
    };
  }, []);

  // Two useEffects bc of the way we are handling the Search Button D:
  useEffect(() => {
    if (search) {
      loadFirstPage().then(() => setSearch(false));
      updatePendingUploads();
    }
  }, [search]);

  return (
    <>
      <div className="results-container">
        <DataTable
          // when data is undefined, a loading indicator appears.
          // this serves to show the loading indicator while searching is in-progress
          data={search ? undefined : filteredData}
          pendingUploads={pendingUploads}
          selectedRow={selectedRow}
          selectedData={selectedData}
          setSelectedRow={setSelectedRow}
          setSelectedData={setSelectedData}
          hasMore={!search && nextCursor != null}
          loadingMore={loadingMore}
          onLoadMore={loadMore}
        />
        <SearchBar
          setSearch={setSearch}
          distinctLocations={distinctLocations}
        />
      </div>
    </>
  );
}
