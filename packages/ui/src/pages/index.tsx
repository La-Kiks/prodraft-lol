import { Button } from "@/components/ui/button";
import { useRouter } from "next/router";
import { FormEvent, useEffect, useState } from "react";
import io, { Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "ws://127.0.0.1:8000";
let ROOM_ID = ''


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


export default function Home() {
  const [blueName, setBlueName] = useState('')
  const [redName, setRedName] = useState('');

  const router = useRouter();
  const socket = useSocket();

  // Happens on socket connection (& socket change)
  useEffect(() => {
    socket?.on('connect', () => {
      socket?.emit('join server')
      console.log("socket connected")
    })

    socket?.on('roomId', id => {
      ROOM_ID = id
      console.log(ROOM_ID) // Can delete later
    })

  }, [socket]);


  // Submit to the draftlinks page with names & id
  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const updatedBlueName = blueName.trim() === '' ? 'Blue' : blueName;
    const updatedRedName = redName.trim() === '' ? 'Red' : redName;

    if (!ROOM_ID.trim()) {
      // Redirect to error page if roomId is empty
      router.push('/error');
      return;
    }

    router.push({
      pathname: '/draftlinks',
      query: { ROOM_ID, blueName: updatedBlueName, redName: updatedRedName }

    })
  }

  return (
    <main className="flex flex-col p-4 h-screen w-full items-center  m-auto bg-slate-800">
      <div className="p-2 md:mt-28 md:mb-64 md:text-8xl mt-14 mb-14 text-5xl flex content-start justify-center  text-white hover:text-slate-300">
        <h1>Prodraft.lol</h1>
      </div>
      <form onSubmit={handleSubmit} className="flex ">
        <div className="flex flex-col items-center p-2 m-2 ">
          <input value={blueName}
            onChange={(e) => setBlueName(e.target.value)}
            className="p-2 m-2 bg-transparent border border-blue-500 w-full text-white mr-3 py-1 px-2  focus:outline-none focus:ring focus:ring-blue-500"
            type="text"
            placeholder="Enter blue team name"
            aria-label="Blue Team Name"
            maxLength={16}>
          </input>
          <input value={redName}
            onChange={(e) => setRedName(e.target.value)}
            className="p-2 m-2 bg-transparent border border-red-500 w-full text-white mr-3 py-1 px-2  focus:outline-none focus:ring focus:ring-red-500"
            type="text"
            placeholder="Enter red team name"
            aria-label="Red Team Name"
            maxLength={16}>
          </input>
          <Button className="flex-shrink-0 p-2 m-2 bg-amber-500 hover:bg-amber-300 border-amber-500 hover:border-amber-300  border-4 text-slate-900 text-base rounded">
            Create draft
          </Button>
        </div>
      </form>
    </main>
  )
}