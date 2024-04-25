import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import io, { Socket } from 'socket.io-client';
import { Champion, DraftPayload } from "@prodraft/common/src/type";


const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "ws://127.0.0.1:3001";
const PLAYER = 'stream'


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

function checkArrayBans(champArray: string[], champdata: { [key: string]: Champion }, index: number) {
    if (champArray && champArray[index] && champdata && champdata[champArray[index]] && champdata[champArray[index]]['champ_sq']) {
        return true
    } else {
        return false
    }
}



export default function StreamDraftPage() {
    // useState declarations :
    const [champdata, setChampdata] = useState<{ [key: string]: Champion }>({});
    const [champArray, setChampArray] = useState<string[]>(new Array(20).fill(''))
    const [slotIndex, setSlotIndex] = useState(0)
    const [timer, setTimer] = useState(60)
    const [gamePhase, setGamePhase] = useState<string>('WAITING')
    const [turn, setTurn] = useState<string>('')
    const [spectators, setSpectators] = useState(0)
    const [backgroundColor, setBackgroundColor] = useState<string>('bg-slate-800')

    // Other declarations
    const router = useRouter();
    const { ROOM_ID, blueName, redName } = router.query as { ROOM_ID: string; blueName: string; redName: string; }
    const socket = useSocket();
    const helmetUrl = "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-collections/global/default/icon-helmet.png"




    // INITIALIZE STEP 0 - champ grid + waiting room + not ready
    useEffect(() => {
        socket?.on('connect', () => {
            console.log("Socket connected")
            socket?.emit('draftpage', (data: { [key: string]: Champion }) => setChampdata(data))
            socket?.emit('new:room', ROOM_ID)
            socket?.emit('spectate:enter', ROOM_ID)


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

    socket?.on(`start:${ROOM_ID}`, () => {
        setGamePhase('PLAYING')
        setTurn('blue')
    })

    socket?.on(`click:blue:${ROOM_ID}`, (idx: number, currentChamp: string) => {
        const updtChampArray = [...champArray]
        updtChampArray[idx] = currentChamp
        setChampArray(updtChampArray)
    })
    socket?.on(`click:red:${ROOM_ID}`, (idx: number, currentChamp: string) => {
        const updtChampArray = [...champArray]
        updtChampArray[idx] = currentChamp
        setChampArray(updtChampArray)
    })


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

    useEffect(() => {
        if (gamePhase == 'PLAYING') {
            setTimer(60)
        } else if (gamePhase == 'OVER') {
            setTimer(0)
        }
    }, [gamePhase])
    // timer logc
    useEffect(() => {
        if (gamePhase == 'PLAYING') {
            const countdown = setTimeout(() => {
                if (timer > 0) {
                    setTimer(prevTimer => prevTimer - 1);
                }
            }, 1000);
            return () => clearTimeout(countdown)
        }
    }, [timer])

    // Reset timer on new idx (new pick/ban)
    useEffect(() => {
        if (gamePhase == 'PLAYING') {
            setTimer(60)
        }
    }, [slotIndex])

    // Redirect to the base page
    const bannerClick = async () => {
        await router.push(`/`)
    }

    const changeBgColor = () => {
        if (backgroundColor === 'bg-slate-800') {
            setBackgroundColor('bg-green')
        } else if (backgroundColor === 'bg-green') {
            setBackgroundColor('bg-slate-800')
        }
    }



    // Return the page view :
    return (
        <main className={` ${backgroundColor}`}>
            <div className="flex flex-col p-0 min-h-screen w-full min-w-[1080px] space-y-0 m-auto items-center justify-center">

                {/* HEADER  */}
                <div>
                    <img className="h-64 w-64 text-white" src="/next.svg" alt="" />
                </div>

                <div className="p-4 fixed top-0 left-0 waitopacity-50">
                    <button className="bg-transparent hover:bg-green text-green font-semibold hover:text-slate-800 py-2 px-4 border border-green hover:border-transparent rounded"
                        onClick={() => changeBgColor()}>
                        Background Color
                    </button>
                </div>


                {/*  DRAFT CONTAINER  */}

                <div className="w-[1080px] flex flex-col items-center">

                    {/*  Team names  */}

                    <div className="px-2 flex w-full justify-between ">
                        <div className="flex  bg-blue-400">
                            <div className={` text-white bg-blue-500 flex py-1 px-4 transition-width duration-500  ${turn === 'red' ? 'w-[250px]' : 'w-[484px]'}`}>
                                <h1 className="text-2xl overflow-hidden max-w-96">{blueName}</h1>
                            </div>
                        </div>

                        <div className="flex  bg-red-400">
                            <div className={` text-white bg-red-500 flex flex-row-reverse py-1 px-4 transition-width duration-500  ${turn === 'blue' ? 'w-[250px]' : 'w-[484px]'} `}>
                                <h1 className="text-2xl overflow-hidden">{redName}</h1>
                            </div>
                        </div>
                    </div>

                    {/*  Bans  */}

                    <div className="flex w-full justify-between">

                        {/*  Blue  */}

                        <div className="px-2 w-[500px] flex justify-end">
                            <div className="flex ">
                                {checkArrayBans(champArray, champdata, 0) ? (
                                    <img className={`w-14 h-14 filter saturate-50 ${(gamePhase === 'PLAYING' && slotIndex === 0) ? 'animate-pulse' : ''}`} alt={champdata[champArray[0]]['name']}
                                        src={champdata[champArray[0]]['champ_sq']} />
                                ) : (
                                    <svg className={`h-14 w-14 text-slate-400 bg-slate-800 border border-slate-700 ${(gamePhase === 'PLAYING' && slotIndex === 0) ? 'border border-slate-300' : ''}`}
                                        width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none"
                                        strokeLinecap="round" strokeLinejoin="round">
                                        <path stroke="none" d="M0 0h24v24H0z" />
                                        <circle cx="12" cy="12" r="9" />  <line x1="5.7" y1="5.7" x2="18.3" y2="18.3" />
                                    </svg>
                                )}
                                {checkArrayBans(champArray, champdata, 2) ? (
                                    <img className={`w-14 h-14 filter saturate-50 ${(gamePhase === 'PLAYING' && slotIndex === 2) ? 'animate-pulse' : ''}`} alt={champdata[champArray[2]]['name']}
                                        src={champdata[champArray[2]]['champ_sq']} />
                                ) : (
                                    <svg className={`h-14 w-14 text-slate-400 bg-slate-800 border border-slate-700 ${(gamePhase === 'PLAYING' && slotIndex === 2) ? 'border border-slate-300' : ''}`}
                                        width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none"
                                        strokeLinecap="round" strokeLinejoin="round">
                                        <path stroke="none" d="M0 0h24v24H0z" />
                                        <circle cx="12" cy="12" r="9" />  <line x1="5.7" y1="5.7" x2="18.3" y2="18.3" />
                                    </svg>
                                )}
                                {checkArrayBans(champArray, champdata, 4) ? (
                                    <img className={`w-14 h-14 filter saturate-50 ${(gamePhase === 'PLAYING' && slotIndex === 4) ? 'animate-pulse' : ''}`} alt={champdata[champArray[4]]['name']}
                                        src={champdata[champArray[4]]['champ_sq']} />
                                ) : (
                                    <svg className={`h-14 w-14 text-slate-400 bg-slate-800 border border-slate-700 ${(gamePhase === 'PLAYING' && slotIndex === 4) ? 'border border-slate-300' : ''}`}
                                        width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none"
                                        strokeLinecap="round" strokeLinejoin="round">
                                        <path stroke="none" d="M0 0h24v24H0z" />
                                        <circle cx="12" cy="12" r="9" />  <line x1="5.7" y1="5.7" x2="18.3" y2="18.3" />
                                    </svg>
                                )}
                            </div>
                            <div className="ml-12 flex">
                                {checkArrayBans(champArray, champdata, 13) ? (
                                    <img className={`w-14 h-14 filter saturate-50 ${(gamePhase === 'PLAYING' && slotIndex === 13) ? 'animate-pulse' : ''}`} alt={champdata[champArray[13]]['name']}
                                        src={champdata[champArray[13]]['champ_sq']} />
                                ) : (
                                    <svg className={`h-14 w-14 text-slate-400 bg-slate-800 border border-slate-700 ${(gamePhase === 'PLAYING' && slotIndex === 13) ? 'border border-slate-300' : ''}`}
                                        width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none"
                                        strokeLinecap="round" strokeLinejoin="round">
                                        <path stroke="none" d="M0 0h24v24H0z" />
                                        <circle cx="12" cy="12" r="9" />  <line x1="5.7" y1="5.7" x2="18.3" y2="18.3" />
                                    </svg>
                                )}
                                {checkArrayBans(champArray, champdata, 15) ? (
                                    <img className={`w-14 h-14 filter saturate-50 ${(gamePhase === 'PLAYING' && slotIndex === 15) ? 'animate-pulse' : ''}`} alt={champdata[champArray[15]]['name']}
                                        src={champdata[champArray[15]]['champ_sq']} />
                                ) : (
                                    <svg className={`h-14 w-14 text-slate-400 bg-slate-800 border border-slate-700 ${(gamePhase === 'PLAYING' && slotIndex === 15) ? 'border border-slate-300' : ''}`}
                                        width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none"
                                        strokeLinecap="round" strokeLinejoin="round">
                                        <path stroke="none" d="M0 0h24v24H0z" />
                                        <circle cx="12" cy="12" r="9" />  <line x1="5.7" y1="5.7" x2="18.3" y2="18.3" />
                                    </svg>
                                )}
                            </div>
                        </div>

                        {/*  Red  */}

                        <div className="px-2 flex w-[500px]">
                            <div className="flex">
                                {checkArrayBans(champArray, champdata, 1) ? (
                                    <img className={`w-14 h-14 filter saturate-50 ${(gamePhase === 'PLAYING' && slotIndex === 1) ? 'animate-pulse' : ''}`} alt={champdata[champArray[1]]['name']}
                                        src={champdata[champArray[1]]['champ_sq']} />
                                ) : (
                                    <svg className={`h-14 w-14 text-slate-400 bg-slate-800 border border-slate-700 ${(gamePhase === 'PLAYING' && slotIndex === 1) ? 'border border-slate-300' : ''}`}
                                        width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none"
                                        strokeLinecap="round" strokeLinejoin="round">
                                        <path stroke="none" d="M0 0h24v24H0z" />
                                        <circle cx="12" cy="12" r="9" />  <line x1="5.7" y1="5.7" x2="18.3" y2="18.3" />
                                    </svg>
                                )}
                                {checkArrayBans(champArray, champdata, 3) ? (
                                    <img className={`w-14 h-14 filter saturate-50 ${(gamePhase === 'PLAYING' && slotIndex === 3) ? 'animate-pulse' : ''}`} alt={champdata[champArray[3]]['name']}
                                        src={champdata[champArray[3]]['champ_sq']} />
                                ) : (
                                    <svg className={`h-14 w-14 text-slate-400 bg-slate-800 border border-slate-700 ${(gamePhase === 'PLAYING' && slotIndex === 3) ? 'border border-slate-300' : ''}`}
                                        width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none"
                                        strokeLinecap="round" strokeLinejoin="round">
                                        <path stroke="none" d="M0 0h24v24H0z" />
                                        <circle cx="12" cy="12" r="9" />  <line x1="5.7" y1="5.7" x2="18.3" y2="18.3" />
                                    </svg>
                                )}
                                {checkArrayBans(champArray, champdata, 5) ? (
                                    <img className={`w-14 h-14 filter saturate-50 ${(gamePhase === 'PLAYING' && slotIndex === 5) ? 'animate-pulse' : ''}`} alt={champdata[champArray[5]]['name']}
                                        src={champdata[champArray[5]]['champ_sq']} />
                                ) : (
                                    <svg className={`h-14 w-14 text-slate-400 bg-slate-800 border border-slate-700 ${(gamePhase === 'PLAYING' && slotIndex === 5) ? 'border border-slate-300' : ''}`}
                                        width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none"
                                        strokeLinecap="round" strokeLinejoin="round">
                                        <path stroke="none" d="M0 0h24v24H0z" />
                                        <circle cx="12" cy="12" r="9" />  <line x1="5.7" y1="5.7" x2="18.3" y2="18.3" />
                                    </svg>
                                )}
                            </div>
                            <div className="ml-12 flex">
                                {checkArrayBans(champArray, champdata, 12) ? (
                                    <img className={`w-14 h-14 filter saturate-50 ${(gamePhase === 'PLAYING' && slotIndex === 12) ? 'animate-pulse' : ''}`} alt={champdata[champArray[12]]['name']}
                                        src={champdata[champArray[12]]['champ_sq']} />
                                ) : (
                                    <svg className={`h-14 w-14 text-slate-400 bg-slate-800 border border-slate-700 ${(gamePhase === 'PLAYING' && slotIndex === 12) ? 'border border-slate-300' : ''}`}
                                        width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none"
                                        strokeLinecap="round" strokeLinejoin="round">
                                        <path stroke="none" d="M0 0h24v24H0z" />
                                        <circle cx="12" cy="12" r="9" />  <line x1="5.7" y1="5.7" x2="18.3" y2="18.3" />
                                    </svg>
                                )}
                                {checkArrayBans(champArray, champdata, 14) ? (
                                    <img className={`w-14 h-14 filter saturate-50 ${(gamePhase === 'PLAYING' && slotIndex === 14) ? 'animate-pulse' : ''}`} alt={champdata[champArray[14]]['name']}
                                        src={champdata[champArray[14]]['champ_sq']} />
                                ) : (
                                    <svg className={`h-14 w-14 text-slate-400 bg-slate-800 border border-slate-700 ${(gamePhase === 'PLAYING' && slotIndex === 14) ? 'border border-slate-300' : ''}`}
                                        width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none"
                                        strokeLinecap="round" strokeLinejoin="round">
                                        <path stroke="none" d="M0 0h24v24H0z" />
                                        <circle cx="12" cy="12" r="9" />  <line x1="5.7" y1="5.7" x2="18.3" y2="18.3" />
                                    </svg>
                                )}
                            </div>
                        </div>
                    </div>


                    {/*  Picks */}

                    <div className="flex w-full  justify-between">

                        {/*  Blue  */}

                        <div className="px-2 flex justify-end  w-[500px]">
                            {champArray && champArray[6] && champdata && champdata[champArray[6]] && champdata[champArray[6]]['champ_sq'] ? (
                                <img className={`w-26 h-26 ${(gamePhase === 'PLAYING' && slotIndex === 6) ? 'animate-pulse' : ''}`} alt={champdata[champArray[6]]['name']}
                                    src={champdata[champArray[6]]['champ_sq']} />
                            ) : (
                                <svg className="h-48 w-24 text-slate-400 bg-slate-800 border border-slate-700"
                                    fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1"
                                        d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            )}
                            {champArray && champArray[9] && champdata && champdata[champArray[9]] && champdata[champArray[9]]['champ_sq'] ? (
                                <img className={`w-26 h-26 ${(gamePhase === 'PLAYING' && slotIndex === 9) ? 'animate-pulse' : ''}`} alt={champdata[champArray[9]]['name']}
                                    src={champdata[champArray[9]]['champ_sq']} />
                            ) : (
                                <svg className="h-48 w-24 text-slate-400 bg-slate-800 border border-slate-700"
                                    fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1"
                                        d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            )}
                            {champArray && champArray[10] && champdata && champdata[champArray[10]] && champdata[champArray[10]]['champ_sq'] ? (
                                <img className={`w-26 h-26 ${(gamePhase === 'PLAYING' && slotIndex === 10) ? 'animate-pulse' : ''}`} alt={champdata[champArray[10]]['name']}
                                    src={champdata[champArray[10]]['champ_sq']} />
                            ) : (
                                <svg className="h-48 w-24 text-slate-400 bg-slate-800 border border-slate-700"
                                    fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1"
                                        d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            )}
                            {champArray && champArray[17] && champdata && champdata[champArray[17]] && champdata[champArray[17]]['champ_sq'] ? (
                                <img className={`w-26 h-26 ${(gamePhase === 'PLAYING' && slotIndex === 17) ? 'animate-pulse' : ''}`} alt={champdata[champArray[17]]['name']}
                                    src={champdata[champArray[17]]['champ_sq']} />
                            ) : (
                                <svg className="h-48 w-24 text-slate-400 bg-slate-800 border border-slate-700"
                                    fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1"
                                        d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            )}
                            {champArray && champArray[18] && champdata && champdata[champArray[18]] && champdata[champArray[18]]['champ_sq'] ? (
                                <img className={`w-26 h-26 ${(gamePhase === 'PLAYING' && slotIndex === 18) ? 'animate-pulse' : ''}`} alt={champdata[champArray[18]]['name']}
                                    src={champdata[champArray[18]]['champ_sq']} />
                            ) : (
                                <svg className="h-48 w-24 text-slate-400 bg-slate-800 border border-slate-700"
                                    fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1"
                                        d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            )}
                        </div>

                        {/*  Red  */}

                        <div className="px-2 flex  w-[500px]">
                            {champArray && champArray[7] && champdata && champdata[champArray[7]] && champdata[champArray[7]]['champ_sq'] ? (
                                <img className={`w-26 h-26 ${(gamePhase === 'PLAYING' && slotIndex === 7) ? 'animate-pulse' : ''}`} alt={champdata[champArray[7]]['name']}
                                    src={champdata[champArray[7]]['champ_sq']} />
                            ) : (

                                <svg className="h-48 w-24 text-slate-400 bg-slate-800 border border-slate-700"
                                    fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1"
                                        d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            )}
                            {champArray && champArray[8] && champdata && champdata[champArray[8]] && champdata[champArray[8]]['champ_sq'] ? (
                                <img className={`w-26 h-26 ${(gamePhase === 'PLAYING' && slotIndex === 8) ? 'animate-pulse' : ''}`} alt={champdata[champArray[8]]['name']}
                                    src={champdata[champArray[8]]['champ_sq']} />
                            ) : (

                                <svg className="h-48 w-24 text-slate-400 bg-slate-800 border border-slate-700"
                                    fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1"
                                        d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            )}
                            {champArray && champArray[11] && champdata && champdata[champArray[11]] && champdata[champArray[11]]['champ_sq'] ? (
                                <img className={`w-26 h-26 ${(gamePhase === 'PLAYING' && slotIndex === 11) ? 'animate-pulse' : ''}`} alt={champdata[champArray[11]]['name']}
                                    src={champdata[champArray[11]]['champ_sq']} />
                            ) : (

                                <svg className="h-48 w-24 text-slate-400 bg-slate-800 border border-slate-700"
                                    fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1"
                                        d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            )}
                            {champArray && champArray[16] && champdata && champdata[champArray[16]] && champdata[champArray[16]]['champ_sq'] ? (
                                <img className={`w-26 h-26 ${(gamePhase === 'PLAYING' && slotIndex === 16) ? 'animate-pulse' : ''}`} alt={champdata[champArray[16]]['name']}
                                    src={champdata[champArray[16]]['champ_sq']} />
                            ) : (

                                <svg className="h-48 w-24 text-slate-400 bg-slate-800 border border-slate-700"
                                    fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1"
                                        d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            )}
                            {champArray && champArray[19] && champdata && champdata[champArray[19]] && champdata[champArray[19]]['champ_sq'] ? (
                                <img className={`w-26 h-26 ${(gamePhase === 'PLAYING' && slotIndex === 19) ? 'animate-pulse' : ''}`} alt={champdata[champArray[19]]['name']}
                                    src={champdata[champArray[19]]['champ_sq']} />
                            ) : (

                                <svg className="h-48 w-24 text-slate-400 bg-slate-800 border border-slate-700"
                                    fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1"
                                        d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            )}
                        </div>

                    </div>





                    {/* FOOTER */}


                </div>
            </div>
        </main>
    )
}