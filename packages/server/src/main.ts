import dotenv from "dotenv"
import fastify from "fastify"
import fastifyCors from '@fastify/cors'
import fastifyIO from "fastify-socket.io";
import { Server } from "socket.io" // to fix io decorator ts error
import closeWithGrace from 'close-with-grace'
import { DraftGame } from "./actions/playing"
import { schClick, schReadyCheck, schRoomID, schValidate } from "./actions/schema"
import { DefaultEventsMap } from "socket.io/dist/typed-events"
import { Room } from "./model/room";


dotenv.config();

// SERVER VARIABLES
const PORT = parseInt(process.env.PORT || '8000', 10) // For the SERVER ; avoid conflict with 3000
const HOST = process.env.HOST || 'localhost'
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000'; // For the UI
const DRAFT_TIMER: { [roomID: string]: number } = {}
const DRAFT = new DraftGame()
const ROOMS: { [ROOM_ID: string]: Room } = {}

function getOrCreateRoom(roomId: string): Room {
    if (!ROOMS[roomId]) {
        ROOMS[roomId] = new Room(roomId)
    }
    return ROOMS[roomId]
}

function getRoom(roomId: string): Room | undefined {
    return ROOMS[roomId]
}

function deleteRoom(roomId: string) {
    if (ROOMS.hasOwnProperty(roomId)) {
        delete ROOMS[roomId]
    }
}

function findRoomIdBySocketId(socketId: string): string[] | undefined {
    for (const roomId in ROOMS) {
        if (ROOMS.hasOwnProperty(roomId)) {
            const room = ROOMS[roomId];
            if (room.spectatorsList.includes(socketId)) {
                return (['spec', roomId]);
            }
            if (room.bluesList.includes(socketId)) {
                return (['blue', roomId]);
            }
            if (room.redsList.includes(socketId)) {
                return (['red', roomId]);
            }
        }
    }
    return undefined;
}

//Fixing io decorator typescript error
declare module "fastify" {
    export interface FastifyInstance {
        io: Server<
            any,
            any,
            DefaultEventsMap,
            any
        >;
    }
}


//const DB = new RedisDatabase()


