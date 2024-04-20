import { DraftGame } from "../actions/playing";
import { Side } from "./side";

// id phase pturn idx champs 
class Draft {

    private phase: string = 'WAITING'
    private pturn: string = 'blue'
    private idx: number = 0
    private champs: Array<string> = new Array(20).fill('Helmet')

    step(idx: number, currentChamp: string): ReturnType<(typeof DraftGame)['draftStep']> {
        this.champs[idx] = currentChamp
        const step = DraftGame.draftStep(idx)
        this.phase = step.phase
        if (step.phase === 'PLAYING') {
            this.pturn = step.pturn
            this.idx = step.newIndex
        } else if (step.phase === 'OVER') {
        }
        return step
    }

    getState() {
        return { phase: this.phase, pturn: this.pturn, idx: this.idx, champs: this.champs }
    }
}

export class Room {
    private blueside: Side;
    private redside: Side;
    private draft: Draft;

    constructor(private id: string) {
        this.blueside = new Side()
        this.redside = new Side()
        this.draft = new Draft()
    }

    isReady() {
        return this.blueside.isReady() && this.redside.isReady()
    }

    setBlueSideReady(ready: boolean) {
        this.blueside.setReady(ready)
    }
    setRedSideReady(ready: boolean) {
        this.redside.setReady(ready)
    }

    step(idx: number, currentChamp: string) {
        return this.draft.step(idx, currentChamp)
    }

    getState() {
        return { draft: this.draft.getState() }
    }


}