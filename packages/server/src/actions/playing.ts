export class DraftGame {


    static draftStep(idx: number): { newIndex: number, pturn: string, phase: 'PLAYING' } | { phase: 'OVER' } {
        switch (idx) {
            // BB1
            case 0:
                return { newIndex: idx + 1, pturn: 'red', phase: 'PLAYING' }
            // RB1
            case 1:
                return { newIndex: idx + 1, pturn: 'blue', phase: 'PLAYING' }
            // BB2
            case 2:
                return { newIndex: idx + 1, pturn: 'red', phase: 'PLAYING' }
            // RB2
            case 3:
                return { newIndex: idx + 1, pturn: 'blue', phase: 'PLAYING' }
            // BB3
            case 4:
                return { newIndex: idx + 1, pturn: 'red', phase: 'PLAYING' }
            // RB3
            case 5:
                return { newIndex: idx + 1, pturn: 'blue', phase: 'PLAYING' }
            // BP1
            case 6:
                return { newIndex: idx + 1, pturn: 'red', phase: 'PLAYING' }
            // RP1
            case 7:
                return { newIndex: idx + 1, pturn: 'red', phase: 'PLAYING' }
            // RP2
            case 8:
                return { newIndex: idx + 1, pturn: 'blue', phase: 'PLAYING' }
            // BP2
            case 9:
                return { newIndex: idx + 1, pturn: 'blue', phase: 'PLAYING' }
            // BP3
            case 10:
                return { newIndex: idx + 1, pturn: 'red', phase: 'PLAYING' }
            // RP3
            case 11:
                return { newIndex: idx + 1, pturn: 'red', phase: 'PLAYING' }
            // RB4
            case 12:
                return { newIndex: idx + 1, pturn: 'blue', phase: 'PLAYING' }
            // BB4
            case 13:
                return { newIndex: idx + 1, pturn: 'red', phase: 'PLAYING' }
            // RB5
            case 14:
                return { newIndex: idx + 1, pturn: 'blue', phase: 'PLAYING' }
            // BB5
            case 15:
                return { newIndex: idx + 1, pturn: 'red', phase: 'PLAYING' }
            // RP4
            case 16:
                return { newIndex: idx + 1, pturn: 'blue', phase: 'PLAYING' }
            // BP4
            case 17:
                return { newIndex: idx + 1, pturn: 'blue', phase: 'PLAYING' }
            // BP5
            case 18:
                return { newIndex: idx + 1, pturn: 'red', phase: 'PLAYING' }
            // RP5
            case 19:
                return { phase: 'OVER' }
            default:
                throw new Error('Draft Game Error')
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