// Usefull for scaling with Upstash Redis.
import dotenv from "dotenv"
import Redis from 'ioredis'
import { updateChampions } from "./updatechampions";

dotenv.config();

const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL


export interface Champion {
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
                // <deprecated> await this.addChampion(champion)
                await this.addChampionJson(champion)
            }
        }
        console.log("Redis Database of champions created.")
    }

    // <deprecated> Using Hashes (Order can be random) 
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

    // Using JSON Serialization : to keep the order of data
    async addChampionJson(champion: Champion): Promise<void> {
        const key = champion.name;
        const exists = await this.client.exists(key);
        if (exists) {
            console.log(`Champion : ${champion.name} already exists in the database.`);
            return;
        }
        await this.client.set(champion.name, JSON.stringify(champion))
    }

    // Can be usefull for updates ; delete all & start anew
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

    // Only if the DATA stored is JSON
    async getChampion(name: string): Promise<Champion | null> {
        const data = await this.client.get(name);
        return data ? JSON.parse(data) : null;
    }

    async getAllChampions() {
        try {
            const champObject = new updateChampions()
            const championList = champObject.championListLocal()
            // Using the local list is good if champions.json updated else can use champlistwithdl
            let championData: { [key: string]: Champion } = {};
            for (let i = 0; i < championList.length; i++) {
                let data = await this.getChampion(championList[i])
                const champion: Champion = data as Champion;
                championData[championList[i]] = champion
            }
            return championData
        } catch (e) {
            console.error('Error retrieving data from Redis', e);
        } finally {
            this.client.quit();
        }
    }

}
