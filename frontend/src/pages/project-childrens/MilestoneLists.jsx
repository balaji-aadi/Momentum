import React, { useState, useCallback, useEffect } from 'react'
import { Table } from '../../components/Table/Table'
import { ProjectApi } from '../../services/api/Project.api'
import moment from 'moment'
import * as XLSX from 'xlsx'

const MilestoneLists = () => {
    const [milestones, setMilestones] = useState([])
    console.log("milestones>>>", milestones)
    const getAllMilestones = () => {
        return ProjectApi.getmileStones()
    }

    const getMilestones = async () => {
        try {
            const res = await ProjectApi.getmileStones();

            setMilestones(res.data?.data)
        }
        catch (err) {
            console.log(err)
        }
    }

    useEffect(() => {
        getMilestones()
    }, [])

    const [columnDefs] = useState([
        {
            headerName: "S.No.",
            field: "sno",
            minWidth: 100,
            cellRenderer: (params) => params.node.rowIndex + 1,
        },
        {
            headerName: "Project",
            field: "project.name",
            enableValue: true,
        },
        {
            headerName: "Milestone Name",
            field: "milestoneName",
            enableValue: true,
        },
        {
            headerName: "Commence Date",
            field: "commenceDate",
            cellRenderer: (params) =>
                params?.data?.commenceDate
                    ? moment(params.data.commenceDate).format("DD-MM-YYYY")
                    : "N/A",
        },
        {
            headerName: "Expected Date",
            field: "expectedDate",
            cellRenderer: (params) =>
                params?.data?.expectedDate
                    ? moment(params.data.expectedDate).format("DD-MM-YYYY")
                    : "N/A",
        },
    ])

    const exportToExcel = () => {
        if (milestones.length === 0) {
            alert("No data to export");
            return;
        }

        const dataToExport = milestones.map((milestone, index) => ({
            "S.No.": index + 1,
            "Project": milestone.project?.name || "N/A",
            "Milestone Name": milestone.milestoneName || "N/A",
            "Start Date": milestone.commenceDate
                ? moment(milestone.commenceDate).format("DD-MM-YYYY")
                : "N/A",
            "Expected Date": milestone.expectedDate
                ? moment(milestone.expectedDate).format("DD-MM-YYYY")
                : "N/A"
        }));

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Milestones");
        XLSX.writeFile(wb, "milestones.xlsx");
    }

    return (
        <div className="p-10 w-full">
            <div className='flex w-full justify-between items-center'>
                <h3 className="text-gray-700 dark:text-themeText text-2xl font-semibold">
                    Project Milestones
                </h3>

                <button
                    className="bg-blue-500 text-white px-6 py-2 rounded-md mt-4"
                    onClick={exportToExcel}
                >
                    Export to Excel
                </button>
            </div>

            <Table
                column={columnDefs}
                getTableFunction={getAllMilestones}
                searchLabel={"Milestones"}
                totalCount={true}
            />
        </div>
    )
}

export default MilestoneLists
