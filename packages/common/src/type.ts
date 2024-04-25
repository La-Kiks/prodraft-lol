export interface ClientToServerEvents extends Record<string, unknown> { }
export interface InterServerEvents extends Record<string, unknown> { }
export interface ServerToClientEvents extends Record<string, unknown> { }
export interface SocketData extends Record<string, unknown> { }


export type Champion = {
    lol_id: string;
    name: string;
    alt_name: string;
    tags: string;
    champ_sq: string;
    champ_ct: string;
    pick_v: string;
    ban_v: string;
}

export type DraftPayload = {
    draft: {
        phase: string,
        pturn: string,
        idx: number,
        champs: string[]
    }
}

export interface DraftChamps {
    BB1: string, RB1: string,
    BB2: string, RB2: string,
    BB3: string, RB3: string,

    BP1: string,
    RP1: string, RP2: string,
    BP2: string, BP3: string,
    RP3: string,

    RB4: string, BB4: string,
    RB5: string, BB5: string,

    RP4: string,
    BP4: string, BP5: string,
    RP5: string
}
