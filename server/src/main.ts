import dotenv from "dotenv"
import fastify from "fastify"
import fastifyCors from '@fastify/cors'
import fastifySocketIO from "fastify-socket.io"
import { Server } from "socket.io" // to fix io decorator ts error
import Redis from 'ioredis'
import closeWithGrace from 'close-with-grace'
import { RedisDatabase, Champion } from "./actions/database"
import { updateChampions } from "./actions/updatechampions"
import { Data } from "ws"
import { LocalData } from "./actions/localbase"


dotenv.config();

const PORT = parseInt(process.env.PORT || '3001', 10) // For the SERVER ; avoid conflict with 3000
const HOST = process.env.HOST || '0.0.0.0'
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000'; // For the UI
const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL
const DATACHAMP = new LocalData()
// Updata my champions json if version changed
DATACHAMP.createJson()


// Fixing io decorator typescript error
declare module "fastify" {
    interface FastifyInstance {
        io: Server<{ hello: string }>;
    }
}

if (!UPSTASH_REDIS_REST_URL) {
    console.error("Missing UPSTRASH_REDIS_REST_URL")
    process.exit(1)
}


const publisher = new Redis(UPSTASH_REDIS_REST_URL)
const subscriber = new Redis(UPSTASH_REDIS_REST_URL)

async function buildServer() {
    const app = fastify();
    const champData = await DATACHAMP.getAllChampions()

    await app.register(fastifyCors, {
        origin: CORS_ORIGIN,
    })

    await app.register(fastifySocketIO);


    app.io.on('connection', (socket: any) => {
        console.log('Connected')
        const id = Math.random().toString(21).slice(5)
        socket.emit('roomId', id)
        console.log(id)

        socket.on('draftpage', () => {
            socket.emit('champdata', champData)
            console.log('Champ data sent')
        })


        socket.on('disconnect', () => {
            console.log('Disconnected')
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
            console.log(" shutting down ")
        })
        console.log(`Server started at http://${HOST}:${PORT}`)
    } catch (e) {
        console.error(e)
        process.exit(1)
    }
}

main();