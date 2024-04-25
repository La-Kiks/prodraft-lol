import sharp from "sharp";
import path from "path";
import { LocalData } from "../src/localbase";
import { Champion } from "../src/type";
import fs from 'fs'
import { versionIsUpToDate } from "../src/version";


const PATH = path.join(process.cwd(), '/public/cards/')
const DATA = new LocalData()


// This function will only create cards if they do not exist yet and new patch 
export async function createCards() {
    const version = await versionIsUpToDate()
    if (version === false) {
        const champData: { [key: string]: Champion } = await DATA.getAllChampions()
        delete champData.Helmet                             // Helmet can't be carded
        Object.keys(champData).forEach(championKey => {
            const champion: Champion = champData[championKey]
            const filePath = path.join(PATH, `${championKey}-card.jpg`)
            try {
                fs.accessSync(filePath, fs.constants.F_OK)
            } catch (error: any) {
                if (error.code === 'ENOENT') {
                    imageToCard(championKey, champion.champ_ct)
                } else {
                    console.error('Error checking file existence', error)
                }
            }
        })
    } else {
        console.log('No new cards')
    }
}

async function imageToCard(name: string, url: string) {
    try {
        const response = await fetch(url)
        if (!response.ok) {
            throw new Error(`Failed to fetch image for ${name} : ${url}`)
        }

        const reader = response.body?.getReader()
        if (!reader) {
            throw new Error('Failed to get reader for image stream.');
        }

        const chunks: Uint8Array[] = []

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (value) chunks.push(value);
        }

        const img = Buffer.concat(chunks)

        const card = await sharp(img)
            .resize(96, 192, {
                fit: 'cover',
                position: 'centre',
            })
            .toBuffer()

        const filePath = path.join(PATH, `${name}-card.jpg`)

        fs.writeFileSync(filePath, card)

        console.log(`Done : ${name}-card.jpg`)

    } catch (e) {
        console.error(`Failed : ${name}-card.jpg`, e)
    }
}

