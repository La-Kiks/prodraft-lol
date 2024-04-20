import dotenv from "dotenv"
import fastify from "fastify"
import fastifyCors from '@fastify/cors'
import fastifyIO from "fastify-socket.io";
import { Server } from "socket.io" // to fix io decorator ts error
import closeWithGrace from 'close-with-grace'
import { RedisDatabase } from "./actions/database"
import { LocalData } from "./actions/localbase"
import { DraftGame } from "./actions/playing"
import { DraftPayload } from "./actions/type"
import { DraftInfos, RoomInfos, schClick, schReadyCheck, schValidate, schemaDraft, schemaOnClick, schemaRoomId, schemaRoomReady } from "./actions/schema"
import { DefaultEventsMap } from "socket.io/dist/typed-events"
import { log } from "console";
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
            socket.on('new:room', (ROOM_ID: string) => {
                socket.join(ROOM_ID)


                // Check if room exits to send the current state of the room
                const room = getRoom(ROOM_ID)
                if (room) {
                    console.log('Room exist, sending state to :', ROOM_ID)
                    const state = room.getState()
                    app.io.to(ROOM_ID).emit(`state:${ROOM_ID}`, state)

                    // TIMER for ROOM
                    if (DRAFT_TIMER[ROOM_ID]) {
                        console.log("Timer exists for this room")
                        app.io.to(ROOM_ID).emit(`timer:${ROOM_ID}`, DRAFT_TIMER[ROOM_ID])
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
                        app.io.to(ROOM_ID).emit(`start:${ROOM_ID}`)
                        DRAFT.countdown(60, (value) => {
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
                    DRAFT.countdown(60, (value) => {
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
                    DRAFT.countdown(60, (value) => {
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
                        app.io.to(ROOM_ID).emit(`start:${ROOM_ID}`)
                        DRAFT.countdown(60, (value) => {
                            DRAFT_TIMER[ROOM_ID] = value
                        })
                    }
                } catch (e) {
                    console.error('ready:red error', e)
                }
            })


            socket.on('disconnect', () => {
                console.log('Disconnected')
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
            console.log("shutting down")
        })
        console.log(`Server started at http://${HOST}:${PORT}`)
    } catch (e) {
        console.error(e)
        process.exit(1)
    }
}

main();