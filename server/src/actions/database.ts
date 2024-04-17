// Usefull for scaling with Upstash Redis.
import dotenv from "dotenv"
import Redis from 'ioredis'
import { updateChampions } from "./updatechampions";
import { rejects } from "assert";
import { resolve } from "path";
import { escape } from "querystring";
import { Champion, DraftPayload } from "./type"

dotenv.config();

const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL



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

    async createDBChampions() {
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
    async deleteAll() {
        try {
            await this.client.flushall();
            console.log('All keys deleted from Redis.');
        } catch (error) {
            console.error('Error flushing all keys from Redis:', error);
        } finally {
            this.client.quit();
        }
    }

    /**  
     * Get a champion by name - works only if the data is stored as JSON.
     * @param {string} name - The name of the champion.
     * @returns {Promise<Champion | null>} - A promise with data about the champs if it exists.
    */
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

    // Free Tier Redis allow only one "DB" at a time ; here is the DB to save the ROOMS logic (ready etc...)

    /**  
   * Get a champion by name - works only if the data is stored as JSON.
   * @param {string} roomId - ID string is mandatory
   * @param {[boolean, boolean]} roomStatus - Array of booleans
   * @returns {Promise<void>} - A void promise if it worked else an error.
  */
    async addRoom(roomId: string, roomStatus: [boolean, boolean]): Promise<void> {
        const statusString = JSON.stringify(roomStatus)
        await this.client.set(roomId, statusString, (err, rep) => {
            if (err) {
                console.error('Error saving room status to Redis', err)
            } else {
                console.log('Room :', rep)
            }
        })
    }

    /**  
   * Get a champion by name - works only if the data is stored as JSON.
   * @param {string} roomId - ID string
   * @returns {Promise<[boolean, boolean] | false>} - If the roomId exists returns an array else return false
  */
    async getRoom(roomId: string): Promise<[boolean, boolean] | false> {
        try {
            const exists = await this.client.exists(roomId);
            if (exists) {
                console.log(`Room: ${roomId} already exists in the database.`);
                const rep = await new Promise<string | null | undefined>((resolve, reject) => {
                    this.client.get(roomId, (err, rep) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(rep);
                        }
                    });
                });
                if (rep === null || rep === undefined) {
                    console.log('Data from DB is null or undefined :', rep);
                    return false;
                } else {
                    const roomStatus = JSON.parse(rep) as [boolean, boolean];
                    return roomStatus;
                }
            } else {
                console.log("There is no such room :", roomId);
                return false;
            }
        } catch (e) {
            console.log('Error fetching room ID data', e);
            return false;
        }
    }

    /**  
* Get a champion by name - works only if the data is stored as JSON.
* @param {DraftPayload} payload - ID string is mandatory
* @returns {Promise<DraftPayload | false>} - A promise with the DraftPayload or false if error.
*/
    async getDrafting(payload: DraftPayload): Promise<DraftPayload | false> {
        try {
            const id = "DRAFT:" + payload['ROOM_ID']
            const exists = await this.client.exists(id);
            if (exists) {
                const rep = await new Promise<string | null | undefined>((resolve, reject) => {
                    this.client.get(id, (err, rep) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(rep);
                        }
                    });
                });
                if (rep === null || rep === undefined) {
                    console.log('Data from DB is null or undefined :', rep);
                    return false;
                } else {
                    const roomStatus = JSON.parse(rep) as DraftPayload;
                    return roomStatus;
                }
            } else {
                console.log("There is no such room :", payload['ROOM_ID']);
                return false;
            }
        } catch (e) {
            console.log('Error fetching draft content', e)
            return false
        }
    }

    /**  
    * Get a champion by name - works only if the data is stored as JSON.
    * @param {DraftPayload} payload - Draft object containing all the infos of the draft.
    * @returns {Promise<void>} - A void promise if it worked else an error.
    */
    async addDrafting(payload: DraftPayload): Promise<void> {
        const payloadString = JSON.stringify(payload)
        const roomId = payload['ROOM_ID']
        await this.client.set(roomId, payloadString, (err, rep) => {
            if (err) {
                console.error('Error saving room status to Redis', err)
            } else {
                console.log('Room :', rep)
            }
        })
    }

}
