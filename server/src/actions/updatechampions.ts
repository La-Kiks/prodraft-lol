import path from "path"
import { DownloadFailed } from "../../errors/downloadFailedError"
import { existsSync, readFileSync, writeFileSync } from "fs"
import { urlGen } from "./urlGenerator"
import { RedisDatabase, Champion } from "./database"
import { StringDecoder } from "string_decoder"
import { stringify } from "querystring"

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
        let i: number = 0

        Object.keys(data.data).forEach(champion => {
            i++
            const { name, key, tags } = data.data[champion]
            const id = String(i)
            const lol_id = key
            const champ_name = name
            const tagsJoint = typeof tags === "string" ? tags : Object.values(tags).join(", ");
            newData[champion] = { id, lol_id, name: champ_name, alt_name: "", tags: tagsJoint, champ_sq: "", champ_ct: "", pick_v: "", ban_v: "" };
        })
        return newData
    }

    addImages(data: Champion) {



    }

    addUrlToChampion(champion: Champion, url: string): Champion {
        return { ...champion, champ_sq: url }
    }


}