import React, { useCallback, useEffect, useState } from "react";
import InputField from "../../components/InputField";
import { Table } from "../../components/Table/Table";
import { MdDelete } from "react-icons/md";
import { FaEdit } from "react-icons/fa";
import moment from "moment/moment";
import { ProjectApi } from "../../services/api/Project.api";
import toast from "react-hot-toast";

const MilestoneTable = React.memo(({ milestones, onDelete, onEdit }) => {

  const handleDelete = async (params, isSavedInDB) => {
    const id = params.data?._id;
    try {
      if (isSavedInDB) {
        const res = await ProjectApi.deletemileStone(id)
        if (res.status === 200) {
          onDelete(params.node.rowIndex);
        } else if (res.status === 203) {
          toast.error('Cannot delete milestone because it has associated tasks.');
        }
      } else {
        onDelete(params.node.rowIndex);
      }
    }
    catch (err) {
      console.error('Error during milestone delete:', err);
    }
  }

  const columns = [
    {
      headerName: "S.No.",
      field: "sno",
      minWidth: 100,
      cellRenderer: (params) => params.node.rowIndex + 1,
    },
    {
      headerName: "Milestone Name",
      field: "milestoneName",
      sortable: true,
      filter: true,
    },
    {
      headerName: "Summary",
      field: "summary",
      sortable: true,
      filter: true,
    },
    {
      headerName: "Start Date",
      field: "commenceDate",
      sortable: true,
      filter: true,
      cellRenderer: (params) => {
        return moment(params.value).format("YYYY-MM-DD");
      },
    },
    {
      headerName: "Expected Date",
      field: "expectedDate",
      sortable: true,
      filter: true,
      cellRenderer: (params) => {
        return moment(params.value).format("YYYY-MM-DD");
      },
    },
    {
      headerName: "Deliverables ",
      field: "deliverables",
      sortable: true,
      filter: true,
    },
    {
      headerName: "Actions",
      field: "actions",
      cellRenderer: (params) => (
        <div className="flex p-2">
          <button
            className="px-4 rounded cursor-pointer"
            onClick={() => onEdit(params.node.rowIndex)}
          >
            <FaEdit />
          </button>
          <button
            className="px-4 text-red-500 hover:text-red-700 rounded cursor-pointer"
            onClick={() => {
              const isSavedInDB = !!params.data?._id;
              handleDelete(params, isSavedInDB);
            }}
          >
            <MdDelete />
          </button>
        </div>
      ),
    },
  ];

  return (
    <Table
      column={columns}
      internalRowData={milestones}
      searchLabel="Search Milestones"
      isExport={false}
      sheetName="Milestones List"
    />
  );
});

