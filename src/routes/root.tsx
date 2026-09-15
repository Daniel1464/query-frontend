import { useEffect, useState } from "react";
import SearchBar from "@/components/SearchBar";
import "@/css/Root.css";
import DataTable from "@/components/DataTable";
import { parseAsArrayOf, parseAsString, useQueryState } from "nuqs";

export default function Root() {
  const [filteredData, setFilteredData] = useState<MCAPFileInformation[]>();
  const [selectedRow, setSelectedRow] = useState<string>("");
  const [selectedData, setSelectedData] = useState<MCAPFileInformation>();
  const [distinctLocations, setDistinctLocations] = useState<string[]>([]);

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

  // fetch request of wanted files with filters as Query Params
  const fetchData = async (filters: SearchFilter) => {
    if (selectedId != "") {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/v2/mcaps/${selectedId}`,
      );

      const data = await res.json();
      return data.data as MCAPFileInformation[];
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
    };

    const queryString = new URLSearchParams(params).toString();

    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/api/v2/mcaps?${queryString}`,
    );

    const data = await res.json();
    return data.data as MCAPFileInformation[];
  };

  const updateFilteredData = (unsortedData: MCAPFileInformation[]) => {
    const sortedData = unsortedData.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateB.getTime() - dateA.getTime();
    });
    setFilteredData(sortedData);
  };

  const updateLocations = (unsortedData: MCAPFileInformation[]) => {
    const extractedLocations: string[] = unsortedData
      .map((item) => item.location)
      .filter((loc) => loc != null && loc.trim() !== "");
    const uniqueLocations = Array.from(new Set(extractedLocations));
    setDistinctLocations(uniqueLocations);
  };

  useEffect(() => {
    fetchData(searchFilters).then((data) => {
      updateFilteredData(data);
      updateLocations(data);
    });
  }, []);

  // Two useEffects bc of the way we are handling the Search Button D:
  useEffect(() => {
    if (search) {
      fetchData(searchFilters).then((data) => {
        updateFilteredData(data);
        setSearch(false);
      });
    }
  }, [search]);

  return (
    <>
      <div className="results-container">
        <DataTable
          // when data is undefined, a loading indicator appears.
          // this serves to show the loading indicator while searching is in-progress
          data={search ? undefined : filteredData}
          selectedRow={selectedRow}
          selectedData={selectedData}
          setSelectedRow={setSelectedRow}
          setSelectedData={setSelectedData}
        />
        <SearchBar
          setSearch={setSearch}
          distinctLocations={distinctLocations}
        />
      </div>
    </>
  );
}
