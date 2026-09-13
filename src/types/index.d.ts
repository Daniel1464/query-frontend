/**
 * Represents a record of MPS data.
 */
type MpsRecord = {
  [key: string]: {
    [key: string]: {
      type: string;
      result: string;
    };
  };
};

/**
 *
 * This type is useful for managing and displaying structured data related to MCAP files
 * in the context of a Storybook story or a React component.
 */
type MCAPFileInformation = {
  /** Unique identifier for the file. */
  id: string;
  /** The car model associated with the file. */
  car_model: string;
  /** Schema version metadata (optional). */
  schema_versions?: null;
  /** List of MCAP files, each containing file name and signed URL. */
  mcap_files: {
    signed_url: string;
    file_name: string;
  }[];
  /** List of MATLAB files, each containing file name and signed URL. */
  mat_files: {
    signed_url: string;
    file_name: string;
  }[];
  /** Content files categorized by specific types, such as plots. */
  content_files: {
    vn_lat_lon_plot: {
      signed_url: string;
      file_name: string;
    }[];
    vn_time_vel_plot: {
      signed_url: string;
      file_name: string;
    }[];
  };
  /** Name of the MATLAB file. */
  matlab_file_name: string;
  /** AWS bucket containing the files. */
  aws_bucket: string;
  /** Path to the MCAP file in S3. */
  mcap_path: string;
  /** Path to the MATLAB file in S3. */
  mat_path: string;
  /** Path to the VN latitude-longitude plot in S3. */
  vn_lat_lon_path: string;
  /** Path to the velocity plot in S3. */
  velocity_plot_path: string;
  /** Date of the event or file creation. */
  date: string;
  /** Location of the event or file. */
  location: string;
  /** Notes about the event or file (optional). */
  notes?: string;
  /** Type of the event (e.g., acceleration, endurance) (optional). */
  event_type?: string;
  /** Signed URL for accessing the file (optional). */
  signed_url?: string;
  /** MPS records */
  mps_record?: MpsRecord;
};

/**
 * Represents search filters for querying MCAP data.
 *
 * This type can be used for filtering data in Storybook stories or UI components.
 */
type SearchFilter = {
  /** Filter by location (optional). */
  location?: string;
  /** Text-based search (optional). */
  searchText?: string;
  /** Filter by a specific date (optional). */
  date?: string;
  /** Filter by event type (optional). */
  eventType?: string;
  /** Filter by date after a specific threshold (optional). */
  afterDate?: string;
  /** Filter by date before a specific threshold (optional). */
  beforeDate?: string;
  /** Filter by car model (optional). */
  carModel?: string;
};

/**
 * Represents a file with its name and signed URL.
 *
 * Useful for defining structured file information in Storybook components.
 */
type FileType = {
  /** Name of the file. */
  file_name: string;
  /** Signed URL to access the file. */
  signed_url: string;
};

/**
 * Represents a content file with specific metadata.
 *
 * This type can describe files with additional properties, such as type and access URL.
 */
type ContentFileType = {
  /** Content type or description. */
  content: string;
  /** Signed URL to access the content file. */
  signed_url: string;
};

/**
 * Represents a streamlined version of MCAP file information with updated structure.
 *
 * This type can replace `MCAPFileInformation` for simplified use in Storybook stories or components.
 */
type MCAPFileInformationNew = {
  /** Unique identifier for the file. */
  id: string;
  /** List of MCAP files with associated metadata. */
  mcap_files: FileType[];
  /** List of MATLAB files with associated metadata. */
  mat_files: FileType[];
  /** Content files categorized by specific types. */
  content_files: ContentFileType[];
  /** Date of the event or file creation. */
  date: string;
  /** Location of the event or file. */
  location: string;
  /** Notes about the event or file (optional). */
  notes?: string;
  /** Type of the event (e.g., acceleration, endurance) (optional). */
  event_type?: string;
  /** Optional schema metadata, represented as a key-value map. */
  schema?: { [key: string]: string };
};
