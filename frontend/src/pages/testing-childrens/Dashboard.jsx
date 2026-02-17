import React, { useEffect, useState } from "react";
import InputField from "../../components/InputField";
import TestingProgressOverview from "./TestingProgressOverview";
import { useFormik } from "formik";
import { useLoading } from "../../components/loader/LoaderContext";
import { ProjectApi } from "../../services/api/Project.api";
import { TestApi } from "../../services/api/Test.api";
import DashboardList from "../DashboardList";

const ProjectSelection = () => {
  const [selectedProject, setSelectedProject] = useState(null);
  const [testCaseStats, setTestCaseStats] = useState(null);
  const [bugStats, setBugStats] = useState(null);
  const [projects, setProjects] = useState([]);
  const [selectedMember, setSelectedMember] = useState("");
  const [isList, setIsList] = useState(false);
  const [testCaseData, setTestCaseData] = useState([]);
  const [bugData, setBugData] = useState([]);
  const [cardTitle, setCardTitle] = useState("");

  const { handleLoading } = useLoading();

  const handleProjectOption = async () => {
    handleLoading(true);
    try {
      const res = await ProjectApi.getAllProjects();
      setProjects(res.data?.data);
    } catch (err) {
      console.log(err);
    }
    handleLoading(false);
  };

  const projectOptions = projects.map((item) => {
    return { value: item._id, label: item.name };
  });

  useEffect(() => {
    handleProjectOption();
  }, []);

  const formik = useFormik({
    initialValues: {
      projectId: null,
    },
    onSubmit: (values) => {
      console.log(values);
    },
  });

  const handleProjectChange = async (e) => {
    const projectId = e.target.value;
    setSelectedProject(projectId);
    formik.setFieldValue("projectId", projectId);

    if (!projectId) return;

    handleLoading(true);
    const filter = {
      projectId,
      ...(selectedMember !== "all" &&
        selectedMember && { assignee: selectedMember }),
    };

    try {
      const res = await fetchTestTasks(projectId, selectedMember);
      const bugResponse = await TestApi.bugDashboard({ filter });
      setTestCaseStats(res.data?.data);
      setBugStats(bugResponse.data?.data);
    } catch (err) {
      console.error("Error fetching project tasks:", err);
    } finally {
      handleLoading(false);
    }
  };

  const fetchTestTasks = (projectId, assignee) => {
    const filter = {
      projectId,
      ...(selectedMember !== "all" && assignee && { assignee: assignee }),
    };

    return TestApi.testCaseDashboard({
      filter,
    });
  };

  return (
    <>
      {isList ? (
        <DashboardList
          setIsList={setIsList}
          testCaseData={testCaseData}
          cardTitle={cardTitle}
          bugData={bugData}
          setTestCaseData={setTestCaseData}
          setBugData={setBugData}
        />
      ) : (
        <div className="p-6 bg-gray-50 dark:bg-themeBG min-h-screen">
          <div className="container mx-auto">
            <h1 className="text-4xl font-semibold   dark:text-themeText text-center mb-8">
              Testing Progress Overview
            </h1>
            <form onSubmit={formik.handleSubmit}>
              <InputField
                label="Project"
                name="projectName"
                type="select"
                value={selectedProject}
                onChange={handleProjectChange}
                options={projectOptions}
                error={formik.touched.projectName && formik.errors.projectName}
                isRequired
              />
            </form>

            {selectedProject && (testCaseStats || bugStats) && (
              <TestingProgressOverview
                testCaseStats={testCaseStats}
                bugStats={bugStats}
                setIsList={setIsList}
                setTestCaseData={setTestCaseData}
                setCardTitle={setCardTitle}
                setBugData={setBugData}
              />
            )}

            {formik.errors.projectId && formik.touched.projectId && (
              <div className="text-red-500 mt-2">{formik.errors.projectId}</div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default ProjectSelection;
