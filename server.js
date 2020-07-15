const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const path = require('path');
const PORT = process.env.PORT || 3000;

const formatMessage = require('./utils/messages');
const { userJoin, getCUrrentUser, userLeave, getRoomUsers } = require('./utils/users')

const app = express();
const server = http.createServer(app)
const io = socketio(server);

const boatName = "Boat Name"

// set static folder
app.use(express.static(path.join(__dirname, 'public')))


// run when client connect
io.on('connect', socket => {

    socket.on('joinRoom', ({ username, room }) => {
        const user = userJoin(socket.id, username, room)

        socket.join(user.room);

        // welcome current user
        socket.emit('message', formatMessage(boatName, "welcome to chat app"));

        // bradcast when a user connect
        socket.broadcast.to(user.room).emit('message', formatMessage(boatName, `${user.username} has joined the chart`));

        // send user and room info
        io.to(user.room).emit("roomUsers", {
            room: user.room,
            users: getRoomUsers(user.room)
        })

    });

    // Listen for chat message
    socket.on("chatMessage", msg => {
        const user = getCUrrentUser(socket.id);
        io.to(user.room).emit('message', formatMessage(user.username, msg));
    });

    // Runs when user disconnect
    socket.on('disconnect', () => {
        let user = userLeave(socket.id);
        if (user) {
            io.to(user.room).emit('message', formatMessage(boatName, `${user.username} has left the chat `));

            // send user and room info
            io.to(user.room).emit("roomUsers", {
                room: user.room,
                users: getRoomUsers(user.room)
            })
        }


    });

})

server.listen(PORT, () => console.log(`Server start at port ${PORT}`));

