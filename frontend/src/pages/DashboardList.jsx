/* eslint-disable jsx-a11y/img-redundant-alt */
import React from "react";
import Breadcrumbs from "../components/Breadcrumbs";
import { Table } from "../components/Table/Table";

const DashboardList = ({
  setIsList,
  testCaseData,
  cardTitle,
  bugData,
  setTestCaseData,
  setBugData,
}) => {
  const breadcrumbs = [
    {
      label: "Dashboard",
      handleClicked: () => {
        setIsList(false);
        setTestCaseData([]);
        setBugData([]);
      },
    },
    {
      label: "List View",
      path: "/testing/dashboard",
    },
  ];

  const testCaseColumn = [
    {
      headerName: "S.No.",
      field: "sno",
      minWidth: 100,
      cellRenderer: (params) => {
        return params.node.rowIndex + 1;
      },
    },
    {
      headerName: "Test Case Name",
      field: "testCaseName",
    },
    {
      headerName: "Assignee",
      field: "assignee",
      cellRenderer: (params) => {
        return params?.data?.assignee?.email;
      },
    },
    {
      headerName: "Created By",
      field: "createdBy",
      cellRenderer: (params) => {
        return params?.data?.createdBy?.email;
      },
    },
    {
      headerName: "Updated By",
      field: "updatedBy",
      cellRenderer: (params) => {
        return params?.data?.updatedBy?.email;
      },
    },
    {
      headerName: "Test Scenario Description",
      field: "testScenarioDescription",
    },
    {
      headerName: "Preconditions",
      field: "preconditions",
      cellRenderer: (params) => {
        return params?.data?.preconditions || "N/A";
      },
    },
    {
      headerName: "Image",
      field: "image",
      cellRenderer: (params) => {
        return params?.data?.image ? (
          <img
            src={params.data.image}
            alt="Test Case Image"
            width="50"
            height="50"
          />
        ) : (
          "No Image"
        );
      },
    },
  ];

  const bugColumn = [
    {
      headerName: "S.No.",
      field: "sno",
      minWidth: 100,
      cellRenderer: (params) => {
        return params.node.rowIndex + 1;
      },
    },
    {
      headerName: "Bug Title",
      field: "bugTitle",
    },
    {
      headerName: "Description",
      field: "bugDescription",
    },
    {
      headerName: "Severity",
      field: "severity",
    },
    {
      headerName: "Reproducibility",
      field: "reproducibility",
    },
    {
      headerName: "Assignee",
      field: "assignee",
      cellRenderer: (params) => {
        return params?.data?.assignee?.email;
      },
    },
    {
      headerName: "Created By",
      field: "createdBy",
      cellRenderer: (params) => {
        return params?.data?.createdBy?.email;
      },
    },
    {
      headerName: "Updated By",
      field: "updatedBy",
      cellRenderer: (params) => {
        return params?.data?.updatedBy?.email;
      },
    },
  ];

  return (
    <>
      <div className="p-10 w-full">
        <Breadcrumbs breadcrumbs={breadcrumbs} />
        <h3 className="text-gray-700  dark:text-themeText text-2xl font-semibold">
          {cardTitle}
        </h3>
        <div className="mt-4">
          <Table
            column={testCaseData.length > 0 ? testCaseColumn : bugColumn}
            internalRowData={testCaseData.length > 0 ? testCaseData : bugData}
            searchLabel={"Tasks"}
            totalCount={true}
          />
        </div>
      </div>
    </>
  );
};

export default DashboardList;
