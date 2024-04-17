import { resolve } from "path"
import { DraftPayload } from "./type"


export class DraftGame {


    draftStep(payload: DraftPayload) {
        const { ROOM_ID, phase, pturn, idx, champs } = payload as DraftPayload
        const newPayload: DraftPayload = { ...payload }

        switch (idx) {
            // BB1
            case 0:
                newPayload.idx++
                newPayload.pturn = "red"
                return newPayload as DraftPayload
            // RB1
            case 1:
                newPayload.idx++
                newPayload.pturn = "blue"
                return newPayload as DraftPayload
            // BB2
            case 2:
                newPayload.idx++
                newPayload.pturn = "red"
                return newPayload as DraftPayload
            // RB2
            case 3:
                newPayload.idx++
                newPayload.pturn = "blue"
                return newPayload as DraftPayload
            // BB3
            case 4:
                newPayload.idx++
                newPayload.pturn = "red"
                return newPayload as DraftPayload
            // RB3
            case 5:
                newPayload.idx++
                newPayload.pturn = "blue"
                return newPayload as DraftPayload
            // BP1
            case 6:
                newPayload.idx++
                newPayload.pturn = "red"
                return newPayload as DraftPayload
            // RP1
            case 7:
                newPayload.idx++
                newPayload.pturn = "red"
                return newPayload as DraftPayload
            // RP2
            case 8:
                newPayload.idx++
                newPayload.pturn = "blue"
                return newPayload as DraftPayload
            // BP2
            case 9:
                newPayload.idx++
                newPayload.pturn = "blue"
                return newPayload as DraftPayload
            // BP3
            case 10:
                newPayload.idx++
                newPayload.pturn = "red"
                return newPayload as DraftPayload
            // RP3
            case 11:
                newPayload.idx++
                newPayload.pturn = "red"
                return newPayload as DraftPayload
            // RB4
            case 12:
                newPayload.idx++
                newPayload.pturn = "blue"
                return newPayload as DraftPayload
            // BB4
            case 13:
                newPayload.idx++
                newPayload.pturn = "red"
                return newPayload as DraftPayload
            // RB5
            case 14:
                newPayload.idx++
                newPayload.pturn = "blue"
                return newPayload as DraftPayload
            // BB5
            case 15:
                newPayload.idx++
                newPayload.pturn = "red"
                return newPayload as DraftPayload
            // RP4
            case 16:
                newPayload.idx++
                newPayload.pturn = "blue"
                return newPayload as DraftPayload
            // BP4
            case 17:
                newPayload.idx++
                newPayload.pturn = "blue"
                return newPayload as DraftPayload
            // BP5
            case 18:
                newPayload.idx++
                newPayload.pturn = "red"
                return newPayload as DraftPayload
            // RP5
            case 19:
                newPayload.phase = "OVER"
                return newPayload as DraftPayload

            default:
                console.log('error draftstep')
                return
        }
    }

    private intervalId: NodeJS.Timeout | null = null;
    countdown(startValue: number, callback: (value: number) => void): void {
        if (this.intervalId !== null) {
            clearInterval(this.intervalId);
        }

        let currentValue = startValue;

        this.intervalId = setInterval(() => {
            if (currentValue >= 0) {
                callback(currentValue);
                currentValue--;
            } else {
                clearInterval(this.intervalId as NodeJS.Timeout);
            }
        }, 1000);
    }
}