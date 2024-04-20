import z from 'zod'

/**
 *  
 * ZOD schemas & types
 * 
 */

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
    BB1: z.any(), RB1: z.any(),
    BB2: z.any(), RB2: z.any(),
    BB3: z.any(), RB3: z.any(),

    BP1: z.any(),
    RP1: z.any(), RP2: z.any(),
    BP2: z.any(), BP3: z.any(),
    RP3: z.any(),

    RB4: z.any(), BB4: z.any(),
    RB5: z.any(), BB5: z.any(),

    RP4: z.any(),
    BP4: z.any(), BP5: z.any(),
    RP5: z.any()
})

export const schemaDraft = z.object({
    ROOM_ID: schemaRoomId,
    phase: z.string(),
    pturn: z.string(),
    idx: z.number(),
    champs: schemaPicksInDraft
})

// Zod Schemas :
export const schChampionsArray = z.array(z.string()).max(20)
export const schRoomID = z.string()
export const schDraft = z.object({
    phase: z.string(),
    pturn: z.string(),
    idx: z.number(),
    champs: schChampionsArray,
})
export const schRoom = z.object({
    ROOM_ID: schRoomID,
    infos_draft: schDraft,
})

// RQST
export const schReadyCheck = z.object({ ROOM_ID: schRoomID, ready: z.boolean() })
export const schClick = z.object({ ROOM_ID: schRoomID, idx: z.number(), currentChamp: z.string() })
export const schValidate = schClick
// Types :
export type ChampArray = z.infer<typeof schChampionsArray>

export type RoomID = z.infer<typeof schRoomID>
export type DraftInfos = z.infer<typeof schDraft>
export type RoomInfos = z.infer<typeof schRoom>

// export type ClickType = z.infer<typeof schClick>