import React, {
  useMemo,
  useRef,
  StrictMode,
  useEffect,
  useState,
  memo,
} from "react";
import { createRoot } from "react-dom/client";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-charts-enterprise";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import { FaSearch } from "react-icons/fa";
import "./table.style.css";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import "../../commonLayout.style.css";
import { VscCloudDownload } from "react-icons/vsc";
import { IoAdd } from "react-icons/io5";
import { TaskApi } from "../../services/api/Task.api";
import toast from "react-hot-toast";

const ErrorModal = ({ message, errors, onClose }) => {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-center p-5">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-2xl overflow-auto max-h-[80vh]">
        <h2 className="text-2xl font-semibold text-red-600">
          Validation Errors
        </h2>
        <p className="mt-2 text-gray-700">{message}</p>
        <ul className="mt-4 space-y-2">
          {errors.map((error, index) => (
            <li key={index} className="bg-red-100 text-red-700 p-2 rounded-md">
              <strong>Row: {error.row}</strong> - Error:{" "}
              {error.errors.join(", ")}
            </li>
          ))}
        </ul>
        <div className="mt-4 flex justify-end">
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-700"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const CustomLoadingOverlay = () => (
  <div className="custom-loading-overlay">
    <span>Crunching data...</span>
  </div>
);

export const Table = memo(
  ({
    column = [],
    getTableFunction,
    searchLabel,
    internalRowData,
    isExport,
    sheetName,
    onCreate,
    createLabel,
    totalCount = false, // allow callers to toggle count display
  }) => {
    const exportToExcel = (data, columns) => {
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
      XLSX.writeFile(wb, `${sheetName ? sheetName : "nable"}.xlsx`);
    };

    const exportToPDF = (data, columns) => {
      const doc = new jsPDF();
      doc.autoTable({
        head: [columns.map((col) => col.headerName)],
        body: data.map((row) => columns.map((col) => row[col.field])),
      });
      doc.save(`${sheetName}.pdf`);
    };

    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
      setIsDarkMode(document.documentElement.classList.contains("dark"));

      const observer = new MutationObserver(() => {
        setIsDarkMode(document.documentElement.classList.contains("dark"));
      });

      observer.observe(document.documentElement, { attributes: true });

      return () => observer.disconnect();
    }, []);

    const [rowData, setRowData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [, setError] = useState(false);
    const [searchText, setSearchText] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [errorDetails, setErrorDetails] = useState([]);
    const [triggerTableUpdate, setTriggerTableUpdate] = useState(false);
    const [selectedRows, setSelectedRows] = useState([]);
    const [bulkStatus, setBulkStatus] = useState("");
    const [isUpdatingBulk, setIsUpdatingBulk] = useState(false);

    const gridRef = useRef();
    const containerStyle = useMemo(
      () => ({ width: "100%", height: "100%" }),
      []
    );
    const gridStyle = useMemo(() => ({ height: "100%", width: "100%" }), []);

    const defaultColDef = useMemo(() => {
      return {
        flex: 1,
        minWidth: 150,
        filter: true,
      };
    }, []);

    const autoGroupColumnDef = useMemo(() => {
      return {
        minWidth: 250,
      };
    }, []);

    const modifiedColumns = useMemo(() => {
      const checkboxCol = {
         headerCheckboxSelection: true,
         checkboxSelection: true,
         width: 50,
         minWidth: 50,
         maxWidth: 50,
         pinned: 'left',
         filter: false,
         sortable: false,
         headerName: "",
         field: "selection-row"
      };

      const columnsWithSelection = [checkboxCol, ...column];

      return columnsWithSelection.map((col) => {
        if (col.headerName === "Actions") {
          return {
            ...col,
            pinned: "right",
            cellStyle: {
              position: "sticky",
              right: 0,
              backgroundColor: "white",
              zIndex: 10,
            },
          };
        }
        return col;
      });
    }, [column]);

    // useEffect(() => {
    //   async function fetchingRowData() {
    //     try {
    //       setError(false);
    //       setLoading(true);
    //       const res = await getTableFunction();
    //       console.log(res.data);
    //       setRowData(res.data?.data);
    //     } catch (err) {
    //       setError(true);
    //     } finally {
    //       setLoading(false);
    //     }
    //   }

    //   fetchingRowData();
    // }, [getTableFunction, triggerTableUpdate]);

    useEffect(() => {
      let isMounted = true;

      const fetchData = async () => {
        try {
          const res = await getTableFunction();
          if (isMounted) {
            setRowData(res.data?.data || []);
          }
        } catch (err) {
          if (isMounted) setError(true);
        } finally {
          if (isMounted) setLoading(false);
        }
      };

      fetchData();

      return () => {
        isMounted = false;
      };
    }, [getTableFunction, triggerTableUpdate]);

    const onSearchChange = (e) => {
      setSearchText(e.target.value);
      gridRef.current.api.setQuickFilter(e.target.value);
    };

    const closeModal = () => {
      setShowModal(false);
      setErrorMessage("");
      setErrorDetails([]);
    };

    const handleFileUpload = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();

      reader.onload = async (event) => {
        const wb = XLSX.read(event.target.result, { type: "binary" });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(sheet);

        try {
          const formData = new FormData();
          formData.append("file", file);

          const response = await TaskApi.taskImport(formData);
          toast.success("Data imported successfully!!");

          setTriggerTableUpdate((prev) => !prev);
          if (response.success) {
          } else {
            console.error("Error in backend response", response.message);
          }
        } catch (error) {
          console.error("Error during file upload or API call", error);
          setErrorMessage(error?.response?.data?.message);
          setErrorDetails(error?.response?.data?.errors);
          setShowModal(true);
        }
      };

      reader?.readAsBinaryString?.(file);
      e.target.value = null;
    };

    const downloadTemplate = () => {
      const headers = [
        [
          "projectName",
          "taskName",
          "milestone",
          "taskPriority",
          "taskType",
          "estimatedHours",
          "taskDescription",
          "attachments",
          "assignee",
          "taskStartDate",
          "taskDueDate",
          "additionalNotes",
          "dependentTasks",
          "dependencyType",
          "status",
          "createdBy",
          "updatedBy",
        ],
      ];

      const ws = XLSX.utils.aoa_to_sheet(headers);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Template");

      XLSX.writeFile(wb, "template.csv", { bookType: "csv" });
    };

    const downloadPDF = () => {
      exportToPDF(rowData, column);
    };

    const onSelectionChanged = () => {
        const selectedNodes = gridRef.current.api.getSelectedNodes();
        const selectedData = selectedNodes.map(node => node.data);
        setSelectedRows(selectedData);
    };

    const handleBulkStatusUpdate = async () => {
        if (!bulkStatus || selectedRows.length === 0) return;
        
        setIsUpdatingBulk(true);
        try {
            const updatePromises = selectedRows.map(row => 
                TaskApi.taskLogs(row._id, { status: bulkStatus })
            );
            await Promise.all(updatePromises);
            toast.success(`Successfully updated ${selectedRows.length} tasks to ${bulkStatus}`);
            setSelectedRows([]);
            gridRef.current.api.deselectAll();
            setTriggerTableUpdate(prev => !prev);
        } catch (error) {
            console.error("Bulk update failed:", error);
            toast.error("Failed to update some tasks");
        } finally {
            setIsUpdatingBulk(false);
            setBulkStatus("");
        }
    };

    return (
      <main className="common__layout__wrapper">
        <section className="common__layout__section">
          <div className="search__section dark:bg-themeBG dark:text-themeText">
            <div className="search__filter justify-between">
              <div className="flex items-center gap-2">
                <label htmlFor="">
                  {searchLabel ? `${searchLabel} :` : "Search:"}
                </label>
                <div className="search__input__section ">
                  <FaSearch className="search__icon" />
                  <input
                    type="text"
                    placeholder="Search...."
                    className="dark:bg-white dark:text-black"
                    value={searchText}
                    onChange={onSearchChange}
                  />
                </div>

                {totalCount && (
                  <span
                    style={{
                      fontSize: "16px",
                      marginLeft: "1rem",
                      display: "flex",
                      alignItems: "center",
                    }}
                    className="dark:text-themeText"
                  >
                    Total Records:
                    <span
                      style={{
                        fontSize: "1.5rem",
                        fontWeight: "bolder",
                        marginLeft: "0.5rem",
                      }}
                      className="dark:text-themeText"
                    >
                      {typeof totalCount === 'number' ? totalCount : rowData?.length}
                    </span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                {onCreate && (
                  <button
                    onClick={onCreate}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white font-bold rounded-lg shadow-lg shadow-primary/20 transition-all hover:bg-primaryHover active:scale-95 text-sm"
                  >
                    <IoAdd size={18} />
                    <span>{createLabel || "Create New"}</span>
                  </button>
                )}

                {isExport && (
                  <div className="flex items-center space-x-4">
                    {/* Download Button */}
                    <button
                      onClick={downloadTemplate}
                      className="flex items-center gap-2 px-2 py-2 bg-blue-500 text-white font-semibold rounded-lg shadow-lg transition-transform transform hover:bg-blue-600 hover:scale-105"
                    >
                      <span>Download Template</span>
                      <i>
                        <VscCloudDownload />
                      </i>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bulk Actions Bar */}
          {selectedRows.length > 0 && searchLabel === "Tasks" && (
            <div className="bg-primary/5 border-y border-primary/20 p-3 px-6 flex items-center justify-between animate-in slide-in-from-top duration-300">
                <div className="flex items-center gap-4">
                    <span className="text-sm font-bold text-primary">
                        {selectedRows.length} tasks selected
                    </span>
                    <div className="h-4 w-px bg-primary/20"></div>
                    <div className="flex items-center gap-2">
                        <label className="text-xs font-semibold text-textSub uppercase tracking-wider">Change Status:</label>
                        <select 
                            value={bulkStatus}
                            onChange={(e) => setBulkStatus(e.target.value)}
                            disabled={isUpdatingBulk}
                            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/20"
                        >
                            <option value="">Select status...</option>
                            <option value="todo">To Do</option>
                            <option value="inprogress">In Progress</option>
                            <option value="hold">Hold</option>
                            <option value="done">Done</option>
                        </select>
                        <button 
                            onClick={handleBulkStatusUpdate}
                            disabled={!bulkStatus || isUpdatingBulk}
                            className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${
                                !bulkStatus || isUpdatingBulk 
                                ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                                : 'bg-primary text-white shadow-lg shadow-primary/30 hover:bg-primaryHover'
                            }`}
                        >
                            {isUpdatingBulk ? 'Updating...' : 'Apply to all'}
                        </button>
                    </div>
                </div>
                <button 
                    onClick={() => {
                        gridRef.current.api.deselectAll();
                        setSelectedRows([]);
                    }}
                    className="text-textSub hover:text-textMain text-sm underline font-medium"
                >
                    Clear Selection
                </button>
            </div>
          )}

          <div style={containerStyle}>
            <div style={{ marginBottom: "5px" }}></div>
              {/* Responsive table container: height adapts on small screens */}
              <div className="my-4 mx-4">
                <div className={`ag-theme-quartz ${isDarkMode ? 'my-custom-grid' : ''}`} style={{ width: '100%', height: '60vh' }}>
                  {loading ? <CustomLoadingOverlay /> : <AgGridReact
                    ref={gridRef}
                    // rowData={getTableFunction ? rowData : internalRowData}
                    rowData={loading ? [] : getTableFunction ? rowData : internalRowData}
                    columnDefs={modifiedColumns}
                    defaultColDef={defaultColDef}
                    autoGroupColumnDef={autoGroupColumnDef}
                    pagination={true}
                    rowSelection="multiple"
                    onSelectionChanged={onSelectionChanged}
                    suppressRowClickSelection={true}
                    sideBar={{
                      toolPanels: [
                        {
                          id: "columns",
                          labelDefault: "Columns",
                          labelKey: "columns",
                          iconKey: "columns",
                          toolPanel: "agColumnsToolPanel",
                        },
                        {
                          id: "filters",
                          labelDefault: "Filters",
                          labelKey: "filters",
                          iconKey: "filter",
                          toolPanel: "agFiltersToolPanel",
                        },
                      ],
                      defaultToolPanel: null,
                    }}
                    className="w-full h-full"
                  />}
                </div>
              </div>
          </div>
        </section>
        {showModal && (
          <ErrorModal
            message={errorMessage}
            errors={errorDetails}
            onClose={closeModal}
          />
        )}
      </main>
    );
  }
);

// const root = createRoot(document.getElementById("root"));
// root.render(
//   <StrictMode>
//     <Table />
//   </StrictMode>
// );
// window.tearDownExample = () => root.unmount();
