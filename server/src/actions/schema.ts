import dotenv from 'dotenv';
import z from 'zod'


dotenv.config();

export const schemaRoomId = z.string()
export const schemaOnClick = z.object({
    ROOM_ID: schemaRoomId,
    slotName: z.string(),
    slotUrl: z.string().url()
})
export const schemaRoomReady = z.object({
    ROOM_ID: schemaRoomId,
    ready: z.boolean(),
});

const schemaPicksInDraft = z.object({
    BB1: z.string(), RB1: z.string(),
    BB2: z.string(), RB2: z.string(),
    BB3: z.string(), RB3: z.string(),

    BP1: z.string(),
    RP1: z.string(), RP2: z.string(),
    BP2: z.string(), BP3: z.string(),
    RP3: z.string(),

    RB4: z.string(), BB4: z.string(),
    RB5: z.string(), BB5: z.string(),

    RP4: z.string(),
    BP4: z.string(), BP5: z.string(),
    RP5: z.string()
})


export const schemaDraft = z.object({
    ROOM_ID: schemaRoomId,
    phase: z.string(),
    pturn: z.string(),
    idx: z.number(),
    champs: schemaPicksInDraft
})
