

const RECONNECT_GRACE_PERIOD_SEC = 15; 


const disconnectTimers = new Map();

module.exports = (io, { onGraceExpired }) => {

    io.on("connection", (socket) => {

        socket.on("join_interview", ({ interviewId }) => {

            if (disconnectTimers.has(interviewId)) {
                clearTimeout(disconnectTimers.get(interviewId));
                disconnectTimers.delete(interviewId);
                socket.emit("interview-resumed");
            }

            socket.emit("reconnect-config", {
                gracePeriodSeconds: RECONNECT_GRACE_PERIOD_SEC,
            });

        });

        socket.on("disconnect", (reason) => {

            const interviewId = socket.data.interviewId;
            if (!interviewId || reason === "io server disconnect") {
                return;
            }

            if (disconnectTimers.has(interviewId)) {
                return;
            }

            const timer = setTimeout(async () => {

                try {
                    await onGraceExpired(interviewId);
                } catch (err) {
                    console.error(`onGraceExpired failed [${interviewId}]:`, err);
                }

                io.to(interviewId).emit("interview-auto-submitted");
                disconnectTimers.delete(interviewId);

            }, RECONNECT_GRACE_PERIOD_SEC * 1000);

            disconnectTimers.set(interviewId, timer);

        });

    });

};