import dotenv from "dotenv"
import Redis from 'ioredis'
import { updateChampions } from "./updatechampions";

dotenv.config();

const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL


export interface Champion {
    id: string;
    lol_id: string;
    name: string;
    alt_name: string;
    tags: string;
    champ_sq: string;
    champ_ct: string;
    pick_v: string;
    ban_v: string;
}

export class RedisDatabase {
    private client: Redis;


    constructor() {
        if (!UPSTASH_REDIS_REST_URL) {
            console.error("Missing UPSTRASH_REDIS_REST_URL")
            this.client = new Redis()
            return
        }
        this.client = new Redis(UPSTASH_REDIS_REST_URL)
    }

    async createDB() {
        const champObject = new updateChampions()
        const data = await champObject.createChampionsData()
        for (const key in data) {
            if (data.hasOwnProperty(key)) {
                const champion = data[key]
                await this.addChampion(champion)
            }
        }
    }

    async addChampion(champion: Champion): Promise<void> {
        const key = champion.name;
        const exists = await this.client.exists(key);
        if (exists) {
            console.log(`Champion : ${champion.name} already exists in the database.`);
            return;
        }
        await this.client.hmset(
            champion.name,
            'lol_id', champion.lol_id,
            'name', champion.name,
            'alt_name', champion.alt_name,
            'tags', champion.tags,
            'champ_sq', champion.champ_sq,
            'champ_ct', champion.champ_ct,
            'pick_v', champion.pick_v,
            'ban_v', champion.ban_v)
    }

    async deleteAllChampions() {
        try {
            await this.client.flushall();
            console.log('All keys deleted from Redis.');
        } catch (error) {
            console.error('Error flushing all keys from Redis:', error);
        } finally {
            this.client.quit();
        }
    }

    // FUNCTION TO WORK ON
    async getData() {
        try {
            // Assuming your data is stored under keys like "champion:1", "champion:2", etc.
            const championData = await this.client.hgetall('champion:1'); // Replace '1' with the specific ID you want to retrieve
            console.log(championData);
        } catch (error) {
            console.error('Error retrieving data from Redis', error);
        } finally {
            this.client.quit(); // Close the Redis connection when done
        }
    }



}