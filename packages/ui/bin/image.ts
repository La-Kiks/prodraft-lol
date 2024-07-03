import sharp from "sharp";
import path from "path";
import { LocalData } from "@prodraft/common/src/localbase";
import { Champion } from "@prodraft/common/src/type";
import fs from 'fs'


const PATH = path.join(__dirname, '../public/cards/')
const DATA = new LocalData()


// This function will only create images cards 
async function createCards() {
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
            .webp()
            .toBuffer()


        const filePath = path.join(PATH, `${name}-card.webp`)

        fs.writeFileSync(filePath, card)

        console.log(`Done : ${name}-card.webp`)

    } catch (e) {
        console.error(`Failed : ${name}-card.webp`, e)
    }
}

createCards()