import path from "path"
import { DownloadFailed } from "../src/errors/downloadFailedError"
import { existsSync, readFileSync, writeFileSync } from "fs"


/**
 * This function check if the version is up to date compared to online live version.
 * @param {string} [option] - If you want to update the local version, provide 'update' as option. This will update only the version, not the champions.json.
 */
export async function versionIsUpToDate(option?: string) {
    try {
        const response = await fetch("https://ddragon.leagueoflegends.com/api/versions.json")
        const data = await response.json()
        const liveVersion = data[0]
        const filePath = path.join(__dirname, 'version.txt')
        let localVersion = null
        if (existsSync(filePath)) {
            localVersion = readFileSync(filePath, "utf-8").trim()
        }
        if (localVersion !== liveVersion) {
            console.log(`New  version is available : ${localVersion} -> ${liveVersion} `);
            if (option !== undefined) {
                if (option === 'update') {
                    writeFileSync(filePath, liveVersion);
                    console.log(`Updating version : ${localVersion} -> ${liveVersion} `);
                }
            }
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


const args = process.argv.slice(2);
if (args[0] === 'check-version') {
    versionIsUpToDate();
}