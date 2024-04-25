// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs"
import path from "path"
import { createCards } from "@prodraft/common/src/image";


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {

    res.status(200).json({ success: true, message: 'Image created successfully' });
  } catch (error) {
    console.error('Error creating image:', error);
    res.status(500).json({ success: false, message: 'Failed to create image' });
  }
}