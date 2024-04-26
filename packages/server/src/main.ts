import dotenv from "dotenv"
import fastify from "fastify"
import fastifyCors from '@fastify/cors'
import fastifyIO from "fastify-socket.io";
import { Server } from "socket.io" // to fix io decorator ts error
import closeWithGrace from 'close-with-grace'
// import { RedisDatabase } from "./actions/database"
import { LocalData } from "@prodraft/common/src/localbase"
import { DraftGame } from "./actions/playing"
import { schClick, schReadyCheck, schRoomID, schValidate } from "./actions/schema"
import { DefaultEventsMap } from "socket.io/dist/typed-events"
import { Room } from "./model/room";



dotenv.config();

// SERVER VARIABLES
const PORT = parseInt(process.env.PORT || '3001', 10) // For the SERVER ; avoid conflict with 3000
const HOST = process.env.HOST || '0.0.0.0'
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000'; // For the UI
const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL
const DATACHAMP = new LocalData()
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

function findRoomIdBySocketId(socketId: string): string | undefined {
    for (const roomId in ROOMS) {
        if (ROOMS.hasOwnProperty(roomId)) {
            const room = ROOMS[roomId];
            if (room.spectatorsList.includes(socketId)) {
                return roomId;
            }
        }
    }
    return undefined;
}

// Update my champions json if version changed
DATACHAMP.createJson()


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

if (!UPSTASH_REDIS_REST_URL) {
    console.error("Missing UPSTRASH_REDIS_REST_URL")
    process.exit(1)
}

//const DB = new RedisDatabase()


async function buildServer() {

    const app = fastify();
    const champData = await DATACHAMP.getAllChampions()

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

            // Deliver the champData to the draft pages (blue red spec) to create the grid
            socket.on('draftpage', (cb: (data: any) => void) => {
                cb(champData) // call back that send champData
                console.log('Champ data sent')
            })
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

            socket.on('disconnect', () => {
                const roomId = findRoomIdBySocketId(socket.id)
                if (roomId) {
                    const room = getOrCreateRoom(roomId)
                    room.specCountDecrease(socket.id)
                    const specount = room.specCount()
                    app.io.to(roomId).emit(`specators:count:${roomId}`, specount)
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