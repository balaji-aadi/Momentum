import React, { useState } from "react";
import { useFormik } from "formik";
import { Table } from "../../components/Table/Table";
import moment from "moment";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { DashbordApi } from "../../services/api/Dashboard.api";

const TaskDeliverables = () => {
  const [rowData, setRowData] = useState(null);

  const fetchData = async (payload) => {
    try {
      const res = await DashbordApi.taskDeliverables(payload);
      setRowData(res.data?.data);
    } catch (error) {
      console.error("Error calling API:", error);
    }
  };

  const formik = useFormik({
    initialValues: {
      fromDate: null,
      toDate: null,
    },
    onSubmit: (values) => {
      const payload = {
        fromDate: values.fromDate
          ? moment(values.fromDate).format("YYYY-MM-DD")
          : null,
        toDate: values.toDate
          ? moment(values.toDate).format("YYYY-MM-DD")
          : null,
      };
      fetchData(payload);
    },
  });

  const getTaskDeliverables = () => {
    return DashbordApi.taskDeliverables();
  };

  const columns = [
    {
      headerName: "S.No.",
      field: "sno",
      minWidth: 100,
      cellRenderer: (params) => {
        return params.node.rowIndex + 1;
      },
    },
    { field: "name", headerName: "Name" },
    { field: "totalTasks", headerName: "Total Tasks" },
    { field: "completedTasks", headerName: "Completed Tasks" },
    { field: "inProgress", headerName: "In Progress Tasks" },
    { field: "holdTasks", headerName: "Hold Tasks" },
    { field: "deliveredTasks", headerName: "Deliverable Tasks" },
    { field: "status", headerName: "Status" },
  ];

  const handleRemove = () => {
    formik.resetForm();
    setRowData(null);
  };

  return (
    <div className="p-6 bg-gray-100 rounded-lg dark:bg-themeBG dark:text-themeText border-white border-2">
      <h1 className="text-2xl font-bold text-gray-700 dark:text-themeText py-6 border-white border-b-2">
        Today Task Deliverables Status
      </h1>

      <form onSubmit={formik.handleSubmit}>
        <div className="mb-4 pt-3">
          <div className="flex items-center justify-end mb-2 flex-wrap">
            <label className="mr-2 text-sm">Select Date Range:</label>

            <DatePicker
              selected={formik.values.fromDate}
              onChange={(date) => formik.setFieldValue("fromDate", date)}
              selectsStart
              startDate={formik.values.fromDate}
              endDate={formik.values.toDate}
              dateFormat="yyyy-MM-dd"
              placeholderText="Start Date"
              className="p-2 border rounded-md dark:text-black"
            />
            <span className="mx-2 text-sm">to</span>
            <DatePicker
              selected={formik.values.toDate}
              onChange={(date) => formik.setFieldValue("toDate", date)}
              selectsEnd
              startDate={formik.values.fromDate}
              endDate={formik.values.toDate}
              minDate={formik.values.fromDate}
              dateFormat="yyyy-MM-dd"
              placeholderText="End Date"
              className="p-2 border rounded-md dark:text-black"
            />
            <button
              type="submit"
              className="bg-blue-500 text-white p-2 rounded-md ml-5"
            >
              Submit
            </button>
            <button
              type="button"
              className="bg-red-500 text-white p-2 rounded-md ml-5"
              onClick={handleRemove}
            >
              Remove
            </button>
          </div>
        </div>
      </form>

      {/* Table for Displaying Data */}
      <Table
        column={columns}
        getTableFunction={!rowData && getTaskDeliverables}
        internalRowData={rowData}
        searchLabel="Team Deliverables"
        totalCount={true}
      />
    </div>
  );
};

export default TaskDeliverables;
