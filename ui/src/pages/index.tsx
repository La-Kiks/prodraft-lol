import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FormEvent, useEffect, useState } from "react";
import io, { Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "ws://127.0.0.1:3001";
console.log(SOCKET_URL)

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

  const socket = useSocket();


  useEffect(() => {
    socket?.on('connect', () => {
      console.log("socket connected")
    })
    socket?.on('socketId', () => {
      console.log(socket.id)
    })
    socket?.emit('hello', () => {
    })
  });

  const [newMessage, setNewMessage] = useState('')
  const [messages, setMessages] = useState([])
  function handleSubmit(e: FormEvent) {
    e.preventDefault()


    setNewMessage('')

  }

  return <main className="flex flex-col p-4 w-full max-w-3xl m-auto">
    <form onSubmit={handleSubmit} className="flex items-center">

      < Textarea
        className="rounded-lg mr-4"
        placeholder="What's on your mind ?"
        value={newMessage}
        onChange={(e) => setNewMessage(e.target.value)}
        maxLength={255}
      />

      <Button className="h-full">Send message</Button>


    </form>
  </main>;
}