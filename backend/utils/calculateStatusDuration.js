const calculateStatusDuration = (activityLogs) => {
    let totalInProgressTime = 0;
    let totalHoldTime = 0;
    let lastTimestamp = null;
    let lastStatus = null;

    const sortedLogs = [...activityLogs].sort((a, b) => new Date(a.date) - new Date(b.date));

    sortedLogs.forEach((log) => {
        if (lastStatus && lastTimestamp) {
            const timeSpent = new Date(log.date) - new Date(lastTimestamp);

            if (lastStatus === "inprogress") {
                totalInProgressTime += timeSpent;
            } else if (lastStatus === "hold") {
                totalHoldTime += timeSpent;
            }
        }

        lastTimestamp = log.date;
        lastStatus = log.currentStatus;
    });

    return {
        inprogress: Math.round(totalInProgressTime / 60000), // Convert to minutes
        hold: Math.round(totalHoldTime / 60000),
    };
};

export {calculateStatusDuration}