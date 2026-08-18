const WebSocket = require("ws");

const interviewSessions = new Map(); // moved out of the function — now module-scoped, so endSession() below can reach it

module.exports = (io) => {

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

    if (!OPENAI_API_KEY) {
        console.warn(
            "OPENAI_API_KEY is not set — realtime transcription will fail to authenticate."
        );
    }

    const REALTIME_WS_URL = "wss://api.openai.com/v1/realtime?intent=transcription";
    const TRANSCRIPTION_MODEL = "gpt-4o-transcribe";
    const INPUT_SAMPLE_RATE = 24000;

    function connectRealtimeTranscription(interviewId, session) {

        const ws = new WebSocket(REALTIME_WS_URL, {
            headers: {
                Authorization: `Bearer ${OPENAI_API_KEY}`,
            },
        });

        ws.on("open", () => {

            console.log(`Realtime transcription connected: ${interviewId}`);

            ws.send(JSON.stringify({
                type: "session.update",
                session: {
                    type: "transcription",
                    audio: {
                        input: {
                            format: {
                                type: "audio/pcm",
                                rate: INPUT_SAMPLE_RATE,
                            },
                            noise_reduction: {
                                type: "near_field",
                            },
                            transcription: {
                                model: TRANSCRIPTION_MODEL,
                                language: "en",
                                prompt: "English interview with Indian names. Use Latin alphabet."
                            },
                            turn_detection: {
                                type: "server_vad",
                                threshold: 0.6,
                                prefix_padding_ms: 300,
                                silence_duration_ms: 1000,
                            },
                        },
                    },
                },
            }));

        });

        ws.on("message", (raw) => {

            let event;

            try {
                event = JSON.parse(raw.toString());
            } catch (err) {
                console.error(`Failed to parse realtime event [${interviewId}]:`, err);
                return;
            }

            if (event.type === "conversation.item.input_audio_transcription.delta") {

                io.to(interviewId).emit("transcript", {
                    transcript: event.delta,
                    fullTranscript: session.transcript + event.delta,
                    partial: true,
                    questionSeq: session.questionSeq,
                });

                return;
            }

            if (event.type === "conversation.item.input_audio_transcription.completed") {

                session.transcript += event.transcript + " ";

                io.to(interviewId).emit("transcript", {
                    transcript: event.transcript,
                    fullTranscript: session.transcript,
                    partial: false,
                    questionSeq: session.questionSeq,
                });

                io.to(interviewId).emit("transcript_commit_complete");
                return;
            }

            if (event.type === "error") {

                if (event.error?.code === "input_audio_buffer_commit_empty") {
                    io.to(interviewId).emit("transcript_commit_complete");
                }
                return;
            }

        });

        ws.on("error", (err) => {
            console.error(`Realtime WS error [${interviewId}]:`, err);
        });

        ws.on("close", (code, reason) => {
            console.log(`Realtime WS closed [${interviewId}]:`, code, reason?.toString());
        });

        return ws;

    }

    // --- Alternative for gpt-realtime-whisper (manual commit) ---
    // setInterval(() => {
    //     for (const session of interviewSessions.values()) {
    //         if (session.ws && session.ws.readyState === WebSocket.OPEN) {
    //             session.ws.send(JSON.stringify({ type: "input_audio_buffer.commit" }));
    //         }
    //     }
    // }, 1000);

    io.on("connection", (socket) => {

        console.log("Socket connected:", socket.id);

        socket.on("join_interview", ({ interviewId }) => {

            socket.join(interviewId);

            socket.data.interviewId = interviewId;

            if (!interviewSessions.has(interviewId)) {

                const session = {
                    transcript: "",
                    ws: null,
                    questionSeq: 0,
                };

                session.ws = connectRealtimeTranscription(interviewId, session);

                interviewSessions.set(interviewId, session);

            }

            socket.emit("joined_interview", {
                interviewId,
            });

        });

        socket.on("start_question", () => {

            const interviewId = socket.data.interviewId;

            const session = interviewSessions.get(interviewId);

            if (session) {
                session.transcript = "";
                session.questionSeq += 1;
            }

        });

        socket.on("commit_audio", () => {

            const interviewId = socket.data.interviewId;

            const session = interviewSessions.get(interviewId);

            if (!session?.ws || session.ws.readyState !== WebSocket.OPEN) {
                return;
            }

            try {
                session.ws.send(JSON.stringify({ type: "input_audio_buffer.commit" }));
            } catch (err) {
                console.error(`Manual commit failed [${interviewId}]:`, err);
            }

        });

        socket.on("audio_chunk", (pcm) => {

            const interviewId = socket.data.interviewId;

            const session = interviewSessions.get(interviewId);

            if (!session || !session.ws || session.ws.readyState !== WebSocket.OPEN) {
                return;
            }

            const base64 = Buffer.from(pcm).toString("base64");

            session.ws.send(JSON.stringify({
                type: "input_audio_buffer.append",
                audio: base64,
            }));

        });

        // NOTE: teardown (closing the OpenAI ws + deleting from
        // interviewSessions) used to happen right here on every disconnect.
        // That's gone now — connectionGuard.js owns a 15s grace timer, so a
        // dropped wifi connection doesn't instantly nuke the transcript and
        // force a brand-new OpenAI session on reconnect. This handler just
        // logs; endSession() below is what actually tears things down, and
        // it's only called once the grace period genuinely expires.
        socket.on("disconnect", () => {
            console.log(socket.id, "disconnected");
        });

    });

};

// Called by connectionGuard.js once the 15s reconnect grace period expires
// without the candidate coming back.
function endSession(interviewId) {
    const session = interviewSessions.get(interviewId);

    if (session?.ws) {
        session.ws.close();
    }

    interviewSessions.delete(interviewId);
}

module.exports.endSession = endSession;