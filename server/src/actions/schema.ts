import z from 'zod'

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

