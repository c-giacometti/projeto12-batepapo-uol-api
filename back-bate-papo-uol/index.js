import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());
const mongoClient = new MongoClient("mongodb://127.0.0.1:27017");
let db;

mongoClient.connect().then(() => {
    db = mongoClient.db("data_base");
})

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

        const nomeEmUso = await usuariosCollection.find({ name: nome }).toArray();

        if(nomeEmUso.length > 0){
            res.status(409).send("Este nome de usuário já está sendo utilizado");
            mongoClient.close();
            return;
        } else {
            usuariosCollection.insertOne(cadastro);
            res.status(201).send(cadastro);
        }
    }

    catch(error){
        res.sendStatus(500);
        mongoClient.close();
        return;
    }
})

app.listen(5000);