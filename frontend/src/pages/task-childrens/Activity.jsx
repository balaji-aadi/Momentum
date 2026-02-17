import React, { useEffect, useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import InputField from "../../components/InputField";
import { useLoading } from "../../components/loader/LoaderContext";
import { UserApi } from "../../services/api/user.api";
import { ActivityApi } from "../../services/api/Activity.api";
import toast from "react-hot-toast";

const Activity = ({
  isOpen,
  onClose,
  task,
  type,
  isUpdate,
  getAllActivities,
}) => {
  const [activityType, setActivityType] = useState("Todo");
  const [teamMembers, setTeamMembers] = useState([]);
  const { handleLoading } = useLoading();

  const handleTeamMemberOption = async () => {
    handleLoading(true);
    try {
      const res = await UserApi.users();
      setTeamMembers(res.data?.data);
    } catch (err) {
      console.log(err);
    }
    handleLoading(false);
  };

  const teamMemberOptions = teamMembers.map((item) => {
    return {
      value: item?._id,
      label: `${item?.firstName} ${" "} ${item?.lastName} `,
    };
  });

  useEffect(() => {
    handleTeamMemberOption();
  }, []);

  const activityOptions = [
    { value: "Email", label: "Email" },
    { value: "Call", label: "Call" },
    { value: "Todo", label: "Todo" },
    { value: "Meeting", label: "Meeting" },
    { value: "Upload Document", label: "Upload Document" },
  ];

  const validationSchema = Yup.object({
    activityType: Yup.string().required("Activity type is required"),
    summary: Yup.string().required("Summary is required"),
    dueDate: Yup.date().required("Due Date is required"),
    assignee: Yup.string().required("Assignee is required"),
    description: Yup.string().required("Description is required"),
    title:
      activityType === "Meeting"
        ? Yup.string().required("Title is required")
        : Yup.string(),
    meetingStartDate:
      activityType === "Meeting"
        ? Yup.date().required("Meeting start date is required")
        : Yup.date(),
    meetingEndDate:
      activityType === "Meeting"
        ? Yup.date().required("Meeting end date is required")
        : Yup.date(),
    attendees:
      activityType === "Meeting"
        ? Yup.array().min(1, "At least one attendee is required")
        : Yup.array(),
  });

  const formik = useFormik({
    initialValues: {
      referenceId: "",
      activityType: "Todo",
      summary: "",
      dueDate: "",
      assignee: "",
      description: "",
      title: "",
      meetingStartDate: "",
      meetingEndDate: "",
      attendees: [],
    },
    validationSchema,
    onSubmit: async (values) => {
      const payload = {
        ...(isUpdate ? { referenceId: task?.referenceId } : { referenceId: task?._id }),
        type: isUpdate ? task?.type : type,
        activityType: values.activityType,
        dueDate: values.dueDate,
        summary: values.summary,
        assignee: values.assignee,
        description: values.description,
        ...(values.activityType === "Meeting" && {
          title: values.title,
          meetingStartDate: values.meetingStartDate,
          meetingEndDate: values.meetingEndDate,
          attendees: values.attendees,
        }),
      };
      try {
        const res = isUpdate
          ? await ActivityApi.updateActivity(task?._id, payload)
          : await ActivityApi.createActivity(payload);
        console.log(res.data?.data);
        toast.success(
          isUpdate
            ? "Activity updated successfully"
            : "Activity created successfully"
        );

        isUpdate && getAllActivities();
        onClose();
        formik.resetForm();
      } catch (err) {
        console.log(err);
      }
    },
  });

  useEffect(() => {
    if (task) {
      const formatDate = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toISOString().split("T")[0];
      };

      formik.setValues({
        referenceId: task?._id || "",
        activityType: task?.activityType || "Todo",
        dueDate: formatDate(task?.dueDate) || "",
        assignee: task?.assignee?._id || "",
        description: task?.description || "",
        title: task?.title || "",
        meetingStartDate: formatDate(task?.meetingStartDate) || "",
        meetingEndDate: formatDate(task?.meetingEndDate) || "",
        attendees: task?.attendees || [],
        summary: task?.summary,
      });
    }
  }, [task]);

  return (
    isOpen && (
      <div
        className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50 "
        style={{ marginTop: "0" }}
      >
        <div className="bg-white dark:bg-themeBG text-themeText p-8 rounded-lg shadow-lg w-1/2 ">
          <h2 className="text-2xl mb-4 border-b-2 dark:text-themeText text-black pb-2">
            Schedule Activity
          </h2>
          <form onSubmit={formik.handleSubmit}>
            <div className="overflow-auto h-[60vh] pr-2 ">
              <InputField
                label="Activity Type"
                name="activityType"
                type="select"
                value={formik.values.activityType}
                onChange={formik.handleChange}
                options={activityOptions}
                error={
                  formik.errors.activityType &&
                  formik.touched.activityType &&
                  formik.errors.activityType
                }
                isRequired={true}
              />
              {formik.values.activityType && (
                <>
                  <InputField
                    label="Summary"
                    name="summary"
                    type="text"
                    value={formik.values.summary}
                    onChange={formik.handleChange}
                    error={
                      formik.errors.summary &&
                      formik.touched.summary &&
                      formik.errors.summary
                    }
                    isRequired={true}
                  />
                  <InputField
                    label="Due Date"
                    name="dueDate"
                    type="date"
                    value={formik.values.dueDate}
                    onChange={formik.handleChange}
                    error={
                      formik.errors.dueDate &&
                      formik.touched.dueDate &&
                      formik.errors.dueDate
                    }
                    isRequired={true}
                  />
                  <InputField
                    label="Assign To"
                    name="assignee"
                    type="select"
                    value={formik.values.assignee}
                    onChange={formik.handleChange}
                    options={teamMemberOptions}
                    error={
                      formik.errors.assignee &&
                      formik.touched.assignee &&
                      formik.errors.assignee
                    }
                    isRequired={true}
                  />
                  <InputField
                    label="Description"
                    name="description"
                    type="textarea"
                    value={formik.values.description}
                    onChange={formik.handleChange}
                    error={
                      formik.errors.description &&
                      formik.touched.description &&
                      formik.errors.description
                    }
                  />
                </>
              )}

              {formik.values.activityType === "Meeting" && (
                <>
                  <InputField
                    label="Title"
                    name="title"
                    type="text"
                    value={formik.values.title}
                    onChange={formik.handleChange}
                    error={
                      formik.errors.title &&
                      formik.touched.title &&
                      formik.errors.title
                    }
                    isRequired={true}
                  />
                  <InputField
                    label="Meeting Start Date"
                    name="meetingStartDate"
                    type="date"
                    value={formik.values.meetingStartDate}
                    onChange={formik.handleChange}
                    error={
                      formik.errors.meetingStartDate &&
                      formik.touched.meetingStartDate &&
                      formik.errors.meetingStartDate
                    }
                    isRequired={true}
                  />
                  <InputField
                    label="Meeting End Date"
                    name="meetingEndDate"
                    type="date"
                    value={formik.values.meetingEndDate}
                    onChange={formik.handleChange}
                    error={
                      formik.errors.meetingEndDate &&
                      formik.touched.meetingEndDate &&
                      formik.errors.meetingEndDate
                    }
                    isRequired={true}
                  />
                  <InputField
                    label="Attendees"
                    name="attendees"
                    type="select"
                    value={formik.values.attendees}
                    onChange={formik.handleChange}
                    options={teamMemberOptions}
                    isMulti
                    error={
                      formik.errors.attendees &&
                      formik.touched.attendees &&
                      formik.errors.attendees
                    }
                    isRequired={true}
                  />
                </>
              )}
            </div>
            <div className="mt-4 flex justify-between">
              <button
                type="button"
                className="bg-gray-600 p-2 rounded dark:text-themeText"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-500 text-white p-2 rounded"
              >
                Submit
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  );
};

export default Activity;
