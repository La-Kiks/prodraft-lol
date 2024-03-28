import dotenv from "dotenv"
import Redis from 'ioredis'

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

    async addChampion(champion: Champion): Promise<void> {
        await this.client.hmset(
            `champion:${champion.id}`,
            'lol_id', champion.lol_id,
            'name', champion.name,
            'alt_name', champion.alt_name,
            'tags', champion.tags,
            'champ_sq', champion.champ_sq,
            'champ_ct', champion.champ_ct,
            'pick_v', champion.pick_v,
            'ban_v', champion.ban_v)
    }

    async getChampion(id: string): Promise<Champion | null> {
        const championData = await this.client.hgetall(`champion:${id}`);
        if (!championData) return null;
        return {
            id,
            lol_id: championData.lol_id,
            name: championData.name,
            alt_name: championData.alt_name,
            tags: championData.tags,
            champ_sq: championData.champ_sq,
            champ_ct: championData.champ_ct,
            pick_v: championData.pick_v,
            ban_v: championData.ban_v
        };
    }

    async deleteChampion(id: string): Promise<void> {
        await this.client.del(`champion:${id}`);
    }

}