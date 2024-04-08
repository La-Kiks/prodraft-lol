import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/router";
import { FormEvent, useEffect, useState } from "react";
import io, { Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "ws://127.0.0.1:3001";

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
  let roomId = ''


  useEffect(() => {
    socket?.on('connect', () => {
      console.log("socket connected")
    })

    socket?.on('roomId', id => {
      roomId = id
      console.log(roomId)
    })

  });


  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    router.push({
      pathname: '/draftlinks',
      query: { roomId, blueName, redName }

    })
  }

  return (
    <main className="flex flex-col p-4 h-screen w-full max-w-3xl m-auto bg-slate-700">
      <div className="p-2 mt-28 mb-64 flex content-start justify-center text-8xl text-white hover:text-slate-300">
        <h1>Prodraft.lol</h1>
      </div>
      <form onSubmit={handleSubmit} className="flex justify-center">
        <div className="flex flex-col items-center p-2">
          <input value={blueName}
            onChange={(e) => setBlueName(e.target.value)}
            className="p-1 m-1 bg-transparent border border-blue-500 w-full text-white mr-3 py-1 px-2  focus:outline-none focus:ring focus:ring-blue-500"
            type="text"
            placeholder="Blue team name"
            aria-label="Blue Team Name">
          </input>
          <input value={redName}
            onChange={(e) => setRedName(e.target.value)}
            className="p-1 m-1 bg-transparent border border-red-500 w-full text-white mr-3 py-1 px-2  focus:outline-none focus:ring focus:ring-red-500"
            type="text"
            placeholder="Red team name"
            aria-label="Red Team Name">
          </input>
          <Button className="flex-shrink-0 bg-amber-500 hover:bg-amber-300 border-amber-500 hover:border-amber-300  border-4 text-slate-900 text-base p-2 m-1 rounded">
            Create draft
          </Button>
        </div>
      </form>
    </main>
  )
}