import path from "path"
import { DownloadFailed } from "../errors/downloadFailedError"
import { existsSync, fstat, readFileSync, writeFileSync } from "fs"
import { urlGen } from "./urlGenerator"
import { RedisDatabase, Champion } from "./database"
import { StringDecoder } from "string_decoder"
import { stringify } from "querystring"
import { RecordNotFoundError } from "../errors/recordNotFoundError"

// export interface Champion {
//     id: string;
//     lol_id: string;
//     name: string;
//     alt_name: string;
//     tags: string;
//     champ_sq: string;
//     champ_ct: string;
//     pick_v: string;
//     ban_v: string;
// }


export class updateChampions {

    async dlChampions() {
        try {
            const filePath = path.join(__dirname, 'version.txt')
            const fileContent = readFileSync(filePath, "utf-8")
            const version = fileContent.trim()
            const response = await fetch(`https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion.json`)
            const data = await response.json()
            return data
        } catch (e) {
            console.error(e)
            throw new DownloadFailed("DL failed : champions")
        }
    }

    parseChampData(data: { data: { [x: string]: { name: any; key: any; tags: any } } }) {
        const newData: { [key: string]: Champion } = {}
        Object.keys(data.data).forEach(champion => {
            const { name, key, tags } = data.data[champion]
            const lol_id = key
            const champ_name = name
            const tagsJoint = typeof tags === "string" ? tags : Object.values(tags).join(", ");
            newData[champion] = { lol_id, name: champ_name, alt_name: "", tags: tagsJoint, champ_sq: "", champ_ct: "", pick_v: "", ban_v: "" };
        })
        return newData
    }

    async addImages(data: { [key: string]: Champion }) {
        const newLinks = new urlGen()
        for (const key in data) {
            if (data.hasOwnProperty(key)) {
                const champion = data[key];
                let champUrlSq = newLinks.genSquareImg(key.replace(/\s/g, ""))
                const champUrlCt = newLinks.genBackgImg(champion.lol_id)
                const voiceUrlP = newLinks.genPickVoice(champion.lol_id)
                const voiceUrlB = newLinks.genBanVoice(champion.lol_id)
                try {
                    // Handling exceptions where URL follow an alternate pattern
                    const response = await fetch(champUrlSq)
                    if (!response.ok) {
                        champUrlSq = newLinks.genSquareImgAlt(key.replace(/\s/g, ""))
                    }
                } catch (e) {
                    console.error(e)
                    throw new RecordNotFoundError('Error adding images')
                }
                champion.champ_sq = champUrlSq
                champion.champ_ct = champUrlCt
                champion.pick_v = voiceUrlP
                champion.ban_v = voiceUrlB
            }
        }
        // Handling exceptions where URL follow an unique pattern
        const champList = {
            Anivia:
                "https://raw.communitydragon.org/latest/game/assets/characters/anivia/hud/cryophoenix_square.png",

            Blitzcrank:
                "https://raw.communitydragon.org/latest/game/assets/characters/blitzcrank/hud/steamgolem_square.png",

            Chogath:
                "https://raw.communitydragon.org/latest/game/assets/characters/chogath/hud/greenterror_square.png",

            Orianna:
                "https://raw.communitydragon.org/latest/game/assets/characters/orianna/hud/oriana_square.png",

            Nunu:
                "https://raw.communitydragon.org/latest/game/assets/characters/nunu/hud/nunu_square.png",

            Rammus:
                "https://raw.communitydragon.org/latest/game/assets/characters/rammus/hud/armordillo_square.png",

            Skarner:
                "https://raw.communitydragon.org/latest/game/assets/characters/skarner/hud/skarner_square_0.skarner_rework.png",

            Smolder:
                "https://raw.communitydragon.org/latest/game/assets/characters/smolder/hud/smolder_square_0.smolder.png",

            Zilean:
                "https://raw.communitydragon.org/latest/game/assets/characters/zilean/hud/chronokeeper_square.png",
        }
        for (const champName in champList) {
            if (champList.hasOwnProperty(champName)) {
                if (data.hasOwnProperty(champName)) {
                    data[champName].champ_sq = champList[champName as keyof typeof champList]
                }
            }
        }

        return data
    }

    // Unique Exceptions 
    addUnique(data: { [key: string]: Champion }) {
        data.Helmet = {
            lol_id: "0",
            name: "Helmet",
            alt_name: "",
            tags: "",
            champ_sq: "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-collections/global/default/icon-helmet.png",
            champ_ct: "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-collections/global/default/icon-helmet.png",
            pick_v: "",
            ban_v: ""
        }
        return data
    }

    // Need to add alt_name list & maybe fix tags

    // Not used but looks cool
    addUrlToChampionSq(champion: Champion, url: string): Champion {
        return { ...champion, champ_sq: url }
    }

    // Create the data champions as Object
    async createChampionsData() {
        const champObject = new updateChampions()
        const dlData = await champObject.dlChampions()
        const parsedData = champObject.parseChampData(dlData)
        const imgData = await champObject.addImages(parsedData)
        champObject.addUnique(imgData)
        return imgData
    }

    // Create a custom JSON file : champions.json
    createChampionsJson(data: { [key: string]: Champion }) {
        const filePath = path.join(__dirname, 'champions.json')
        const jsonString = JSON.stringify(data, null, 2)
        return writeFileSync(filePath, jsonString)
    }

    // championList only usefull to look through Redis Database
    // Create the champion list array using the champions.json file locally created
    championListLocal() {
        try {
            const filePath = path.join(__dirname, 'champions.json')
            const jsonData = readFileSync(filePath, "utf-8")
            const data = JSON.parse(jsonData)
            let champArray: Array<string> = []
            let i: number = 0
            Object.keys(data).forEach(champion => {
                i++
                const { name } = data[champion]
                champArray[i] = name
            })
            // Adding Helmet at start & deleting it from last position
            champArray[0] = "Helmet"
            champArray.pop()
            return champArray

        } catch (e) {
            console.error(e)
            throw new RecordNotFoundError("Did not find the local file : champions.json")
        }
    }

    // Create the champion list array using the file from online using DL function
    async championListWithDl() {
        const data = await this.dlChampions()
        let champArray: Array<string> = []
        let i: number = 0
        Object.keys(data.data).forEach(champion => {
            i++
            const { name } = data.data[champion]
            champArray[i] = name
        })
        champArray[0] = "Helmet"
        return champArray
    }

}