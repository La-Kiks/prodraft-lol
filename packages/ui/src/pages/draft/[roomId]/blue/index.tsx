import { Button } from "@/components/ui/button";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import io, { Socket } from 'socket.io-client';


const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "ws://127.0.0.1:3001";
const PLAYER = 'blue'


interface Champion {
    lol_id: string;
    name: string;
    alt_name: string;
    tags: string;
    champ_sq: string;
    champ_ct: string;
    pick_v: string;
    ban_v: string;
}

type DraftPayload = {
    draft: {
        phase: string,
        pturn: string,
        idx: number,
        champs: string[]
    }
}

function useSocket() {
    const [socket, setSocket] = useState<Socket | null>(null);

    useEffect(() => {
        const socketIo = io(SOCKET_URL, {
            reconnection: true,
            upgrade: true,
            transports: ["websocket", "polling"],
        });


        setSocket(socketIo);

        return function () {
            socketIo.disconnect()
        };
    }, []);

    return socket;
}


export default function BlueDraftPage() {
    // useState declarations
    const [champdata, setChampdata] = useState<{ [key: string]: Champion }>({});
    const [champArray, setChampArray] = useState<string[]>(new Array(20).fill('Helmet'))
    const [selectTracker, setSelectTracker] = useState<boolean>(true)
    const [slotIndex, setSlotIndex] = useState(0)
    const [timer, setTimer] = useState(69)
    const [ready, setReady] = useState<boolean>(false)
    const [confirmButton, setConfirmButton] = useState<string>('Ready')
    const [gamePhase, setGamePhase] = useState<string>('WAITING')
    const [turn, setTurn] = useState('')
    const [champDisabled, setChampDisabled] = useState<{ [name: string]: boolean }>({})
    const [volume, setVolume] = useState<number>(1)
    const [spectators, setSpectators] = useState(0)

    // Other declarations
    const router = useRouter();
    const { ROOM_ID, blueName, redName } = router.query as { ROOM_ID: string; blueName: string; redName: string; }
    const socket = useSocket();
    const helmetUrl = "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-collections/global/default/icon-helmet.png"

    // Functions : 
    // INITIALIZE STEP 0 - champ grid + waiting room + not ready
    // When you press F5 :
    useEffect(() => {
        socket?.on('connect', () => {
            console.log("Socket connected")
            socket?.emit('draftpage', (data: { [key: string]: Champion }) => setChampdata(data))
            socket?.emit('new:room', ROOM_ID)

            socket?.on(`state:${ROOM_ID}`, (state: DraftPayload) => {
                if (state) {
                    const { phase, pturn, idx, champs } = state.draft
                    setGamePhase(phase)
                    setTurn(pturn)
                    setSlotIndex(idx)
                    setChampArray(champs)
                }
            })

            socket?.on(`timer:${ROOM_ID}`, (time: number) => {
                setTimeout(() => {
                    setTimer(time)
                }, 500)
            })

        })

    }, [ROOM_ID]);

    socket?.on(`specators:count:${ROOM_ID}`, (specount: number) => {
        setSpectators(specount)
    })

    // Receiving this even from server when both sides READY
    socket?.on(`start:${ROOM_ID}`, () => {
        setGamePhase('PLAYING')
        setTurn('blue')
    })

    socket?.on(`click:red:${ROOM_ID}`, (idx: number, currentChamp: string) => {
        const updtChampArray = [...champArray]
        updtChampArray[idx] = currentChamp
        setChampArray(updtChampArray)
    })

    // CHAMPION CLICK OVERVIEW
    const champSelected = (champName: string) => {
        if (gamePhase == 'PLAYING') {
            if (turn == PLAYER) {
                if (!champDisabled[champName]) {
                    const updtChampArray = [...champArray]
                    updtChampArray[slotIndex] = champName
                    setChampArray(updtChampArray)
                    setSelectTracker(!selectTracker)
                }
            }
        }
    }

    // Champions picked or banned => disabled
    const createDisabledObject = (champArray: string[]): { [name: string]: boolean } => {
        const disObject: { [name: string]: boolean } = {}
        champArray.forEach((name) => {
            if (name === 'Helmet') {
                disObject[name] = false
            } else {
                disObject[name] = true
            }
        })
        return disObject
    }

    useEffect(() => {
        if (champArray && champArray[slotIndex]) {
            const currentChamp = champArray[slotIndex]
            const clickObject = { ROOM_ID: ROOM_ID, idx: slotIndex, currentChamp: currentChamp }
            socket?.emit(`click:blue`, clickObject)
        }
    }, [selectTracker])         // Send champion on click because select Tracker  change on click


    // DRAFT GAMES & TURNS
    socket?.on(`validate:${ROOM_ID}`, (payload: { idx: number, pturn: string, phase: string } | { phase: string }) => {
        if (payload) {
            const phase = payload.phase
            if (phase === 'PLAYING' && 'idx' in payload && 'pturn' in payload) {
                const idx = payload.idx
                const pturn = payload.pturn
                setGamePhase(phase)
                setTurn(pturn)
                setSlotIndex(idx)
            } else if (payload.phase === 'OVER') {
                setGamePhase(phase)
            }
        } else {
            console.log('error receiving validation')
        }
    })

    // timer logc
    useEffect(() => {
        if (gamePhase == 'PLAYING') {
            const countdown = setTimeout(() => {
                if (timer > 0) {
                    setTimer(prevTimer => prevTimer - 1);
                    if (timer < 10) {
                        playSoundTimerLow(volume)
                    }
                } else {
                    setTimeout(() => {
                        handleValidate();
                    }, 200)
                }
            }, 1000);
            return () => clearTimeout(countdown)
        }
    }, [timer])

    // Reset timer on new idx (new pick/ban)
    useEffect(() => {
        if (gamePhase == 'PLAYING') {
            setTimer(30)
        }
        if (champArray) {
            setChampDisabled(createDisabledObject(champArray))
        }
        if (turn === 'blue') {
            playSoundTurn(volume)
        }
    }, [slotIndex])

    // Redirect to the base page
    const bannerClick = async () => {
        await router.push(`/`)
    }

    // Ready check
    useEffect(() => {
        socket?.emit(`ready:${PLAYER}`, { ROOM_ID, ready })
    }, [ready])

    // Gamephase change the button content
    useEffect(() => {
        if (gamePhase == 'PLAYING') {
            setConfirmButton('Confirm')
            playSoundTurn(volume)
            setTimer(30)
        } else if (gamePhase == 'OVER') {
            setConfirmButton('New draft')
        }
    }, [gamePhase])

    // different validate button usage
    const handleValidate = () => {
        setTimeout(() => {
            if (gamePhase == 'WAITING') {
                setReady(!ready)
            }
            if (gamePhase == 'PLAYING') {
                if (turn == `${PLAYER}`) {
                    const currentChamp = champArray[slotIndex]
                    const payload = { ROOM_ID: ROOM_ID, idx: slotIndex, currentChamp: currentChamp }
                    socket?.emit(`validate:blue`, payload)
                    playSoundValidate(volume)
                }
            }
            if (gamePhase == 'OVER') {
                bannerClick()
            }
        }, 200)
    }

    //Sounds
    const playSoundTurn = (volume: number) => {
        const audio = new Audio('https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-champ-select/global/default/sounds/sfx-cs-draft-pick-intro.ogg')
        audio.volume = volume
        audio.play()
    }

    const playSoundValidate = (volume: number) => {
        const audio = new Audio('https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-champ-select/global/default/sounds/sfx-cs-lockin-button-click.ogg')
        audio.volume = volume
        audio.play()
    }

    const playSoundTimerLow = (volume: number) => {
        const audio = new Audio('https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-champ-select/global/default/sounds/sfx-cs-timer-tick.ogg')
        audio.volume = volume
        audio.play()
    }

    const volumeOnOff = () => {
        if (volume === 1) {
            setVolume(0)
        } else if (volume === 0) {
            setVolume(1)
        }
    }

    // Return view : 
    return (
        <main className="flex flex-col p-0 w-full min-h-screen min-w-[540px] space-y-0 m-auto  items-center place-content-start bg-slate-800">
            <div className="p-2 mt-8 mb-8 flex content-start justify-center text-4xl text-white hover:text-slate-300">
                <h1 onClick={() => bannerClick()}>Prodraft.lol</h1>
            </div>

            <div className="max-w-5xl w-full flex flex-col items-center border rounded border-slate-400 bg-slate-700">

                {/* DRAFT HEADER 
                BOX 1 : Blue team name  + blue teams bans (x3)
                BOX 2 : Timer
                BOX 3 : Red team name + red team bans (x3)
                */}

                <div className="draft-header flex  w-full items-center  ">
                    <div className="box1 basis-5/12  flex flex-col ">
                        <div className={`team-name max-w-48 sm:max-w-96 text-white bg-blue-500 p-1 transition-width duration-500 ${turn === 'red' ? 'w-1/2 ' : 'w-full'}`}>
                            <h1 className="text-xl overflow-hidden">{blueName}</h1>
                        </div>
                        <div className="team-bans w-fit flex">
                            {champArray && champArray[0] && champdata && champdata[champArray[0]] && champdata[champArray[0]]['champ_sq'] ? (
                                <img className={`p-1 w-20 h-20 filter saturate-50 ${(gamePhase === 'PLAYING' && slotIndex === 0) ? 'animate-pulse' : ''}`} alt={champdata[champArray[0]]['name']}
                                    src={champdata[champArray[0]]['champ_sq']} />
                            ) : (
                                <img className="p-1 w-20 h-20 "
                                    src={helmetUrl} alt="Helmet placeholder" />
                            )}
                            {champArray && champArray[2] && champdata && champdata[champArray[2]] && champdata[champArray[2]]['champ_sq'] ? (
                                <img className={`p-1 w-20 h-20 filter saturate-50 ${(gamePhase === 'PLAYING' && slotIndex === 2) ? 'animate-pulse' : ''}`} alt={champdata[champArray[2]]['name']}
                                    src={champdata[champArray[2]]['champ_sq']} />
                            ) : (
                                <img className="p-1 w-20 h-20" src={helmetUrl} alt="Helmet placeholder" />
                            )}
                            {champArray && champArray[4] && champdata && champdata[champArray[4]] && champdata[champArray[4]]['champ_sq'] ? (
                                <img className={`p-1 w-20 h-20 filter saturate-50 ${(gamePhase === 'PLAYING' && slotIndex === 4) ? 'animate-pulse' : ''}`} alt={champdata[champArray[4]]['name']}
                                    src={champdata[champArray[4]]['champ_sq']} />
                            ) : (
                                <img className="p-1 w-20 h-20" src={helmetUrl} alt="Helmet placeholder" />
                            )}
                        </div>
                    </div>

                    <div className="box2 basis-2/12 flex justify-center p-1 text-white text-5xl"> {timer} </div>

                    <div className="box3 basis-5/12 flex flex-col place-items-end ">
                        <div className={`team-name max-w-48 sm:max-w-96 text-white bg-red-500 flex flex-row-reverse p-1 transition-width duration-500 ${turn === 'blue' ? 'w-1/2' : 'w-full '}`}>
                            <h1 className="text-xl overflow-hidden">{redName}</h1>
                        </div>
                        <div className="team-bans mx-1 w-fit flex flex-row-reverse ">
                            {champArray && champArray[1] && champdata && champdata[champArray[1]] && champdata[champArray[1]]['champ_sq'] ? (
                                <img className={`p-1 w-20 h-20 filter saturate-50 ${(gamePhase === 'PLAYING' && slotIndex === 1) ? 'animate-pulse' : ''}`} alt={champdata[champArray[1]]['name']}
                                    src={champdata[champArray[1]]['champ_sq']} />
                            ) : (
                                <img className="p-1 w-20 h-20" src={helmetUrl} alt="Helmet placeholder" />
                            )}
                            {champArray && champArray[3] && champdata && champdata[champArray[3]] && champdata[champArray[3]]['champ_sq'] ? (
                                <img className={`p-1 w-20 h-20 filter saturate-50 ${(gamePhase === 'PLAYING' && slotIndex === 3) ? 'animate-pulse' : ''}`} alt={champdata[champArray[3]]['name']}
                                    src={champdata[champArray[3]]['champ_sq']} />
                            ) : (
                                <img className="p-1 w-20 h-20" src={helmetUrl} alt="Helmet placeholder" />
                            )}
                            {champArray && champArray[5] && champdata && champdata[champArray[5]] && champdata[champArray[5]]['champ_sq'] ? (
                                <img className={`p-1 w-20 h-20 filter saturate-50 ${(gamePhase === 'PLAYING' && slotIndex === 5) ? 'animate-pulse' : ''}`} alt={champdata[champArray[5]]['name']}
                                    src={champdata[champArray[5]]['champ_sq']} />
                            ) : (
                                <img className="p-1 w-20 h-20" src={helmetUrl} alt="Helmet placeholder" />
                            )}
                        </div>
                    </div>
                </div>

                {/* CORE DRAFT :
                 BOX 1 : BLUE TEAM (6 elements : 5 champs square + 1 box for 2 bans)
                 BOX 2 : CHAMPION GRID (1 header + 1 big grid)
                 BOX 3 : RED TEAM (6 elements)
                */}

                <div className="overflow-hidden w-full flex flex-nowrap ">

                    <div className="box1 flex flex-col h-full justify-around  basis-1/3 md:basis-3/12 ">

                        {champArray && champArray[6] && champdata && champdata[champArray[6]] && champdata[champArray[6]]['champ_sq'] ? (
                            <img className={`p-1 w-28 h-28 ${(gamePhase === 'PLAYING' && slotIndex === 6) ? 'animate-pulse' : ''}`} alt={champdata[champArray[6]]['name']}
                                src={champdata[champArray[6]]['champ_sq']} />
                        ) : (
                            <img className="p-1 w-28 h-28" src={helmetUrl} alt="Helmet placeholder" />
                        )}
                        {champArray && champArray[9] && champdata && champdata[champArray[9]] && champdata[champArray[9]]['champ_sq'] ? (
                            <img className={`p-1 w-28 h-28 ${(gamePhase === 'PLAYING' && slotIndex === 9) ? 'animate-pulse' : ''}`} alt={champdata[champArray[9]]['name']}
                                src={champdata[champArray[9]]['champ_sq']} />
                        ) : (
                            <img className="p-1 w-28 h-28" src={helmetUrl} alt="Helmet placeholder" />
                        )}
                        {champArray && champArray[10] && champdata && champdata[champArray[10]] && champdata[champArray[10]]['champ_sq'] ? (
                            <img className={`p-1 w-28 h-28 ${(gamePhase === 'PLAYING' && slotIndex === 10) ? 'animate-pulse' : ''}`} alt={champdata[champArray[10]]['name']}
                                src={champdata[champArray[10]]['champ_sq']} />
                        ) : (
                            <img className="p-1 w-28 h-28" src={helmetUrl} alt="Helmet placeholder" />
                        )}

                        <div className="bans2 flex w-fit">

                            {champArray && champArray[13] && champdata && champdata[champArray[13]] && champdata[champArray[13]]['champ_sq'] ? (
                                <img className={`p-1 w-20 h-20 filter saturate-50 ${(gamePhase === 'PLAYING' && slotIndex === 13) ? 'animate-pulse' : ''}`} alt={champdata[champArray[13]]['name']}
                                    src={champdata[champArray[13]]['champ_sq']} />
                            ) : (
                                <img className="p-1 w-20 h-20" src={helmetUrl} alt="Helmet placeholder" />
                            )}
                            {champArray && champArray[15] && champdata && champdata[champArray[15]] && champdata[champArray[15]]['champ_sq'] ? (
                                <img className={`p-1 w-20 h-20 filter saturate-50 ${(gamePhase === 'PLAYING' && slotIndex === 15) ? 'animate-pulse' : ''}`} alt={champdata[champArray[15]]['name']}
                                    src={champdata[champArray[15]]['champ_sq']} />
                            ) : (
                                <img className="p-1 w-20 h-20" src={helmetUrl} alt="Helmet placeholder" />
                            )}

                        </div>

                        {champArray && champArray[17] && champdata && champdata[champArray[17]] && champdata[champArray[17]]['champ_sq'] ? (
                            <img className={`p-1 w-28 h-28 ${(gamePhase === 'PLAYING' && slotIndex === 17) ? 'animate-pulse' : ''}`} alt={champdata[champArray[17]]['name']}
                                src={champdata[champArray[17]]['champ_sq']} />
                        ) : (
                            <img className="p-1 w-28 h-28" src={helmetUrl} alt="Helmet placeholder" />
                        )}
                        {champArray && champArray[18] && champdata && champdata[champArray[18]] && champdata[champArray[18]]['champ_sq'] ? (
                            <img className={`p-1 w-28 h-28 ${(gamePhase === 'PLAYING' && slotIndex === 18) ? 'animate-pulse' : ''}`} alt={champdata[champArray[18]]['name']}
                                src={champdata[champArray[18]]['champ_sq']} />
                        ) : (
                            <img className="p-1 w-28 h-28" src={helmetUrl} alt="Helmet placeholder" />
                        )}

                    </div>

                    <div className="box2   h-[640px] w-full flex flex-col items-center basis-1/3 md:basis-6/12 ">
                        <div className="header flex flex-wrap justify-around w-full ">
                            <div className="flex">
                                <img className="p-1 max-w-11 max-h-11"
                                    src="https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-champ-select/global/default/svg/position-top.svg"
                                    alt="Toplaners" />
                                <img className="p-1 max-w-11 max-h-11"
                                    src="https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-champ-select/global/default/svg/position-jungle.svg"
                                    alt="Junglers" />
                                <img className="p-1 max-w-11 max-h-11"
                                    src="https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-champ-select/global/default/svg/position-middle.svg"
                                    alt="Midlaners" />
                                <img className="p-1 max-w-11 max-h-11"
                                    src="https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-champ-select/global/default/svg/position-lane.svg"
                                    alt="Botlaners" />
                                <img className="p-1 max-w-11 max-h-11"
                                    src="https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-champ-select/global/default/svg/position-utility.svg"
                                    alt="Support" />
                            </div>
                            <div className="p-1">
                                <input
                                    type="search"
                                    className=" m-0 block w-full rounded border border-solid border-neutral-200 bg-transparent bg-clip-padding px-3 py-[0.25rem] text-base font-normal leading-[1.6] text-surface outline-none transition duration-200 ease-in-out placeholder:text-neutral-500 focus:z-[3] focus:border-primary focus:shadow-inset focus:outline-none motion-reduce:transition-none dark:border-white/10 text-white dark:placeholder:text-neutral-200 dark:autofill:shadow-autofill dark:focus:border-primary"
                                    placeholder="Search"
                                    aria-label="Search"
                                    id="exampleFormControlInput4" />
                            </div>
                        </div>
                        <div className="grid gap-0  overflow-y-scroll grid-cols-1 sm:grid-cols-2 md:grid-cols-5 lg:grid-cols-6  ">

                            {Object.entries(champdata).length > 0 ? (
                                Object.entries(champdata).map(([championName, champion]) => (
                                    <div key={championName}>
                                        <img className={`w-20 h-20 p-0.5 rounded-md ${champDisabled[championName] ? 'filter grayscale cursor-not-allowed ' : ' hover:bg-slate-500'}`}
                                            id={champion.name}
                                            src={champion.champ_sq} alt={champion.name}
                                            onClick={() => champSelected(championName)} />
                                    </div>
                                ))
                            ) : (
                                <h1 className="text-slate-400">Loading...</h1>
                            )}
                        </div>
                    </div>

                    <div className="box3 flex flex-col h-full justify-around items-end basis-1/3 md:basis-3/12 ">

                        {champArray && champArray[7] && champdata && champdata[champArray[7]] && champdata[champArray[7]]['champ_sq'] ? (
                            <img className={`p-1 w-28 h-28 ${(gamePhase === 'PLAYING' && slotIndex === 7) ? 'animate-pulse' : ''}`} alt={champdata[champArray[7]]['name']}
                                src={champdata[champArray[7]]['champ_sq']} />
                        ) : (
                            <img className="p-1 w-28 h-28" src={helmetUrl} alt="Helmet placeholder" />
                        )}
                        {champArray && champArray[8] && champdata && champdata[champArray[8]] && champdata[champArray[8]]['champ_sq'] ? (
                            <img className={`p-1 w-28 h-28 ${(gamePhase === 'PLAYING' && slotIndex === 8) ? 'animate-pulse' : ''}`} alt={champdata[champArray[8]]['name']}
                                src={champdata[champArray[8]]['champ_sq']} />
                        ) : (
                            <img className="p-1 w-28 h-28" src={helmetUrl} alt="Helmet placeholder" />
                        )}
                        {champArray && champArray[11] && champdata && champdata[champArray[11]] && champdata[champArray[11]]['champ_sq'] ? (
                            <img className={`p-1 w-28 h-28 ${(gamePhase === 'PLAYING' && slotIndex === 11) ? 'animate-pulse' : ''}`} alt={champdata[champArray[11]]['name']}
                                src={champdata[champArray[11]]['champ_sq']} />
                        ) : (
                            <img className="p-1 w-28 h-28" src={helmetUrl} alt="Helmet placeholder" />
                        )}

                        <div className="bans2 flex flex-row-reverse  w-fit">

                            {champArray && champArray[12] && champdata && champdata[champArray[12]] && champdata[champArray[12]]['champ_sq'] ? (
                                <img className={`p-1 w-20 h-20 filter saturate-50 ${(gamePhase === 'PLAYING' && slotIndex === 12) ? 'animate-pulse' : ''}`} alt={champdata[champArray[12]]['name']}
                                    src={champdata[champArray[12]]['champ_sq']} />
                            ) : (
                                <img className="p-1 w-20 h-20" src={helmetUrl} alt="Helmet placeholder" />
                            )}
                            {champArray && champArray[14] && champdata && champdata[champArray[14]] && champdata[champArray[14]]['champ_sq'] ? (
                                <img className={`p-1 w-20 h-20 filter saturate-50 ${(gamePhase === 'PLAYING' && slotIndex === 14) ? 'animate-pulse' : ''}`} alt={champdata[champArray[14]]['name']}
                                    src={champdata[champArray[14]]['champ_sq']} />
                            ) : (
                                <img className="p-1 w-20 h-20" src={helmetUrl} alt="Helmet placeholder" />
                            )}

                        </div>

                        {champArray && champArray[16] && champdata && champdata[champArray[16]] && champdata[champArray[16]]['champ_sq'] ? (
                            <img className={`p-1 w-28 h-28 ${(gamePhase === 'PLAYING' && slotIndex === 16) ? 'animate-pulse' : ''}`} alt={champdata[champArray[16]]['name']}
                                src={champdata[champArray[16]]['champ_sq']} />
                        ) : (
                            <img className="p-1 w-28 h-28" src={helmetUrl} alt="Helmet placeholder" />
                        )}
                        {champArray && champArray[19] && champdata && champdata[champArray[19]] && champdata[champArray[19]]['champ_sq'] ? (
                            <img className={`p-1 w-28 h-28 ${(gamePhase === 'PLAYING' && slotIndex === 19) ? 'animate-pulse' : ''}`} alt={champdata[champArray[19]]['name']}
                                src={champdata[champArray[19]]['champ_sq']} />
                        ) : (
                            <img className="p-1 w-28 h-28" src={helmetUrl} alt="Helmet placeholder" />
                        )}

                    </div>
                </div>

                {/* DRAFT FOOTER :
                 BOX 1 : BUTTON TO VALIDATE THE CURRENT ACTION
                */}

                <div className="p-2 w-full m-auto flex flex-row flex-nowrap items-center justify-between">
                    <div onClick={volumeOnOff}>{(volume === 0) ? (
                        <svg className="h-10 w-20 text-white "
                            viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                            <line x1="23" y1="9" x2="17" y2="15" />  <line x1="17" y1="9" x2="23" y2="15" />
                        </svg>
                    ) : (
                        <svg className="h-10 w-20 text-white"
                            viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                        </svg>
                    )}
                    </div>
                    <div className="">
                        <Button className={`w-24 h-12 p-2 mt-10 mb-10 text-lg border-4 text-slate-900 rounded hover:bg-amber-300 hover:border-amber-300
                            ${(ready === true && gamePhase === 'WAITING') ? 'bg-amber-300  border-amber-300 ' : 'bg-amber-500  border-amber-500 '}`}
                            onClick={handleValidate}> {confirmButton} </Button>
                    </div>
                    <div className="flex justify-center items-center w-20">
                        <svg className="h-10 w-10 text-white"
                            fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <h1 className="ml-4 mb-1  text-white text-xl">{spectators}</h1>

                    </div>
                </div>
            </div>
        </main>
    )
}