import React, { useState } from "react";
// import TBoard from "../../pages/testing-childrens/Board";
import WorkInProgress from "../../components/WorkInProgress";

const TaskBugs = () => {
  const [projectTasks, setProjectTasks] = useState(null);
  const [selectedProject, setSelectedProject] = useState("");
  return (
    <div>
      {/* <TBoard
        tasks={projectTasks}
        setTasks={setProjectTasks}
        selectedProject={selectedProject}
        // handleClick={handleClickTesting}
        // selectedMember={selectedMember}
        // selectedTaskType={selectedTaskType}
      /> */}

      <WorkInProgress />
    </div>
  );
};

export default TaskBugs;
