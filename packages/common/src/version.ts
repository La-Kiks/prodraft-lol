import path from "path"
import { DownloadFailed } from "../src/errors/downloadFailedError"
import { existsSync, readFileSync, writeFileSync } from "fs"


export async function versionIsUpToDate() {
    try {
        const response = await fetch("https://ddragon.leagueoflegends.com/api/versions.json")
        const data = await response.json()
        const liveVersion = data[0]
        const filePath = path.join(__dirname, 'version.txt')


        if (
            existsSync(filePath) === false ||
            readFileSync(filePath, "utf-8").trim() !== liveVersion
        ) {
            writeFileSync(filePath, liveVersion);
            console.log(`Updating to version : ${liveVersion} `);
            return false;
        } else {
            console.log(`Version is already up to date : ${liveVersion}`);
            return true;
        }

    } catch (e) {
        console.error("Error fetching data", e)
        throw new DownloadFailed("DL failed : Version")
    }

}