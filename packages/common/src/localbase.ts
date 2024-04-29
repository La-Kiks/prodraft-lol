// Using a local champions.json file as the "database"
import { readFileSync } from "fs";
import { UpdateChampions } from "./updatechampions";
import { versionIsUpToDate } from "./version";
import path from "path";


export class LocalData {

    async createJson() {
        const version = await versionIsUpToDate()
        if (version === false) {
            const champObj = new UpdateChampions()
            const data = await champObj.createChampionsData()
            // creating the JSON
            champObj.createChampionsJson(data)
            console.log('New champions.json !')
            return
        } else {
            console.log('Did not update the champions.json !')
        }
    }

    async getAllChampions(): Promise<any> {
        try {
            const filePath = path.join(__dirname, 'champions.json')
            const jsonData = readFileSync(filePath, "utf-8")
            const championsData = JSON.parse(jsonData)
            return championsData
        } catch (e) {
            console.error('Error reading champions.json.', e);
        }
    }

}

