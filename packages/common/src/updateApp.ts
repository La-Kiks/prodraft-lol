import { LocalData } from "./localbase"
import { versionIsUpToDate } from "./version"


// Run this  file to update the champions.json
async function updateApp() {
    try {
        const DATACHAMP = new LocalData()
        const updated = await DATACHAMP.createJson()
        if (updated) {
            versionIsUpToDate('update')
        }
        return true
    } catch (e) {
        console.log(e)
        return false
    }
}

updateApp();