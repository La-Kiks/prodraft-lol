import type { NextApiRequest, NextApiResponse } from "next";
import { updateChampions } from "@prodraft/common/src/updatechampions";
import { LocalData } from "@prodraft/common/src/localbase";




export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {

        res.status(200).json({ success: true, message: 'Image created successfully' });
    } catch (error) {
        console.error('Error creating image:', error);
        res.status(500).json({ success: false, message: 'Failed to create image' });
    }
}