const MilestonePage = ({
  formik,
  setIsMileStone,
  setRolesAndResponsibilities,
}) => {
  const [editingIndex, setEditingIndex] = useState(null);

  const handleAddMilestone = useCallback(async () => {
    const { projectId, milestoneName, summary, commenceDate, expectedDate, deliverables } = formik.values;

    console.log("projectId>>>", projectId)

    const newMilestone = {
      milestoneName,
      summary,
      commenceDate,
      expectedDate,
      deliverables,
    };
    if (milestoneName && commenceDate && expectedDate) {

      const updatedMilestones = [...formik.values.milestones, newMilestone];
      formik.setFieldValue("milestones", updatedMilestones);
      formik.setFieldValue("milestoneName", "");
      formik.setFieldValue("summary", "");
      formik.setFieldValue("commenceDate", "");
      formik.setFieldValue("expectedDate", "");
      formik.setFieldValue("deliverables", "");
    }


    if (projectId) {
      try {
        const res = await ProjectApi.createMileStone(projectId, newMilestone);
        console.log(res.data?.data)
      }
      catch (err) {
        console.log(err)
      }
    }
  }, [formik]);

  const handleDeleteMilestone = useCallback(
    (index) => {
      const updatedMilestones = formik.values.milestones.filter(
        (_, i) => i !== index
      );
      formik.setFieldValue("milestones", updatedMilestones);
    },
    [formik]
  );

  const handleFinalSubmit = (event) => {
    event.preventDefault();

    const filteredMilestones = formik.values.milestones.filter(
      (milestone) =>
        milestone.milestoneName && milestone.commenceDate && milestone.expectedDate
    );

    formik.setFieldValue("milestones", filteredMilestones);
    setRolesAndResponsibilities([]);
    formik.handleSubmit();
  };

  const handleEditMilestone = (index) => {
    setEditingIndex(index);
    const milestoneToEdit = formik.values.milestones[index];
    const formattedDate = milestoneToEdit?.commenceDate?.split('T')?.[0];
    const formattedDueDate = milestoneToEdit?.expectedDate.split?.('T')?.[0];

    formik.setFieldValue("_id", milestoneToEdit._id)
    formik.setFieldValue("milestoneName", milestoneToEdit.milestoneName);
    formik.setFieldValue("summary", milestoneToEdit.summary);
    formik.setFieldValue("commenceDate", formattedDate);
    formik.setFieldValue("expectedDate", formattedDueDate);
    formik.setFieldValue("deliverables", milestoneToEdit.deliverables);
  };

  const handleUpdateMilestone = async () => {
    if (editingIndex !== null) {
      const { _id, milestoneName, summary, commenceDate, expectedDate, deliverables, projectId } = formik.values;
      const updatedMilestone = { milestoneName, summary, commenceDate, expectedDate, deliverables };
      const payload = {
        projectId,
        milestoneName,
        summary,
        commenceDate,
        expectedDate,
        deliverables
      }

      const updatedMilestones = [...formik.values.milestones];
      updatedMilestones[editingIndex] = updatedMilestone;

      formik.setFieldValue("milestones", updatedMilestones);
      setEditingIndex(null);
      formik.setFieldValue("milestoneName", "");
      formik.setFieldValue("summary", "");
      formik.setFieldValue("commenceDate", "");
      formik.setFieldValue("expectedDate", "");
      formik.setFieldValue("deliverables", "");


      try {
        const res = await ProjectApi.updateMileStones(_id, payload)
        console.log(res.data?.data)
      }
      catch (err) {
        console.log(err)
      }
    }
  };

  return (
    <main className="w-full relative pt-5 ">
      <div className="w-full p-6 mb-10 dark:bg-themeBG dark:text-themeText shadow-lg rounded-lg">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-themeText mb-6">
          Create Milestones
        </h2>

        <form onSubmit={handleFinalSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-1 gap-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <InputField
                  label="Milestone Name"
                  name="milestoneName"
                  type="text"
                  placeholder="Enter milestone name..."
                  value={formik.values.milestoneName}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.milestoneName && formik.errors.milestoneName}
                  isRequired
                />
              </div>
              <div>
                <InputField
                  label="Start Date"
                  name="commenceDate"
                  type="date"
                  value={formik.values.commenceDate}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.commenceDate && formik.errors.commenceDate}
                  isRequired
                />

              </div>
              <div>
                <InputField
                  label="End Date"
                  name="expectedDate"
                  type="date"
                  value={formik.values.expectedDate}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.expectedDate && formik.errors.expectedDate}
                  isRequired
                />

              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <InputField
                  label="Summary"
                  name="summary"
                  type="textarea"
                  placeholder="Describe the milestone..."
                  value={formik.values.summary}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.summary && formik.errors.summary}
                />
              </div>

              <div>
                <InputField
                  label="List of deliverables (separate each with a comma)"
                  name="deliverables"
                  type="textarea"
                  placeholder="List deliverables for this milestone..."
                  value={formik.values.deliverables}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.deliverables && formik.errors.deliverables}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center mt-8 space-y-4 sm:space-y-0 sm:space-x-4">
            <button
              type="button"
              className="px-6 py-3 bg-blue-600 text-white rounded-md shadow-md hover:bg-blue-700 focus:outline-none transition duration-300 ease-in-out"
              onClick={editingIndex === null ? handleAddMilestone : handleUpdateMilestone}
            >
              {editingIndex === null ? "Add Milestone" : "Update Milestone"}
            </button>

            <div className="flex space-x-4">
              <button
                type="button"
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-300 ease-in-out"
                onClick={() => setIsMileStone(false)}
              >
                Back
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition duration-300 ease-in-out"
              >
                Submit
              </button>
            </div>
          </div>
        </form>

        <div className="mt-8">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-themeText ">
            Milestones List
          </h3>
          <div className="mt-4">
            <MilestoneTable
              milestones={formik.values.milestones}
              onDelete={handleDeleteMilestone}
              onEdit={handleEditMilestone}
            />
          </div>
        </div>
      </div>
    </main>
  );
};

export default MilestonePage;
