import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import dayjs from 'dayjs';

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());
const mongoClient = new MongoClient("mongodb://127.0.0.1:27017");

app.post("/participants", async (req, res) => {

    let nome = req.body.name;
    let cadastro = {
        name: nome,
        lastStatus: Date.now()
    }

    try {
        await mongoClient.connect();

        const uoldb = mongoClient.db("uol");
        const usuariosCollection = uoldb.collection("users");
        const mensagensCollection = uoldb.collection("mensagens");

        const nomeEmUso = await usuariosCollection.find({ name: nome }).toArray();

        if(nomeEmUso.length > 0){
            res.status(409).send("Este nome de usuário já está sendo utilizado");
            return;
        } else {
            const horaEntrada = dayjs().format("hh:mm:ss");
            const mensagemEntrou = {
                from: nome,
                to: "Todos",
                text: "entra na sala...",
                type: "status",
                time: horaEntrada
            }

            usuariosCollection.insertOne(cadastro);
            mensagensCollection.insertOne(mensagemEntrou);
            res.sendStatus(201);
            return;
        }
    }

    catch(error){
        res.sendStatus(500);
        mongoClient.close();
        return;
    }

});

app.get("/participants", async (req, res) => {

    try {
        await mongoClient.connect();

        const uoldb = mongoClient.db("uol");
        const usuariosCollection = uoldb.collection("users");

        const usuariosOnline = await usuariosCollection.find().toArray();

        res.status(201).send(usuariosOnline);

        return;
    }

    catch(error){
        res.sendStatus(500);
        mongoClient.close();
        return;
    }

});

app.post("/messages", async (req, res) => {

    try {
        await mongoClient.connect();

        const uoldb = mongoClient.db("uol");
        const mensagensCollection = uoldb.collection("mensagens");
        
        const { to, text, type } = req.body;
        const horaEnvio = dayjs().format("hh:mm:ss");
        const usuario = req.headers.user;

        const mensagemPost = {
            from: usuario,
            to: to,
            text: text,
            type: type,
            time: horaEnvio
        }

        mensagensCollection.insertOne(mensagemPost);
        res.status(201).send(mensagemPost);

        return;

    }

    catch(error){
        res.sendStatus(500);
        mongoClient.close();
        return;
    }

});

app.get("/messages", async (req, res) => {

    try {
        const limite = parseInt(req.query.limit);

        await mongoClient.connect();
        const uoldb = mongoClient.db("uol");
        const mensagensCollection = uoldb.collection("mensagens");
        const mensagensGet = await mensagensCollection.find().toArray();

        if(!limite){
            const mensagensRetornadas = mensagensGet.reverse();
            res.send(mensagensRetornadas).status(201);
            return;
        } else {
            const mensagensRetornadas = mensagensGet.reverse().splice(0, limite);
            res.send(mensagensRetornadas).status(201);
            return;
        }
    }

    catch(error){
        res.sendStatus(500);
        mongoClient.close();
        return;
    }

})


app.listen(5000);