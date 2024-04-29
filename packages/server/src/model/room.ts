import { DraftGame } from "../actions/playing";
import { Side } from "./side";

// id phase pturn idx champs 
class Draft {

    public phase: string = 'WAITING'
    public pturn: string = ''
    private idx: number = 0
    private champs: Array<string> = new Array(20).fill('')

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
    private spectatorsCount: number;
    public spectatorsList: Array<string>;
    private bluesCount: number;
    public bluesList: Array<string>;
    private redsCount: number;
    public redsList: Array<string>;


    constructor(private id: string) {
        this.blueside = new Side()
        this.redside = new Side()
        this.draft = new Draft()
        this.spectatorsCount = 0
        this.spectatorsList = []
        this.bluesCount = 0
        this.bluesList = []
        this.redsCount = 0
        this.redsList = []
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

    isPlaying() {
        return (this.draft.phase = 'PLAYING') && (this.draft.pturn = 'blue')
        // Initiate the 1st turn to avoid behind stuck with initial values
    }

    step(idx: number, currentChamp: string) {
        return this.draft.step(idx, currentChamp)
    }

    getState() {
        return { draft: this.draft.getState() }
    }

    specCount() {
        return this.spectatorsCount
    }

    specCountIncrease(socketId: string) {
        this.spectatorsList.push(socketId)
        return this.spectatorsCount++
    }

    specCountDecrease(socketId: string) {
        const updateSpecList = this.spectatorsList.filter(spectator => spectator !== socketId)
        this.spectatorsList = updateSpecList
        return this.spectatorsCount--
    }

    blueCount() {
        return this.bluesCount
    }

    blueCountIncrease(socketId: string) {
        this.bluesList.push(socketId)
        return this.bluesCount++
    }

    blueCountDecrease(socketId: string) {
        const updateBlueList = this.bluesList.filter(blue => blue !== socketId)
        this.bluesList = updateBlueList
        return this.bluesCount--
    }

    redCount() {
        return this.redsCount
    }

    redCountIncrease(socketId: string) {
        this.redsList.push(socketId)
        return this.redsCount++
    }

    redCountDecrease(socketId: string) {
        const updateRedList = this.redsList.filter(red => red !== socketId)
        this.redsList = updateRedList
        return this.redsCount--
    }

    allPlayersCount() {
        const total = this.bluesCount + this.redsCount + this.spectatorsCount
        return total
    }
}
