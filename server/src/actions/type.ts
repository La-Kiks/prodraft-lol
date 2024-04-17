export interface ClientToServerEvents extends Record<string, unknown> { }
export interface InterServerEvents extends Record<string, unknown> { }
export interface ServerToClientEvents extends Record<string, unknown> { }
export interface SocketData extends Record<string, unknown> { }


export interface Champion {
    lol_id: string;
    name: string;
    alt_name: string;
    tags: string;
    champ_sq: string;
    champ_ct: string;
    pick_v: string;
    ban_v: string;
}

export interface DraftPayload {
    ROOM_ID: string;
    phase: string;
    pturn: string;
    idx: number;
    champs: { [key: string]: string }
}

export interface DraftChamps {
    BB1: '', RB1: '',
    BB2: '', RB2: '',
    BB3: '', RB3: '',

    BP1: '',
    RP1: '', RP2: '',
    BP2: '', BP3: '',
    RP3: '',

    RB4: '', BB4: '',
    RB5: '', BB5: '',

    RP4: '',
    BP4: '', BP5: '',
    RP5: ''
}
