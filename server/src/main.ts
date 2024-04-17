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
import { schemaDraft, schemaOnClick, schemaRoomId, schemaRoomReady } from "./actions/schema"
import { DefaultEventsMap } from "socket.io/dist/typed-events"
import { log } from "console";


dotenv.config();

// SERVER VARIABLES
const PORT = parseInt(process.env.PORT || '3001', 10) // For the SERVER ; avoid conflict with 3000
const HOST = process.env.HOST || '0.0.0.0'
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000'; // For the UI
const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL
const DATACHAMP = new LocalData()
type RoomStatus = [boolean, boolean]
const roomsReady: { [roomID: string]: RoomStatus } = {}
const DRAFT_DATA: { [roomID: string]: DraftPayload } = {}
const DRAFT_TIMER: { [roomID: string]: number } = {}
const DRAFT = new DraftGame()
const DEFAULT_DRAFT: DraftPayload = {
    ROOM_ID: '00000',
    phase: 'PLAYING',
    pturn: 'blue',
    idx: 0,
    champs: {
        BB1: '', RB1: '',
        BB2: '', RB2: '',
        BB3: '', RB3: '',

        BP1: '',
        RP1: '', RP2: '',
        BP2: '', BP3: '',
        RP3: '',

        RB4: '', BB4: '',
        RB5: '', BB5: '',

        RP4: '',
        BP4: '', BP5: '',
        RP5: ''
    }
}
//const SPEC_COUNT: { [roomID: string]: number }





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

                // Check if the lobby already exits (F5 handle)
                if (roomsReady[ROOM_ID]) {
                    console.log("Room exist for :", ROOM_ID, "state", roomsReady[ROOM_ID])
                    if (DRAFT_DATA[ROOM_ID]) {
                        console.log("DRAFT DATA exists for this room.")
                        const myDraftData = DRAFT_DATA[ROOM_ID]
                        app.io.to(ROOM_ID).emit(`state:${ROOM_ID}`, myDraftData)
                    }

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

            socket.on('ready:blue', async ({ ROOM_ID, ready }: { ROOM_ID: string, ready: boolean }) => {
                try {
                    schemaRoomReady.parse({ ROOM_ID, ready })
                    if (!roomsReady[ROOM_ID]) {
                        roomsReady[ROOM_ID] = [false, false]
                    }
                    roomsReady[ROOM_ID][0] = ready
                    console.log("ready:blue", roomsReady[ROOM_ID])
                    if (roomsReady[ROOM_ID][0] == true && roomsReady[ROOM_ID][1] == true) {
                        app.io.to(ROOM_ID).emit(`start:${ROOM_ID}`)
                        // initiate Draft object
                        if (!DRAFT_DATA[ROOM_ID]) {
                            DRAFT_DATA[ROOM_ID] = DEFAULT_DRAFT
                            console.log("Initiate DRAFTDATA for :", ROOM_ID)
                        }
                        // initiate the DRAFT_TIMER
                        DRAFT.countdown(60, (value) => {
                            DRAFT_TIMER[ROOM_ID] = value
                        })
                    }
                } catch (e) {
                    console.log('Type error')
                    return
                }
            })

            socket.on('click:blue', async (clickObject: object) => {
                try {
                    schemaOnClick.parse(clickObject)
                    const { ROOM_ID, slotName, slotUrl } = clickObject as { ROOM_ID: string, slotName: string, slotUrl: string }
                    app.io.to(ROOM_ID).emit(`click:blue:${ROOM_ID}`, slotName, slotUrl)
                } catch (e) {
                    console.log('click:blue error')
                    return
                }
            })

            socket.on('validate:blue', async (payload: DraftPayload) => {
                try {
                    // schemaOnClick.parse(payload)
                    const ROOM_ID = payload['ROOM_ID']
                    const newPayload: DraftPayload = DRAFT.draftStep(payload) as DraftPayload
                    app.io.to(ROOM_ID).emit(`validate:${ROOM_ID}`, newPayload)
                    if (DRAFT_DATA[ROOM_ID]) {
                        DRAFT_DATA[ROOM_ID] = newPayload
                        console.log('Updating DRAFT_DATA for :', ROOM_ID)
                    }
                    // Reset the timer on validate
                    DRAFT.countdown(60, (value) => {
                        DRAFT_TIMER[ROOM_ID] = value
                    })
                } catch (e) {
                    console; log('validate:blue error')
                    return
                }
            })


            socket.on('validate:red', async (payload: DraftPayload) => {
                try {
                    // schemaOnClick.parse(payload)
                    const ROOM_ID = payload['ROOM_ID']
                    const newPayload: DraftPayload = DRAFT.draftStep(payload) as DraftPayload
                    app.io.to(ROOM_ID).emit(`validate:${ROOM_ID}`, newPayload)
                    if (DRAFT_DATA[ROOM_ID]) {
                        DRAFT_DATA[ROOM_ID] = newPayload
                        console.log('Updating DRAFT_DATA for :', ROOM_ID)
                    }
                    // Reset the timer on validate
                    DRAFT.countdown(60, (value) => {
                        DRAFT_TIMER[ROOM_ID] = value
                    })
                } catch (e) {
                    console; log('validate:red error')
                    return
                }
            })

            socket.on('click:red', async (clickObject: object) => {
                try {
                    schemaOnClick.parse(clickObject)
                    const { ROOM_ID, slotName, slotUrl } = clickObject as { ROOM_ID: string, slotName: string, slotUrl: string }
                    app.io.to(ROOM_ID).emit(`click:red:${ROOM_ID}`, slotName, slotUrl)
                } catch (e) {
                    console.log('click:red error')
                    return
                }
            })

            socket.on('ready:red', async ({ ROOM_ID, ready }: { ROOM_ID: string, ready: boolean }) => {
                try {
                    schemaRoomReady.parse({ ROOM_ID, ready })
                    if (!roomsReady[ROOM_ID]) {
                        roomsReady[ROOM_ID] = [false, false]
                    }
                    roomsReady[ROOM_ID][1] = ready
                    console.log("ready:red", roomsReady[ROOM_ID])
                    if (roomsReady[ROOM_ID][0] == true && roomsReady[ROOM_ID][1] == true) {
                        app.io.to(ROOM_ID).emit(`start:${ROOM_ID}`)
                        // initiate Draft object
                        if (!DRAFT_DATA[ROOM_ID]) {
                            DRAFT_DATA[ROOM_ID] = DEFAULT_DRAFT
                            console.log("Initiate DRAFTDATA for :", ROOM_ID)
                        }
                        // initiate the DRAFT_TIMER
                        DRAFT.countdown(60, (value) => {
                            DRAFT_TIMER[ROOM_ID] = value
                        })
                    }
                } catch (e) {
                    console.log('Type error')
                    return
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