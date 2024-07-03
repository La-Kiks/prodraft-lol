// Using a local champions.json file as the "database"
import { readFileSync } from "fs";
import { UpdateChampions } from "./updatechampions";
import path from "path";


export class LocalData {

    // create the champions.json -- with all the champions informations
    async createJson() {
        try {
            const champObj = new UpdateChampions()
            const data = await champObj.createChampionsData()
            champObj.createChampionsJson(data)
            console.log('New champions.json !')
            return true
        } catch (e) {
            return false
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

