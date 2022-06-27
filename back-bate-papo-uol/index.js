import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import dayjs from 'dayjs';
import joi from 'joi';

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());
const mongoClient = new MongoClient("mongodb://127.0.0.1:27017");

const QUINZE_SEGUNDOS = 15*1000;
const DEZ_SEGUNDOS = 10;

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
        const usuario = req.headers.user;
        const horaEnvio = dayjs().format("hh:mm:ss");

        const mensagemPost = {
            from: usuario,
            to: to,
            text: text,
            type: type,
            time: horaEnvio
        }

        mensagensCollection.insertOne(mensagemPost);
        res.sendStatus(201);

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
        const usuario = req.headers.user;

        await mongoClient.connect();
        const uoldb = mongoClient.db("uol");
        const mensagensCollection = uoldb.collection("mensagens");
        const mensagensGet = await mensagensCollection.find().toArray();

        const mensagensVisiveis = mensagensGet.filter(usuarioPodeVer);

        if(!limite || limite >= mensagensVisiveis.length){
            res.send(mensagensVisiveis).status(201); 
            return;
        } else {
            const mensagensComLimite = mensagensVisiveis.splice(0, limite);
            res.send(mensagensComLimite).status(201); 
            return;
        }

        function usuarioPodeVer(item){
            return item.from === usuario || item.to === "Todos" || item.to === usuario;
        }
    }

    catch(error){
        res.sendStatus(500);
        mongoClient.close();
        return;
    }

});

app.post("/status", async (req, res) => {

    try {
        await mongoClient.connect();

        const uoldb = mongoClient.db("uol");
        const usuariosCollection = uoldb.collection("users");

        const usuario = req.headers.user;

        const usuarioCadastrado = await usuariosCollection.findOne({ name: usuario });

        if(usuarioCadastrado){
            await usuariosCollection.updateOne(
                { lastStatus: usuarioCadastrado.lastStatus }, 
                { $set: {lastStatus: Date.now()} }
            );
            res.sendStatus(200);
            return;
        } else {
            res.sendStatus(404);
            return;
        }

    }

    catch(error){
        res.sendStatus(500);
        mongoClient.close();
        return;
    }

});

/* async function removerParticipantes(){
    await mongoClient.connect();

    const uoldb = mongoClient.db("uol");
    const usuariosCollection = uoldb.collection("users");
    const mensagensCollection = uoldb.collection("mensagens");

    const participantesAtivos = await usuariosCollection.find({}).toArray();

    participantesAtivos.forEach((item) => {
        const tempoInativo = Date.now() - item.lastStatus;

        if(tempoInativo > DEZ_SEGUNDOS) {

            const horaSaida = dayjs().format("hh:mm:ss");

            mensagensCollection.insertOne({
                from: item.name,
                to: "Todos",
                text: "sai da sala...",
                type: "status",
                time: horaSaida
            });

            usuariosCollection.deleteOne({ name: item.name });
        }
        
    });
}

setInterval(removerParticipantes, QUINZE_SEGUNDOS); */

app.listen(5000);