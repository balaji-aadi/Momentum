import React from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import ArenaConsistencyView from '../../components/analytics/ArenaConsistencyView';

const ProjectConsistencyPage = () => {
    const { projectId } = useParams();
    const { project } = useOutletContext();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-textMain">{project?.name || 'Arena'} Consistency</h1>
                <p className="text-textSub text-sm mt-1">Consistency Heatmap and Activity Metrics for this Arena</p>
            </div>

            <ArenaConsistencyView projectId={projectId} projectName={project?.name} />
        </div>
    );
};

export default ProjectConsistencyPage;
