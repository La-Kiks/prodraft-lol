import path from "path"
import { DownloadFailed } from "./errors/downloadFailedError"
import { readFileSync, writeFileSync } from "fs"
import { urlGen } from "./urlGenerator"
import { Champion } from "./type"
import { RecordNotFoundError } from "./errors/recordNotFoundError"


export class UpdateChampions {

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
            const { name, key } = data.data[champion]
            const lol_id = key
            const champ_name = name
            newData[champion] = { lol_id, name: champ_name, alt_name: "", tags: "", champ_sq: "", champ_ct: "", pick_v: "", ban_v: "" };
        })
        return newData
    }

    async addImages(data: { [key: string]: Champion }) {
        const newLinks = new urlGen()
        for (const key in data) {
            if (data.hasOwnProperty(key)) {
                const champion = data[key];
                let champUrlSq = newLinks.genSquareImg(key.replace(/\s/g, ""))
                let champUrlCt = newLinks.genBackgImg(key.replace(/\s/g, ""))
                const voiceUrlP = newLinks.genPickVoice(champion.lol_id)
                const voiceUrlB = newLinks.genBanVoice(champion.lol_id)
                try {
                    // Portrait / Square image exception
                    const response = await fetch(champUrlSq)
                    if (!response.ok) {
                        champUrlSq = newLinks.genSquareImgAlt(key.replace(/\s/g, ""))
                    }
                } catch (e) {
                    console.error(e)
                    throw new RecordNotFoundError('Error adding images')
                }
                try {
                    // Centered / Loading screen image exception
                    const response = await fetch(champUrlCt)
                    if (!response.ok) {
                        champUrlCt = newLinks.genBackgImgAlt(key.replace(/\s/g, ""))
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

            Aurora:
                "https://raw.communitydragon.org/latest/game/assets/characters/aurora/hud/aurora_square_0.aurora.png",

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

            Teemo:
                "https://raw.communitydragon.org/latest/game/assets/characters/teemo/hud/teemo_square_0.asu_teemo.png",

            Zilean:
                "https://raw.communitydragon.org/latest/game/assets/characters/zilean/hud/chronokeeper_square.png",

            Viktor:
                "https://raw.communitydragon.org/latest/game/assets/characters/viktor/hud/viktor_square_0.viktorvgu.png",

            Mel:
                "https://raw.communitydragon.org/latest/game/assets/characters/mel/hud/mel_square_0.mel.png",

            Ambessa: 
                "https://raw.communitydragon.org/latest/game/assets/characters/ambessa/hud/ambessa_square_0.domina.png",
        }

        for (const champName in champList) {
            if (champList.hasOwnProperty(champName)) {
                if (data.hasOwnProperty(champName)) {
                    data[champName].champ_sq = champList[champName as keyof typeof champList]
                }
            }
        }

        // Load Screen exceptions for CARDS.
        const loadScreenList = {
            Aurora:
                "https://raw.communitydragon.org/latest/game/assets/characters/aurora/skins/base/auroraloadscreen_0.aurora.png",

            Hwei:
                "https://raw.communitydragon.org/latest/game/assets/characters/hwei/skins/skin0/hweiloadscreen_0.png",

            Teemo:
                "https://raw.communitydragon.org/latest/game/assets/characters/teemo/skins/base/teemoloadscreen_0.asu_teemo.png",

            Ambessa:
                "https://raw.communitydragon.org/latest/game/assets/characters/ambessa/skins/base/ambessaloadscreen_0.domina.png",
            
            Mel:
                "https://raw.communitydragon.org/latest/game/assets/characters/mel/skins/base/melloadscreen_0.mel.png",

            Viktor:
                "https://raw.communitydragon.org/latest/game/assets/characters/viktor/skins/base/viktorloadscreen_0.viktorvgu.png",
        }

        for (const champLoadScreen in loadScreenList) {
            if (loadScreenList.hasOwnProperty(champLoadScreen)) {
                if (data.hasOwnProperty(champLoadScreen)) {
                    data[champLoadScreen].champ_ct = loadScreenList[champLoadScreen as keyof typeof loadScreenList]
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
            champ_ct: "",
            pick_v: "",
            ban_v: ""
        }
        return data
    }

    // Fixing tags to positions
    async fixTagsPositions(pdata: { [key: string]: Champion }) {
        try {
            const response = await fetch(`http://cdn.merakianalytics.com/riot/lol/resources/latest/en-US/champions.json`)
            const meikdata = await response.json()
            for (const key in pdata) {
                const positionArray: string[] = meikdata[key]?.positions || []
                const positions = positionArray.join(', ')
                pdata[key].tags = positions
            }
            return pdata
        } catch (e) {
            console.error(e)
            throw new DownloadFailed("DL failed : positions")
        }
    }


    // Create the data champions as Object
    async createChampionsData() {
        const champObject = new UpdateChampions()
        const dlData = await champObject.dlChampions()
        const parsedData = champObject.parseChampData(dlData)
        const imgData = await champObject.addImages(parsedData)
        const posData = await champObject.fixTagsPositions(imgData)
        champObject.addUnique(posData)
        return posData
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