async function buildServer() {

    const app = fastify();

    await app.register(fastifyCors, {
        origin: CORS_ORIGIN,
    })

    await app.register(fastifyIO);

    app.ready().then(() => {
        app.io.on('connection', (socket: any) => {

            // Generate the ID on the base page
            socket.on('join server', () => {
                console.log('Connected')
                const id = Math.random().toString(21).slice(5).toString()
                socket.emit('roomId', id)
            })

            // Check the ROOM ID and give back state if it exits
            socket.on('new:room', (ROOM_ID: unknown) => {
                const roomId = schRoomID.parse(ROOM_ID)
                socket.join(roomId)

                // Check if room exits to send the current state of the room
                const room = getRoom(roomId)
                if (room) {
                    console.log('Room exist, sending state to :', roomId)
                    const state = room.getState()
                    app.io.to(roomId).emit(`state:${roomId}`, state)
                    const specount = room.specCount()
                    if (specount) {
                        app.io.to(roomId).emit(`specators:count:${roomId}`, specount)
                    }
                    const bluecount = room.blueCount()
                    if (bluecount) {
                        app.io.to(roomId).emit(`blues:count:${roomId}`, bluecount)
                    }
                    const redcount = room.redCount()
                    if (redcount) {
                        app.io.to(roomId).emit(`reds:count:${roomId}`, redcount)
                    }
                    // TIMER for ROOM
                    if (DRAFT_TIMER[roomId]) {
                        console.log("Timer exists for this room")
                        app.io.to(roomId).emit(`timer:${roomId}`, DRAFT_TIMER[roomId])
                    }
                }
            })

            socket.on('spectate:enter', (ROOM_ID: unknown) => {
                const roomId = schRoomID.parse(ROOM_ID)
                const room = getOrCreateRoom(roomId)
                room.specCountIncrease(socket.id)
                const specount = room.specCount()
                if (specount) {
                    app.io.to(roomId).emit(`specators:count:${roomId}`, specount)
                }

            })
            socket.on('blue:enter', (ROOM_ID: unknown) => {
                const roomId = schRoomID.parse(ROOM_ID)
                const room = getOrCreateRoom(roomId)
                room.blueCountIncrease(socket.id)
                const bluecount = room.blueCount()
                if (bluecount) {
                    app.io.to(roomId).emit(`blues:count:${roomId}`, bluecount)
                }

            })
            socket.on('red:enter', (ROOM_ID: unknown) => {
                const roomId = schRoomID.parse(ROOM_ID)
                const room = getOrCreateRoom(roomId)
                room.redCountIncrease(socket.id)
                const redcount = room.redCount()
                if (redcount) {
                    app.io.to(roomId).emit(`reds:count:${roomId}`, redcount)
                }

            })

            socket.on('disconnect', () => {
                const tempArray = findRoomIdBySocketId(socket.id)
                if (tempArray) {
                    const player = tempArray[0]
                    const roomId = tempArray[1]
                    if (roomId) {
                        const room = getOrCreateRoom(roomId)
                        if (player === 'spec') {
                            room.specCountDecrease(socket.id)
                            const specount = room.specCount()
                            app.io.to(roomId).emit(`specators:count:${roomId}`, specount)
                        }
                        if (player === 'blue') {
                            room.blueCountDecrease(socket.id)
                            const blueount = room.blueCount()
                            app.io.to(roomId).emit(`blues:count:${roomId}`, blueount)
                        }
                        if (player === 'red') {
                            room.redCountDecrease(socket.id)
                            const redount = room.redCount()
                            app.io.to(roomId).emit(`reds:count:${roomId}`, redount)
                        }
                        const activePlayers = room.allPlayersCount()
                        if (activePlayers === 0) {
                            console.log(roomId, ' will be deleted after 15min')
                            setTimeout(() => {
                                deleteRoom(roomId)
                            }, 900000) // 15 min
                        }
                    }

                }

            })


            //
            // #1 Ready check : get ready check from BLUE + RED then send back the START
            // #2 On click send the champ overviewed
            // #3 Validate the choice, save the draft server side & send it to the room
            //

            socket.on('ready:blue', async (payload: unknown) => {
                try {
                    const { ROOM_ID, ready } = schReadyCheck.parse(payload)
                    const room = getOrCreateRoom(ROOM_ID)
                    room.setBlueSideReady(ready)
                    console.log('ready:blue')

                    if (room.isReady()) {
                        room.isPlaying()
                        app.io.to(ROOM_ID).emit(`start:${ROOM_ID}`)
                        DRAFT.countdown(30, (value) => {
                            DRAFT_TIMER[ROOM_ID] = value
                        })
                    }
                } catch (e) {
                    console.error('ready:blue error', e)
                }
            })

            socket.on('click:blue', async (payload: unknown) => {
                try {
                    const { ROOM_ID, idx, currentChamp } = schClick.parse(payload)
                    app.io.to(ROOM_ID).emit(`click:blue:${ROOM_ID}`, idx, currentChamp)
                } catch (e) {
                    console.error('click:blue error', e)
                }
            })

            socket.on('validate:blue', async (payload: unknown) => {
                try {
                    const { ROOM_ID, idx, currentChamp } = schValidate.parse(payload)
                    const room = getOrCreateRoom(ROOM_ID)
                    const step = room.step(idx, currentChamp)
                    if (step.phase === 'PLAYING') {
                        app.io.to(ROOM_ID).emit(`validate:${ROOM_ID}`, { idx: step.newIndex, pturn: step.pturn, phase: step.phase })
                    } else if (step.phase === 'OVER') {
                        app.io.to(ROOM_ID).emit(`validate:${ROOM_ID}`, { phase: step.phase })
                    }
                    // Reset the timer on validate
                    DRAFT.countdown(30, (value) => {
                        DRAFT_TIMER[ROOM_ID] = value
                    })
                } catch (e) {
                    console.error('validate:blue error', e)
                    return
                }
            })

            socket.on('validate:red', async (payload: unknown) => {
                try {
                    const { ROOM_ID, idx, currentChamp } = schValidate.parse(payload)
                    const room = getOrCreateRoom(ROOM_ID)
                    const step = room.step(idx, currentChamp)
                    if (step.phase === 'PLAYING') {
                        app.io.to(ROOM_ID).emit(`validate:${ROOM_ID}`, { idx: step.newIndex, pturn: step.pturn, phase: step.phase })
                    } else if (step.phase === 'OVER') {
                        app.io.to(ROOM_ID).emit(`validate:${ROOM_ID}`, { phase: step.phase })
                    }
                    // Reset the timer on validate
                    DRAFT.countdown(30, (value) => {
                        DRAFT_TIMER[ROOM_ID] = value
                    })
                } catch (e) {
                    console.error('validate:red error', e)
                    return
                }
            })

            socket.on('click:red', async (payload: unknown) => {
                try {
                    const { ROOM_ID, idx, currentChamp } = schClick.parse(payload)
                    app.io.to(ROOM_ID).emit(`click:red:${ROOM_ID}`, idx, currentChamp)
                } catch (e) {
                    console.error('click:red error', e)
                    return
                }
            })

            socket.on('ready:red', async ({ ROOM_ID, ready }: { ROOM_ID: string, ready: boolean }) => {
                try {
                    schReadyCheck.parse({ ROOM_ID, ready })
                    const room = getOrCreateRoom(ROOM_ID)
                    room.setRedSideReady(ready)
                    console.log('ready:red')
                    if (room.isReady()) {
                        room.isPlaying()
                        app.io.to(ROOM_ID).emit(`start:${ROOM_ID}`)
                        DRAFT.countdown(30, (value) => {
                            DRAFT_TIMER[ROOM_ID] = value
                        })
                    }
                } catch (e) {
                    console.error('ready:red error', e)
                }
            })

        })

    })

    app.get('/healthcheck', async () => {
        return {
            status: "ok",
            port: PORT,
        }
    })

    return app
}

async function main() {
    const app = await buildServer();
    try {
        await app.listen({
            port: PORT,
            host: HOST,
        })
        closeWithGrace({ delay: 2000 }, async ({ signal, err }) => {
            console.error("Gracious error", err)
            console.log("shutting down")
        })
        console.log(`Server started at http://${HOST}:${PORT}`)
    } catch (e) {
        console.error(e)
        process.exit(1)
    }
}

main();